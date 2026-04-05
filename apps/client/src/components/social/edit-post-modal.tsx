"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useToast } from "@/hooks/use-toast";

interface EditPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (newContent: string) => Promise<void>;
  currentContent: string;
  isEditing: boolean;
}

export function EditPostModal({
  isOpen,
  onClose,
  onConfirm,
  currentContent,
  isEditing,
}: EditPostModalProps) {
  const toast = useToast();
  const [content, setContent] = useState(currentContent);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setContent(currentContent);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, currentContent]);

  if (!isOpen || !mounted) return null;

  const handleSubmit = async () => {
    if (content.trim() === "") {
      toast.warning("Konten tidak boleh kosong");
      return;
    }
    await onConfirm(content);
  };

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface border border-border-soft rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-border-soft/50">
          <h3 className="text-xl font-bold text-foreground">Edit Postingan</h3>
          <p className="text-sm text-muted mt-1">
            Anda hanya bisa mengedit teks, media tidak bisa diubah
          </p>
        </div>

        <div className="p-6">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full min-h-[150px] p-4 bg-surface-dark border border-border-soft rounded-2xl text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all resize-none"
            placeholder="Tulis sesuatu..."
            maxLength={5000}
            disabled={isEditing}
            autoFocus
          />
          <div className="flex justify-between items-center mt-2">
            <span className="text-xs text-muted">
              {content.length} / 5000 karakter
            </span>
          </div>
        </div>

        <div className="p-6 pt-0 flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={isEditing}
            className="px-6 py-2.5 rounded-xl font-medium text-foreground hover:bg-surface-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={isEditing || content.trim() === ""}
            className="px-6 py-2.5 rounded-xl font-medium bg-accent text-white hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isEditing ? (
              <>
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Menyimpan...
              </>
            ) : (
              "Simpan"
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
