import { useState, useCallback, useRef } from 'react';
import { VAR_SCHEMA } from '../data/variables';
import { isElectron } from '../utils/env';

/**
 * Hook that encapsulates command execution, variable resolution,
 * terminal output, history tracking, and OS notifications.
 */
export function useCommandExecution({ vars, os, path, dryRun, toast, t }) {
    const [terminal, setTerminal] = useState([]);
    const [showTerm, setShowTerm] = useState(false);
    const [confirm, setConfirm] = useState(null);
    const [inputs, setInputs] = useState({});
    const termRef = useRef(null);

    const resolveVars = useCallback((cmd) => {
        return cmd.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] || `{{${key}}}`);
    }, [vars]);

    const getMissingVars = useCallback((cmdObj) => {
        if (!cmdObj?.vars || cmdObj.vars.length === 0) return [];
        return cmdObj.vars.filter(v => !vars[v] || vars[v] === '');
    }, [vars]);

    const resolveInput = useCallback((tpl, key) => {
        let c = tpl;
        const m = c.match(/\{(\w+)\}/g);
        if (m) m.forEach(match => {
            if (match.startsWith('{{')) return;
            const k = match.replace(/[{}]/g, '');
            c = c.replace(match, inputs[`${key}-${k}`] || '');
        });
        return c;
    }, [inputs]);

    /** Send an OS notification if command took >3s */
    const notifyOS = useCallback((title, body) => {
        try {
            if ('Notification' in window && Notification.permission === 'granted') {
                new Notification(title, { body, icon: '⚡' });
            } else if ('Notification' in window && Notification.permission !== 'denied') {
                Notification.requestPermission().then(p => {
                    if (p === 'granted') new Notification(title, { body });
                });
            }
        } catch { /* ignore notification errors */ }
    }, []);

    const executeCommand = useCallback(async (cmd, danger, cmdObj, { onHistory, onOpenConfig } = {}) => {
        // Check missing vars
        if (cmdObj) {
            const missing = getMissingVars(cmdObj);
            if (missing.length > 0) {
                onOpenConfig?.(missing);
                toast((t?.config_configure || ((v) => `Configura: ${v}`))(missing.map(v => VAR_SCHEMA[v]?.label || v).join(', ')), 'warning');
                return;
            }
        }
        if (danger && !confirm) { setConfirm({ cmd, cmdObj }); return; }
        setConfirm(null);

        const resolved = resolveVars(cmd);
        const ts = new Date().toLocaleTimeString();
        const startTime = Date.now();

        if (dryRun) {
            toast(`🔍 Dry run: ${resolved.slice(0, 60)}`, 'info');
            setShowTerm(true);
            setTerminal(p => [...p,
            { type: 'cmd', text: `[DRY RUN] $ ${resolved}`, time: ts },
            { type: 'info', text: t?.term_dry || '⏸ No se ejecutó (modo dry run activo)', time: ts },
            { type: 'divider', text: '─'.repeat(50), time: ts },
            ]);
            return;
        }

        setShowTerm(true);
        const execMsg = typeof t?.term_executing === 'function' ? t.term_executing(os) : `⏳ Ejecutando en ${os === 'mac' ? 'macOS' : 'Windows'}...`;
        setTerminal(p => [...p,
        { type: 'cmd', text: `$ ${resolved}`, time: ts },
        { type: 'info', text: execMsg, time: ts },
        ]);

        if (isElectron) {
            try {
                const result = await window.commanddock.execCmd(resolved, path);
                const elapsed = Date.now() - startTime;
                const ts2 = new Date().toLocaleTimeString();
                const lines = [];
                if (result.stdout) result.stdout.split('\n').filter(Boolean).forEach(l => lines.push({ type: 'output', text: l, time: ts2 }));
                if (result.stderr) result.stderr.split('\n').filter(Boolean).forEach(l => lines.push({ type: 'error', text: l, time: ts2 }));
                lines.push(result.exitCode === 0
                    ? { type: 'success', text: t?.term_completed || '✓ Completado (exit 0)', time: ts2 }
                    : { type: 'error', text: `✗ Exit code: ${result.exitCode}`, time: ts2 });
                lines.push({ type: 'divider', text: '─'.repeat(50), time: ts2 });
                setTerminal(p => [...p, ...lines]);
                toast(result.exitCode === 0 ? `✓ ${resolved.slice(0, 40)}` : `Error (exit ${result.exitCode})`, result.exitCode === 0 ? 'success' : 'error');

                // OS notification for long commands (>3s)
                if (elapsed > 3000) {
                    notifyOS(
                        result.exitCode === 0 ? 'CommandDock ✓' : 'CommandDock ✗',
                        `${resolved.slice(0, 50)} — ${result.exitCode === 0 ? 'completado' : `error (exit ${result.exitCode})`}`
                    );
                }
            } catch (err) {
                const ts2 = new Date().toLocaleTimeString();
                setTerminal(p => [...p, { type: 'error', text: `✗ ${err.message}`, time: ts2 }, { type: 'divider', text: '─'.repeat(50), time: ts2 }]);
                toast(`Error: ${err.message}`, 'error');
            }
        } else {
            const ts2 = new Date().toLocaleTimeString();
            setTerminal(p => [...p,
            { type: 'output', text: t?.term_mock || '(mock) comando simulado en web preview', time: ts2 },
            { type: 'success', text: `✓ ${t?.term_simulated || 'Simulado'}`, time: ts2 },
            { type: 'divider', text: '─'.repeat(50), time: ts2 },
            ]);
            toast(`${t?.term_simulated || 'Simulado'}: ${resolved.slice(0, 40)}`, 'info');
        }

        onHistory?.({ cmd: resolved, time: new Date().toISOString(), os });
    }, [confirm, os, path, dryRun, toast, t, resolveVars, getMissingVars, notifyOS]);

    const copyCmd = useCallback(cmd => {
        navigator.clipboard?.writeText(resolveVars(cmd));
        toast(t?.copied || 'Copiado', 'info');
    }, [toast, t, resolveVars]);

    const clearTerminal = useCallback(() => setTerminal([]), []);

    return {
        terminal, showTerm, setShowTerm, confirm, setConfirm, inputs, setInputs, termRef,
        resolveVars, getMissingVars, resolveInput, executeCommand, copyCmd, clearTerminal,
    };
}
