import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { motion } from 'motion/react';
import { Lock, ArrowRight } from 'lucide-react';
import { AppLayout } from '@/components/AppLayout';
import { MainNav } from '@/components/MainNav';
import { AuthHeaderActions } from '@/components/AuthHeaderActions';
import { backendLogout, fetchSessionUser, getUserProfile, logout } from '@/lib/auth';
import { API_URL } from '@/lib/api';
import { fetchUserProfile, hydrateLocalProfileFromServer, updateUserProfile } from '@/lib/profile';

async function syncLocalProfileToBackend(): Promise<void> {
  const local = getUserProfile();
  if (!local) return;
  try {
    const current = await fetchUserProfile();
    if (!current) return;
    await updateUserProfile({
      username: current.username,
      email: current.email,
      firstName: current.firstName,
      lastName: current.lastName,
      desiredHomePrice: parseFloat(local.desiredHomePrice) || current.desiredHomePrice,
      creditScore: local.creditScore === 'No Credit' ? null : (parseInt(local.creditScore) || current.creditScore),
      monthlyIncome: parseFloat(local.monthlyIncome) || current.monthlyIncome,
      monthlyExpenses: parseFloat(local.monthlyExpenses) || current.monthlyExpenses,
      totalSavings: parseFloat(local.savingsTotal) || current.totalSavings,
      targetZipCode: current.targetZipCode,
      industryOfWork: local.industry || current.industryOfWork,
    });
  } catch {
    // silently ignore — localStorage still has the data
  }
}

export function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loginForm, setLoginForm] = useState({
    usernameOrEmail: '',
    password: '',
  });
  const [registerForm, setRegisterForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    password: '',
  });
  const [isRegisterMode, setIsRegisterMode] = useState(searchParams.get('mode') === 'register');
  const [authLoading, setAuthLoading] = useState(false);
  const [error, setError] = useState('');

  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    void (async () => {
      const sessionUser = await fetchSessionUser();
      setIsLoggedIn(!!sessionUser);
    })();
  }, []);

  useEffect(() => {
    setIsRegisterMode(searchParams.get('mode') === 'register');
  }, [searchParams]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          usernameOrEmail: loginForm.usernameOrEmail,
          password: loginForm.password,
        }),
      });

      if (!response.ok) {
        setError(response.status === 401 ? 'Invalid credentials.' : 'Login failed. Please try again.');
        return;
      }

      setIsLoggedIn(true);
      await syncLocalProfileToBackend();
      await hydrateLocalProfileFromServer();
      navigate('/');
    } catch (err) {
      console.error(err);
      setError('Unable to reach the server. Is the backend running?');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          username: registerForm.username,
          email: registerForm.email,
          password: registerForm.password,
          firstName: registerForm.firstName,
          lastName: registerForm.lastName,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        setError(text || 'Registration failed. Please try again.');
        return;
      }

      await syncLocalProfileToBackend();
      setIsRegisterMode(false);
      setLoginForm({ usernameOrEmail: registerForm.username || registerForm.email, password: '' });
    } catch (err) {
      console.error(err);
      setError('Unable to reach the server. Is the backend running?');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleHeaderAuthClick = () => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }

    void backendLogout();
    logout();
    setIsLoggedIn(false);
    navigate('/');
  };

  return (
    <AppLayout className="bg-gradient-to-b from-[#3e78b2] via-[#5a8ebd] to-[#92b4a7]">
      <MainNav
        active="home"
        isLoggedIn={isLoggedIn}
        rightContent={(
          <AuthHeaderActions
            isLoggedIn={isLoggedIn}
            onAuthClick={handleHeaderAuthClick}
          />
        )}
      />

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-3xl w-full">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="glass rounded-3xl p-8 md:p-10 flex flex-col md:flex-row gap-10"
          >
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <Lock className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl text-white font-semibold">
                    {isRegisterMode ? 'Create your Homey account' : 'Welcome back to Homey'}
                  </h1>
                  <p className="text-white/70 text-sm md:text-base mt-1">
                    {isRegisterMode
                      ? 'Sign up with a username and password to save your journey.'
                      : 'Log in with your username or email to continue where you left off.'}
                  </p>
                </div>
              </div>

              {error && (
                <div className="mb-4 rounded-xl bg-red-500/20 border border-red-400/60 px-4 py-3 text-sm text-red-50">
                  {error}
                </div>
              )}

              {!isRegisterMode ? (
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div>
                    <label className="block text-white/90 mb-2">Username or Email</label>
                    <input
                      type="text"
                      required
                      value={loginForm.usernameOrEmail}
                      onChange={(e) =>
                        setLoginForm({ ...loginForm, usernameOrEmail: e.target.value })
                      }
                      className="w-full px-4 py-3 glass rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all"
                      placeholder="yourname or you@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-white/90 mb-2">Password</label>
                    <input
                      type="password"
                      required
                      value={loginForm.password}
                      onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                      className="w-full px-4 py-3 glass rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full px-6 py-3 bg-white text-[#3e78b2] rounded-xl hover:bg-white/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {authLoading ? 'Logging in...' : 'Login'}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <p className="text-white/70 text-xs text-center">
                    New to Homey?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setIsRegisterMode(true);
                        setError('');
                      }}
                      className="underline underline-offset-2 text-white hover:text-white/80"
                    >
                      Register here
                    </button>
                  </p>
                </form>
              ) : (
                <form onSubmit={handleRegisterSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-white/90 mb-2">First Name</label>
                      <input
                        type="text"
                        required
                        value={registerForm.firstName}
                        onChange={(e) =>
                          setRegisterForm({ ...registerForm, firstName: e.target.value })
                        }
                        className="w-full px-4 py-3 glass rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all"
                        placeholder="Jane"
                      />
                    </div>
                    <div>
                      <label className="block text-white/90 mb-2">Last Name</label>
                      <input
                        type="text"
                        required
                        value={registerForm.lastName}
                        onChange={(e) =>
                          setRegisterForm({ ...registerForm, lastName: e.target.value })
                        }
                        className="w-full px-4 py-3 glass rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all"
                        placeholder="Doe"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-white/90 mb-2">Email</label>
                    <input
                      type="email"
                      required
                      value={registerForm.email}
                      onChange={(e) =>
                        setRegisterForm({ ...registerForm, email: e.target.value })
                      }
                      className="w-full px-4 py-3 glass rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all"
                      placeholder="you@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-white/90 mb-2">Username</label>
                    <input
                      type="text"
                      required
                      value={registerForm.username}
                      onChange={(e) =>
                        setRegisterForm({ ...registerForm, username: e.target.value })
                      }
                      className="w-full px-4 py-3 glass rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all"
                      placeholder="yourname"
                    />
                  </div>
                  <div>
                    <label className="block text-white/90 mb-2">Password</label>
                    <input
                      type="password"
                      required
                      value={registerForm.password}
                      onChange={(e) =>
                        setRegisterForm({ ...registerForm, password: e.target.value })
                      }
                      className="w-full px-4 py-3 glass rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full px-6 py-3 bg-white text-[#3e78b2] rounded-xl hover:bg-white/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {authLoading ? 'Creating account...' : 'Create account'}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <p className="text-white/70 text-xs text-center">
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setIsRegisterMode(false);
                        setError('');
                      }}
                      className="underline underline-offset-2 text-white hover:text-white/80"
                    >
                      Back to login
                    </button>
                  </p>
                </form>
              )}
            </div>

            <div className="hidden md:flex flex-1 flex-col justify-between text-white/80 text-sm">
              <div>
                <h2 className="text-lg font-semibold mb-3">Why create an account?</h2>
                <ul className="space-y-2 list-disc list-inside">
                  <li>Save your progress through the home buying journey.</li>
                  <li>Come back later and pick up right where you left off.</li>
                  <li>Unlock more personalized insights over time.</li>
                </ul>
              </div>
              <p className="mt-6 text-white/60">
                You can always explore Homey without an account, but logging in gives you a more
                tailored experience.
              </p>
            </div>
          </motion.div>
        </div>
      </main>
    </AppLayout>
  );
}

