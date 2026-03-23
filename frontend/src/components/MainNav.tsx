import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { motion } from 'motion/react';
import { Home } from 'lucide-react';

type MainNavSection = 'home' | 'dashboard' | 'money-management' | 'pre-approval';

const navItems: { id: MainNavSection; label: string; to: string }[] = [
  { id: 'home', label: 'Home', to: '/' },
  { id: 'dashboard', label: 'Dashboard', to: '/dashboard' },
  { id: 'money-management', label: 'Money Management', to: '/money-management' },
  { id: 'pre-approval', label: 'Pre-Approval', to: '/pre-approval' },
];

export function MainNav({
  active,
  rightContent,
}: {
  active: MainNavSection;
  rightContent?: ReactNode;
}) {
  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="relative z-20 glass border-b border-white/10"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <Home className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">Homey</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <Link
                key={item.id}
                to={item.to}
                className={item.id === active
                  ? 'text-white font-semibold transition-colors'
                  : 'text-white/80 hover:text-white transition-colors'}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center justify-end min-w-[96px]">
            {rightContent}
          </div>
        </div>
      </div>
    </motion.header>
  );
}
