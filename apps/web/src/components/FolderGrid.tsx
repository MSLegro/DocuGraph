import React from 'react';
import { ChevronRight, Edit3, Trash2, Star } from 'lucide-react';
import type { FolderItem } from '../types';
import { getFolderTheme } from '../utils/folder-icons';
import { useLanguage } from '../context/LanguageContext';

interface FolderGridProps {
  folders: FolderItem[];
  onSelectFolder: (path: string) => void;
  onRenameFolder: (folder: FolderItem) => void;
  onDeleteFolder: (folder: FolderItem) => void;
  onToggleFavorite?: (folder: FolderItem) => void;
}

export const FolderGrid: React.FC<FolderGridProps> = ({
  folders,
  onSelectFolder,
  onRenameFolder,
  onDeleteFolder,
  onToggleFavorite
}) => {
  const { t } = useLanguage();

  if (folders.length === 0) return null;

  return (
    <div className="mb-8">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-dark-muted mb-3.5 flex items-center gap-2">
        <span>{t('foldersTitle')}</span>
        <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-dark-border text-dark-muted">
          {folders.length}
        </span>
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
        {folders.map(folder => {
          const theme = getFolderTheme(folder.name);
          const FolderIcon = theme.icon;

          return (
            <div
              key={folder.relativePath}
              onClick={() => onSelectFolder(folder.relativePath)}
              className="group relative flex items-center justify-between p-3.5 rounded-xl bg-dark-card border border-dark-border hover:border-brand-primary/50 hover:bg-dark-hover transition-all cursor-pointer shadow-sm hover:shadow-md overflow-hidden"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className={`w-9 h-9 rounded-lg ${theme.badgeBg} flex items-center justify-center shrink-0 transition-transform group-hover:scale-105`}>
                  <FolderIcon className={`w-5 h-5 ${theme.colorClass}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold text-dark-text truncate group-hover:text-brand-primary transition-colors">
                    {folder.name}
                  </h3>
                  <p className="text-xs text-dark-muted">
                    {folder.diagramCount} {folder.diagramCount === 1 ? t('diagramCountSingular') : t('diagramCountPlural')}
                  </p>
                </div>
              </div>

              {/* Action buttons (hover or favorite) or Chevron */}
              <div className="flex items-center gap-1 shrink-0">
                {/* Favorite Star Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite?.(folder);
                  }}
                  className={`p-1.5 rounded-lg transition-all ${
                    folder.isFavorite
                      ? 'text-amber-400 hover:text-amber-300'
                      : 'text-dark-muted/60 opacity-0 group-hover:opacity-100 hover:text-amber-400 hover:bg-dark-base'
                  }`}
                  title={folder.isFavorite ? t('removeFromFavorites') : t('addToFavorites')}
                >
                  <Star className={`w-3.5 h-3.5 ${folder.isFavorite ? 'fill-amber-400' : ''}`} />
                </button>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRenameFolder(folder);
                    }}
                    className="p-1.5 rounded-lg text-dark-muted hover:text-dark-text hover:bg-dark-base transition-colors"
                    title={t('renameFolder')}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteFolder(folder);
                    }}
                    className="p-1.5 rounded-lg text-dark-muted hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    title={t('deleteFolder')}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <ChevronRight className="w-4 h-4 text-dark-muted group-hover:text-dark-text group-hover:translate-x-0.5 transition-all group-hover:hidden" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
