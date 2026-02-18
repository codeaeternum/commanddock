import { useState, useCallback } from "react";
import { T, sty } from "../theme";

const GOOGLE_FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLSe9wih_kZ9xHyid3T0-hELgm9blkkASsG-h6FDWnvfKIUBXNw/formResponse";
const ENTRY_TYPE = "entry.675272766";
const ENTRY_MESSAGE = "entry.292794743";

const TYPES = [
    { key: "Bug", icon: "🐛" },
    { key: "Feature", icon: "💡" },
    { key: "Other", icon: "💬" },
];

export function FeedbackModal({ open, onClose, t }) {
    const [type, setType] = useState("Bug");
    const [message, setMessage] = useState("");
    const [status, setStatus] = useState("idle"); // idle | sending | success | error

    const handleSubmit = useCallback(async () => {
        if (!message.trim()) return;
        setStatus("sending");
        try {
            const formData = new URLSearchParams();
            formData.append(ENTRY_TYPE, `[CommandDock] ${type}`);
            formData.append(ENTRY_MESSAGE, message.trim());
            await fetch(GOOGLE_FORM_URL, {
                method: "POST",
                mode: "no-cors",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: formData.toString(),
            });
            setStatus("success");
            setTimeout(() => {
                onClose();
                setStatus("idle");
                setMessage("");
                setType("Bug");
            }, 2000);
        } catch {
            setStatus("error");
        }
    }, [type, message, onClose]);

    if (!open) return null;

    return (
        <div className="fb-overlay" onClick={onClose}>
            <div className="fb-modal" onClick={e => e.stopPropagation()}>
                {status === "success" ? (
                    <div style={{ textAlign: "center", padding: "32px 20px" }}>
                        <div style={{ fontSize: 36, marginBottom: 12 }}>✅</div>
                        <div style={{ fontSize: 14, color: T.text }}>{t.fb_thanks}</div>
                    </div>
                ) : (
                    <>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                            <span style={{ fontSize: 15, fontWeight: 700, color: T.text }}>💬 {t.fb_title}</span>
                            <button onClick={onClose} style={{ background: "none", border: "none", color: T.textDim, cursor: "pointer", fontSize: 18, padding: "4px 8px" }}>×</button>
                        </div>

                        <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
                            {TYPES.map(tp => (
                                <button key={tp.key} onClick={() => setType(tp.key)}
                                    style={{
                                        flex: 1, padding: "8px 0", borderRadius: T.r.md, cursor: "pointer", fontSize: 12, fontFamily: T.font,
                                        background: type === tp.key ? T.accent + "15" : "transparent",
                                        border: `1px solid ${type === tp.key ? T.accent + "40" : T.borderLight}`,
                                        color: type === tp.key ? T.accent : T.textDim,
                                        fontWeight: type === tp.key ? 600 : 400,
                                    }}>
                                    {tp.icon} {t[`fb_${tp.key.toLowerCase()}`] || tp.key}
                                </button>
                            ))}
                        </div>

                        <textarea value={message} onChange={e => setMessage(e.target.value)}
                            placeholder={t.fb_placeholder}
                            rows={4}
                            style={{
                                width: "100%", boxSizing: "border-box", resize: "vertical",
                                background: T.bgInput, border: `1px solid ${T.borderLight}`, borderRadius: T.r.md,
                                padding: "10px 12px", color: T.text, fontSize: 13, fontFamily: T.font,
                                marginBottom: 14,
                            }} />

                        <button onClick={handleSubmit} disabled={status === "sending" || !message.trim()}
                            style={{
                                width: "100%", padding: "10px 0", borderRadius: T.r.md, cursor: "pointer",
                                background: "linear-gradient(135deg,#4c8bf5,#00d4aa)", border: "none",
                                color: "#fff", fontWeight: 600, fontSize: 13, fontFamily: T.font,
                                opacity: status === "sending" || !message.trim() ? 0.5 : 1,
                            }}>
                            {status === "sending" ? t.fb_sending : status === "error" ? t.fb_error : t.fb_send}
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
