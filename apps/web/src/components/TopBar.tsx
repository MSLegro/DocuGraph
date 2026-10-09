import React from 'react';
import { Network, Plus, FolderPlus, ChevronRight, Home } from 'lucide-react';

interface TopBarProps {
  breadcrumbs: Array<{ name: string; path: string }>;
  onNavigateFolder: (path: string) => void;
  onOpenNewDiagram: () => void;
  onOpenNewFolder: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  breadcrumbs,
  onNavigateFolder,
  onOpenNewDiagram,
  onOpenNewFolder
}) => {
  return (
    <header className="sticky top-0 z-30 bg-dark-card/90 backdrop-blur-md border-b border-dark-border px-6 py-3.5">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Brand & Breadcrumbs */}
        <div className="flex items-center flex-wrap gap-3">
          <div 
            onClick={() => onNavigateFolder('')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-primary to-brand-accent flex items-center justify-center text-white shadow-lg shadow-brand-primary/20 group-hover:scale-105 transition-transform">
              <Network className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold tracking-tight text-white text-lg leading-tight flex items-center gap-1.5">
                DocuGraph
                <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-brand-primary/20 text-brand-glow border border-brand-primary/30">
                  MVP
                </span>
              </span>
              <span className="text-[11px] text-dark-muted hidden sm:inline">Local-First Diagram Engine</span>
            </div>
          </div>

          <div className="h-5 w-[1px] bg-dark-border mx-2 hidden sm:block" />

          {/* Breadcrumb path */}
          <nav className="flex items-center text-sm font-medium text-dark-muted flex-wrap gap-1">
            {breadcrumbs.map((crumb, idx) => {
              const isLast = idx === breadcrumbs.length - 1;
              return (
                <React.Fragment key={crumb.path || 'root'}>
                  {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-dark-muted/60" />}
                  <button
                    type="button"
                    onClick={() => onNavigateFolder(crumb.path)}
                    className={`flex items-center gap-1 px-2 py-1 rounded-md transition-colors ${
                      isLast
                        ? 'text-white bg-dark-hover font-semibold'
                        : 'hover:text-white hover:bg-dark-hover/50'
                    }`}
                  >
                    {idx === 0 ? <Home className="w-3.5 h-3.5" /> : null}
                    <span>{crumb.name}</span>
                  </button>
                </React.Fragment>
              );
            })}
          </nav>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 self-end md:self-auto">
          <button
            type="button"
            onClick={onOpenNewFolder}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium bg-dark-card border border-dark-border text-dark-text hover:bg-dark-hover hover:border-dark-muted/40 transition-all shadow-sm"
          >
            <FolderPlus className="w-4 h-4 text-dark-muted" />
            <span>New folder</span>
          </button>

          <button
            type="button"
            onClick={onOpenNewDiagram}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-brand-primary text-white hover:bg-brand-hover shadow-lg shadow-brand-primary/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>New diagram</span>
          </button>
        </div>
      </div>
    </header>
  );
};
