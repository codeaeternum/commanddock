const fs = require('fs');
const path = require('path');
const os = require('os');

const CONFIG_DIR = path.join(os.homedir(), '.commanddock');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

// ── Default v2 config ────────────────────────────
const DEFAULT_VARS = {
    ssh_user: '',
    ssh_host: '',
    ssh_ip: '',
    remote_project_path: '',
    git_user: '',
    git_email: '',
    git_branch: 'main',
    git_remote: 'origin',
    docker_registry: '',
    docker_prefix: '',
    pkg_manager: 'npm',
    editor: 'code',
    shell: process.platform === 'win32' ? 'powershell' : 'zsh',
    cf_tunnel_name: '',
};

const DEFAULT_CONFIG = {
    version: 2,
    setupDone: false,
    workspaceRoot: '',
    recentProjects: [],
    global: {
        vars: { ...DEFAULT_VARS },
        customCommands: [],
        favorites: [],
    },
    projects: {},
    history: [],
    ui: {
        collapsed: {},
        dryRun: false,
    },
};

class ConfigManager {
    constructor() {
        this._cache = null;
    }

    /** Ensure ~/.commanddock/ exists */
    _ensureDir() {
        if (!fs.existsSync(CONFIG_DIR)) {
            fs.mkdirSync(CONFIG_DIR, { recursive: true });
        }
    }

    /** Migrate v1 config to v2 */
    _migrateV1(raw) {
        console.log('[ConfigManager] Migrating v1 → v2');
        return {
            version: 2,
            setupDone: true, // existing user — skip wizard
            workspaceRoot: raw.ui?.lastPath ? path.dirname(raw.ui.lastPath) : '',
            recentProjects: raw.ui?.lastPath ? [raw.ui.lastPath] : [],
            global: {
                vars: { ...DEFAULT_VARS, ...(raw.vars || {}) },
                customCommands: Array.isArray(raw.customCommands) ? raw.customCommands : [],
                favorites: Array.isArray(raw.favorites) ? raw.favorites : [],
            },
            projects: {},
            history: Array.isArray(raw.history) ? raw.history.slice(0, 100) : [],
            ui: {
                collapsed: raw.ui?.collapsed || {},
                dryRun: raw.ui?.dryRun || false,
            },
        };
    }

    /** Validate and fill missing keys */
    _validate(raw) {
        if (!raw || typeof raw !== 'object') return { ...DEFAULT_CONFIG };

        // Detect v1 format (has flat "vars" key without "version")
        if (!raw.version || raw.version < 2) {
            raw = this._migrateV1(raw);
        }

        const config = {
            version: 2,
            setupDone: !!raw.setupDone,
            workspaceRoot: raw.workspaceRoot || '',
            recentProjects: Array.isArray(raw.recentProjects) ? raw.recentProjects : [],
            global: {
                vars: { ...DEFAULT_VARS, ...(raw.global?.vars || {}) },
                customCommands: Array.isArray(raw.global?.customCommands)
                    ? raw.global.customCommands.filter(c => c && typeof c.label === 'string' && typeof c.cmd === 'string')
                    : [],
                favorites: Array.isArray(raw.global?.favorites)
                    ? raw.global.favorites.filter(f => typeof f === 'string')
                    : [],
            },
            projects: {},
            history: Array.isArray(raw.history) ? raw.history.slice(0, 100) : [],
            ui: { ...DEFAULT_CONFIG.ui, ...(raw.ui || {}) },
        };

        // Validate per-project configs
        if (raw.projects && typeof raw.projects === 'object') {
            for (const [projPath, projConfig] of Object.entries(raw.projects)) {
                if (projConfig && typeof projConfig === 'object') {
                    config.projects[projPath] = {
                        vars: projConfig.vars || {},
                        customCommands: Array.isArray(projConfig.customCommands) ? projConfig.customCommands : [],
                        favorites: Array.isArray(projConfig.favorites) ? projConfig.favorites : [],
                    };
                }
            }
        }

        return config;
    }

    /** Read config from disk */
    read() {
        this._ensureDir();
        if (this._cache) return this._cache;

        try {
            if (fs.existsSync(CONFIG_FILE)) {
                let content = fs.readFileSync(CONFIG_FILE, 'utf-8');
                // Strip BOM if present (Windows editors/PowerShell can add this)
                if (content.charCodeAt(0) === 0xFEFF) content = content.slice(1);
                const raw = JSON.parse(content);
                this._cache = this._validate(raw);
                // If migrated, persist the new format
                if (!raw.version || raw.version < 2) {
                    this._writeToDisk(this._cache);
                }
            } else {
                this._cache = { ...DEFAULT_CONFIG };
                this._writeToDisk(this._cache);
            }
        } catch (err) {
            console.error('[ConfigManager] Failed to read config:', err.message);
            this._cache = { ...DEFAULT_CONFIG };
        }

        return this._cache;
    }

    /** Write config to disk */
    _writeToDisk(config) {
        this._ensureDir();
        fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
    }

    /** Write full config */
    write(config) {
        const validated = this._validate(config);
        this._cache = validated;
        this._writeToDisk(validated);
        return validated;
    }

    /** Get resolved vars for a project (global merged with project overrides) */
    getResolvedVars(projectPath) {
        const config = this.read();
        const globalVars = config.global.vars;
        const projectVars = config.projects[projectPath]?.vars || {};
        return { ...globalVars, ...projectVars };
    }

    /** Get project-specific config (or empty defaults) */
    getProjectConfig(projectPath) {
        const config = this.read();
        return config.projects[projectPath] || { vars: {}, customCommands: [], favorites: [] };
    }

    /** Update project-specific config */
    setProjectConfig(projectPath, partial) {
        const config = this.read();
        const existing = config.projects[projectPath] || { vars: {}, customCommands: [], favorites: [] };
        config.projects[projectPath] = { ...existing, ...partial };
        return this.write(config);
    }

    /** Add a project to recent list */
    addRecentProject(projectPath) {
        const config = this.read();
        const recents = config.recentProjects.filter(p => p !== projectPath);
        recents.unshift(projectPath);
        config.recentProjects = recents.slice(0, 20);
        return this.write(config);
    }

    /** Reset config to defaults */
    reset() {
        this._cache = null;
        const config = { ...DEFAULT_CONFIG };
        this._writeToDisk(config);
        this._cache = config;
        return config;
    }

    /** Get a specific key (dot-notation) */
    get(keyPath) {
        const config = this.read();
        return keyPath.split('.').reduce((obj, key) => obj?.[key], config);
    }

    /** Set a specific key */
    set(keyPath, value) {
        const config = this.read();
        const keys = keyPath.split('.');
        let target = config;
        for (let i = 0; i < keys.length - 1; i++) {
            if (!target[keys[i]] || typeof target[keys[i]] !== 'object') {
                target[keys[i]] = {};
            }
            target = target[keys[i]];
        }
        target[keys[keys.length - 1]] = value;
        return this.write(config);
    }

    /** Invalidate cache */
    invalidate() {
        this._cache = null;
    }
}

module.exports = { ConfigManager, CONFIG_DIR, CONFIG_FILE, DEFAULT_CONFIG };
