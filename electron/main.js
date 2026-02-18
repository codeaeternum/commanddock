const { app, BrowserWindow, ipcMain, session, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const os = require('os');
const { ConfigManager } = require('./config');

let mainWindow;
const configManager = new ConfigManager();

const isDev = !app.isPackaged;

// ── Parse CLI args for project path ──────────────
function getLaunchProjectPath() {
    // Skip electron args in dev mode; in production argv[1] is the app
    const args = process.argv.slice(isDev ? 2 : 1);
    for (const arg of args) {
        // Skip flags
        if (arg.startsWith('-')) continue;
        // Check if it's an existing directory
        try {
            if (fs.existsSync(arg) && fs.statSync(arg).isDirectory()) {
                return path.resolve(arg);
            }
        } catch { /* ignore */ }
    }
    return null;
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1000,
        height: 720,
        minWidth: 700,
        minHeight: 500,
        backgroundColor: '#0a0a0f',
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: true,
        },
    });

    if (isDev) {
        mainWindow.loadURL('http://localhost:5173');
    } else {
        // Apply CSP only in production
        session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
            callback({
                responseHeaders: {
                    ...details.responseHeaders,
                    'Content-Security-Policy': ["default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self';"]
                }
            });
        });
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    }
}

// ─── App lifecycle ───────────────────────────────

app.whenReady().then(() => {
    registerIpcHandlers();
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

// ─── IPC Handlers ────────────────────────────────

function registerIpcHandlers() {

    // ── get-launch-args: Return CLI project path ──
    ipcMain.handle('get-launch-args', () => {
        return { projectPath: getLaunchProjectPath() };
    });

    // ── select-folder: Native folder dialog ──────
    ipcMain.handle('select-folder', async () => {
        const result = await dialog.showOpenDialog(mainWindow, {
            properties: ['openDirectory'],
            title: 'Select folder',
        });
        if (result.canceled || !result.filePaths.length) return { path: null };
        return { path: result.filePaths[0] };
    });

    // ── scan-workspace: Scan all projects in a root dir ──
    ipcMain.handle('scan-workspace', (_event, rootPath) => {
        console.log('[scan-workspace] Scanning:', rootPath);
        try {
            const resolvedPath = path.resolve(rootPath);
            if (!resolvedPath || !fs.existsSync(resolvedPath)) {
                console.log('[scan-workspace] Directory not found:', resolvedPath);
                return { projects: [], error: 'Directory not found' };
            }

            const stat = fs.statSync(resolvedPath);
            if (!stat.isDirectory()) {
                console.log('[scan-workspace] Not a directory:', resolvedPath);
                return { projects: [], error: 'Not a directory' };
            }

            const entries = fs.readdirSync(resolvedPath);
            console.log('[scan-workspace] Found entries:', entries.length);
            const projects = [];

            for (const name of entries) {
                if (name.startsWith('.') || name === 'node_modules') continue;

                const dirPath = path.join(resolvedPath, name);
                try {
                    const dirStat = fs.statSync(dirPath);
                    if (!dirStat.isDirectory()) continue;

                    const files = fs.readdirSync(dirPath).slice(0, 50);
                    const stack = detectStack(files);
                    projects.push({
                        name,
                        path: dirPath,
                        stack,
                        files: files.slice(0, 20),
                    });
                } catch (innerErr) {
                    console.log('[scan-workspace] Skipping', name, ':', innerErr.message);
                }
            }

            console.log('[scan-workspace] Detected', projects.length, 'projects');
            return { projects, error: null };
        } catch (err) {
            console.error('[scan-workspace] Error:', err.message);
            return { projects: [], error: err.message };
        }
    });

    // ── exec-cmd: Execute shell command ──────────
    ipcMain.handle('exec-cmd', (_event, command, cwd) => {
        return new Promise((resolve) => {
            const options = {
                cwd: cwd || process.cwd(),
                shell: true,
                timeout: 30_000,
                maxBuffer: 1024 * 1024,
                env: { ...process.env },
            };

            exec(command, options, (error, stdout, stderr) => {
                resolve({
                    stdout: stdout?.toString() || '',
                    stderr: stderr?.toString() || '',
                    error: error ? error.message : null,
                    exitCode: error ? error.code ?? 1 : 0,
                });
            });
        });
    });

    // ── scan-dir: Read directory contents ────────
    ipcMain.handle('scan-dir', (_event, dirPath) => {
        try {
            const target = path.resolve(dirPath || process.cwd());
            const names = fs.readdirSync(target);
            const entries = [];
            for (const name of names) {
                try {
                    const fullPath = path.join(target, name);
                    const st = fs.statSync(fullPath);
                    entries.push({ name, isDirectory: st.isDirectory(), isFile: st.isFile() });
                } catch { /* skip inaccessible entries */ }
            }
            return { path: target, entries, error: null };
        } catch (err) {
            return { path: dirPath, entries: [], error: err.message };
        }
    });

    // ── get-env: Return platform info ────────────
    ipcMain.handle('get-env', () => {
        return {
            platform: process.platform,
            cwd: process.cwd(),
            home: os.homedir(),
            arch: process.arch,
            nodeVersion: process.versions.node,
            electronVersion: process.versions.electron,
        };
    });

    // ── read-config ─────────────────────────────
    ipcMain.handle('read-config', () => {
        try {
            return { config: configManager.read(), error: null };
        } catch (err) {
            return { config: null, error: err.message };
        }
    });

    // ── write-config ────────────────────────────
    ipcMain.handle('write-config', (_event, config) => {
        try {
            const saved = configManager.write(config);
            return { config: saved, error: null };
        } catch (err) {
            return { config: null, error: err.message };
        }
    });

    // ── test-ssh ────────────────────────────────
    ipcMain.handle('test-ssh', (_event, user, host) => {
        return new Promise((resolve) => {
            if (!user || !host) {
                return resolve({ success: false, error: 'User and host are required' });
            }
            const safePattern = /^[\w.@-]+$/;
            if (!safePattern.test(user) || !safePattern.test(host)) {
                return resolve({ success: false, error: 'Invalid characters in user or host' });
            }

            const cmd = `ssh -o ConnectTimeout=5 -o BatchMode=yes -o StrictHostKeyChecking=no ${user}@${host} echo ok`;

            exec(cmd, { timeout: 10_000 }, (error, stdout, stderr) => {
                const output = stdout?.toString().trim() || '';
                resolve({
                    success: !error && output.includes('ok'),
                    stdout: output,
                    stderr: stderr?.toString() || '',
                    error: error ? error.message : null,
                });
            });
        });
    });

    // ── test-git ────────────────────────────────
    ipcMain.handle('test-git', (_event, cwd) => {
        return new Promise((resolve) => {
            const options = { cwd: cwd || process.cwd(), timeout: 5_000 };

            exec('git config user.email', options, (error, stdout) => {
                const email = stdout?.toString().trim() || '';
                resolve({
                    success: !error && email.length > 0,
                    email,
                    error: error ? error.message : null,
                });
            });
        });
    });
}

// ── Stack detection helper (server-side) ─────────
function detectStack(files) {
    const stack = [];
    const map = {
        'package.json': 'Node.js', 'tsconfig.json': 'TypeScript',
        'Dockerfile': 'Docker', 'docker-compose.yml': 'Docker', 'docker-compose.yaml': 'Docker',
        'requirements.txt': 'Python', 'Pipfile': 'Python', 'pyproject.toml': 'Python',
        'Cargo.toml': 'Rust', 'go.mod': 'Go',
        'pom.xml': 'Java', 'build.gradle': 'Java',
        '.git': 'Git', 'vite.config.js': 'Vite', 'vite.config.ts': 'Vite',
        'next.config.js': 'Next.js', 'next.config.mjs': 'Next.js', 'next.config.ts': 'Next.js',
        'nuxt.config.js': 'Nuxt', 'nuxt.config.ts': 'Nuxt',
        'angular.json': 'Angular', 'pubspec.yaml': 'Flutter',
        'Gemfile': 'Ruby', 'composer.json': 'PHP',
        'tailwind.config.js': 'TailwindCSS', 'tailwind.config.ts': 'TailwindCSS',
        'firebase.json': 'Firebase', '.firebaserc': 'Firebase',
        'serverless.yml': 'Serverless', 'turbo.json': 'Turborepo',
        'vue.config.js': 'Vue.js', 'expo.json': 'Expo / RN',
        'app.json': 'React Native', '.env': 'Env Vars',
    };
    for (const f of files) {
        if (map[f] && !stack.includes(map[f])) stack.push(map[f]);
    }
    return stack;
}
