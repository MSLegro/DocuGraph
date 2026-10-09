# DocuGraph 📊

> **Local-first, modular, and open-source technical diagram manager**  
> Built for architects, engineers, and technical teams to organize, edit, and render vector workflows locally with zero cloud dependencies, powered by `@mermaid-js/mermaid-cli` and a modern dark UI.

---

## 🌟 Key Features

- **🔒 100% Local & Offline First:** Zero external rendering API calls, zero rate limits, and zero data leakage. All diagram compilations run on local hardware through a sandboxed Chromium instance.
- **⚡ Interactive Full-Screen Canvas Editor:**
  - **Pan & Zoom Navigation:** Smooth mouse drag (`pan`) and scroll wheel zoom (`scale`) across a technical grid canvas.
  - **Floating Canvas HUD:** Instant Zoom In, Zoom Out, percentage indicator, and 1:1 View Reset.
  - **Live Mermaid Editor:** Real-time syntax editing with code snippets (`+ Node`, `+ Decision`, `+ Database`, `+ Subgraph`).
  - **Hot Compile Shortcut:** Save & recompile instantly with <kbd>Ctrl + S</kbd> / <kbd>Cmd + S</kbd> while preserving your canvas zoom and pan position.
- **👁️ Quick Preview & Inspection:** Fast modal preview for immediate inspection, code copying, and SVG asset downloading without opening the full editor.
- **🛠️ Full Diagram Operations:** Rename titles, edit Mermaid code, or permanently delete diagrams with a secure confirmation dialog.
- **📁 Hierarchical Folder Navigation:** Organize technical architecture in nested directories with interactive breadcrumbs and diagram counters.
- **🛡️ Resource Protection (p-limit):** Concurrency queue limiting simultaneous Chromium instances to prevent CPU and RAM spikes.
- **🎯 Clean Syntax Error Filtering:** Chromium stack traces are stripped, isolating readable Mermaid parser errors and reporting them as HTTP `422 Unprocessable Entity`.
- **📂 Structured Local File Triad:** Every diagram is stored as a synchronized triad in `/storage/projects/default/...`:
  1. `<id>.mmd` — Source Mermaid code.
  2. `<id>.svg` — Transparent compiled vector graphic.
  3. `<id>.meta.json` — Metadata (`title`, `diagramType`, `createdAt`, `updatedAt`).

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
| `POST` | `/api/diagrams` | Compiles Mermaid code and creates the triad (`.mmd`, `.svg`, `.meta.json`) | `201`, `400`, `422` |
| `PUT` | `/api/diagrams/:id` | Updates diagram title/code, recompiles SVG and updates metadata | `200`, `400`, `422` |
| `DELETE` | `/api/diagrams/:id?folder=<path>` | Permanently deletes diagram triad from filesystem | `200`, `404` |
| `GET` | `/api/diagrams/:id/content?folder=<path>` | Retrieves `.mmd` source, `.svg` vector content and metadata | `200`, `404` |
| `POST` | `/api/folders` | Creates a new physical directory in the active path | `201`, `400` |

---

## ⌨️ Shortcuts & Navigation

| Shortcut / Action | Action |
|---|---|
| <kbd>Ctrl</kbd> + <kbd>S</kbd> / <kbd>Cmd</kbd> + <kbd>S</kbd> | Save and recompile current diagram in Canvas Editor |
| <kbd>Esc</kbd> | Close Canvas Editor or Preview Modal |
| **Mouse Drag** | Pan the canvas freely across the diagram |
| **Scroll Wheel** | Zoom in and zoom out of the vector canvas |
| **Reset Button** | Reset canvas zoom to 100% (1:1) and center coordinates |

---

## 🔒 Security & Privacy

- **No Remote Calls:** Mermaid compilation is executed entirely locally via `@mermaid-js/mermaid-cli`.
- **Cross-Platform Sandboxing:** Puppeteer arguments include `--no-sandbox`, `--disable-setuid-sandbox`, `--disable-dev-shm-usage`, and `--disable-gpu` for secure execution in Windows, macOS, and Linux/Docker.
- **Directory Traversal Protection:** Relative folder paths are strictly sanitized to prevent traversal attacks outside the designated storage root.

---

## 📜 License

Distributed under the **MIT License**. Built exclusively with permissive open-source dependencies (MIT / Apache 2.0).
