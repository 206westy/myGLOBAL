'use client';

import { Star } from 'lucide-react';
import { type Recommendation } from '@/features/strategy/lib/types';
import { SectionCard } from '@/features/dashboard/components/shared/section-card';
import { cn } from '@/lib/utils';

interface Props {
  rec: Recommendation;
  isShortlisted: boolean;
  onShortlist: () => void;
}

export function RecommendationCard({ rec, isShortlisted, onShortlist }: Props) {
  return (
    <SectionCard className="p-4 cursor-pointer hover:shadow-[0px_18px_36px_rgba(25,28,30,0.10)]">
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <p className="text-[0.9rem] font-semibold text-foreground leading-snug flex-1">
          {rec.title}
        </p>
        <button
          onClick={onShortlist}
          className={cn(
            'flex-shrink-0 flex items-center justify-center h-7 w-7 rounded-lg transition-colors',
            isShortlisted
              ? 'text-amber-400 hover:text-amber-500'
              : 'text-muted-foreground/40 hover:text-amber-400',
          )}
        >
          <Star
            className="w-4 h-4"
            fill={isShortlisted ? 'currentColor' : 'none'}
          />
        </button>
      </div>

      {/* Description */}
      <p className="text-[0.78rem] text-muted-foreground mt-1.5 line-clamp-2">
        {rec.description}
      </p>

      {/* Badges row */}
      <div className="flex items-center gap-2 mt-2.5 flex-wrap">
        <span className="bg-primary-fixed text-on-primary-fixed-variant text-[0.68rem] rounded-full px-2.5 py-1">
          {rec.expectedImpact}
        </span>
        <span className="bg-gray-100 text-gray-600 text-[0.68rem] rounded-full px-2 py-1">
          {rec.effort}
        </span>
      </div>

      {/* Tags row */}
      {rec.tags.length > 0 && (
        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
          {rec.tags.map((tag) => (
            <span
              key={tag}
              className="text-[0.65rem] bg-surface-container-low rounded-md px-2 py-1 text-muted-foreground"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </SectionCard>
  );
}
