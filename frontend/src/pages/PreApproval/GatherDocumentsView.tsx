import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  ArrowRight,
  FileText,
  DollarSign,
  Briefcase,
  CreditCard,
  Building,
  ChevronDown,
  ChevronUp,
  Upload,
  Download,
  X,
  File,
  Eye,
  Save,
  CheckCircle,
  Cloud,
  AlertCircle,
} from 'lucide-react';
import { getUserProfile, saveUserProfile, fetchSessionUser } from '@/lib/auth';
import { fetchUserProfile, type UserProfile } from '@/lib/profile';
import {
  fetchDocumentChecklist,
  saveDocumentChecklist,
  formatSavedAt,
  type DocumentChecklist,
} from '@/lib/preapproval';
import { LoginPromptModal } from '@/components/LoginPromptModal';

interface DocSlot {
  id: string;
  label: string;
}

interface Section {
  id: string;
  icon: React.ReactNode;
  title: string;
  color: string;
  note?: string;
  slots: DocSlot[];
}

const sections: Section[] = [
  {
    id: 'paystubs',
    icon: <DollarSign className="w-6 h-6" />,
    title: 'Pay Stubs',
    color: '#3e78b2',
    slots: [
      { id: 'paystub_1', label: '* Most Recent Pay Stub' },
      { id: 'paystub_2', label: '* 2nd Most Recent Pay Stub' },
      { id: 'paystub_eoy_1', label: '* End-of-Year Pay Stub (if overtime / bonus / commission)' },
      { id: 'paystub_eoy_2', label: '* 2nd End-of-Year Pay Stub (if overtime / bonus / commission)' },
    ],
  },
  {
    id: 'taxreturns',
    icon: <FileText className="w-6 h-6" />,
    title: 'Tax Returns',
    color: '#92b4a7',
    note: 'Required for self-employed borrowers.',
    slots: [
      { id: 'tax_1', label: '* Most Recent Federal Tax Return (all pages)' },
      { id: 'tax_2', label: '* Previous Year Federal Tax Return (all pages)' },
    ],
  },
  {
    id: 'w2s',
    icon: <Briefcase className="w-6 h-6" />,
    title: 'W-2s',
    color: '#bdc4a7',
    slots: [
      { id: 'w2_year1', label: '* W-2 — Most Recent Year' },
      { id: 'w2_year2', label: '* W-2 — Previous Year' },
    ],
  },
  {
    id: 'id',
    icon: <CreditCard className="w-6 h-6" />,
    title: 'Government-Issued ID',
    color: '#bf8b85',
    slots: [
      { id: 'gov_id', label: "* Driver's License or State-Issued Photo ID" },
    ],
  },
  {
    id: 'bankstatements',
    icon: <Building className="w-6 h-6" />,
    title: 'Bank Statements',
    color: '#5a8ebd',
    slots: [
      { id: 'bank_1', label: '* Most Recent Bank Statement — Account 1' },
      { id: 'bank_2', label: '* 2nd Most Recent Bank Statement — Account 1' },
      { id: 'bank_3', label: '* Most Recent Bank Statement — Account 2 (if applicable)' },
      { id: 'bank_4', label: '* 2nd Most Recent Bank Statement — Account 2 (if applicable)' },
    ],
  },
];

interface StoredFile {
  name: string;
  dataUrl: string;
  size: number;
}

const STORAGE_KEY = 'homeyGatherDocuments';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface Props {
  onBack: () => void;
  onNext: () => void;
}

// Maps slot IDs to DocumentChecklist keys
const SLOT_TO_CHECKLIST_KEY: Record<string, keyof Omit<DocumentChecklist, 'savedAt'>> = {
  paystub_1: 'paystub1',
  paystub_2: 'paystub2',
  paystub_eoy_1: 'paystubEoy1',
  paystub_eoy_2: 'paystubEoy2',
  tax_1: 'tax1',
  tax_2: 'tax2',
  w2_year1: 'w2Year1',
  w2_year2: 'w2Year2',
  gov_id: 'govId',
  bank_1: 'bank1',
  bank_2: 'bank2',
  bank_3: 'bank3',
  bank_4: 'bank4',
};

const DEFAULT_CHECKLIST: Omit<DocumentChecklist, 'savedAt'> = {
  paystub1: false, paystub2: false, paystubEoy1: false, paystubEoy2: false,
  tax1: false, tax2: false, w2Year1: false, w2Year2: false, govId: false,
  bank1: false, bank2: false, bank3: false, bank4: false,
};

export function GatherDocumentsView({ onBack, onNext }: Props) {
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [files, setFiles] = useState<Record<string, StoredFile>>({});
  const [preview, setPreview] = useState<StoredFile | null>(null);
  const [showDownloadConfirm, setShowDownloadConfirm] = useState(false);
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [savingsTotal, setSavingsTotal] = useState('');
  const [monthlyExpenses, setMonthlyExpenses] = useState('');
  const [desiredHomePrice, setDesiredHomePrice] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [checklistSaveStatus, setChecklistSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [checklistSavedAt, setChecklistSavedAt] = useState<string | null>(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  // DB-backed checklist (slot ID -> checked)
  const [dbChecklist, setDbChecklist] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setFiles(JSON.parse(saved) as Record<string, StoredFile>);

    const localProfile = getUserProfile();
    if (localProfile) {
      setMonthlyIncome(localProfile.monthlyIncome ?? '');
      setSavingsTotal(localProfile.savingsTotal ?? '');
      setMonthlyExpenses(localProfile.monthlyExpenses ?? '');
      setDesiredHomePrice(localProfile.desiredHomePrice ?? '');
    }

    void (async () => {
      const session = await fetchSessionUser();
      if (session) {
        const profile = await fetchUserProfile();
        if (profile) {
          setMonthlyIncome(profile.monthlyIncome?.toString() ?? '');
          setSavingsTotal(profile.totalSavings?.toString() ?? '');
          setMonthlyExpenses(profile.monthlyExpenses?.toString() ?? '');
          setDesiredHomePrice(profile.desiredHomePrice?.toString() ?? '');
          saveUserProfile({
            name: `${profile.firstName} ${profile.lastName}`.trim(),
            desiredHomePrice: profile.desiredHomePrice?.toString() ?? '',
            creditScore: profile.creditScore?.toString() ?? '',
            monthlyIncome: profile.monthlyIncome?.toString() ?? '',
            yearlyIncome: '',
            savingsTotal: profile.totalSavings?.toString() ?? '',
            monthlyExpenses: profile.monthlyExpenses?.toString() ?? '',
            industry: profile.industryOfWork ?? '',
          });
        }

        setIsLoggedIn(true);
        try {
          const dbData = await fetchDocumentChecklist();
          if (dbData) {
            setChecklistSavedAt(formatSavedAt(dbData.savedAt));
            // Convert checklist response back to slot-keyed booleans
            const slotMap: Record<string, boolean> = {};
            for (const [slotId, checklistKey] of Object.entries(SLOT_TO_CHECKLIST_KEY)) {
              slotMap[slotId] = dbData[checklistKey] ?? false;
            }
            setDbChecklist(slotMap);
          }
        } catch {
          // silently fall back
        }
      }
    })();
  }, []);

  const handleSaveChecklist = async () => {
    if (!isLoggedIn) {
      setShowLoginPrompt(true);
      return;
    }
    setChecklistSaveStatus('saving');
    try {
      // Build checklist from dbChecklist state (which reflects current UI)
      const payload: Omit<DocumentChecklist, 'savedAt'> = { ...DEFAULT_CHECKLIST };
      for (const [slotId, checklistKey] of Object.entries(SLOT_TO_CHECKLIST_KEY)) {
        (payload as Record<string, boolean>)[checklistKey] = dbChecklist[slotId] ?? false;
      }
      await saveDocumentChecklist(payload);
      setChecklistSaveStatus('saved');
      setChecklistSavedAt(formatSavedAt(new Date().toISOString()));
      setTimeout(() => setChecklistSaveStatus('idle'), 3000);
    } catch {
      setChecklistSaveStatus('error');
      setTimeout(() => setChecklistSaveStatus('idle'), 3000);
    }
  };

  const toggleDbChecklist = (slotId: string) => {
    setDbChecklist(prev => ({ ...prev, [slotId]: !prev[slotId] }));
  };

  const handleIncomeSummaryChange = (field: 'monthlyIncome' | 'savingsTotal' | 'monthlyExpenses' | 'desiredHomePrice', value: string) => {
    const digits = value.replace(/[^0-9]/g, '');
    if (field === 'monthlyIncome') setMonthlyIncome(digits);
    else if (field === 'savingsTotal') setSavingsTotal(digits);
    else if (field === 'monthlyExpenses') setMonthlyExpenses(digits);
    else if (field === 'desiredHomePrice') setDesiredHomePrice(digits);

    const profile = getUserProfile() ?? { name: '', desiredHomePrice: '', creditScore: '', monthlyIncome: '', yearlyIncome: '', savingsTotal: '', monthlyExpenses: '', industry: '' };
    saveUserProfile({ ...profile, [field]: digits });
  };

  const saveFiles = (updated: Record<string, StoredFile>) => {
    setFiles(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const handleUpload = (slotId: string, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      saveFiles({
        ...files,
        [slotId]: { name: file.name, dataUrl, size: file.size },
      });
    };
    reader.readAsDataURL(file);
  };

  const handleRemove = (slotId: string) => {
    const updated = { ...files };
    delete updated[slotId];
    saveFiles(updated);
  };

  const handleDownload = (stored: StoredFile) => {
    const a = document.createElement('a');
    a.href = stored.dataUrl;
    a.download = stored.name;
    a.click();
  };

  const handleDownloadAll = () => {
    sections.forEach((section) => {
      section.slots.forEach((slot) => {
        const stored = files[slot.id];
        if (stored) handleDownload(stored);
      });
    });
    setShowDownloadConfirm(false);
  };

  return (
    <>
    <LoginPromptModal
      open={showLoginPrompt}
      onClose={() => setShowLoginPrompt(false)}
      message="Log in to save your document checklist to your account."
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
            <h1 className="text-3xl font-bold text-white">Gather Documents</h1>
            <p className="text-white/60 text-sm mt-0.5">Upload your documents!</p>
            <p className="text-white/60 text-sm">* Files stored locally · checklist saved to account</p>
          </div>
        </div>

        {/* Save checklist to cloud */}
        <div className="flex flex-col items-end gap-1">
          <button
            onClick={() => void handleSaveChecklist()}
            disabled={checklistSaveStatus === 'saving'}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shrink-0
              ${checklistSaveStatus === 'saved' ? 'bg-emerald-500/30 border border-emerald-400/40 text-emerald-300' :
                checklistSaveStatus === 'error' ? 'bg-[#bf8b85]/30 border border-[#bf8b85]/40 text-[#bf8b85]' :
                'glass text-white hover:bg-white/20'}`}
          >
            {checklistSaveStatus === 'saving' ? (
              <><Cloud className="w-4 h-4 animate-pulse" /> Saving...</>
            ) : checklistSaveStatus === 'saved' ? (
              <><CheckCircle className="w-4 h-4" /> Saved!</>
            ) : checklistSaveStatus === 'error' ? (
              <><AlertCircle className="w-4 h-4" /> Error saving</>
            ) : (
              <><Save className="w-4 h-4" /> Save Checklist</>
            )}
          </button>
          {checklistSavedAt && (
            <p className="text-white/40 text-xs">Last saved: {checklistSavedAt}</p>
          )}
          {!isLoggedIn && (
            <p className="text-white/40 text-xs">Log in to save to your account</p>
          )}
        </div>
      </div>

      {/* Accordion sections */}
      <div className="flex flex-col gap-3 w-full">

        {/* Income Summary */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl overflow-hidden"
        >
          <div className="flex items-center justify-between px-8 py-5">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white shrink-0" style={{ backgroundColor: '#3e78b250' }}>
                <DollarSign className="w-6 h-6" />
              </div>
              <span className="text-white font-bold text-xl">Income Summary</span>
            </div>
            <button
              onClick={() => setShowDownloadConfirm(true)}
              className="flex items-center gap-2 px-4 py-2 glass rounded-xl text-white hover:bg-white/20 transition-all text-sm shrink-0"
            >
              <Download className="w-4 h-4" />
              Download All Documents
            </button>
          </div>
          <div className="px-8 pb-8 flex flex-col gap-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div className="flex flex-col gap-2">
                <label className="text-white/90 text-base font-medium">Monthly Income</label>
                <input
                  type="number"
                  min={0}
                  value={monthlyIncome}
                  onChange={(e) => handleIncomeSummaryChange('monthlyIncome', e.target.value)}
                  placeholder="e.g. 5000"
                  className="px-5 py-3 glass rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all text-base w-full"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-white/90 text-base font-medium">Monthly Expenses</label>
                <input
                  type="number"
                  min={0}
                  value={monthlyExpenses}
                  onChange={(e) => handleIncomeSummaryChange('monthlyExpenses', e.target.value)}
                  placeholder="e.g. 2500"
                  className="px-5 py-3 glass rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all text-base w-full"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-white/90 text-base font-medium">Savings Total</label>
                <input
                  type="number"
                  min={0}
                  value={savingsTotal}
                  onChange={(e) => handleIncomeSummaryChange('savingsTotal', e.target.value)}
                  placeholder="e.g. 25000"
                  className="px-5 py-3 glass rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all text-base w-full"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-white/90 text-base font-medium">Desired Home Price</label>
                <input
                  type="number"
                  min={0}
                  value={desiredHomePrice}
                  onChange={(e) => handleIncomeSummaryChange('desiredHomePrice', e.target.value)}
                  placeholder="e.g. 350000"
                  className="px-5 py-3 glass rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all text-base w-full"
                />
              </div>
            </div>
          </div>
        </motion.div>

        {sections.map((section, i) => {
          const isOpen = openSection === section.id;
          const uploadedCount = section.slots.filter(s => files[s.id]).length;

          return (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="glass rounded-2xl overflow-hidden"
            >
              {/* Header */}
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
                  {uploadedCount > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-full text-white/80" style={{ backgroundColor: section.color + '60' }}>
                      {uploadedCount} / {section.slots.length} uploaded
                    </span>
                  )}
                </div>
                {isOpen
                  ? <ChevronUp className="w-6 h-6 text-white/60 shrink-0" />
                  : <ChevronDown className="w-6 h-6 text-white/60 shrink-0" />
                }
              </button>

              {/* Body */}
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="px-8 pb-8 flex flex-col gap-4">
                      {section.note && (
                        <p className="text-white/60 text-base italic border-l-2 border-white/20 pl-4">
                          {section.note}
                        </p>
                      )}

                      {section.slots.map((slot) => {
                        const stored = files[slot.id];
                        const isGathered = dbChecklist[slot.id] ?? false;
                        return (
                          <div key={slot.id} className="flex flex-col gap-2">
                            <div className="flex items-center justify-between gap-2">
                              <label className="text-white/90 text-base font-medium">{slot.label}</label>
                              <button
                                onClick={() => toggleDbChecklist(slot.id)}
                                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-sm font-medium shrink-0 transition-all
                                  ${isGathered
                                    ? 'bg-emerald-500/20 border border-emerald-400/40 text-emerald-300'
                                    : 'glass text-white/40 hover:text-white/70'}`}
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                                {isGathered ? 'Have it' : 'Mark ready'}
                              </button>
                            </div>

                            {stored ? (
                              /* File uploaded — show name + actions */
                              <div className="flex items-center gap-3 glass rounded-xl px-5 py-3">
                                <File className="w-5 h-5 text-white/60 shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-white text-base font-medium truncate">{stored.name}</p>
                                  <p className="text-white/50 text-sm">{formatBytes(stored.size)}</p>
                                </div>
                                <button
                                  onClick={() => setPreview(stored)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition-all text-sm shrink-0"
                                  title="Preview"
                                >
                                  <Eye className="w-4 h-4" />
                                  Preview
                                </button>
                                <button
                                  onClick={() => handleDownload(stored)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition-all text-sm shrink-0"
                                  title="Download"
                                >
                                  <Download className="w-4 h-4" />
                                  Download
                                </button>
                                <button
                                  onClick={() => handleRemove(slot.id)}
                                  className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/20 transition-all shrink-0"
                                  title="Remove"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              /* Upload zone */
                              <button
                                onClick={() => inputRefs.current[slot.id]?.click()}
                                className="flex items-center gap-3 glass rounded-xl px-5 py-4 border border-dashed border-white/20 hover:bg-white/10 hover:border-white/40 transition-all text-left w-full"
                              >
                                <Upload className="w-5 h-5 text-white/40 shrink-0" />
                                <span className="text-white/50 text-base">Click to upload a file</span>
                              </button>
                            )}

                            {/* Hidden file input */}
                            <input
                              ref={(el) => { inputRefs.current[slot.id] = el; }}
                              type="file"
                              className="hidden"
                              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleUpload(slot.id, file);
                                e.target.value = '';
                              }}
                            />
                          </div>
                        );
                      })}
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
          <h3 className="text-white font-bold text-2xl mb-2">Ready to see if you qualify?</h3>
          <p className="text-white/70 text-base leading-relaxed">
            Once your documents are gathered, the next step is understanding what your lender is calculating to determine your qualification.
          </p>
        </div>
        <button
          onClick={onNext}
          className="flex items-center gap-3 px-6 py-4 rounded-2xl text-white font-semibold text-lg shrink-0 hover:bg-white/20 transition-all hover:-translate-y-1 hover:shadow-[0_6px_16px_rgba(20,50,100,0.5)]"
          style={{ backgroundColor: '#3e78b260' }}
        >
          Next: Qualification
          <ArrowRight className="w-5 h-5" />
        </button>
      </motion.div>

      {/* Download All Confirmation Modal */}
      <AnimatePresence>
        {showDownloadConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowDownloadConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass rounded-3xl p-8 w-full max-w-lg flex flex-col gap-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Download All Documents?</h2>
                <button
                  onClick={() => setShowDownloadConfirm(false)}
                  className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/20 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex flex-col gap-4">
                {sections.map((section) => {
                  const uploadedSlots = section.slots.filter((slot) => files[slot.id]);
                  if (uploadedSlots.length === 0) return null;
                  return (
                    <div key={section.id}>
                      <p className="text-white font-semibold text-sm mb-2" style={{ color: section.color === '#3e78b2' ? '#93c5fd' : section.color }}>{section.title}</p>
                      <ul className="flex flex-col gap-1 pl-3">
                        {uploadedSlots.map((slot) => (
                          <li key={slot.id} className="flex items-center gap-2 text-white/80 text-sm">
                            <File className="w-3.5 h-3.5 text-white/40 shrink-0" />
                            {files[slot.id].name}
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
                {sections.every((s) => s.slots.every((slot) => !files[slot.id])) && (
                  <p className="text-white/60 text-sm">No documents uploaded yet.</p>
                )}
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowDownloadConfirm(false)}
                  className="px-5 py-2.5 glass rounded-xl text-white hover:bg-white/20 transition-all text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDownloadAll}
                  disabled={sections.every((s) => s.slots.every((slot) => !files[slot.id]))}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white text-[#3e78b2] rounded-xl font-semibold hover:bg-white/90 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download className="w-4 h-4" />
                  Download All
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Preview Modal */}
      <AnimatePresence>
        {preview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setPreview(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass rounded-3xl p-4 w-full max-w-3xl max-h-[90vh] flex flex-col gap-4"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal header */}
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-3 min-w-0">
                  <File className="w-5 h-5 text-white/60 shrink-0" />
                  <p className="text-white font-semibold truncate">{preview.name}</p>
                  <p className="text-white/50 text-sm shrink-0">{formatBytes(preview.size)}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleDownload(preview)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition-all text-sm"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                  <button
                    onClick={() => setPreview(null)}
                    className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/20 transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Preview content */}
              <div className="flex-1 overflow-auto rounded-2xl bg-black/20 min-h-0" style={{ maxHeight: '75vh' }}>
                {preview.dataUrl.startsWith('data:image/') ? (
                  <img
                    src={preview.dataUrl}
                    alt={preview.name}
                    className="w-full h-auto rounded-2xl object-contain"
                  />
                ) : preview.dataUrl.startsWith('data:application/pdf') ? (
                  <iframe
                    src={preview.dataUrl}
                    title={preview.name}
                    className="w-full rounded-2xl"
                    style={{ height: '70vh' }}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-48 gap-3">
                    <FileText className="w-12 h-12 text-white/30" />
                    <p className="text-white/50 text-sm">Preview not available for this file type.</p>
                    <button
                      onClick={() => handleDownload(preview)}
                      className="flex items-center gap-2 px-4 py-2 glass rounded-xl text-white hover:bg-white/20 transition-all text-sm"
                    >
                      <Download className="w-4 h-4" />
                      Download to view
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
    </>
  );
}
