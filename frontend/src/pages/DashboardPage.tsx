import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Home, Award, TrendingUp, DollarSign, CheckCircle2, Circle } from 'lucide-react';
import { useNavigate, Link } from 'react-router';
import { AppLayout } from '@/components/AppLayout';
import { GettingStartedModal } from '@/components/GettingStartedModal';
import { MainNav } from '@/components/MainNav';
import { AuthHeaderActions } from '@/components/AuthHeaderActions';
import {
  backendLogout,
  fetchSessionUser,
  getUserProfile,
  isLoggedIn as getIsLoggedIn,
  logout,
  type HomeyUserProfile,
  type SessionUser,
  HOMEY_MILESTONES_KEY,
} from '@/lib/auth';
import { hydrateLocalProfileFromServer, profileHasTargetPriceAndMonthlyBudget } from '@/lib/profile';
import { fetchMilestones, saveMilestone } from '@/lib/progress';

interface Milestone {
  id: number;
  title: string;
  description: string;
  category: 'financial' | 'credit' | 'research' | 'preparation';
  completed: boolean;
}

const initialMilestones: Milestone[] = [
  {
    id: 1,
    title: 'Credit Score Check',
    description: 'Review your credit report and identify areas for improvement',
    category: 'credit',
    completed: false,
  },
  {
    id: 2,
    title: 'Create a Budget',
    description: 'Establish a monthly budget to track income and expenses',
    category: 'financial',
    completed: false,
  },
  {
    id: 3,
    title: 'Save for Down Payment',
    description: 'Aim to save 20% of your home price for down payment',
    category: 'financial',
    completed: false,
  },
  {
    id: 4,
    title: 'Get Pre-Approved',
    description: 'Contact lenders and get pre-approved for a mortgage',
    category: 'financial',
    completed: false,
  },
  {
    id: 5,
    title: 'Research Neighborhoods',
    description: 'Explore potential neighborhoods and compare amenities',
    category: 'research',
    completed: false,
  },
  {
    id: 6,
    title: 'Find a Real Estate Agent',
    description: 'Connect with a trusted real estate agent in your area',
    category: 'preparation',
    completed: false,
  },
  {
    id: 7,
    title: 'Reduce Debt',
    description: 'Pay down high-interest debt to improve your debt-to-income ratio',
    category: 'financial',
    completed: false,
  },
  {
    id: 8,
    title: 'Home Inspection Prep',
    description: 'Learn what to look for during home inspections',
    category: 'preparation',
    completed: false,
  },
];

export function DashboardPage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<HomeyUserProfile | null>(null);
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [milestones, setMilestones] = useState<Milestone[]>(initialMilestones);
  const [isProfileLoaded, setIsProfileLoaded] = useState(false);
  const [showGettingStarted, setShowGettingStarted] = useState(false);

  useEffect(() => {
    void (async () => {
      const user = await fetchSessionUser();
      setSessionUser(user);
      setIsAuthenticated(!!user || getIsLoggedIn());

      if (user) {
        await hydrateLocalProfileFromServer();
      }

      const savedProfile = getUserProfile();
      if (savedProfile) {
        setProfile(savedProfile);
      }
      setIsProfileLoaded(true);

      // Load milestones: prefer backend, fall back to localStorage
      const dbMilestones = await fetchMilestones();
      if (dbMilestones.length > 0) {
        setMilestones((prev) =>
          prev.map((m) => {
            const db = dbMilestones.find((r) => r.milestoneId === m.id);
            return db ? { ...m, completed: db.completed } : m;
          })
        );
      } else {
        const savedMilestones = localStorage.getItem(HOMEY_MILESTONES_KEY);
        if (savedMilestones) {
          setMilestones(JSON.parse(savedMilestones) as Milestone[]);
        }
      }
    })();
  }, [navigate]);

  const toggleMilestone = (milestoneId: number) => {
    const updatedMilestones = milestones.map((m) =>
      m.id === milestoneId ? { ...m, completed: !m.completed } : m,
    );
    setMilestones(updatedMilestones);
    localStorage.setItem(HOMEY_MILESTONES_KEY, JSON.stringify(updatedMilestones));
    const milestone = updatedMilestones.find((m) => m.id === milestoneId);
    if (milestone) void saveMilestone(milestoneId, milestone.completed);
  };

  const handleLogout = () => {
    void backendLogout();
    logout();
    setSessionUser(null);
    setIsAuthenticated(false);
    void navigate('/');
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'financial': return 'text-[#bdc4a7]';
      case 'credit': return 'text-[#bf8b85]';
      case 'research': return 'text-[#92b4a7]';
      case 'preparation': return 'text-white/80';
      default: return 'text-white';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'financial': return '💰';
      case 'credit': return '📊';
      case 'research': return '🔍';
      case 'preparation': return '📋';
      default: return '✓';
    }
  };

  const completedCount = milestones.filter((m) => m.completed).length;
  const progressPercent = (completedCount / milestones.length) * 100;

  const desiredPrice = parseInt(profile?.desiredHomePrice ?? '0');
  const savings = parseInt(profile?.savingsTotal ?? '0');
  const monthlyIncome = parseInt(profile?.monthlyIncome ?? '0');
  const monthlyExpenses = parseInt(profile?.monthlyExpenses ?? '0');

  const downPaymentTarget = desiredPrice * 0.2;
  const downPaymentProgress = downPaymentTarget > 0 ? (savings / downPaymentTarget) * 100 : 0;
  const monthlyBudget = monthlyIncome - monthlyExpenses;

  if (
    isProfileLoaded &&
    (!profile || !profileHasTargetPriceAndMonthlyBudget(profile))
  ) {
    return (
      <>
      <AppLayout>
        <MainNav
          active="dashboard"
          isLoggedIn={isAuthenticated}
          rightContent={(
            <AuthHeaderActions
              isLoggedIn={isAuthenticated}
              firstName={sessionUser?.firstName ?? null}
              onAuthClick={handleLogout}
            />
          )}
        />
        <main className="flex-1 p-4 md:p-8 relative">
          <div className="max-w-3xl mx-auto relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-3xl p-8 md:p-10 text-center"
            >
              <h1 className="text-3xl md:text-4xl text-white mb-4">Complete onboarding first</h1>
              <p className="text-white/75 max-w-2xl mx-auto mb-6">
                Your dashboard needs a target home price plus monthly income and expenses so your monthly
                budget can be calculated. Use Get Started below to enter your details.
              </p>
              <button
                type="button"
                onClick={() => setShowGettingStarted(true)}
                className="px-6 py-3 bg-white text-[#3e78b2] rounded-2xl hover:bg-white/90 transition-all"
              >
                Get Started
              </button>
            </motion.div>
          </div>
        </main>
      </AppLayout>
      <GettingStartedModal
        open={showGettingStarted}
        onClose={() => setShowGettingStarted(false)}
        sessionUser={sessionUser}
        onCompleted={async () => {
          await hydrateLocalProfileFromServer();
          setProfile(getUserProfile());
        }}
      />
    </>
    );
  }

  if (!profile) return null;

  return (
    <AppLayout>
      <MainNav
        active="dashboard"
        isLoggedIn
        rightContent={(
          <AuthHeaderActions
            isLoggedIn
            firstName={sessionUser?.firstName ?? null}
            onAuthClick={handleLogout}
          />
        )}
      />

      <div className="min-h-screen p-4 md:p-8 relative">
        <div className="max-w-6xl mx-auto relative z-10">

          {/* Profile Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass rounded-3xl p-6 mb-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-2xl text-white mb-1">{profile.name}</h2>
                <p className="text-white/70 capitalize">{profile.industry}</p>
              </div>
              <div className="text-center">
                <div className="glass px-4 py-2 rounded-2xl">
                  <div className="text-white text-sm">Credit Score</div>
                  <div className="text-2xl text-white">{profile.creditScore}</div>
                </div>
              </div>
            </div>

            {/* OKR: Journey Progress */}
            <div className="mb-2">
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-1 mb-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-white/50 mb-0.5">OKR: Home Buying Journey</p>
                  <p className="text-white font-semibold text-base">Complete all 8 milestones to reach homeownership</p>
                </div>
                <div className="flex items-baseline gap-2 shrink-0">
                  <span className="text-3xl font-bold text-white">{Math.round(progressPercent)}%</span>
                  <span className="text-white/60 text-sm">{completedCount} of {milestones.length} milestones</span>
                </div>
              </div>
              <div className="h-4 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 1, delay: 0.3 }}
                  className="h-full bg-gradient-to-r from-[#3e78b2] to-[#92b4a7] rounded-full"
                />
              </div>
            </div>
          </motion.div>

          {/* Financial Stats Grid */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
          >
            <div className="glass rounded-2xl p-5">
              <Home className="w-7 h-7 text-[#bdc4a7] mb-3" />
              <div className="text-2xl text-white mb-1">${(desiredPrice / 1000).toFixed(0)}k</div>
              <div className="text-white/70 text-sm">Target Price</div>
            </div>
            <div className="glass rounded-2xl p-5">
              <TrendingUp className="w-7 h-7 text-[#92b4a7] mb-3" />
              <div className="text-2xl text-white mb-1">{downPaymentProgress.toFixed(0)}%</div>
              <div className="text-white/70 text-sm">Down Payment</div>
              <div className="text-white/50 text-xs mt-1">
                ${(savings / 1000).toFixed(0)}k / ${(downPaymentTarget / 1000).toFixed(0)}k
              </div>
            </div>
            <div className="glass rounded-2xl p-5">
              <DollarSign className="w-7 h-7 text-white/80 mb-3" />
              <div className="text-2xl text-white mb-1">${monthlyBudget.toLocaleString()}</div>
              <div className="text-white/70 text-sm">Monthly Budget</div>
            </div>
            <div className="glass rounded-2xl p-5">
              <Award className="w-7 h-7 text-[#bf8b85] mb-3" />
              <div className="text-2xl text-white mb-1">{completedCount}/{milestones.length}</div>
              <div className="text-white/70 text-sm">Completed</div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="glass rounded-3xl p-6 mb-6"
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-2xl text-white mb-2">Money Management</h2>
                <p className="text-white/70 max-w-2xl">
                  Review your monthly cushion, down payment progress, and a saved housing budget plan based on your Homey profile.
                </p>
              </div>
              <Link
                to="/money-management"
                className="inline-flex items-center justify-center px-5 py-3 rounded-2xl bg-white text-[#3e78b2] hover:bg-white/90 transition-all"
              >
                Open Page
              </Link>
            </div>
          </motion.div>

          {/* Milestones List */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
              <h2 className="text-2xl text-white">Your Milestones</h2>
              <p className="text-white/50 text-sm">{milestones.length - completedCount} remaining — click any milestone to toggle</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {milestones.map((milestone, index) => (
                <motion.div
                  key={milestone.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.05 }}
                  role="button"
                  tabIndex={0}
                  aria-pressed={milestone.completed}
                  aria-label={`${milestone.title}: ${milestone.completed ? 'completed' : 'not completed'}. Click to toggle.`}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleMilestone(milestone.id); } }}
                  className={`glass rounded-2xl p-5 transition-all cursor-pointer ${
                    milestone.completed ? 'opacity-75' : 'hover:bg-white/20'
                  }`}
                  onClick={() => toggleMilestone(milestone.id)}
                >
                  <div className="flex items-start gap-4">
                    <div className="text-3xl mt-1">{getCategoryIcon(milestone.category)}</div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="text-lg text-white mb-1 flex items-center gap-2">
                            {milestone.title}
                            {milestone.completed ? (
                              <CheckCircle2 className="w-5 h-5 text-[#bdc4a7]" />
                            ) : (
                              <Circle className="w-5 h-5 text-white/30" />
                            )}
                          </h3>
                          <p className="text-white/70 text-sm">{milestone.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className={getCategoryColor(milestone.category)}>
                          {milestone.category.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </AppLayout>
  );
}
