'use client';

import { formatDistanceToNow } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import type { Conversation } from '@/types/message';

interface ConversationListProps {
  conversations: Conversation[];
  selectedUserId: string | null;
  onSelectConversation: (userId: string) => void;
  loading: boolean;
}

export function ConversationList({
  conversations,
  selectedUserId,
  onSelectConversation,
  loading,
}: ConversationListProps) {
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 mx-auto border-2 border-accent border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted">Memuat percakapan...</p>
        </div>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center space-y-3 max-w-xs">
          <div className="w-16 h-16 mx-auto rounded-full bg-surface-dark flex items-center justify-center">
            <svg className="w-8 h-8 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <div className="space-y-1">
            <p className="font-semibold text-foreground">Belum ada percakapan</p>
            <p className="text-xs text-muted leading-relaxed">
              Mulai kirim pesan ke teman Anda dari halaman profil mereka
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {conversations.map((conversation) => {
        const isSelected = conversation.user.id === selectedUserId;
        const lastMessagePreview =
          conversation.lastMessage.messageType === 'TEXT'
            ? conversation.lastMessage.content
            : `[${conversation.lastMessage.messageType}]`;

        return (
          <button
            key={conversation.user.id}
            onClick={() => onSelectConversation(conversation.user.id)}
            className={`w-full p-4 flex items-start gap-3 hover:bg-surface-dark/50 transition-all border-b border-border-soft/50 ${
              isSelected ? 'bg-accent/5 border-l-4 border-l-accent' : 'border-l-4 border-l-transparent'
            }`}
          >
            {/* Avatar */}
            <div className="flex-shrink-0 relative">
              {conversation.user.profile.fotoProfilUrl ? (
                <img
                  src={conversation.user.profile.fotoProfilUrl}
                  alt={conversation.user.profile.firstName}
                  className="w-14 h-14 rounded-2xl object-cover ring-2 ring-border-soft"
                />
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center ring-2 ring-border-soft">
                  <span className="text-accent font-bold text-lg">
                    {conversation.user.profile.firstName[0]}
                    {conversation.user.profile.lastName[0]}
                  </span>
                </div>
              )}
              {/* Online indicator (placeholder) */}
              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 border-2 border-background rounded-full" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 text-left">
              <div className="flex items-center justify-between mb-1">
                <h3 className={`font-semibold truncate ${isSelected ? 'text-accent' : 'text-foreground'}`}>
                  {conversation.user.profile.firstName}{' '}
                  {conversation.user.profile.lastName}
                </h3>
                <span className="text-xs text-muted flex-shrink-0 ml-2">
                  {formatDistanceToNow(new Date(conversation.lastMessage.createdAt), {
                    addSuffix: true,
                    locale: idLocale,
                  })}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <p className={`text-sm truncate ${conversation.unreadCount > 0 ? 'font-semibold text-foreground' : 'text-muted'}`}>
                  {lastMessagePreview}
                </p>
                {conversation.unreadCount > 0 && (
                  <span className="flex-shrink-0 bg-accent text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                  </span>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
