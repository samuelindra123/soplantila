import { useEffect, useRef, useCallback, useState } from 'react';
import { useAuth } from '@/features/auth/context/auth-context';
import { fetchEventSource } from '@microsoft/fetch-event-source';

export type SSEStatus = 'idle' | 'connecting' | 'connected' | 'auth_failed' | 'error';

export interface FeedSSEEvent {
  type: 'new_post' | 'delete_post' | 'update_post' | 'connected';
  postId?: string;
  userId?: string;
  data?: any;
  timestamp?: number;
}

interface UseFeedSSEOptions {
  onNewPost?: (event: FeedSSEEvent) => void;
  onDeletePost?: (event: FeedSSEEvent) => void;
  onUpdatePost?: (event: FeedSSEEvent) => void;
  onConnected?: () => void;
  onError?: (error: any) => void;
  enabled?: boolean;
}

class FatalError extends Error {}

export function useFeedSSE(options: UseFeedSSEOptions) {
  const { user } = useAuth();
  const userId = user?.id;
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasTriedRefreshRef = useRef(false);
  const isConnectingRef = useRef(false);
  const userIdRef = useRef<string | null>(null);
  
  const [isConnected, setIsConnected] = useState(false);
  const [sseStatus, setSseStatus] = useState<SSEStatus>('idle');
  const [isEndpointMissing, setIsEndpointMissing] = useState(false);

  const {
    onNewPost,
    onDeletePost,
    onUpdatePost,
    onConnected,
    onError,
    enabled = true,
  } = options;

  // Stable update status function
  const updateStatus = useCallback((status: SSEStatus, connected: boolean) => {
    setSseStatus(status);
    setIsConnected(connected);
  }, []);

  const connect = useCallback(async () => {
    // Guard: don't connect if already connecting or no user
    if (isConnectingRef.current || !userId || !enabled) {
      console.log('[SSE] Not connecting:', { 
        isConnecting: isConnectingRef.current, 
        hasUser: !!userId,
        enabled 
      });
      return;
    }

    // Reset refresh flag if user changed
    if (userIdRef.current !== userId) {
      console.log('[SSE] User changed, resetting state');
      hasTriedRefreshRef.current = false;
      userIdRef.current = userId;
    }

    isConnectingRef.current = true;
    updateStatus('connecting', false);

    // Cancel previous connection
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    console.log('[SSE] Connecting to /api/feed/stream');

    try {
      await fetchEventSource('/api/feed/stream', {
        signal: controller.signal,
        credentials: 'include',
        openWhenHidden: true, // Don't disconnect when tab hidden
        headers: {
          'Accept': 'text/event-stream',
        },

        async onopen(response) {
          if (response.ok) {
            // SUCCESS
            console.log('[SSE] Connection opened successfully');
            isConnectingRef.current = false;
            hasTriedRefreshRef.current = false; // Reset on success
            updateStatus('connected', true);
            return;
          }

          if (response.status === 401) {
            console.error('[SSE] Unauthorized (401)');

            // 1. IMMEDIATELY update UI - don't wait for refresh
            updateStatus('auth_failed', false);
            
            // 2. Try token refresh in background
            if (!hasTriedRefreshRef.current) {
              hasTriedRefreshRef.current = true;
              
              // Abort current connection
              controller.abort();
              isConnectingRef.current = false;

              console.log('[SSE] Attempting token refresh in background...');

              // Background refresh - UI already shows 'auth_failed'
              fetch('/api/auth/refresh', {
                method: 'GET',
                credentials: 'include',
              })
                .then(res => {
                  if (res.ok) {
                    console.log('[SSE] Token refreshed successfully, reconnecting...');
                    // Update UI to connecting
                    updateStatus('connecting', false);
                    // Schedule reconnect
                    reconnectTimerRef.current = setTimeout(() => {
                      hasTriedRefreshRef.current = false;
                      connect();
                    }, 500);
                  } else {
                    console.error('[SSE] Token refresh failed:', res.status);
                    // UI stays in auth_failed state
                  }
                })
                .catch(error => {
                  console.error('[SSE] Token refresh error:', error);
                  // UI stays in auth_failed state
                });
              
              return; // Exit onopen gracefully
            }

            // Already tried refresh - final failure
            console.error('[SSE] Authentication failed permanently');
            isConnectingRef.current = false;
            onError?.(new Error('Authentication failed'));
            
            // Throw to stop fetchEventSource
            throw new FatalError('Authentication failed');
          }

          // Handle 404 - endpoint not found (likely route missing)
          if (response.status === 404) {
            console.error('[SSE] Endpoint not found (404) - check API route');
            isConnectingRef.current = false;
            updateStatus('error', false);
            setIsEndpointMissing(true);
            throw new FatalError('Endpoint not found (404)');
          }

          // Other client errors
          console.error('[SSE] Client error:', response.status);
          isConnectingRef.current = false;
          updateStatus('error', false);
          throw new FatalError(`Client error: ${response.status}`);
        },

        onmessage(event) {
          try {
            // Skip heartbeat comments
            if (!event.data || event.data.startsWith(':')) {
              return;
            }

            const data: FeedSSEEvent = JSON.parse(event.data);
            console.log('[SSE] Received event:', data.type);

            switch (data.type) {
              case 'connected':
                onConnected?.();
                break;
              case 'new_post':
                onNewPost?.(data);
                break;
              case 'delete_post':
                onDeletePost?.(data);
                break;
              case 'update_post':
                onUpdatePost?.(data);
                break;
              default:
                console.warn('[SSE] Unknown event type:', data.type);
            }
          } catch (error) {
            console.error('[SSE] Failed to parse event:', error);
          }
        },

        onerror(error) {
          // AbortError is expected when we manually abort - not a real error
          if (error instanceof Error && error.name === 'AbortError') {
            console.log('[SSE] Connection aborted (expected)');
            return; // Stop fetchEventSource gracefully
          }

          // Fatal errors - stop, don't retry
          if (error instanceof FatalError) {
            console.error('[SSE] Fatal error, stopping:', error.message);
            isConnectingRef.current = false;
            return; // Stop fetchEventSource
          }

          // Network/server errors - let fetchEventSource handle auto-retry
          console.error('[SSE] Connection error (retriable):', error);
          updateStatus('error', false);
          
          // Return undefined = fetchEventSource will auto-retry
          // We just update UI state, don't interfere with retry logic
        },

        onclose() {
          console.log('[SSE] Connection closed');
          isConnectingRef.current = false;
          
          // Only update status if not already in auth_failed state
          if (sseStatus !== 'auth_failed') {
            updateStatus('idle', false);
          }
        },
      });
    } catch (error) {
      // AbortError from controller.abort() - expected, not a real error
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('[SSE] Connection aborted by controller');
        return;
      }

      console.error('[SSE] Unexpected error:', error);
      isConnectingRef.current = false;
      updateStatus('error', false);
      onError?.(error);
    }
  }, [userId, enabled, onNewPost, onDeletePost, onUpdatePost, onConnected, onError, updateStatus, sseStatus]);

  const disconnect = useCallback(() => {
    console.log('[SSE] Disconnecting');

    // Clear reconnect timer
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }

    // Abort connection
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    isConnectingRef.current = false;
    hasTriedRefreshRef.current = false;
    updateStatus('idle', false);
  }, [updateStatus]);

  // Main effect - only handles mount/unmount and userId changes
  useEffect(() => {
    if (!userId || !enabled) {
      disconnect();
      return;
    }

    // Reset state on userId change
    hasTriedRefreshRef.current = false;
    isConnectingRef.current = false;

    // Initial delay to ensure cookie is set after login
    // Increased to 500ms for better reliability
    console.log('[SSE] Scheduling initial connection with 500ms delay');
    const initialTimer = setTimeout(() => {
      connect();
    }, 500);

    return () => {
      console.log('[SSE] Cleanup: disconnecting');
      clearTimeout(initialTimer);
      disconnect();
    };
  }, [userId, enabled]); // IMPORTANT: Don't include connect/disconnect in deps
  // They are stable via useCallback with proper deps

  return {
    isConnected,
    sseStatus,
    isEndpointMissing,
    disconnect,
    reconnect: () => {
      // Don't allow reconnect if endpoint is missing
      if (isEndpointMissing) {
        console.warn('[SSE] Reconnect blocked - endpoint missing');
        return;
      }
      
      console.log('[SSE] Manual reconnect triggered');
      hasTriedRefreshRef.current = false; // Reset for fresh attempt
      isConnectingRef.current = false;
      updateStatus('connecting', false);
      
      // Clear any pending reconnect
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      
      connect();
    },
  };
}
