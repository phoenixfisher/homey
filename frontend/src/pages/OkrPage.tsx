import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Users, Activity } from 'lucide-react';
import { useNavigate } from 'react-router';
import { AppLayout } from '@/components/AppLayout';
import { MainNav } from '@/components/MainNav';
import { AuthHeaderActions } from '@/components/AuthHeaderActions';
import { backendLogout, fetchSessionUser, logout, type SessionUser } from '@/lib/auth';
import { fetchOkrMetrics, type OkrMetrics } from '@/lib/metrics';

export function OkrPage() {
  const navigate = useNavigate();
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [metrics, setMetrics] = useState<OkrMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      const user = await fetchSessionUser();
      setSessionUser(user);

      const data = await fetchOkrMetrics();
      setMetrics(data);
      setLoading(false);
    })();
  }, []);

  const handleLogout = () => {
    void backendLogout();
    logout();
    setSessionUser(null);
    void navigate('/');
  };

  return (
    <AppLayout>
      <MainNav
        active="okr"
        isLoggedIn
        rightContent={(
          <AuthHeaderActions
            isLoggedIn
            firstName={sessionUser?.firstName ?? null}
            onAuthClick={handleLogout}
          />
        )}
      />

      <main className="flex-1 p-4 md:p-8 relative">
        <div className="max-w-6xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-3xl p-6 md:p-8 mb-6"
          >
            <h1 className="text-3xl md:text-4xl text-white mb-2">OKRs</h1>
            <p className="text-white/70">
              Quick product health metrics from the `users` table.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="glass rounded-3xl p-6"
            >
              <Users className="w-7 h-7 text-[#bdc4a7] mb-3" />
              <div className="text-white/60 text-sm mb-1">Total registered users</div>
              <div className="text-4xl font-bold text-white">
                {loading ? '—' : (metrics?.totalUsers ?? '—')}
              </div>
              <div className="text-white/55 text-xs mt-2">
                Definition: total rows in `users`
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass rounded-3xl p-6"
            >
              <Activity className="w-7 h-7 text-[#92b4a7] mb-3" />
              <div className="text-white/60 text-sm mb-1">Active users</div>
              <div className="text-4xl font-bold text-white">
                {loading ? '—' : (metrics?.activeUsers ?? '—')}
              </div>
              <div className="text-white/55 text-xs mt-2">
                Definition: `last_logged_in_at` within the last {metrics?.activeWindowDays ?? 14} days
              </div>
            </motion.div>
          </div>

          {!loading && !metrics && (
            <div className="mt-6 glass rounded-3xl p-6 text-white/80">
              Couldn’t load metrics. Make sure the backend is running and reachable from the frontend.
            </div>
          )}
        </div>
      </main>
    </AppLayout>
  );
}

