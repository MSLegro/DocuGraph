import { useState, useEffect, useCallback } from 'react';
import { TopBar } from './components/TopBar';
import { FolderGrid } from './components/FolderGrid';
import { DiagramGrid } from './components/DiagramGrid';
import { NewDiagramModal } from './components/NewDiagramModal';
import { NewFolderModal } from './components/NewFolderModal';
import { DiagramViewerModal } from './components/DiagramViewerModal';
import { DiagramCanvasEditor } from './components/DiagramCanvasEditor';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { RenameFolderModal } from './components/RenameFolderModal';
import { DeleteFolderModal } from './components/DeleteFolderModal';
import { ApiClient } from './api/client';
import type { TreeResponse, DiagramItem, FolderItem, MermaidTheme, FavoritesResponse } from './types';
import { Loader2, RefreshCw, Star, Sparkles } from 'lucide-react';

export function App() {
  const [currentFolder, setCurrentFolder] = useState<string>('');
  const [treeData, setTreeData] = useState<TreeResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Favorites state
  const [onlyFavorites, setOnlyFavorites] = useState<boolean>(false);
  const [favoritesData, setFavoritesData] = useState<FavoritesResponse | null>(null);
  const [loadingFavorites, setLoadingFavorites] = useState<boolean>(false);

  // Modals and Active Views state
  const [isNewDiagramOpen, setIsNewDiagramOpen] = useState<boolean>(false);
  const [isNewFolderOpen, setIsNewFolderOpen] = useState<boolean>(false);
  const [selectedDiagram, setSelectedDiagram] = useState<DiagramItem | null>(null);
  const [canvasDiagram, setCanvasDiagram] = useState<DiagramItem | null>(null);
  const [diagramToDelete, setDiagramToDelete] = useState<DiagramItem | null>(null);
  const [folderToRename, setFolderToRename] = useState<FolderItem | null>(null);
  const [folderToDelete, setFolderToDelete] = useState<FolderItem | null>(null);

  const loadTree = useCallback(async (folder: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await ApiClient.getTree(folder);
      setTreeData(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to load project tree.');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadFavorites = useCallback(async () => {
    setLoadingFavorites(true);
    try {
      const favs = await ApiClient.getFavorites();
      setFavoritesData(favs);
    } catch (err: any) {
      console.error('Failed to load favorites', err);
    } finally {
      setLoadingFavorites(false);
    }
  }, []);

  useEffect(() => {
    loadTree(currentFolder);
  }, [currentFolder, loadTree]);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  const handleNavigateFolder = (path: string) => {
    if (path === '__favorites__') {
      setOnlyFavorites(true);
      return;
    }
    setOnlyFavorites(false);
    setCurrentFolder(path);
  };

  const handleCreateDiagram = async (
    title: string,
    code: string,
    folderPath: string,
    theme?: MermaidTheme
  ): Promise<string | null> => {
    const res = await ApiClient.createDiagram(title, code, folderPath, theme);
    if (!res.success) {
      return res.error || 'Mermaid compilation failed.';
    }
    // Refresh current folder view
    await loadTree(currentFolder);
    return null;
  };

  const handleCreateFolder = async (folderName: string): Promise<string | null> => {
    try {
      await ApiClient.createFolder(currentFolder, folderName);
      await loadTree(currentFolder);
      return null;
    } catch (err: any) {
      return err.message || 'Failed to create folder';
    }
  };

  const handleRenameFolder = async (folderPath: string, newName: string): Promise<string | null> => {
    try {
      await ApiClient.renameFolder(folderPath, newName);
      await loadTree(currentFolder);
      return null;
    } catch (err: any) {
      return err.message || 'Failed to rename folder';
    }
  };

  const handleDeleteFolderConfirm = async (folder: FolderItem) => {
    try {
      await ApiClient.deleteFolder(folder.relativePath);
      if (currentFolder === folder.relativePath || currentFolder.startsWith(folder.relativePath + '/')) {
        setCurrentFolder('');
      } else {
        await loadTree(currentFolder);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete folder');
    }
  };

  const handleDeleteDiagramConfirm = async (diagram: DiagramItem) => {
    const res = await ApiClient.deleteDiagram(diagram.id, diagram.folderPath);
    if (res.success) {
      await loadTree(currentFolder);
      await loadFavorites();
      if (selectedDiagram?.id === diagram.id) {
        setSelectedDiagram(null);
      }
      if (canvasDiagram?.id === diagram.id) {
        setCanvasDiagram(null);
      }
    } else {
      alert(res.error || 'Failed to delete diagram');
    }
  };

  const handleToggleDiagramFavorite = async (diagram: DiagramItem) => {
    const nextStatus = !diagram.isFavorite;

    // Optimistic update in treeData
    setTreeData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        diagrams: prev.diagrams.map((d) => (d.id === diagram.id ? { ...d, isFavorite: nextStatus } : d))
      };
    });

    // Optimistic update in favoritesData
    setFavoritesData((prev) => {
      if (!prev) return prev;
      if (nextStatus) {
        const alreadyExists = prev.diagrams.some((d) => d.id === diagram.id);
        if (alreadyExists) return prev;
        return {
          ...prev,
          diagrams: [{ ...diagram, isFavorite: true }, ...prev.diagrams]
        };
      } else {
        return {
          ...prev,
          diagrams: prev.diagrams.filter((d) => d.id !== diagram.id)
        };
      }
    });

    if (selectedDiagram?.id === diagram.id) {
      setSelectedDiagram((prev) => (prev ? { ...prev, isFavorite: nextStatus } : null));
    }
    if (canvasDiagram?.id === diagram.id) {
      setCanvasDiagram((prev) => (prev ? { ...prev, isFavorite: nextStatus } : null));
    }

    try {
      await ApiClient.toggleDiagramFavorite(diagram.id, diagram.folderPath);
      await loadFavorites();
    } catch (err) {
      console.error('Failed to toggle diagram favorite', err);
      await loadTree(currentFolder);
      await loadFavorites();
    }
  };

  const handleToggleFolderFavorite = async (folder: FolderItem) => {
    const nextStatus = !folder.isFavorite;

    // Optimistic update in treeData
    setTreeData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        folders: prev.folders.map((f) => (f.relativePath === folder.relativePath ? { ...f, isFavorite: nextStatus } : f))
      };
    });

    // Optimistic update in favoritesData
    setFavoritesData((prev) => {
      if (!prev) return prev;
      if (nextStatus) {
        const alreadyExists = prev.folders.some((f) => f.relativePath === folder.relativePath);
        if (alreadyExists) return prev;
        return {
          ...prev,
          folders: [...prev.folders, { ...folder, isFavorite: true }]
        };
      } else {
        return {
          ...prev,
          folders: prev.folders.filter((f) => f.relativePath !== folder.relativePath)
        };
      }
    });

    try {
      await ApiClient.toggleFolderFavorite(folder.relativePath);
      await loadFavorites();
    } catch (err) {
      console.error('Failed to toggle folder favorite', err);
      await loadTree(currentFolder);
      await loadFavorites();
    }
  };

  const totalFavoritesCount = (favoritesData?.folders.length || 0) + (favoritesData?.diagrams.length || 0);

  const breadcrumbs = onlyFavorites
    ? [
        { name: 'Root', path: '' },
        { name: '⭐ Favorites', path: '__favorites__' }
      ]
    : treeData?.breadcrumbs || [{ name: 'Root', path: '' }];

  return (
    <div className="min-h-screen bg-dark-base text-dark-text flex flex-col selection:bg-brand-primary selection:text-white">
      {/* Top Bar with brand, breadcrumbs, favorites toggle and actions */}
      <TopBar
        breadcrumbs={breadcrumbs}
        onNavigateFolder={handleNavigateFolder}
        onOpenNewDiagram={() => setIsNewDiagramOpen(true)}
        onOpenNewFolder={() => setIsNewFolderOpen(true)}
        onlyFavorites={onlyFavorites}
        onToggleOnlyFavorites={() => setOnlyFavorites((prev) => !prev)}
        favoritesCount={totalFavoritesCount}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
        {onlyFavorites ? (
          <div>
            <div className="flex items-center justify-between mb-6 pb-3 border-b border-dark-border/60">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
                  <Star className="w-4 h-4 fill-amber-400" />
                </div>
                <div>
                  <h1 className="text-base font-semibold text-white">Favorite Items</h1>
                  <p className="text-xs text-dark-muted">
                    Quick access to all your starred diagrams and folders across the project.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setOnlyFavorites(false)}
                className="text-xs text-brand-glow hover:text-white transition-colors"
              >
                Back to folder browser →
              </button>
            </div>

            {loadingFavorites && !favoritesData ? (
              <div className="flex flex-col items-center justify-center py-24 gap-3 text-dark-muted">
                <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
                <p className="text-sm">Loading favorites...</p>
              </div>
            ) : totalFavoritesCount === 0 ? (
              <div className="flex flex-col items-center justify-center p-16 text-center rounded-2xl bg-dark-card/40 border border-dashed border-dark-border mt-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-4">
                  <Star className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-1">No favorites yet</h3>
                <p className="text-sm text-dark-muted max-w-md mb-5">
                  Click the star icon on any diagram or folder to add them to your favorites for instant 1-click access.
                </p>
                <button
                  type="button"
                  onClick={() => setOnlyFavorites(false)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-dark-card border border-dark-border text-white hover:bg-dark-hover transition-colors"
                >
                  <Sparkles className="w-4 h-4 text-brand-glow" />
                  <span>Browse all files</span>
                </button>
              </div>
            ) : (
              <div>
                {/* Favorited Folders */}
                {favoritesData && favoritesData.folders.length > 0 && (
                  <FolderGrid
                    folders={favoritesData.folders}
                    onSelectFolder={handleNavigateFolder}
                    onRenameFolder={(folder) => setFolderToRename(folder)}
                    onDeleteFolder={(folder) => setFolderToDelete(folder)}
                    onToggleFavorite={handleToggleFolderFavorite}
                  />
                )}

                {/* Favorited Diagrams */}
                {favoritesData && favoritesData.diagrams.length > 0 && (
                  <DiagramGrid
                    diagrams={favoritesData.diagrams}
                    onSelectDiagram={(diag) => setSelectedDiagram(diag)}
                    onOpenCanvas={(diag) => setCanvasDiagram(diag)}
                    onDeleteDiagram={(diag) => setDiagramToDelete(diag)}
                    onOpenNewDiagram={() => setIsNewDiagramOpen(true)}
                    onToggleFavorite={handleToggleDiagramFavorite}
                  />
                )}
              </div>
            )}
          </div>
        ) : loading && !treeData ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-dark-muted">
            <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
            <p className="text-sm">Connecting to local storage engine...</p>
          </div>
        ) : error ? (
          <div className="rounded-2xl bg-rose-500/10 border border-rose-500/30 p-6 text-center max-w-lg mx-auto my-12">
            <h3 className="text-base font-semibold text-rose-400 mb-2">Connection Error</h3>
            <p className="text-sm text-dark-muted mb-4">{error}</p>
            <button
              type="button"
              onClick={() => loadTree(currentFolder)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-dark-card border border-dark-border text-white hover:bg-dark-hover transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retry</span>
            </button>
          </div>
        ) : (
          <div>
            {/* Subfolders Grid */}
            <FolderGrid
              folders={treeData?.folders || []}
              onSelectFolder={handleNavigateFolder}
              onRenameFolder={(folder) => setFolderToRename(folder)}
              onDeleteFolder={(folder) => setFolderToDelete(folder)}
              onToggleFavorite={handleToggleFolderFavorite}
            />

            {/* Diagrams Grid */}
            <DiagramGrid
              diagrams={treeData?.diagrams || []}
              onSelectDiagram={(diag) => setSelectedDiagram(diag)}
              onOpenCanvas={(diag) => setCanvasDiagram(diag)}
              onDeleteDiagram={(diag) => setDiagramToDelete(diag)}
              onOpenNewDiagram={() => setIsNewDiagramOpen(true)}
              onToggleFavorite={handleToggleDiagramFavorite}
            />
          </div>
        )}
      </main>

      {/* Footer Info */}
      <footer className="border-t border-dark-border/40 py-5 px-6 text-center text-xs text-dark-muted/60">
        <p>DocuGraph • Local-First Diagram Manager • Open Source (MIT/Apache 2.0)</p>
      </footer>

      {/* New Diagram Modal */}
      <NewDiagramModal
        isOpen={isNewDiagramOpen}
        currentFolder={currentFolder}
        onClose={() => setIsNewDiagramOpen(false)}
        onSubmit={handleCreateDiagram}
      />

      {/* New Folder Modal */}
      <NewFolderModal
        isOpen={isNewFolderOpen}
        currentFolder={currentFolder}
        onClose={() => setIsNewFolderOpen(false)}
        onSubmit={handleCreateFolder}
      />

      {/* Quick Preview Viewer Modal */}
      <DiagramViewerModal
        diagram={selectedDiagram}
        onClose={() => setSelectedDiagram(null)}
        onOpenCanvas={(diag) => setCanvasDiagram(diag)}
        onDelete={(diag) => setDiagramToDelete(diag)}
        onToggleFavorite={handleToggleDiagramFavorite}
      />

      {/* Interactive Full-Screen Canvas Editor */}
      <DiagramCanvasEditor
        diagram={canvasDiagram}
        onClose={() => setCanvasDiagram(null)}
        onSaved={() => {
          loadTree(currentFolder);
          loadFavorites();
        }}
        onToggleFavorite={handleToggleDiagramFavorite}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        diagram={diagramToDelete}
        onClose={() => setDiagramToDelete(null)}
        onConfirm={handleDeleteDiagramConfirm}
      />

      {/* Rename Folder Modal */}
      <RenameFolderModal
        folder={folderToRename}
        onClose={() => setFolderToRename(null)}
        onSubmit={handleRenameFolder}
      />

      {/* Delete Folder Modal */}
      <DeleteFolderModal
        folder={folderToDelete}
        onClose={() => setFolderToDelete(null)}
        onConfirm={handleDeleteFolderConfirm}
      />
    </div>
  );
}

export default App;
