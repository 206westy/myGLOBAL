'use client';

import { cn } from '@/lib/utils';
import { type Owner } from '@/features/strategy/lib/types';

interface OwnerAvatarProps {
  owner: Owner;
  size?: 'sm' | 'md';
}

export function OwnerAvatar({ owner, size = 'md' }: OwnerAvatarProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full font-bold text-white flex-shrink-0',
        size === 'sm' ? 'h-6 w-6 text-[0.58rem]' : 'h-7 w-7 text-[0.62rem]',
      )}
      style={{ backgroundColor: owner.color }}
      title={owner.name}
    >
      {owner.initials}
    </div>
  );
}
