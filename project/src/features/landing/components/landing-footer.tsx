'use client';

import { motion } from 'framer-motion';

export function LandingFooter() {
  return (
    <motion.footer
      className="flex h-12 shrink-0 items-center justify-center border-t border-border/40"
      initial={{ opacity: 0 }}
      animate={{ opacity: 0.6 }}
      transition={{ duration: 0.3, ease: 'easeOut', delay: 0.6 }}
    >
      <p className="text-xs text-muted-foreground tracking-wide">
        PSK Inc. GFP Team
      </p>
    </motion.footer>
  );
}
