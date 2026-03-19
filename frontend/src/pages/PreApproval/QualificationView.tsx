import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  DollarSign,
  TrendingDown,
  CreditCard,
  PiggyBank,
  Briefcase,
  CheckCircle,
  ArrowRight,
} from 'lucide-react';

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
}

export function QualificationView({ onBack }: Props) {
  const [profile, setProfile] = useState<Profile>({});

  useEffect(() => {
    const saved = localStorage.getItem('homeyProfile');
    if (saved) setProfile(JSON.parse(saved) as Profile);
  }, []);

  const monthlyIncome = parseFloat(profile.monthlyIncome ?? '0');
  const monthlyExpenses = parseFloat(profile.monthlyExpenses ?? '0');
  const savings = parseFloat(profile.savingsTotal ?? '0');
  const desiredPrice = parseFloat(profile.desiredHomePrice ?? '0');
  const creditScore = parseInt(profile.creditScore ?? '0');

  const dti = monthlyIncome > 0 ? (monthlyExpenses / monthlyIncome) * 100 : null;
  const downPaymentNeeded = desiredPrice * 0.2;
  const downPaymentPercent = downPaymentNeeded > 0 ? (savings / downPaymentNeeded) * 100 : null;

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
  const creditInfo = creditScore > 0 ? getCreditColor(creditScore) : null;

  const steps = [
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
    {
      icon: <CreditCard className="w-7 h-7" />,
      color: '#92b4a7',
      title: 'Credit Review',
      what: 'The lender reviews your full credit report — score, payment history, open accounts, and any derogatory marks.',
      good: 'A score of 620+ is typically the minimum. 740+ gets the best rates.',
      personal: creditScore > 0
        ? `Your credit score is ${creditScore} — ${creditInfo!.label}.`
        : null,
      highlight: creditInfo,
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
      icon: <Briefcase className="w-7 h-7" />,
      color: '#bf8b85',
      title: 'Employment Verification',
      what: 'The lender may call your employer directly to confirm your position, start date, and that you are still actively employed.',
      good: '2+ years with the same employer is ideal. Recent job changes are okay if in the same field.',
      personal: null,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex-1 flex flex-col relative z-10 px-4 md:px-10 py-8"
    >
      {/* Header */}
      <div className="flex items-center gap-4 mb-4">
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

      {/* Intro */}
      <motion.p
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
        className="text-white/70 text-lg max-w-3xl mb-8"
      >
        Once you submit your application and documents, the lender takes over. They run through five key checks to determine whether to issue you a Pre-Approval Letter. Here is exactly what they are looking at.
      </motion.p>

      {/* Steps */}
      <div className="flex flex-col gap-5 w-full">
        {steps.map((step, i) => (
          <motion.div
            key={step.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.1 }}
            className="glass rounded-2xl p-7"
          >
            <div className="flex items-start gap-5">
              {/* Icon */}
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-white shrink-0 mt-0.5"
                style={{ backgroundColor: step.color + '50' }}
              >
                {step.icon}
              </div>

              <div className="flex-1 flex flex-col gap-3">
                {/* Title + step number */}
                <div className="flex items-center gap-3">
                  <span className="text-white/30 text-sm font-semibold">STEP {i + 1}</span>
                  <h2 className="text-white font-bold text-xl">{step.title}</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* What they check */}
                  <div className="flex flex-col gap-1">
                    <p className="text-white/50 text-xs uppercase tracking-wider font-semibold">What they check</p>
                    <p className="text-white/80 text-base leading-relaxed">{step.what}</p>
                  </div>

                  {/* What good looks like */}
                  <div className="flex flex-col gap-1">
                    <p className="text-white/50 text-xs uppercase tracking-wider font-semibold">What good looks like</p>
                    <p className="text-white/80 text-base leading-relaxed">{step.good}</p>
                  </div>
                </div>

                {/* DTI bar */}
                {'bar' in step && step.bar !== null && dtiInfo && (
                  <div className="flex flex-col gap-2 mt-1">
                    <div className="flex justify-between text-xs text-white/50">
                      <span>0%</span>
                      <span className="text-white/70 font-semibold">Your DTI: {dti!.toFixed(1)}%</span>
                      <span>100%</span>
                    </div>
                    <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${step.bar}%` }}
                        transition={{ delay: 0.5 + i * 0.1, duration: 0.8 }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: dtiInfo.color }}
                      />
                    </div>
                    {/* Zone markers */}
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
                    <p className="text-white/90">{step.personal}</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Bottom CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className="mt-8 glass rounded-2xl p-8 flex flex-col md:flex-row items-center gap-6"
      >
        <div className="flex-1">
          <h3 className="text-white font-bold text-2xl mb-2">If everything checks out...</h3>
          <p className="text-white/70 text-base leading-relaxed">
            The lender issues a <span className="text-white font-semibold">Pre-Approval Letter</span> — a written commitment stating how much they are willing to lend you. This is your green light to start making offers on homes.
          </p>
        </div>
        <div className="flex items-center gap-3 px-6 py-4 rounded-2xl text-white font-semibold text-lg shrink-0" style={{ backgroundColor: '#3e78b2' + '60' }}>
          Next: Pre-Approval Letter
          <ArrowRight className="w-5 h-5" />
        </div>
      </motion.div>
    </motion.div>
  );
}
