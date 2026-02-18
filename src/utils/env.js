/** True when running inside Electron with the preload bridge available */
export const isElectron = typeof window !== 'undefined' && !!window.commanddock;
