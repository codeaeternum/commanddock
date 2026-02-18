// ═══════════════════════════════════════
// STACK DETECTION — shared constants for
// project technology detection and display
// ═══════════════════════════════════════

/** Map file names → stack label (used by scan-workspace in main.js too) */
export const FILE_TO_STACK = {
    'package.json': 'Node.js',
    'tsconfig.json': 'TypeScript',
    'Dockerfile': 'Docker',
    'docker-compose.yml': 'Docker',
    'docker-compose.yaml': 'Docker',
    'requirements.txt': 'Python',
    'Pipfile': 'Python',
    'pyproject.toml': 'Python',
    'Cargo.toml': 'Rust',
    'go.mod': 'Go',
    'pom.xml': 'Java',
    'build.gradle': 'Java',
    '.git': 'Git',
    'vite.config.js': 'Vite',
    'vite.config.ts': 'Vite',
    'next.config.js': 'Next.js',
    'next.config.mjs': 'Next.js',
    'next.config.ts': 'Next.js',
    'nuxt.config.js': 'Nuxt',
    'nuxt.config.ts': 'Nuxt',
    'angular.json': 'Angular',
    'pubspec.yaml': 'Flutter',
    'Gemfile': 'Ruby',
    'composer.json': 'PHP',
    'tailwind.config.js': 'TailwindCSS',
    'tailwind.config.ts': 'TailwindCSS',
    'postcss.config.js': 'PostCSS',
    'firebase.json': 'Firebase',
    '.firebaserc': 'Firebase',
    'serverless.yml': 'Serverless',
    'turbo.json': 'Turborepo',
    '.env': 'Env Vars',
    'vue.config.js': 'Vue.js',
    'expo.json': 'Expo / RN',
    'app.json': 'React Native',
};

/** Stack → display icon */
export const STACK_ICONS = {
    'Node.js': '📦', 'TypeScript': '🔷', 'Docker': '🐳', 'Python': '🐍',
    'Rust': '🦀', 'Go': '🔵', 'Java': '☕', 'Git': '📂', 'Vite': '⚡',
    'Next.js': '▲', 'Flutter': '🦋', 'Ruby': '💎', 'PHP': '🐘',
    'Angular': '🅰️', 'Nuxt': '💚', 'TailwindCSS': '🎨', 'PostCSS': '🎭',
    'Firebase': '🔥', 'Serverless': '⚡', 'Turborepo': '🔄', 'Env Vars': '🔐',
    'Vue.js': '💚', 'Expo / RN': '📱', 'React Native': '📱',
};

/** Detect stack from a list of file names */
export function detectStackFromFiles(fileNames) {
    const stack = [];
    for (const f of fileNames) {
        const s = FILE_TO_STACK[f];
        if (s && !stack.includes(s)) stack.push(s);
    }
    return stack;
}

/** Stack label → color for badges */
export const STACK_COLORS = {
    'Node.js': '#68a063', 'TypeScript': '#3178c6', 'Docker': '#0db7ed',
    'Python': '#3776ab', 'Rust': '#ce422b', 'Go': '#00add8',
    'Java': '#f89820', 'Git': '#f05032', 'Vite': '#646cff',
    'Next.js': '#ffffff', 'Flutter': '#02569b', 'Ruby': '#cc342d',
    'PHP': '#777bb4', 'Angular': '#dd0031', 'Nuxt': '#00dc82',
    'TailwindCSS': '#06b6d4', 'Firebase': '#ffca28', 'Vue.js': '#42b883',
    'Turborepo': '#ef4444',
};
