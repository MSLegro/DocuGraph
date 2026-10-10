import React, { useState, useEffect } from 'react';
import {
  X,
  Copy,
  Check,
  Download,
  Code2,
  Eye,
  Calendar,
  Tag,
  Loader2,
  Maximize2,
  Trash2,
  Palette,
  ChevronDown,
  Star
} from 'lucide-react';
import type { DiagramItem, DiagramContentResponse, CanvasBgTheme } from '../types';
import { ApiClient } from '../api/client';
import { useTheme, CANVAS_BG_CONFIG } from '../context/ThemeContext';
import { normalizeSvg } from '../utils/svg-utils';

interface DiagramViewerModalProps {
  diagram: DiagramItem | null;
  onClose: () => void;
  onOpenCanvas: (diagram: DiagramItem) => void;
  onDelete: (diagram: DiagramItem) => void;
  onToggleFavorite?: (diagram: DiagramItem) => void;
}

export const DiagramViewerModal: React.FC<DiagramViewerModalProps> = ({
  diagram,
  onClose,
  onOpenCanvas,
  onDelete,
  onToggleFavorite
}) => {
  const { canvasBg, setCanvasBg } = useTheme();

  const [activeTab, setActiveTab] = useState<'svg' | 'code'>('svg');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState<DiagramContentResponse | null>(null);
  const [showBgSelector, setShowBgSelector] = useState(false);

  useEffect(() => {
    if (!diagram) {
      setContent(null);
      return;
    }

    let isMounted = true;
    setLoading(true);

    ApiClient.getDiagramContent(diagram.id, diagram.folderPath)
      .then((data) => {
        if (isMounted) {
          setContent(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error(err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [diagram]);

  if (!diagram) return null;

  const handleCopyCode = async () => {
    if (!content?.code) return;
    try {
      await navigator.clipboard.writeText(content.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard', err);
    }
  };

  const handleDownloadSvg = () => {
    const rawSvg = content?.svgContent || diagram.svgContent;
    if (!rawSvg) return;

    const svgData = normalizeSvg(rawSvg);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${diagram.id}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const rawSvg = content?.svgContent || diagram.svgContent || '';
  const displayedSvg = normalizeSvg(rawSvg);
  const currentBgConfig = CANVAS_BG_CONFIG[canvasBg] || CANVAS_BG_CONFIG['dark-grid'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
      <div 
        className="w-full max-w-6xl h-[90vh] rounded-2xl bg-dark-card border border-dark-border shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-6 py-4 border-b border-dark-border bg-dark-card gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="min-w-0">
              <div className="flex items-center gap-2.5">
                <h2 className="text-lg font-bold text-white truncate">
                  {diagram.title}
                </h2>
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
                    <Star className={`w-4 h-4 ${diagram.isFavorite ? 'fill-amber-400' : ''}`} />
                  </button>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-dark-muted mt-1">
                <span className="flex items-center gap-1 font-mono text-dark-muted/80">
                  <Tag className="w-3 h-3" />
                  {diagram.id}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(diagram.updatedAt).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Action buttons & tabs */}
          <div className="flex items-center gap-2.5 self-end sm:self-auto flex-wrap">
            {/* View switcher */}
            <div className="flex items-center bg-dark-base p-1 rounded-xl border border-dark-border text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('svg')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  activeTab === 'svg'
                    ? 'bg-dark-card text-white shadow-sm'
                    : 'text-dark-muted hover:text-white'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Vector SVG</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('code')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  activeTab === 'code'
                    ? 'bg-dark-card text-white shadow-sm'
                    : 'text-dark-muted hover:text-white'
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>Mermaid Code</span>
              </button>
            </div>

            {/* Canvas Background Contrast Selector (when viewing SVG) */}
            {activeTab === 'svg' && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowBgSelector(!showBgSelector)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-dark-base border border-dark-border hover:bg-dark-hover text-dark-text hover:text-white transition-all"
                  title="Change Background Contrast"
                >
                  <Palette className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">{currentBgConfig.label}</span>
                  <ChevronDown className="w-3 h-3" />
                </button>

                {showBgSelector && (
                  <div className="absolute top-11 right-0 w-44 rounded-xl bg-dark-card border border-dark-border shadow-2xl p-1.5 flex flex-col gap-1 z-40">
                    <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-dark-muted">
                      Preview Contrast
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
            )}

            {/* Open in Canvas Editor Button */}
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenCanvas(diagram);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-brand-primary text-white hover:bg-brand-hover shadow-md shadow-brand-primary/20 transition-all hover:scale-[1.02]"
              title="Open full interactive canvas with editor"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Canvas Editor</span>
            </button>

            {/* Copy MMD */}
            <button
              type="button"
              onClick={handleCopyCode}
              disabled={!content?.code}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-dark-base border border-dark-border hover:bg-dark-hover text-dark-text hover:text-white transition-all disabled:opacity-50"
              title="Copy source .mmd code"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy .mmd'}</span>
            </button>

            {/* Download SVG */}
            <button
              type="button"
              onClick={handleDownloadSvg}
              disabled={!displayedSvg}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-dark-base border border-dark-border hover:bg-dark-hover text-dark-text hover:text-white transition-all disabled:opacity-50"
              title="Download compiled SVG file"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>

            {/* Delete Diagram */}
            <button
              type="button"
              onClick={() => {
                onClose();
                onDelete(diagram);
              }}
              className="p-2 rounded-xl text-dark-muted hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
              title="Delete diagram"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-dark-muted hover:text-white hover:bg-dark-hover transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Viewer Area */}
        <div className="flex-1 overflow-auto relative">
          {loading ? (
            <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-dark-muted">
              <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
              <span className="text-sm">Loading diagram details...</span>
            </div>
          ) : activeTab === 'svg' ? (
            <div className={`w-full h-full min-h-[400px] p-6 flex items-center justify-center overflow-auto transition-colors duration-200 ${currentBgConfig.className}`}>
              {displayedSvg ? (
                <div
                  className="w-full h-full max-w-full max-h-[calc(90vh-140px)] flex items-center justify-center drop-shadow-xl"
                  dangerouslySetInnerHTML={{
                    __html: displayedSvg
                  }}
                />
              ) : (
                <p className="text-sm text-dark-muted">No SVG preview found.</p>
              )}
            </div>
          ) : (
            <div className="w-full h-full bg-dark-base p-6 font-mono text-xs overflow-auto">
              <pre className="text-emerald-300 leading-relaxed select-text">
                {content?.code || 'No source code available.'}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
