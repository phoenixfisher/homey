import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  ArrowRight,
  User,
  Home,
  Briefcase,
  DollarSign,
  PiggyBank,
  CreditCard,
  FileText,
  ChevronDown,
  ChevronUp,
  Save,
  CheckCircle,
  Cloud,
  AlertCircle,
} from 'lucide-react';
import { getUserProfile, saveUserProfile, fetchSessionUser } from '@/lib/auth';
import { fetchLoanApplication, saveLoanApplication, parseCurrencyField, formatSavedAt } from '@/lib/preapproval';
import { LoginPromptModal } from '@/components/LoginPromptModal';

type FieldType = 'text' | 'date' | 'number' | 'tel' | 'email' | 'select' | 'textarea' | 'ssn' | 'currency' | 'phone';

interface Field {
  key: string;
  label: string;
  placeholder: string;
  type: FieldType;
  options?: string[];       // for select
  min?: number;
  max?: number;
}

interface Section {
  id: string;
  icon: React.ReactNode;
  title: string;
  color: string;
  note?: string;
  fields: Field[];
}

const sections: Section[] = [
  {
    id: 'personal',
    icon: <User className="w-6 h-6" />,
    title: 'Personal Information',
    color: '#3e78b2',
    fields: [
      { key: 'fullName',      label: 'Full Legal Name',              placeholder: 'First Middle Last',          type: 'text' },
      { key: 'dob',           label: '* Date of Birth',              placeholder: '',                           type: 'date' },
      { key: 'ssn',           label: '* Social Security Number',     placeholder: 'XXX-XX-XXXX',               type: 'ssn' },
      { key: 'maritalStatus', label: 'Marital Status',               placeholder: 'Select...',                  type: 'select', options: ['Single', 'Married', 'Separated', 'Divorced', 'Widowed'] },
      { key: 'phone',         label: 'Phone Number',                 placeholder: '(555) 555-5555',             type: 'phone' },
      { key: 'email',         label: 'Email Address',                placeholder: 'you@example.com',            type: 'email' },
      { key: 'dependents',    label: 'Number of Dependents',         placeholder: '0',                          type: 'number', min: 0, max: 20 },
    ],
  },
  {
    id: 'housing',
    icon: <Home className="w-6 h-6" />,
    title: 'Housing History',
    color: '#5a8ebd',
    fields: [
      { key: 'currentAddress',        label: 'Current Address',                  placeholder: '123 Main St, City, State 12345', type: 'text' },
      { key: 'currentAddressYears',   label: 'Years at Current Address',         placeholder: '0',                              type: 'number', min: 0, max: 50 },
      { key: 'previousAddress',       label: 'Previous Address (if < 2 yrs)',    placeholder: '456 Oak Ave, City, State 12345', type: 'text' },
      { key: 'rentOrOwn',             label: 'Rent or Own',                      placeholder: 'Select...',                      type: 'select', options: ['Rent', 'Own', 'Living with family', 'Other'] },
      { key: 'monthlyHousingPayment', label: 'Monthly Housing Payment',          placeholder: '$0',                             type: 'currency' },
      { key: 'landlordContact',       label: 'Landlord Contact (if renting)',    placeholder: 'Name, (555) 555-5555',           type: 'text' },
    ],
  },
  {
    id: 'employment',
    icon: <Briefcase className="w-6 h-6" />,
    title: 'Employment History',
    color: '#92b4a7',
    fields: [
      { key: 'employerName',     label: 'Current Employer Name',          placeholder: 'Company Name',                          type: 'text' },
      { key: 'employerAddress',  label: 'Employer Address',               placeholder: '789 Business Blvd, City, State 12345',  type: 'text' },
      { key: 'jobTitle',         label: 'Job Title',                      placeholder: 'e.g. Software Engineer',                type: 'text' },
      { key: 'employmentType',   label: 'Employment Type',                placeholder: 'Select...',                             type: 'select', options: ['Full-time', 'Part-time', 'Self-employed', 'Contract', 'Seasonal'] },
      { key: 'startDate',        label: 'Start Date',                     placeholder: '',                                      type: 'date' },
      { key: 'previousEmployer', label: 'Previous Employer (if < 2 yrs)', placeholder: 'Company Name',                         type: 'text' },
      { key: 'employmentGaps',   label: 'Explanation of Any Employment Gaps', placeholder: 'Describe any gaps...',             type: 'textarea' },
    ],
  },
  {
    id: 'income',
    icon: <DollarSign className="w-6 h-6" />,
    title: 'Income',
    color: '#bdc4a7',
    fields: [
      { key: 'baseSalary',        label: 'Base Salary / Wages (annual)',        placeholder: '$0',  type: 'currency' },
      { key: 'bonuses',           label: 'Bonuses & Overtime (annual)',          placeholder: '$0',  type: 'currency' },
      { key: 'selfEmployIncome',  label: 'Self-Employment Income (net annual)', placeholder: '$0', type: 'currency' },
      { key: 'rentalIncome',      label: 'Rental Income (monthly)',              placeholder: '$0',  type: 'currency' },
      { key: 'otherIncome',       label: 'Other Income (monthly)',               placeholder: '$0',  type: 'currency' },
      { key: 'otherIncomeSource', label: 'Other Income Source',                  placeholder: 'e.g. Alimony, disability, retirement', type: 'text' },
    ],
  },
  {
    id: 'assets',
    icon: <PiggyBank className="w-6 h-6" />,
    title: 'Assets',
    color: '#92b4a7',
    fields: [
      { key: 'checkingBalance',   label: 'Checking Account Balance',            placeholder: '$0',  type: 'currency' },
      { key: 'savingsBalance',    label: 'Savings Account Balance',             placeholder: '$0',  type: 'currency' },
      { key: 'retirementBalance', label: 'Retirement Accounts Total (401k, IRA)', placeholder: '$0', type: 'currency' },
      { key: 'investmentBalance', label: 'Investment Accounts Total',           placeholder: '$0',  type: 'currency' },
      { key: 'giftFunds',         label: 'Gift Funds',                          placeholder: '$0',  type: 'currency' },
      { key: 'realEstateValue',   label: 'Real Estate Value',                   placeholder: '$0',  type: 'currency' },
      { key: 'otherAssets',       label: 'Other Assets Description',            placeholder: 'e.g. Vehicles, business equity, life insurance cash value', type: 'textarea' },
    ],
  },
  {
    id: 'liabilities',
    icon: <CreditCard className="w-6 h-6" />,
    title: 'Liabilities',
    color: '#bf8b85',
    note: 'Your lender will typically pull these automatically via a soft credit check — this does not affect your score. Fill in what you know.',
    fields: [
      { key: 'creditCardPayment',  label: 'Credit Card Min. Payments (monthly)', placeholder: '$0', type: 'currency' },
      { key: 'studentLoanPayment', label: 'Student Loan Payment (monthly)',       placeholder: '$0', type: 'currency' },
      { key: 'autoLoanPayment',    label: 'Auto Loan Payment (monthly)',          placeholder: '$0', type: 'currency' },
      { key: 'childSupport',       label: 'Child Support / Alimony (monthly)',    placeholder: '$0', type: 'currency' },
      { key: 'otherDebt',          label: 'Other Monthly Debt Obligations',       placeholder: '$0', type: 'currency' },
    ],
  },
  {
    id: 'declarations',
    icon: <FileText className="w-6 h-6" />,
    title: 'Declarations',
    color: '#3e78b2',
    note: 'These are required yes/no legal disclosures on every mortgage application.',
    fields: [
      { key: 'outstandingJudgments', label: 'Any outstanding judgments against you?',        placeholder: 'Select...', type: 'select', options: ['No', 'Yes'] },
      { key: 'bankruptcy',           label: 'Filed for bankruptcy in the past 7 years?',     placeholder: 'Select...', type: 'select', options: ['No', 'Yes'] },
      { key: 'foreclosure',          label: 'Property foreclosed in the past 7 years?',      placeholder: 'Select...', type: 'select', options: ['No', 'Yes'] },
      { key: 'lawsuit',              label: 'Currently a party to a lawsuit?',               placeholder: 'Select...', type: 'select', options: ['No', 'Yes'] },
      { key: 'cosigner',             label: 'Co-signer or guarantor on any other loan?',     placeholder: 'Select...', type: 'select', options: ['No', 'Yes'] },
      { key: 'citizenship',          label: 'U.S. citizen or permanent resident?',           placeholder: 'Select...', type: 'select', options: ['Yes', 'No'] },
      { key: 'primaryResidence',     label: 'Will this be your primary residence?',          placeholder: 'Select...', type: 'select', options: ['Yes', 'No'] },
    ],
  },
];

const STORAGE_KEY = 'homeyLoanApplication';

// Keys that are synced two-way with homeyProfile
const PROFILE_LINKED_KEYS = ['fullName', 'email', 'baseSalary', 'savingsBalance'] as const;

// --- Formatters ---

function formatSSN(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 9);
  if (digits.length <= 3) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
}

function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

function formatCurrency(raw: string): string {
  const digits = raw.replace(/[^0-9]/g, '');
  if (!digits) return '';
  return '$' + parseInt(digits, 10).toLocaleString();
}

function applyFormat(type: FieldType, value: string): string {
  if (type === 'ssn')      return formatSSN(value);
  if (type === 'phone')    return formatPhone(value);
  if (type === 'currency') return formatCurrency(value);
  return value;
}

// --- Input class ---
const inputClass = 'px-5 py-3 glass rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all text-base w-full';
const selectClass = inputClass + ' cursor-pointer';

interface Props {
  onBack: () => void;
  onNext: () => void;
}

// Map from DB field names to local form keys
const DB_TO_FORM: Record<string, string> = {
  phone: 'phone',
  dependents: 'dependents',
  maritalStatus: 'maritalStatus',
  currentAddress: 'currentAddress',
  currentAddressYears: 'currentAddressYears',
  previousAddress: 'previousAddress',
  rentOrOwn: 'rentOrOwn',
  monthlyHousingPayment: 'monthlyHousingPayment',
  landlordContact: 'landlordContact',
  employerName: 'employerName',
  employerAddress: 'employerAddress',
  jobTitle: 'jobTitle',
  employmentType: 'employmentType',
  startDate: 'startDate',
  previousEmployer: 'previousEmployer',
  employmentGaps: 'employmentGaps',
  baseSalary: 'baseSalary',
  bonuses: 'bonuses',
  selfEmployIncome: 'selfEmployIncome',
  rentalIncome: 'rentalIncome',
  otherIncome: 'otherIncome',
  otherIncomeSource: 'otherIncomeSource',
  checkingBalance: 'checkingBalance',
  savingsBalance: 'savingsBalance',
  retirementBalance: 'retirementBalance',
  investmentBalance: 'investmentBalance',
  giftFunds: 'giftFunds',
  realEstateValue: 'realEstateValue',
  otherAssets: 'otherAssets',
  creditCardPayment: 'creditCardPayment',
  studentLoanPayment: 'studentLoanPayment',
  autoLoanPayment: 'autoLoanPayment',
  childSupport: 'childSupport',
  otherDebt: 'otherDebt',
  declOutstandingJudgments: 'outstandingJudgments',
  declBankruptcy: 'bankruptcy',
  declForeclosure: 'foreclosure',
  declLawsuit: 'lawsuit',
  declCosigner: 'cosigner',
  declCitizenship: 'citizenship',
  declPrimaryResidence: 'primaryResidence',
};

export function LoanApplicationView({ onBack, onNext }: Props) {
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  useEffect(() => {
    void (async () => {
      const saved = localStorage.getItem(STORAGE_KEY);
      const base: Record<string, string> = saved ? (JSON.parse(saved) as Record<string, string>) : {};

      const profile = getUserProfile();
      const session = await fetchSessionUser();

      if (profile) {
        base['fullName'] = base['fullName'] || profile.name;
        base['baseSalary'] = base['baseSalary'] || (profile.yearlyIncome ? formatCurrency(profile.yearlyIncome) : '');
        base['savingsBalance'] = base['savingsBalance'] || (profile.savingsTotal ? formatCurrency(profile.savingsTotal) : '');
      }
      if (session) {
        setIsLoggedIn(true);
        base['email'] = base['email'] || session.email;
        if (!base['fullName']) {
          base['fullName'] = `${session.firstName} ${session.lastName}`.trim();
        }

        // Load from DB and merge (DB wins over localStorage for non-sensitive fields)
        try {
          const dbData = await fetchLoanApplication();
          if (dbData) {
            setSavedAt(formatSavedAt(dbData.savedAt));
            for (const [dbKey, formKey] of Object.entries(DB_TO_FORM)) {
              const val = (dbData as Record<string, unknown>)[dbKey];
              if (val != null && val !== '') {
                base[formKey] = typeof val === 'number' ? formatCurrency(String(val)) : String(val);
              }
            }
          }
        } catch {
          // silently fall back to localStorage
        }
      }

      setFormData(base);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(base));
    })();
  }, []);

  const handleSaveToCloud = async () => {
    if (!isLoggedIn) {
      setShowLoginPrompt(true);
      return;
    }
    setSaveStatus('saving');
    try {
      await saveLoanApplication({
        phone: formData['phone'],
        dependents: formData['dependents'],
        maritalStatus: formData['maritalStatus'],
        currentAddress: formData['currentAddress'],
        currentAddressYears: formData['currentAddressYears'],
        previousAddress: formData['previousAddress'],
        rentOrOwn: formData['rentOrOwn'],
        monthlyHousingPayment: parseCurrencyField(formData['monthlyHousingPayment']),
        landlordContact: formData['landlordContact'],
        employerName: formData['employerName'],
        employerAddress: formData['employerAddress'],
        jobTitle: formData['jobTitle'],
        employmentType: formData['employmentType'],
        startDate: formData['startDate'],
        previousEmployer: formData['previousEmployer'],
        employmentGaps: formData['employmentGaps'],
        baseSalary: parseCurrencyField(formData['baseSalary']),
        bonuses: parseCurrencyField(formData['bonuses']),
        selfEmployIncome: parseCurrencyField(formData['selfEmployIncome']),
        rentalIncome: parseCurrencyField(formData['rentalIncome']),
        otherIncome: parseCurrencyField(formData['otherIncome']),
        otherIncomeSource: formData['otherIncomeSource'],
        checkingBalance: parseCurrencyField(formData['checkingBalance']),
        savingsBalance: parseCurrencyField(formData['savingsBalance']),
        retirementBalance: parseCurrencyField(formData['retirementBalance']),
        investmentBalance: parseCurrencyField(formData['investmentBalance']),
        giftFunds: parseCurrencyField(formData['giftFunds']),
        realEstateValue: parseCurrencyField(formData['realEstateValue']),
        otherAssets: formData['otherAssets'],
        creditCardPayment: parseCurrencyField(formData['creditCardPayment']),
        studentLoanPayment: parseCurrencyField(formData['studentLoanPayment']),
        autoLoanPayment: parseCurrencyField(formData['autoLoanPayment']),
        childSupport: parseCurrencyField(formData['childSupport']),
        otherDebt: parseCurrencyField(formData['otherDebt']),
        declOutstandingJudgments: formData['outstandingJudgments'],
        declBankruptcy: formData['bankruptcy'],
        declForeclosure: formData['foreclosure'],
        declLawsuit: formData['lawsuit'],
        declCosigner: formData['cosigner'],
        declCitizenship: formData['citizenship'],
        declPrimaryResidence: formData['primaryResidence'],
      });
      setSaveStatus('saved');
      setSavedAt(formatSavedAt(new Date().toISOString()));
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const handleChange = (key: string, raw: string, type: FieldType) => {
    const value = applyFormat(type, raw);
    const updated = { ...formData, [key]: value };
    setFormData(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    // Sync back to homeyProfile for linked fields
    const profile = getUserProfile();
    if (profile) {
      if (key === 'fullName') {
        saveUserProfile({ ...profile, name: value });
      } else if (key === 'baseSalary') {
        const digits = value.replace(/[^0-9]/g, '');
        saveUserProfile({ ...profile, yearlyIncome: digits });
      } else if (key === 'savingsBalance') {
        const digits = value.replace(/[^0-9]/g, '');
        saveUserProfile({ ...profile, savingsTotal: digits });
      }
    }
  };

  const renderField = (field: Field) => {
    const value = formData[field.key] ?? '';

    if (field.type === 'select') {
      return (
        <select
          value={value}
          onChange={(e) => handleChange(field.key, e.target.value, field.type)}
          className={selectClass}
        >
          <option value="" className="bg-[#3e78b2]">{field.placeholder}</option>
          {field.options?.map((opt) => (
            <option key={opt} value={opt} className="bg-[#3e78b2]">{opt}</option>
          ))}
        </select>
      );
    }

    if (field.type === 'textarea') {
      return (
        <textarea
          placeholder={field.placeholder}
          value={value}
          rows={3}
          onChange={(e) => handleChange(field.key, e.target.value, field.type)}
          className={inputClass + ' resize-none'}
        />
      );
    }

    if (field.type === 'number') {
      return (
        <input
          type="number"
          placeholder={field.placeholder}
          value={value}
          min={field.min}
          max={field.max}
          onChange={(e) => handleChange(field.key, e.target.value, field.type)}
          className={inputClass}
        />
      );
    }

    // text, date, email, ssn, phone, currency all use text input
    return (
      <input
        type={field.type === 'email' ? 'email' : field.type === 'date' ? 'date' : 'text'}
        placeholder={field.placeholder}
        value={value}
        inputMode={field.type === 'ssn' || field.type === 'phone' || field.type === 'currency' ? 'numeric' : undefined}
        onChange={(e) => handleChange(field.key, e.target.value, field.type)}
        className={inputClass}
      />
    );
  };

  return (
    <>
    <LoginPromptModal
      open={showLoginPrompt}
      onClose={() => setShowLoginPrompt(false)}
      message="Log in to save your loan application to your account so you can pick up where you left off."
    />
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex-1 flex flex-col relative z-10 px-4 md:px-10 py-8"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
        <div className="flex items-center gap-4 flex-1">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 glass rounded-xl text-white hover:bg-white/20 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white">Loan Application</h1>
            <p className="text-white/60 text-sm mt-0.5">Practice filling this out!</p>
            <p className="text-white/60 text-sm">* Date of Birth and SSN saved locally only</p>
          </div>
        </div>

        {/* Save to cloud button */}
        <div className="flex flex-col items-end gap-1">
          <button
            onClick={() => void handleSaveToCloud()}
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
              <><Save className="w-4 h-4" /> Save to Account</>
            )}
          </button>
          {savedAt && (
            <p className="text-white/40 text-xs">Last saved: {savedAt}</p>
          )}
          {!isLoggedIn && (
            <p className="text-white/40 text-xs">Log in to save to your account</p>
          )}
        </div>
      </div>

      {/* Accordion sections */}
      <div className="flex flex-col gap-3 w-full mb-4">
        {sections.map((section, i) => {
          const isOpen = openSection === section.id;
          return (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="glass rounded-2xl overflow-hidden"
            >
              <button
                onClick={() => setOpenSection(isOpen ? null : section.id)}
                className="w-full flex items-center justify-between px-8 py-5 hover:bg-white/10 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-white shrink-0"
                    style={{ backgroundColor: section.color + '50' }}
                  >
                    {section.icon}
                  </div>
                  <span className="text-white font-bold text-xl">{section.title}</span>
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
                    <div className="px-8 pb-8 flex flex-col gap-5">
                      {section.note && (
                        <p className="text-white/60 text-base italic border-l-2 border-white/20 pl-4">
                          {section.note}
                        </p>
                      )}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        {section.fields.map((field) => (
                          <div
                            key={field.key}
                            className={field.type === 'textarea' ? 'sm:col-span-2 flex flex-col gap-2' : 'flex flex-col gap-2'}
                          >
                            <label className="text-white/90 text-base font-medium">{field.label}</label>
                            {renderField(field)}
                          </div>
                        ))}
                      </div>
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
        className="glass rounded-2xl p-8 flex flex-col md:flex-row items-center gap-6"
      >
        <div className="flex-1">
          <h3 className="text-white font-bold text-2xl mb-2">Ready to gather your documents?</h3>
          <p className="text-white/70 text-base leading-relaxed">
            Once your application is filled out, the next step is collecting the supporting documents your lender will need to verify your information.
          </p>
        </div>
        <button
          onClick={onNext}
          className="flex items-center gap-3 px-6 py-4 rounded-2xl text-white font-semibold text-lg shrink-0 hover:bg-white/20 transition-all hover:-translate-y-1 hover:shadow-[0_6px_16px_rgba(20,50,100,0.5)]"
          style={{ backgroundColor: '#3e78b260' }}
        >
          Next: Gather Documents
          <ArrowRight className="w-5 h-5" />
        </button>
      </motion.div>
    </motion.div>
    </>
  );
}
