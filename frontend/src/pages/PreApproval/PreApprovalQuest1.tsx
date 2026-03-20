import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  CreditCard,
  DollarSign,
  TrendingDown,
  PiggyBank,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowRight,
  ChevronRight,
  RotateCcw,
} from 'lucide-react';

interface Quest1Profile {
  name: string;
  creditScore: string;
  monthlyIncome: string;
  yearlyIncome: string;
  savingsTotal: string;
  monthlyExpenses: string;
  desiredHomePrice: string;
}

interface PreApprovalQuest1Props {
  profile: Quest1Profile;
  onComplete: () => void;
}

type Section = 'lenders' | 'loans' | 'dti' | 'quiz';

const SECTION_ORDER: Section[] = ['lenders', 'loans', 'dti', 'quiz'];

const QUIZ_QUESTIONS = [
  {
    question: 'What does DTI stand for?',
    options: [
      'Down-To-Income Ratio',
      'Debt-to-Income Ratio',
      'Deferred Tax Interest',
      'Direct Transfer Index',
    ],
    correct: 'Debt-to-Income Ratio',
  },
  {
    question: 'Which loan type requires as little as 3.5% down payment?',
    options: ['Conventional Loan', 'VA Loan', 'FHA Loan', 'USDA Loan'],
    correct: 'FHA Loan',
  },
  {
    question: 'What is generally considered a good credit score for a mortgage?',
    options: ['600 or above', '650 or above', '700 or above', '750 or above'],
    correct: '700 or above',
  },
  {
    question: 'What is a typical maximum DTI ratio lenders prefer?',
    options: ['28%', '36%', '43%', '50%'],
    correct: '43%',
  },
];

function VerdictIcon({ verdict }: { verdict: 'green' | 'yellow' | 'red' }) {
  if (verdict === 'green') return <CheckCircle className="w-4 h-4 text-emerald-400" />;
  if (verdict === 'yellow') return <AlertCircle className="w-4 h-4 text-yellow-400" />;
  return <XCircle className="w-4 h-4 text-[#bf8b85]" />;
}

function verdictBorder(v: 'green' | 'yellow' | 'red') {
  if (v === 'green') return 'border-emerald-400/40';
  if (v === 'yellow') return 'border-yellow-400/40';
  return 'border-[#bf8b85]/40';
}

function verdictText(v: 'green' | 'yellow' | 'red') {
  if (v === 'green') return 'text-emerald-400';
  if (v === 'yellow') return 'text-yellow-400';
  return 'text-[#bf8b85]';
}

export function PreApprovalQuest1({ profile, onComplete }: PreApprovalQuest1Props) {
  const [section, setSection] = useState<Section>('lenders');
  const [quizAnswers, setQuizAnswers] = useState<(string | null)[]>([null, null, null, null]);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizResult, setQuizResult] = useState<'pass' | 'fail' | null>(null);

  const monthlyIncome = parseFloat(profile.monthlyIncome) || 0;
  const monthlyExpenses = parseFloat(profile.monthlyExpenses) || 0;
  const savingsTotal = parseFloat(profile.savingsTotal) || 0;
  const desiredHomePrice = parseFloat(profile.desiredHomePrice) || 0;
  const creditScore = profile.creditScore === 'No Credit' ? 0 : parseFloat(profile.creditScore) || 0;
  const isNoCredit = profile.creditScore === 'No Credit';

  const dtiRatio = monthlyIncome > 0 ? (monthlyExpenses / monthlyIncome) * 100 : 0;
  const downPaymentPct = desiredHomePrice > 0 ? (savingsTotal / desiredHomePrice) * 100 : 0;

  // Verdicts
  const creditVerdict: 'green' | 'yellow' | 'red' = isNoCredit
    ? 'red'
    : creditScore >= 700
    ? 'green'
    : creditScore >= 620
    ? 'yellow'
    : 'red';

  const incomeVerdict: 'green' | 'yellow' | 'red' =
    monthlyIncome >= 5000 ? 'green' : monthlyIncome >= 3000 ? 'yellow' : 'red';

  const dtiVerdict: 'green' | 'yellow' | 'red' =
    dtiRatio < 36 ? 'green' : dtiRatio <= 43 ? 'yellow' : 'red';

  const downVerdict: 'green' | 'yellow' | 'red' =
    downPaymentPct >= 20 ? 'green' : downPaymentPct >= 10 ? 'yellow' : 'red';

  // Best loan match
  const bestLoan: 'conventional' | 'fha' | 'va_usda' = isNoCredit
    ? 'va_usda'
    : creditScore >= 620
    ? 'conventional'
    : creditScore >= 580
    ? 'fha'
    : 'va_usda';

  const advance = () => {
    const idx = SECTION_ORDER.indexOf(section);
    if (idx < SECTION_ORDER.length - 1) {
      setSection(SECTION_ORDER[idx + 1]);
    }
  };

  const handleQuizAnswer = (qIdx: number, answer: string) => {
    if (quizSubmitted) return;
    const updated = [...quizAnswers];
    updated[qIdx] = answer;
    setQuizAnswers(updated);
  };

  const handleQuizSubmit = () => {
    const allCorrect = QUIZ_QUESTIONS.every((q, i) => quizAnswers[i] === q.correct);
    setQuizSubmitted(true);
    setQuizResult(allCorrect ? 'pass' : 'fail');
    if (allCorrect) {
      setTimeout(onComplete, 1200);
    }
  };

  const handleQuizRetry = () => {
    setQuizAnswers([null, null, null, null]);
    setQuizSubmitted(false);
    setQuizResult(null);
  };

  const sectionIndex = SECTION_ORDER.indexOf(section);

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
        {/* Section indicator */}
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

        {/* ── Section 1: Lenders ── */}
        {section === 'lenders' && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">What Lenders Evaluate</h2>
            <p className="text-white/70 mb-8">
              Here's how your financial profile looks to a mortgage lender, {profile.name}.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Credit Score */}
              <div className={`glass rounded-2xl p-5 border ${verdictBorder(creditVerdict)}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-white" />
                  </div>
                  <VerdictIcon verdict={creditVerdict} />
                </div>
                <div className="text-white/60 text-sm mb-1">Credit Score</div>
                <div className="text-2xl font-bold text-white mb-1">
                  {isNoCredit ? 'No Credit' : profile.creditScore}
                </div>
                <div className={`text-sm ${verdictText(creditVerdict)}`}>
                  {isNoCredit
                    ? 'No credit history on file'
                    : creditScore >= 700
                    ? 'Excellent — qualifies for best rates'
                    : creditScore >= 620
                    ? 'Fair — may qualify with higher rates'
                    : 'Below minimum for most loans'}
                </div>
              </div>

              {/* Monthly Income */}
              <div className={`glass rounded-2xl p-5 border ${verdictBorder(incomeVerdict)}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-white" />
                  </div>
                  <VerdictIcon verdict={incomeVerdict} />
                </div>
                <div className="text-white/60 text-sm mb-1">Monthly Income</div>
                <div className="text-2xl font-bold text-white mb-1">
                  ${monthlyIncome.toLocaleString()}
                </div>
                <div className={`text-sm ${verdictText(incomeVerdict)}`}>
                  {monthlyIncome >= 5000
                    ? 'Strong income for mortgage approval'
                    : monthlyIncome >= 3000
                    ? 'Moderate — may limit loan amount'
                    : 'Below typical lender minimums'}
                </div>
              </div>

              {/* DTI Ratio */}
              <div className={`glass rounded-2xl p-5 border ${verdictBorder(dtiVerdict)}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                    <TrendingDown className="w-5 h-5 text-white" />
                  </div>
                  <VerdictIcon verdict={dtiVerdict} />
                </div>
                <div className="text-white/60 text-sm mb-1">DTI Ratio</div>
                <div className="text-2xl font-bold text-white mb-1">
                  {monthlyIncome > 0 ? `${dtiRatio.toFixed(1)}%` : 'N/A'}
                </div>
                <div className={`text-sm ${verdictText(dtiVerdict)}`}>
                  {dtiRatio < 36
                    ? 'Healthy — well within lender limits'
                    : dtiRatio <= 43
                    ? 'Acceptable — near the preferred ceiling'
                    : 'High — may face approval challenges'}
                </div>
              </div>

              {/* Down Payment */}
              <div className={`glass rounded-2xl p-5 border ${verdictBorder(downVerdict)}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                    <PiggyBank className="w-5 h-5 text-white" />
                  </div>
                  <VerdictIcon verdict={downVerdict} />
                </div>
                <div className="text-white/60 text-sm mb-1">Down Payment Readiness</div>
                <div className="text-2xl font-bold text-white mb-1">
                  {desiredHomePrice > 0 ? `${downPaymentPct.toFixed(1)}%` : 'N/A'}
                </div>
                <div className={`text-sm ${verdictText(downVerdict)}`}>
                  {downPaymentPct >= 20
                    ? 'Ideal — avoids PMI entirely'
                    : downPaymentPct >= 10
                    ? 'Reasonable — PMI may apply'
                    : 'Low — consider FHA or saving more'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Section 2: Loan Types ── */}
        {section === 'loans' && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Loan Types Explained</h2>
            <p className="text-white/70 mb-8">
              Based on your credit score, we've highlighted the loan type that best fits you.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Conventional */}
              <div
                className={`glass rounded-2xl p-6 border-2 transition-all ${
                  bestLoan === 'conventional'
                    ? 'border-[#bdc4a7] bg-[#bdc4a7]/10'
                    : 'border-white/10'
                }`}
              >
                {bestLoan === 'conventional' && (
                  <div className="inline-block bg-[#bdc4a7]/30 text-[#bdc4a7] text-xs px-3 py-1 rounded-full mb-3 font-semibold">
                    Best Match
                  </div>
                )}
                <h3 className="text-xl font-bold text-white mb-2">Conventional</h3>
                <p className="text-white/70 text-sm mb-4">
                  The standard mortgage loan backed by Fannie Mae or Freddie Mac.
                </p>
                <ul className="space-y-2 text-sm text-white/80">
                  <li className="flex items-center gap-2">
                    <ChevronRight className="w-4 h-4 text-[#bdc4a7]" />
                    Best for credit 620+
                  </li>
                  <li className="flex items-center gap-2">
                    <ChevronRight className="w-4 h-4 text-[#bdc4a7]" />
                    3–20% down payment
                  </li>
                  <li className="flex items-center gap-2">
                    <ChevronRight className="w-4 h-4 text-[#bdc4a7]" />
                    No upfront insurance fee
                  </li>
                </ul>
              </div>

              {/* FHA */}
              <div
                className={`glass rounded-2xl p-6 border-2 transition-all ${
                  bestLoan === 'fha'
                    ? 'border-[#bdc4a7] bg-[#bdc4a7]/10'
                    : 'border-white/10'
                }`}
              >
                {bestLoan === 'fha' && (
                  <div className="inline-block bg-[#bdc4a7]/30 text-[#bdc4a7] text-xs px-3 py-1 rounded-full mb-3 font-semibold">
                    Best Match
                  </div>
                )}
                <h3 className="text-xl font-bold text-white mb-2">FHA</h3>
                <p className="text-white/70 text-sm mb-4">
                  Government-backed loan designed for buyers with lower credit or smaller down payments.
                </p>
                <ul className="space-y-2 text-sm text-white/80">
                  <li className="flex items-center gap-2">
                    <ChevronRight className="w-4 h-4 text-[#92b4a7]" />
                    Best for credit 580+
                  </li>
                  <li className="flex items-center gap-2">
                    <ChevronRight className="w-4 h-4 text-[#92b4a7]" />
                    Only 3.5% down required
                  </li>
                  <li className="flex items-center gap-2">
                    <ChevronRight className="w-4 h-4 text-[#92b4a7]" />
                    Government backed
                  </li>
                </ul>
              </div>

              {/* VA/USDA */}
              <div
                className={`glass rounded-2xl p-6 border-2 transition-all ${
                  bestLoan === 'va_usda'
                    ? 'border-[#bdc4a7] bg-[#bdc4a7]/10'
                    : 'border-white/10'
                }`}
              >
                {bestLoan === 'va_usda' && (
                  <div className="inline-block bg-[#bdc4a7]/30 text-[#bdc4a7] text-xs px-3 py-1 rounded-full mb-3 font-semibold">
                    Best Match
                  </div>
                )}
                <h3 className="text-xl font-bold text-white mb-2">VA / USDA</h3>
                <p className="text-white/70 text-sm mb-4">
                  Specialized programs for veterans or buyers in rural/suburban areas.
                </p>
                <ul className="space-y-2 text-sm text-white/80">
                  <li className="flex items-center gap-2">
                    <ChevronRight className="w-4 h-4 text-[#bf8b85]" />
                    Veterans or rural buyers
                  </li>
                  <li className="flex items-center gap-2">
                    <ChevronRight className="w-4 h-4 text-[#bf8b85]" />
                    0% down payment possible
                  </li>
                  <li className="flex items-center gap-2">
                    <ChevronRight className="w-4 h-4 text-[#bf8b85]" />
                    Special eligibility required
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* ── Section 3: DTI Breakdown ── */}
        {section === 'dti' && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Your DTI Breakdown</h2>
            <p className="text-white/70 mb-8">
              Debt-to-Income ratio is one of the most important factors lenders assess.
            </p>

            <div className="glass rounded-2xl p-6 mb-6">
              <div className="flex justify-between text-sm text-white/60 mb-2">
                <span>0%</span>
                <span>28%</span>
                <span>36%</span>
                <span>43%</span>
                <span>60%+</span>
              </div>

              {/* Zone bar */}
              <div className="relative h-6 rounded-full overflow-hidden flex mb-3">
                <div className="flex-[28] bg-emerald-500/50" />
                <div className="flex-[8] bg-yellow-400/40" />
                <div className="flex-[7] bg-orange-400/40" />
                <div className="flex-[17] bg-[#bf8b85]/50" />
              </div>

              {/* Indicator */}
              <div className="relative h-6 mb-4">
                <div
                  className="absolute transform -translate-x-1/2 flex flex-col items-center"
                  style={{ left: `${Math.min(dtiRatio / 60, 1) * 100}%` }}
                >
                  <div className="w-0.5 h-4 bg-white" />
                  <div className="w-3 h-3 bg-white rounded-full -mt-1" />
                </div>
              </div>

              <div className="text-center mb-6">
                <div className="text-4xl font-bold text-white">
                  {monthlyIncome > 0 ? `${dtiRatio.toFixed(1)}%` : 'N/A'}
                </div>
                <div className={`text-sm mt-1 ${verdictText(dtiVerdict)}`}>
                  {dtiRatio < 28
                    ? 'Excellent — lenders love this range'
                    : dtiRatio < 36
                    ? 'Good — within comfortable range'
                    : dtiRatio <= 43
                    ? 'Fair — approaching the typical limit'
                    : 'High — may face qualification hurdles'}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Excellent', range: '<28%', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-400/30' },
                  { label: 'Good', range: '28–36%', color: 'bg-yellow-400/20 text-yellow-300 border-yellow-400/30' },
                  { label: 'Fair', range: '36–43%', color: 'bg-orange-400/20 text-orange-300 border-orange-400/30' },
                  { label: 'High', range: '>43%', color: 'bg-[#bf8b85]/20 text-[#bf8b85] border-[#bf8b85]/30' },
                ].map((zone) => (
                  <div key={zone.label} className={`rounded-xl p-3 text-center border ${zone.color}`}>
                    <div className="font-semibold text-sm">{zone.label}</div>
                    <div className="text-xs opacity-80">{zone.range}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass rounded-2xl p-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-white/60 text-xs mb-1">Monthly Expenses</div>
                  <div className="text-white font-semibold">${monthlyExpenses.toLocaleString()}</div>
                </div>
                <div className="flex items-center justify-center text-white/40 text-xl">÷</div>
                <div>
                  <div className="text-white/60 text-xs mb-1">Monthly Income</div>
                  <div className="text-white font-semibold">${monthlyIncome.toLocaleString()}</div>
                </div>
              </div>
              <div className="text-center mt-3 text-white/60 text-sm">
                = {monthlyIncome > 0 ? `${dtiRatio.toFixed(1)}%` : 'N/A'} DTI
              </div>
            </div>
          </div>
        )}

        {/* ── Section 4: Quiz ── */}
        {section === 'quiz' && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Knowledge Check</h2>
            <p className="text-white/70 mb-8">
              Answer all 4 questions correctly to complete Quest 1.
            </p>

            {quizResult === 'pass' ? (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center py-12"
              >
                <div className="w-20 h-20 bg-[#bdc4a7]/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-10 h-10 text-[#bdc4a7]" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Perfect Score!</h3>
                <p className="text-white/70">Quest 1 complete. Moving to Quest 3...</p>
              </motion.div>
            ) : (
              <>
                <div className="space-y-6">
                  {QUIZ_QUESTIONS.map((q, qIdx) => (
                    <div key={qIdx} className="glass rounded-2xl p-5">
                      <p className="text-white font-medium mb-4">
                        {qIdx + 1}. {q.question}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {q.options.map((opt) => {
                          const isSelected = quizAnswers[qIdx] === opt;
                          const isCorrect = opt === q.correct;
                          let optClass =
                            'glass rounded-xl px-4 py-2.5 text-sm text-white/80 text-left transition-all hover:bg-white/10 cursor-pointer';

                          if (quizSubmitted) {
                            if (isCorrect) {
                              optClass =
                                'rounded-xl px-4 py-2.5 text-sm text-left bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 cursor-default';
                            } else if (isSelected && !isCorrect) {
                              optClass =
                                'rounded-xl px-4 py-2.5 text-sm text-left bg-[#bf8b85]/20 border border-[#bf8b85]/40 text-[#bf8b85] cursor-default';
                            } else {
                              optClass =
                                'rounded-xl px-4 py-2.5 text-sm text-left glass text-white/40 cursor-default';
                            }
                          } else if (isSelected) {
                            optClass =
                              'rounded-xl px-4 py-2.5 text-sm text-left bg-[#3e78b2]/40 border border-white/40 text-white cursor-pointer';
                          }

                          return (
                            <button
                              key={opt}
                              className={optClass}
                              onClick={() => handleQuizAnswer(qIdx, opt)}
                              disabled={quizSubmitted}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                      {quizSubmitted && quizAnswers[qIdx] !== q.correct && (
                        <p className="text-xs text-[#bf8b85] mt-2">
                          Correct answer: <span className="font-semibold">{q.correct}</span>
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                {!quizSubmitted ? (
                  <button
                    onClick={handleQuizSubmit}
                    disabled={quizAnswers.some((a) => a === null)}
                    className="mt-6 w-full py-3 bg-white text-[#3e78b2] rounded-xl font-semibold hover:bg-white/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    Submit Answers
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : quizResult === 'fail' ? (
                  <div className="mt-6 text-center">
                    <p className="text-[#bf8b85] mb-4">
                      Some answers were incorrect. Review the explanations above and try again.
                    </p>
                    <button
                      onClick={handleQuizRetry}
                      className="px-8 py-3 glass rounded-xl text-white hover:bg-white/10 transition-all flex items-center gap-2 mx-auto"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Try Again
                    </button>
                  </div>
                ) : null}
              </>
            )}
          </div>
        )}

        {/* ── Bottom Nav ── */}
        {!(section === 'quiz') && (
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
