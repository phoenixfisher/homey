import { useEffect, useState } from 'react';
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
} from 'lucide-react';
import { AffordabilityMap } from '@/components/AffordabilityMap';
import {
  getUserProfile,
  saveUserProfile,
  type HomeyUserProfile,
  type SessionUser,
} from '@/lib/auth';
import { fetchUserProfile, updateUserProfile } from '@/lib/profile';

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

const emptyForm = {
  name: '',
  desiredHomePrice: '',
  creditScore: '',
  monthlyIncome: '',
  yearlyIncome: '',
  savingsTotal: '',
  monthlyExpenses: '',
  industry: '',
};

type Props = {
  open: boolean;
  onClose: () => void;
  sessionUser: SessionUser | null;
  onCompleted: () => void | Promise<void>;
};

export function GettingStartedModal({ open, onClose, sessionUser, onCompleted }: Props) {
  const [step, setStep] = useState(1);
  const [noCredit, setNoCredit] = useState(false);
  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => {
    if (!open) {
      return;
    }
    const saved = getUserProfile();
    if (saved) {
      setFormData({
        name: saved.name,
        desiredHomePrice: saved.desiredHomePrice,
        creditScore: saved.creditScore === 'No Credit' ? '' : saved.creditScore,
        monthlyIncome: saved.monthlyIncome,
        yearlyIncome: saved.yearlyIncome,
        savingsTotal: saved.savingsTotal,
        monthlyExpenses: saved.monthlyExpenses,
        industry: saved.industry,
      });
      setNoCredit(saved.creditScore === 'No Credit');
    } else if (sessionUser) {
      setFormData({
        ...emptyForm,
        name: `${sessionUser.firstName} ${sessionUser.lastName}`.trim(),
      });
      setNoCredit(false);
    } else {
      setFormData(emptyForm);
      setNoCredit(false);
    }
    setStep(1);
  }, [open, sessionUser]);

  const canProceed = () => {
    if (step === 1) {
      return !!(formData.name && formData.desiredHomePrice && (noCredit || formData.creditScore));
    }
    if (step === 2) {
      return !!(formData.monthlyIncome && formData.yearlyIncome && formData.savingsTotal && formData.monthlyExpenses);
    }
    return !!formData.industry;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const profileData: HomeyUserProfile = {
      ...formData,
      creditScore: noCredit ? 'No Credit' : formData.creditScore,
    };
    saveUserProfile(profileData);

    if (sessionUser) {
      try {
        const current = await fetchUserProfile();
        if (current) {
          const nameParts = profileData.name.trim().split(' ');
          const firstName = nameParts[0] ?? current.firstName;
          const lastName = nameParts.slice(1).join(' ') || current.lastName;
          await updateUserProfile({
            username: current.username,
            email: current.email,
            firstName,
            lastName,
            desiredHomePrice: parseFloat(profileData.desiredHomePrice) || null,
            creditScore: profileData.creditScore === 'No Credit' ? null : (parseInt(profileData.creditScore) || null),
            monthlyIncome: parseFloat(profileData.monthlyIncome) || null,
            monthlyExpenses: parseFloat(profileData.monthlyExpenses) || null,
            totalSavings: parseFloat(profileData.savingsTotal) || null,
            targetZipCode: current.targetZipCode,
            industryOfWork: profileData.industry || null,
          });
        }
      } catch {
        // silently ignore — data is still in localStorage
      }
    }

    await Promise.resolve(onCompleted());
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => onClose()}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="glass rounded-3xl p-8 max-w-4xl w-full my-8 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => onClose()}
              className="absolute top-6 right-6 w-10 h-10 rounded-full glass hover:bg-white/20 flex items-center justify-center transition-all"
            >
              <X className="w-5 h-5 text-white" />
            </button>

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
              {step === 1 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <h2 className="text-3xl text-white mb-2 text-center">Let&apos;s Get Started</h2>
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
                        <span className="text-white/80 text-sm">I don&apos;t have credit</span>
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
  );
}
