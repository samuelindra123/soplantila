'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { messagingApi } from '@/features/messaging/services/messaging-api';
import { ConversationList } from '@/features/messaging/components/conversation-list';
import { ChatWindow } from '@/features/messaging/components/chat-window';
import type { Conversation } from '@/types/message';

export default function MessengerPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedUserId = searchParams.get('userId');

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      const data = await messagingApi.getConversationList();
      setConversations(data);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectConversation = (userId: string) => {
    router.push(`/messenger?userId=${userId}`);
  };

  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex">
      {/* Main Sidebar */}
      <Sidebar />

      {/* Messenger Content */}
      <main className="flex-1 ml-[70px] lg:ml-[260px] transition-all duration-500 flex">
        {/* Conversation List Sidebar */}
        <div className="w-80 border-r border-border-soft flex flex-col bg-surface/30 backdrop-blur-sm">
          <div className="p-6 border-b border-border-soft">
            <h1 className="text-2xl font-bold tracking-tight">Pesan</h1>
            <p className="text-sm text-muted mt-1">Percakapan Anda</p>
          </div>
          <ConversationList
            conversations={conversations}
            selectedUserId={selectedUserId}
            onSelectConversation={handleSelectConversation}
            loading={loading}
          />
        </div>

        {/* Chat Window */}
        <div className="flex-1 flex flex-col bg-background">
          {selectedUserId ? (
            <ChatWindow
              otherUserId={selectedUserId}
              onConversationUpdate={loadConversations}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-6 max-w-md px-6">
                <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center">
                  <svg
                    className="w-12 h-12 text-accent"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-bold">Pilih Percakapan</h2>
                  <p className="text-muted text-sm leading-relaxed">
                    Pilih percakapan dari daftar di sebelah kiri atau mulai percakapan baru dengan mengunjungi profil pengguna
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
