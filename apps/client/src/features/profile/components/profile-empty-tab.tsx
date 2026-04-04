"use client";

import { ImageIcon, InfoIcon, HeartIcon } from "@/components/ui/icons";

type EmptyTabProps = {
  type: "media" | "about" | "likes";
};

const emptyStates = {
  media: {
    icon: ImageIcon,
    title: "No media yet",
    description: "Photos and videos will appear here when shared.",
  },
  about: {
    icon: InfoIcon,
    title: "About",
    description: "More detailed information coming soon.",
  },
  likes: {
    icon: HeartIcon,
    title: "No liked posts",
    description: "Liked posts will appear here.",
  },
};

export function ProfileEmptyTab({ type }: EmptyTabProps) {
  const state = emptyStates[type];
  const Icon = state.icon;

  return (
    <div className="max-w-2xl mx-auto py-20 px-4 sm:px-6">
      <div className="text-center space-y-4">
        <div className="mx-auto h-24 w-24 rounded-full bg-surface-dark/50 border border-border-soft flex items-center justify-center">
          <Icon className="h-12 w-12 text-muted/50" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-foreground mb-2">{state.title}</h3>
          <p className="text-muted text-sm max-w-sm mx-auto">{state.description}</p>
        </div>
      </div>
    </div>
  );
}
