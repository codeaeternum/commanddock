import { T } from '../theme';

export function Terminal({ show, lines, dryRun, onClear, onClose, termRef }) {
    if (!show) return null;

    return (
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, height: 220, zIndex: 50, background: T.bgTerminal, borderTop: `1px solid ${T.borderLight}`, display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 16px", borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
                <span style={{ fontSize: 11, color: T.textDim }}>TERMINAL{dryRun ? " (DRY RUN)" : ""}</span>
                <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={onClear} style={{ background: "none", border: "none", color: T.textDim, cursor: "pointer", fontSize: 11 }}>Clear</button>
                    <button onClick={onClose} style={{ background: "none", border: "none", color: T.textDim, cursor: "pointer", fontSize: 14 }}>✕</button>
                </div>
            </div>
            <div ref={termRef} style={{ padding: "8px 16px", overflowY: "auto", flex: 1 }}>
                {lines.map((l, i) => (
                    <div key={i} style={{
                        fontSize: 11, marginBottom: l.type === "divider" ? 4 : 1,
                        color: l.type === "cmd" ? T.green : l.type === "success" ? T.accent : l.type === "error" ? T.danger : l.type === "output" ? "#bbb" : l.type === "divider" ? T.border : "#666",
                    }}>
                        {l.type !== "divider" && <span style={{ color: T.textMuted, marginRight: 8 }}>[{l.time}]</span>}{l.text}
                    </div>
                ))}
            </div>
        </div>
    );
}
