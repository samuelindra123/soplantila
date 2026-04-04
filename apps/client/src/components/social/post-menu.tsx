"use client";

import { useRef, useEffect } from "react";
import { Trash2Icon, EditIcon, FlagIcon } from "@/components/ui/icons";

interface PostMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onDelete: () => void;
  isOwnPost?: boolean;
  position?: { top: number; right: number };
}

export function PostMenu({ isOpen, onClose, onDelete, isOwnPost = true, position }: PostMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-surface/98 backdrop-blur-xl border border-border-soft/50 rounded-xl shadow-2xl overflow-hidden min-w-[200px] animate-in fade-in zoom-in-95 duration-150"
      style={position ? { top: `${position.top}px`, right: `${position.right}px` } : {}}
    >
      {isOwnPost ? (
        <div className="py-1">
          <button
            onClick={() => {
              // TODO: Implement edit functionality
              onClose();
            }}
            className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-surface-dark/50 transition-colors text-left group"
          >
            <EditIcon className="h-[18px] w-[18px] text-accent" />
            <span className="text-[14px] font-medium text-foreground">Edit postingan</span>
          </button>
          <div className="h-px bg-border-soft/30 mx-2" />
          <button
            onClick={() => {
              onDelete();
              onClose();
            }}
            className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-danger/5 transition-colors text-left group"
          >
            <Trash2Icon className="h-[18px] w-[18px] text-danger" />
            <span className="text-[14px] font-medium text-danger">Hapus postingan</span>
          </button>
        </div>
      ) : (
        <div className="py-1">
          <button
            onClick={() => {
              // TODO: Implement report functionality
              onClose();
            }}
            className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-surface-dark/50 transition-colors text-left group"
          >
            <FlagIcon className="h-[18px] w-[18px] text-muted" />
            <span className="text-[14px] font-medium text-foreground">Laporkan postingan</span>
          </button>
        </div>
      )}
    </div>
  );
}
