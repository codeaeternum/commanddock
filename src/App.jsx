import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { T, sty } from "./theme";
import { VAR_SCHEMA } from "./data/variables";
import { CMD_REG, TAILSCALE_GROUP, SYS_CMDS } from "./data/commands";
import { getTranslations, LANGUAGES } from "./data/locales";
import { useConfig } from "./hooks/useConfig";
import { useProjectDetection } from "./hooks/useProjectDetection";
import { useCommandExecution } from "./hooks/useCommandExecution";
import { Toast } from "./components/Toast";
import { CommandPalette } from "./components/CommandPalette";
import { ConfigPanel } from "./components/ConfigPanel";
import { CommandCard } from "./components/CommandCard";
import { CommandGroup } from "./components/CommandGroup";
import { Terminal } from "./components/Terminal";
import { HistoryPanel } from "./components/HistoryPanel";
import { CustomCommands } from "./components/CustomCommands";
import { SetupWizard } from "./components/SetupWizard";
import { ProjectPicker } from "./components/ProjectPicker";
import { FeedbackModal } from "./components/FeedbackModal";
import { isElectron } from "./utils/env";

export default function CommandDock() {
    // ── Toasts ──────────────────────────────────────
    const [toasts, setToasts] = useState([]);
    const toastIdRef = useRef(0);
    const toast = useCallback((msg, type = "info") => {
        const id = ++toastIdRef.current;
        setToasts(p => [...p, { id, message: msg, type }]);
        setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3000);
    }, []);
    const dismissToast = useCallback(id => setToasts(p => p.filter(t => t.id !== id)), []);

    // ── Config (persisted via IPC) ──────────────────
    const {
        config, globalVars, loading, saveConfig,
        setGlobalVars, getResolvedVars, setProjectVars, addRecentProject,
    } = useConfig();

    // ── i18n ────────────────────────────────────────
    const [lang, setLang] = useState(config?.ui?.lang || 'es');
    const t = useMemo(() => getTranslations(lang), [lang]);
    const changeLang = useCallback((newLang) => {
        setLang(newLang);
        saveConfig({ ui: { ...(config?.ui || {}), lang: newLang } });
    }, [saveConfig, config?.ui]);
    const [activeProject, setActiveProject] = useState(null); // { path, name }

    // Check for CLI launch arg
    useEffect(() => {
        if (!isElectron) return;
        window.commanddock.getLaunchArgs().then(({ projectPath }) => {
            if (projectPath) {
                const name = projectPath.split(/[\\/]/).pop();
                setActiveProject({ path: projectPath, name });
            }
        }).catch(() => { });
    }, []);

    // Resolved vars for active project (global merged with project overrides)
    const vars = useMemo(() => {
        if (!activeProject) return globalVars;
        return getResolvedVars(activeProject.path);
    }, [activeProject, globalVars, getResolvedVars]);

    // ── Project detection ───────────────────────────
    const { os, setOs, context, scanning, scanDirectory } = useProjectDetection(toast);

    // When project changes, scan its directory
    useEffect(() => {
        if (activeProject?.path) {
            scanDirectory(activeProject.path);
            addRecentProject(activeProject.path);
        }
    }, [activeProject?.path]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Persisted state from config ─────────────────
    const [favs, setFavs] = useState(new Set());
    const [history, setHistory] = useState([]);
    const [custom, setCustom] = useState([]);

    // Load persisted data when config first arrives or active project changes
    useEffect(() => {
        if (!config) return;
        const globalFavs = config.global?.favorites || [];
        const projectFavs = activeProject ? (config.projects?.[activeProject.path]?.favorites || []) : [];
        setFavs(new Set([...globalFavs, ...projectFavs]));
        if (config.history?.length) setHistory(config.history);
        const globalCmds = config.global?.customCommands || [];
        const projectCmds = activeProject ? (config.projects?.[activeProject.path]?.customCommands || []) : [];
        setCustom([...globalCmds, ...projectCmds]);
    }, [config?.setupDone, activeProject?.path]); // re-sync after wizard or project change

    // Persist favorites (race-safe via saveConfig which reads latest ref)
    const toggleFav = useCallback(cmd => {
        setFavs(p => {
            const n = new Set(p);
            n.has(cmd) ? n.delete(cmd) : n.add(cmd);
            return n;
        });
        // Defer persist to avoid stale closure
        setTimeout(() => {
            setFavs(current => {
                const favArray = [...current];
                saveConfig({ global: { ...(config?.global || {}), favorites: favArray } });
                return current;
            });
        }, 0);
    }, [saveConfig, config?.global]);

    // Persist history (race-safe)
    const addHistory = useCallback((entry) => {
        setHistory(p => {
            const next = [entry, ...p].slice(0, 50);
            saveConfig({ history: next });
            return next;
        });
    }, [saveConfig]);

    // Persist custom commands (race-safe)
    const updateCustom = useCallback((updater) => {
        setCustom(p => {
            const next = typeof updater === "function" ? updater(p) : updater;
            saveConfig({ global: { ...(config?.global || {}), customCommands: next } });
            return next;
        });
    }, [saveConfig, config?.global]);

    // ── UI state ────────────────────────────────────
    const [showPalette, setShowPalette] = useState(false);
    const [showConfig, setShowConfig] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [configMissing, setConfigMissing] = useState(null);
    const [collapsed, setCollapsed] = useState({});
    const [dryRun, setDryRun] = useState(false);
    const [search, setSearch] = useState("");
    const [showFeedback, setShowFeedback] = useState(false);

    // ── Command execution hook ──────────────────────
    const {
        terminal, showTerm, setShowTerm, confirm, setConfirm, inputs, setInputs, termRef,
        resolveVars, getMissingVars, resolveInput, executeCommand, copyCmd, clearTerminal,
    } = useCommandExecution({ vars, os, path: activeProject?.path || '', dryRun, toast, t });

    // ── Derived data ────────────────────────────────
    const detectedFiles = context?.detected || [];

    const commandGroups = useMemo(() => {
        const g = detectedFiles.filter(f => CMD_REG[f]).map(f => ({ ...CMD_REG[f] }));
        // Show Tailscale/SSH when SSH vars are configured (any OS)
        if (vars.ssh_user || vars.ssh_host) g.push({ ...TAILSCALE_GROUP });
        const sys = SYS_CMDS[os];
        if (sys) g.push({ ...sys });
        return g;
    }, [detectedFiles, os, vars.ssh_user, vars.ssh_host]);

    const allCommands = useMemo(() =>
        commandGroups.flatMap(g => g.commands.map(c => ({
            ...c, category: g.category, groupColor: g.color, groupIcon: g.icon,
            missingVars: getMissingVars(c),
        }))), [commandGroups, getMissingVars]);

    const favoriteCommands = useMemo(() => allCommands.filter(c => favs.has(c.cmd)), [allCommands, favs]);

    // Quick actions: top 4 most-used commands from history
    const quickActions = useMemo(() => {
        if (!history.length) return [];
        const counts = {};
        history.forEach(h => { counts[h.cmd] = (counts[h.cmd] || 0) + 1; });
        const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 4);
        return sorted.map(([cmd, count]) => {
            const found = allCommands.find(c => resolveVars(c.cmd) === cmd);
            return { cmd, count, label: found?.label || cmd.split(' ').slice(0, 3).join(' '), cmdObj: found };
        });
    }, [history, allCommands, resolveVars]);

    const filteredGroups = useMemo(() => {
        if (!search) return commandGroups;
        const l = search.toLowerCase();
        return commandGroups.map(g => ({ ...g, commands: g.commands.filter(c => c.label.toLowerCase().includes(l) || c.cmd.toLowerCase().includes(l) || c.desc.toLowerCase().includes(l)) })).filter(g => g.commands.length > 0);
    }, [commandGroups, search]);

    const unconfiguredCount = useMemo(() => {
        const count = {};
        commandGroups.forEach(g => {
            let n = 0;
            g.commands.forEach(c => { if (c.vars) n += c.vars.filter(v => !vars[v]).length; });
            if (n > 0) count[g.category] = n;
        });
        return count;
    }, [commandGroups, vars]);

    const mod = os === "mac" ? "⌘" : "Ctrl+";

    // ── Keyboard shortcuts ──────────────────────────
    useEffect(() => {
        const h = e => {
            if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setShowPalette(p => !p); }
            if (e.key === "Escape") { setShowPalette(false); setConfirm(null); setShowHistory(false); setShowConfig(false); }
            if ((e.metaKey || e.ctrlKey) && e.key === "j") { e.preventDefault(); setShowTerm(p => !p); }
            if ((e.metaKey || e.ctrlKey) && e.key === "h") { e.preventDefault(); setShowHistory(p => !p); }
            // Ctrl+1..9 → execute favorite
            if ((e.metaKey || e.ctrlKey) && e.key >= "1" && e.key <= "9" && !e.shiftKey && !e.altKey) {
                const idx = parseInt(e.key) - 1;
                if (idx < favoriteCommands.length) {
                    e.preventDefault();
                    const c = favoriteCommands[idx];
                    execWithHistory(c.cmd, c.danger, c);
                }
            }
        };
        window.addEventListener("keydown", h);
        return () => window.removeEventListener("keydown", h);
    }, [setConfirm, setShowTerm, favoriteCommands]); // eslint-disable-line react-hooks/exhaustive-deps

    // Auto-scroll terminal
    useEffect(() => { if (termRef.current) termRef.current.scrollTop = termRef.current.scrollHeight; }, [terminal, termRef]);

    // ── Execution wrappers ──────────────────────────
    const execWithHistory = useCallback((cmd, danger, cmdObj) => {
        executeCommand(cmd, danger, cmdObj, {
            onHistory: addHistory,
            onOpenConfig: (missing) => { setConfigMissing(missing); setShowConfig(true); },
        });
    }, [executeCommand, addHistory]);

    const toggleCollapse = useCallback(cat => setCollapsed(p => ({ ...p, [cat]: !p[cat] })), []);

    // ── Var setters (context dependent) ─────────────
    const handleSetVars = useCallback((updater) => {
        if (activeProject) {
            setProjectVars(activeProject.path, updater);
        } else {
            setGlobalVars(updater);
        }
    }, [activeProject, setProjectVars, setGlobalVars]);

    // ── Quick project actions ───────────────────────
    const openInEditor = useCallback(() => {
        if (activeProject?.path && vars.editor) {
            const cmd = `${vars.editor} "${activeProject.path}"`;
            if (isElectron) window.commanddock.execCmd(cmd).catch(() => { });
            toast(`Abriendo en ${vars.editor}...`, 'info');
        }
    }, [activeProject, vars.editor, toast]);

    const openInTerminal = useCallback(() => {
        if (activeProject?.path && isElectron) {
            const isWin = os !== 'mac';
            const cmd = isWin
                ? `start powershell -NoExit -Command "cd '${activeProject.path}'"`
                : `open -a Terminal "${activeProject.path}"`;
            window.commanddock.execCmd(cmd).catch(() => { });
            toast(t.panel_open_term, 'info');
        }
    }, [activeProject, os, toast]);

    // ── Export / Import config ───────────────────────
    const exportConfig = useCallback(() => {
        const json = JSON.stringify(config, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'commanddock-config.json'; a.click();
        URL.revokeObjectURL(url);
        toast(t.config_exported, 'success');
    }, [config, toast]);

    const importConfig = useCallback(() => {
        const input = document.createElement('input');
        input.type = 'file'; input.accept = '.json';
        input.onchange = async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            try {
                const text = await file.text();
                const parsed = JSON.parse(text);
                if (parsed && typeof parsed === 'object') {
                    await saveConfig(parsed);
                    toast(t.config_imported, 'success');
                    window.location.reload();
                }
            } catch { toast(t.config_import_err, 'error'); }
        };
        input.click();
    }, [saveConfig, toast]);

    // ═══════════════════════════════════════
    // RENDER ROUTING
    // ═══════════════════════════════════════

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: T.font }}>
                <div style={{ textAlign: 'center', color: T.textDim }}>
                    <div style={{ fontSize: 32, marginBottom: 12 }}>⚡</div>
                    <div style={{ fontSize: 13 }}>Cargando...</div>
                </div>
            </div>
        );
    }

    // Show wizard on first run
    if (config && !config.setupDone) {
        return (
            <>
                <Toast toasts={toasts} onDismiss={dismissToast} />
                <SetupWizard config={config} saveConfig={saveConfig} onComplete={async () => {
                    // No reload — just update state to trigger re-route
                    await saveConfig({ setupDone: true });
                }} />
            </>
        );
    }

    // Show project picker when no project is active
    if (!activeProject) {
        return (
            <>
                <Toast toasts={toasts} onDismiss={dismissToast} />
                <ProjectPicker
                    workspaceRoot={config?.workspaceRoot || ''}
                    recentProjects={config?.recentProjects || []}
                    onSelectProject={(projectPath, name) => setActiveProject({ path: projectPath, name })}
                    onChangeRoot={(newRoot) => saveConfig({ workspaceRoot: newRoot })}
                    saveConfig={saveConfig}
                    config={config}
                />
            </>
        );
    }

    // ═══════════════════════════════════════
    // COMMAND PANEL (active project)
    // ═══════════════════════════════════════
    return (
        <div style={{ minHeight: "100vh", background: T.bg, color: T.text, fontFamily: T.font }}>
            <div style={{ position: "fixed", inset: 0, zIndex: 0, backgroundImage: "linear-gradient(rgba(255,255,255,0.015) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.015) 1px,transparent 1px)", backgroundSize: "40px 40px" }} />

            <Toast toasts={toasts} onDismiss={dismissToast} />
            <CommandPalette open={showPalette} onClose={() => setShowPalette(false)} cmds={allCommands} onExec={c => execWithHistory(c.cmd, c.danger, c)} onCopy={copyCmd} />
            {showConfig && <ConfigPanel vars={vars} globalVars={globalVars} projectPath={activeProject?.path} setVars={handleSetVars} onClose={() => { setShowConfig(false); setConfigMissing(null); }} toast={toast} missingForCmd={configMissing} />}

            <div style={{ position: "relative", zIndex: 1, maxWidth: 960, margin: "0 auto", padding: "24px 20px", paddingBottom: showTerm ? 240 : 24 }}>

                {/* HEADER */}
                <header style={{ marginBottom: 24 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <button onClick={() => setActiveProject(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: T.textDim, padding: '4px 8px', borderRadius: T.r.sm }}
                                onMouseEnter={e => e.currentTarget.style.color = '#fff'} onMouseLeave={e => e.currentTarget.style.color = T.textDim}>←</button>
                            <div style={{ width: 36, height: 36, borderRadius: T.r.md, background: "linear-gradient(135deg,#4c8bf5,#00d4aa)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>⚡</div>
                            <div>
                                <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#fff" }}>{activeProject.name}</h1>
                                <span style={{ fontSize: 10, color: "#555" }}>{activeProject.path}</span>
                            </div>
                        </div>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                            <button onClick={openInEditor} title={t.panel_open_editor(vars.editor || 'editor')} style={sty("transparent", T.borderLight, T.textLabel, { fontSize: 11 })}>📝</button>
                            <button onClick={openInTerminal} title={t.panel_open_term} style={sty("transparent", T.borderLight, T.textLabel, { fontSize: 11 })}>💻</button>
                            <button onClick={() => { setDryRun(p => !p); toast(dryRun ? t.panel_dry_off : t.panel_dry_on, dryRun ? "info" : "warning"); }}
                                style={{ ...sty(dryRun ? "#a855f715" : "transparent", dryRun ? "#a855f740" : T.borderLight, dryRun ? T.purple : T.textLabel), fontSize: 10 }}>
                                {dryRun ? "🔍 DRY" : "▶ LIVE"}
                            </button>
                            <button onClick={() => setShowHistory(p => !p)} style={sty("transparent", T.borderLight, T.textLabel, { fontSize: 11 })}>📜</button>
                            <button onClick={() => { setConfigMissing(null); setShowConfig(true); }} style={sty("transparent", T.borderLight, T.textLabel, { fontSize: 11, position: "relative" })}>
                                ⚙️
                                {Object.keys(unconfiguredCount).length > 0 && <span style={{ position: "absolute", top: -2, right: -2, width: 8, height: 8, borderRadius: "50%", background: T.warn }} />}
                            </button>
                            <button onClick={() => setShowTerm(p => !p)} style={sty(showTerm ? T.bgCard : "transparent", T.borderLight, T.textLabel, { fontSize: 11 })}>Terminal</button>
                            <button onClick={() => setShowPalette(true)} style={{ ...sty("linear-gradient(135deg,#4c8bf520,#00d4aa10)", T.accent + "40", T.accent), fontWeight: 600, fontSize: 11 }}>{mod}K</button>
                            {/* Export / Import */}
                            <div style={{ position: 'relative' }}>
                                <button onClick={exportConfig} title="Exportar config" style={sty("transparent", T.borderLight, T.textLabel, { fontSize: 10, padding: '4px 6px' })}>📤</button>
                            </div>
                            <button onClick={importConfig} title={t.config_imported} style={sty("transparent", T.borderLight, T.textLabel, { fontSize: 10, padding: '4px 6px' })}>📥</button>
                            {/* Language selector */}
                            <select value={lang} onChange={e => changeLang(e.target.value)} style={{ background: T.bgCard, border: `1px solid ${T.borderLight}`, borderRadius: T.r.sm, color: T.textLabel, fontSize: 10, padding: '2px 4px', cursor: 'pointer', fontFamily: T.font }}>
                                {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.flag} {l.code.toUpperCase()}</option>)}
                            </select>
                        </div>
                    </div>

                    <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
                        {[["K", "Palette"], ["J", "Terminal"], ["H", "History"]].map(([k, l]) => (
                            <span key={k} style={{ fontSize: 10, color: T.textMuted }}>
                                <kbd style={{ padding: "1px 4px", borderRadius: 3, background: "#ffffff06", border: "1px solid #ffffff10", color: T.textDim, marginRight: 3 }}>{mod}{k}</kbd>{l}
                            </span>
                        ))}
                        {favoriteCommands.length > 0 && <span style={{ fontSize: 10, color: T.textMuted }}><kbd style={{ padding: "1px 4px", borderRadius: 3, background: "#ffffff06", border: "1px solid #ffffff10", color: T.textDim, marginRight: 3 }}>{mod}1-9</kbd>Fav</span>}
                        {dryRun && <span style={{ fontSize: 10, color: T.purple, padding: "1px 8px", borderRadius: 8, background: "#a855f710", border: "1px solid #a855f720" }}>🔍 {t.panel_dry_on}</span>}
                    </div>
                </header>

                {/* PROJECT BANNER */}
                {context && (
                    <div style={{ background: "linear-gradient(135deg,#0d1117,#111827)", border: "1px solid #1e293b", borderRadius: T.r.xl, padding: "16px 20px", marginBottom: 20, animation: "fadeSlideIn 0.2s" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                            <div>
                                <div style={{ fontSize: 11, color: T.accent, letterSpacing: "1px", marginBottom: 4 }}>{t.panel_detected}</div>
                                <div style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>{context.project}</div>
                            </div>
                            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                                {context.stack.map(s => <span key={s} style={{ padding: "4px 10px", borderRadius: 20, background: "#ffffff08", border: "1px solid #ffffff10", fontSize: 11, color: "#aaa" }}>{s}</span>)}
                            </div>
                        </div>
                        <div style={{ marginTop: 8, fontSize: 11, color: "#444" }}>📂 {detectedFiles.join(" · ")}</div>
                    </div>
                )}
                {!context && !scanning && (
                    <div style={{ background: T.bgCard, border: `1px dashed ${T.borderLight}`, borderRadius: T.r.xl, padding: "24px 20px", marginBottom: 20, textAlign: "center" }}>
                        <div style={{ fontSize: 32, marginBottom: 8 }}>📂</div>
                        <div style={{ fontSize: 13, color: T.textDim }}>{t.panel_scanning}</div>
                    </div>
                )}

                {/* QUICK ACTIONS (most used) */}
                {quickActions.length > 0 && !search && (
                    <div style={{ marginBottom: 20 }}>
                        <div style={{ fontSize: 11, color: T.accent, marginBottom: 8, letterSpacing: '0.5px' }}>{t.panel_quick}</div>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                            {quickActions.map(qa => (
                                <button key={qa.cmd} onClick={() => execWithHistory(qa.cmd, false, qa.cmdObj)}
                                    style={{ background: '#0a1628', border: '1px solid #152240', borderRadius: T.r.md, padding: '6px 12px', color: T.accent, fontSize: 11, cursor: 'pointer', fontFamily: T.font, display: 'flex', alignItems: 'center', gap: 6 }}
                                    onMouseEnter={e => e.currentTarget.style.borderColor = T.accent + '40'}
                                    onMouseLeave={e => e.currentTarget.style.borderColor = '#152240'}>
                                    {qa.label}
                                    <span style={{ fontSize: 9, color: T.textMuted, background: '#ffffff06', padding: '1px 5px', borderRadius: 4 }}>×{qa.count}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* SEARCH */}
                <div style={{ marginBottom: 20 }}>
                    <input placeholder={t.panel_search(mod)} value={search} onChange={e => setSearch(e.target.value)}
                        style={{ width: "100%", boxSizing: "border-box", background: T.bgCard, border: `1px solid ${T.borderLight}`, borderRadius: T.r.lg, padding: "10px 16px", color: T.text, fontSize: 13, fontFamily: T.font }} />
                </div>

                {/* FAVORITES */}
                {favoriteCommands.length > 0 && !search && (
                    <div style={{ marginBottom: 24 }}>
                        <div style={{ fontSize: 12, color: T.warn, marginBottom: 10 }}>{t.panel_favorites} <span style={{ fontSize: 9, color: T.textMuted, fontWeight: 400 }}>({mod}1-{favoriteCommands.length})</span></div>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            {favoriteCommands.map((c, i) => (
                                <button key={c.cmd} onClick={() => execWithHistory(c.cmd, c.danger, c)} style={{ background: "#1a1510", border: "1px solid #3d3520", borderRadius: T.r.md, padding: "8px 14px", color: T.warn, fontSize: 12, cursor: "pointer", fontFamily: T.font }}
                                    onMouseEnter={e => e.target.style.background = "#2a2010"} onMouseLeave={e => e.target.style.background = "#1a1510"}>
                                    {c.missingVars?.length > 0 && <span style={{ marginRight: 4 }}>⚠</span>}
                                    <span style={{ fontSize: 9, color: T.textMuted, marginRight: 4 }}>{mod}{i + 1}</span>
                                    {c.label}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* COMMAND GROUPS */}
                {filteredGroups.map(group => (
                    <CommandGroup key={group.category} group={group} isCollapsed={collapsed[group.category]} onToggle={() => toggleCollapse(group.category)} unconfiguredCount={unconfiguredCount[group.category] || 0}>
                        {group.commands.map(cmd => {
                            const key = `${group.category}-${cmd.label}`;
                            let resolved = resolveInput(cmd.cmd, key);
                            resolved = resolveVars(resolved);
                            return (
                                <CommandCard key={cmd.label} cmd={cmd} group={group} resolvedCmd={resolved}
                                    isFav={favs.has(cmd.cmd)} missing={getMissingVars(cmd)}
                                    onExecute={() => execWithHistory(resolveInput(cmd.cmd, key), cmd.danger, cmd)}
                                    onCopy={() => copyCmd(resolveInput(cmd.cmd, key))}
                                    onToggleFav={() => toggleFav(cmd.cmd)}
                                    onConfigMissing={() => { setConfigMissing(getMissingVars(cmd)); setShowConfig(true); }}
                                    dryRun={dryRun}
                                    inputValue={cmd.input ? inputs[`${key}-${cmd.input}`] : undefined}
                                    onInputChange={cmd.input ? (e => setInputs(p => ({ ...p, [`${key}-${cmd.input}`]: e.target.value }))) : undefined} />
                            );
                        })}
                    </CommandGroup>
                ))}

                {/* CUSTOM COMMANDS */}
                <CustomCommands custom={custom} updateCustom={updateCustom} resolveVars={resolveVars} execWithHistory={execWithHistory} toast={toast}
                    isCollapsed={collapsed["__custom"]} onToggle={() => toggleCollapse("__custom")} />
            </div>

            {/* CONFIRM MODAL */}
            {confirm && (
                <div style={{ position: "fixed", inset: 0, zIndex: 100, background: T.bgModal, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={() => setConfirm(null)}>
                    <div onClick={e => e.stopPropagation()} style={{ background: T.bgCard, border: "1px solid #5a2020", borderRadius: T.r.xxl, padding: 28, maxWidth: 440, width: "100%", textAlign: "center", animation: "fadeSlideIn 0.2s" }}>
                        <div style={{ fontSize: 36, marginBottom: 12 }}>⚠️</div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: T.danger, marginBottom: 8 }}>{t.confirm_title}</div>
                        <code style={{ display: "block", padding: "10px 14px", background: T.bgInput, borderRadius: T.r.md, color: T.danger, fontSize: 12, marginBottom: 20, wordBreak: "break-all" }}>{resolveVars(confirm.cmd)}</code>
                        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                            <button onClick={() => setConfirm(null)} style={sty(T.bgCard, T.borderLight, T.textLabel, { padding: "8px 24px" })}>{t.cancel}</button>
                            <button onClick={() => execWithHistory(confirm.cmd, false, confirm.cmdObj)} style={sty("linear-gradient(135deg,#5a2020,#3d1515)", "#ff6b6b40", T.danger, { padding: "8px 24px", fontWeight: 600 })}>{t.execute}</button>
                        </div>
                    </div>
                </div>
            )}

            <HistoryPanel show={showHistory} history={history} onClose={() => setShowHistory(false)}
                onExec={(h) => { execWithHistory(h.cmd, false, null); setShowHistory(false); }}
                onCopy={copyCmd} onClear={() => { setHistory([]); saveConfig({ history: [] }); toast(t.history_cleared, "info"); }} />

            <Terminal show={showTerm} lines={terminal} dryRun={dryRun} onClear={clearTerminal} onClose={() => setShowTerm(false)} termRef={termRef} />

            <FeedbackModal open={showFeedback} onClose={() => setShowFeedback(false)} t={t} />

            {/* FOOTER */}
            <div className="app-footer">
                <span className="footer-brand">{t.footer_brand} <strong>Code Aeternum</strong></span>
                <span className="footer-sep">·</span>
                <a href="https://ko-fi.com/codeaeternum" target="_blank" rel="noopener noreferrer"
                    onClick={e => { if (isElectron) { e.preventDefault(); window.commanddock.execCmd('start https://ko-fi.com/codeaeternum').catch(() => { }); } }}>
                    {t.footer_kofi}
                </a>
                <span className="footer-sep">·</span>
                <a href="#" onClick={e => { e.preventDefault(); setShowFeedback(true); }}>
                    {t.footer_feedback}
                </a>
            </div>
        </div>
    );
}
