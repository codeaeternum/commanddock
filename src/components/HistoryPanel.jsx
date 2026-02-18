import { T, sty } from '../theme';

export function HistoryPanel({ show, history, onClose, onExec, onCopy, onClear }) {
    if (!show) return null;

    return (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, background: T.bgModal, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={onClose}>
            <div onClick={e => e.stopPropagation()} style={{ background: T.bgCard, border: `1px solid ${T.borderLight}`, borderRadius: T.r.xxl, padding: 24, maxWidth: 560, width: "100%", maxHeight: "70vh", display: "flex", flexDirection: "column", animation: "fadeSlideIn 0.2s" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>📜 Historial</span>
                    <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={onClear} style={sty("transparent", T.borderLight, T.textDim, { fontSize: 10 })}>Limpiar</button>
                        <button onClick={onClose} style={{ background: "none", border: "none", color: T.textDim, cursor: "pointer", fontSize: 16 }}>✕</button>
                    </div>
                </div>
                <div style={{ overflowY: "auto", flex: 1 }}>
                    {history.length === 0 ? (
                        <div style={{ textAlign: "center", color: T.textDim, fontSize: 12, padding: 40 }}>Sin historial</div>
                    ) : (
                        history.map((h, i) => (
                            <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", borderBottom: `1px solid ${T.border}`, gap: 8 }}>
                                <div style={{ minWidth: 0, flex: 1 }}>
                                    <div style={{ fontSize: 12, color: T.green, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.cmd}</div>
                                    <div style={{ fontSize: 10, color: T.textMuted }}>{new Date(h.time).toLocaleString("es-MX")} · {h.os === "mac" ? "🍎" : "🖥️"}</div>
                                </div>
                                <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                                    <button onClick={() => onExec(h)} style={sty(`${T.accent}15`, `${T.accent}30`, T.accent, { fontSize: 10, padding: "4px 8px" })}>▶</button>
                                    <button onClick={() => onCopy(h.cmd)} style={sty("transparent", T.borderLight, T.textDim, { fontSize: 10, padding: "4px 6px" })}>📋</button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
