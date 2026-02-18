import { T } from '../theme';

export function CommandGroup({ group, isCollapsed, onToggle, unconfiguredCount, children }) {
    return (
        <div style={{ marginBottom: 24 }}>
            <div onClick={onToggle} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: isCollapsed ? 0 : 12, cursor: "pointer", userSelect: "none" }}>
                <span style={{ fontSize: 10, color: T.textDim, transition: "transform 0.2s", transform: isCollapsed ? "rotate(-90deg)" : "rotate(0)" }}>▼</span>
                <span style={{ fontSize: 18 }}>{group.icon}</span>
                <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: "1px", color: group.color, textTransform: "uppercase" }}>{group.category}</span>
                <span style={{ fontSize: 10, color: T.textDim, background: "#ffffff06", padding: "2px 8px", borderRadius: 10 }}>{group.commands.length}</span>
                {unconfiguredCount > 0 && <span style={{ fontSize: 9, color: T.warn, padding: "2px 6px", borderRadius: 8, background: "#f5c54210" }}>⚠ {unconfiguredCount} sin configurar</span>}
                <div style={{ flex: 1, height: 1, background: `${group.color}18` }} />
            </div>
            {!isCollapsed && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 8, animation: "fadeSlideIn 0.15s ease-out" }}>
                    {children}
                </div>
            )}
        </div>
    );
}
