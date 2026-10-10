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
import { useLanguage } from '../context/LanguageContext';

interface DiagramCanvasEditorProps {
  diagram: DiagramItem | null;
  onClose: () => void;
  onSaved: () => void;
  onToggleFavorite?: (diagram: DiagramItem) => void;
}

export const DiagramCanvasEditor: React.FC<DiagramCanvasEditorProps> = ({
  diagram,
  onClose,
  onSaved,
  onToggleFavorite
}) => {
  const { canvasBg, setCanvasBg } = useTheme();
  const { t } = useLanguage();

  const DIAGRAM_SNIPPETS = [
    { label: t('snippetNode'), code: '  A[Node Description]\n' },
    { label: t('snippetDecision'), code: '  B{Condition?}\n' },
    { label: t('snippetDatabase'), code: '  DB[(Database Cache)]\n' },
    { label: t('snippetSubgraph'), code: '  subgraph GroupName\n    S1[Service 1]\n  end\n' }
  ];

  const DIAGRAM_THEMES: Array<{ id: MermaidTheme; label: string }> = [
    { id: 'dark', label: t('themeDark') },
    { id: 'default', label: t('themeDefault') },
    { id: 'neutral', label: t('themeNeutral') },
    { id: 'forest', label: t('themeForest') }
  ];

  const [title, setTitle] = useState('');
  const [code, setCode] = useState('');
  const [initialCode, setInitialCode] = useState('');
  const [initialTitle, setInitialTitle] = useState('');
  const [svgContent, setSvgContent] = useState('');
  const [diagramTheme, setDiagramTheme] = useState<MermaidTheme>('dark');
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
  const scaleRef = useRef(scale);
  scaleRef.current = scale;
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const panRef = useRef(pan);
  panRef.current = pan;
  const [diagramDimensions, setDiagramDimensions] = useState<{ width: number; height: number }>({ width: 800, height: 600 });
  const dimensionsRef = useRef(diagramDimensions);
  dimensionsRef.current = diagramDimensions;
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
          setDiagramTheme(data.meta.theme);
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
      diagramTheme
    );

    setSaving(false);

    if (!res.success) {
      setErrorMessage(res.error || 'Diagram compilation failed.');
    } else {
      if (res.svgContent) {
        setSvgContent(normalizeSvg(res.svgContent));
      }
      setInitialTitle(title.trim());
      setInitialCode(code.trim());
      setErrorMessage(null);
      onSaved();
    }
  }, [diagram, saving, title, code, diagramTheme, onSaved]);

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
        return { width: Math.round(viewBox.width), height: Math.round(viewBox.height) };
      }

      // 2. Try viewBox attribute string (e.g. "0 0 800 600" or "-182 -10 1612 2119")
      const viewBoxAttr = svgEl.getAttribute('viewBox');
      if (viewBoxAttr) {
        const parts = viewBoxAttr.split(/[\s,]+/).map(parseFloat).filter((n) => !isNaN(n));
        if (parts.length >= 4 && parts[2] > 0 && parts[3] > 0) {
          return { width: Math.round(parts[2]), height: Math.round(parts[3]) };
        }
      }

      // 3. Try getBBox
      try {
        const bbox = svgEl.getBBox();
        if (bbox.width > 0 && bbox.height > 0) {
          return { width: Math.round(bbox.width), height: Math.round(bbox.height) };
        }
      } catch {}

      // 4. Try width and height attributes
      const wAttr = parseFloat(svgEl.getAttribute('width') || '');
      const hAttr = parseFloat(svgEl.getAttribute('height') || '');
      if (!isNaN(wAttr) && !isNaN(hAttr) && wAttr > 0 && hAttr > 0) {
        return { width: Math.round(wAttr), height: Math.round(hAttr) };
      }
    }

    // 5. Parse from svgContent string
    if (svgContent) {
      const viewBoxMatch = svgContent.match(/viewBox=["']\s*([^\s,"']+)\s+([^\s,"']+)\s+([^\s,"']+)\s+([^\s,"']+)\s*["']/i);
      if (viewBoxMatch) {
        const w = parseFloat(viewBoxMatch[3]);
        const h = parseFloat(viewBoxMatch[4]);
        if (!isNaN(w) && !isNaN(h) && w > 0 && h > 0) {
          return { width: Math.round(w), height: Math.round(h) };
        }
      }
    }

    return dimensionsRef.current.width > 0 ? dimensionsRef.current : { width: 800, height: 600 };
  }, [svgContent]);

  // Keep diagramDimensions updated when SVG content loads
  useEffect(() => {
    if (svgContent) {
      const dims = getDiagramDimensions();
      setDiagramDimensions(dims);
    }
  }, [svgContent, getDiagramDimensions]);

  /**
   * Zooms inward or outward anchored strictly to the center of the viewport
   */
  const zoomFromCenter = useCallback((factor: number) => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const curScale = scaleRef.current;
    const curPan = panRef.current;

    const newScale = Math.min(Math.max(curScale * factor, 0.05), 10);
    if (newScale === curScale) return;

    // Anchor zoom to the exact center of the viewport (symmetrical in all directions)
    const newPanX = centerX - (centerX - curPan.x) * (newScale / curScale);
    const newPanY = centerY - (centerY - curPan.y) * (newScale / curScale);

    scaleRef.current = newScale;
    panRef.current = { x: newPanX, y: newPanY };

    setScale(newScale);
    setPan({ x: newPanX, y: newPanY });
  }, []);

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
   * Reset (1:1) - restores scale to 100% (true size) and centers diagram in viewport
   */
  const handleResetZoom = useCallback(() => {
    if (!canvasRef.current) {
      setScale(1);
      setPan({ x: 0, y: 0 });
      return;
    }

    const canvasRect = canvasRef.current.getBoundingClientRect();
    const viewWidth = canvasRect.width;
    const viewHeight = canvasRect.height;

    const dims = getDiagramDimensions();
    setDiagramDimensions(dims);

    const targetScale = 1;
    const centerPanX = (viewWidth - dims.width) / 2;
    const centerPanY = (viewHeight - dims.height) / 2;

    scaleRef.current = targetScale;
    panRef.current = { x: centerPanX, y: centerPanY };

    setScale(targetScale);
    setPan({ x: centerPanX, y: centerPanY });
  }, [getDiagramDimensions]);

  /**
   * Fit to Screen (Maximize) - fits the entire diagram inside the viewport with clean margins and centers it
   */
  const handleFitToScreen = useCallback(() => {
    if (!canvasRef.current) return;

    const canvasRect = canvasRef.current.getBoundingClientRect();
    const viewWidth = canvasRect.width;
    const viewHeight = canvasRect.height;

    if (viewWidth <= 0 || viewHeight <= 0) return;

    const dims = getDiagramDimensions();
    setDiagramDimensions(dims);
    const diagWidth = dims.width;
    const diagHeight = dims.height;

    if (diagWidth <= 0 || diagHeight <= 0) return;

    // 48px padding for breathing room
    const padding = 48;
    const availableWidth = Math.max(viewWidth - padding * 2, 50);
    const availableHeight = Math.max(viewHeight - padding * 2, 50);

    const fitScale = Math.min(availableWidth / diagWidth, availableHeight / diagHeight);
    const targetScale = Math.min(Math.max(fitScale, 0.05), 5.0);

    const screenWidth = diagWidth * targetScale;
    const screenHeight = diagHeight * targetScale;

    const centerPanX = (viewWidth - screenWidth) / 2;
    const centerPanY = (viewHeight - screenHeight) / 2;

    scaleRef.current = targetScale;
    panRef.current = { x: centerPanX, y: centerPanY };

    setScale(targetScale);
    setPan({ x: centerPanX, y: centerPanY });
  }, [getDiagramDimensions]);

  // Track which diagram was already fitted so we only fit ONCE on initial open
  const fittedDiagramIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (svgContent && !loading && diagram?.id) {
      if (fittedDiagramIdRef.current !== diagram.id) {
        fittedDiagramIdRef.current = diagram.id;
        const timer = setTimeout(() => {
          handleFitToScreen();
        }, 50);
        return () => clearTimeout(timer);
      }
    }
  }, [svgContent, loading, diagram?.id, handleFitToScreen]);

  /**
   * Zoom anchored towards cursor position on mouse wheel (Focal Zoom)
   */
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const curScale = scaleRef.current;
    const curPan = panRef.current;

    const zoomFactor = e.deltaY < 0 ? 1.15 : (1 / 1.15);
    const newScale = Math.min(Math.max(curScale * zoomFactor, 0.05), 10);

    if (newScale === curScale) return;

    // Focal Zoom: Keeps the exact point under cursor pinned on screen
    const newPanX = mouseX - (mouseX - curPan.x) * (newScale / curScale);
    const newPanY = mouseY - (mouseY - curPan.y) * (newScale / curScale);

    scaleRef.current = newScale;
    panRef.current = { x: newPanX, y: newPanY };

    setScale(newScale);
    setPan({ x: newPanX, y: newPanY });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0 || e.button === 1) {
      setIsDragging(true);
      dragStartRef.current = {
        x: e.clientX - panRef.current.x,
        y: e.clientY - panRef.current.y
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
            title={isEditorOpen ? t('collapseEditorPanel') : t('expandEditorPanel')}
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
              placeholder={t('diagramTitlePlaceholder')}
            />

            {hasUnsavedChanges ? (
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
                {t('statusUnsaved')}
              </span>
            ) : (
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                {t('statusSaved')}
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
                title={diagram.isFavorite ? t('removeFromFavorites') : t('addToFavorites')}
              >
                <Star className={`w-3.5 h-3.5 ${diagram.isFavorite ? 'fill-amber-400' : ''}`} />
              </button>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Theme Selector */}
          <select
            value={diagramTheme}
            onChange={(e) => setDiagramTheme(e.target.value as MermaidTheme)}
            className="bg-dark-base border border-dark-border text-xs text-dark-text rounded-lg px-2.5 py-1.5 focus:border-brand-primary outline-none"
            title={t('diagramThemeLabel')}
          >
            {DIAGRAM_THEMES.map((tTheme) => (
              <option key={tTheme.id} value={tTheme.id}>
                {tTheme.label}
              </option>
            ))}
          </select>

          {/* Copy MMD */}
          <button
            type="button"
            onClick={handleCopyCode}
            disabled={!code}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-dark-base border border-dark-border hover:bg-dark-hover text-dark-text hover:text-white transition-all disabled:opacity-50"
            title={t('btnCopyCode')}
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? t('btnCopied') : t('btnCopyCode')}</span>
          </button>

          {/* Download SVG */}
          <button
            type="button"
            onClick={handleDownloadSvg}
            disabled={!svgContent}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-dark-base border border-dark-border hover:bg-dark-hover text-dark-text hover:text-white transition-all disabled:opacity-50"
            title={t('btnDownload')}
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t('btnDownload')}</span>
          </button>

          {/* Save & Recompile */}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !title.trim() || !code.trim()}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-brand-primary text-white hover:bg-brand-hover shadow-lg shadow-brand-primary/20 disabled:opacity-50 transition-all hover:scale-[1.02]"
            title={t('btnSaveCompile')}
          >
            {saving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>{t('btnCompiling')}</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>{t('btnSaveCompile')}</span>
              </>
            )}
          </button>

          {/* Close Editor */}
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-dark-muted hover:text-white hover:bg-dark-hover transition-colors ml-1"
            title={t('exitCanvasTooltip')}
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
                {t('canvasCodeEditorTitle')}
              </span>

              {/* Snippets pills */}
              <div className="flex items-center gap-1">
                {DIAGRAM_SNIPPETS.map((snip) => (
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
                placeholder={t('diagramSourceCodePlaceholder')}
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
                      {t('syntaxErrorTitle')}
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
              <span>{t('pressCtrlSToCompile')}</span>
              <span className="font-mono text-dark-muted/80">{code.split('\n').length} {t('linesCount')}</span>
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
              <span className="text-sm">{t('loadingCanvas')}</span>
            </div>
          ) : (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
                transformOrigin: '0 0',
                transition: isDragging ? 'none' : 'transform 0.08s ease-out',
                pointerEvents: 'none'
              }}
            >
              {svgContent ? (
                <div
                  ref={svgWrapperRef}
                  style={{
                    width: `${diagramDimensions.width}px`,
                    height: `${diagramDimensions.height}px`,
                  }}
                  className="drop-shadow-2xl"
                  dangerouslySetInnerHTML={{
                    __html: svgContent
                  }}
                />
              ) : (
                <div className="p-8 rounded-2xl bg-dark-card border border-dark-border text-center">
                  <p className="text-sm text-dark-muted">{t('noSvgAvailableCanvas')}</p>
                </div>
              )}
            </div>
          )}

          {/* Floating Canvas Controls Toolbar */}
          <div
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            className="absolute bottom-6 right-6 z-30 flex items-center gap-1.5 bg-dark-card/90 backdrop-blur-md border border-dark-border p-1.5 rounded-2xl shadow-2xl"
          >
            {/* Pan / Hand Mode Toggle */}
            <button
              type="button"
              onClick={() => setIsPanMode(!isPanMode)}
              className={`p-2 rounded-xl transition-colors ${
                isPanMode ? 'bg-brand-primary text-white' : 'text-dark-muted hover:text-white hover:bg-dark-hover'
              }`}
              title={t('panToolTooltip')}
            >
              <Hand className="w-4 h-4" />
            </button>

            <div className="w-[1px] h-4 bg-dark-border mx-0.5" />

            {/* Zoom Out */}
            <button
              type="button"
              onClick={handleZoomOut}
              className="p-2 rounded-xl text-dark-muted hover:text-white hover:bg-dark-hover transition-colors"
              title={t('zoomOutTooltip')}
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
              title={t('zoomInTooltip')}
            >
              <ZoomIn className="w-4 h-4" />
            </button>

            <div className="w-[1px] h-4 bg-dark-border mx-0.5" />

            {/* Reset 1:1 */}
            <button
              type="button"
              onClick={handleResetZoom}
              className="p-2 rounded-xl text-dark-muted hover:text-white hover:bg-dark-hover transition-colors"
              title={t('resetViewTooltip')}
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Fit to View */}
            <button
              type="button"
              onClick={handleFitToScreen}
              className="p-2 rounded-xl text-dark-muted hover:text-white hover:bg-dark-hover transition-colors"
              title={t('fitToScreenTooltip')}
            >
              <Maximize className="w-4 h-4" />
            </button>

            <div className="w-[1px] h-4 bg-dark-border mx-0.5" />

            {/* Fullscreen Toggle */}
            <button
              type="button"
              onClick={toggleFullscreen}
              className="p-2 rounded-xl text-dark-muted hover:text-white hover:bg-dark-hover transition-colors"
              title={isFullscreen ? t('exitFullScreenTooltip') : t('fullScreenTooltip')}
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
                title={t('canvasContrast')}
              >
                <Palette className="w-4 h-4" />
                <span className="hidden sm:inline">{currentBgConfig.label}</span>
                <ChevronDown className="w-3 h-3" />
              </button>

              {showBgSelector && (
                <div className="absolute bottom-12 right-0 w-44 rounded-xl bg-dark-card border border-dark-border shadow-2xl p-1.5 flex flex-col gap-1 z-40">
                  <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-dark-muted">
                    {t('canvasContrast')}
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
            <span>{t('dragToPanHint')}</span>
            <span>•</span>
            <span>{t('wheelZoomHint')}</span>
          </div>
        </main>
      </div>
    </div>
  );
};
