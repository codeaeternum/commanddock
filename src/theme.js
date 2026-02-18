// ═══════════════════════════════════════
// THEME
// ═══════════════════════════════════════
export const T = {
    bg: "#0a0a0f", bgCard: "#0d0d18", bgHover: "#10101f", bgInput: "#08080f",
    bgTerminal: "#06060b", bgModal: "rgba(0,0,0,0.75)",
    border: "#141425", borderLight: "#1a1a2e", borderDanger: "#3d1515",
    text: "#e0e0e8", textDim: "#555", textMuted: "#333", textLabel: "#888",
    accent: "#4c8bf5", green: "#00d4aa", danger: "#ff6b6b", warn: "#f5c542",
    orange: "#f48120", purple: "#a855f7",
    font: "'JetBrains Mono','Fira Code','SF Mono',monospace",
    r: { sm: 6, md: 8, lg: 10, xl: 12, xxl: 16 },
};

export const sty = (bg, brd, col, x = {}) => ({
    background: bg, border: `1px solid ${brd}`, borderRadius: T.r.sm,
    padding: "6px 12px", color: col, cursor: "pointer", fontSize: 11,
    fontFamily: T.font, fontWeight: 500, transition: "all 0.15s", ...x,
});
