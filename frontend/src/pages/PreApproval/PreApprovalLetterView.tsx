import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  Phone,
  Users,
  Home,
  CheckCircle,
} from 'lucide-react';
import { fetchSessionUser } from '@/lib/auth';

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
  const [sessionName, setSessionName] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('homeyProfile');
    if (saved) setProfile(JSON.parse(saved) as Profile);

    // Also pull income summary from GatherDocuments if available
    const gatherSaved = localStorage.getItem('homeyGatherDocuments');
    void (async () => {
      const user = await fetchSessionUser();
      if (user) {
        setSessionName(`${user.firstName} ${user.lastName}`.trim());
      }
    })();
    void gatherSaved; // suppress unused warning
  }, []);

  // Income/expenses: prefer homeyProfile, fall back to income summary stored in gather docs page
  const incomeSummaryRaw = localStorage.getItem('homeyGatherDocuments');
  void incomeSummaryRaw;

  const monthlyIncome = parseFloat(profile.monthlyIncome ?? '0');
  const monthlyExpenses = parseFloat(profile.monthlyExpenses ?? '0');
  const creditScore = parseInt(profile.creditScore ?? '0');

  // TVM: monthly payment capacity = income * 45% - expenses
  // PV of annuity: purchasePrice loan portion = pmt * (1-(1+r)^-n)/r, r=6%/12, n=360
  // Then purchase price = loan / 0.97 (borrower puts 3% down)
  const monthlyPayment = monthlyIncome * 0.45 - monthlyExpenses;
  const r = 0.06 / 12;
  const n = 360;
  const maxLoan = monthlyIncome > 0 && monthlyPayment > 0
    ? Math.round((monthlyPayment * (1 - Math.pow(1 + r, -n)) / r) / 1000) * 1000
    : null;
  const DEFAULT_PURCHASE_PRICE = 500000;
  const purchasePrice = maxLoan ? Math.round((maxLoan / 0.97) / 1000) * 1000 : DEFAULT_PURCHASE_PRICE;
  const downPayment = Math.round(purchasePrice * 0.03 / 1000) * 1000;

  const loanType = creditScore > 0 ? getLoanType(creditScore) : 'Conventional';
  const expirationDate = getExpirationDate();
  const todayFormatted = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  // Name: prefer session (first + last), then homeyProfile name
  const borrowerName = sessionName || (profile.name && profile.name.trim()) || '';

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
      className="flex-1 flex flex-col relative z-10 px-4 md:px-10 py-8 md:h-screen md:overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
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

      {/* Main 2-col layout */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 flex-1 md:overflow-hidden" style={{ alignItems: 'stretch' }}>

        {/* Left: What it means + How to use + Next steps — single card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass rounded-2xl flex flex-col overflow-hidden"
        >
          {/* What this letter means */}
          <div className="p-6 flex flex-col gap-4 flex-1">
            <h3 className="text-white font-bold text-2xl">What this letter means</h3>
            <ul className="flex flex-col gap-4">
              {[
                { text: 'A lender has reviewed your finances and is willing to lend up to a stated amount.', good: true },
                { text: "Sellers will take your offer seriously — many won't consider offers without one.", good: true },
                { text: 'It is valid for 60–90 days. If it expires, you can request a renewal.', good: true },
                { text: 'It is NOT a final loan approval — that happens after you choose a specific home.', good: false },
                { text: 'Your rate is NOT locked in until you go under contract on a home.', good: false },
              ].map(({ text, good }) => (
                <li key={text} className="flex items-start gap-3 text-white/80 text-lg">
                  <div className={`mt-1 w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${good ? 'bg-[#bdc4a7]/30' : 'bg-[#bf8b85]/30'}`}>
                    <CheckCircle className={`w-3.5 h-3.5 ${good ? 'text-[#bdc4a7]' : 'text-[#bf8b85]'}`} />
                  </div>
                  {text}
                </li>
              ))}
            </ul>
          </div>

          <div className="border-t border-white/10" />

          {/* How to use it */}
          <div className="p-6 flex flex-col gap-3 flex-1">
            <h3 className="text-white font-bold text-2xl">How to use it</h3>
            <p className="text-white/70 text-lg leading-relaxed">
              Attach your pre-approval letter to every offer you make. Your real estate agent will send it with the purchase offer to show the seller you are financially ready to close.
            </p>
          </div>

          <div className="border-t border-white/10" />

          {/* Your next steps */}
          <div className="p-6 flex flex-col gap-4 flex-1">
            <h2 className="text-white font-bold text-2xl">Your next steps</h2>
            {nextSteps.map((step, i) => (
              <div key={step.title} className="flex items-start gap-4 flex-1">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-xl shrink-0"
                  style={{ backgroundColor: step.color + '40' }}
                >
                  {i + 1}
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg mb-1">{step.title}</h3>
                  <p className="text-white/70 text-base leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Right: Mock Letter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-2xl overflow-hidden flex flex-col h-full"
          style={{ background: 'rgba(255,255,255,0.95)' }}
        >
          <div className="px-8 py-5 flex items-center justify-between" style={{ backgroundColor: '#3e78b2' }}>
            <div>
              <p className="text-white font-bold text-xl tracking-widest uppercase">Homey Mortgage</p>
              <p className="text-white/70 text-sm">Mortgage Pre-Approval Letter</p>
            </div>
            <div className="text-right text-white/70 text-xs">
              <p>NMLS #000000</p>
              <p>homey.com | (800) 000-0000</p>
            </div>
          </div>

          <div className="px-8 py-6 flex flex-col gap-5 text-gray-800 flex-1">
            <div className="flex justify-between text-base text-gray-500 border-b border-gray-100 pb-3">
              <span><span className="font-semibold text-gray-700">Date:</span> {todayFormatted}</span>
              <span><span className="font-semibold text-gray-700">Valid Through:</span> {expirationDate}</span>
            </div>

            <p className="text-base text-gray-600 italic">To Whom It May Concern,</p>
            <p className="text-base leading-relaxed text-gray-700">
              This letter certifies that <span className="font-bold text-gray-900">{borrowerName || '[Borrower Name]'}</span> has
              been pre-approved for a residential mortgage loan, subject to the terms and conditions outlined below.
              This determination is based on a preliminary review of the applicant's financial information.
            </p>

            <div className="flex flex-col gap-0 border border-gray-200 rounded-lg overflow-hidden text-base">
              {[
                { label: 'Borrower Name', value: borrowerName || '[Borrower Name]', highlight: false },
                {
                  label: 'Purchase Price',
                  value: `$${purchasePrice.toLocaleString()}`,
                  highlight: true,
                },
                {
                  label: 'Down Payment (3%)',
                  value: `$${downPayment.toLocaleString()}`,
                  highlight: false,
                },
                { label: 'Loan Type', value: loanType, highlight: false },
                { label: 'Interest Rate', value: '6.00%', highlight: false },
                { label: 'Loan Term', value: '30 Years (360 Months)', highlight: false },
                { label: 'Expiration Date', value: expirationDate, highlight: false },
              ].map(({ label, value, highlight }, idx, arr) => (
                <div
                  key={label}
                  className={`flex justify-between items-center px-4 py-3.5 ${idx < arr.length - 1 ? 'border-b border-gray-100' : ''} ${highlight ? 'bg-blue-50' : idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                >
                  <span className="text-gray-500 font-medium">{label}</span>
                  <span className={`font-semibold text-right ${highlight ? 'text-[#3e78b2] text-base' : 'text-gray-800'}`}>
                    {value}
                  </span>
                </div>
              ))}
            </div>

            <p className="text-sm text-gray-400 leading-relaxed border-t border-gray-100 pt-3">
              This pre-approval is not a commitment to lend and is contingent upon satisfactory property appraisal,
              title search, verification of all information provided, and final underwriting approval. Rates and terms
              are subject to change. This letter expires 90 days from the date issued above.
            </p>

            <div className="flex items-end justify-between mt-auto pt-2">
              <div className="flex flex-col gap-0.5">
                <div className="h-px bg-gray-400 w-52" />
                <p className="text-base text-gray-600 font-semibold">Authorized Loan Officer</p>
                <p className="text-sm text-gray-400">Homey Mortgage Corporation — NMLS #000000</p>
              </div>
              <div className="text-right text-sm text-gray-400">
                <p>Pre-Approval Reference</p>
                <p className="font-mono text-gray-500">HMC-{new Date().getFullYear()}-{String(Math.floor(Math.random() * 90000) + 10000)}</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
