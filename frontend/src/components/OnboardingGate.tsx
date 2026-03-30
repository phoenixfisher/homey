import { useEffect, useState } from 'react';
import { Outlet } from 'react-router';
import { motion } from 'motion/react';
import {
  Home,
  User,
  DollarSign,
  CreditCard,
  Briefcase,
  PiggyBank,
  Wallet,
  ArrowRight,
  CheckCircle,
  MapPin,
} from 'lucide-react';
import { AppLayout } from '@/components/AppLayout';
import { getUserProfile, saveUserProfile, type HomeyUserProfile } from '@/lib/auth';
import { fetchUserProfile, updateUserProfile } from '@/lib/profile';
import { fetchSessionUser } from '@/lib/auth';

const emptyForm = {
  name: '',
  desiredHomePrice: '',
  creditScore: '',
  monthlyIncome: '',
  yearlyIncome: '',
  savingsTotal: '',
  monthlyExpenses: '',
  industry: '',
  targetZipCode: '',
};

function isValidZip(zip: string): boolean {
  return /^\d{5}$/.test(zip.trim());
}

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

export function OnboardingGate() {
  const [profile, setProfile] = useState<HomeyUserProfile | null>(getUserProfile);
  const [step, setStep] = useState(1);
  const [noCredit, setNoCredit] = useState(false);
  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => {
    const checkSessionAndHydrate = async () => {
      if (profile) return; // already have profile

      try {
        const sessionUser = await fetchSessionUser();
        if (sessionUser) {
          // User is logged in, try to hydrate profile from server
          const serverProfile = await fetchUserProfile();
          if (serverProfile) {
            // Apply to localStorage
            const localProfile: HomeyUserProfile = {
              name: `${serverProfile.firstName} ${serverProfile.lastName}`.trim(),
              desiredHomePrice: serverProfile.desiredHomePrice?.toString() ?? '',
              creditScore: serverProfile.creditScore?.toString() ?? '',
              monthlyIncome: serverProfile.monthlyIncome?.toString() ?? '',
              yearlyIncome: '', // not stored server-side
              savingsTotal: serverProfile.totalSavings?.toString() ?? '',
              monthlyExpenses: serverProfile.monthlyExpenses?.toString() ?? '',
              industry: serverProfile.industryOfWork ?? '',
              targetZipCode: serverProfile.targetZipCode ?? '',
            };
            saveUserProfile(localProfile);
            setProfile(localProfile);
          }
        }
      } catch (error) {
        console.error('Failed to hydrate profile:', error);
      }
    };

    void checkSessionAndHydrate();
  }, [profile]);

  if (profile) return <Outlet />;

  const canProceed = () => {
    if (step === 1) return !!(formData.name && formData.desiredHomePrice && (noCredit || formData.creditScore) && isValidZip(formData.targetZipCode));
    if (step === 2) return !!(formData.monthlyIncome && formData.yearlyIncome && formData.savingsTotal && formData.monthlyExpenses);
    return !!formData.industry;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const profileData: HomeyUserProfile = {
      ...formData,
      creditScore: noCredit ? 'No Credit' : formData.creditScore,
    };
    saveUserProfile(profileData);

    try {
      const current = await fetchUserProfile();
      if (current) {
        const nameParts = profileData.name.trim().split(' ');
        const firstName = nameParts[0] || current.firstName;
        const lastName = nameParts.slice(1).join(' ') || current.lastName;

        await updateUserProfile({
          username: current.username,
          email: current.email,
          firstName,
          lastName,
          desiredHomePrice: parseFloat(profileData.desiredHomePrice) || null,
          creditScore: profileData.creditScore === 'No Credit' ? null : parseInt(profileData.creditScore) || null,
          monthlyIncome: parseFloat(profileData.monthlyIncome) || null,
          monthlyExpenses: parseFloat(profileData.monthlyExpenses) || null,
          totalSavings: parseFloat(profileData.savingsTotal) || null,
          targetZipCode: isValidZip(profileData.targetZipCode ?? '') ? (profileData.targetZipCode ?? '').trim() : null,
          industryOfWork: profileData.industry || null,
        });
      }
    } catch {
      // ignore failures while writing the profile server-side
    }

    setProfile(profileData);
  };

  return (
    <AppLayout className="bg-gradient-to-b from-[#3e78b2] via-[#5a8ebd] to-[#92b4a7]">
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-3xl p-8 max-w-4xl w-full"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Home className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-3xl text-white mb-1">Welcome to Homey</h1>
            <p className="text-white/70">Complete your profile to unlock your dashboard</p>
          </div>

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
                    className={`w-12 h-1 mx-2 rounded ${step > s ? 'bg-[#bdc4a7]' : 'bg-white/20'}`}
                  />
                )}
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            {/* Step 1: Basic Info */}
            {step === 1 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                <h2 className="text-2xl text-white mb-2 text-center">Let's Get Started</h2>
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
                          if (e.target.checked) setFormData({ ...formData, creditScore: '' });
                        }}
                        className="w-4 h-4 rounded border-white/30 bg-white/10 text-[#3e78b2] focus:ring-2 focus:ring-white/50"
                      />
                      <span className="text-white/80 text-sm">I don't have credit</span>
                    </label>
                  </div>

                  <div>
                    <label className="block text-white/90 mb-2">
                      <MapPin className="inline w-4 h-4 mr-2" />
                      Target ZIP Code
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={5}
                      required
                      value={formData.targetZipCode}
                      onChange={(e) => setFormData({ ...formData, targetZipCode: e.target.value.replace(/\D/g, '').slice(0, 5) })}
                      className="w-full px-4 py-3 glass rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all"
                      placeholder="e.g., 84604"
                    />
                    <p className="text-white/50 text-xs mt-1.5">Used to search homes near your desired area</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 2: Financial Info */}
            {step === 2 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                <h2 className="text-2xl text-white mb-2 text-center">Financial Overview</h2>
                <p className="text-white/70 text-center mb-8">Help us understand your financial situation</p>

                <div className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                <h2 className="text-2xl text-white mb-2 text-center">Almost There!</h2>
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

            {/* Navigation */}
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
      </main>
    </AppLayout>
  );
}
