import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { motion } from 'motion/react';
import {
  Home,
  ArrowRight,
  CheckCircle,
  TrendingUp,
  MapPin,
  Shield,
  Calculator,
  Target,
} from 'lucide-react';
import { AppLayout } from '@/components/AppLayout';
import { GettingStartedModal } from '@/components/GettingStartedModal';
import { MainNav } from '@/components/MainNav';
import { AuthHeaderActions } from '@/components/AuthHeaderActions';
import {
  backendLogout,
  fetchSessionUser,
  isLoggedIn as getIsLoggedIn,
  getUserProfile,
  logout,
  type HomeyUserProfile,
  type SessionUser,
} from '@/lib/auth';
import { hydrateLocalProfileFromServer } from '@/lib/profile';

export function HomePage() {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [localProfile, setLocalProfile] = useState<HomeyUserProfile | null>(null);

  useEffect(() => {
    void (async () => {
      const user = await fetchSessionUser();
      setSessionUser(user);
      if (user) {
        await hydrateLocalProfileFromServer();
      }
      setLocalProfile(getUserProfile());
      setIsLoggedIn(!!user || getIsLoggedIn());
    })();
  }, []);

  const handleAuthClick = () => {
    if (isLoggedIn) {
      void backendLogout();
      logout();
      setIsLoggedIn(false);
      setSessionUser(null);
      setLocalProfile(null);
      setShowModal(false);
      void navigate('/');
    } else {
      void navigate('/login');
    }
  };

  const openGettingStarted = () => {
    setShowModal(true);
  };

  /** Same gate as Dashboard / Money Management: saved onboarding profile in local storage. */
  const canAccessDashboard = !!localProfile;

  return (
    <AppLayout className="bg-gradient-to-b from-[#3e78b2] via-[#5a8ebd] to-[#92b4a7]">
      <MainNav
        active="home"
        isLoggedIn={isLoggedIn}
        rightContent={(
          <AuthHeaderActions
            isLoggedIn={isLoggedIn}
            firstName={sessionUser?.firstName ?? localProfile?.name.split(' ')[0] ?? null}
            onAuthClick={handleAuthClick}
          />
        )}
      />

      {/* Hero Section */}
      <section id="features" className="relative flex-1 flex items-center justify-center px-4 py-20">
        <div className="max-w-6xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold text-white mb-6">
              {sessionUser ? (
                <>Welcome back,<br />{sessionUser.firstName}</>
              ) : localProfile ? (
                <>Welcome back,<br />{localProfile.name.split(' ')[0]}</>
              ) : (
                <>Your Dream Home<br />Starts Here</>
              )}
            </h1>
            <p className="text-xl md:text-2xl text-white/80 mb-12 max-w-3xl mx-auto">
              Navigate your home buying journey with personalized insights, affordability maps, and milestone tracking.
            </p>
            <motion.button
              type="button"
              onClick={() => {
                if (isLoggedIn) {
                  if (canAccessDashboard) {
                    void navigate('/dashboard');
                  } else {
                    openGettingStarted();
                  }
                  return;
                }
                if (canAccessDashboard) {
                  void navigate('/dashboard');
                } else {
                  void navigate('/login?mode=register');
                }
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 bg-white text-[#3e78b2] rounded-2xl hover:bg-white/90 transition-all shadow-2xl inline-flex items-center gap-3 text-lg"
            >
              {canAccessDashboard ? 'Dashboard' : 'Get Started'}
              <ArrowRight className="w-5 h-5" aria-hidden />
            </motion.button>
          </motion.div>

          {/* Feature Cards */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20"
          >
            <div className="glass rounded-2xl p-6 text-left">
              <div className="w-12 h-12 bg-[#bdc4a7]/30 rounded-xl flex items-center justify-center mb-4">
                <MapPin className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl text-white mb-2">Affordability Map</h3>
              <p className="text-white/70">
                See exactly where you can afford to live based on your budget and preferences.
              </p>
            </div>

            <div className="glass rounded-2xl p-6 text-left">
              <div className="w-12 h-12 bg-[#92b4a7]/30 rounded-xl flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl text-white mb-2">Financial Insights</h3>
              <p className="text-white/70">
                Track your progress toward down payment goals and understand your buying power.
              </p>
              <Link
                to="/money-management"
                className="inline-flex items-center gap-2 text-sm text-white mt-4 hover:text-white/80 transition-colors"
              >
                Open money management
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="glass rounded-2xl p-6 text-left">
              <div className="w-12 h-12 bg-[#bf8b85]/30 rounded-xl flex items-center justify-center mb-4">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl text-white mb-2">Milestone Tracking</h3>
              <p className="text-white/70">
                Complete essential steps on your journey from first-time buyer to homeowner.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="relative px-4 py-20">
        <div className="max-w-6xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">How It Works</h2>
            <p className="text-xl text-white/80 max-w-2xl mx-auto">
              A simple three-step process to guide you toward homeownership
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="glass rounded-2xl p-8 text-center"
            >
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Calculator className="w-8 h-8 text-white" />
              </div>
              <div className="text-3xl font-bold text-white mb-2">1</div>
              <h3 className="text-xl text-white mb-3">Enter Your Info</h3>
              <p className="text-white/70">
                Share your financial details and homeownership goals with our secure platform.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="glass rounded-2xl p-8 text-center"
            >
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Target className="w-8 h-8 text-white" />
              </div>
              <div className="text-3xl font-bold text-white mb-2">2</div>
              <h3 className="text-xl text-white mb-3">Get Insights</h3>
              <p className="text-white/70">
                Receive personalized recommendations and see where you can afford to live.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="glass rounded-2xl p-8 text-center"
            >
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <div className="text-3xl font-bold text-white mb-2">3</div>
              <h3 className="text-xl text-white mb-3">Track Progress</h3>
              <p className="text-white/70">
                Complete milestones and watch your homeownership dream become reality.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="relative px-4 py-20">
        <div className="max-w-4xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="glass rounded-3xl p-12 text-center"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">About Homey</h2>
            <p className="text-lg text-white/80 mb-6">
              We believe everyone deserves a clear path to homeownership. Homey combines cutting-edge technology with financial expertise to provide personalized guidance throughout your home buying journey.
            </p>
            <p className="text-lg text-white/80">
              Whether you're a first-time buyer or looking to upgrade, our platform helps you understand your options, track your progress, and achieve your homeownership goals with confidence.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 glass border-t border-white/10 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <Home className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-white">Homey</span>
              </div>
              <p className="text-white/70 text-sm">
                Empowering your journey to homeownership with smart tools and insights.
              </p>
            </div>

            <div>
              <h4 className="text-white mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="text-white/70 hover:text-white transition-colors">Features</a></li>
                <li><Link to="/learning" className="text-white/70 hover:text-white transition-colors">Learning</Link></li>
                <li><a href="#how-it-works" className="text-white/70 hover:text-white transition-colors">How It Works</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#about" className="text-white/70 hover:text-white transition-colors">About</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white mb-4">Support</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#contact" className="text-white/70 hover:text-white transition-colors">Contact</a></li>
                <li><a href="#privacy" className="text-white/70 hover:text-white transition-colors">Privacy</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 pt-6">
            <p className="text-white/60 text-sm text-center">
              © 2026 Homey. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      <GettingStartedModal
        open={showModal}
        onClose={() => setShowModal(false)}
        sessionUser={sessionUser}
        onCompleted={() => {
          setLocalProfile(getUserProfile());
          setIsLoggedIn(true);
          void navigate('/dashboard');
        }}
      />

    </AppLayout>
  );
}
