'use client';

import { LandingHeader } from '@/features/landing/components/landing-header';
import { LandingFooter } from '@/features/landing/components/landing-footer';
import { LandingCardGrid } from '@/features/landing/components/landing-card-grid';

export default function Home() {
  return (
    <main className="relative flex h-screen flex-col overflow-hidden bg-background">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 40% at 50% -10%, hsl(258 90% 66% / 0.07) 0%, transparent 70%)',
        }}
      />

      <LandingHeader />

      <section className="relative z-10 flex flex-1 items-center justify-center px-6 py-8">
        <LandingCardGrid />
      </section>

      <LandingFooter />
    </main>
  );
}
