'use client';

import { useState, useEffect, useRef } from 'react';
import { messagingApi } from '../services/messaging-api';
import { getSocket } from '@/lib/socket';
import { ChatHeader } from './chat-header';
import { ChatMessages } from './chat-messages';
import { ChatInput } from './chat-input';
import type { Message } from '@/types/message';
import { useToast } from '@/hooks/use-toast';
import { Toast } from '@/components/ui/toast';

interface ChatWindowProps {
  otherUserId: string;
  onConversationUpdate: () => void;
}

export function ChatWindow({ otherUserId, onConversationUpdate }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [canSend, setCanSend] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [socketError, setSocketError] = useState<string | null>(null);
  const socketRef = useRef<ReturnType<typeof getSocket> | null>(null);
  const toast = useToast();

  useEffect(() => {
    // Get current user ID from session storage
    const userId = sessionStorage.getItem('userId');
    setCurrentUserId(userId);

    if (userId) {
      // Initialize socket
      socketRef.current = getSocket(userId);

      // Handle socket connection errors
      socketRef.current.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        setSocketError('Gagal terhubung ke server real-time. Fitur chat mungkin tidak berfungsi dengan baik.');
      });

      socketRef.current.on('connect', () => {
        setSocketError(null);
        console.log('Socket connected successfully');
      });

      // Join conversation
      socketRef.current.emit('joinConversation', {
        userId,
        otherUserId,
      });

      // Listen for new messages
      socketRef.current.on('newMessage', (message: Message) => {
        if (
          (message.senderId === otherUserId && message.receiverId === userId) ||
          (message.senderId === userId && message.receiverId === otherUserId)
        ) {
          setMessages((prev) => [...prev, message]);
          onConversationUpdate();
        }
      });

      // Listen for typing indicator
      socketRef.current.on('userTyping', (data: { userId: string; isTyping: boolean }) => {
        if (data.userId === otherUserId) {
          setIsTyping(data.isTyping);
        }
      });

      // Listen for message sent confirmation
      socketRef.current.on('messageSent', (message: Message) => {
        setMessages((prev) => {
          if (!prev.some(m => m.id === message.id)) {
            return [...prev, message];
          }
          return prev;
        });
        onConversationUpdate();
      });

      return () => {
        if (socketRef.current) {
          socketRef.current.emit('leaveConversation', {
            userId,
            otherUserId,
          });
          socketRef.current.off('newMessage');
          socketRef.current.off('userTyping');
          socketRef.current.off('messageSent');
          socketRef.current.off('connect_error');
          socketRef.current.off('connect');
        }
      };
    }
  }, [otherUserId]);

  useEffect(() => {
    loadMessages();
    checkCanSend();
  }, [otherUserId]);

  const loadMessages = async () => {
    setLoading(true);
    try {
      const data = await messagingApi.getConversation(otherUserId);
      setMessages(data);
      
      // Mark as read
      if (currentUserId) {
        await messagingApi.markAsRead(otherUserId);
        onConversationUpdate(); // Update conversation list to clear unread count
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkCanSend = async () => {
    try {
      const { canSend: allowed } = await messagingApi.canSendMessage(otherUserId);
      setCanSend(allowed);
    } catch (error) {
      console.error('Failed to check send permission:', error);
    }
  };

  const handleSendMessage = async (content: string, messageType: 'TEXT' | 'IMAGE' | 'AUDIO' | 'VIDEO' = 'TEXT') => {
    if (!currentUserId) {
      toast.error('Anda harus login untuk mengirim pesan');
      return;
    }

    if (!socketRef.current || !socketRef.current.connected) {
      toast.error('Koneksi terputus. Silakan refresh halaman.');
      return;
    }

    try {
      socketRef.current.emit('sendMessage', {
        userId: currentUserId,
        message: {
          receiverId: otherUserId,
          content,
          messageType,
        },
      });

      // Update can send status
      await checkCanSend();
      onConversationUpdate();
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Gagal mengirim pesan. Silakan coba lagi.');
    }
  };

  const handleTyping = (isTyping: boolean) => {
    if (!currentUserId || !socketRef.current) return;

    socketRef.current.emit('typing', {
      userId: currentUserId,
      typing: {
        targetId: otherUserId,
        isTyping,
      },
    });
  };

  return (
    <div className="flex flex-col h-full">
      {socketError && (
        <div className="bg-yellow-500/10 border-b border-yellow-500/20 px-4 py-2">
          <p className="text-sm text-yellow-600 dark:text-yellow-400 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            {socketError}
          </p>
        </div>
      )}
      <ChatHeader otherUserId={otherUserId} isTyping={isTyping} />
      <ChatMessages
        messages={messages}
        currentUserId={currentUserId}
        loading={loading}
        isTyping={isTyping}
      />
      <ChatInput
        onSendMessage={handleSendMessage}
        onTyping={handleTyping}
        canSend={canSend}
      />
      
      {/* Toast Notifications */}
      <Toast
        isOpen={toast.isOpen}
        onClose={toast.handleClose}
        message={toast.options.message}
        variant={toast.options.variant}
        duration={toast.options.duration}
      />
    </div>
  );
}
