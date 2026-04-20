'use client';

import { motion } from 'framer-motion';
import { MyGlobalLogo } from './my-global-logo';

export function LandingHeader() {
  return (
    <motion.header
      className="flex h-16 shrink-0 items-center px-8 border-b border-border/40"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <MyGlobalLogo />
    </motion.header>
  );
}
