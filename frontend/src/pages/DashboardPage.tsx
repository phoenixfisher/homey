import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Home, Award, TrendingUp, DollarSign, LogOut, CheckCircle2, Circle } from 'lucide-react';
import { useNavigate, Link } from 'react-router';
import { AppLayout } from '@/components/AppLayout';
import { MainNav } from '@/components/MainNav';
import { getUserProfile, logout, type HomeyUserProfile, HOMEY_MILESTONES_KEY } from '@/lib/auth';

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
  const [milestones, setMilestones] = useState<Milestone[]>(initialMilestones);
  const [isProfileLoaded, setIsProfileLoaded] = useState(false);

  useEffect(() => {
    const savedProfile = getUserProfile();
    if (savedProfile) {
      setProfile(savedProfile);
    }
    setIsProfileLoaded(true);

    const savedMilestones = localStorage.getItem(HOMEY_MILESTONES_KEY);
    if (savedMilestones) {
      setMilestones(JSON.parse(savedMilestones) as Milestone[]);
    }
  }, [navigate]);

  const toggleMilestone = (milestoneId: number) => {
    const updatedMilestones = milestones.map((m) =>
      m.id === milestoneId ? { ...m, completed: !m.completed } : m,
    );
    setMilestones(updatedMilestones);
    localStorage.setItem(HOMEY_MILESTONES_KEY, JSON.stringify(updatedMilestones));
  };

  const handleLogout = () => {
    logout();
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

  if (isProfileLoaded && !profile) {
    return (
      <AppLayout>
        <MainNav active="dashboard" />
        <main className="flex-1 p-4 md:p-8 relative">
          <div className="max-w-3xl mx-auto relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-3xl p-8 md:p-10 text-center"
            >
              <h1 className="text-3xl md:text-4xl text-white mb-4">Complete onboarding first</h1>
              <p className="text-white/75 max-w-2xl mx-auto mb-6">
                Your dashboard uses the profile created on the Home page. Add your income, savings,
                and target home price there first, then come back here to track your progress.
              </p>
              <button
                onClick={() => void navigate('/')}
                className="px-6 py-3 bg-white text-[#3e78b2] rounded-2xl hover:bg-white/90 transition-all"
              >
                Go To Home
              </button>
            </motion.div>
          </div>
        </main>
      </AppLayout>
    );
  }

  if (!profile) return null;

  return (
    <AppLayout>
      <MainNav
        active="dashboard"
        rightContent={(
          <button
            onClick={handleLogout}
            className="glass px-4 py-2 rounded-xl text-white/80 hover:text-white hover:bg-white/20 transition-all flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
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

            {/* Journey Progress */}
            <div className="mb-2">
              <div className="flex justify-between text-sm text-white/70 mb-2">
                <span>Journey Progress</span>
                <span>{completedCount} of {milestones.length} milestones</span>
              </div>
              <div className="h-3 bg-white/10 rounded-full overflow-hidden">
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
            <h2 className="text-2xl text-white mb-4">Your Milestones</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {milestones.map((milestone, index) => (
                <motion.div
                  key={milestone.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.05 }}
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
