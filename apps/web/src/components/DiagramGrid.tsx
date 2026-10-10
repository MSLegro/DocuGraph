import React from 'react';
import { FileCode2, Clock, Eye, Sparkles, Maximize2, Trash2 } from 'lucide-react';
import type { DiagramItem } from '../types';
import { normalizeSvg } from '../utils/svg-utils';

interface DiagramGridProps {
  diagrams: DiagramItem[];
  onSelectDiagram: (diagram: DiagramItem) => void;
  onOpenCanvas: (diagram: DiagramItem) => void;
  onDeleteDiagram: (diagram: DiagramItem) => void;
  onOpenNewDiagram: () => void;
}

function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffSecs = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSecs < 60) return 'just now';
    const diffMins = Math.floor(diffSecs / 60);
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 30) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  } catch {
    return 'recently';
  }
}

const TYPE_BADGES: Record<string, { label: string; color: string }> = {
  flowchart: { label: 'Flowchart', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  sequence: { label: 'Sequence', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  class: { label: 'Class', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  state: { label: 'State', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  er: { label: 'Entity-Rel', color: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
  gitGraph: { label: 'Git Graph', color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
  gantt: { label: 'Gantt', color: 'bg-teal-500/10 text-teal-400 border-teal-500/20' },
  mindmap: { label: 'Mindmap', color: 'bg-pink-500/10 text-pink-400 border-pink-500/20' },
  unknown: { label: 'Diagram', color: 'bg-gray-500/10 text-gray-400 border-gray-500/20' }
};

export const DiagramGrid: React.FC<DiagramGridProps> = ({
  diagrams,
  onSelectDiagram,
  onOpenCanvas,
  onDeleteDiagram,
  onOpenNewDiagram
}) => {
  if (diagrams.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl bg-dark-card/40 border border-dashed border-dark-border mt-4">
        <div className="w-14 h-14 rounded-2xl bg-brand-primary/10 text-brand-glow flex items-center justify-center mb-4">
          <FileCode2 className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-1">No diagrams found</h3>
        <p className="text-sm text-dark-muted max-w-md mb-5">
          There are no Mermaid diagrams in this directory yet. Create your first diagram or explore other folders.
        </p>
        <button
          type="button"
          onClick={onOpenNewDiagram}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-brand-primary text-white hover:bg-brand-hover shadow-lg shadow-brand-primary/25 transition-all"
        >
          <Sparkles className="w-4 h-4" />
          <span>Create first diagram</span>
        </button>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xs font-semibold uppercase tracking-wider text-dark-muted mb-3.5 flex items-center gap-2">
        <span>Diagrams</span>
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
              <div className="relative h-48 w-full bg-[#151622] flex items-center justify-center overflow-hidden p-4 border-b border-dark-border/60 group-hover:bg-[#181928] transition-colors">
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
                    <span className="text-xs">No vector preview available</span>
                  </div>
                )}

                {/* Hover overlay hint with action buttons */}
                <div className="absolute inset-0 bg-dark-base/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity backdrop-blur-[2px]">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectDiagram(diagram);
                    }}
                    className="flex items-center gap-1.5 text-xs font-medium text-white px-3 py-1.5 rounded-xl bg-dark-card/90 border border-dark-border hover:bg-dark-hover transition-colors shadow-lg"
                    title="Quick Preview"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Preview</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenCanvas(diagram);
                    }}
                    className="flex items-center gap-1.5 text-xs font-semibold text-white px-3 py-1.5 rounded-xl bg-brand-primary hover:bg-brand-hover shadow-lg shadow-brand-primary/20 transition-all"
                    title="Open in Canvas Editor"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>Canvas</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteDiagram(diagram);
                    }}
                    className="p-2 rounded-xl text-dark-muted hover:text-rose-400 bg-dark-card/90 border border-dark-border hover:bg-rose-500/10 transition-colors shadow-lg"
                    title="Delete diagram"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Card Footer Details */}
              <div className="p-4 flex flex-col justify-between flex-1 gap-2.5">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-semibold text-white group-hover:text-brand-glow transition-colors line-clamp-1">
                    {diagram.title}
                  </h3>
                  <span
                    className={`text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full border shrink-0 ${badge.color}`}
                  >
                    {badge.label}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-dark-muted pt-2 border-t border-dark-border/40">
                  <span className="font-mono text-[11px] text-dark-muted/80 truncate max-w-[150px]">
                    {diagram.id}.mmd
                  </span>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-dark-muted/70" />
                    <span>{formatRelativeTime(diagram.updatedAt)}</span>
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

