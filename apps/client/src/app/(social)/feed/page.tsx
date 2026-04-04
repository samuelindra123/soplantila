'use client';

import dynamic from 'next/dynamic';
import { Spinner } from '@/components/auth/auth-primitives';

const FeedContent = dynamic(
  () => import('@/features/feed/components/feed-content'),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-[100dvh] bg-background flex items-center justify-center">
        <Spinner className="h-10 w-10 text-accent" />
      </div>
    ),
  }
);

export default function FeedPage() {
  return <FeedContent />;
}
