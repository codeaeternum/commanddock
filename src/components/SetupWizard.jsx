import { useState, useCallback } from 'react';
import { T, sty } from '../theme';
import { VAR_SCHEMA } from '../data/variables';
import { STACK_ICONS } from '../data/stacks';
import { isElectron } from '../utils/env';

const STEPS = ['welcome', 'workspace', 'vars', 'preview'];

const QUICK_VARS = ['git_user', 'git_email', 'editor', 'shell', 'pkg_manager'];

export function SetupWizard({ config, saveConfig, onComplete }) {
    const [step, setStep] = useState(0);
    const [workspaceRoot, setWorkspaceRoot] = useState('');
    const [vars, setVars] = useState(config?.global?.vars || {});
    const [projects, setProjects] = useState([]);
    const [scanning, setScanning] = useState(false);

    const browseFolder = useCallback(async () => {
        if (!isElectron) return;
        const result = await window.commanddock.selectFolder();
        if (result.path) {
            setWorkspaceRoot(result.path);
        }
    }, []);

    const scanForProjects = useCallback(async (root) => {
        if (!root) return;
        setScanning(true);
        try {
            if (isElectron) {
                const result = await window.commanddock.scanWorkspace(root);
                setProjects(result.projects || []);
            } else {
                setProjects([
                    { name: 'demo-project', path: '/demo', stack: ['Node.js', 'Docker'], files: [] },
                    { name: 'my-api', path: '/api', stack: ['Python', 'Docker'], files: [] },
                ]);
            }
        } catch { setProjects([]); }
        setScanning(false);
    }, []);

    const handleNext = useCallback(async () => {
        if (step === 1 && workspaceRoot) {
            await scanForProjects(workspaceRoot);
        }
        if (step < STEPS.length - 1) setStep(s => s + 1);
    }, [step, workspaceRoot, scanForProjects]);

    const handleFinish = useCallback(async () => {
        await saveConfig({
            ...config,
            version: 2,
            setupDone: true,
            workspaceRoot,
            global: { ...config.global, vars },
        });
        onComplete();
    }, [config, saveConfig, workspaceRoot, vars, onComplete]);



    return (
        <div style={{ minHeight: '100vh', background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: T.font, padding: 20 }}>
            <div style={{ width: '100%', maxWidth: 600, animation: 'fadeSlideIn 0.3s ease-out' }}>

                {/* Progress */}
                <div style={{ display: 'flex', gap: 4, marginBottom: 32 }}>
                    {STEPS.map((_, i) => (
                        <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= step ? T.accent : T.border, transition: 'background 0.3s' }} />
                    ))}
                </div>

                {/* Step 0: Welcome */}
                {step === 0 && (
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ width: 80, height: 80, borderRadius: 20, background: 'linear-gradient(135deg,#4c8bf5,#00d4aa)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, margin: '0 auto 24px' }}>⚡</div>
                        <h1 style={{ margin: '0 0 8px', fontSize: 28, fontWeight: 700, color: '#fff' }}>CommandDock</h1>
                        <p style={{ color: T.textDim, fontSize: 14, margin: '0 0 8px' }}>Panel contextual de comandos para desarrolladores</p>
                        <p style={{ color: T.textMuted, fontSize: 12, margin: '0 0 32px', maxWidth: 400, marginInline: 'auto' }}>
                            Detecta tu stack, ofrece comandos relevantes, y te permite configurar variables reutilizables por proyecto.
                        </p>
                        <button onClick={handleNext} style={{ ...sty('linear-gradient(135deg,#4c8bf520,#00d4aa10)', T.accent + '40', T.accent), fontSize: 14, fontWeight: 600, padding: '12px 40px' }}>
                            Comenzar →
                        </button>
                    </div>
                )}

                {/* Step 1: Workspace Root */}
                {step === 1 && (
                    <div>
                        <h2 style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 700, color: '#fff' }}>📂 Carpeta de proyectos</h2>
                        <p style={{ color: T.textDim, fontSize: 12, margin: '0 0 24px' }}>
                            Selecciona la carpeta donde están tus proyectos. CommandDock escaneará las subcarpetas para detectar cada proyecto.
                        </p>
                        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                            <input value={workspaceRoot} onChange={e => setWorkspaceRoot(e.target.value)} placeholder={(window.commanddock?.platform || 'win32') === 'win32' ? 'D:\\Proyectos' : '~/dev'}
                                style={{ flex: 1, background: T.bgCard, border: `1px solid ${T.borderLight}`, borderRadius: T.r.md, padding: '10px 14px', color: T.green, fontSize: 13, fontFamily: T.font }} />
                            <button onClick={browseFolder} style={sty(T.bgCard, T.borderLight, T.textLabel, { fontSize: 12, whiteSpace: 'nowrap' })}>📁 Browse</button>
                        </div>
                        <p style={{ color: T.textMuted, fontSize: 10, margin: '0 0 24px' }}>
                            💡 Puedes cambiar esto después en la configuración
                        </p>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between' }}>
                            <button onClick={() => setStep(0)} style={sty('transparent', T.borderLight, T.textDim, { fontSize: 12 })}>← Atrás</button>
                            <button onClick={handleNext} disabled={!workspaceRoot} style={{ ...sty(workspaceRoot ? `${T.accent}15` : 'transparent', workspaceRoot ? `${T.accent}40` : T.border, workspaceRoot ? T.accent : T.textMuted), fontSize: 12, fontWeight: 600 }}>
                                Siguiente →
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 2: Quick Vars */}
                {step === 2 && (
                    <div>
                        <h2 style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 700, color: '#fff' }}>⚙️ Variables globales</h2>
                        <p style={{ color: T.textDim, fontSize: 12, margin: '0 0 20px' }}>
                            Estas son tus variables por defecto. Puedes personalizarlas por proyecto después.
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
                            {QUICK_VARS.map(key => {
                                const schema = VAR_SCHEMA[key];
                                if (!schema) return null;
                                return (
                                    <div key={key}>
                                        <label style={{ fontSize: 11, fontWeight: 600, color: '#fff', marginBottom: 4, display: 'block' }}>{schema.label}</label>
                                        <div style={{ fontSize: 10, color: T.textDim, marginBottom: 4 }}>{schema.desc}</div>
                                        {schema.options ? (
                                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                                {schema.options.map(o => (
                                                    <button key={o} onClick={() => setVars(p => ({ ...p, [key]: o }))}
                                                        style={{ padding: '6px 14px', borderRadius: T.r.sm, border: `1px solid ${vars[key] === o ? T.accent + '60' : T.borderLight}`, background: vars[key] === o ? T.accent + '15' : 'transparent', color: vars[key] === o ? T.accent : T.textLabel, fontSize: 12, cursor: 'pointer', fontFamily: T.font }}>
                                                        {o}
                                                    </button>
                                                ))}
                                            </div>
                                        ) : (
                                            <input value={vars[key] || ''} onChange={e => setVars(p => ({ ...p, [key]: e.target.value }))} placeholder={schema.placeholder}
                                                style={{ width: '100%', background: T.bgInput, border: `1px solid ${T.borderLight}`, borderRadius: T.r.sm, padding: '8px 10px', color: T.accent, fontSize: 12, fontFamily: T.font, boxSizing: 'border-box' }} />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between' }}>
                            <button onClick={() => setStep(1)} style={sty('transparent', T.borderLight, T.textDim, { fontSize: 12 })}>← Atrás</button>
                            <button onClick={handleNext} style={{ ...sty(`${T.accent}15`, `${T.accent}40`, T.accent), fontSize: 12, fontWeight: 600 }}>Siguiente →</button>
                        </div>
                    </div>
                )}

                {/* Step 3: Preview */}
                {step === 3 && (
                    <div>
                        <h2 style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 700, color: '#fff' }}>🎉 ¡Todo listo!</h2>
                        <p style={{ color: T.textDim, fontSize: 12, margin: '0 0 20px' }}>
                            {projects.length > 0
                                ? `Se detectaron ${projects.length} proyectos en tu workspace:`
                                : 'No se detectaron proyectos aún. Puedes agregarlos después.'}
                        </p>
                        {scanning && <div style={{ textAlign: 'center', color: T.textDim, fontSize: 12, padding: 20 }}>⏳ Escaneando...</div>}
                        {!scanning && projects.length > 0 && (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 8, marginBottom: 24, maxHeight: 300, overflowY: 'auto' }}>
                                {projects.map(p => (
                                    <div key={p.path} style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: T.r.lg, padding: '12px 14px' }}>
                                        <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 4 }}>{p.name}</div>
                                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                            {p.stack.map(s => (
                                                <span key={s} style={{ fontSize: 10, color: T.textDim, padding: '2px 6px', borderRadius: 8, background: '#ffffff06' }}>
                                                    {STACK_ICONS[s] || '📄'} {s}
                                                </span>
                                            ))}
                                            {p.stack.length === 0 && <span style={{ fontSize: 10, color: T.textMuted }}>Sin stack detectado</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between' }}>
                            <button onClick={() => setStep(2)} style={sty('transparent', T.borderLight, T.textDim, { fontSize: 12 })}>← Atrás</button>
                            <button onClick={handleFinish} style={{ ...sty('linear-gradient(135deg,#4c8bf520,#00d4aa10)', T.accent + '40', T.accent), fontSize: 14, fontWeight: 600, padding: '10px 32px' }}>
                                🚀 Empezar
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
