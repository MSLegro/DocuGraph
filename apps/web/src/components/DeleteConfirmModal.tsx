import React, { useState } from 'react';
import { AlertTriangle, Loader2, Trash2 } from 'lucide-react';
import type { DiagramItem } from '../types';

interface DeleteConfirmModalProps {
  diagram: DiagramItem | null;
  onClose: () => void;
  onConfirm: (diagram: DiagramItem) => Promise<void>;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  diagram,
  onClose,
  onConfirm
}) => {
  const [loading, setLoading] = useState(false);

  if (!diagram) return null;

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm(diagram);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-md rounded-2xl bg-dark-card border border-rose-500/30 shadow-2xl p-6 overflow-hidden flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">Delete Diagram</h3>
            <p className="text-xs text-dark-muted">This action cannot be undone.</p>
          </div>
        </div>

        <p className="text-sm text-dark-text/90 leading-relaxed">
          Are you sure you want to permanently delete{' '}
          <strong className="text-white">"{diagram.title}"</strong>?
        </p>

        <div className="p-3 rounded-xl bg-dark-base border border-dark-border/80 font-mono text-xs text-dark-muted space-y-1">
          <p className="text-rose-400/90 font-medium">Files to be permanently removed:</p>
          <p>• {diagram.id}.mmd</p>
          <p>• {diagram.id}.svg</p>
          <p>• {diagram.id}.meta.json</p>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-xl text-sm font-medium text-dark-muted hover:text-white hover:bg-dark-hover transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/20 transition-all disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>Delete Diagram</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
