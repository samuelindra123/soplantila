'use client';

import { useState, useEffect } from 'react';
import { friendshipApi } from '../services/friendship-api';
import type { FriendshipStatusResponse } from '@/types/friendship';
import { useConfirm } from '@/hooks/use-confirm';
import { useToast } from '@/hooks/use-toast';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Toast } from '@/components/ui/toast';

interface FriendButtonProps {
  targetUserId: string;
  onStatusChange?: () => void;
}

export function FriendButton({ targetUserId, onStatusChange }: FriendButtonProps) {
  const [status, setStatus] = useState<FriendshipStatusResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const confirmDialog = useConfirm();
  const toast = useToast();

  useEffect(() => {
    loadStatus();
  }, [targetUserId]);

  const loadStatus = async () => {
    try {
      const data = await friendshipApi.getFriendshipStatus(targetUserId);
      setStatus(data);
    } catch (error) {
      console.error('Failed to load friendship status:', error);
    }
  };

  const handleSendRequest = async () => {
    setLoading(true);
    try {
      await friendshipApi.sendFriendRequest(targetUserId);
      await loadStatus();
      onStatusChange?.();
      toast.success('Permintaan pertemanan berhasil dikirim');
    } catch (error: any) {
      toast.error(error.message || 'Gagal mengirim permintaan pertemanan');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRequest = async () => {
    setLoading(true);
    try {
      await friendshipApi.cancelFriendRequest(status!.friendshipId!);
      await loadStatus();
      onStatusChange?.();
      toast.info('Permintaan pertemanan dibatalkan');
    } catch (error: any) {
      toast.error(error.message || 'Gagal membatalkan permintaan');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async () => {
    if (!status?.friendshipId) return;
    setLoading(true);
    try {
      await friendshipApi.acceptFriendRequest(status.friendshipId);
      await loadStatus();
      onStatusChange?.();
      toast.success('Permintaan pertemanan disetujui!');
    } catch (error: any) {
      toast.error(error.message || 'Gagal menyetujui permintaan pertemanan');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectRequest = async () => {
    if (!status?.friendshipId) return;
    setLoading(true);
    try {
      await friendshipApi.rejectFriendRequest(status.friendshipId);
      await loadStatus();
      onStatusChange?.();
      toast.info('Permintaan pertemanan ditolak');
    } catch (error: any) {
      toast.error(error.message || 'Gagal menolak permintaan');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFriend = async () => {
    if (!status?.friendshipId) return;
    
    const confirmed = await confirmDialog.confirm({
      title: 'Hapus Pertemanan?',
      message: 'Apakah Anda yakin ingin menghapus pertemanan ini? Anda dapat mengirim permintaan pertemanan lagi nanti.',
      confirmText: 'Ya, Hapus',
      cancelText: 'Batal',
      variant: 'danger',
    });

    if (!confirmed) return;
    
    setLoading(true);
    try {
      await friendshipApi.removeFriend(status.friendshipId);
      await loadStatus();
      onStatusChange?.();
      toast.success('Pertemanan berhasil dihapus');
    } catch (error: any) {
      toast.error(error.message || 'Gagal menghapus teman');
    } finally {
      setLoading(false);
    }
  };

  if (!status || status.status === 'self') {
    return null;
  }

  const renderButtonContent = () => {
    // None - Belum ada friendship
    if (status.status === 'none') {
      return (
        <button
          onClick={handleSendRequest}
          disabled={loading}
          className="group relative px-6 py-2.5 bg-gradient-to-r from-accent to-accent-strong text-white font-semibold text-sm rounded-full hover:shadow-lg hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 overflow-hidden"
        >
          <span className="relative z-10 flex items-center gap-2">
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Mengirim...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                Tambah Teman
              </>
            )}
          </span>
          <div className="absolute inset-0 bg-gradient-to-r from-accent-strong to-accent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
        </button>
      );
    }

    // Pending - Requester (yang mengirim) - BISA CANCEL
    if (status.status === 'pending' && status.isRequester) {
      return (
        <button
          onClick={handleCancelRequest}
          disabled={loading}
          className="group px-6 py-2.5 bg-surface-dark border-2 border-border-soft text-muted hover:border-red-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 font-semibold text-sm rounded-full transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Membatalkan...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="group-hover:hidden">Permintaan Terkirim</span>
              <span className="hidden group-hover:inline">Batalkan Permintaan</span>
            </>
          )}
        </button>
      );
    }

    // Pending - Addressee (yang menerima) - BISA ACCEPT/REJECT
    if (status.status === 'pending' && !status.isRequester) {
      return (
        <div className="flex items-center gap-2">
          <button
            onClick={handleAcceptRequest}
            disabled={loading}
            className="group relative px-6 py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold text-sm rounded-full hover:shadow-lg hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 overflow-hidden"
          >
            <span className="relative z-10 flex items-center gap-2">
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Menyetujui...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Setujui
                </>
              )}
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-green-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
          </button>
          <button
            onClick={handleRejectRequest}
            disabled={loading}
            className="px-4 py-2.5 bg-surface-dark border border-border-soft text-muted hover:border-red-500 hover:text-red-500 font-semibold text-sm rounded-full transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Tolak
          </button>
        </div>
      );
    }

    // Accepted - Sudah berteman
    if (status.status === 'accepted') {
      return (
        <button
          onClick={handleRemoveFriend}
          disabled={loading}
          className="group px-6 py-2.5 bg-surface-dark border-2 border-border-soft text-foreground font-semibold text-sm rounded-full hover:border-red-500 hover:text-red-500 hover:bg-red-50 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2"
        >
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Menghapus...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="group-hover:hidden">Teman</span>
              <span className="hidden group-hover:inline">Hapus Teman</span>
            </>
          )}
        </button>
      );
    }

    return null;
  };

  return (
    <>
      {renderButtonContent()}
      {/* Modals */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={confirmDialog.handleClose}
        onConfirm={confirmDialog.handleConfirm}
        title={confirmDialog.options.title}
        message={confirmDialog.options.message}
        confirmText={confirmDialog.options.confirmText}
        cancelText={confirmDialog.options.cancelText}
        variant={confirmDialog.options.variant}
      />
      <Toast
        isOpen={toast.isOpen}
        onClose={toast.handleClose}
        message={toast.options.message}
        variant={toast.options.variant}
        duration={toast.options.duration}
      />
    </>
  );
}
