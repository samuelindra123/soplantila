"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { useAuth } from "@/features/auth/context/auth-context";
import { Spinner } from "@/components/auth/auth-primitives";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { formatDistanceToNow } from "date-fns";
import { id as idLocale } from "date-fns/locale";

type NotificationType = "FOLLOW" | "UNFOLLOW" | "LIKE" | "COMMENT" | "MENTION" | "FRIEND_REQUEST" | "FRIEND_ACCEPT";

type Notification = {
  id: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: string;
  actor: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    fotoProfilUrl: string | null;
  };
  post: {
    id: string;
    content: string;
  } | null;
  friendship?: {
    id: string;
  } | null;
};

type NotificationsResponse = {
  notifications: Notification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export default function NotificationsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.get<NotificationsResponse>(
        "/users/notifications?page=1&limit=50"
      );
      setNotifications(response.notifications);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
      if (err instanceof ApiClientError && err.status === 401) {
        setError("Sesi Anda berakhir. Silakan login kembali.");
        return;
      }
      setError("Gagal memuat notifikasi.");
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      void fetchNotifications();
    }
  }, [user, fetchNotifications]);

  const markAsRead = async (notificationId: string) => {
    try {
      await apiClient.post(`/users/notifications/${notificationId}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await apiClient.post("/users/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  const getNotificationMessage = (notif: Notification) => {
    const actorName = `${notif.actor.firstName} ${notif.actor.lastName}`.trim();

    switch (notif.type) {
      case "FOLLOW":
        return `${actorName} mulai mengikuti Anda`;
      case "UNFOLLOW":
        return `${actorName} berhenti mengikuti Anda`;
      case "LIKE":
        return `${actorName} menyukai postingan Anda`;
      case "COMMENT":
        return `${actorName} mengomentari postingan Anda`;
      case "MENTION":
        return `${actorName} menyebut Anda dalam postingan`;
      case "FRIEND_REQUEST":
        return `${actorName} mengirimkan permintaan pertemanan kepada Anda`;
      case "FRIEND_ACCEPT":
        return `${actorName} telah menyetujui permintaan pertemanan Anda. Sekarang kalian mulai berteman!`;
      default:
        return `${actorName} berinteraksi dengan Anda`;
    }
  };

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case "FOLLOW":
        return (
          <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        );
      case "UNFOLLOW":
        return (
          <svg className="w-5 h-5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        );
      case "LIKE":
        return (
          <svg className="w-5 h-5 text-danger" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        );
      case "COMMENT":
        return (
          <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        );
      case "MENTION":
        return (
          <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
          </svg>
        );
      case "FRIEND_REQUEST":
        return (
          <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
        );
      case "FRIEND_ACCEPT":
        return (
          <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        );
      default:
        return null;
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-[100dvh] bg-background flex items-center justify-center">
        <Spinner className="h-10 w-10 text-accent" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[100dvh] bg-background flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-surface border border-border-soft rounded-[2rem] p-8 text-center glass-strong shadow-premium">
          <h2 className="text-xl font-bold mb-3">Login Required</h2>
          <p className="text-muted text-sm mb-6">
            You need to be logged in to view notifications.
          </p>
          <button
            onClick={() => router.push("/login")}
            className="w-full px-6 py-3 rounded-full bg-accent text-white font-semibold hover:bg-accent-strong transition-all"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex">
      <Sidebar />

      <main className="flex-1 ml-[70px] lg:ml-[260px] transition-all duration-500 min-h-[100dvh]">
        <div className="max-w-2xl mx-auto py-8 lg:py-12 px-4 sm:px-6">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Notifikasi</h1>
            {notifications.some((n) => !n.isRead) && (
              <button
                onClick={markAllAsRead}
                className="text-sm font-medium text-accent hover:text-accent-strong transition-colors"
              >
                Tandai semua dibaca
              </button>
            )}
          </div>

          {/* Content */}
          {isLoading ? (
            <div className="py-16 flex justify-center">
              <Spinner className="h-8 w-8 text-accent" />
            </div>
          ) : error ? (
            <div className="bg-surface border border-border-soft rounded-[2.5rem] p-10 text-center">
              <p className="text-danger text-sm mb-4">{error}</p>
              <button
                onClick={fetchNotifications}
                className="px-6 py-2.5 rounded-full text-sm font-bold text-white bg-accent hover:bg-accent-strong transition-all"
              >
                Coba Lagi
              </button>
            </div>
          ) : notifications.length === 0 ? (
            <div className="bg-surface border border-border-soft rounded-[2.5rem] p-16 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-surface-dark flex items-center justify-center">
                <svg className="w-8 h-8 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Belum ada notifikasi</h3>
              <p className="text-muted text-sm">
                Notifikasi akan muncul di sini ketika ada yang mengikuti Anda atau berinteraksi dengan postingan Anda.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((notif) => (
                <button
                  key={notif.id}
                  onClick={() => {
                    if (!notif.isRead) {
                      void markAsRead(notif.id);
                    }
                    if (notif.type === "FOLLOW" || notif.type === "UNFOLLOW") {
                      router.push(`/u/${notif.actor.username}`);
                    } else if (notif.post) {
                      router.push(`/feed`); // Or specific post page if available
                    }
                  }}
                  className={`w-full text-left p-4 rounded-2xl border transition-all hover:border-accent/30 hover:shadow-md ${
                    notif.isRead
                      ? "bg-surface border-border-soft"
                      : "bg-accent/5 border-accent/20"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="h-12 w-12 shrink-0 rounded-full bg-surface-dark overflow-hidden border border-border-soft">
                      {notif.actor.fotoProfilUrl ? (
                        <img
                          src={notif.actor.fotoProfilUrl}
                          alt={notif.actor.username}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-accent/10 text-sm font-bold text-accent">
                          {notif.actor.firstName[0]}
                          {notif.actor.lastName[0]}
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">
                            {getNotificationMessage(notif)}
                          </p>
                          {notif.post && (
                            <p className="text-xs text-muted mt-1 line-clamp-1">
                              {notif.post.content}
                            </p>
                          )}
                          <p className="text-xs text-muted mt-1">
                            {formatDistanceToNow(new Date(notif.createdAt), {
                              addSuffix: true,
                              locale: idLocale,
                            })}
                          </p>
                        </div>
                        <div className="shrink-0">{getNotificationIcon(notif.type)}</div>
                      </div>
                    </div>

                    {/* Unread indicator */}
                    {!notif.isRead && (
                      <div className="w-2 h-2 rounded-full bg-accent shrink-0 mt-2" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
