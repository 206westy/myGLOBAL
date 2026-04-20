'use client';

import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { type LandingCardData } from '../constants/cards';

interface LandingCardProps {
  card: LandingCardData;
  className?: string;
}

export function LandingCard({ card, className }: LandingCardProps) {
  const Icon = card.icon;

  return (
    <Link
      href={card.href}
      className={cn(
        'group relative flex flex-col gap-5 rounded-[1.5rem] border border-outline-variant/30 bg-card p-8',
        'shadow-[0px_12px_32px_rgba(25,28,30,0.06)]',
        'transition-all duration-300 ease-out',
        'hover:-translate-y-1 hover:border-primary/30',
        'hover:shadow-[0px_24px_48px_rgba(95,58,221,0.18)]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2',
        'active:scale-[0.99]',
        className
      )}
    >
      {/* Icon box — primary-fixed background (#E6DEFF) */}
      <div
        className={cn(
          'flex h-12 w-12 items-center justify-center rounded-xl',
          'bg-primary-fixed text-primary',
          'transition-all duration-300 ease-out',
          'group-hover:bg-primary/20 group-hover:scale-[1.04]'
        )}
      >
        <Icon className="h-5 w-5" />
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-2">
        <h2 className="font-headline text-xl font-bold tracking-tight text-card-foreground">
          {card.title}
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {card.subtitle}
        </p>
      </div>

      {/* Footer: badge + arrow */}
      <div className="flex items-center justify-between">
        <span
          className={cn(
            'inline-flex items-center rounded-full px-3 py-1',
            'text-[0.7rem] font-semibold tracking-wide',
            'bg-primary-fixed text-on-primary-fixed-variant'
          )}
        >
          {card.badge}
        </span>
        <ArrowUpRight
          className={cn(
            'h-4 w-4 text-muted-foreground opacity-0',
            'transition-all duration-200 ease-out',
            'group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5',
            'group-hover:text-primary'
          )}
        />
      </div>
    </Link>
  );
}
