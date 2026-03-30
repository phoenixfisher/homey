import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { AnimatePresence, motion } from 'motion/react';
import {
  BookOpen,
  Brain,
  CheckCircle,
  Circle,
  CircleCheckBig,
  Clock3,
  GraduationCap,
  PiggyBank,
  Shield,
  Sparkles,
} from 'lucide-react';
import { AppLayout } from '@/components/AppLayout';
import { MainNav } from '@/components/MainNav';
import { AuthHeaderActions } from '@/components/AuthHeaderActions';
import { backendLogout, fetchSessionUser, getUserProfile, isLoggedIn as getIsLoggedIn, logout, type SessionUser } from '@/lib/auth';

type QuizQuestion = {
  prompt: string;
  options: string[];
  answerIndex: number;
  explanation: string;
};

type LearningModule = {
  id: string;
  title: string;
  subtitle: string;
  readTime: string;
  level: string;
  summary: string;
  details: string[];
  quiz: QuizQuestion[];
};

const learningModules: LearningModule[] = [
  {
    id: 'home-buying-basics',
    title: 'How Buying a Home Works',
    subtitle: 'Understand the timeline from planning to closing day.',
    readTime: '8 min',
    level: 'Beginner',
    summary:
      'Home buying is a sequence of financial and legal steps. You set your budget, compare neighborhoods, get pre-approved, tour homes, make an offer, then finalize financing and closing.',
    details: [
      'Start with a realistic budget that includes mortgage, taxes, insurance, maintenance, and utilities.',
      'Get pre-approved early so your offer is stronger and you know your price range.',
      'Compare total monthly payment, not just home price, because taxes and insurance vary by area.',
      'During escrow, inspections and appraisal protect you from overpaying or buying hidden issues.',
      'Closing is where ownership transfers, documents are signed, and final costs are paid.',
    ],
    quiz: [
      {
        prompt: 'What is the main benefit of getting pre-approved before shopping seriously?',
        options: [
          'It guarantees your offer will be accepted',
          'It confirms a budget range and makes your offer more credible',
          'It removes the need for an appraisal',
          'It lowers property taxes automatically',
        ],
        answerIndex: 1,
        explanation:
          'Pre-approval does not guarantee acceptance, but it validates your borrowing range and signals to sellers that financing is likely to close.',
      },
      {
        prompt: 'Which cost is often overlooked by first-time buyers?',
        options: [
          'Monthly internet',
          'Gas for commute',
          'Closing costs and ongoing maintenance',
          'Listing photo fees',
        ],
        answerIndex: 2,
        explanation:
          'Many buyers focus on down payment but forget closing fees and annual maintenance, which can materially change affordability.',
      },
      {
        prompt: 'What usually happens after your offer is accepted?',
        options: [
          'You receive keys the same day',
          'Escrow begins with inspection, appraisal, and lender underwriting',
          'Your rate cannot change under any condition',
          'The seller pays every remaining fee',
        ],
        answerIndex: 1,
        explanation:
          'Accepted offer is followed by escrow milestones where the property and financing are verified before closing.',
      },
    ],
  },
  {
    id: 'loans-prep',
    title: 'Loans and Getting Approved',
    subtitle: 'What lenders evaluate and how to prepare your file.',
    readTime: '10 min',
    level: 'Beginner to Intermediate',
    summary:
      'A mortgage is money you borrow to buy a home and repay over time with interest. Lenders evaluate income stability, debt-to-income, credit history, assets, and property value.',
    details: [
      'Common loan categories include conventional, FHA, VA, and USDA, each with unique qualification rules.',
      'Debt-to-income ratio is one of the strongest predictors of approval and monthly payment safety.',
      'Keep documentation organized: pay stubs, tax returns, bank statements, and ID are standard requirements.',
      'Avoid opening new debt accounts during underwriting, because profile changes can delay or reduce approval.',
      'Interest rate, loan term, and points each influence your monthly payment and total lifetime cost.',
    ],
    quiz: [
      {
        prompt: 'What does debt-to-income (DTI) ratio measure?',
        options: [
          'The percentage of your savings held in cash',
          'The share of monthly income used for debt payments',
          'The amount of home equity you have',
          'The ratio of rent to utilities',
        ],
        answerIndex: 1,
        explanation:
          'DTI compares debt obligations to gross monthly income, helping lenders estimate repayment capacity.',
      },
      {
        prompt: 'Which action is safest while your mortgage is in underwriting?',
        options: [
          'Open a new credit card for furniture',
          'Change jobs and pay structure',
          'Keep finances stable and avoid new debt',
          'Close your oldest account',
        ],
        answerIndex: 2,
        explanation:
          'Underwriting prefers financial stability. New debt or major changes can trigger re-review and risk approval.',
      },
      {
        prompt: 'How does paying points generally affect a mortgage?',
        options: [
          'Higher upfront cost and lower interest rate',
          'Lower upfront cost and higher taxes',
          'No effect on loan economics',
          'Eliminates private mortgage insurance automatically',
        ],
        answerIndex: 0,
        explanation:
          'Points are prepaid interest: you pay more at closing in exchange for a reduced rate over time.',
      },
    ],
  },
  {
    id: 'credit-growth',
    title: 'Credit and How to Improve It',
    subtitle: 'Build a stronger score with habits you can sustain.',
    readTime: '9 min',
    level: 'Beginner',
    summary:
      'Credit reflects how consistently you repay borrowed money. Lenders use it to estimate risk, which impacts approvals, rates, and terms.',
    details: [
      'Payment history has the largest score impact, so on-time payments are your highest-leverage habit.',
      'Credit utilization matters: keeping card balances lower relative to limits can help scores.',
      'Longer credit history can strengthen your profile, so be cautious with closing old accounts.',
      'Hard inquiries can cause temporary dips, especially if multiple unrelated accounts are opened quickly.',
      'Review reports regularly for errors and dispute inaccuracies promptly.',
    ],
    quiz: [
      {
        prompt: 'Which behavior most consistently supports credit score growth?',
        options: [
          'Applying for multiple new cards monthly',
          'Making on-time payments and keeping utilization low',
          'Closing old accounts to simplify statements',
          'Avoiding all credit products permanently',
        ],
        answerIndex: 1,
        explanation:
          'Payment consistency and lower utilization are core score drivers over time.',
      },
      {
        prompt: 'What does credit utilization refer to?',
        options: [
          'How often you check your score',
          'How much of your available revolving credit is being used',
          'How many years you have rented',
          'How much cash is in savings',
        ],
        answerIndex: 1,
        explanation:
          'Utilization is the balance-to-limit relationship on revolving accounts like credit cards.',
      },
      {
        prompt: 'Why should you monitor your credit report periodically?',
        options: [
          'To remove all loan history',
          'To increase your income estimate',
          'To identify and dispute potential reporting errors',
          'To freeze rates permanently',
        ],
        answerIndex: 2,
        explanation:
          'Incorrect late payments or account data can hurt scores, so periodic checks are a protective habit.',
      },
    ],
  },
  {
    id: 'savings-strategy',
    title: 'Savings Accounts and Cash Strategy',
    subtitle: 'Protect your down payment while maximizing flexibility.',
    readTime: '7 min',
    level: 'Beginner',
    summary:
      'Savings accounts keep your money liquid and lower-risk while earning interest. A clear savings system helps you build emergency reserves and a home fund at the same time.',
    details: [
      'Separate emergency savings from down payment savings so unexpected expenses do not derail your plan.',
      'Compare APY, fees, transfer limits, and account access when selecting where to save.',
      'Automate transfers on payday to remove decision fatigue and improve consistency.',
      'Use short-term safe vehicles for near-term home goals rather than volatile investments.',
      'Track savings rate monthly so you can adjust spending categories early.',
    ],
    quiz: [
      {
        prompt: 'Why should emergency savings and down payment funds usually be separated?',
        options: [
          'To avoid paying mortgage insurance',
          'To keep goal visibility and protect home savings from surprises',
          'To eliminate closing costs',
          'To lock your funds for 30 years',
        ],
        answerIndex: 1,
        explanation:
          'Separate buckets make progress clearer and reduce the chance that emergencies consume your home fund.',
      },
      {
        prompt: 'Which feature is most useful for building savings consistency?',
        options: [
          'Automatic recurring transfers',
          'Daily manual transfers',
          'Ignoring account statements',
          'Moving all savings to cash at home',
        ],
        answerIndex: 0,
        explanation:
          'Automation turns savings into a default behavior and helps prevent missed contributions.',
      },
      {
        prompt: 'For money needed in the near term for a home purchase, the priority is usually:',
        options: [
          'Maximum possible risk and volatility',
          'Liquidity and principal protection',
          'Sector-specific stock concentration',
          'No record of account activity',
        ],
        answerIndex: 1,
        explanation:
          'Near-term housing money is generally better kept in safer, accessible accounts rather than high volatility assets.',
      },
    ],
  },
  {
    id: 'investing-basics',
    title: 'Investing and Growing Long-Term Wealth',
    subtitle: 'Understand risk, time horizon, and diversification.',
    readTime: '11 min',
    level: 'Intermediate',
    summary:
      'Investing helps your money grow over longer periods, but values can rise and fall. The right strategy depends on your goals, timeline, and risk tolerance.',
    details: [
      'Longer time horizons can better absorb market volatility than short-term goals.',
      'Diversification spreads risk across assets instead of relying on a single company or sector.',
      'Consistent contributions often matter more than trying to time the market perfectly.',
      'Tax-advantaged accounts can improve long-term net returns depending on your goals.',
      'Home buying and investing can coexist when you define separate timelines and priorities.',
    ],
    quiz: [
      {
        prompt: 'What is diversification designed to do?',
        options: [
          'Guarantee positive returns every month',
          'Reduce concentration risk by spreading investments',
          'Avoid all taxes permanently',
          'Replace emergency savings',
        ],
        answerIndex: 1,
        explanation:
          'Diversification cannot remove risk entirely, but it can reduce exposure to any single position.',
      },
      {
        prompt: 'Which statement is generally true for long-term investing?',
        options: [
          'Consistency over time can outperform frequent market timing',
          'You should only invest when markets are at all-time highs',
          'Investing is suitable for emergency funds',
          'Short-term goals are best matched with high-volatility assets',
        ],
        answerIndex: 0,
        explanation:
          'Regular contributions over time can reduce timing risk and build discipline.',
      },
      {
        prompt: 'If funds are needed soon for a down payment, the typical approach is to:',
        options: [
          'Use a high-volatility strategy for faster gains',
          'Keep those funds in lower-risk and more liquid accounts',
          'Borrow to increase investing leverage',
          'Ignore timeline risk',
        ],
        answerIndex: 1,
        explanation:
          'Near-term obligations usually call for capital preservation and access, not large price swings.',
      },
    ],
  },
];

export function LearningPage() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [activeModuleId, setActiveModuleId] = useState(learningModules[0].id);
  const [completedModules, setCompletedModules] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('homeyCompletedModules');
      return saved ? new Set<string>(JSON.parse(saved) as string[]) : new Set<string>();
    } catch {
      return new Set<string>();
    }
  });

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswerIndex, setSelectedAnswerIndex] = useState<number | null>(null);
  const [isChecked, setIsChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [completionFanfare, setCompletionFanfare] = useState<'known' | 'quiz' | null>(null);

  const activeModule = useMemo(
    () => learningModules.find((module) => module.id === activeModuleId) ?? learningModules[0],
    [activeModuleId],
  );

  const currentQuestion = activeModule.quiz[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === activeModule.quiz.length - 1;
  const quizProgress = ((currentQuestionIndex + 1) / activeModule.quiz.length) * 100;
  const isActiveModuleComplete = completedModules.has(activeModule.id);

  useEffect(() => {
    setCurrentQuestionIndex(0);
    setSelectedAnswerIndex(null);
    setIsChecked(false);
    setIsCorrect(false);
    setCorrectCount(0);
  }, [activeModuleId]);

  useEffect(() => {
    localStorage.setItem('homeyCompletedModules', JSON.stringify([...completedModules]));
  }, [completedModules]);

  useEffect(() => {
    if (!completionFanfare) {
      return;
    }
    const t = window.setTimeout(() => setCompletionFanfare(null), 2400);
    return () => window.clearTimeout(t);
  }, [completionFanfare]);

  const handleMarkKnown = () => {
    if (completedModules.has(activeModule.id)) {
      return;
    }
    setCompletedModules((prev) => {
      const next = new Set(prev);
      next.add(activeModule.id);
      return next;
    });
    setCompletionFanfare('known');
  };

  const handleCheckAnswer = () => {
    if (selectedAnswerIndex === null || isChecked) {
      return;
    }

    const answerIsCorrect = selectedAnswerIndex === currentQuestion.answerIndex;
    setIsCorrect(answerIsCorrect);
    setIsChecked(true);
    if (answerIsCorrect) {
      setCorrectCount((prev) => prev + 1);
    }
  };

  const handleNextQuestion = () => {
    if (!isChecked) {
      return;
    }

    if (isLastQuestion) {
      const wasNew = !completedModules.has(activeModule.id);
      setCompletedModules((prev) => {
        const next = new Set(prev);
        next.add(activeModule.id);
        return next;
      });
      if (wasNew) {
        setCompletionFanfare('quiz');
      }
      return;
    }

    setCurrentQuestionIndex((prev) => prev + 1);
    setSelectedAnswerIndex(null);
    setIsChecked(false);
    setIsCorrect(false);
  };

  const completedCount = completedModules.size;

  useEffect(() => {
    void (async () => {
      const user = await fetchSessionUser();
      setSessionUser(user);
      setIsLoggedIn(!!user || getIsLoggedIn() || !!getUserProfile());
    })();
  }, []);

  const handleHeaderAuthClick = () => {
    if (isLoggedIn) {
      void backendLogout();
      logout();
      setIsLoggedIn(false);
      setSessionUser(null);
      void navigate('/');
      return;
    }

    void navigate('/login');
  };

  return (
    <AppLayout className="bg-gradient-to-b from-[#3e78b2] via-[#5a8ebd] to-[#92b4a7]">
      <MainNav
        active="learning"
        isLoggedIn={isLoggedIn}
        rightContent={(
          <AuthHeaderActions
            isLoggedIn={isLoggedIn}
            firstName={sessionUser?.firstName ?? null}
            onAuthClick={handleHeaderAuthClick}
          />
        )}
      />

      <AnimatePresence>
        {completionFanfare && (
          <motion.div
            role="status"
            aria-live="polite"
            initial={{ opacity: 0, y: -16, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 420, damping: 28 }}
            className="pointer-events-none fixed top-24 left-1/2 z-[60] -translate-x-1/2 px-5 py-3 rounded-2xl bg-white text-[#2d5a8a] shadow-xl shadow-black/20 flex items-center gap-3 max-w-[min(90vw,24rem)]"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600">
              <CircleCheckBig className="w-6 h-6" />
            </span>
            <span className="text-left">
              <span className="block font-semibold leading-tight">
                {completionFanfare === 'known' ? 'Marked as mastered' : 'Quiz complete'}
              </span>
              <span className="text-sm text-[#2d5a8a]/85">Module added to your progress.</span>
            </span>
            <Sparkles className="w-5 h-5 shrink-0 text-amber-500" />
          </motion.div>
        )}
      </AnimatePresence>

      <main className="relative z-10 flex-1 px-4 py-10 md:py-14">
        <div className="max-w-7xl mx-auto">
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-3xl p-6 md:p-8 mb-8"
          >
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white/90 text-sm mb-4">
                  <GraduationCap className="w-4 h-4" />
                  Module 1: Learning
                </div>
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">Build Home-Buying Confidence</h1>
                <p className="text-white/80 text-lg max-w-3xl">
                  Learn the essentials through short, practical lessons and quick quiz checks.
                  Each topic is designed to answer real user questions and keep progress tangible.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 min-w-[260px]">
                <motion.div
                  initial={false}
                  animate={
                    completionFanfare
                      ? { scale: [1, 1.06, 1], boxShadow: ['0 0 0 0 rgba(255,255,255,0)', '0 0 0 6px rgba(255,255,255,0.2)', '0 0 0 0 rgba(255,255,255,0)'] }
                      : {}
                  }
                  transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                  className="rounded-2xl bg-white/10 border border-white/20 p-4"
                >
                  <div className="text-white/70 text-sm">Modules Completed</div>
                  <div className="text-white text-2xl font-semibold">{completedCount}/{learningModules.length}</div>
                </motion.div>
                <div className="rounded-2xl bg-white/10 border border-white/20 p-4">
                  <div className="text-white/70 text-sm">Active Topic</div>
                  <div className="text-white text-base font-semibold leading-tight">{activeModule.title}</div>
                </div>
              </div>
            </div>
          </motion.section>

          <section className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            <motion.aside
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="xl:col-span-4 glass rounded-3xl p-5 md:p-6"
            >
              <div className="flex items-center gap-2 text-white mb-4">
                <BookOpen className="w-5 h-5" />
                <h2 className="text-2xl font-semibold">Learning Paths</h2>
              </div>

              <div className="space-y-3">
                {learningModules.map((module) => {
                  const isActive = module.id === activeModule.id;
                  const isCompleted = completedModules.has(module.id);
                  return (
                    <button
                      key={module.id}
                      type="button"
                      onClick={() => setActiveModuleId(module.id)}
                      className={`w-full text-left rounded-2xl border transition-all p-4 ${
                        isActive
                          ? 'bg-white/20 border-white/40'
                          : 'bg-white/5 border-white/15 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-white font-semibold leading-tight">{module.title}</p>
                          <p className="text-white/70 text-sm mt-1">{module.subtitle}</p>
                          <div className="flex items-center gap-3 mt-3 text-xs text-white/70">
                            <span className="inline-flex items-center gap-1">
                              <Clock3 className="w-3.5 h-3.5" />
                              {module.readTime}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <Shield className="w-3.5 h-3.5" />
                              {module.level}
                            </span>
                          </div>
                        </div>

                        <div className="text-white/90 mt-0.5">
                          {isCompleted ? (
                            <CircleCheckBig className="w-5 h-5" />
                          ) : isActive ? (
                            <Sparkles className="w-5 h-5" />
                          ) : (
                            <Circle className="w-5 h-5" />
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.aside>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="xl:col-span-8 space-y-6"
            >
              <article className="glass rounded-3xl p-6 md:p-8">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
                  <div className="flex flex-wrap items-center gap-3 min-w-0">
                    <h2 className="text-3xl text-white font-semibold">{activeModule.title}</h2>
                    {isActiveModuleComplete && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/25 border border-emerald-200/40 text-emerald-50 text-sm font-medium shrink-0">
                        <CircleCheckBig className="w-4 h-4" />
                        Completed
                      </span>
                    )}
                  </div>
                  <motion.button
                    type="button"
                    disabled={isActiveModuleComplete}
                    onClick={handleMarkKnown}
                    whileTap={isActiveModuleComplete ? undefined : { scale: 0.97 }}
                    className={`px-4 py-2 rounded-xl transition-all inline-flex items-center gap-2 ${
                      isActiveModuleComplete
                        ? 'bg-white/25 text-white/70 cursor-not-allowed border border-white/20'
                        : 'bg-white text-[#3e78b2] hover:bg-white/90 shadow-md shadow-black/10 hover:shadow-lg'
                    }`}
                  >
                    {isActiveModuleComplete ? (
                      <>
                        <CircleCheckBig className="w-4 h-4 opacity-90" />
                        Completed!
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        I Already Know This
                      </>
                    )}
                  </motion.button>
                </div>

                <p className="text-white/85 text-lg leading-relaxed mb-6">{activeModule.summary}</p>

                <div>
                  <h3 className="text-white text-xl mb-3 inline-flex items-center gap-2">
                    <Brain className="w-5 h-5" />
                    Key Concepts
                  </h3>
                  <ul className="space-y-2">
                    {activeModule.details.map((detail) => (
                      <li key={detail} className="text-white/80 text-sm md:text-base leading-relaxed flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 mt-1 shrink-0 text-white/90" />
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </article>

              <section className="glass rounded-3xl p-6 md:p-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                  <h3 className="text-2xl text-white font-semibold inline-flex items-center gap-2">
                    <PiggyBank className="w-6 h-6" />
                    Quick Check Quiz
                  </h3>
                  <div className="text-white/80 text-sm">
                    Question {currentQuestionIndex + 1} of {activeModule.quiz.length}
                  </div>
                </div>

                <div className="w-full h-2 bg-white/15 rounded-full overflow-hidden mb-6">
                  <motion.div
                    className="h-full bg-white/90"
                    animate={{ width: `${quizProgress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>

                <div className="rounded-2xl bg-white/8 border border-white/20 p-5 mb-5">
                  <p className="text-white text-lg leading-relaxed">{currentQuestion.prompt}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
                  {currentQuestion.options.map((option, optionIndex) => {
                    const isSelected = selectedAnswerIndex === optionIndex;
                    const isAnswer = optionIndex === currentQuestion.answerIndex;
                    const showCorrect = isChecked && isAnswer;
                    const showIncorrect = isChecked && isSelected && !isAnswer;
                    return (
                      <button
                        key={option}
                        type="button"
                        disabled={isChecked}
                        onClick={() => setSelectedAnswerIndex(optionIndex)}
                        className={`text-left rounded-2xl px-4 py-3 border transition-all ${
                          showCorrect
                            ? 'bg-emerald-500/25 border-emerald-200/60 text-white'
                            : showIncorrect
                            ? 'bg-rose-400/25 border-rose-200/60 text-white'
                            : isSelected
                            ? 'bg-white/20 border-white/40 text-white'
                            : 'bg-white/5 border-white/20 text-white/90 hover:bg-white/10'
                        } ${isChecked ? 'cursor-default' : 'cursor-pointer'}`}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>

                {isChecked && (
                  <div
                    className={`rounded-2xl p-4 mb-5 border ${
                      isCorrect
                        ? 'bg-emerald-500/20 border-emerald-100/40 text-white'
                        : 'bg-rose-500/20 border-rose-100/40 text-white'
                    }`}
                  >
                    <p className="font-semibold mb-1">{isCorrect ? 'Correct' : 'Not quite yet'}</p>
                    <p className="text-white/90">{currentQuestion.explanation}</p>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="text-white/80 text-sm">
                    Score so far: {correctCount}/{activeModule.quiz.length}
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      disabled={selectedAnswerIndex === null || isChecked}
                      onClick={handleCheckAnswer}
                      className="px-5 py-2.5 rounded-xl bg-white text-[#3e78b2] hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      Check Answer
                    </button>
                    <motion.button
                      type="button"
                      disabled={!isChecked || (isLastQuestion && isActiveModuleComplete)}
                      onClick={handleNextQuestion}
                      whileTap={
                        !isChecked || (isLastQuestion && isActiveModuleComplete)
                          ? undefined
                          : { scale: 0.97 }
                      }
                      className={`px-5 py-2.5 rounded-xl transition-all inline-flex items-center gap-2 ${
                        isLastQuestion && isActiveModuleComplete
                          ? 'bg-white/15 text-white/55 border border-white/20 cursor-not-allowed'
                          : 'glass text-white hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed'
                      }`}
                    >
                      {isLastQuestion && isActiveModuleComplete ? (
                        <>
                          <CircleCheckBig className="w-4 h-4" />
                          Module already done
                        </>
                      ) : isLastQuestion ? (
                        <>
                          <GraduationCap className="w-4 h-4" />
                          Finish Module
                        </>
                      ) : (
                        'Next Question'
                      )}
                    </motion.button>
                  </div>
                </div>
              </section>
            </motion.div>
          </section>
        </div>
      </main>
    </AppLayout>
  );
}
