# DocuGraph 📊

> **Local-first, modular, and open-source technical diagram manager**  
> Built for architects, engineers, and technical teams to organize, edit, and render vector workflows locally with zero cloud dependencies, powered by `@mermaid-js/mermaid-cli` and a modern dark UI.

---

## 🌟 Key Features

- **🔒 100% Local & Offline First:** Zero external rendering API calls, zero rate limits, and zero data leakage. All diagram compilations run on local hardware through a sandboxed Chromium instance.
- **🎨 Dual Independent Theming & Contrast Presets:**
  - **App Workspace Themes:** Switch between **Dark Tokyo** (`#12131C` / `#1A1B26`), **Dark Slate**, and **Light Slate**.
  - **Canvas Contrast Presets:** Instant background toggles for high-contrast viewing: **Dark Grid**, **Light Grid**, **Blueprint**, **Neutral Zinc**, **Pure White**, and **Pure Black**.
  - **Mermaid Compiler Themes:** Choose between `dark`, `default`, `neutral`, `forest`, and `base` directly when creating or updating diagrams.
- **⚡ Advanced Canvas Editor & Navigation:**
  - **🎯 Cursor-Anchored Focal Zoom:** Scroll wheel zoom zooms into/away from the exact position of your mouse cursor (Figma / Miro style).
  - **🛠️ Canvas Toolset:** Interactive controls for **Pan tool (Hand)**, **Zoom In / Out**, **Reset (1:1)**, **Fit to Screen**, and **Native Fullscreen**.
  - **Live Mermaid Editor:** Real-time syntax editing with code snippets (`+ Node`, `+ Decision`, `+ Database`, `+ Subgraph`).
  - **Hot Compile Shortcut:** Save & recompile instantly with <kbd>Ctrl + S</kbd> / <kbd>Cmd + S</kbd> while preserving canvas position.
- **⭐ Favorites & Quick Access:**
  - One-click Star toggle on any diagram or folder card, within the quick preview, and inside the full-screen canvas editor.
  - Project-wide **Favorites View** accessible directly from the Top Bar with a real-time count badge.
  - Self-contained persistence: Diagram favorites are saved in `<id>.meta.json`, and folder favorites are saved in `.folder.json`.
- **📁 Semantic Folder Icons & Folder Operations:**
  - **Material Icon Theme Integration:** Folders automatically receive tailored icons & badges based on folder names (`api`, `infra`, `db`, `auth`, `docs`, `web`, `test`, `cloud`, etc.) in the grid and breadcrumbs.
  - **Folder Management:** Full support for **Rename Folder** and **Delete Folder** (with non-empty item warnings).
- **👁️ Tight Bounding Box Previews:** Clean SVG normalization that eliminates excessive white space and fixed width limitations for sharp, pixel-perfect previews.
- **🛡️ Resource Protection (p-limit):** Concurrency queue limiting simultaneous Chromium instances to prevent CPU and RAM spikes.
- **🎯 Clean Syntax Error Filtering:** Chromium stack traces are stripped, isolating readable Mermaid parser errors and reporting them as HTTP `422 Unprocessable Entity`.
- **📂 Structured Local File Triad:** Every diagram is stored as a synchronized triad in `/storage/projects/default/...`:
  1. `<id>.mmd` — Source Mermaid code.
  2. `<id>.svg` — Transparent compiled vector graphic.
  3. `<id>.meta.json` — Metadata (`title`, `diagramType`, `theme`, `createdAt`, `updatedAt`).

---

## 🏗️ Architecture & Monorepo Structure

DocuGraph is structured as a **Turborepo** monorepo managed with **pnpm workspaces**:

```
DocuGraph/
├── apps/
│   ├── api/                     # Backend Fastify + TypeScript (port 3001)
│   │   ├── src/
│   │   │   ├── server.ts        # Fastify server, CORS & REST endpoints
│   │   │   └── index.ts         # Server entrypoint
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── web/                     # Frontend React (Vite) + Tailwind CSS (port 5173)
│       ├── src/
│       │   ├── components/      # TopBar, DiagramCanvasEditor, DiagramGrid, Modals
│       │   ├── api/             # Type-safe API client
│       │   ├── App.tsx          # Workspace coordinator & state
│       │   └── index.css        # Dark theme palette (#12131C / #1A1B26)
│       ├── package.json
│       ├── tailwind.config.cjs
│       └── vite.config.ts
├── packages/
│   └── core/                    # Engine package: local compilation, queue & FS explorer
│       ├── src/
│       │   ├── services/
│       │   │   ├── diagram-service.ts  # Compilation, updates, deletions & triad persistence
│       │   │   └── fs-explorer.ts      # Recursive filesystem explorer & breadcrumbs
│       │   ├── utils/
│       │   │   ├── queue.ts            # Concurrency queue (p-limit)
│       │   │   ├── error-sanitizer.ts  # Parser error extractor
│       │   │   └── diagram-detector.ts # Mermaid diagram type detector
│       │   ├── config.ts               # Storage root & Chromium configuration
│       │   └── types.ts                # Shared domain TypeScript types
│       ├── puppeteer-config.json       # Headless sandbox flags
│       ├── package.json
│       └── tsconfig.json
├── storage/
    └── projects/
        └── default/             # Local file triad storage
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** >= 20.x
- **pnpm** >= 9.x
- **Git**

### Installation

Clone the repository and install dependencies across all workspace packages:

```bash
git clone git@github.com:MSLegro/DocuGraph.git
cd DocuGraph
pnpm install
```

Ensure Puppeteer's headless shell is cached locally:
```bash
pnpm --filter @docugraph/core exec puppeteer browsers install chrome-headless-shell
```

### Running in Development

Start both the Fastify backend API and the React frontend in parallel:

```bash
pnpm dev
```

- **Frontend:** [http://localhost:5173](http://localhost:5173)
- **Backend API:** [http://localhost:3001](http://localhost:3001)

### Building for Production

Build all packages with Turborepo:

```bash
pnpm build
```

---

## 📡 API Reference

| Method | Endpoint | Description | Status Codes |
|---|---|---|---|
| `GET` | `/api/health` | Health check endpoint | `200` |
| `GET` | `/api/tree?folder=<path>` | Lists subfolders and diagrams in the requested directory | `200`, `500` |
| `POST` | `/api/diagrams` | Compiles Mermaid code with theme and creates triad (`.mmd`, `.svg`, `.meta.json`) | `201`, `400`, `422` |
| `PUT` | `/api/diagrams/:id` | Updates diagram title, code, theme, recompiles SVG and updates metadata | `200`, `400`, `422` |
| `DELETE` | `/api/diagrams/:id?folder=<path>` | Permanently deletes diagram triad from filesystem | `200`, `404` |
| `GET` | `/api/diagrams/:id/content?folder=<path>` | Retrieves `.mmd` source, `.svg` vector content and metadata | `200`, `404` |
| `POST` | `/api/folders` | Creates a new physical directory in the active path | `201`, `400` |
| `PUT` | `/api/folders/rename` | Renames an existing folder and migrates stored diagrams | `200`, `400`, `404` |
| `DELETE` | `/api/folders?folder=<path>` | Permanently deletes folder and all diagrams within | `200`, `400`, `404` |
| `POST` | `/api/diagrams/:id/favorite` | Toggles favorite status of a diagram | `200`, `400` |
| `POST` | `/api/folders/favorite` | Toggles favorite status of a folder | `200`, `400` |
| `GET` | `/api/favorites` | Returns all favorited folders and diagrams project-wide | `200`, `500` |

---

## ⌨️ Shortcuts & Navigation

| Shortcut / Action | Action |
|---|---|
| <kbd>Ctrl</kbd> + <kbd>S</kbd> / <kbd>Cmd</kbd> + <kbd>S</kbd> | Save and recompile current diagram in Canvas Editor |
| <kbd>Esc</kbd> | Close Canvas Editor or Preview Modal |
| **Scroll Wheel** | Zoom towards cursor coordinate (Figma / Miro focal zoom) |
| **Mouse Drag (Pan mode or Spacebar)** | Pan canvas freely across diagram workspace |
| **Fit to Screen button** | Automatically scale & center diagram to fill canvas viewport |
| **Fullscreen button** | Toggle browser fullscreen for focused diagram architecture sessions |
| **Theme Selector** | Switch workspace theme (Tokyo, Slate, Light) and Canvas contrast presets |

---

## 🔒 Security & Privacy

- **No Remote Calls:** Mermaid compilation is executed entirely locally via `@mermaid-js/mermaid-cli`.
- **Cross-Platform Sandboxing:** Puppeteer arguments include `--no-sandbox`, `--disable-setuid-sandbox`, `--disable-dev-shm-usage`, and `--disable-gpu` for secure execution in Windows, macOS, and Linux/Docker.
- **Directory Traversal Protection:** Relative folder paths are strictly sanitized to prevent traversal attacks outside the designated storage root.

---

## 📜 License

Distributed under the **MIT License**. Built exclusively with permissive open-source dependencies (MIT / Apache 2.0).
