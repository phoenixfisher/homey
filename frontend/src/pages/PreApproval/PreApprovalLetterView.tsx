import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  Star,
  Phone,
  Users,
  Home,
  CheckCircle,
} from 'lucide-react';

interface Profile {
  name?: string;
  creditScore?: string;
  monthlyIncome?: string;
  monthlyExpenses?: string;
  desiredHomePrice?: string;
}

interface Props {
  onBack: () => void;
}

function getLoanType(creditScore: number): string {
  if (creditScore >= 620) return 'Conventional';
  if (creditScore >= 580) return 'FHA';
  return 'FHA / Specialty';
}

function getExpirationDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 90);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

export function PreApprovalLetterView({ onBack }: Props) {
  const [profile, setProfile] = useState<Profile>({});

  useEffect(() => {
    const saved = localStorage.getItem('homeyProfile');
    if (saved) setProfile(JSON.parse(saved) as Profile);
  }, []);

  const monthlyIncome = parseFloat(profile.monthlyIncome ?? '0');
  const monthlyExpenses = parseFloat(profile.monthlyExpenses ?? '0');
  const creditScore = parseInt(profile.creditScore ?? '0');

  // Estimated max loan: (income * 0.43 - expenses) * 12 / 0.06
  const maxLoan = monthlyIncome > 0
    ? Math.round(((monthlyIncome * 0.43 - monthlyExpenses) * 12) / 0.06 / 1000) * 1000
    : null;

  const loanType = creditScore > 0 ? getLoanType(creditScore) : 'Conventional';
  const expirationDate = getExpirationDate();
  const borrowerName = profile.name ?? 'Your Name';

  const nextSteps = [
    {
      icon: <Phone className="w-7 h-7" />,
      color: '#3e78b2',
      title: 'Contact a Lender',
      desc: 'Reach out to a mortgage lender or broker to begin your official pre-approval application. Bring all your documents.',
    },
    {
      icon: <Users className="w-7 h-7" />,
      color: '#92b4a7',
      title: 'Find a Real Estate Agent',
      desc: 'A buyer\'s agent is free to you and will help you find homes, negotiate, and navigate the entire purchase process.',
    },
    {
      icon: <Home className="w-7 h-7" />,
      color: '#bdc4a7',
      title: 'Start Shopping',
      desc: 'You know your budget. Start touring homes in your price range and keep your pre-approval letter ready to attach to offers.',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex-1 flex flex-col relative z-10 px-4 md:px-10 py-8"
    >
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 glass rounded-xl text-white hover:bg-white/20 transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>
        <div>
          <h1 className="text-3xl font-bold text-white">Pre-Approval</h1>
          <p className="text-white/60 text-sm mt-0.5">The finish line — here is what it all leads to</p>
        </div>
      </div>

      {/* Celebration banner */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass rounded-2xl px-8 py-6 mb-6 flex items-center gap-5"
        style={{ borderLeft: '4px solid #bdc4a7' }}
      >
        <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: '#bdc4a7' + '30' }}>
          <Star className="w-6 h-6 text-[#bdc4a7]" />
        </div>
        <div>
          <h2 className="text-white font-bold text-xl mb-1">You made it to the final step</h2>
          <p className="text-white/70 text-base">
            A Pre-Approval Letter is what every home buyer needs before making an offer. It tells sellers you are financially qualified and serious. Here is what yours will look like.
          </p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">

        {/* Mock Letter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.95)' }}
        >
          {/* Letter header bar */}
          <div className="px-8 py-5" style={{ backgroundColor: '#3e78b2' }}>
            <p className="text-white font-bold text-lg tracking-wide">HOMEY MORTGAGE</p>
            <p className="text-white/70 text-sm">Mortgage Pre-Approval Letter</p>
          </div>

          <div className="px-8 py-6 flex flex-col gap-5 text-gray-800">
            <div className="flex justify-between text-sm text-gray-500">
              <span>Date: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              <span>Valid Through: {expirationDate}</span>
            </div>

            <p className="text-sm leading-relaxed text-gray-700">
              To Whom It May Concern,
            </p>

            <p className="text-sm leading-relaxed text-gray-700">
              This letter confirms that <span className="font-bold text-gray-900">{borrowerName}</span> has been pre-approved for a mortgage loan subject to the following terms and conditions:
            </p>

            {/* Key fields */}
            <div className="flex flex-col gap-3">
              {[
                { label: 'Borrower Name', value: borrowerName },
                {
                  label: 'Maximum Loan Amount',
                  value: maxLoan && maxLoan > 0
                    ? `$${maxLoan.toLocaleString()}`
                    : 'To be determined by lender',
                  highlight: true,
                },
                { label: 'Loan Type', value: loanType },
                { label: 'Interest Rate', value: 'Subject to market rates at time of closing' },
                { label: 'Expiration Date', value: expirationDate },
              ].map(({ label, value, highlight }) => (
                <div key={label} className="flex justify-between items-start border-b border-gray-100 pb-2">
                  <span className="text-sm text-gray-500 font-medium">{label}</span>
                  <span className={`text-sm font-semibold text-right max-w-xs ${highlight ? 'text-[#3e78b2] text-base' : 'text-gray-800'}`}>
                    {value}
                  </span>
                </div>
              ))}
            </div>

            <p className="text-xs text-gray-500 leading-relaxed border-t border-gray-100 pt-4">
              This pre-approval is not a commitment to lend and is subject to satisfactory appraisal, title search, verification of information provided, and final underwriting approval. This letter expires 90 days from the date above.
            </p>

            {/* Signature */}
            <div className="flex flex-col gap-1 pt-2">
              <div className="h-px bg-gray-300 w-48" />
              <p className="text-sm text-gray-600 font-medium">Loan Officer Signature</p>
              <p className="text-xs text-gray-400">Homey Mortgage — NMLS #000000</p>
            </div>
          </div>
        </motion.div>

        {/* What it means */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col gap-4"
        >
          <div className="glass rounded-2xl p-6">
            <h3 className="text-white font-bold text-lg mb-4">What this letter means</h3>
            <ul className="flex flex-col gap-3">
              {[
                { text: 'A lender has reviewed your finances and is willing to lend you up to a stated amount.', good: true },
                { text: 'Sellers will take your offer seriously — many won\'t consider offers without one.', good: true },
                { text: 'It is valid for 60–90 days. If it expires, you can request a renewal.', good: true },
                { text: 'It is NOT a final loan approval — that happens after you choose a specific home.', good: false },
                { text: 'Your rate is NOT locked in until you go under contract on a home.', good: false },
              ].map(({ text, good }) => (
                <li key={text} className="flex items-start gap-3 text-white/80 text-sm">
                  <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${good ? 'bg-[#bdc4a7]/30' : 'bg-[#bf8b85]/30'}`}>
                    <CheckCircle className={`w-3.5 h-3.5 ${good ? 'text-[#bdc4a7]' : 'text-[#bf8b85]'}`} />
                  </div>
                  {text}
                </li>
              ))}
            </ul>
          </div>

          <div className="glass rounded-2xl p-6">
            <h3 className="text-white font-bold text-lg mb-3">How to use it</h3>
            <p className="text-white/70 text-sm leading-relaxed">
              Attach your pre-approval letter to every offer you make on a home. Your real estate agent will send it along with the purchase offer to show the seller you are financially ready to close.
            </p>
          </div>
        </motion.div>
      </div>

      {/* Next steps */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h2 className="text-white font-bold text-2xl mb-4">Your next steps</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {nextSteps.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.1 }}
              className="glass rounded-2xl p-6 flex flex-col gap-4"
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-white"
                style={{ backgroundColor: step.color + '40' }}
              >
                {step.icon}
              </div>
              <div>
                <h3 className="text-white font-bold text-lg mb-1">{step.title}</h3>
                <p className="text-white/70 text-sm leading-relaxed">{step.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
