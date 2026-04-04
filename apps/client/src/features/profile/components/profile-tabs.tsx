"use client";

import { useState } from "react";

export type ProfileTab = "posts" | "media" | "about" | "likes";

type ProfileTabsProps = {
  activeTab: ProfileTab;
  onTabChange: (tab: ProfileTab) => void;
};

const tabs: { id: ProfileTab; label: string }[] = [
  { id: "posts", label: "Posts" },
  { id: "media", label: "Media" },
  { id: "about", label: "About" },
  { id: "likes", label: "Likes" },
];

export function ProfileTabs({ activeTab, onTabChange }: ProfileTabsProps) {
  return (
    <div className="border-b border-border-soft sticky top-0 bg-background/80 backdrop-blur-xl z-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <nav className="flex gap-1 sm:gap-2 -mb-px overflow-x-auto no-scrollbar" aria-label="Profile tabs">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`
                  relative px-4 sm:px-6 py-4 text-sm sm:text-[15px] font-semibold whitespace-nowrap
                  transition-all duration-300 hover:text-foreground
                  ${isActive ? "text-foreground" : "text-muted"}
                `}
                aria-current={isActive ? "page" : undefined}
              >
                <span className="relative z-10">{tab.label}</span>
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-1 bg-accent rounded-t-full transition-all duration-300" />
                )}
                {!isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-1 bg-transparent group-hover:bg-border-soft transition-all duration-300" />
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
