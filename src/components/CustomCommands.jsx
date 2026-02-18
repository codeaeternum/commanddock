import { useState } from 'react';
import { T, sty } from '../theme';

export function CustomCommands({ custom, updateCustom, resolveVars, execWithHistory, toast, isCollapsed, onToggle }) {
    const [showAdd, setShowAdd] = useState(false);
    const [newCmd, setNewCmd] = useState({ label: "", cmd: "", desc: "" });
    const [editIdx, setEditIdx] = useState(null);
    const [editCmd, setEditCmd] = useState({ label: "", cmd: "", desc: "" });

    return (
        <div style={{ marginBottom: 24 }}>
            <div onClick={onToggle} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: isCollapsed ? 0 : 12, cursor: "pointer" }}>
                <span style={{ fontSize: 10, color: T.textDim, transition: "transform 0.2s", transform: isCollapsed ? "rotate(-90deg)" : "rotate(0)" }}>▼</span>
                <span style={{ fontSize: 18 }}>🔧</span>
                <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: "1px", color: T.orange }}>PERSONALIZADOS</span>
                <span style={{ fontSize: 10, color: T.textDim, background: "#ffffff06", padding: "2px 8px", borderRadius: 10 }}>{custom.length}</span>
                <div style={{ flex: 1, height: 1, background: `${T.orange}18` }} />
                <button onClick={e => { e.stopPropagation(); setShowAdd(p => !p); }} style={sty("#1a1510", "#3d2810", T.orange, { fontSize: 10 })}>{showAdd ? "✕" : "+ Nuevo"}</button>
            </div>
            {!isCollapsed && (
                <>
                    {showAdd && (
                        <div style={{ background: T.bgCard, border: `1px solid ${T.borderLight}`, borderRadius: T.r.lg, padding: 16, marginBottom: 12, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end", animation: "fadeSlideIn 0.2s" }}>
                            {[["Nombre", "label", 1], ["Comando", "cmd", 2], ["Descripción", "desc", 1]].map(([l, f, flex]) => (
                                <label key={f} style={{ flex, minWidth: 120 }}>
                                    <span style={{ fontSize: 10, color: T.textDim, textTransform: "uppercase" }}>{l}</span>
                                    <input value={newCmd[f]} onChange={e => setNewCmd(p => ({ ...p, [f]: e.target.value }))} placeholder={f === "cmd" ? "Usa {{var}} para variables" : ""}
                                        style={{ display: "block", width: "100%", marginTop: 4, background: T.bgInput, border: `1px solid ${T.borderLight}`, borderRadius: T.r.sm, padding: "6px 8px", color: T.text, fontSize: 12, fontFamily: T.font, boxSizing: "border-box" }} />
                                </label>
                            ))}
                            <button onClick={() => {
                                if (newCmd.label && newCmd.cmd) {
                                    const varMatches = newCmd.cmd.match(/\{\{(\w+)\}\}/g) || [];
                                    const cmdVars = varMatches.map(m => m.replace(/[{}]/g, ""));
                                    updateCustom(p => [...p, { ...newCmd, icon: "🔧", color: T.orange, vars: cmdVars }]);
                                    setNewCmd({ label: "", cmd: "", desc: "" }); setShowAdd(false); toast("Comando agregado", "success");
                                }
                            }} style={{ ...sty(`${T.orange}20`, `${T.orange}40`, T.orange), fontWeight: 600 }}>Guardar</button>
                        </div>
                    )}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 8 }}>
                        {custom.map((c, i) => (
                            <div key={i} style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: T.r.md, padding: "10px 14px", transition: "all 0.15s", position: "relative" }}
                                onMouseEnter={e => e.currentTarget.style.borderColor = T.orange + "40"} onMouseLeave={e => e.currentTarget.style.borderColor = T.border}>
                                {editIdx === i ? (
                                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                        {[["label", "Nombre"], ["cmd", "Comando"], ["desc", "Desc"]].map(([f, ph]) => (
                                            <input key={f} value={editCmd[f]} onChange={e => setEditCmd(p => ({ ...p, [f]: e.target.value }))} placeholder={ph}
                                                style={{ background: T.bgInput, border: `1px solid ${T.borderLight}`, borderRadius: 4, padding: "4px 6px", color: T.text, fontSize: 11, fontFamily: T.font, boxSizing: "border-box" }} />
                                        ))}
                                        <div style={{ display: "flex", gap: 4 }}>
                                            <button onClick={() => { updateCustom(p => p.map((x, j) => j === editIdx ? { ...x, ...editCmd } : x)); setEditIdx(null); toast("Actualizado", "success"); }}
                                                style={sty(`${T.green}20`, `${T.green}40`, T.green, { flex: 1, fontSize: 10 })}>✓</button>
                                            <button onClick={() => setEditIdx(null)} style={sty("transparent", T.borderLight, T.textDim, { fontSize: 10 })}>✕</button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div style={{ position: "absolute", top: 6, right: 6, display: "flex", gap: 2 }}>
                                            <button onClick={() => { setEditIdx(i); setEditCmd({ label: c.label, cmd: c.cmd, desc: c.desc }); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 10, color: T.textDim, opacity: 0.3 }} onMouseEnter={e => e.target.style.opacity = 1} onMouseLeave={e => e.target.style.opacity = 0.3}>✏️</button>
                                            <button onClick={() => { updateCustom(p => p.filter((_, j) => j !== i)); toast("Eliminado", "info"); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 10, color: T.textDim, opacity: 0.3 }} onMouseEnter={e => e.target.style.opacity = 1} onMouseLeave={e => e.target.style.opacity = 0.3}>🗑️</button>
                                        </div>
                                        <div onClick={() => execWithHistory(c.cmd, false, c)} style={{ cursor: "pointer" }}>
                                            <span style={{ marginRight: 6 }}>{c.icon}</span><strong style={{ fontSize: 12 }}>{c.label}</strong>
                                            <div style={{ fontSize: 10, color: T.textDim, marginTop: 2 }}>{c.desc}</div>
                                            <div style={{ fontSize: 9, color: T.textMuted, marginTop: 4, wordBreak: "break-all" }}>{resolveVars(c.cmd)}</div>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
