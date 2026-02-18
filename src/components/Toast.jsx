import { T } from '../theme';

export function Toast({ toasts, onDismiss }) {
    return (
        <div style={{ position: "fixed", top: 16, right: 16, zIndex: 200, display: "flex", flexDirection: "column", gap: 8 }}>
            {toasts.map(t => (
                <div key={t.id} onClick={() => onDismiss(t.id)} style={{
                    padding: "10px 16px", borderRadius: T.r.md,
                    background: t.type === "success" ? "#0a2a1a" : t.type === "error" ? "#2a0a0a" : t.type === "warning" ? "#2a1a0a" : "#1a1a2e",
                    border: `1px solid ${t.type === "success" ? "#00d4aa40" : t.type === "error" ? "#ff6b6b40" : t.type === "warning" ? "#f5c54240" : "#4c8bf540"}`,
                    color: t.type === "success" ? T.green : t.type === "error" ? T.danger : t.type === "warning" ? T.warn : T.accent,
                    fontSize: 12, fontFamily: T.font, cursor: "pointer", maxWidth: 360,
                    animation: "fadeSlideIn 0.25s ease-out", boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
                }}>
                    {t.type === "success" ? "✓" : t.type === "error" ? "✗" : t.type === "warning" ? "⚠" : "ℹ"} {t.message}
                </div>
            ))}
        </div>
    );
}
