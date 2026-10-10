import React, { useState, useEffect } from 'react';
import { X, Edit3, Loader2, Folder } from 'lucide-react';
import type { FolderItem } from '../types';

interface RenameFolderModalProps {
  folder: FolderItem | null;
  onClose: () => void;
  onSubmit: (folderPath: string, newName: string) => Promise<string | null>;
}

export const RenameFolderModal: React.FC<RenameFolderModalProps> = ({
  folder,
  onClose,
  onSubmit
}) => {
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (folder) {
      setNewName(folder.name);
      setErrorMessage(null);
    }
  }, [folder]);

  if (!folder) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || newName.trim() === folder.name) {
      onClose();
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    const error = await onSubmit(folder.relativePath, newName.trim());
    setLoading(false);

    if (error) {
      setErrorMessage(error);
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-md rounded-2xl bg-dark-card border border-dark-border shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-dark-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand-primary/10 text-brand-glow flex items-center justify-center">
              <Edit3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Rename Folder</h3>
              <p className="text-xs text-dark-muted flex items-center gap-1.5 mt-0.5">
                <Folder className="w-3 h-3 text-dark-muted" />
                Current: <span className="font-mono text-white">{folder.name}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-dark-muted hover:text-white hover:bg-dark-hover transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-dark-muted mb-2">
              New Folder Name
            </label>
            <input
              type="text"
              required
              autoFocus
              value={newName}
              onChange={(e) => {
                setNewName(e.target.value);
                if (errorMessage) setErrorMessage(null);
              }}
              placeholder="e.g. backend-services"
              className="w-full px-4 py-2.5 rounded-xl bg-dark-base border border-dark-border text-white placeholder-dark-muted/60 text-sm focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-colors"
            />
          </div>

          {errorMessage && (
            <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-lg">
              {errorMessage}
            </p>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-dark-border/60">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-xl text-sm font-medium text-dark-muted hover:text-white hover:bg-dark-hover transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading || !newName.trim() || newName.trim() === folder.name}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-brand-primary text-white hover:bg-brand-hover shadow-lg shadow-brand-primary/25 disabled:opacity-50 transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Renaming...</span>
                </>
              ) : (
                <span>Rename Folder</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
