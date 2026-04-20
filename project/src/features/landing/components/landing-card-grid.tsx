'use client';

import { motion } from 'framer-motion';
import { LANDING_CARDS } from '../constants/cards';
import { LandingCard } from './landing-card';

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
};

export function LandingCardGrid() {
  return (
    <motion.div
      className="grid w-full max-w-3xl grid-cols-2 gap-5"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {LANDING_CARDS.map((card) => (
        <motion.div key={card.id} variants={itemVariants} className="min-h-0">
          <LandingCard card={card} className="h-full" />
        </motion.div>
      ))}
    </motion.div>
  );
}
