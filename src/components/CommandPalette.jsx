import { useState, useEffect, useMemo, useRef } from 'react';
import { T } from '../theme';

export function CommandPalette({ open, onClose, cmds, onExec, onCopy }) {
    const [q, setQ] = useState("");
    const ref = useRef(null);
    const [sel, setSel] = useState(0);

    const filtered = useMemo(() => {
        if (!q) return cmds.slice(0, 15);
        const l = q.toLowerCase();
        return cmds.filter(c =>
            c.label.toLowerCase().includes(l) ||
            c.cmd.toLowerCase().includes(l) ||
            c.desc.toLowerCase().includes(l) ||
            c.category.toLowerCase().includes(l)
        ).slice(0, 15);
    }, [q, cmds]);

    useEffect(() => {
        if (open) { setQ(""); setSel(0); setTimeout(() => ref.current?.focus(), 50); }
    }, [open]);

    const onKey = e => {
        if (e.key === "ArrowDown") { e.preventDefault(); setSel(p => Math.min(p + 1, filtered.length - 1)); }
        else if (e.key === "ArrowUp") { e.preventDefault(); setSel(p => Math.max(p - 1, 0)); }
        else if (e.key === "Enter" && filtered[sel]) { onExec(filtered[sel]); onClose(); }
        else if (e.key === "Escape") onClose();
    };

    if (!open) return null;

    return (
        <div style={{ position: "fixed", inset: 0, zIndex: 300, background: T.bgModal, display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: 100 }} onClick={onClose}>
            <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 560, background: T.bgCard, border: `1px solid ${T.borderLight}`, borderRadius: T.r.xl, overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.6)" }}>
                <div style={{ display: "flex", alignItems: "center", padding: "12px 16px", borderBottom: `1px solid ${T.border}`, gap: 10 }}>
                    <span style={{ color: T.textDim, fontSize: 16 }}>⚡</span>
                    <input ref={ref} value={q} onChange={e => { setQ(e.target.value); setSel(0); }} onKeyDown={onKey} placeholder="Buscar comando..."
                        style={{ flex: 1, background: "none", border: "none", outline: "none", color: T.text, fontSize: 14, fontFamily: T.font }} />
                    <kbd style={{ padding: "2px 6px", borderRadius: 4, background: "#ffffff08", border: "1px solid #ffffff12", color: T.textDim, fontSize: 10 }}>ESC</kbd>
                </div>
                <div style={{ maxHeight: 380, overflowY: "auto" }}>
                    {filtered.map((c, i) => (
                        <div key={`${c.category}-${c.label}-${i}`} onClick={() => { onExec(c); onClose(); }}
                            style={{
                                display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", cursor: "pointer",
                                background: i === sel ? "#ffffff08" : "transparent",
                                borderLeft: i === sel ? `2px solid ${c.groupColor || T.accent}` : "2px solid transparent",
                            }}
                            onMouseEnter={() => setSel(i)}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                                <span style={{ fontSize: 14 }}>{c.groupIcon || "▶"}</span>
                                <div style={{ minWidth: 0 }}>
                                    <div style={{ fontSize: 13, fontWeight: 600, color: c.danger ? T.danger : "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.label}</div>
                                    <div style={{ fontSize: 10, color: T.textDim, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.desc}</div>
                                </div>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0, marginLeft: 12 }}>
                                {c.missingVars?.length > 0 && <span style={{ fontSize: 9, color: T.warn, padding: "2px 6px", borderRadius: 8, background: "#f5c54215" }}>⚠ Config</span>}
                                <span style={{ fontSize: 10, color: c.groupColor || T.textDim, padding: "2px 6px", borderRadius: 10, background: "#ffffff06" }}>{c.category}</span>
                                <button onClick={e => { e.stopPropagation(); onCopy(c.cmd); }} style={{ background: "none", border: "none", cursor: "pointer", color: T.textDim, fontSize: 11, padding: "2px 4px" }}>📋</button>
                            </div>
                        </div>
                    ))}
                    {filtered.length === 0 && <div style={{ padding: 24, textAlign: "center", color: T.textDim, fontSize: 12 }}>Sin resultados</div>}
                </div>
            </div>
        </div>
    );
}
