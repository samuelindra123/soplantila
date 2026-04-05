'use client';

import { useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import type { Message } from '@/types/message';

interface ChatMessagesProps {
  messages: Message[];
  currentUserId: string | null;
  loading: boolean;
  isTyping: boolean;
}

export function ChatMessages({ messages, currentUserId, loading, isTyping }: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-surface/20">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 mx-auto border-2 border-accent border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted">Memuat pesan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-surface/20 p-6 space-y-4">
      {messages.length === 0 ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-center space-y-3 max-w-xs">
            <div className="w-16 h-16 mx-auto rounded-full bg-surface-dark flex items-center justify-center">
              <svg className="w-8 h-8 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-foreground">Belum ada pesan</p>
              <p className="text-xs text-muted leading-relaxed">
                Mulai percakapan dengan mengirim pesan pertama
              </p>
            </div>
          </div>
        </div>
      ) : (
        <>
          {messages.map((message, index) => {
            const isOwn = message.senderId === currentUserId;
            const time = format(new Date(message.createdAt), 'HH:mm', {
              locale: idLocale,
            });

            // Check if we should show date separator
            const showDateSeparator = index === 0 || 
              format(new Date(messages[index - 1].createdAt), 'yyyy-MM-dd') !== 
              format(new Date(message.createdAt), 'yyyy-MM-dd');

            return (
              <div key={message.id}>
                {/* Date Separator */}
                {showDateSeparator && (
                  <div className="flex items-center justify-center my-6">
                    <div className="px-4 py-1.5 rounded-full bg-surface-dark text-xs font-medium text-muted">
                      {format(new Date(message.createdAt), 'EEEE, d MMMM yyyy', { locale: idLocale })}
                    </div>
                  </div>
                )}

                {/* Message */}
                <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[70%] rounded-2xl px-4 py-2.5 shadow-sm ${
                      isOwn
                        ? 'bg-accent text-white rounded-br-md'
                        : 'bg-surface text-foreground rounded-bl-md border border-border-soft'
                    }`}
                  >
                    {message.messageType === 'TEXT' && (
                      <p className="break-words leading-relaxed">{message.content}</p>
                    )}
                    {message.messageType === 'IMAGE' && message.mediaUrl && (
                      <img
                        src={message.mediaUrl}
                        alt="Image"
                        className="rounded-xl max-w-full"
                      />
                    )}
                    {message.messageType === 'VIDEO' && message.mediaUrl && (
                      <video
                        src={message.mediaUrl}
                        controls
                        className="rounded-xl max-w-full"
                      />
                    )}
                    {message.messageType === 'AUDIO' && message.mediaUrl && (
                      <audio src={message.mediaUrl} controls className="max-w-full" />
                    )}
                    <div
                      className={`text-xs mt-1.5 ${
                        isOwn ? 'text-white/70' : 'text-muted'
                      }`}
                    >
                      {time}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-surface border border-border-soft rounded-2xl rounded-bl-md shadow-sm px-5 py-3">
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 bg-muted rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-muted rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-muted rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </>
      )}
    </div>
  );
}
