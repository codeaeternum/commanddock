import { T, sty } from '../theme';
import { VAR_SCHEMA } from '../data/variables';

export function CommandCard({ cmd, group, resolvedCmd, isFav, missing, onExecute, onCopy, onToggleFav, onConfigMissing, dryRun, inputValue, onInputChange }) {
    const hasMissing = missing.length > 0;

    return (
        <div style={{ background: T.bgCard, border: `1px solid ${hasMissing ? "#f5c54225" : cmd.danger ? T.borderDanger : T.border}`, borderRadius: T.r.lg, padding: "12px 14px", transition: "all 0.15s", position: "relative" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = cmd.danger ? "#5a2020" : group.color + "40"; e.currentTarget.style.background = T.bgHover; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = hasMissing ? "#f5c54225" : cmd.danger ? T.borderDanger : T.border; e.currentTarget.style.background = T.bgCard; }}>

            <button onClick={onToggleFav} style={{ position: "absolute", top: 8, right: 8, background: "none", border: "none", cursor: "pointer", fontSize: 12, padding: 2, opacity: isFav ? 1 : 0.2 }}
                onMouseEnter={e => e.target.style.opacity = 1} onMouseLeave={e => { if (!isFav) e.target.style.opacity = 0.2; }}>
                {isFav ? "⭐" : "☆"}
            </button>

            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 3, color: cmd.danger ? T.danger : "#fff", paddingRight: 24 }}>{cmd.label}</div>
            <div style={{ fontSize: 11, color: T.textDim, marginBottom: 6 }}>{cmd.desc}</div>

            {hasMissing && (
                <button onClick={onConfigMissing}
                    style={{ display: "block", width: "100%", marginBottom: 8, padding: "6px 10px", borderRadius: T.r.sm, background: "#f5c54208", border: "1px solid #f5c54225", color: T.warn, fontSize: 10, cursor: "pointer", fontFamily: T.font, textAlign: "left" }}>
                    ⚠ Configurar: {missing.map(v => VAR_SCHEMA[v]?.label || v).join(", ")}
                </button>
            )}

            {cmd.input && (
                <input placeholder={cmd.input} value={inputValue || ""} onChange={onInputChange}
                    style={{ display: "block", width: "100%", marginBottom: 8, background: T.bgInput, border: `1px solid ${T.borderLight}`, borderRadius: T.r.sm, padding: "6px 8px", color: T.green, fontSize: 11, fontFamily: T.font, boxSizing: "border-box" }} />
            )}

            <div style={{ display: "flex", gap: 6 }}>
                <button onClick={onExecute}
                    style={{ flex: 1, background: cmd.danger ? "linear-gradient(135deg,#2a0a0a,#3d1515)" : `linear-gradient(135deg,${group.color}10,${group.color}05)`, border: `1px solid ${cmd.danger ? "#5a2020" : group.color + "30"}`, borderRadius: T.r.sm, padding: "6px 10px", color: cmd.danger ? T.danger : group.color, fontSize: 11, cursor: "pointer", fontFamily: T.font, fontWeight: 500 }}
                    onMouseEnter={e => e.target.style.filter = "brightness(1.3)"} onMouseLeave={e => e.target.style.filter = "brightness(1)"}>
                    {dryRun ? "🔍 Preview" : "▶ Run"}
                </button>
                <button onClick={onCopy} style={sty("transparent", T.borderLight, T.textDim, { padding: "6px 8px" })}>📋</button>
            </div>

            <div style={{ marginTop: 5, fontSize: 10, color: T.textMuted, wordBreak: "break-all" }}>{resolvedCmd}</div>
        </div>
    );
}
