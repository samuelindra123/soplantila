"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { profileService } from "@/features/profile/services/profile-service";
import { friendshipApi } from "@/features/friendship/services/friendship-api";
import { UserProfile } from "@/types/api";

type ConnectionTab = "friends" | "followers" | "following";

interface ConnectionsModalProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: ConnectionTab;
}

export function ConnectionsModal({
  userId,
  isOpen,
  onClose,
  defaultTab = "friends",
}: ConnectionsModalProps) {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<ConnectionTab>(defaultTab);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<Array<{ id: string; profile: any }>>([]);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setActiveTab(defaultTab);
      fetchData(defaultTab);
    } else {
      document.body.style.overflow = "unset";
      setUsers([]);
    }
  }, [isOpen, userId, defaultTab]);

  const fetchData = async (tab: ConnectionTab) => {
    setLoading(true);
    try {
      if (tab === "friends") {
        const data = await friendshipApi.getUserFriends(userId);
        // data returns Friend[], map it to { id, profile }
        // Friend type is { friendshipId, user: { id, email, profile } }
        setUsers(data.map(f => ({ id: f.user.id, profile: f.user.profile })));
      } else if (tab === "followers") {
        const data = await profileService.getFollowers(userId);
        setUsers(data.map(f => ({ id: f.id, profile: f.profile })));
      } else if (tab === "following") {
        const data = await profileService.getFollowing(userId);
        setUsers(data.map(f => ({ id: f.id, profile: f.profile })));
      }
    } catch (error) {
      console.error("Failed to load connections:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab: ConnectionTab) => {
    setActiveTab(tab);
    fetchData(tab);
  };

  if (!isOpen || !mounted) return null;

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />
      
      <div className="relative w-full max-w-md max-h-[85vh] bg-surface border border-border-soft rounded-2xl shadow-premium overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border-soft">
          <h2 className="text-xl font-bold text-foreground">Koneksi</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-surface-dark text-muted hover:text-foreground transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border-soft px-2">
          <button
            onClick={() => handleTabChange("friends")}
            className={`flex-1 py-3 text-sm font-semibold transition-colors relative ${
              activeTab === "friends" ? "text-accent" : "text-muted hover:text-foreground"
            }`}
          >
            Teman
            {activeTab === "friends" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent rounded-t-full" />
            )}
          </button>
          <button
            onClick={() => handleTabChange("followers")}
            className={`flex-1 py-3 text-sm font-semibold transition-colors relative ${
              activeTab === "followers" ? "text-accent" : "text-muted hover:text-foreground"
            }`}
          >
            Pengikut
            {activeTab === "followers" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent rounded-t-full" />
            )}
          </button>
          <button
            onClick={() => handleTabChange("following")}
            className={`flex-1 py-3 text-sm font-semibold transition-colors relative ${
              activeTab === "following" ? "text-accent" : "text-muted hover:text-foreground"
            }`}
          >
            Mengikuti
            {activeTab === "following" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent rounded-t-full" />
            )}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-muted">
              Tidak ada {
                activeTab === "friends" ? "teman" : 
                activeTab === "followers" ? "pengikut" : "yang diikuti"
              }
            </div>
          ) : (
            <div className="space-y-4">
              {users.map((user) => (
                <Link
                  key={user.id}
                  href={`/u/${user.profile.username}`}
                  onClick={onClose}
                  className="flex items-center gap-3 group p-2 hover:bg-surface-dark rounded-xl transition-colors"
                >
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-surface-dark shrink-0">
                    {user.profile.fotoProfilUrl ? (
                      <img 
                        src={user.profile.fotoProfilUrl} 
                        alt={user.profile.firstName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-accent/20 to-accent/5 text-accent font-bold">
                        {user.profile.firstName[0]}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-foreground group-hover:text-accent transition-colors truncate">
                      {user.profile.firstName} {user.profile.lastName}
                    </div>
                    <div className="text-sm text-muted truncate">
                      @{user.profile.username}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
