"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Sidebar } from "@/components/layout/sidebar";
import { friendshipApi } from "@/features/friendship/services/friendship-api";
import { FriendButton } from "@/features/friendship/components/friend-button";
import { Friend, PendingRequest } from "@/types/friendship";

type Tab = "friends" | "requests";

export default function FriendsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("friends");
  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<PendingRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === "friends") {
        const data = await friendshipApi.getFriends();
        setFriends(data);
      } else {
        const data = await friendshipApi.getPendingRequests();
        setRequests(data);
      }
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex">
      {/* Main Sidebar */}
      <Sidebar />

      {/* Friends Content */}
      <main className="flex-1 ml-[70px] lg:ml-[260px] transition-all duration-500 flex flex-col md:flex-row">
        {/* Inner Sidebar */}
        <div className="w-full md:w-80 border-r border-border-soft flex flex-col bg-surface/30 backdrop-blur-sm shrink-0">
          <div className="p-6 border-b border-border-soft">
            <h1 className="text-2xl font-bold tracking-tight">Pertemanan</h1>
            <p className="text-sm text-muted mt-1">Kelola teman Anda</p>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            <button
              onClick={() => setActiveTab("friends")}
              className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-all ${
                activeTab === "friends"
                  ? "bg-accent/10 text-accent"
                  : "hover:bg-surface-dark text-foreground"
              }`}
            >
              Daftar Teman
            </button>
            <button
              onClick={() => setActiveTab("requests")}
              className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-all flex items-center justify-between ${
                activeTab === "requests"
                  ? "bg-accent/10 text-accent"
                  : "hover:bg-surface-dark text-foreground"
              }`}
            >
              <span>Permintaan</span>
              {requests.length > 0 && activeTab !== "requests" && (
                <span className="bg-accent text-white text-xs px-2 py-0.5 rounded-full">
                  Baru
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col bg-background overflow-y-auto p-6 md:p-10">
          <h2 className="text-2xl font-bold mb-6">
            {activeTab === "friends" ? "Semua Teman" : "Permintaan Pertemanan"}
          </h2>
          
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            </div>
          ) : activeTab === "friends" ? (
            friends.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted text-lg">Anda belum memiliki teman.</p>
                <Link href="/discovery" className="text-accent hover:underline mt-2 inline-block">
                  Cari teman baru
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {friends.map((friend) => (
                  <div key={friend.friendshipId} className="bg-surface border border-border-soft rounded-2xl p-4 flex flex-col items-center text-center hover:shadow-md transition-all">
                    <Link href={`/u/${friend.user.profile.username}`} className="mb-3">
                      <div className="w-20 h-20 rounded-full overflow-hidden bg-surface-dark shrink-0 ring-2 ring-border-soft mx-auto">
                        {friend.user.profile.fotoProfilUrl ? (
                          <img 
                            src={friend.user.profile.fotoProfilUrl} 
                            alt={friend.user.profile.firstName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-accent/20 to-accent/5 text-accent font-bold text-xl">
                            {friend.user.profile.firstName[0]}
                          </div>
                        )}
                      </div>
                    </Link>
                    <Link href={`/u/${friend.user.profile.username}`} className="font-bold text-lg hover:text-accent transition-colors truncate w-full">
                      {friend.user.profile.firstName} {friend.user.profile.lastName}
                    </Link>
                    <p className="text-sm text-muted mb-4 truncate w-full">@{friend.user.profile.username}</p>
                    <FriendButton targetUserId={friend.user.id} onStatusChange={loadData} />
                  </div>
                ))}
              </div>
            )
          ) : (
            requests.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted text-lg">Tidak ada permintaan pertemanan.</p>
              </div>
            ) : (
              <div className="space-y-4 max-w-2xl">
                {requests.map((req) => (
                  <div key={req.friendshipId} className="bg-surface border border-border-soft rounded-2xl p-4 flex items-center justify-between gap-4">
                    <Link href={`/u/${req.user.profile.username}`} className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-16 h-16 rounded-full overflow-hidden bg-surface-dark shrink-0">
                        {req.user.profile.fotoProfilUrl ? (
                          <img 
                            src={req.user.profile.fotoProfilUrl} 
                            alt={req.user.profile.firstName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-accent/20 to-accent/5 text-accent font-bold text-xl">
                            {req.user.profile.firstName[0]}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-lg truncate hover:text-accent transition-colors">
                          {req.user.profile.firstName} {req.user.profile.lastName}
                        </div>
                        <div className="text-sm text-muted truncate">@{req.user.profile.username}</div>
                      </div>
                    </Link>
                    <div className="shrink-0 flex items-center">
                      <FriendButton targetUserId={req.user.id} onStatusChange={loadData} />
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </main>
    </div>
  );
}