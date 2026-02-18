const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('commanddock', {
    // Execute a shell command
    execCmd: (command, cwd) => ipcRenderer.invoke('exec-cmd', command, cwd),

    // Scan directory contents
    scanDir: (dirPath) => ipcRenderer.invoke('scan-dir', dirPath),

    // Get environment info
    getEnv: () => ipcRenderer.invoke('get-env'),

    // Config management
    readConfig: () => ipcRenderer.invoke('read-config'),
    writeConfig: (config) => ipcRenderer.invoke('write-config', config),

    // Connectivity tests
    testSsh: (user, host) => ipcRenderer.invoke('test-ssh', user, host),
    testGit: (cwd) => ipcRenderer.invoke('test-git', cwd),

    // Workspace & projects
    getLaunchArgs: () => ipcRenderer.invoke('get-launch-args'),
    selectFolder: () => ipcRenderer.invoke('select-folder'),
    scanWorkspace: (rootPath) => ipcRenderer.invoke('scan-workspace', rootPath),

    // Platform info (sync, available immediately)
    platform: process.platform,
});
