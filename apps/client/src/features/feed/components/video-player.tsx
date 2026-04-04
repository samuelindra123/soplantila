'use client';

import { useEffect, useRef } from 'react';
import type PlyrType from 'plyr';

type VideoPlayerProps = {
  src: string;
  poster?: string;
};

export default function VideoPlayer({ src, poster }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const playerRef = useRef<PlyrType | null>(null);

  useEffect(() => {
    let active = true;

    async function setupPlayer() {
      const module = await import('plyr');
      const Plyr = module.default;

      if (!active || !videoRef.current) {
        return;
      }

      playerRef.current?.destroy();
      playerRef.current = new Plyr(videoRef.current, {
        controls: [
          'play-large',
          'play',
          'progress',
          'current-time',
          'mute',
          'volume',
          'settings',
          'pip',
          'fullscreen',
        ],
        resetOnEnd: false,
        clickToPlay: true,
        hideControls: true,
        keyboard: { focused: true, global: false },
      });
    }

    void setupPlayer();

    return () => {
      active = false;
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, [src]);

  return (
    <div className="feed-video-player">
      <video
        ref={videoRef}
        className="w-full max-h-[500px] object-contain bg-black"
        playsInline
        preload="metadata"
        poster={poster}
      >
        <source src={src} />
      </video>
    </div>
  );
}
