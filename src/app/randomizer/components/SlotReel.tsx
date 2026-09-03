"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

export default function SlotReel<T>({
  sequence,
  spinToken,
  itemHeight,
  duration,
  delay = 0,
  renderItem,
  className = "",
}: {
  sequence: T[];
  spinToken: number;
  itemHeight: number;
  duration: number;
  delay?: number;
  renderItem: (item: T, isFinal: boolean) => ReactNode;
  className?: string;
}) {
  const targetY = -(sequence.length - 1) * itemHeight;

  return (
    <div
      className={`relative w-full min-w-0 overflow-hidden ${className}`}
      style={{ height: itemHeight }}
    >
      <motion.div
        key={spinToken}
        initial={{ y: 0 }}
        animate={{ y: targetY }}
        transition={{
          duration,
          delay,
          ease: [0.13, 0.66, 0.22, 1],
        }}
      >
        {sequence.map((item, i) => (
          <div
            key={i}
            style={{ height: itemHeight }}
            className="flex w-full min-w-0 items-center"
          >
            {renderItem(item, i === sequence.length - 1)}
          </div>
        ))}
      </motion.div>

      {/* soft fade at the edges to sell the "reel" feel */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-2 bg-gradient-to-b from-rnd-background to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2 bg-gradient-to-t from-rnd-background to-transparent" />
    </div>
  );
}
