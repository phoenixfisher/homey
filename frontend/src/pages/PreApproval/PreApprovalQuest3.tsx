import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileText,
  CreditCard,
  Calculator,
  Star,
  CheckSquare,
  Square,
  ArrowRight,
  CheckCircle,
  Info,
} from 'lucide-react';

interface Quest3Profile {
  name: string;
  creditScore: string;
  monthlyIncome: string;
  desiredHomePrice: string;
  savingsTotal: string;
  monthlyExpenses: string;
}

interface PreApprovalQuest3Props {
  profile: Quest3Profile;
  onComplete: () => void;
}

type Section = 'documents' | 'credit' | 'estimate' | 'cta';

const SECTION_ORDER: Section[] = ['documents', 'credit', 'estimate', 'cta'];

const DOCUMENTS = [
  'Pay stubs (last 2 months)',
  'Tax returns (last 2 years)',
  'Bank statements (last 3 months)',
  'W-2s or 1099s',
  'Government-issued photo ID',
];

function getCreditLabel(score: number): { label: string; color: string } {
  if (score >= 800) return { label: 'Exceptional', color: 'text-emerald-400' };
  if (score >= 740) return { label: 'Very Good', color: 'text-[#bdc4a7]' };
  if (score >= 670) return { label: 'Good', color: 'text-[#92b4a7]' };
  if (score >= 580) return { label: 'Fair', color: 'text-yellow-400' };
  return { label: 'Poor', color: 'text-[#bf8b85]' };
}

function getCreditTip(score: number, isNoCredit: boolean): string {
  if (isNoCredit)
    return 'Consider opening a secured credit card to start building credit history before applying.';
  if (score >= 800) return 'Excellent position — you should qualify for the best available rates.';
  if (score >= 740) return 'Great score. Shop multiple lenders to find the most competitive rates.';
  if (score >= 670) return 'Good standing. Paying down any revolving debt could push you into a better tier.';
  if (score >= 580)
    return 'Consider paying down revolving balances before applying to improve your score.';
  return 'Focus on on-time payments and reducing debt before seeking pre-approval.';
}

function getCreditRingColor(score: number, isNoCredit: boolean): string {
  if (isNoCredit) return '#bf8b85';
  if (score >= 740) return '#bdc4a7';
  if (score >= 670) return '#92b4a7';
  if (score >= 580) return '#f59e0b';
  return '#bf8b85';
}

export function PreApprovalQuest3({ profile, onComplete }: PreApprovalQuest3Props) {
  const [section, setSection] = useState<Section>('documents');
  const [checkedDocs, setCheckedDocs] = useState<boolean[]>(new Array(DOCUMENTS.length).fill(false));

  const isNoCredit = profile.creditScore === 'No Credit';
  const creditScore = isNoCredit ? 0 : parseFloat(profile.creditScore) || 0;
  const monthlyIncome = parseFloat(profile.monthlyIncome) || 0;
  const monthlyExpenses = parseFloat(profile.monthlyExpenses) || 0;

  const { label: creditLabel, color: creditColor } = getCreditLabel(creditScore);
  const creditTip = getCreditTip(creditScore, isNoCredit);
  const ringColor = getCreditRingColor(creditScore, isNoCredit);

  // Loan estimate calculation
  const rawMaxLoan = monthlyIncome > 0
    ? ((monthlyIncome * 0.43 - monthlyExpenses) * 12) / 0.06
    : 0;
  const maxLoan = Math.max(0, Math.min(rawMaxLoan, 5_000_000));
  const loanLow = Math.round(maxLoan * 0.9);
  const loanHigh = Math.round(maxLoan * 1.1);
  const estimatedMonthlyPayment = maxLoan > 0 ? Math.round((maxLoan * 0.06) / 12) : 0;

  const docsChecked = checkedDocs.filter(Boolean).length;
  const sectionIndex = SECTION_ORDER.indexOf(section);

  const advance = () => {
    const idx = SECTION_ORDER.indexOf(section);
    if (idx < SECTION_ORDER.length - 1) {
      setSection(SECTION_ORDER[idx + 1]);
    }
  };

  const toggleDoc = (i: number) => {
    const updated = [...checkedDocs];
    updated[i] = !updated[i];
    setCheckedDocs(updated);
  };

  const formatCurrency = (n: number) =>
    n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={section}
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -40 }}
        transition={{ duration: 0.35 }}
        className="glass rounded-3xl p-8 max-w-4xl mx-auto"
      >
        {/* Progress strip */}
        <div className="flex items-center gap-2 mb-6">
          {SECTION_ORDER.map((s, i) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-all ${
                i <= sectionIndex ? 'bg-[#bdc4a7]' : 'bg-white/20'
              }`}
            />
          ))}
        </div>

        {/* ── Section 1: Documents ── */}
        {section === 'documents' && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Document Checklist</h2>
            <p className="text-white/70 mb-6">
              Gather these documents before meeting with a lender. Check off what you already have.
            </p>

            <div className="glass rounded-2xl p-5 mb-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#bdc4a7]" />
                  <span className="text-white font-medium">Documents Ready</span>
                </div>
                <span className="text-[#bdc4a7] font-bold text-lg">
                  {docsChecked} of {DOCUMENTS.length}
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-white/10 rounded-full h-2 mb-5">
                <div
                  className="bg-[#bdc4a7] h-2 rounded-full transition-all duration-500"
                  style={{ width: `${(docsChecked / DOCUMENTS.length) * 100}%` }}
                />
              </div>

              <ul className="space-y-3">
                {DOCUMENTS.map((doc, i) => (
                  <li
                    key={doc}
                    onClick={() => toggleDoc(i)}
                    className="flex items-center gap-3 cursor-pointer group"
                  >
                    <div className="transition-transform group-hover:scale-110">
                      {checkedDocs[i] ? (
                        <CheckSquare className="w-5 h-5 text-[#bdc4a7]" />
                      ) : (
                        <Square className="w-5 h-5 text-white/40 group-hover:text-white/60" />
                      )}
                    </div>
                    <span
                      className={`text-base transition-colors ${
                        checkedDocs[i] ? 'text-white line-through text-white/50' : 'text-white/80 group-hover:text-white'
                      }`}
                    >
                      {doc}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {docsChecked === DOCUMENTS.length && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass rounded-xl p-3 flex items-center gap-2 border border-[#bdc4a7]/30"
              >
                <CheckCircle className="w-4 h-4 text-[#bdc4a7] flex-shrink-0" />
                <p className="text-[#bdc4a7] text-base">All documents ready! You're well-prepared.</p>
              </motion.div>
            )}
          </div>
        )}

        {/* ── Section 2: Credit Review ── */}
        {section === 'credit' && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Credit Score Review</h2>
            <p className="text-white/70 mb-8">
              Your credit score is a key factor lenders use to determine your loan eligibility and interest rate.
            </p>

            <div className="flex flex-col items-center mb-8">
              <div
                className="w-36 h-36 rounded-full flex flex-col items-center justify-center mb-4"
                style={{
                  border: `4px solid ${ringColor}`,
                  boxShadow: `0 0 32px ${ringColor}40`,
                  background: 'rgba(255,255,255,0.05)',
                }}
              >
                <CreditCard className="w-7 h-7 mb-1" style={{ color: ringColor }} />
                <div className="text-3xl font-bold text-white">
                  {isNoCredit ? 'N/A' : profile.creditScore}
                </div>
                <div className={`text-sm font-semibold ${creditColor}`}>{creditLabel}</div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 w-full max-w-lg">
                {[
                  { label: 'Poor', range: '<580', color: 'bg-[#bf8b85]/20 text-[#bf8b85] border-[#bf8b85]/30' },
                  { label: 'Fair', range: '580–669', color: 'bg-yellow-400/20 text-yellow-300 border-yellow-400/30' },
                  { label: 'Good', range: '670–739', color: 'bg-[#92b4a7]/20 text-[#92b4a7] border-[#92b4a7]/30' },
                  { label: 'Very Good', range: '740–799', color: 'bg-[#bdc4a7]/20 text-[#bdc4a7] border-[#bdc4a7]/30' },
                  { label: 'Exceptional', range: '800+', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-400/30' },
                ].map((tier) => (
                  <div key={tier.label} className={`rounded-xl p-2 text-center text-xs border ${tier.color}`}>
                    <div className="font-semibold">{tier.label}</div>
                    <div className="opacity-70">{tier.range}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass rounded-2xl p-5 flex items-start gap-3 border border-white/10">
              <Info className="w-5 h-5 text-[#92b4a7] flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-white font-medium mb-1">Personalized Tip</div>
                <p className="text-white/70 text-base">{creditTip}</p>
              </div>
            </div>
          </div>
        )}

        {/* ── Section 3: Loan Estimate ── */}
        {section === 'estimate' && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Estimated Loan Amount</h2>
            <p className="text-white/70 mb-8">
              Based on your income and expenses, here's a rough estimate of your borrowing capacity.
            </p>

            {maxLoan > 0 ? (
              <>
                <div className="glass rounded-2xl p-6 mb-4 text-center">
                  <Calculator className="w-8 h-8 text-[#bdc4a7] mx-auto mb-3" />
                  <div className="text-white/60 text-base mb-2">Estimated Loan Range</div>
                  <div className="text-3xl font-bold text-white mb-1">
                    {formatCurrency(loanLow)} – {formatCurrency(loanHigh)}
                  </div>
                  <div className="text-white/50 text-sm mb-5">Based on 43% DTI limit and 6% interest rate</div>

                  <div className="border-t border-white/10 pt-4">
                    <div className="text-white/60 text-base mb-1">Estimated Monthly Payment</div>
                    <div className="text-2xl font-bold text-[#92b4a7]">
                      ~{formatCurrency(estimatedMonthlyPayment)}/mo
                    </div>
                  </div>
                </div>

                <div className="glass rounded-xl p-4 flex items-start gap-3 border border-yellow-400/20">
                  <Info className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <p className="text-white/70 text-base">
                    This is an estimate only, not a guarantee of loan approval. Actual amounts depend on
                    your credit score, lender criteria, property type, and current interest rates.
                    Always consult a licensed mortgage professional for an official pre-approval.
                  </p>
                </div>
              </>
            ) : (
              <div className="glass rounded-2xl p-8 text-center">
                <p className="text-white/60">
                  We couldn't compute an estimate. Please make sure your income and expense data are
                  entered in your profile.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── Section 4: CTA ── */}
        {section === 'cta' && (
          <div>
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
                className="w-20 h-20 bg-[#bdc4a7]/20 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <Star className="w-10 h-10 text-[#bdc4a7]" />
              </motion.div>
              <h2 className="text-3xl font-bold text-white mb-2">You're Ready!</h2>
              <p className="text-white/70 text-lg">
                Great work, {profile.name}. Here's your pre-approval summary.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="glass rounded-2xl p-5 text-center border border-white/10">
                <FileText className="w-6 h-6 text-[#bdc4a7] mx-auto mb-2" />
                <div className="text-white/60 text-sm mb-1">Documents Ready</div>
                <div className="text-2xl font-bold text-white">
                  {docsChecked} / {DOCUMENTS.length}
                </div>
              </div>
              <div className="glass rounded-2xl p-5 text-center border border-white/10">
                <CreditCard className="w-6 h-6 text-[#92b4a7] mx-auto mb-2" />
                <div className="text-white/60 text-sm mb-1">Credit Score</div>
                <div className="text-2xl font-bold text-white">
                  {isNoCredit ? 'N/A' : profile.creditScore}
                </div>
              </div>
              <div className="glass rounded-2xl p-5 text-center border border-white/10">
                <Calculator className="w-6 h-6 text-[#bf8b85] mx-auto mb-2" />
                <div className="text-white/60 text-sm mb-1">Est. Loan Range</div>
                <div className="text-lg font-bold text-white leading-tight">
                  {maxLoan > 0
                    ? `${formatCurrency(loanLow)}–${formatCurrency(loanHigh)}`
                    : 'N/A'}
                </div>
              </div>
            </div>

            <div className="glass rounded-2xl p-5 mb-6 flex items-start gap-3 border border-[#92b4a7]/30">
              <Info className="w-5 h-5 text-[#92b4a7] flex-shrink-0 mt-0.5" />
              <p className="text-white/70 text-base">
                Your next step is to contact a lender with these documents. Many banks and credit
                unions offer free pre-approval consultations. Bring your documents and ask about
                current rates.
              </p>
            </div>

            <button
              onClick={onComplete}
              className="w-full py-4 bg-white text-[#3e78b2] rounded-2xl font-bold text-lg hover:bg-white/90 transition-all flex items-center justify-center gap-3 shadow-xl"
            >
              <CheckCircle className="w-5 h-5" />
              Complete Module
            </button>
          </div>
        )}

        {/* ── Bottom Nav (not on CTA) ── */}
        {section !== 'cta' && (
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/10">
            <button
              onClick={advance}
              className="px-6 py-3 bg-white text-[#3e78b2] rounded-xl font-semibold hover:bg-white/90 transition-all flex items-center gap-2"
            >
              Next
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={advance}
              className="text-white/50 hover:text-white/80 text-sm transition-colors underline underline-offset-2"
            >
              Skip this section
            </button>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
