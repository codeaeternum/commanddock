// ═══════════════════════════════════════
// i18n — Lightweight internationalization
// ═══════════════════════════════════════

const locales = {
    es: {
        // General
        loading: 'Cargando...',
        cancel: 'Cancelar',
        execute: 'Ejecutar',
        copied: 'Copiado',
        close: 'Cerrar',
        save: 'Guardar',
        reset: 'Resetear',
        search: 'Buscar',
        clear: 'Limpiar',
        open: 'Abrir',

        // Wizard
        wizard_title: 'Bienvenido a CommandDock',
        wizard_subtitle: 'Tu panel de comandos inteligente para desarrollo',
        wizard_start: 'Comenzar →',
        wizard_step_workspace: 'Workspace Root',
        wizard_step_vars: 'Variables',
        wizard_step_preview: 'Preview',
        wizard_workspace_desc: 'Selecciona la carpeta donde están tus proyectos. CommandDock escaneará las subcarpetas para detectar cada proyecto.',
        wizard_vars_title: '⚙ Variables Globales (Quick Setup)',
        wizard_vars_desc: 'Puedes configurar esto después en el panel de configuración.',
        wizard_preview_title: '🎉 ¡Listo!',
        wizard_preview_projects: 'Proyectos detectados:',
        wizard_preview_empty: 'No se detectaron proyectos aún — podrás agregar manualmente.',
        wizard_finish: 'Entrar a CommandDock →',
        wizard_next: 'Siguiente →',
        wizard_back: '← Atrás',
        wizard_browse: '📁 Browse',

        // Project Picker
        picker_title: 'CommandDock',
        picker_subtitle: 'Selecciona un proyecto para comenzar',
        picker_scanning: '⏳ Escaneando...',
        picker_rescan: '🔄 Re-scan',
        picker_no_root: 'No configurado',
        picker_change: 'Cambiar',
        picker_search: '🔍 Buscar proyecto o tecnología...',
        picker_recent: '⏱️ RECIENTES',
        picker_scanning_msg: '⏳ Escaneando proyectos...',
        picker_empty_search: 'Sin resultados para esa búsqueda',
        picker_empty: 'No se encontraron proyectos en esta carpeta',
        picker_manual: '📁 Abrir un proyecto por ruta — o arrastra una carpeta aquí',
        picker_open: 'Abrir →',
        picker_drop: 'Soltar carpeta aquí',
        picker_drop_desc: 'para abrir el proyecto',

        // Command Panel
        panel_detected: 'PROYECTO DETECTADO',
        panel_scanning: 'Escaneando proyecto...',
        panel_quick: '⚡ ACCIONES RÁPIDAS',
        panel_search: (mod) => `🔍 Buscar... (${mod}K para palette)`,
        panel_favorites: '⭐ FAVORITOS',
        panel_dry_on: 'Modo Dry Run activo',
        panel_dry_off: 'Modo normal',
        panel_open_editor: (e) => `Abriendo en ${e}...`,
        panel_open_term: 'Abriendo terminal...',

        // Confirm
        confirm_title: 'Comando peligroso',

        // Terminal
        term_executing: (os) => `⏳ Ejecutando en ${os === 'mac' ? 'macOS' : 'Windows'}...`,
        term_completed: '✓ Completado (exit 0)',
        term_dry: '⏸ No se ejecutó (modo dry run activo)',
        term_simulated: 'Simulado',
        term_mock: '(mock) comando simulado en web preview',

        // Config
        config_title: '⚙ Configuración',
        config_scope_global: 'Global',
        config_scope_project: 'Proyecto',
        config_override: 'Override',
        config_reset_var: 'Reset a global',
        config_preview: 'Preview',
        config_configure: (vars) => `Configura: ${vars}`,
        config_exported: 'Config exportada',
        config_imported: 'Config importada ✓',
        config_import_err: 'Error al importar config',

        // History
        history_title: '📜 Historial',
        history_cleared: 'Historial limpiado',
        history_empty: 'Sin historial',

        // CustomCommands
        custom_title: '🛠 Comandos Personalizados',
        custom_add: '+ Añadir comando',
        custom_label: 'Label',
        custom_command: 'Comando',
        custom_desc: 'Descripción',

        // Feedback
        fb_title: 'Enviar Feedback',
        fb_bug: 'Bug',
        fb_feature: 'Feature',
        fb_other: 'Otro',
        fb_placeholder: 'Cuéntanos qué piensas...',
        fb_send: 'Enviar',
        fb_sending: 'Enviando...',
        fb_thanks: '¡Gracias por tu feedback!',
        fb_error: 'Error — intenta de nuevo',

        // Footer
        footer_enjoying: '¿Te gusta CommandDock?',
        footer_kofi: '☕ Invítame un café',
        footer_feedback: '💬 Feedback',
        footer_brand: 'Desarrollado por',
    },

    en: {
        // General
        loading: 'Loading...',
        cancel: 'Cancel',
        execute: 'Execute',
        copied: 'Copied',
        close: 'Close',
        save: 'Save',
        reset: 'Reset',
        search: 'Search',
        clear: 'Clear',
        open: 'Open',

        // Wizard
        wizard_title: 'Welcome to CommandDock',
        wizard_subtitle: 'Your smart command panel for development',
        wizard_start: 'Get Started →',
        wizard_step_workspace: 'Workspace Root',
        wizard_step_vars: 'Variables',
        wizard_step_preview: 'Preview',
        wizard_workspace_desc: 'Select the folder where your projects live. CommandDock will scan subdirectories to detect each project.',
        wizard_vars_title: '⚙ Global Variables (Quick Setup)',
        wizard_vars_desc: 'You can configure these later in the settings panel.',
        wizard_preview_title: '🎉 All Set!',
        wizard_preview_projects: 'Detected projects:',
        wizard_preview_empty: 'No projects detected yet — you can add them manually.',
        wizard_finish: 'Enter CommandDock →',
        wizard_next: 'Next →',
        wizard_back: '← Back',
        wizard_browse: '📁 Browse',

        // Project Picker
        picker_title: 'CommandDock',
        picker_subtitle: 'Select a project to get started',
        picker_scanning: '⏳ Scanning...',
        picker_rescan: '🔄 Re-scan',
        picker_no_root: 'Not configured',
        picker_change: 'Change',
        picker_search: '🔍 Search project or technology...',
        picker_recent: '⏱️ RECENT',
        picker_scanning_msg: '⏳ Scanning projects...',
        picker_empty_search: 'No results for that search',
        picker_empty: 'No projects found in this folder',
        picker_manual: '📁 Open a project by path — or drag a folder here',
        picker_open: 'Open →',
        picker_drop: 'Drop folder here',
        picker_drop_desc: 'to open the project',

        // Command Panel
        panel_detected: 'PROJECT DETECTED',
        panel_scanning: 'Scanning project...',
        panel_quick: '⚡ QUICK ACTIONS',
        panel_search: (mod) => `🔍 Search... (${mod}K for palette)`,
        panel_favorites: '⭐ FAVORITES',
        panel_dry_on: 'Dry Run mode active',
        panel_dry_off: 'Normal mode',
        panel_open_editor: (e) => `Opening in ${e}...`,
        panel_open_term: 'Opening terminal...',

        // Confirm
        confirm_title: 'Dangerous command',

        // Terminal
        term_executing: (os) => `⏳ Running on ${os === 'mac' ? 'macOS' : 'Windows'}...`,
        term_completed: '✓ Completed (exit 0)',
        term_dry: '⏸ Not executed (dry run mode)',
        term_simulated: 'Simulated',
        term_mock: '(mock) simulated command in web preview',

        // Config
        config_title: '⚙ Settings',
        config_scope_global: 'Global',
        config_scope_project: 'Project',
        config_override: 'Override',
        config_reset_var: 'Reset to global',
        config_preview: 'Preview',
        config_configure: (vars) => `Configure: ${vars}`,
        config_exported: 'Config exported',
        config_imported: 'Config imported ✓',
        config_import_err: 'Error importing config',

        // History
        history_title: '📜 History',
        history_cleared: 'History cleared',
        history_empty: 'No history',

        // CustomCommands
        custom_title: '🛠 Custom Commands',
        custom_add: '+ Add command',
        custom_label: 'Label',
        custom_command: 'Command',
        custom_desc: 'Description',

        // Feedback
        fb_title: 'Send Feedback',
        fb_bug: 'Bug',
        fb_feature: 'Feature',
        fb_other: 'Other',
        fb_placeholder: 'Tell us what you think...',
        fb_send: 'Send',
        fb_sending: 'Sending...',
        fb_thanks: 'Thanks for your feedback!',
        fb_error: 'Error — try again',

        // Footer
        footer_enjoying: 'Enjoying CommandDock?',
        footer_kofi: '☕ Buy me a coffee',
        footer_feedback: '💬 Feedback',
        footer_brand: 'Developed by',
    },
};

/** Supported language codes */
export const LANGUAGES = [
    { code: 'es', label: 'Español', flag: '🇪🇸' },
    { code: 'en', label: 'English', flag: '🇺🇸' },
];

/** Get the translation function for a locale */
export function getTranslations(lang = 'es') {
    return locales[lang] || locales.es;
}
