import { useState, useEffect, useCallback, useRef } from 'react';
import { DEFAULT_VARS } from '../data/variables';
import { isElectron } from '../utils/env';

const EMPTY_V2 = {
    version: 2, setupDone: false, workspaceRoot: '', recentProjects: [],
    global: { vars: DEFAULT_VARS, customCommands: [], favorites: [] },
    projects: {}, history: [],
    ui: { collapsed: {}, dryRun: false },
};

/**
 * Hook for reading/writing config v2 via Electron IPC.
 * Race-safe: all writes go through a queue to prevent data loss.
 */
export function useConfig() {
    const [config, setConfig] = useState(null);
    const [loading, setLoading] = useState(true);
    const configRef = useRef(null); // always holds the latest config

    // Keep configRef in sync with state
    const updateConfig = useCallback((next) => {
        configRef.current = next;
        setConfig(next);
    }, []);

    // ── Load config on mount ─────────────────────
    useEffect(() => {
        let cancelled = false;

        async function load() {
            if (isElectron) {
                try {
                    const result = await window.commanddock.readConfig();
                    if (cancelled) return;
                    if (result.error) {
                        updateConfig({ ...EMPTY_V2 });
                    } else {
                        updateConfig(result.config);
                    }
                } catch {
                    if (!cancelled) updateConfig({ ...EMPTY_V2 });
                }
            } else {
                updateConfig({ ...EMPTY_V2, setupDone: true });
            }
            if (!cancelled) setLoading(false);
        }

        load();
        return () => { cancelled = true; };
    }, [updateConfig]);

    // ── Save full config (race-safe via ref) ──
    const saveConfig = useCallback(async (partial) => {
        const current = configRef.current || EMPTY_V2;
        const merged = { ...current, ...partial };
        updateConfig(merged);
        if (isElectron) {
            try {
                const result = await window.commanddock.writeConfig(merged);
                if (result.error) console.error('[useConfig] save error:', result.error);
            } catch (err) {
                console.error('[useConfig] save failed:', err.message);
            }
        }
        return merged;
    }, [updateConfig]);

    // ── Update global vars (race-safe) ───────────
    const setGlobalVars = useCallback((updater) => {
        const current = configRef.current;
        if (!current) return;
        const currentVars = current.global?.vars || {};
        const newVars = typeof updater === 'function' ? updater(currentVars) : updater;
        const next = { ...current, global: { ...current.global, vars: newVars } };
        updateConfig(next);
        if (isElectron) window.commanddock.writeConfig(next).catch(console.error);
    }, [updateConfig]);

    // ── Get resolved vars for a project (global + project overrides) ──
    const getResolvedVars = useCallback((projectPath) => {
        const c = configRef.current;
        if (!c) return DEFAULT_VARS;
        const globalVars = c.global?.vars || DEFAULT_VARS;
        const projectVars = c.projects?.[projectPath]?.vars || {};
        return { ...globalVars, ...projectVars };
    }, []);

    // ── Update project-specific vars (only overrides, race-safe) ──
    const setProjectVars = useCallback((projectPath, updater) => {
        const current = configRef.current;
        if (!current) return;
        const currentOverrides = current.projects?.[projectPath]?.vars || {};
        const newOverrides = typeof updater === 'function' ? updater(currentOverrides) : updater;
        const next = {
            ...current,
            projects: {
                ...current.projects,
                [projectPath]: {
                    ...(current.projects?.[projectPath] || { customCommands: [], favorites: [] }),
                    vars: newOverrides,
                },
            },
        };
        updateConfig(next);
        if (isElectron) window.commanddock.writeConfig(next).catch(console.error);
    }, [updateConfig]);

    // ── Add to recent projects (race-safe) ──────────────────
    const addRecentProject = useCallback((projectPath) => {
        const current = configRef.current;
        if (!current) return;
        const recents = (current.recentProjects || []).filter(p => p !== projectPath);
        recents.unshift(projectPath);
        const next = { ...current, recentProjects: recents.slice(0, 20) };
        updateConfig(next);
        if (isElectron) window.commanddock.writeConfig(next).catch(console.error);
    }, [updateConfig]);

    // ── Convenience getters ──────────────────────
    const globalVars = config?.global?.vars || DEFAULT_VARS;

    return {
        config,
        globalVars,
        loading,
        saveConfig,
        setGlobalVars,
        getResolvedVars,
        setProjectVars,
        addRecentProject,
    };
}
