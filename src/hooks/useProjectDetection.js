import { useState, useEffect, useCallback } from 'react';
import { buildContext } from '../data/contexts';
import { isElectron } from '../utils/env';

/**
 * Hook that handles scanning directories and detecting project context.
 * Uses window.commanddock.scanDir() in Electron, mock data in web preview.
 */
export function useProjectDetection(toast) {
    const [os, setOs] = useState('windows');
    const [context, setContext] = useState(null);
    const [scanning, setScanning] = useState(false);

    const scanDirectory = useCallback(async (dirPath) => {
        if (!dirPath) return;
        setScanning(true);
        try {
            if (isElectron) {
                const result = await window.commanddock.scanDir(dirPath);
                if (result.error) {
                    toast(`Error scanning: ${result.error}`, 'error');
                    setContext(null);
                } else {
                    const entryNames = result.entries.map(e => e.name);
                    const ctx = buildContext(result.path, entryNames);
                    setContext(ctx);
                    if (ctx) toast(`Detectado: ${ctx.project} (${ctx.stack.join(', ')})`, 'success');
                    else toast('No se detectaron archivos de proyecto conocidos', 'warning');
                }
            } else {
                const mockEntries = ['package.json', '.git', 'node_modules', 'src', 'vite.config.js'];
                setContext(buildContext(dirPath || '/preview', mockEntries));
            }
        } catch (err) {
            toast(`Scan failed: ${err.message}`, 'error');
            setContext(null);
        }
        setScanning(false);
    }, [toast]);

    // Detect OS on mount
    useEffect(() => {
        if (isElectron) {
            window.commanddock.getEnv().then(env => {
                setOs(env.platform === 'darwin' ? 'mac' : 'windows');
            }).catch(() => { });
        }
    }, []);

    return { os, setOs, context, scanning, scanDirectory };
}
