import React from 'react';
import { FileCode2, Clock, Eye, Sparkles, Maximize2, Trash2, Star } from 'lucide-react';
import type { DiagramItem } from '../types';
import { normalizeSvg } from '../utils/svg-utils';
import { useLanguage } from '../context/LanguageContext';

interface DiagramGridProps {
  diagrams: DiagramItem[];
  onSelectDiagram: (diagram: DiagramItem) => void;
  onOpenCanvas: (diagram: DiagramItem) => void;
  onDeleteDiagram: (diagram: DiagramItem) => void;
  onOpenNewDiagram: () => void;
  onToggleFavorite?: (diagram: DiagramItem) => void;
}

function formatRelativeTime(dateString: string, lang: 'es' | 'en'): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffSecs = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSecs < 60) return lang === 'es' ? 'hace un momento' : 'just now';
    const diffMins = Math.floor(diffSecs / 60);
    if (diffMins < 60) return `${diffMins}m ${lang === 'es' ? 'atrás' : 'ago'}`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ${lang === 'es' ? 'atrás' : 'ago'}`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 30) return `${diffDays}d ${lang === 'es' ? 'atrás' : 'ago'}`;
    return date.toLocaleDateString();
  } catch {
    return lang === 'es' ? 'recientemente' : 'recently';
  }
}

const TYPE_BADGES: Record<string, { label: string; color: string }> = {
  flowchart: { label: 'Flowchart', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' },
  sequence: { label: 'Sequence', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30' },
  class: { label: 'Class', color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30' },
  state: { label: 'State', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30' },
  er: { label: 'Entity-Rel', color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30' },
  gitGraph: { label: 'Git Graph', color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30' },
  gantt: { label: 'Gantt', color: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/30' },
  mindmap: { label: 'Mindmap', color: 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/30' },
  unknown: { label: 'Diagram', color: 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/30' }
};

export const DiagramGrid: React.FC<DiagramGridProps> = ({
  diagrams,
  onSelectDiagram,
  onOpenCanvas,
  onDeleteDiagram,
  onOpenNewDiagram,
  onToggleFavorite
}) => {
  const { language, t } = useLanguage();

  if (diagrams.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl bg-dark-card border border-dashed border-dark-border mt-4">
        <div className="w-14 h-14 rounded-2xl bg-brand-primary/10 text-brand-primary flex items-center justify-center mb-4">
          <FileCode2 className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-bold text-dark-text mb-1">{t('noDiagramsFound')}</h3>
        <p className="text-sm text-dark-muted max-w-md mb-5">
          {t('noDiagramsSubtitle')}
        </p>
        <button
          type="button"
          onClick={onOpenNewDiagram}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-brand-primary text-white hover:bg-brand-hover shadow-lg shadow-brand-primary/25 transition-all"
        >
          <Sparkles className="w-4 h-4" />
          <span>{t('createFirstDiagram')}</span>
        </button>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xs font-semibold uppercase tracking-wider text-dark-muted mb-3.5 flex items-center gap-2">
        <span>{t('diagramsTitle')}</span>
        <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-dark-border text-dark-muted">
          {diagrams.length}
        </span>
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {diagrams.map(diagram => {
          const badge = TYPE_BADGES[diagram.diagramType] || TYPE_BADGES.unknown;

          return (
            <div
              key={diagram.id}
              onClick={() => onSelectDiagram(diagram)}
              className="group flex flex-col rounded-xl bg-dark-card border border-dark-border hover:border-brand-primary/60 transition-all duration-200 cursor-pointer overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-0.5"
            >
              {/* Preview Container */}
              <div className="relative h-48 w-full bg-slate-900 dark:bg-[#151622] flex items-center justify-center overflow-hidden p-4 border-b border-dark-border group-hover:bg-slate-800 dark:group-hover:bg-[#181928] transition-colors">
                {diagram.svgContent ? (
                  <div
                    className="w-full h-full flex items-center justify-center pointer-events-none transform transition-transform group-hover:scale-105"
                    dangerouslySetInnerHTML={{
                      __html: normalizeSvg(diagram.svgContent)
                    }}
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-dark-muted">
                    <FileCode2 className="w-8 h-8 opacity-40" />
                    <span className="text-xs">{t('noSvgPreview')}</span>
                  </div>
                )}

                {/* Favorite Star Button (Top Right of Preview) */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite?.(diagram);
                  }}
                  className={`absolute top-2.5 right-2.5 z-20 p-1.5 rounded-lg backdrop-blur-md transition-all ${
                    diagram.isFavorite
                      ? 'bg-dark-base/80 text-amber-400 border border-amber-500/30 shadow-md shadow-amber-500/10'
                      : 'bg-dark-base/70 text-dark-muted opacity-0 group-hover:opacity-100 hover:text-amber-400 hover:bg-dark-base border border-dark-border'
                  }`}
                  title={diagram.isFavorite ? t('removeFromFavorites') : t('addToFavorites')}
                >
                  <Star className={`w-3.5 h-3.5 ${diagram.isFavorite ? 'fill-amber-400' : ''}`} />
                </button>

                {/* Hover overlay hint with action buttons */}
                <div className="absolute inset-0 bg-dark-base/70 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity backdrop-blur-[2px]">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectDiagram(diagram);
                    }}
                    className="flex items-center gap-1.5 text-xs font-medium text-white px-3 py-1.5 rounded-xl bg-dark-card/90 border border-dark-border hover:bg-dark-hover transition-colors shadow-lg"
                    title={t('previewTooltip')}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>{t('previewTooltip')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenCanvas(diagram);
                    }}
                    className="flex items-center gap-1.5 text-xs font-semibold text-white px-3 py-1.5 rounded-xl bg-brand-primary hover:bg-brand-hover shadow-lg shadow-brand-primary/20 transition-all"
                    title={t('editCanvasTooltip')}
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>Canvas</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite?.(diagram);
                    }}
                    className={`p-2 rounded-xl bg-dark-card/90 border border-dark-border hover:bg-dark-hover transition-colors shadow-lg ${
                      diagram.isFavorite ? 'text-amber-400' : 'text-dark-muted hover:text-amber-400'
                    }`}
                    title={diagram.isFavorite ? t('removeFromFavorites') : t('addToFavorites')}
                  >
                    <Star className={`w-3.5 h-3.5 ${diagram.isFavorite ? 'fill-amber-400' : ''}`} />
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteDiagram(diagram);
                    }}
                    className="p-2 rounded-xl text-dark-muted hover:text-rose-400 bg-dark-card/90 border border-dark-border hover:bg-rose-500/10 transition-colors shadow-lg"
                    title={t('deleteDiagramTooltip')}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Card Footer Details */}
              <div className="p-4 flex flex-col justify-between flex-1 gap-2.5">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-semibold text-dark-text group-hover:text-brand-primary transition-colors line-clamp-1">
                    {diagram.title}
                  </h3>
                  <span
                    className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border shrink-0 ${badge.color}`}
                  >
                    {badge.label}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-dark-muted pt-2 border-t border-dark-border/40">
                  <span className="font-mono text-[11px] text-dark-muted truncate max-w-[150px]">
                    {diagram.id}.mmd
                  </span>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-dark-muted/70" />
                    <span>{formatRelativeTime(diagram.updatedAt, language)}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
