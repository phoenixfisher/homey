import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  DollarSign,
  TrendingDown,
  CreditCard,
  PiggyBank,
  Briefcase,
  CheckCircle,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Save,
  Cloud,
  AlertCircle,
  History,
} from 'lucide-react';
import { fetchSessionUser, getUserProfile, saveUserProfile, isLoggedIn as getIsLoggedIn } from '@/lib/auth';
import { fetchUserProfile } from '@/lib/profile';
import {
  fetchQualificationSnapshot,
  saveQualificationSnapshot,
  formatSavedAt,
  type QualificationSnapshot,
} from '@/lib/preapproval';
import { LoginPromptModal } from '@/components/LoginPromptModal';

interface Profile {
  name?: string;
  creditScore?: string;
  monthlyIncome?: string;
  monthlyExpenses?: string;
  savingsTotal?: string;
  desiredHomePrice?: string;
}

interface Props {
  onBack: () => void;
  onNext: () => void;
}

export function QualificationView({ onBack, onNext }: Props) {
  const [profile, setProfile] = useState<Profile>({});
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [savedSnapshot, setSavedSnapshot] = useState<QualificationSnapshot | null>(null);
  const [showSnapshotDropdown, setShowSnapshotDropdown] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  useEffect(() => {
    const localProfile = getUserProfile();
    const initialLoggedIn = getIsLoggedIn() || !!localProfile;
    setIsLoggedIn(initialLoggedIn);

    if (localProfile) {
      setProfile(localProfile);
    } else {
      const saved = localStorage.getItem('homeyProfile');
      if (saved) {
        try {
          setProfile(JSON.parse(saved) as Profile);
        } catch {
          // ignore invalid saved profile
        }
      }
    }

    void (async () => {
      const session = await fetchSessionUser();
      if (session) {
        const profileFromApi = await fetchUserProfile();
        if (profileFromApi) {
          const mappedProfile: Profile = {
            name: `${profileFromApi.firstName} ${profileFromApi.lastName}`.trim(),
            creditScore: profileFromApi.creditScore?.toString() ?? '',
            monthlyIncome: profileFromApi.monthlyIncome?.toString() ?? '',
            monthlyExpenses: profileFromApi.monthlyExpenses?.toString() ?? '',
            savingsTotal: profileFromApi.totalSavings?.toString() ?? '',
            desiredHomePrice: profileFromApi.desiredHomePrice?.toString() ?? '',
          };
          setProfile(mappedProfile);
          const existing = getUserProfile();
          saveUserProfile({
            name: mappedProfile.name ?? existing?.name ?? '',
            desiredHomePrice: mappedProfile.desiredHomePrice ?? existing?.desiredHomePrice ?? '',
            creditScore: mappedProfile.creditScore ?? existing?.creditScore ?? '',
            monthlyIncome: mappedProfile.monthlyIncome ?? existing?.monthlyIncome ?? '',
            yearlyIncome: existing?.yearlyIncome ?? '',
            savingsTotal: mappedProfile.savingsTotal ?? existing?.savingsTotal ?? '',
            monthlyExpenses: mappedProfile.monthlyExpenses ?? existing?.monthlyExpenses ?? '',
            industry: profileFromApi.industryOfWork ?? existing?.industry ?? '',
          });
        }

        setIsLoggedIn(true);
        try {
          const snap = await fetchQualificationSnapshot();
          if (snap) setSavedSnapshot(snap);
        } catch {
          // silently ignore
        }
      }
    })();
  }, []);

  const handleSaveSnapshot = async () => {
    if (!isLoggedIn) {
      setShowLoginPrompt(true);
      return;
    }
    setSaveStatus('saving');
    try {
      const creditScore = parseInt(profile.creditScore ?? '0') || undefined;
      await saveQualificationSnapshot({
        dti: dti ?? undefined,
        creditScore: creditScore as number | undefined,
        monthlyIncome: monthlyIncome > 0 ? monthlyIncome : undefined,
        monthlyExpenses: monthlyExpenses > 0 ? monthlyExpenses : undefined,
        savings: savings > 0 ? savings : undefined,
        downPaymentPct: downPaymentPercent ?? undefined,
      });
      const snap: QualificationSnapshot = {
        dti: dti ?? undefined,
        creditScore: creditScore,
        monthlyIncome: monthlyIncome > 0 ? monthlyIncome : undefined,
        monthlyExpenses: monthlyExpenses > 0 ? monthlyExpenses : undefined,
        savings: savings > 0 ? savings : undefined,
        downPaymentPct: downPaymentPercent ?? undefined,
        savedAt: new Date().toISOString(),
      };
      setSavedSnapshot(snap);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const monthlyIncome = parseFloat(profile.monthlyIncome ?? '0');
  const monthlyExpenses = parseFloat(profile.monthlyExpenses ?? '0');
  const savings = parseFloat(profile.savingsTotal ?? '0');
  const desiredPrice = parseFloat(profile.desiredHomePrice ?? '0');
  const creditScore = Number(profile.creditScore);
  const safeCreditScore = Number.isFinite(creditScore) && creditScore > 0 ? creditScore : 0;

  const dti = monthlyIncome > 0 ? (monthlyExpenses / monthlyIncome) * 100 : null;
  const downPaymentNeeded = desiredPrice * 0.2;
  const downPaymentPercent = desiredPrice > 0 ? (savings / desiredPrice) * 100 : null;

  const getDTIColor = (d: number) => {
    if (d <= 36) return { color: '#bdc4a7', label: 'Excellent', desc: 'Well within lender limits' };
    if (d <= 43) return { color: '#f0c040', label: 'Acceptable', desc: 'Within most lender limits' };
    return { color: '#bf8b85', label: 'High', desc: 'May be flagged by lenders' };
  };

  const getCreditColor = (s: number) => {
    if (s >= 740) return { color: '#bdc4a7', label: 'Very Good – Strong approval odds' };
    if (s >= 670) return { color: '#92b4a7', label: 'Good – Likely to qualify' };
    if (s >= 620) return { color: '#f0c040', label: 'Fair – May qualify with conditions' };
    return { color: '#bf8b85', label: 'Poor – May need improvement first' };
  };

  const dtiInfo = dti !== null ? getDTIColor(dti) : null;
  const creditInfo = safeCreditScore > 0 ? getCreditColor(safeCreditScore) : null;

  const steps = [
    {
      icon: <Briefcase className="w-7 h-7" />,
      color: '#bf8b85',
      title: 'Employment Verification',
      what: 'The lender may call your employer directly to confirm your position, start date, and that you are still actively employed.',
      good: '2+ years with the same employer is ideal. Recent job changes are okay if in the same field.',
      personal: null,
    },
    {
      icon: <PiggyBank className="w-7 h-7" />,
      color: '#bdc4a7',
      title: 'Asset Verification',
      what: 'The lender confirms you have enough savings for a down payment, closing costs (2–5% of the loan), and cash reserves.',
      good: '20% down avoids PMI. You also need 2–5% for closing costs on top of the down payment.',
      personal: savings > 0 && desiredPrice > 0
        ? `You have $${savings.toLocaleString()} saved. A 20% down payment on your target home is $${downPaymentNeeded.toLocaleString()} — you are at ${downPaymentPercent!.toFixed(0)}%.`
        : null,
    },
    {
      icon: <DollarSign className="w-7 h-7" />,
      color: '#3e78b2',
      title: 'Income Calculation',
      what: 'The lender verifies and averages all income sources — salary, bonuses, self-employment, rental, and other income.',
      good: 'Stable, documented income over 2+ years. Gross monthly income is used, not net.',
      personal: monthlyIncome > 0
        ? `Based on your profile, your gross monthly income is $${monthlyIncome.toLocaleString()}.`
        : null,
    },
    {
      icon: <CreditCard className="w-7 h-7" />,
      color: '#92b4a7',
      title: 'Credit Review',
      what: 'The lender reviews your full credit report — score, payment history, open accounts, and any derogatory marks.',
      good: 'A score of 620+ is typically the minimum. 740+ gets the best rates.',
      personal: safeCreditScore > 0
        ? `Your credit score is ${safeCreditScore} — ${creditInfo!.label}.`
        : null,
      highlight: creditInfo,
    },
    {
      icon: <TrendingDown className="w-7 h-7" />,
      color: '#5a8ebd',
      title: 'Debt-to-Income Ratio (DTI)',
      what: 'Total monthly debt obligations ÷ gross monthly income. This is one of the most important factors lenders use.',
      good: 'Most lenders want a DTI of 43% or below. Under 36% is ideal.',
      personal: dti !== null
        ? `Your estimated DTI is ${dti.toFixed(1)}% — ${dtiInfo!.label}. ${dtiInfo!.desc}.`
        : null,
      highlight: dtiInfo,
      bar: dti !== null ? Math.min(dti, 100) : null,
    },
  ];

  return (
    <>
    <LoginPromptModal
      open={showLoginPrompt}
      onClose={() => setShowLoginPrompt(false)}
      message="Log in to save your qualification snapshot to your account."
    />
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex-1 flex flex-col relative z-10 px-4 md:px-10 py-8"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-4 mb-4">
        <div className="flex items-center gap-4 flex-1">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 glass rounded-xl text-white hover:bg-white/20 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white">Qualification</h1>
            <p className="text-white/60 text-sm mt-0.5">What your lender is calculating behind the scenes</p>
          </div>
        </div>

        {/* Save snapshot button */}
        <div className="flex flex-col items-end gap-1">
          <button
            onClick={() => void handleSaveSnapshot()}
            disabled={saveStatus === 'saving'}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shrink-0
              ${saveStatus === 'saved' ? 'bg-emerald-500/30 border border-emerald-400/40 text-emerald-300' :
                saveStatus === 'error' ? 'bg-[#bf8b85]/30 border border-[#bf8b85]/40 text-[#bf8b85]' :
                'glass text-white hover:bg-white/20'}`}
          >
            {saveStatus === 'saving' ? (
              <><Cloud className="w-4 h-4 animate-pulse" /> Saving...</>
            ) : saveStatus === 'saved' ? (
              <><CheckCircle className="w-4 h-4" /> Saved!</>
            ) : saveStatus === 'error' ? (
              <><AlertCircle className="w-4 h-4" /> Error saving</>
            ) : (
              <><Save className="w-4 h-4" /> {savedSnapshot ? 'Resave Qualification' : 'Save Qualification'}</>
            )}
          </button>
          {savedSnapshot?.savedAt && (
            <p className="text-white/40 text-xs">Last saved: {formatSavedAt(savedSnapshot.savedAt)}</p>
          )}
          {!isLoggedIn && (
            <p className="text-white/40 text-xs">Log in to save to your account</p>
          )}
        </div>
      </div>

      {/* Saved Snapshot Dropdown */}
      {savedSnapshot && (
        <div className="mb-4">
          <button
            onClick={() => setShowSnapshotDropdown(v => !v)}
            className="flex items-center gap-2 px-4 py-2.5 glass rounded-xl text-white/80 hover:bg-white/10 transition-all text-sm w-full sm:w-auto"
          >
            <History className="w-4 h-4 text-[#bdc4a7]" />
            <span>Last Saved Snapshot — {formatSavedAt(savedSnapshot.savedAt)}</span>
            {showSnapshotDropdown
              ? <ChevronUp className="w-4 h-4 ml-auto text-white/40" />
              : <ChevronDown className="w-4 h-4 ml-auto text-white/40" />}
          </button>
          <AnimatePresence>
            {showSnapshotDropdown && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="mt-2 glass rounded-2xl p-5 grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {[
                    { label: 'DTI', value: savedSnapshot.dti != null ? `${Number(savedSnapshot.dti).toFixed(1)}%` : 'N/A' },
                    { label: 'Credit Score', value: savedSnapshot.creditScore ?? 'N/A' },
                    { label: 'Monthly Income', value: savedSnapshot.monthlyIncome != null ? `$${Number(savedSnapshot.monthlyIncome).toLocaleString()}` : 'N/A' },
                    { label: 'Monthly Expenses', value: savedSnapshot.monthlyExpenses != null ? `$${Number(savedSnapshot.monthlyExpenses).toLocaleString()}` : 'N/A' },
                    { label: 'Savings', value: savedSnapshot.savings != null ? `$${Number(savedSnapshot.savings).toLocaleString()}` : 'N/A' },
                    { label: 'Down Payment %', value: savedSnapshot.downPaymentPct != null ? `${Number(savedSnapshot.downPaymentPct).toFixed(1)}%` : 'N/A' },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex flex-col gap-0.5">
                      <p className="text-white/40 text-xs uppercase tracking-wider">{label}</p>
                      <p className="text-white font-semibold text-base">{String(value)}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}


      {/* Accordion steps */}
      <div className="flex flex-col gap-3 w-full">
        {steps.map((step, i) => {
          const isOpen = openSection === step.title;
          return (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="glass rounded-2xl overflow-hidden"
            >
              <button
                onClick={() => setOpenSection(isOpen ? null : step.title)}
                className="w-full flex items-center justify-between px-8 py-5 hover:bg-white/10 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-white shrink-0"
                    style={{ backgroundColor: step.color + '50' }}
                  >
                    {step.icon}
                  </div>
                  <div className="text-left">
                    <p className="text-white/40 text-xs font-semibold uppercase tracking-wider">Step {i + 1}</p>
                    <span className="text-white font-bold text-xl">{step.title}</span>
                  </div>
                </div>
                {isOpen
                  ? <ChevronUp className="w-6 h-6 text-white/60 shrink-0" />
                  : <ChevronDown className="w-6 h-6 text-white/60 shrink-0" />
                }
              </button>

              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="px-8 pt-2 pb-8 flex flex-col gap-4">
                      <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-1">
                          <p className="text-white/50 text-sm uppercase tracking-wider font-semibold">What they check</p>
                          <p className="text-white/80 text-lg leading-relaxed">{step.what}</p>
                        </div>
                        <div className="flex flex-col gap-1">
                          <p className="text-white/50 text-sm uppercase tracking-wider font-semibold">What good looks like</p>
                          <p className="text-white/80 text-lg leading-relaxed">{step.good}</p>
                        </div>
                      </div>

                      {/* DTI bar */}
                      {'bar' in step && step.bar !== null && dtiInfo && (
                        <div className="flex flex-col gap-2">
                          <div className="flex justify-between text-xs text-white/50">
                            <span>0%</span>
                            <span className="text-white/70 font-semibold">Your DTI: {dti!.toFixed(1)}%</span>
                            <span>100%</span>
                          </div>
                          <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${step.bar}%` }}
                              transition={{ delay: 0.3, duration: 0.8 }}
                              className="h-full rounded-full"
                              style={{ backgroundColor: dtiInfo.color }}
                            />
                          </div>
                          <div className="flex text-xs text-white/40 justify-between">
                            <span>Excellent (&lt;36%)</span>
                            <span>Acceptable (36–43%)</span>
                            <span>High (&gt;43%)</span>
                          </div>
                        </div>
                      )}

                      {/* Personalized callout */}
                      {step.personal && (
                        <div
                          className="flex items-start gap-2 px-4 py-3 rounded-xl text-sm"
                          style={{ backgroundColor: step.color + '25', borderLeft: `3px solid ${step.color}` }}
                        >
                          <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: step.color }} />
                          <p className="text-white/90 text-base">{step.personal}</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Bottom CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-4 glass rounded-2xl p-8 flex flex-col md:flex-row items-center gap-6"
      >
        <div className="flex-1">
          <h3 className="text-white font-bold text-2xl mb-2">If everything checks out...</h3>
          <p className="text-white/70 text-base leading-relaxed">
            The lender issues a <span className="text-white font-semibold">Pre-Approval Letter</span> — a written commitment stating how much they are willing to lend you. This is your green light to start making offers on homes.
          </p>
        </div>
        <button
          onClick={onNext}
          className="flex items-center gap-3 px-6 py-4 rounded-2xl text-white font-semibold text-lg shrink-0 hover:bg-white/20 transition-all hover:-translate-y-1 hover:shadow-[0_6px_16px_rgba(20,50,100,0.5)]"
          style={{ backgroundColor: '#3e78b260' }}
        >
          Next: Pre-Approval Letter
          <ArrowRight className="w-5 h-5" />
        </button>
      </motion.div>
    </motion.div>
    </>
  );
}
