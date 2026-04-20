'use client';

import { cn } from '@/lib/utils';

interface MyGlobalLogoProps {
  className?: string;
}

export function MyGlobalLogo({ className }: MyGlobalLogoProps) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <svg
        width="32"
        height="32"
        viewBox="0 0 32 32"
        fill="none"
        aria-hidden="true"
      >
        {/* Logo mark: 2×2 grid symbolising the four products */}
        <rect width="32" height="32" rx="8" fill="#5F3ADD" />
        <rect x="7" y="7" width="8" height="8" rx="1.5" fill="white" />
        <rect
          x="17"
          y="7"
          width="8"
          height="8"
          rx="1.5"
          fill="rgba(255,255,255,0.5)"
        />
        <rect
          x="7"
          y="17"
          width="8"
          height="8"
          rx="1.5"
          fill="rgba(255,255,255,0.5)"
        />
        <rect x="17" y="17" width="8" height="8" rx="1.5" fill="white" />
      </svg>
      <span className="font-headline text-[1.05rem] font-bold tracking-tight text-foreground">
        my<span className="text-primary">GLOBAL</span>
      </span>
    </div>
  );
}
