import React, { useState } from 'react';
import { X, Play, Loader2, AlertCircle, FileCode, Sparkles, Folder, Palette } from 'lucide-react';
import type { MermaidTheme } from '../types';

interface NewDiagramModalProps {
  isOpen: boolean;
  currentFolder: string;
  onClose: () => void;
  onSubmit: (title: string, code: string, folderPath: string, theme?: MermaidTheme) => Promise<string | null>;
}

const TEMPLATES = [
  {
    name: 'Flowchart',
    code: `graph TD
    A[Client Request] --> B{API Gateway}
    B -->|Authorized| C[DocuGraph Core]
    B -->|Invalid| D[401 Unauthorized]
    C --> E[(Local Storage)]
    C --> F[Headless Chromium]
    F --> G[Vector SVG Output]`
  },
  {
    name: 'Sequence',
    code: `sequenceDiagram
    autonumber
    actor User as User / Browser
    participant API as Fastify Server
    participant Core as DiagramService (p-limit)
    participant CLI as mmdc (Chromium)

    User->>API: POST /api/diagrams
    API->>Core: compileAndSave({ title, code })
    Core->>CLI: Exec headless render
    CLI-->>Core: Generated SVG
    Core-->>API: { meta, svgContent }
    API-->>User: 201 Created`
  },
  {
    name: 'Entity-Rel',
    code: `erDiagram
    PROJECT ||--o{ DIAGRAM : contains
    DIAGRAM ||--|| SOURCE_MMD : defines
    DIAGRAM ||--|| VECTOR_SVG : renders
    DIAGRAM ||--|| METADATA : tracks

    DIAGRAM {
        string id PK
        string title
        string diagramType
        datetime createdAt
        datetime updatedAt
    }`
  },
  {
    name: 'State Diagram',
    code: `stateDiagram-v2
    [*] --> Idle
    Idle --> InQueue: New Compilation Request
    InQueue --> Compiling: Slot acquired (p-limit <= 2)
    Compiling --> Success: SVG Generated
    Compiling --> Error: Parse Failure (422)
    Success --> [*]
    Error --> Idle: Show Clean Error`
  }
];

const THEME_OPTIONS: Array<{ id: MermaidTheme; label: string }> = [
  { id: 'dark', label: 'Dark (Recommended)' },
  { id: 'default', label: 'Default' },
  { id: 'neutral', label: 'Neutral' },
  { id: 'forest', label: 'Forest' }
];

export const NewDiagramModal: React.FC<NewDiagramModalProps> = ({
  isOpen,
  currentFolder,
  onClose,
  onSubmit
}) => {
  const [title, setTitle] = useState('');
  const [theme, setTheme] = useState<MermaidTheme>('dark');
  const [code, setCode] = useState(TEMPLATES[0].code);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !code.trim()) return;

    setLoading(true);
    setErrorMessage(null);

    const error = await onSubmit(title.trim(), code.trim(), currentFolder, theme);
    setLoading(false);

    if (error) {
      setErrorMessage(error);
    } else {
      // Clear and close
      setTitle('');
      setTheme('dark');
      setCode(TEMPLATES[0].code);
      setErrorMessage(null);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="w-full max-w-3xl rounded-2xl bg-dark-card border border-dark-border shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-dark-border bg-dark-card">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand-primary/10 text-brand-glow flex items-center justify-center">
              <FileCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Create New Diagram</h3>
              <p className="text-xs text-dark-muted flex items-center gap-1.5 mt-0.5">
                <Folder className="w-3 h-3 text-dark-muted" />
                Target folder: <span className="font-mono text-white">{currentFolder ? `/${currentFolder}` : '/ (root)'}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-dark-muted hover:text-white hover:bg-dark-hover transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-y-auto p-6 gap-5">
          {/* Title and Theme row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-dark-muted mb-2">
                Diagram Title
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Authentication Flow Architecture"
                className="w-full px-4 py-2.5 rounded-xl bg-dark-base border border-dark-border text-white placeholder-dark-muted/60 text-sm focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-dark-muted mb-2 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5" />
                Mermaid Theme
              </label>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value as MermaidTheme)}
                className="w-full px-3 py-2.5 rounded-xl bg-dark-base border border-dark-border text-white text-sm focus:outline-none focus:border-brand-primary transition-colors"
              >
                {THEME_OPTIONS.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Template Quick Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-dark-muted flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-brand-glow" />
                Quick Templates
              </label>
            </div>
            <div className="flex flex-wrap gap-2">
              {TEMPLATES.map((tmpl) => (
                <button
                  type="button"
                  key={tmpl.name}
                  onClick={() => setCode(tmpl.code)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-dark-base border border-dark-border hover:border-brand-primary/50 text-dark-text hover:text-white transition-all"
                >
                  {tmpl.name}
                </button>
              ))}
            </div>
          </div>

          {/* Mermaid Code Editor */}
          <div className="flex-1 flex flex-col min-h-[220px]">
            <label className="block text-xs font-semibold uppercase tracking-wider text-dark-muted mb-2">
              Mermaid Source Code (.mmd)
            </label>
            <textarea
              required
              rows={11}
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                if (errorMessage) setErrorMessage(null);
              }}
              placeholder="Type your Mermaid syntax here..."
              className="w-full flex-1 px-4 py-3 rounded-xl bg-dark-base border border-dark-border text-emerald-300 font-mono text-xs leading-relaxed focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-colors resize-none"
              spellCheck={false}
            />
          </div>

          {/* Syntax Error Alert (422) */}
          {errorMessage && (
            <div className="rounded-xl bg-rose-500/10 border border-rose-500/30 p-4 animate-in fade-in duration-200">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-rose-400 mb-1">
                    Mermaid Syntax Error (422)
                  </h4>
                  <pre className="text-xs font-mono text-rose-200/90 whitespace-pre-wrap bg-rose-950/40 p-2.5 rounded-lg border border-rose-500/20 overflow-x-auto">
                    {errorMessage}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* Modal Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-dark-border/60">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-xl text-sm font-medium bg-transparent text-dark-muted hover:text-white hover:bg-dark-hover transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading || !title.trim() || !code.trim()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-brand-primary text-white hover:bg-brand-hover shadow-lg shadow-brand-primary/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Compiling with CLI...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>Compile & Save</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
