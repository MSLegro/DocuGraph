import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  Save,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize,
  Maximize2,
  Minimize2,
  Hand,
  Palette,
  PanelLeftClose,
  PanelLeftOpen,
  Copy,
  Check,
  Download,
  AlertCircle,
  Loader2,
  Sparkles,
  ChevronDown,
  Star
} from 'lucide-react';
import type { DiagramItem, DiagramContentResponse, MermaidTheme, CanvasBgTheme } from '../types';
import { ApiClient } from '../api/client';
import { useTheme, CANVAS_BG_CONFIG } from '../context/ThemeContext';
import { normalizeSvg } from '../utils/svg-utils';

interface DiagramCanvasEditorProps {
  diagram: DiagramItem | null;
  onClose: () => void;
  onSaved: () => void;
  onToggleFavorite?: (diagram: DiagramItem) => void;
}

const MERMAID_SNIPPETS = [
  { label: '+ Node', code: '  A[Node Description]\n' },
  { label: '+ Decision', code: '  B{Condition?}\n' },
  { label: '+ Database', code: '  DB[(Database Cache)]\n' },
  { label: '+ Subgraph', code: '  subgraph GroupName\n    S1[Service 1]\n  end\n' }
];

const MERMAID_THEMES: Array<{ id: MermaidTheme; label: string }> = [
  { id: 'dark', label: 'Mermaid Dark' },
  { id: 'default', label: 'Mermaid Default' },
  { id: 'neutral', label: 'Mermaid Neutral' },
  { id: 'forest', label: 'Mermaid Forest' }
];

export const DiagramCanvasEditor: React.FC<DiagramCanvasEditorProps> = ({
  diagram,
  onClose,
  onSaved,
  onToggleFavorite
}) => {
  const { canvasBg, setCanvasBg } = useTheme();

  const [title, setTitle] = useState('');
  const [code, setCode] = useState('');
  const [initialCode, setInitialCode] = useState('');
  const [initialTitle, setInitialTitle] = useState('');
  const [svgContent, setSvgContent] = useState('');
  const [mermaidTheme, setMermaidTheme] = useState<MermaidTheme>('dark');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showBgSelector, setShowBgSelector] = useState(false);
  const [isPanMode, setIsPanMode] = useState(false);

  // Pan & Zoom state
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);
  const svgWrapperRef = useRef<HTMLDivElement>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);

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
        setSvgContent(normalizeSvg(data.svgContent));
        if (data.meta.theme) {
          setMermaidTheme(data.meta.theme);
        }
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
      diagram.folderPath,
      mermaidTheme
    );

    setSaving(false);

    if (!res.success) {
      setErrorMessage(res.error || 'Mermaid compilation failed.');
    } else {
      if (res.svgContent) {
        setSvgContent(normalizeSvg(res.svgContent));
      }
      setInitialTitle(title.trim());
      setInitialCode(code.trim());
      setErrorMessage(null);
      onSaved();
    }
  }, [diagram, saving, title, code, mermaidTheme, onSaved]);

  // Keyboard shortcut Ctrl+S / Cmd+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
      if (e.key === 'Escape') {
        if (document.fullscreenElement) {
          document.exitFullscreen();
        } else {
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave, onClose]);

  // Fullscreen listener
  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      if (editorContainerRef.current) {
        editorContainerRef.current.requestFullscreen().catch(() => {
          document.documentElement.requestFullscreen().catch(() => {});
        });
      } else {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  /**
   * Helper to inspect intrinsic dimensions of the rendered Mermaid SVG diagram
   */
  const getDiagramDimensions = useCallback((): { width: number; height: number } => {
    const svgEl = svgWrapperRef.current?.querySelector('svg');
    if (svgEl) {
      // 1. Try SVG viewBox baseVal
      const viewBox = svgEl.viewBox?.baseVal;
      if (viewBox && viewBox.width > 0 && viewBox.height > 0) {
        return { width: viewBox.width, height: viewBox.height };
      }

      // 2. Try viewBox attribute string (e.g. "0 0 800 600")
      const viewBoxAttr = svgEl.getAttribute('viewBox');
      if (viewBoxAttr) {
        const parts = viewBoxAttr.split(/[\s,]+/).map(parseFloat).filter((n) => !isNaN(n));
        if (parts.length >= 4 && parts[2] > 0 && parts[3] > 0) {
          return { width: parts[2], height: parts[3] };
        }
      }

      // 3. Try getBBox
      try {
        const bbox = svgEl.getBBox();
        if (bbox.width > 0 && bbox.height > 0) {
          return { width: bbox.width, height: bbox.height };
        }
      } catch {}

      // 4. Try getBoundingClientRect relative to current scale
      const rect = svgEl.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        return { width: rect.width / (scale || 1), height: rect.height / (scale || 1) };
      }
    }

    return { width: 800, height: 600 };
  }, [scale]);

  /**
   * Zooms inward or outward based on the center of the diagram
   */
  const zoomFromCenter = useCallback(
    (factor: number) => {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const viewWidth = rect.width;
      const viewHeight = rect.height;

      // Current screen center coordinates of the diagram
      const currentCenterX = pan.x + (viewWidth / 2) * scale;
      const currentCenterY = pan.y + (viewHeight / 2) * scale;

      const newScale = Math.min(Math.max(scale * factor, 0.15), 6);

      // Keep the center of the diagram anchored at its exact screen position
      const newPanX = currentCenterX - (currentCenterX - pan.x) * (newScale / scale);
      const newPanY = currentCenterY - (currentCenterY - pan.y) * (newScale / scale);

      setScale(newScale);
      setPan({ x: newPanX, y: newPanY });
    },
    [scale, pan]
  );

  /**
   * Zoom In (+) anchored to the center of the diagram
   */
  const handleZoomIn = () => {
    zoomFromCenter(1.2);
  };

  /**
   * Zoom Out (-) anchored to the center of the diagram
   */
  const handleZoomOut = () => {
    zoomFromCenter(1 / 1.2);
  };

  /**
   * Reset (1:1) - restores scale to 100% and centers coordinates
   */
  const handleResetZoom = () => {
    setScale(1);
    setPan({ x: 0, y: 0 });
  };

  /**
   * Fit to Screen (Maximize) - automatically fits diagram to viewport and centers it
   */
  const handleFitToScreen = useCallback(() => {
    if (!canvasRef.current) return;

    const canvasRect = canvasRef.current.getBoundingClientRect();
    const viewWidth = canvasRect.width;
    const viewHeight = canvasRect.height;

    if (viewWidth <= 0 || viewHeight <= 0) return;

    const { width: diagWidth, height: diagHeight } = getDiagramDimensions();

    // 60px padding on each side so diagram does not touch borders
    const padding = 60;
    const availableWidth = Math.max(viewWidth - padding * 2, 100);
    const availableHeight = Math.max(viewHeight - padding * 2, 100);

    const fitScale = Math.min(availableWidth / diagWidth, availableHeight / diagHeight);
    // Clamp scale between 0.15 and 1.5 (avoiding distortion on small diagrams)
    const targetScale = Math.min(Math.max(fitScale, 0.15), 1.5);

    // Exact coordinate centering formula:
    // screenCenterX = pan.x + (viewWidth / 2) * targetScale = viewWidth / 2
    // => pan.x = (viewWidth / 2) * (1 - targetScale)
    const centerPanX = (viewWidth / 2) * (1 - targetScale);
    const centerPanY = (viewHeight / 2) * (1 - targetScale);

    setScale(targetScale);
    setPan({ x: centerPanX, y: centerPanY });
  }, [getDiagramDimensions]);

  // Automatically fit and center diagram on initial open
  useEffect(() => {
    if (svgContent && !loading) {
      const timer = setTimeout(() => {
        handleFitToScreen();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [diagram?.id, loading, handleFitToScreen]);

  /**
   * Zoom anchored towards cursor position
   */
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
    const newScale = Math.min(Math.max(scale * zoomFactor, 0.15), 6);

    // Pivot calculation so point under cursor stays fixed
    const newPanX = mouseX - (mouseX - pan.x) * (newScale / scale);
    const newPanY = mouseY - (mouseY - pan.y) * (newScale / scale);

    setScale(newScale);
    setPan({ x: newPanX, y: newPanY });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
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

  const currentBgConfig = CANVAS_BG_CONFIG[canvasBg] || CANVAS_BG_CONFIG['dark-grid'];

  return (
    <div ref={editorContainerRef} className="fixed inset-0 z-50 flex flex-col bg-dark-base text-dark-text animate-in fade-in duration-150">
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

            {onToggleFavorite && (
              <button
                type="button"
                onClick={() => onToggleFavorite(diagram)}
                className={`p-1.5 rounded-lg border transition-all ${
                  diagram.isFavorite
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20 shadow-sm'
                    : 'bg-dark-base border-dark-border text-dark-muted hover:text-amber-400 hover:bg-dark-hover'
                }`}
                title={diagram.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              >
                <Star className={`w-3.5 h-3.5 ${diagram.isFavorite ? 'fill-amber-400' : ''}`} />
              </button>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Mermaid Theme Selector */}
          <select
            value={mermaidTheme}
            onChange={(e) => setMermaidTheme(e.target.value as MermaidTheme)}
            className="bg-dark-base border border-dark-border text-xs text-dark-text rounded-lg px-2.5 py-1.5 focus:border-brand-primary outline-none"
            title="Mermaid Rendering Theme"
          >
            {MERMAID_THEMES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>

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
            <span>Download</span>
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
          className={`flex-1 relative overflow-hidden select-none transition-colors duration-200 ${currentBgConfig.className} ${
            isDragging ? 'cursor-grabbing' : isPanMode ? 'cursor-grab' : 'cursor-default'
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
                  ref={svgWrapperRef}
                  className="max-w-none max-h-none drop-shadow-2xl"
                  dangerouslySetInnerHTML={{
                    __html: svgContent
                  }}
                />
              ) : (
                <div className="p-8 rounded-2xl bg-dark-card border border-dark-border text-center">
                  <p className="text-sm text-dark-muted">No SVG output available. Write code and press Save.</p>
                </div>
              )}
            </div>
          )}

          {/* Floating Canvas Controls Toolbar */}
          <div className="absolute bottom-6 right-6 z-30 flex items-center gap-1.5 bg-dark-card/90 backdrop-blur-md border border-dark-border p-1.5 rounded-2xl shadow-2xl">
            {/* Pan / Hand Mode Toggle */}
            <button
              type="button"
              onClick={() => setIsPanMode(!isPanMode)}
              className={`p-2 rounded-xl transition-colors ${
                isPanMode ? 'bg-brand-primary text-white' : 'text-dark-muted hover:text-white hover:bg-dark-hover'
              }`}
              title="Pan Tool"
            >
              <Hand className="w-4 h-4" />
            </button>

            <div className="w-[1px] h-4 bg-dark-border mx-0.5" />

            {/* Zoom Out */}
            <button
              type="button"
              onClick={handleZoomOut}
              className="p-2 rounded-xl text-dark-muted hover:text-white hover:bg-dark-hover transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>

            {/* Zoom Percentage */}
            <span className="px-2 text-xs font-mono font-medium text-white min-w-[50px] text-center">
              {Math.round(scale * 100)}%
            </span>

            {/* Zoom In */}
            <button
              type="button"
              onClick={handleZoomIn}
              className="p-2 rounded-xl text-dark-muted hover:text-white hover:bg-dark-hover transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>

            <div className="w-[1px] h-4 bg-dark-border mx-0.5" />

            {/* Reset 1:1 */}
            <button
              type="button"
              onClick={handleResetZoom}
              className="p-2 rounded-xl text-dark-muted hover:text-white hover:bg-dark-hover transition-colors"
              title="Reset View 1:1"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Fit to View */}
            <button
              type="button"
              onClick={handleFitToScreen}
              className="p-2 rounded-xl text-dark-muted hover:text-white hover:bg-dark-hover transition-colors"
              title="Fit to Screen"
            >
              <Maximize className="w-4 h-4" />
            </button>

            <div className="w-[1px] h-4 bg-dark-border mx-0.5" />

            {/* Fullscreen Toggle */}
            <button
              type="button"
              onClick={toggleFullscreen}
              className="p-2 rounded-xl text-dark-muted hover:text-white hover:bg-dark-hover transition-colors"
              title={isFullscreen ? 'Exit Full Screen' : 'Full Screen'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <div className="w-[1px] h-4 bg-dark-border mx-0.5" />

            {/* Canvas Background Contrast Selector */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowBgSelector(!showBgSelector)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium text-dark-muted hover:text-white hover:bg-dark-hover transition-colors"
                title="Change Canvas Background for Contrast"
              >
                <Palette className="w-4 h-4" />
                <span className="hidden sm:inline">{currentBgConfig.label}</span>
                <ChevronDown className="w-3 h-3" />
              </button>

              {showBgSelector && (
                <div className="absolute bottom-12 right-0 w-44 rounded-xl bg-dark-card border border-dark-border shadow-2xl p-1.5 flex flex-col gap-1 z-40">
                  <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-dark-muted">
                    Canvas Contrast
                  </div>
                  {Object.entries(CANVAS_BG_CONFIG).map(([key, cfg]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        setCanvasBg(key as CanvasBgTheme);
                        setShowBgSelector(false);
                      }}
                      className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-left transition-colors ${
                        canvasBg === key ? 'bg-brand-primary text-white' : 'text-dark-text hover:bg-dark-hover'
                      }`}
                    >
                      <span className={`w-3 h-3 rounded-full border border-dark-border shrink-0 ${cfg.previewBg}`} />
                      <span>{cfg.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Help navigation hint */}
          <div className="absolute bottom-6 left-6 z-30 hidden lg:flex items-center gap-2 text-[11px] text-dark-muted/80 bg-dark-card/75 backdrop-blur px-3 py-1.5 rounded-xl border border-dark-border/60 pointer-events-none">
            <span>Drag to Pan</span>
            <span>•</span>
            <span>Scroll wheel zooms towards cursor</span>
          </div>
        </main>
      </div>
    </div>
  );
};
