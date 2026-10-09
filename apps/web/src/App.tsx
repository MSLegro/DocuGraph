import { useState, useEffect, useCallback } from 'react';
import { TopBar } from './components/TopBar';
import { FolderGrid } from './components/FolderGrid';
import { DiagramGrid } from './components/DiagramGrid';
import { NewDiagramModal } from './components/NewDiagramModal';
import { NewFolderModal } from './components/NewFolderModal';
import { DiagramViewerModal } from './components/DiagramViewerModal';
import { DiagramCanvasEditor } from './components/DiagramCanvasEditor';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { ApiClient } from './api/client';
import type { TreeResponse, DiagramItem } from './types';
import { Loader2, RefreshCw } from 'lucide-react';

export function App() {
  const [currentFolder, setCurrentFolder] = useState<string>('');
  const [treeData, setTreeData] = useState<TreeResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modals and Active Views state
  const [isNewDiagramOpen, setIsNewDiagramOpen] = useState<boolean>(false);
  const [isNewFolderOpen, setIsNewFolderOpen] = useState<boolean>(false);
  const [selectedDiagram, setSelectedDiagram] = useState<DiagramItem | null>(null);
  const [canvasDiagram, setCanvasDiagram] = useState<DiagramItem | null>(null);
  const [diagramToDelete, setDiagramToDelete] = useState<DiagramItem | null>(null);

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

  useEffect(() => {
    loadTree(currentFolder);
  }, [currentFolder, loadTree]);

  const handleNavigateFolder = (path: string) => {
    setCurrentFolder(path);
  };

  const handleCreateDiagram = async (
    title: string,
    code: string,
    folderPath: string
  ): Promise<string | null> => {
    const res = await ApiClient.createDiagram(title, code, folderPath);
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

  const handleDeleteDiagramConfirm = async (diagram: DiagramItem) => {
    const res = await ApiClient.deleteDiagram(diagram.id, diagram.folderPath);
    if (res.success) {
      await loadTree(currentFolder);
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

  return (
    <div className="min-h-screen bg-dark-base text-dark-text flex flex-col selection:bg-brand-primary selection:text-white">
      {/* Top Bar with brand, breadcrumbs and actions */}
      <TopBar
        breadcrumbs={treeData?.breadcrumbs || [{ name: 'Root', path: '' }]}
        onNavigateFolder={handleNavigateFolder}
        onOpenNewDiagram={() => setIsNewDiagramOpen(true)}
        onOpenNewFolder={() => setIsNewFolderOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
        {loading && !treeData ? (
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
            />

            {/* Diagrams Grid */}
            <DiagramGrid
              diagrams={treeData?.diagrams || []}
              onSelectDiagram={(diag) => setSelectedDiagram(diag)}
              onOpenCanvas={(diag) => setCanvasDiagram(diag)}
              onDeleteDiagram={(diag) => setDiagramToDelete(diag)}
              onOpenNewDiagram={() => setIsNewDiagramOpen(true)}
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
      />

      {/* Interactive Full-Screen Canvas Editor */}
      <DiagramCanvasEditor
        diagram={canvasDiagram}
        onClose={() => setCanvasDiagram(null)}
        onSaved={() => loadTree(currentFolder)}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        diagram={diagramToDelete}
        onClose={() => setDiagramToDelete(null)}
        onConfirm={handleDeleteDiagramConfirm}
      />
    </div>
  );
}

export default App;
