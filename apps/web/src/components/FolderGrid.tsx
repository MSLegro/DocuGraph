import React from 'react';
import { Folder, ChevronRight } from 'lucide-react';
import type { FolderItem } from '../types';

interface FolderGridProps {
  folders: FolderItem[];
  onSelectFolder: (path: string) => void;
}

export const FolderGrid: React.FC<FolderGridProps> = ({
  folders,
  onSelectFolder
}) => {
  if (folders.length === 0) return null;

  return (
    <div className="mb-8">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-dark-muted mb-3.5 flex items-center gap-2">
        <span>Folders</span>
        <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-dark-border text-dark-muted">
          {folders.length}
        </span>
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
        {folders.map(folder => (
          <div
            key={folder.relativePath}
            onClick={() => onSelectFolder(folder.relativePath)}
            className="group flex items-center justify-between p-3.5 rounded-xl bg-dark-card border border-dark-border hover:border-brand-primary/50 hover:bg-dark-hover transition-all cursor-pointer shadow-sm hover:shadow-md"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-brand-primary/10 text-brand-glow flex items-center justify-center group-hover:bg-brand-primary/20 transition-colors">
                <Folder className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-medium text-dark-text truncate group-hover:text-white transition-colors">
                  {folder.name}
                </h3>
                <p className="text-xs text-dark-muted">
                  {folder.diagramCount} {folder.diagramCount === 1 ? 'diagram' : 'diagrams'}
                </p>
              </div>
            </div>

            <ChevronRight className="w-4 h-4 text-dark-muted group-hover:text-white group-hover:translate-x-0.5 transition-all" />
          </div>
        ))}
      </div>
    </div>
  );
};
