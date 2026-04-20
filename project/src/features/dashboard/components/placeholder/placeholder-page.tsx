'use client';

import { Sparkles } from 'lucide-react';
import { SectionCard } from '../shared/section-card';

interface PlaceholderPageProps {
  name: string;
}

export function PlaceholderPage({ name }: PlaceholderPageProps) {
  return (
    <div className="flex h-full flex-1 items-center justify-center">
      <SectionCard className="max-w-md w-full p-10 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary-fixed text-primary">
          <Sparkles className="h-5 w-5" />
        </div>
        <h2 className="mt-4 font-headline text-xl font-bold text-foreground">{name}</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          This view is part of the next milestone. Check back soon.
        </p>
      </SectionCard>
    </div>
  );
}
