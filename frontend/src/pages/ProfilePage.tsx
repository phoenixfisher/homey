import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { AppLayout } from '@/components/AppLayout';
import { MainNav } from '@/components/MainNav';
import { AuthHeaderActions } from '@/components/AuthHeaderActions';
import { backendLogout, fetchSessionUser, getUserProfile, isLoggedIn as getIsLoggedIn, logout, saveUserProfile } from '@/lib/auth';
import { fetchUserProfile, updateUserProfile, type UpdateUserProfileRequest, type UserProfile } from '@/lib/profile';

const industries = [
  'Technology',
  'Healthcare',
  'Finance',
  'Education',
  'Manufacturing',
  'Retail',
  'Construction',
  'Real Estate',
  'Marketing & Advertising',
  'Legal Services',
  'Hospitality',
  'Transportation',
  'Arts & Entertainment',
  'Government',
  'Other',
];

function toNumberOrNull(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

export function ProfilePage() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [firstName, setFirstName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const [form, setForm] = useState({
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    desiredHomePrice: '',
    creditScore: '',
    monthlyIncome: '',
    monthlyExpenses: '',
    totalSavings: '',
    targetZipCode: '',
    industryOfWork: '',
  });

  useEffect(() => {
    void (async () => {
      try {
        const sessionUser = await fetchSessionUser();
        const authenticated = !!sessionUser || getIsLoggedIn() || !!getUserProfile();
        setIsLoggedIn(authenticated);
        setFirstName(sessionUser?.firstName ?? null);

        if (!authenticated) {
          setLoading(false);
          return;
        }

        const loaded = await fetchUserProfile();
        if (!loaded) {
          setLoading(false);
          return;
        }

        setProfile(loaded);
        setForm({
          username: loaded.username,
          email: loaded.email,
          firstName: loaded.firstName,
          lastName: loaded.lastName,
          desiredHomePrice: loaded.desiredHomePrice?.toString() ?? '',
          creditScore: loaded.creditScore?.toString() ?? '',
          monthlyIncome: loaded.monthlyIncome?.toString() ?? '',
          monthlyExpenses: loaded.monthlyExpenses?.toString() ?? '',
          totalSavings: loaded.totalSavings?.toString() ?? '',
          targetZipCode: loaded.targetZipCode ?? '',
          industryOfWork: loaded.industryOfWork ?? '',
        });

        const existingProfile = getUserProfile();
        saveUserProfile({
          name: `${loaded.firstName} ${loaded.lastName}`.trim(),
          desiredHomePrice: loaded.desiredHomePrice?.toString() ?? '',
          creditScore: loaded.creditScore?.toString() ?? '',
          monthlyIncome: loaded.monthlyIncome?.toString() ?? '',
          yearlyIncome: existingProfile?.yearlyIncome ?? '',
          savingsTotal: loaded.totalSavings?.toString() ?? '',
          monthlyExpenses: loaded.monthlyExpenses?.toString() ?? '',
          industry: loaded.industryOfWork ?? '',
        });
      } catch (err) {
        console.error(err);
        setError('Unable to load your profile right now.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleAuthClick = () => {
    if (isLoggedIn) {
      void backendLogout();
      logout();
      setIsLoggedIn(false);
      void navigate('/');
      return;
    }

    void navigate('/login');
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    const payload: UpdateUserProfileRequest = {
      username: form.username.trim(),
      email: form.email.trim(),
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      desiredHomePrice: toNumberOrNull(form.desiredHomePrice),
      creditScore: toNumberOrNull(form.creditScore),
      monthlyIncome: toNumberOrNull(form.monthlyIncome),
      monthlyExpenses: toNumberOrNull(form.monthlyExpenses),
      totalSavings: toNumberOrNull(form.totalSavings),
      targetZipCode: form.targetZipCode.trim() || null,
      industryOfWork: form.industryOfWork || null,
    };

    try {
      await updateUserProfile(payload);
      setSuccess('Profile updated successfully.');
      setFirstName(payload.firstName);
      setProfile((current) => (current
        ? { ...current, ...payload }
        : current));
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Unable to save profile.');
    } finally {
      setSaving(false);
    }

    // Mirror server profile data to localStorage so preapproval flows read the most recent values.
    const existingLocalProfile = getUserProfile();
    saveUserProfile({
      name: `${form.firstName} ${form.lastName}`.trim(),
      desiredHomePrice: form.desiredHomePrice,
      creditScore: form.creditScore,
      monthlyIncome: form.monthlyIncome,
      yearlyIncome: existingLocalProfile?.yearlyIncome ?? '',
      savingsTotal: form.totalSavings,
      monthlyExpenses: form.monthlyExpenses,
      industry: form.industryOfWork,
    });
  };

  return (
    <AppLayout className="bg-gradient-to-b from-[#3e78b2] via-[#5a8ebd] to-[#92b4a7]">
      <MainNav
        active="home"
        isLoggedIn={isLoggedIn}
        rightContent={(
          <AuthHeaderActions
            isLoggedIn={isLoggedIn}
            firstName={firstName}
            onAuthClick={handleAuthClick}
          />
        )}
      />

      <main className="flex-1 p-4 md:p-8 relative">
        <div className="max-w-4xl mx-auto relative z-10">
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-3xl p-6 md:p-8"
          >
            <h1 className="text-3xl md:text-4xl text-white mb-3">My Profile</h1>
            <p className="text-white/75 mb-8">
              Update your account and financial details used throughout Homey.
            </p>

            {loading && <p className="text-white/80">Loading profile...</p>}

            {!loading && !isLoggedIn && (
              <div className="rounded-2xl bg-white/10 border border-white/15 p-6">
                <p className="text-white/85 mb-4">Sign in to view and update your profile.</p>
                <button
                  type="button"
                  onClick={() => void navigate('/login')}
                  className="px-4 py-2 bg-white text-[#3e78b2] rounded-xl hover:bg-white/90 transition-all"
                >
                  Go to Login
                </button>
              </div>
            )}

            {!loading && isLoggedIn && (
              <form onSubmit={handleSave} className="space-y-6">
                {error && (
                  <div className="rounded-xl bg-red-500/20 border border-red-400/60 px-4 py-3 text-red-50">
                    {error}
                  </div>
                )}
                {success && (
                  <div className="rounded-xl bg-emerald-500/20 border border-emerald-400/60 px-4 py-3 text-emerald-50">
                    {success}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white/90 mb-2">First Name</label>
                    <input
                      required
                      value={form.firstName}
                      onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                      className="w-full px-4 py-3 glass rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-white/50"
                    />
                  </div>
                  <div>
                    <label className="block text-white/90 mb-2">Last Name</label>
                    <input
                      required
                      value={form.lastName}
                      onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                      className="w-full px-4 py-3 glass rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-white/50"
                    />
                  </div>
                  <div>
                    <label className="block text-white/90 mb-2">Username</label>
                    <input
                      required
                      value={form.username}
                      onChange={(e) => setForm({ ...form, username: e.target.value })}
                      className="w-full px-4 py-3 glass rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-white/50"
                    />
                  </div>
                  <div>
                    <label className="block text-white/90 mb-2">Email</label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full px-4 py-3 glass rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-white/50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white/90 mb-2">Desired Home Price</label>
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      value={form.desiredHomePrice}
                      onChange={(e) => setForm({ ...form, desiredHomePrice: e.target.value })}
                      className="w-full px-4 py-3 glass rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-white/50"
                    />
                  </div>
                  <div>
                    <label className="block text-white/90 mb-2">Credit Score</label>
                    <input
                      type="number"
                      min="300"
                      max="850"
                      value={form.creditScore}
                      onChange={(e) => setForm({ ...form, creditScore: e.target.value })}
                      className="w-full px-4 py-3 glass rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-white/50"
                    />
                  </div>
                  <div>
                    <label className="block text-white/90 mb-2">Monthly Income</label>
                    <input
                      type="number"
                      min="0"
                      step="100"
                      value={form.monthlyIncome}
                      onChange={(e) => setForm({ ...form, monthlyIncome: e.target.value })}
                      className="w-full px-4 py-3 glass rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-white/50"
                    />
                  </div>
                  <div>
                    <label className="block text-white/90 mb-2">Monthly Expenses</label>
                    <input
                      type="number"
                      min="0"
                      step="100"
                      value={form.monthlyExpenses}
                      onChange={(e) => setForm({ ...form, monthlyExpenses: e.target.value })}
                      className="w-full px-4 py-3 glass rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-white/50"
                    />
                  </div>
                  <div>
                    <label className="block text-white/90 mb-2">Total Savings</label>
                    <input
                      type="number"
                      min="0"
                      step="100"
                      value={form.totalSavings}
                      onChange={(e) => setForm({ ...form, totalSavings: e.target.value })}
                      className="w-full px-4 py-3 glass rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-white/50"
                    />
                  </div>
                  <div>
                    <label className="block text-white/90 mb-2">Target ZIP Code</label>
                    <input
                      value={form.targetZipCode}
                      onChange={(e) => setForm({ ...form, targetZipCode: e.target.value })}
                      className="w-full px-4 py-3 glass rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-white/50"
                    />
                  </div>
                  <div>
                    <label className="block text-white/90 mb-2">Industry of Work</label>
                    <select
                      value={form.industryOfWork}
                      onChange={(e) => setForm({ ...form, industryOfWork: e.target.value })}
                      className="w-full px-4 py-3 glass rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-white/50"
                    >
                      <option value="" className="bg-[#3e78b2] text-white">Select industry</option>
                      {industries.map((industry) => (
                        <option key={industry} value={industry} className="bg-[#3e78b2] text-white">
                          {industry}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <p className="text-white/65 text-sm">
                    Account role: <span className="uppercase">{profile?.role ?? 'buyer'}</span>
                  </p>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-3 bg-white text-[#3e78b2] rounded-xl hover:bg-white/90 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            )}
          </motion.section>
        </div>
      </main>
    </AppLayout>
  );
}
