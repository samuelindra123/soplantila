"use client";

export interface DeletePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting?: boolean;
}

export function DeletePostModal({ isOpen, onClose, onConfirm, isDeleting = false }: DeletePostModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={isDeleting ? undefined : onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-surface border border-border-soft rounded-2xl shadow-2xl w-full max-w-[400px] overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Content */}
        <div className="p-6 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-danger/10">
              <svg className="w-6 h-6 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
          </div>
          <h3 className="text-lg font-bold text-foreground mb-2">Hapus postingan?</h3>
          <p className="text-sm text-muted leading-relaxed">
            Postingan ini akan dihapus secara permanen dan tidak dapat dikembalikan.
          </p>
        </div>

        {/* Actions */}
        <div className="border-t border-border-soft/30 flex">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 py-3 text-sm font-semibold text-foreground hover:bg-surface-dark/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border-r border-border-soft/30"
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 py-3 text-sm font-semibold text-danger hover:bg-danger/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDeleting ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Menghapus...
              </span>
            ) : "Hapus"}
          </button>
        </div>
      </div>
    </div>
  );
}
