# ⚡ CommandDock

> Panel contextual de comandos para desarrolladores. Detecta tu proyecto y muestra los comandos relevantes.

## Features

- **Detección automática** — Escanea el directorio y detecta Docker, Git, Node.js, Vue, Expo, etc.
- **Ejecución real** — Los comandos se ejecutan via `child_process.exec` desde Electron
- **Variables configurables** — Define IPs, usuarios, tokens y se inyectan con `{{var}}`
- **Persistencia** — Favoritos, historial y comandos custom se guardan en `~/.commanddock/config.json`
- **Command Palette** — `Ctrl+K` para buscar y ejecutar rápidamente
- **Dry Run** — Modo seguro que simula sin ejecutar
- **Terminal integrado** — Output en tiempo real (`Ctrl+J`)

## Stack

| Layer | Tech |
|---|---|
| Main process | Electron + Node.js |
| Renderer | React 18 + Vite |
| Styling | Inline styles (dark theme) |
| Packaging | electron-builder |

## Development

```bash
npm install
npm run electron:dev
```

## Build

```bash
# Windows
npm run electron:build:win

# macOS
npm run electron:build:mac
```

## Shortcuts

| Key | Action |
|---|---|
| `Ctrl+K` | Command palette |
| `Ctrl+J` | Toggle terminal |
| `Ctrl+H` | Toggle history |
| `Esc` | Close panels |

## Project Structure

```
commanddock/
├── electron/
│   ├── main.js          # Main process + IPC handlers
│   ├── preload.js       # Context bridge
│   └── config.js        # ConfigManager (persistence)
├── src/
│   ├── App.jsx          # Main component
│   ├── components/      # UI components
│   ├── data/            # Commands, variables, contexts
│   └── hooks/           # useConfig, useProjectDetection, useCommandExecution
├── index.html
├── vite.config.js
└── package.json
```
