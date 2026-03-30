import { useState, type ReactNode } from 'react';
import { Link } from 'react-router';
import { motion } from 'motion/react';
import { Home, Menu, X } from 'lucide-react';

type MainNavSection = 'home' | 'dashboard' | 'money-management' | 'pre-approval' | 'learning' | 'homes' | 'okr';

const navItems: { id: MainNavSection; label: string; to: string }[] = [
  { id: 'dashboard', label: 'Dashboard', to: '/dashboard' },
  { id: 'homes', label: 'Homes', to: '/homes' },
  { id: 'money-management', label: 'Money Management', to: '/money-management' },
  { id: 'pre-approval', label: 'Pre-Approval', to: '/pre-approval' },
  { id: 'learning', label: 'Learning', to: '/learning' },
  { id: 'okr', label: 'OKRs', to: '/okrs' },
];

export function MainNav({
  active,
  rightContent,
  isLoggedIn = false,
}: {
  active: MainNavSection;
  rightContent?: ReactNode;
  isLoggedIn?: boolean;
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

          {isLoggedIn ? (
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
          ) : (
            <div className="hidden md:block" />
          )}

          <div className="flex items-center justify-end gap-2 min-w-[96px]">
            {rightContent}
            {isLoggedIn && (
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen((open) => !open)}
                className="md:hidden p-3 glass rounded-xl text-white/90 hover:text-white hover:bg-white/20 active:bg-white/30 transition-all"
                aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
                aria-expanded={isMobileMenuOpen}
                style={{ minWidth: 44, minHeight: 44 }}
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            )}
          </div>
        </div>

        {isLoggedIn && isMobileMenuOpen && (
          <nav className="md:hidden mt-4 glass rounded-2xl p-3 border border-white/15">
            <div className="flex flex-col">
              {navItems.map((item) => (
                <Link
                  key={item.id}
                  to={item.to}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={item.id === active
                    ? 'px-4 py-3 rounded-lg text-white font-semibold bg-white/10'
                    : 'px-4 py-3 rounded-lg text-white/85 hover:text-white hover:bg-white/10 active:bg-white/20 transition-colors'}
                  style={{ minHeight: 44 }}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </nav>
        )}
      </div>
    </motion.header>
  );
}
