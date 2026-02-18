// ═══════════════════════════════════════
// CONFIG VARIABLES SCHEMA
// ═══════════════════════════════════════
export const VAR_SCHEMA = {
    ssh_user: { label: "SSH Usuario", desc: "Usuario para conexiones SSH remotas", group: "Tailscale / SSH", placeholder: "daniel", test: "echo" },
    ssh_host: { label: "SSH Hostname", desc: "Hostname del servidor en Tailscale", group: "Tailscale / SSH", placeholder: "minisforum-n5", test: "ping" },
    ssh_ip: { label: "Tailscale IP", desc: "IP del servidor en la red Tailscale", group: "Tailscale / SSH", placeholder: "100.64.0.1", test: "ping" },
    remote_project_path: { label: "Ruta remota proyectos", desc: "Directorio base de proyectos en el servidor", group: "Tailscale / SSH", placeholder: "/home/daniel/projects" },
    git_user: { label: "Git Nombre", desc: "Nombre para commits de Git", group: "Git", placeholder: "Daniel Galindo" },
    git_email: { label: "Git Email", desc: "Email para commits de Git", group: "Git", placeholder: "daniel@example.com" },
    git_branch: { label: "Branch default", desc: "Rama principal (main/master)", group: "Git", placeholder: "main" },
    git_remote: { label: "Remote name", desc: "Nombre del remote principal", group: "Git", placeholder: "origin" },
    docker_registry: { label: "Docker Registry", desc: "URL del registro de imágenes", group: "Docker", placeholder: "docker.io/username" },
    docker_prefix: { label: "Prefijo imágenes", desc: "Prefijo para nombres de imágenes", group: "Docker", placeholder: "galindo" },
    pkg_manager: { label: "Package Manager", desc: "Manejador de paquetes Node", group: "Node.js", placeholder: "npm", options: ["npm", "yarn", "pnpm"] },
    editor: { label: "Editor", desc: "Editor de código preferido", group: "General", placeholder: "code", options: ["code", "vim", "nano", "nvim", "cursor"] },
    shell: { label: "Shell", desc: "Shell preferida", group: "General", placeholder: "zsh", options: ["bash", "zsh", "fish", "powershell"] },
    cf_tunnel_name: { label: "Cloudflare Tunnel", desc: "Nombre del túnel de Cloudflare", group: "Cloudflare", placeholder: "my-tunnel" },
};

export const DEFAULT_VARS = Object.fromEntries(
    Object.entries(VAR_SCHEMA).map(([k, v]) => [k, v.placeholder])
);
