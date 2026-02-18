import { useState, useEffect, useCallback } from 'react';
import { T, sty } from '../theme';
import { STACK_ICONS } from '../data/stacks';
import { isElectron } from '../utils/env';

export function ProjectPicker({ workspaceRoot, recentProjects, onSelectProject, onChangeRoot, saveConfig, config }) {
    const [projects, setProjects] = useState([]);
    const [scanning, setScanning] = useState(false);
    const [search, setSearch] = useState('');
    const [manualPath, setManualPath] = useState('');
    const [dragOver, setDragOver] = useState(false);

    const scanWorkspace = useCallback(async (root) => {
        if (!root) return;
        setScanning(true);
        try {
            if (isElectron) {
                const result = await window.commanddock.scanWorkspace(root);
                setProjects(result.projects || []);
            } else {
                setProjects([
                    { name: 'demo-app', path: '/demo-app', stack: ['Node.js', 'Vite', 'Docker'], files: [] },
                    { name: 'api-server', path: '/api-server', stack: ['Python', 'Docker'], files: [] },
                    { name: 'mobile-app', path: '/mobile-app', stack: ['Flutter'], files: [] },
                ]);
            }
        } catch { setProjects([]); }
        setScanning(false);
    }, []);

    useEffect(() => {
        if (workspaceRoot) scanWorkspace(workspaceRoot);
    }, [workspaceRoot, scanWorkspace]);

    const browseFolder = useCallback(async () => {
        if (!isElectron) return;
        const result = await window.commanddock.selectFolder();
        if (result.path) onChangeRoot(result.path);
    }, [onChangeRoot]);

    const openManualProject = useCallback(() => {
        if (manualPath.trim()) {
            onSelectProject(manualPath.trim(), manualPath.trim().split(/[\\/]/).pop());
            setManualPath('');
        }
    }, [manualPath, onSelectProject]);

    // ── Drag & Drop ───────────────────────────
    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOver(true);
    }, []);

    const handleDragLeave = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOver(false);
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOver(false);
        const items = e.dataTransfer?.items;
        if (items?.length > 0) {
            const item = items[0];
            if (item.kind === 'file') {
                const entry = item.webkitGetAsEntry?.();
                if (entry?.isDirectory) {
                    // For Electron, the file path is available on the File object
                    const file = item.getAsFile();
                    if (file?.path) {
                        onSelectProject(file.path, file.name);
                    }
                }
            }
        }
    }, [onSelectProject]);

    const filtered = search
        ? projects.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.stack.some(s => s.toLowerCase().includes(search.toLowerCase())))
        : projects;

    return (
        <div style={{ minHeight: '100vh', background: T.bg, fontFamily: T.font, padding: '24px 20px' }}
            onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
            <div style={{ position: 'fixed', inset: 0, zIndex: 0, backgroundImage: "linear-gradient(rgba(255,255,255,0.015) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.015) 1px,transparent 1px)", backgroundSize: "40px 40px" }} />

            {/* Drop overlay */}
            {dragOver && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(76,139,245,0.1)', border: '3px dashed #4c8bf5', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                    <div style={{ background: T.bgCard, borderRadius: T.r.xxl, padding: '32px 48px', textAlign: 'center' }}>
                        <div style={{ fontSize: 40, marginBottom: 12 }}>📂</div>
                        <div style={{ fontSize: 16, fontWeight: 600, color: T.accent }}>Soltar carpeta aquí</div>
                        <div style={{ fontSize: 11, color: T.textDim, marginTop: 4 }}>para abrir el proyecto</div>
                    </div>
                </div>
            )}

            <div style={{ position: 'relative', zIndex: 1, maxWidth: 900, margin: '0 auto' }}>

                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg,#4c8bf5,#00d4aa)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>⚡</div>
                    <div>
                        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#fff' }}>CommandDock</h1>
                        <span style={{ fontSize: 11, color: T.textDim }}>Selecciona un proyecto para comenzar</span>
                    </div>
                </div>

                {/* Workspace root bar */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 200, background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: T.r.md, padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 12, color: T.textDim }}>📂</span>
                        <span style={{ fontSize: 12, color: T.green, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{workspaceRoot || 'No configurado'}</span>
                        <button onClick={browseFolder} style={{ background: 'none', border: 'none', color: T.textDim, cursor: 'pointer', fontSize: 10 }}>Cambiar</button>
                    </div>
                    <button onClick={() => scanWorkspace(workspaceRoot)} disabled={scanning || !workspaceRoot}
                        style={sty(scanning ? '#ffffff08' : `${T.accent}15`, `${T.accent}30`, T.accent, { fontSize: 11 })}>
                        {scanning ? '⏳ Escaneando...' : '🔄 Re-scan'}
                    </button>
                </div>

                {/* Search */}
                <div style={{ marginBottom: 20 }}>
                    <input placeholder="🔍 Buscar proyecto o tecnología..." value={search} onChange={e => setSearch(e.target.value)}
                        style={{ width: '100%', boxSizing: 'border-box', background: T.bgCard, border: `1px solid ${T.borderLight}`, borderRadius: T.r.lg, padding: '10px 16px', color: T.text, fontSize: 13, fontFamily: T.font }} />
                </div>

                {/* Recent projects */}
                {recentProjects?.length > 0 && !search && (
                    <div style={{ marginBottom: 24 }}>
                        <div style={{ fontSize: 11, color: T.textDim, marginBottom: 8, letterSpacing: '0.5px' }}>⏱️ RECIENTES</div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {recentProjects.slice(0, 5).map(rp => {
                                const name = rp.split(/[\\/]/).pop();
                                return (
                                    <button key={rp} onClick={() => onSelectProject(rp, name)}
                                        style={{ ...sty(T.bgCard, T.borderLight, T.textLabel, { fontSize: 11 }) }}
                                        onMouseEnter={e => e.currentTarget.style.borderColor = T.accent + '40'}
                                        onMouseLeave={e => e.currentTarget.style.borderColor = T.borderLight}>
                                        📂 {name}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Project grid */}
                {scanning && (
                    <div style={{ textAlign: 'center', color: T.textDim, fontSize: 13, padding: 40 }}>⏳ Escaneando proyectos...</div>
                )}

                {!scanning && filtered.length > 0 && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 10 }}>
                        {filtered.map(p => (
                            <div key={p.path} onClick={() => onSelectProject(p.path, p.name)}
                                style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: T.r.xl, padding: '16px 18px', cursor: 'pointer', transition: 'all 0.15s' }}
                                onMouseEnter={e => { e.currentTarget.style.borderColor = T.accent + '40'; e.currentTarget.style.background = T.bgHover; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.background = T.bgCard; e.currentTarget.style.transform = 'none'; }}>
                                <div style={{ fontSize: 15, fontWeight: 600, color: '#fff', marginBottom: 6 }}>{p.name}</div>
                                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
                                    {p.stack.map(s => (
                                        <span key={s} style={{ fontSize: 10, color: T.textDim, padding: '2px 8px', borderRadius: 10, background: '#ffffff06', border: '1px solid #ffffff08' }}>
                                            {STACK_ICONS[s] || '📄'} {s}
                                        </span>
                                    ))}
                                    {p.stack.length === 0 && <span style={{ fontSize: 10, color: T.textMuted }}>—</span>}
                                </div>
                                <div style={{ fontSize: 10, color: T.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.path}</div>
                            </div>
                        ))}
                    </div>
                )}

                {!scanning && filtered.length === 0 && workspaceRoot && (
                    <div style={{ textAlign: 'center', padding: 40, color: T.textDim, fontSize: 13 }}>
                        {search ? 'Sin resultados para esa búsqueda' : 'No se encontraron proyectos en esta carpeta'}
                    </div>
                )}

                {/* Manual project path */}
                <div style={{ marginTop: 28, padding: '16px 18px', background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: T.r.lg }}>
                    <div style={{ fontSize: 11, color: T.textDim, marginBottom: 8 }}>📁 Abrir un proyecto por ruta — o arrastra una carpeta aquí</div>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <input value={manualPath} onChange={e => setManualPath(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') openManualProject(); }} placeholder="D:\ruta\al\proyecto"
                            style={{ flex: 1, background: T.bgInput, border: `1px solid ${T.borderLight}`, borderRadius: T.r.sm, padding: '8px 10px', color: T.green, fontSize: 12, fontFamily: T.font }} />
                        <button onClick={async () => {
                            if (isElectron) {
                                const result = await window.commanddock.selectFolder();
                                if (result.path) onSelectProject(result.path, result.path.split(/[\\/]/).pop());
                            }
                        }} style={sty(T.bgCard, T.borderLight, T.textLabel, { fontSize: 11 })}>📁 Browse</button>
                        <button onClick={openManualProject} disabled={!manualPath.trim()} style={sty(`${T.accent}15`, `${T.accent}30`, T.accent, { fontSize: 11 })}>Abrir →</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
