import { useState } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import {
  Home,
  User,
  DollarSign,
  CreditCard,
  Briefcase,
  PiggyBank,
  Wallet,
  X,
  ArrowRight,
  CheckCircle,
  TrendingUp,
  MapPin,
  Shield,
  Calculator,
  Target,
} from 'lucide-react';
import { AppLayout } from '@/components/AppLayout';
import { AffordabilityMap } from '@/components/AffordabilityMap';

export function HomePage() {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [step, setStep] = useState(1);
  const [noCredit, setNoCredit] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    desiredHomePrice: '',
    creditScore: '',
    monthlyIncome: '',
    yearlyIncome: '',
    savingsTotal: '',
    monthlyExpenses: '',
    industry: '',
  });

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const profileData = {
      ...formData,
      creditScore: noCredit ? 'No Credit' : formData.creditScore,
    };
    localStorage.setItem('homeyProfile', JSON.stringify(profileData));
    void navigate('/dashboard');
  };

  const canProceed = () => {
    if (step === 1) {
      return formData.name && formData.desiredHomePrice && (noCredit || formData.creditScore);
    }
    if (step === 2) {
      return formData.monthlyIncome && formData.yearlyIncome && formData.savingsTotal && formData.monthlyExpenses;
    }
    return formData.industry;
  };

  return (
    <AppLayout className="bg-gradient-to-b from-[#3e78b2] via-[#5a8ebd] to-[#92b4a7]">
      {/* Header */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="relative z-20 glass border-b border-white/10"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <Home className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-white">Homey</span>
            </div>
            <nav className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-white/80 hover:text-white transition-colors">Features</a>
              <a href="#how-it-works" className="text-white/80 hover:text-white transition-colors">How It Works</a>
              <a href="#about" className="text-white/80 hover:text-white transition-colors">About</a>
              <button
                onClick={() => setShowModal(true)}
                className="px-6 py-2 bg-white text-[#3e78b2] rounded-xl hover:bg-white/90 transition-all"
              >
                Get Started
              </button>
            </nav>
            <button
              onClick={() => setShowModal(true)}
              className="md:hidden px-4 py-2 bg-white text-[#3e78b2] rounded-xl"
            >
              Start
            </button>
          </div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <section id="features" className="relative flex-1 flex items-center justify-center px-4 py-20">
        <div className="max-w-6xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
              Your Dream Home<br />Starts Here
            </h1>
            <p className="text-xl md:text-2xl text-white/80 mb-12 max-w-3xl mx-auto">
              Navigate your home buying journey with personalized insights, affordability maps, and milestone tracking.
            </p>
            <motion.button
              onClick={() => setShowModal(true)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 bg-white text-[#3e78b2] rounded-2xl hover:bg-white/90 transition-all shadow-2xl inline-flex items-center gap-3 text-lg"
            >
              Begin Your Journey
              <ArrowRight className="w-5 h-5" />
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

      {/* Onboarding Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass rounded-3xl p-8 max-w-4xl w-full my-8 relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-6 right-6 w-10 h-10 rounded-full glass hover:bg-white/20 flex items-center justify-center transition-all"
              >
                <X className="w-5 h-5 text-white" />
              </button>

              {/* Progress Steps */}
              <div className="flex items-center justify-center gap-3 mb-8">
                {[1, 2, 3].map((s) => (
                  <div key={s} className="flex items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                        step === s
                          ? 'bg-white text-[#3e78b2]'
                          : step > s
                          ? 'bg-[#bdc4a7] text-white'
                          : 'bg-white/20 text-white/50'
                      }`}
                    >
                      {step > s ? <CheckCircle className="w-5 h-5" /> : s}
                    </div>
                    {s < 3 && (
                      <div
                        className={`w-12 h-1 mx-2 rounded ${
                          step > s ? 'bg-[#bdc4a7]' : 'bg-white/20'
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>

              <form onSubmit={handleSubmit}>
                {/* Step 1: Basic Info */}
                {step === 1 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <h2 className="text-3xl text-white mb-2 text-center">Let's Get Started</h2>
                    <p className="text-white/70 text-center mb-8">Tell us about your home buying goals</p>

                    <div className="space-y-5">
                      <div>
                        <label className="block text-white/90 mb-2">
                          <User className="inline w-4 h-4 mr-2" />
                          Full Name
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="w-full px-4 py-3 glass rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all"
                          placeholder="Enter your name"
                        />
                      </div>

                      <div>
                        <label className="block text-white/90 mb-2">
                          <Home className="inline w-4 h-4 mr-2" />
                          Desired Home Price
                        </label>
                        <input
                          type="number"
                          required
                          value={formData.desiredHomePrice}
                          onChange={(e) => setFormData({ ...formData, desiredHomePrice: e.target.value })}
                          className="w-full px-4 py-3 glass rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all"
                          placeholder="e.g., 450000"
                        />
                      </div>

                      <div>
                        <label className="block text-white/90 mb-2">
                          <CreditCard className="inline w-4 h-4 mr-2" />
                          Credit Score
                        </label>
                        <input
                          type="number"
                          required={!noCredit}
                          disabled={noCredit}
                          min="300"
                          max="850"
                          value={formData.creditScore}
                          onChange={(e) => setFormData({ ...formData, creditScore: e.target.value })}
                          className="w-full px-4 py-3 glass rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          placeholder="300 - 850"
                        />
                        <label className="flex items-center gap-2 mt-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={noCredit}
                            onChange={(e) => {
                              setNoCredit(e.target.checked);
                              if (e.target.checked) {
                                setFormData({ ...formData, creditScore: '' });
                              }
                            }}
                            className="w-4 h-4 rounded border-white/30 bg-white/10 text-[#3e78b2] focus:ring-2 focus:ring-white/50"
                          />
                          <span className="text-white/80 text-sm">I don't have credit</span>
                        </label>
                      </div>

                      {formData.desiredHomePrice && parseInt(formData.desiredHomePrice) > 0 && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="mt-6"
                        >
                          <AffordabilityMap targetPrice={parseInt(formData.desiredHomePrice)} />
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* Step 2: Financial Info */}
                {step === 2 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <h2 className="text-3xl text-white mb-2 text-center">Financial Overview</h2>
                    <p className="text-white/70 text-center mb-8">Help us understand your financial situation</p>

                    <div className="space-y-5">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-white/90 mb-2">
                            <DollarSign className="inline w-4 h-4 mr-2" />
                            Monthly Income
                          </label>
                          <input
                            type="number"
                            required
                            value={formData.monthlyIncome}
                            onChange={(e) => setFormData({ ...formData, monthlyIncome: e.target.value })}
                            className="w-full px-4 py-3 glass rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all"
                            placeholder="5000"
                          />
                        </div>
                        <div>
                          <label className="block text-white/90 mb-2">
                            <DollarSign className="inline w-4 h-4 mr-2" />
                            Yearly Income
                          </label>
                          <input
                            type="number"
                            required
                            value={formData.yearlyIncome}
                            onChange={(e) => setFormData({ ...formData, yearlyIncome: e.target.value })}
                            className="w-full px-4 py-3 glass rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all"
                            placeholder="60000"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-white/90 mb-2">
                            <PiggyBank className="inline w-4 h-4 mr-2" />
                            Savings Total
                          </label>
                          <input
                            type="number"
                            required
                            value={formData.savingsTotal}
                            onChange={(e) => setFormData({ ...formData, savingsTotal: e.target.value })}
                            className="w-full px-4 py-3 glass rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all"
                            placeholder="25000"
                          />
                        </div>
                        <div>
                          <label className="block text-white/90 mb-2">
                            <Wallet className="inline w-4 h-4 mr-2" />
                            Monthly Expenses
                          </label>
                          <input
                            type="number"
                            required
                            value={formData.monthlyExpenses}
                            onChange={(e) => setFormData({ ...formData, monthlyExpenses: e.target.value })}
                            className="w-full px-4 py-3 glass rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all"
                            placeholder="2500"
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Step 3: Industry */}
                {step === 3 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <h2 className="text-3xl text-white mb-2 text-center">Almost There!</h2>
                    <p className="text-white/70 text-center mb-8">One last thing about your background</p>

                    <div>
                      <label className="block text-white/90 mb-2">
                        <Briefcase className="inline w-4 h-4 mr-2" />
                        Industry of Work
                      </label>
                      <select
                        required
                        value={formData.industry}
                        onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                        className="w-full px-4 py-3 glass rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-white/50 transition-all cursor-pointer"
                      >
                        <option value="" className="bg-[#3e78b2] text-white">Select your industry</option>
                        {industries.map((industry) => (
                          <option key={industry} value={industry} className="bg-[#3e78b2] text-white">
                            {industry}
                          </option>
                        ))}
                      </select>
                    </div>
                  </motion.div>
                )}

                {/* Navigation Buttons */}
                <div className="flex items-center justify-between mt-8">
                  {step > 1 ? (
                    <button
                      type="button"
                      onClick={() => setStep(step - 1)}
                      className="px-6 py-3 glass rounded-xl text-white hover:bg-white/20 transition-all"
                    >
                      Back
                    </button>
                  ) : (
                    <div />
                  )}

                  {step < 3 ? (
                    <button
                      type="button"
                      onClick={() => setStep(step + 1)}
                      disabled={!canProceed()}
                      className="px-6 py-3 bg-white text-[#3e78b2] rounded-xl hover:bg-white/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      Next
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={!canProceed()}
                      className="px-6 py-3 bg-white text-[#3e78b2] rounded-xl hover:bg-white/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Complete Setup
                    </button>
                  )}
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AppLayout>
  );
}
