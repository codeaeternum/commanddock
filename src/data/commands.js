// ═══════════════════════════════════════
// DATA REGISTRY - commands use {{var}} syntax
// ═══════════════════════════════════════

export const CMD_REG = {
    "docker-compose.yml": {
        category: "Docker", icon: "🐳", color: "#0db7ed", collapsed: false, commands: [
            { label: "Build & Up", cmd: "docker compose up -d --build", desc: "Reconstruir y levantar", vars: [] },
            { label: "Stop All", cmd: "docker compose down", desc: "Detener contenedores", danger: true, vars: [] },
            { label: "Logs", cmd: "docker compose logs -f --tail=100", desc: "Ver logs", vars: [] },
            { label: "Restart", cmd: "docker compose restart", desc: "Reiniciar servicios", vars: [] },
            { label: "PS", cmd: "docker compose ps", desc: "Estado de contenedores", vars: [] },
            { label: "Pull", cmd: "docker compose pull", desc: "Descargar imágenes", vars: [] },
        ]
    },
    ".git": {
        category: "Git", icon: "📦", color: "#f05032", collapsed: false, commands: [
            { label: "Status", cmd: "git status", desc: "Ver cambios", vars: [] },
            { label: "Pull", cmd: "git pull {{git_remote}} {{git_branch}}", desc: "Traer cambios", vars: ["git_remote", "git_branch"] },
            { label: "Add All", cmd: "git add .", desc: "Agregar cambios", vars: [] },
            { label: "Commit", cmd: 'git commit -m "{message}"', desc: "Crear commit", input: "message", vars: [] },
            { label: "Push", cmd: "git push {{git_remote}} {{git_branch}}", desc: "Subir cambios", vars: ["git_remote", "git_branch"] },
            { label: "Log", cmd: "git log --oneline --graph -20", desc: "Historial visual", vars: [] },
            { label: "Stash", cmd: "git stash", desc: "Guardar temporal", vars: [] },
            { label: "Reset Hard", cmd: "git reset --hard HEAD", desc: "⚠ Descartar todo", danger: true, vars: [] },
        ]
    },
    "package.json": {
        category: "Node.js", icon: "📗", color: "#68a063", collapsed: false, commands: [
            { label: "Install", cmd: "{{pkg_manager}} install", desc: "Instalar deps", vars: ["pkg_manager"] },
            { label: "Dev", cmd: "{{pkg_manager}} run dev", desc: "Servidor dev", vars: ["pkg_manager"] },
            { label: "Build", cmd: "{{pkg_manager}} run build", desc: "Build producción", vars: ["pkg_manager"] },
            { label: "Lint", cmd: "{{pkg_manager}} run lint", desc: "Verificar estilo", vars: ["pkg_manager"] },
            { label: "Audit", cmd: "{{pkg_manager}} audit fix", desc: "Corregir vulns", vars: ["pkg_manager"] },
        ]
    },
    Dockerfile: {
        category: "Docker Build", icon: "🏗️", color: "#384d54", collapsed: false, commands: [
            { label: "Build", cmd: "docker build -t {{docker_prefix}}/{name} .", desc: "Construir imagen", input: "name", vars: ["docker_prefix"] },
            { label: "Run", cmd: "docker run -d {{docker_prefix}}/{name}", desc: "Ejecutar", input: "name", vars: ["docker_prefix"] },
            { label: "Push Image", cmd: "docker push {{docker_registry}}/{name}", desc: "Subir al registry", input: "name", vars: ["docker_registry"] },
        ]
    },
    "vue.config.js": {
        category: "Vue.js", icon: "💚", color: "#42b883", collapsed: false, commands: [
            { label: "Serve", cmd: "{{pkg_manager}} run serve", desc: "Dev server Vue", vars: ["pkg_manager"] },
            { label: "Build", cmd: "{{pkg_manager}} run build", desc: "Build", vars: ["pkg_manager"] },
        ]
    },
    "expo.json": {
        category: "Expo / RN", icon: "📱", color: "#4630eb", collapsed: false, commands: [
            { label: "Start", cmd: "npx expo start", desc: "Expo dev server", vars: [] },
            { label: "Android", cmd: "npx expo run:android", desc: "Correr Android", vars: [] },
            { label: "iOS", cmd: "npx expo run:ios", desc: "Correr iOS", vars: [] },
            { label: "Build APK", cmd: "eas build --platform android", desc: "Build Android", vars: [] },
        ]
    },
};

export const TAILSCALE_GROUP = {
    category: "Tailscale Remote", icon: "🌐", color: "#4c8bf5", collapsed: false, commands: [
        { label: "SSH Connect", cmd: "ssh {{ssh_user}}@{{ssh_host}}", desc: "Conectar vía Tailscale", vars: ["ssh_user", "ssh_host"] },
        { label: "Remote PS", cmd: "ssh {{ssh_user}}@{{ssh_host}} 'docker ps'", desc: "Contenedores remotos", vars: ["ssh_user", "ssh_host"] },
        { label: "Remote Logs", cmd: "ssh {{ssh_user}}@{{ssh_host}} 'docker compose -f {{remote_project_path}}/docker-compose.yml logs --tail=50'", desc: "Logs remotos", vars: ["ssh_user", "ssh_host", "remote_project_path"] },
        { label: "Restart Remote", cmd: "ssh {{ssh_user}}@{{ssh_host}} 'docker compose -f {{remote_project_path}}/docker-compose.yml restart'", desc: "Reiniciar remotos", danger: true, vars: ["ssh_user", "ssh_host", "remote_project_path"] },
        { label: "TS Status", cmd: "tailscale status", desc: "Dispositivos conectados", vars: [] },
        { label: "File Sync", cmd: "tailscale file cp ./build {{ssh_user}}@{{ssh_host}}:", desc: "Enviar archivos", vars: ["ssh_user", "ssh_host"] },
    ]
};

export const SYS_CMDS = {
    windows: {
        category: "Sistema Windows", icon: "🖥️", color: "#00a4ef", collapsed: false, commands: [
            { label: "Disk", cmd: "wmic logicaldisk get size,freespace,caption", desc: "Espacio en disco", vars: [] },
            { label: "Ports", cmd: "netstat -ano | findstr LISTENING", desc: "Puertos activos", vars: [] },
            { label: "Tasks", cmd: 'tasklist /FI "MEMUSAGE gt 100000"', desc: "Procesos pesados", vars: [] },
        ]
    },
    mac: {
        category: "Sistema macOS", icon: "🍎", color: "#a2aaad", collapsed: false, commands: [
            { label: "Disk", cmd: "df -h", desc: "Espacio en disco", vars: [] },
            { label: "Ports", cmd: "lsof -iTCP -sTCP:LISTEN", desc: "Puertos activos", vars: [] },
            { label: "Top", cmd: "top -l 1 -n 10 -o mem", desc: "Procesos por memoria", vars: [] },
        ]
    },
};

export const DEFAULT_CUSTOM = [];
