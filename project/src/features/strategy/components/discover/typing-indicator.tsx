'use client';

import { motion } from 'framer-motion';
import { useStrategyStore } from '@/features/strategy/hooks/use-strategy-store';
import { cn } from '@/lib/utils';

const dotVariants = {
  animate: (i: number) => ({
    opacity: [0.3, 1, 0.3],
    y: [0, -4, 0],
    transition: {
      duration: 0.9,
      repeat: Infinity,
      delay: i * 0.15,
      ease: 'easeInOut',
    },
  }),
};

export function TypingIndicator() {
  const isTyping = useStrategyStore((s) => s.isTyping);

  if (!isTyping) return null;

  return (
    <div className="flex justify-start px-1 mb-2">
      <div
        className={cn(
          'bg-surface-container-low text-foreground rounded-2xl rounded-bl-sm px-4 py-3',
          'flex items-center gap-1',
        )}
      >
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            custom={i}
            variants={dotVariants}
            animate="animate"
            className="block w-1.5 h-1.5 rounded-full bg-muted-foreground/50"
          />
        ))}
      </div>
    </div>
  );
}
