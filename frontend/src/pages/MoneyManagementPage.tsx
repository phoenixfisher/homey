import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { motion } from 'motion/react';
import {
  ArrowRight,
  DollarSign,
  Home,
  PiggyBank,
  Receipt,
  Target,
  TrendingUp,
} from 'lucide-react';
import { AppLayout } from '@/components/AppLayout';
import { getUserProfile, type HomeyUserProfile } from '@/lib/auth';

const STORAGE_KEY = 'homeyMoneyManagementSettings';

type MoneySettings = {
  monthlySavingsGoal: string;
  housingBudget: string;
};

const defaultSettings: MoneySettings = {
  monthlySavingsGoal: '500',
  housingBudget: '1800',
};

function parseMoney(value: string | undefined): number {
  if (!value) return 0;
  const cleaned = value.replace(/[^0-9.]/g, '');
  const parsed = Number.parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatCurrency(value: number): string {
  return value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });
}

export function MoneyManagementPage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<HomeyUserProfile | null>(null);
  const [settings, setSettings] = useState<MoneySettings>(defaultSettings);
  const [savedSettings, setSavedSettings] = useState<MoneySettings>(defaultSettings);
  const [savedMessage, setSavedMessage] = useState('');

  useEffect(() => {
    const savedProfile = getUserProfile();
    if (!savedProfile) {
      void navigate('/');
      return;
    }

    setProfile(savedProfile);

    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw) as Partial<MoneySettings>;
      const nextSettings = {
        monthlySavingsGoal: parsed.monthlySavingsGoal ?? defaultSettings.monthlySavingsGoal,
        housingBudget: parsed.housingBudget ?? defaultSettings.housingBudget,
      };
      setSettings(nextSettings);
      setSavedSettings(nextSettings);
    } catch {
      setSettings(defaultSettings);
      setSavedSettings(defaultSettings);
    }
  }, [navigate]);

  const hasUnsavedChanges =
    settings.monthlySavingsGoal !== savedSettings.monthlySavingsGoal ||
    settings.housingBudget !== savedSettings.housingBudget;

  const metrics = useMemo(() => {
    const desiredPrice = parseMoney(profile?.desiredHomePrice);
    const savings = parseMoney(profile?.savingsTotal);
    const monthlyIncome = parseMoney(profile?.monthlyIncome);
    const monthlyExpenses = parseMoney(profile?.monthlyExpenses);
    const monthlySavingsGoal = parseMoney(settings.monthlySavingsGoal);
    const housingBudget = parseMoney(settings.housingBudget);

    const monthlyLeftover = monthlyIncome - monthlyExpenses;
    const downPaymentTarget = desiredPrice * 0.2;
    const downPaymentGap = Math.max(downPaymentTarget - savings, 0);
    const downPaymentProgress = downPaymentTarget > 0 ? (savings / downPaymentTarget) * 100 : 0;
    const monthsToGoal = monthlySavingsGoal > 0
      ? Math.ceil(downPaymentGap / monthlySavingsGoal)
      : null;
    const housingBudgetShare = monthlyIncome > 0 ? (housingBudget / monthlyIncome) * 100 : 0;

    return {
      desiredPrice,
      savings,
      monthlyIncome,
      monthlyExpenses,
      monthlyLeftover,
      monthlySavingsGoal,
      housingBudget,
      downPaymentTarget,
      downPaymentGap,
      downPaymentProgress,
      monthsToGoal,
      housingBudgetShare,
    };
  }, [profile, settings]);

  if (!profile) return null;

  const recommendations = [
    metrics.monthlyLeftover <= 0
      ? 'Your current monthly expenses are at or above your monthly income. Reduce recurring costs before increasing your housing target.'
      : `You have about ${formatCurrency(metrics.monthlyLeftover)} left each month before setting a housing payment goal.`,
    metrics.housingBudgetShare > 30
      ? 'Your planned housing budget is above 30% of gross monthly income. Consider lowering it to improve affordability.'
      : 'Your planned housing budget is within a conservative affordability range.',
    metrics.monthsToGoal === null
      ? 'Set a monthly savings goal to estimate when you can reach your down payment target.'
      : metrics.monthsToGoal === 0
      ? 'You have already reached your current down payment target.'
      : `At your current savings goal, you are about ${metrics.monthsToGoal} months away from your down payment target.`,
  ];

  const handleSave = (event: React.FormEvent) => {
    event.preventDefault();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    setSavedSettings(settings);
    setSavedMessage('Saved to your browser.');
    window.setTimeout(() => setSavedMessage(''), 2500);
  };

  return (
    <AppLayout>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="relative z-20 glass border-b border-white/10"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <Home className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-white">Homey</span>
            </Link>
            <nav className="hidden md:flex items-center gap-8">
              <Link to="/dashboard" className="text-white/80 hover:text-white transition-colors">Dashboard</Link>
              <Link to="/money-management" className="text-white font-semibold hover:text-white transition-colors">Money Management</Link>
              <Link to="/pre-approval" className="text-white/80 hover:text-white transition-colors">Pre-Approval</Link>
            </nav>
            <Link
              to="/dashboard"
              className="md:hidden px-4 py-2 bg-white text-[#3e78b2] rounded-xl"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </motion.header>

      <main className="flex-1 p-4 md:p-8 relative">
        <div className="max-w-6xl mx-auto relative z-10 space-y-6">
          <motion.section
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-3xl p-6 md:p-8"
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-white/60 uppercase tracking-[0.2em] text-xs">Money Management</p>
                <h1 className="text-3xl md:text-5xl font-semibold text-white mt-2">
                  Keep your home budget realistic
                </h1>
                <p className="text-white/75 mt-3 max-w-2xl">
                  This page uses your Homey profile to estimate your monthly cushion, down payment progress, and a practical housing budget target.
                </p>
              </div>
              <Link
                to="/pre-approval"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white text-[#3e78b2] hover:bg-white/90 transition-all"
              >
                Continue to Pre-Approval
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.section>

          <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {[
              {
                icon: DollarSign,
                label: 'Monthly Income',
                value: formatCurrency(metrics.monthlyIncome),
                detail: 'Based on your onboarding profile',
                color: 'text-[#bdc4a7]',
              },
              {
                icon: Receipt,
                label: 'Monthly Expenses',
                value: formatCurrency(metrics.monthlyExpenses),
                detail: 'Recurring monthly commitments',
                color: 'text-[#bf8b85]',
              },
              {
                icon: TrendingUp,
                label: 'Monthly Leftover',
                value: formatCurrency(metrics.monthlyLeftover),
                detail: 'Income minus monthly expenses',
                color: 'text-[#92b4a7]',
              },
              {
                icon: PiggyBank,
                label: 'Savings Total',
                value: formatCurrency(metrics.savings),
                detail: 'Current saved funds',
                color: 'text-white/90',
              },
            ].map((card, index) => (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 * index }}
                className="glass rounded-2xl p-5"
              >
                <card.icon className={`w-7 h-7 mb-3 ${card.color}`} />
                <div className="text-2xl text-white mb-1">{card.value}</div>
                <div className="text-white/75 text-sm">{card.label}</div>
                <div className="text-white/50 text-xs mt-2">{card.detail}</div>
              </motion.div>
            ))}
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-[1.2fr,0.8fr] gap-6">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="glass rounded-3xl p-6"
            >
              <div className="flex items-center gap-3 mb-5">
                <Target className="w-6 h-6 text-[#bdc4a7]" />
                <h2 className="text-2xl text-white">Down Payment Progress</h2>
              </div>

              <div className="grid sm:grid-cols-3 gap-4 mb-6">
                <div className="rounded-2xl bg-white/5 p-4">
                  <div className="text-white/60 text-sm">Target Home Price</div>
                  <div className="text-white text-xl mt-1">{formatCurrency(metrics.desiredPrice)}</div>
                </div>
                <div className="rounded-2xl bg-white/5 p-4">
                  <div className="text-white/60 text-sm">20% Down Target</div>
                  <div className="text-white text-xl mt-1">{formatCurrency(metrics.downPaymentTarget)}</div>
                </div>
                <div className="rounded-2xl bg-white/5 p-4">
                  <div className="text-white/60 text-sm">Remaining Gap</div>
                  <div className="text-white text-xl mt-1">{formatCurrency(metrics.downPaymentGap)}</div>
                </div>
              </div>

              <div className="mb-3 flex items-center justify-between text-sm text-white/70">
                <span>Progress toward down payment</span>
                <span>{Math.min(metrics.downPaymentProgress, 100).toFixed(0)}%</span>
              </div>
              <div className="h-4 bg-white/10 rounded-full overflow-hidden mb-4">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(metrics.downPaymentProgress, 100)}%` }}
                  transition={{ duration: 0.8 }}
                  className="h-full bg-gradient-to-r from-[#3e78b2] via-[#92b4a7] to-[#bdc4a7]"
                />
              </div>

              <p className="text-white/70 text-sm">
                {metrics.monthsToGoal === null
                  ? 'Add a monthly savings goal to estimate how long it will take to reach your target.'
                  : metrics.monthsToGoal === 0
                  ? 'You are already at or above your current 20% down payment target.'
                  : `At ${formatCurrency(metrics.monthlySavingsGoal)} per month, you would reach your target in about ${metrics.monthsToGoal} months.`}
              </p>
            </motion.div>

            <motion.form
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.22 }}
              onSubmit={handleSave}
              className="glass rounded-3xl p-6"
            >
              <h2 className="text-2xl text-white mb-2">Plan Settings</h2>
              <p className="text-white/70 text-sm mb-6">
                Save a simple monthly plan to compare your current finances against your housing goals.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-white/90 mb-2">Monthly savings goal</label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={settings.monthlySavingsGoal}
                    onChange={(event) =>
                      setSettings((current) => ({ ...current, monthlySavingsGoal: event.target.value }))
                    }
                    className="w-full px-4 py-3 glass rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/40"
                    placeholder="500"
                  />
                </div>

                <div>
                  <label className="block text-white/90 mb-2">Planned monthly housing budget</label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={settings.housingBudget}
                    onChange={(event) =>
                      setSettings((current) => ({ ...current, housingBudget: event.target.value }))
                    }
                    className="w-full px-4 py-3 glass rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/40"
                    placeholder="1800"
                  />
                </div>
              </div>

              <div className="rounded-2xl bg-white/5 p-4 mt-6">
                <div className="text-white/65 text-sm">Housing budget share of income</div>
                <div className="text-white text-2xl mt-1">{metrics.housingBudgetShare.toFixed(0)}%</div>
                <div className="text-white/55 text-xs mt-1">
                  Many buyers try to keep this around 25% to 30% of gross monthly income.
                </div>
              </div>

              {hasUnsavedChanges && (
                <button
                  type="submit"
                  className="w-full mt-6 px-6 py-3 bg-white text-[#3e78b2] rounded-xl hover:bg-white/90 transition-all"
                >
                  Save Plan
                </button>
              )}

              <p className="text-white/70 text-sm mt-3 min-h-5">{savedMessage}</p>
            </motion.form>
          </section>

          <motion.section
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28 }}
            className="glass rounded-3xl p-6"
          >
            <h2 className="text-2xl text-white mb-4">Recommended Next Steps</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recommendations.map((recommendation) => (
                <div key={recommendation} className="rounded-2xl bg-white/5 p-5">
                  <p className="text-white/80 leading-7">{recommendation}</p>
                </div>
              ))}
            </div>
          </motion.section>
        </div>
      </main>
    </AppLayout>
  );
}
