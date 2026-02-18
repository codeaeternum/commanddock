import { useState, useMemo } from 'react';
import { T, sty } from '../theme';
import { VAR_SCHEMA, DEFAULT_VARS } from '../data/variables';
import { isElectron } from '../utils/env';

export function ConfigPanel({ vars, globalVars, projectPath, setVars, onClose, toast, missingForCmd }) {
    const [testing, setTesting] = useState({});
    const [testResults, setTestResults] = useState({});
    const [scope, setScope] = useState(projectPath ? 'project' : 'global');

    const groups = useMemo(() => {
        const g = {};
        Object.entries(VAR_SCHEMA).forEach(([k, v]) => { if (!g[v.group]) g[v.group] = []; g[v.group].push({ key: k, ...v }); });
        return g;
    }, []);

    const [activeGroup, setActiveGroup] = useState(Object.keys(groups)[0]);
    const configured = Object.entries(vars).filter(([k, v]) => v && v !== VAR_SCHEMA[k]?.placeholder).length;
    const total = Object.keys(VAR_SCHEMA).length;

    const testVar = async (key) => {
        setTesting(p => ({ ...p, [key]: true }));
        setTestResults(p => ({ ...p, [key]: null }));

        const val = vars[key];
        let ok = false;

        try {
            if (isElectron) {
                if ((key === "ssh_user" || key === "ssh_host") && vars.ssh_user && vars.ssh_host) {
                    const result = await window.commanddock.testSsh(vars.ssh_user, vars.ssh_host);
                    ok = result.success;
                } else if ((key === "git_user" || key === "git_email")) {
                    const result = await window.commanddock.testGit();
                    ok = result.success;
                } else if (key === "ssh_ip") {
                    ok = !!val && /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(val);
                } else {
                    ok = !!val && val.length > 0;
                }
            } else {
                if (key === "ssh_ip") ok = !!val && /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(val);
                else if (key === "git_email") ok = !!val && val.includes("@");
                else ok = !!val && val.length > 0;
            }
        } catch { ok = false; }

        setTestResults(p => ({ ...p, [key]: ok }));
        setTesting(p => ({ ...p, [key]: false }));
        toast(ok ? `✓ ${VAR_SCHEMA[key].label} verificado` : `✗ ${VAR_SCHEMA[key].label} no válido`, ok ? "success" : "error");
    };

    const testAll = async () => {
        const keys = groups[activeGroup].map(v => v.key);
        for (const k of keys) { await testVar(k); }
    };

    // Check if a var is overridden by the project
    const isOverridden = (key) => {
        if (!projectPath || !globalVars) return false;
        return vars[key] !== globalVars[key];
    };

    return (
        <div style={{ position: "fixed", inset: 0, zIndex: 150, background: T.bgModal, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={onClose}>
            <div onClick={e => e.stopPropagation()} style={{ background: T.bg, border: `1px solid ${T.borderLight}`, borderRadius: T.r.xxl, width: "100%", maxWidth: 720, maxHeight: "85vh", display: "flex", flexDirection: "column", animation: "fadeSlideIn 0.2s ease-out", overflow: "hidden" }}>
                {/* Header */}
                <div style={{ padding: "20px 24px 16px", borderBottom: `1px solid ${T.border}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#fff" }}>⚙️ Configuración</h2>
                            <div style={{ fontSize: 11, color: T.textDim, marginTop: 4 }}>
                                {projectPath ? `Proyecto: ${projectPath.split(/[\\/]/).pop()}` : 'Variables globales'}
                            </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <div style={{ fontSize: 11, color: configured === total ? T.green : T.warn }}>
                                {configured}/{total}
                            </div>
                            <div style={{ width: 60, height: 4, borderRadius: 2, background: T.border }}>
                                <div style={{ width: `${(configured / total) * 100}%`, height: "100%", borderRadius: 2, background: configured === total ? T.green : T.warn, transition: "width 0.3s" }} />
                            </div>
                            <button onClick={onClose} style={{ background: "none", border: "none", color: T.textDim, cursor: "pointer", fontSize: 18 }}>✕</button>
                        </div>
                    </div>

                    {/* Scope toggle */}
                    {projectPath && (
                        <div style={{ display: 'flex', gap: 4, marginTop: 12 }}>
                            {['project', 'global'].map(s => (
                                <button key={s} onClick={() => setScope(s)} style={{
                                    padding: '5px 14px', borderRadius: T.r.sm, fontSize: 11, cursor: 'pointer', fontFamily: T.font, fontWeight: 500, border: 'none',
                                    background: scope === s ? `${T.accent}15` : 'transparent',
                                    color: scope === s ? T.accent : T.textDim,
                                    borderBottom: scope === s ? `2px solid ${T.accent}` : '2px solid transparent',
                                }}>
                                    {s === 'project' ? '📁 Proyecto' : '🌍 Global'}
                                </button>
                            ))}
                        </div>
                    )}

                    {missingForCmd?.length > 0 && (
                        <div style={{ marginTop: 12, padding: "8px 12px", background: "#f5c54210", border: "1px solid #f5c54230", borderRadius: T.r.md, fontSize: 11, color: T.warn }}>
                            ⚠ Faltan variables: {missingForCmd.map(v => VAR_SCHEMA[v]?.label || v).join(", ")}
                        </div>
                    )}
                </div>

                <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
                    {/* Sidebar */}
                    <div style={{ width: 180, borderRight: `1px solid ${T.border}`, padding: "12px 0", overflowY: "auto", flexShrink: 0 }}>
                        {Object.entries(groups).map(([name, items]) => {
                            const groupConfigured = items.filter(v => vars[v.key] && vars[v.key] !== v.placeholder).length;
                            const hasHighlight = missingForCmd?.some(m => items.find(v => v.key === m));
                            return (
                                <button key={name} onClick={() => setActiveGroup(name)} style={{
                                    display: "flex", justifyContent: "space-between", alignItems: "center",
                                    width: "100%", padding: "8px 16px", border: "none", cursor: "pointer",
                                    background: activeGroup === name ? "#ffffff08" : "transparent",
                                    borderLeft: activeGroup === name ? `2px solid ${T.accent}` : "2px solid transparent",
                                    color: activeGroup === name ? "#fff" : T.textLabel, fontSize: 12, fontFamily: T.font, textAlign: "left",
                                }}>
                                    <span>{hasHighlight ? "⚠ " : ""}{name}</span>
                                    <span style={{ fontSize: 10, color: groupConfigured === items.length ? T.green : T.textDim }}>{groupConfigured}/{items.length}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, padding: "16px 24px", overflowY: "auto" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                            <span style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>{activeGroup}</span>
                            <button onClick={testAll} style={sty(`${T.accent}15`, `${T.accent}30`, T.accent, { fontSize: 10 })}>🧪 Probar todo</button>
                        </div>
                        {scope === 'project' && (
                            <div style={{ marginBottom: 12, padding: '8px 12px', background: '#4c8bf508', border: '1px solid #4c8bf520', borderRadius: T.r.md, fontSize: 10, color: T.accent }}>
                                💡 Las variables vacías heredarán el valor global. Solo establece las que quieras sobreescribir para este proyecto.
                            </div>
                        )}
                        {groups[activeGroup]?.map(v => {
                            const isMissing = missingForCmd?.includes(v.key);
                            const result = testResults[v.key];
                            const overridden = isOverridden(v.key);
                            return (
                                <div key={v.key} style={{ marginBottom: 16, padding: 14, background: isMissing ? "#f5c54208" : T.bgCard, border: `1px solid ${isMissing ? "#f5c54230" : overridden ? T.accent + '30' : T.border}`, borderRadius: T.r.lg }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                                        <div>
                                            <span style={{ fontSize: 12, fontWeight: 600, color: "#fff" }}>{v.label}</span>
                                            {isMissing && <span style={{ marginLeft: 8, fontSize: 9, color: T.warn, padding: "1px 6px", borderRadius: 8, background: "#f5c54215" }}>Requerido</span>}
                                            {overridden && scope === 'project' && <span style={{ marginLeft: 6, fontSize: 9, color: T.accent, padding: "1px 6px", borderRadius: 8, background: `${T.accent}15` }}>Override</span>}
                                        </div>
                                        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                                            {overridden && scope === 'project' && (
                                                <button onClick={() => setVars(p => { const n = { ...p }; delete n[v.key]; return n; })}
                                                    style={{ fontSize: 9, color: T.textDim, background: 'none', border: 'none', cursor: 'pointer' }}>↩ Global</button>
                                            )}
                                            {result !== null && result !== undefined && (
                                                <span style={{ fontSize: 11, color: result ? T.green : T.danger }}>{result ? "✓ OK" : "✗ Error"}</span>
                                            )}
                                            <button onClick={() => testVar(v.key)} disabled={testing[v.key]}
                                                style={sty("transparent", T.borderLight, T.textDim, { fontSize: 10, padding: "4px 8px", opacity: testing[v.key] ? 0.5 : 1 })}>
                                                {testing[v.key] ? "⏳" : "🧪 Test"}
                                            </button>
                                        </div>
                                    </div>
                                    <div style={{ fontSize: 10, color: T.textDim, marginBottom: 8 }}>{v.desc}</div>
                                    {v.options ? (
                                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                                            {v.options.map(o => (
                                                <button key={o} onClick={() => setVars(p => ({ ...p, [v.key]: o }))}
                                                    style={{ padding: "6px 14px", borderRadius: T.r.sm, border: `1px solid ${vars[v.key] === o ? T.accent + "60" : T.borderLight}`, background: vars[v.key] === o ? T.accent + "15" : "transparent", color: vars[v.key] === o ? T.accent : T.textLabel, fontSize: 12, cursor: "pointer", fontFamily: T.font }}>
                                                    {o}
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        <input value={vars[v.key] || ""} onChange={e => setVars(p => ({ ...p, [v.key]: e.target.value }))}
                                            placeholder={scope === 'project' ? `Heredado: ${globalVars?.[v.key] || v.placeholder}` : v.placeholder}
                                            style={{ width: "100%", background: T.bgInput, border: `1px solid ${result === false ? T.danger + "40" : T.borderLight}`, borderRadius: T.r.sm, padding: "8px 10px", color: T.accent, fontSize: 12, fontFamily: T.font, boxSizing: "border-box" }} />
                                    )}
                                    <div style={{ marginTop: 6, fontSize: 10, color: T.textMuted }}>
                                        Variable: <code style={{ color: T.green }}>{"{{" + v.key + "}}"}</code>
                                    </div>
                                </div>
                            );
                        })}

                        {/* Variable Preview */}
                        <div style={{ marginTop: 20, padding: 14, background: '#06060b', border: `1px solid ${T.border}`, borderRadius: T.r.lg }}>
                            <div style={{ fontSize: 10, color: T.textDim, marginBottom: 8, letterSpacing: '0.5px' }}>📋 PREVIEW — comandos con tus variables</div>
                            {[
                                { label: 'Git Push', tpl: 'git push {{git_remote}} {{git_branch}}' },
                                { label: 'SSH Connect', tpl: 'ssh {{ssh_user}}@{{ssh_host}}' },
                                { label: 'Docker Build', tpl: 'docker build -t {{docker_prefix}}/app .' },
                            ].map(p => {
                                const resolved = p.tpl.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] || `{{${key}}}`);
                                const hasUnresolved = resolved.includes('{{');
                                return (
                                    <div key={p.label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                        <span style={{ fontSize: 10, color: T.textMuted, width: 80, flexShrink: 0 }}>{p.label}</span>
                                        <code style={{ fontSize: 11, color: hasUnresolved ? T.textDim : T.green, fontFamily: T.font }}>{resolved}</code>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div style={{ padding: "12px 24px", borderTop: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between" }}>
                    <button onClick={() => { setVars(scope === 'project' ? {} : DEFAULT_VARS); toast(scope === 'project' ? "Overrides eliminados" : "Variables reseteadas", "info"); }}
                        style={sty("transparent", T.borderDanger, T.danger, { fontSize: 11 })}>
                        {scope === 'project' ? '↩ Reset overrides' : 'Reset defaults'}
                    </button>
                    <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={() => { navigator.clipboard?.writeText(JSON.stringify(vars, null, 2)); toast("Config copiada al clipboard", "info"); }}
                            style={sty("transparent", T.borderLight, T.textLabel, { fontSize: 11 })}>📋 Exportar</button>
                        <button onClick={onClose} style={sty(`${T.accent}20`, `${T.accent}40`, T.accent, { fontSize: 11, fontWeight: 600 })}>Listo</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
