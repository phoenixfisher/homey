import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
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
} from 'lucide-react';

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
      { id: 'paystub_1', label: 'Most Recent Pay Stub' },
      { id: 'paystub_2', label: '2nd Most Recent Pay Stub' },
      { id: 'paystub_eoy_1', label: 'End-of-Year Pay Stub (if overtime / bonus / commission)' },
      { id: 'paystub_eoy_2', label: '2nd End-of-Year Pay Stub (if overtime / bonus / commission)' },
    ],
  },
  {
    id: 'taxreturns',
    icon: <FileText className="w-6 h-6" />,
    title: 'Tax Returns',
    color: '#92b4a7',
    note: 'Required for self-employed borrowers.',
    slots: [
      { id: 'tax_1', label: 'Most Recent Federal Tax Return (all pages)' },
      { id: 'tax_2', label: 'Previous Year Federal Tax Return (all pages)' },
    ],
  },
  {
    id: 'w2s',
    icon: <Briefcase className="w-6 h-6" />,
    title: 'W-2s',
    color: '#bdc4a7',
    slots: [
      { id: 'w2_year1', label: 'W-2 — Most Recent Year' },
      { id: 'w2_year2', label: 'W-2 — Previous Year' },
    ],
  },
  {
    id: 'id',
    icon: <CreditCard className="w-6 h-6" />,
    title: 'Government-Issued ID',
    color: '#bf8b85',
    slots: [
      { id: 'gov_id', label: "Driver's License or State-Issued Photo ID" },
    ],
  },
  {
    id: 'bankstatements',
    icon: <Building className="w-6 h-6" />,
    title: 'Bank Statements',
    color: '#5a8ebd',
    slots: [
      { id: 'bank_1', label: 'Most Recent Bank Statement — Account 1' },
      { id: 'bank_2', label: '2nd Most Recent Bank Statement — Account 1' },
      { id: 'bank_3', label: 'Most Recent Bank Statement — Account 2 (if applicable)' },
      { id: 'bank_4', label: '2nd Most Recent Bank Statement — Account 2 (if applicable)' },
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
}

export function GatherDocumentsView({ onBack }: Props) {
  const [openSection, setOpenSection] = useState<string | null>('paystubs');
  const [files, setFiles] = useState<Record<string, StoredFile>>({});
  const [preview, setPreview] = useState<StoredFile | null>(null);
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setFiles(JSON.parse(saved) as Record<string, StoredFile>);
  }, []);

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex-1 flex flex-col relative z-10 px-4 md:px-10 py-8"
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
          <h1 className="text-3xl font-bold text-white">Gather Documents</h1>
          <p className="text-white/60 text-sm mt-0.5">Upload your documents — stored locally in your browser</p>
        </div>
      </div>

      {/* Accordion sections */}
      <div className="flex flex-col gap-3 w-full">
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
                        <p className="text-white/60 text-sm italic border-l-2 border-white/20 pl-4">
                          {section.note}
                        </p>
                      )}

                      {section.slots.map((slot) => {
                        const stored = files[slot.id];
                        return (
                          <div key={slot.id} className="flex flex-col gap-2">
                            <label className="text-white/90 text-base font-medium">{slot.label}</label>

                            {stored ? (
                              /* File uploaded — show name + actions */
                              <div className="flex items-center gap-3 glass rounded-xl px-5 py-3">
                                <File className="w-5 h-5 text-white/60 shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-white text-sm font-medium truncate">{stored.name}</p>
                                  <p className="text-white/50 text-xs">{formatBytes(stored.size)}</p>
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
                                <span className="text-white/50 text-sm">Click to upload a file</span>
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
  );
}
