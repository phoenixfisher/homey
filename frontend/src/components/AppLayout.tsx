import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import { cn } from '@/components/ui/utils';

/**
 * AppLayout — shared page wrapper for all Homey pages.
 *
 * Provides:
 *  - The brand gradient background (matches theme.css body styles)
 *  - Animated glassmorphism background orbs
 *  - A full-height flex-column container
 *
 * Usage:
 *   <AppLayout>
 *     <header>…</header>
 *     <main>…</main>
 *     <footer>…</footer>
 *   </AppLayout>
 *
 * Pass `className` to override or extend the outer container styles
 * (e.g. a different gradient direction for the homepage).
 */
export function AppLayout({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'min-h-screen flex flex-col relative overflow-hidden',
        className,
      )}
    >
      {/* Animated background orb — top-left, sage */}
      <motion.div
        className="fixed top-20 left-20 w-96 h-96 bg-[#bdc4a7]/20 rounded-full blur-3xl pointer-events-none"
        animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Animated background orb — bottom-right, rose */}
      <motion.div
        className="fixed bottom-20 right-20 w-96 h-96 bg-[#bf8b85]/20 rounded-full blur-3xl pointer-events-none"
        animate={{ scale: [1.2, 1, 1.2], opacity: [0.4, 0.2, 0.4] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />

      {children}
    </div>
  );
}
