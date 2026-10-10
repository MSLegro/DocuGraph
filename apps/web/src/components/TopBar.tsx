import React from 'react';
import { Network, Plus, FolderPlus, ChevronRight, Home, Sun, Moon, Palette, Star } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { getFolderTheme } from '../utils/folder-icons';
import type { AppTheme } from '../types';

interface TopBarProps {
  breadcrumbs: Array<{ name: string; path: string }>;
  onNavigateFolder: (path: string) => void;
  onOpenNewDiagram: () => void;
  onOpenNewFolder: () => void;
  onlyFavorites?: boolean;
  onToggleOnlyFavorites?: () => void;
  favoritesCount?: number;
}

export const TopBar: React.FC<TopBarProps> = ({
  breadcrumbs,
  onNavigateFolder,
  onOpenNewDiagram,
  onOpenNewFolder,
  onlyFavorites,
  onToggleOnlyFavorites,
  favoritesCount
}) => {
  const { appTheme, setAppTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();

  const themeOptions: Array<{ id: AppTheme; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'dark-tokyo', label: t('themeTokyo'), icon: Moon },
    { id: 'dark-slate', label: t('themeDarkSlate'), icon: Palette },
    { id: 'light-slate', label: t('themeLightSlate'), icon: Sun }
  ];

  return (
    <header className="sticky top-0 z-30 bg-dark-card/90 backdrop-blur-md border-b border-dark-border px-6 py-3.5 transition-colors duration-200">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Brand & Breadcrumbs */}
        <div className="flex items-center flex-wrap gap-3">
          <div 
            onClick={() => onNavigateFolder('')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-primary to-brand-accent flex items-center justify-center text-white shadow-lg shadow-brand-primary/20 group-hover:scale-105 transition-transform">
              <Network className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold tracking-tight text-dark-text text-lg leading-tight flex items-center gap-1.5">
                DocuGraph
                <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-brand-primary/20 text-brand-glow border border-brand-primary/30">
                  MVP
                </span>
              </span>
              <span className="text-[11px] text-dark-muted hidden sm:inline">{t('brandSubtitle')}</span>
            </div>
          </div>

          <div className="h-5 w-[1px] bg-dark-border mx-2 hidden sm:block" />

          {/* Breadcrumb path with dynamic folder icons */}
          <nav className="flex items-center text-sm font-medium text-dark-muted flex-wrap gap-1">
            {breadcrumbs.map((crumb, idx) => {
              const isLast = idx === breadcrumbs.length - 1;
              const folderTheme = idx === 0 ? null : getFolderTheme(crumb.name);
              const CrumbIcon = idx === 0 ? Home : folderTheme?.icon || Home;
              const displayName = idx === 0 ? t('rootFolder') : crumb.name;

              return (
                <React.Fragment key={crumb.path || 'root'}>
                  {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-dark-muted/60" />}
                  <button
                    type="button"
                    onClick={() => onNavigateFolder(crumb.path)}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors ${
                      isLast
                        ? 'text-dark-text bg-dark-hover font-semibold'
                        : 'hover:text-dark-text hover:bg-dark-hover/50'
                    }`}
                  >
                    <CrumbIcon className={`w-3.5 h-3.5 ${folderTheme ? folderTheme.colorClass : ''}`} />
                    <span>{displayName}</span>
                  </button>
                </React.Fragment>
              );
            })}
          </nav>
        </div>

        {/* Action Buttons, Language & Theme Selector */}
        <div className="flex items-center gap-2.5 self-end md:self-auto flex-wrap">
          {/* Language Switcher */}
          <div className="flex items-center bg-dark-base border border-dark-border rounded-xl p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setLanguage('es')}
              className={`px-2 py-1 rounded-lg transition-colors font-medium text-xs ${
                language === 'es'
                  ? 'bg-dark-card text-dark-text shadow-sm font-bold'
                  : 'text-dark-muted hover:text-dark-text'
              }`}
              title="Español"
            >
              ES
            </button>
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`px-2 py-1 rounded-lg transition-colors font-medium text-xs ${
                language === 'en'
                  ? 'bg-dark-card text-dark-text shadow-sm font-bold'
                  : 'text-dark-muted hover:text-dark-text'
              }`}
              title="English"
            >
              EN
            </button>
          </div>

          {/* App Theme Selector */}
          <div className="flex items-center bg-dark-base border border-dark-border rounded-xl p-0.5 text-xs">
            {themeOptions.map((theme) => {
              const Icon = theme.icon;
              const isActive = appTheme === theme.id;
              return (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => setAppTheme(theme.id)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-colors font-medium text-xs ${
                    isActive
                      ? 'bg-dark-card text-dark-text shadow-sm font-semibold'
                      : 'text-dark-muted hover:text-dark-text'
                  }`}
                  title={`${t('switchTheme')} ${theme.label}`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{theme.label}</span>
                </button>
              );
            })}
          </div>

          <div className="h-5 w-[1px] bg-dark-border mx-0.5 hidden sm:block" />

          {/* Favorites Filter Button */}
          {onToggleOnlyFavorites && (
            <button
              type="button"
              onClick={onToggleOnlyFavorites}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border transition-all ${
                onlyFavorites
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-500 shadow-sm shadow-amber-500/10'
                  : 'bg-dark-card border-dark-border text-dark-muted hover:text-dark-text hover:bg-dark-hover'
              }`}
              title={onlyFavorites ? t('showAll') : t('showFavoritesOnly')}
            >
              <Star className={`w-4 h-4 ${onlyFavorites ? 'fill-amber-400 text-amber-400' : ''}`} />
              <span className="hidden sm:inline">{t('favorites')}</span>
              {favoritesCount !== undefined && favoritesCount > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    onlyFavorites ? 'bg-amber-400 text-slate-950' : 'bg-dark-border text-dark-text'
                  }`}
                >
                  {favoritesCount}
                </span>
              )}
            </button>
          )}

          <button
            type="button"
            onClick={onOpenNewFolder}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium bg-dark-card border border-dark-border text-dark-text hover:bg-dark-hover hover:border-dark-muted/40 transition-all shadow-sm"
          >
            <FolderPlus className="w-4 h-4 text-dark-muted" />
            <span>{t('newFolder')}</span>
          </button>

          <button
            type="button"
            onClick={onOpenNewDiagram}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-brand-primary text-white hover:bg-brand-hover shadow-lg shadow-brand-primary/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>{t('newDiagram')}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
