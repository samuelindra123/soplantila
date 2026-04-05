'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import Link from 'next/link';

interface ChatHeaderProps {
  otherUserId: string;
  isTyping: boolean;
}

export function ChatHeader({ otherUserId, isTyping }: ChatHeaderProps) {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUser();
  }, [otherUserId]);

  const loadUser = async () => {
    if (!otherUserId) {
      setError('ID pengguna tidak valid');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const data = await apiClient.get(`/users/${otherUserId}`);
      setUser(data);
    } catch (error: any) {
      console.error('Failed to load user:', error);
      setError(error?.message || 'Gagal memuat data pengguna');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 border-b border-border-soft bg-surface/50 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-surface-dark animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-surface-dark rounded w-32 animate-pulse" />
            <div className="h-3 bg-surface-dark rounded w-24 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="p-6 border-b border-border-soft bg-surface/50 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center">
            <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="font-semibold text-red-500">Gagal Memuat Obrolan</p>
            <p className="text-sm text-muted">{error || 'Pengguna tidak ditemukan'}</p>
          </div>
          <button
            onClick={loadUser}
            className="px-3 py-1.5 text-sm rounded-lg bg-surface-dark hover:bg-surface transition-colors"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 border-b border-border-soft bg-surface/50 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <Link href={`/u/${user.profile?.username}`} className="relative group">
            {user.profile?.fotoProfilUrl ? (
              <img
                src={user.profile.fotoProfilUrl}
                alt={user.profile.firstName}
                className="w-12 h-12 rounded-2xl object-cover ring-2 ring-border-soft group-hover:ring-accent transition-all"
              />
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center ring-2 ring-border-soft group-hover:ring-accent transition-all">
                <span className="text-accent font-bold text-lg">
                  {user.profile?.firstName?.[0]}
                  {user.profile?.lastName?.[0]}
                </span>
              </div>
            )}
            {/* Online indicator */}
            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-background rounded-full" />
          </Link>

          {/* User Info */}
          <div className="flex-1">
            <Link 
              href={`/u/${user.profile?.username}`}
              className="font-bold text-foreground hover:text-accent transition-colors"
            >
              {user.profile?.firstName} {user.profile?.lastName}
            </Link>
            {isTyping ? (
              <p className="text-sm text-accent font-medium flex items-center gap-1.5">
                <span className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </span>
                sedang mengetik...
              </p>
            ) : (
              <p className="text-sm text-muted">@{user.profile?.username}</p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            className="p-2.5 rounded-xl hover:bg-surface-dark transition-colors text-muted hover:text-foreground"
            title="Info"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
