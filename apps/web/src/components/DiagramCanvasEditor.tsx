import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  Save,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize,
  PanelLeftClose,
  PanelLeftOpen,
  Copy,
  Check,
  Download,
  AlertCircle,
  Loader2,
  Sparkles,
  Tag
} from 'lucide-react';
import type { DiagramItem, DiagramContentResponse } from '../types';
import { ApiClient } from '../api/client';

interface DiagramCanvasEditorProps {
  diagram: DiagramItem | null;
  onClose: () => void;
  onSaved: () => void;
}

const MERMAID_SNIPPETS = [
  { label: '+ Node', code: '  A[Node Description]\n' },
  { label: '+ Decision', code: '  B{Condition?}\n' },
  { label: '+ Database', code: '  DB[(Database Cache)]\n' },
  { label: '+ Subgraph', code: '  subgraph GroupName\n    S1[Service 1]\n  end\n' }
];

export const DiagramCanvasEditor: React.FC<DiagramCanvasEditorProps> = ({
  diagram,
  onClose,
  onSaved
}) => {
  const [title, setTitle] = useState('');
  const [code, setCode] = useState('');
  const [initialCode, setInitialCode] = useState('');
  const [initialTitle, setInitialTitle] = useState('');
  const [svgContent, setSvgContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(true);

  // Pan & Zoom state
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

  // Load diagram content on mount
  useEffect(() => {
    if (!diagram) return;

    let isMounted = true;
    setLoading(true);
    setErrorMessage(null);

    ApiClient.getDiagramContent(diagram.id, diagram.folderPath)
      .then((data: DiagramContentResponse) => {
        if (!isMounted) return;
        setTitle(data.meta.title);
        setInitialTitle(data.meta.title);
        setCode(data.code);
        setInitialCode(data.code);
        setSvgContent(data.svgContent);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        if (isMounted) {
          setErrorMessage('Failed to load diagram content.');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [diagram]);

  const hasUnsavedChanges = code !== initialCode || title !== initialTitle;

  // Save & Recompile Handler
  const handleSave = useCallback(async () => {
    if (!diagram || saving || !title.trim() || !code.trim()) return;

    setSaving(true);
    setErrorMessage(null);

    const res = await ApiClient.updateDiagram(
      diagram.id,
      title.trim(),
      code.trim(),
      diagram.folderPath
    );

    setSaving(false);

    if (!res.success) {
      setErrorMessage(res.error || 'Mermaid compilation failed.');
    } else {
      if (res.svgContent) {
        setSvgContent(res.svgContent);
      }
      setInitialTitle(title.trim());
      setInitialCode(code.trim());
      setErrorMessage(null);
      onSaved();
    }
  }, [diagram, saving, title, code, onSaved]);

  // Keyboard shortcut Ctrl+S / Cmd+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave, onClose]);

  // Pan & Zoom controls
  const handleZoomIn = () => setScale((prev) => Math.min(prev * 1.25, 5));
  const handleZoomOut = () => setScale((prev) => Math.max(prev / 1.25, 0.2));
  const handleResetZoom = () => {
    setScale(1);
    setPan({ x: 0, y: 0 });
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    setScale((prev) => {
      const next = prev * zoomFactor;
      return Math.min(Math.max(next, 0.2), 5);
    });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    // Only pan on left click or middle click
    if (e.button === 0 || e.button === 1) {
      setIsDragging(true);
      dragStartRef.current = {
        x: e.clientX - pan.x,
        y: e.clientY - pan.y
      };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStartRef.current.x,
        y: e.clientY - dragStartRef.current.y
      });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleCopyCode = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDownloadSvg = () => {
    if (!svgContent) return;
    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${diagram?.id || 'diagram'}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const insertSnippet = (snippet: string) => {
    setCode((prev) => prev + '\n' + snippet);
  };

  if (!diagram) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-dark-base text-dark-text animate-in fade-in duration-150">
      {/* Top Application Bar */}
      <header className="h-14 border-b border-dark-border bg-dark-card/95 backdrop-blur px-4 flex items-center justify-between shrink-0 gap-3 z-20">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => setIsEditorOpen(!isEditorOpen)}
            className="p-2 rounded-lg text-dark-muted hover:text-white hover:bg-dark-hover transition-colors"
            title={isEditorOpen ? 'Collapse Editor Panel' : 'Expand Editor Panel'}
          >
            {isEditorOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeftOpen className="w-5 h-5 text-brand-glow" />}
          </button>

          {/* Editable Title */}
          <div className="flex items-center gap-2 min-w-0">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-transparent font-semibold text-white text-base hover:bg-dark-base/50 focus:bg-dark-base px-2 py-1 rounded-lg border border-transparent focus:border-brand-primary outline-none transition-colors truncate max-w-sm sm:max-w-md"
              placeholder="Diagram Title..."
            />

            {hasUnsavedChanges ? (
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
                Unsaved
              </span>
            ) : (
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                Saved
              </span>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Copy MMD */}
          <button
            type="button"
            onClick={handleCopyCode}
            disabled={!code}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-dark-base border border-dark-border hover:bg-dark-hover text-dark-text hover:text-white transition-all disabled:opacity-50"
            title="Copy Mermaid code"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy .mmd'}</span>
          </button>

          {/* Download SVG */}
          <button
            type="button"
            onClick={handleDownloadSvg}
            disabled={!svgContent}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-dark-base border border-dark-border hover:bg-dark-hover text-dark-text hover:text-white transition-all disabled:opacity-50"
            title="Download vector SVG"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download SVG</span>
          </button>

          {/* Save & Recompile */}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !title.trim() || !code.trim()}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-brand-primary text-white hover:bg-brand-hover shadow-lg shadow-brand-primary/20 disabled:opacity-50 transition-all hover:scale-[1.02]"
            title="Save and compile (Ctrl+S)"
          >
            {saving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Compiling...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Save (Ctrl+S)</span>
              </>
            )}
          </button>

          {/* Close Editor */}
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-dark-muted hover:text-white hover:bg-dark-hover transition-colors ml-1"
            title="Exit Canvas (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Workspace Body */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Side: Code Editor Panel */}
        {isEditorOpen && (
          <aside className="w-full md:w-[420px] lg:w-[480px] border-r border-dark-border bg-dark-card flex flex-col shrink-0 z-10 transition-all animate-in slide-in-from-left-4 duration-200">
            {/* Panel Toolbar */}
            <div className="p-3 border-b border-dark-border/80 flex items-center justify-between bg-dark-base/40">
              <span className="text-xs font-semibold uppercase tracking-wider text-dark-muted flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-brand-glow" />
                Mermaid Code Editor
              </span>

              {/* Snippets pills */}
              <div className="flex items-center gap-1">
                {MERMAID_SNIPPETS.map((snip) => (
                  <button
                    key={snip.label}
                    type="button"
                    onClick={() => insertSnippet(snip.code)}
                    className="px-2 py-0.5 rounded text-[11px] font-medium bg-dark-base border border-dark-border hover:border-brand-primary/50 text-dark-muted hover:text-white transition-colors"
                  >
                    {snip.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Code Textarea */}
            <div className="flex-1 p-3 flex flex-col relative overflow-hidden bg-dark-base">
              <textarea
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                spellCheck={false}
                placeholder="Type your Mermaid syntax here..."
                className="w-full h-full p-3 bg-transparent text-emerald-300 font-mono text-xs leading-relaxed focus:outline-none resize-none selection:bg-brand-primary/40 selection:text-white"
              />
            </div>

            {/* Live Syntax Error Box (HTTP 422) */}
            {errorMessage && (
              <div className="border-t border-rose-500/30 bg-rose-500/10 p-3.5 max-h-48 overflow-y-auto animate-in fade-in duration-150">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wider text-rose-400 mb-1">
                      Mermaid Syntax Error (422)
                    </p>
                    <pre className="text-xs font-mono text-rose-200/90 whitespace-pre-wrap bg-rose-950/50 p-2 rounded border border-rose-500/20 overflow-x-auto">
                      {errorMessage}
                    </pre>
                  </div>
                </div>
              </div>
            )}

            {/* Status Footer */}
            <div className="px-4 py-2 border-t border-dark-border/60 bg-dark-card flex items-center justify-between text-[11px] text-dark-muted">
              <span>Press <kbd className="px-1.5 py-0.5 rounded bg-dark-base border border-dark-border font-mono text-white">Ctrl+S</kbd> to compile</span>
              <span className="font-mono text-dark-muted/80">{code.split('\n').length} lines</span>
            </div>
          </aside>
        )}

        {/* Right Side: Interactive Pan & Zoom Canvas */}
        <main
          ref={canvasRef}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className={`flex-1 relative overflow-hidden bg-diagram-grid bg-dark-base select-none ${
            isDragging ? 'cursor-grabbing' : 'cursor-grab'
          }`}
        >
          {loading ? (
            <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-dark-muted">
              <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
              <span className="text-sm">Loading canvas...</span>
            </div>
          ) : (
            <div
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
                transformOrigin: '0 0',
                transition: isDragging ? 'none' : 'transform 0.05s ease-out'
              }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none p-12"
            >
              {svgContent ? (
                <div
                  className="max-w-none max-h-none drop-shadow-2xl"
                  dangerouslySetInnerHTML={{
                    __html: svgContent.replace(
                      /<svg([^>]+)>/,
                      '<svg$1 style="max-width: 100%; max-height: 100%; width: auto; height: auto;">'
                    )
                  }}
                />
              ) : (
                <div className="p-8 rounded-2xl bg-dark-card border border-dark-border text-center">
                  <p className="text-sm text-dark-muted">No SVG output available. Write code and press Save.</p>
                </div>
              )}
            </div>
          )}

          {/* Floating Canvas Controls */}
          <div className="absolute bottom-6 right-6 z-30 flex items-center gap-1.5 bg-dark-card/90 backdrop-blur-md border border-dark-border p-1.5 rounded-2xl shadow-2xl">
            <button
              type="button"
              onClick={handleZoomOut}
              className="p-2 rounded-xl text-dark-muted hover:text-white hover:bg-dark-hover transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>

            <span className="px-2 text-xs font-mono font-medium text-white min-w-[50px] text-center">
              {Math.round(scale * 100)}%
            </span>

            <button
              type="button"
              onClick={handleZoomIn}
              className="p-2 rounded-xl text-dark-muted hover:text-white hover:bg-dark-hover transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>

            <div className="w-[1px] h-4 bg-dark-border mx-1" />

            <button
              type="button"
              onClick={handleResetZoom}
              className="p-2 rounded-xl text-dark-muted hover:text-white hover:bg-dark-hover transition-colors"
              title="Reset View 1:1"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Help navigation hint */}
          <div className="absolute bottom-6 left-6 z-30 hidden lg:flex items-center gap-2 text-[11px] text-dark-muted/80 bg-dark-card/75 backdrop-blur px-3 py-1.5 rounded-xl border border-dark-border/60 pointer-events-none">
            <span>Drag to Pan</span>
            <span>•</span>
            <span>Scroll wheel to Zoom</span>
          </div>
        </main>
      </div>
    </div>
  );
};
