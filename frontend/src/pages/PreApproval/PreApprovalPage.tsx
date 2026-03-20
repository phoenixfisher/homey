import { useState } from 'react';
import { Link } from 'react-router';
import { motion } from 'motion/react';
import { Home, ArrowLeft } from 'lucide-react';
import { AppLayout } from '@/components/AppLayout';
import { LoanApplicationView } from './LoanApplicationView';
import { GatherDocumentsView } from './GatherDocumentsView';
import { QualificationView } from './QualificationView';
import { PreApprovalLetterView } from './PreApprovalLetterView';

type View = null | 'loan-application' | 'gather-documents' | 'qualification' | 'pre-approval';

const views: { id: View; label: string }[] = [
  { id: 'loan-application',  label: 'Loan Application' },
  { id: 'gather-documents',  label: 'Gather Documents' },
  { id: 'qualification',     label: 'Qualification' },
  { id: 'pre-approval',      label: 'Pre-Approval' },
];

export function PreApprovalPage() {
  const [activeView, setActiveView] = useState<View>(null);

  if (activeView === 'loan-application') {
    return (
      <AppLayout className="bg-gradient-to-b from-[#3e78b2] via-[#5a8ebd] to-[#92b4a7]">
        <LoanApplicationView onBack={() => setActiveView(null)} />
      </AppLayout>
    );
  }

  if (activeView === 'gather-documents') {
    return (
      <AppLayout className="bg-gradient-to-b from-[#3e78b2] via-[#5a8ebd] to-[#92b4a7]">
        <GatherDocumentsView onBack={() => setActiveView(null)} />
      </AppLayout>
    );
  }

  if (activeView === 'qualification') {
    return (
      <AppLayout className="bg-gradient-to-b from-[#3e78b2] via-[#5a8ebd] to-[#92b4a7]">
        <QualificationView onBack={() => setActiveView(null)} />
      </AppLayout>
    );
  }

  if (activeView === 'pre-approval') {
    return (
      <AppLayout className="bg-gradient-to-b from-[#3e78b2] via-[#5a8ebd] to-[#92b4a7]">
        <PreApprovalLetterView onBack={() => setActiveView(null)} />
      </AppLayout>
    );
  }

  if (activeView) {
    const view = views.find(v => v.id === activeView)!;
    return (
      <AppLayout className="bg-gradient-to-b from-[#3e78b2] via-[#5a8ebd] to-[#92b4a7]">
        <main className="flex-1 flex flex-col items-center justify-center px-4 py-20 relative z-10 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-3xl p-16 text-center max-w-2xl w-full"
          >
            <h1 className="text-4xl font-bold text-white mb-4">{view.label}</h1>
            <p className="text-white/70 text-lg">Content coming soon.</p>
          </motion.div>
          <button
            onClick={() => setActiveView(null)}
            className="flex items-center gap-2 px-6 py-3 glass rounded-xl text-white hover:bg-white/20 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
        </main>
      </AppLayout>
    );
  }

  return (
    <AppLayout className="bg-gradient-to-b from-[#3e78b2] via-[#5a8ebd] to-[#92b4a7]">
      {/* Header */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="relative z-20 glass border-b border-white/10"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <Home className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-white">Homey</span>
            </Link>
            <nav className="hidden md:flex items-center gap-8">
              <Link to="/#features" className="text-white/80 hover:text-white transition-colors">Features</Link>
              <Link to="/pre-approval" className="text-white font-semibold hover:text-white transition-colors">Pre-Approval</Link>
              <Link to="/#how-it-works" className="text-white/80 hover:text-white transition-colors">How It Works</Link>
              <Link to="/#about" className="text-white/80 hover:text-white transition-colors">About</Link>
            </nav>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="flex-1 relative z-10 p-4 md:p-8">

        {/* ── Mobile: stacked vertically ── */}
        <div className="flex flex-col items-center gap-0 md:hidden">
          {[
            'Loan Application',
            'Gather Documents',
            'Qualification',
            'Pre-Approval',
          ].map((label, i) => (
            <div key={label} className="flex flex-col items-center w-full">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.2 }}
                className="glass rounded-3xl w-full py-16 flex items-center justify-center"
              >
                <p className="text-white font-bold text-3xl">{label}</p>
              </motion.div>
              {i < 3 && (
                <motion.svg
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.2 + 0.15 }}
                  width="24" height="56" viewBox="0 0 24 56" fill="none"
                >
                  <line x1="12" y1="0" x2="12" y2="42" stroke="white" strokeOpacity="0.5" strokeWidth="2.5" strokeDasharray="6 4"/>
                  <polygon points="5,38 12,54 19,38" fill="white" fillOpacity="0.5"/>
                </motion.svg>
              )}
            </div>
          ))}
        </div>

        {/* ── Desktop: waterfall ── */}
        <div className="hidden md:grid w-full" style={{
          gridTemplateColumns: 'repeat(8, 1fr)',
          gridTemplateRows: 'repeat(8, 1fr)',
          minHeight: '82vh',
        }}>
          <motion.button
            initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
            onClick={() => setActiveView('loan-application')}
            className="glass rounded-3xl flex items-center justify-center hover:bg-white/20 transition-all cursor-pointer"
            style={{ gridColumn: '1 / 3', gridRow: '1 / 3', margin: '0.5rem' }}
          >
            <p className="text-white font-bold text-3xl text-center">Loan<br/>Application</p>
          </motion.button>

          <motion.button
            initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}
            onClick={() => setActiveView('gather-documents')}
            className="glass rounded-3xl flex items-center justify-center hover:bg-white/20 transition-all cursor-pointer"
            style={{ gridColumn: '3 / 5', gridRow: '3 / 5', margin: '0.5rem' }}
          >
            <p className="text-white font-bold text-3xl text-center">Gather<br/>Documents</p>
          </motion.button>

          <motion.button
            initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.7 }}
            onClick={() => setActiveView('qualification')}
            className="glass rounded-3xl flex items-center justify-center hover:bg-white/20 transition-all cursor-pointer"
            style={{ gridColumn: '5 / 7', gridRow: '5 / 7', margin: '0.5rem' }}
          >
            <p className="text-white font-bold text-3xl text-center">Qualification</p>
          </motion.button>

          <motion.button
            initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.0 }}
            onClick={() => setActiveView('pre-approval')}
            className="glass rounded-3xl flex items-center justify-center hover:bg-white/20 transition-all cursor-pointer"
            style={{ gridColumn: '7 / 9', gridRow: '7 / 9', margin: '0.5rem' }}
          >
            <p className="text-white font-bold text-3xl text-center">Pre-Approval</p>
          </motion.button>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 glass border-t border-white/10 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <Home className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-white">Homey</span>
              </div>
              <p className="text-white/70 text-sm">
                Empowering your journey to homeownership with smart tools and insights.
              </p>
            </div>
            <div>
              <h4 className="text-white mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/#features" className="text-white/70 hover:text-white transition-colors">Features</Link></li>
                <li><Link to="/#how-it-works" className="text-white/70 hover:text-white transition-colors">How It Works</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/#about" className="text-white/70 hover:text-white transition-colors">About</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white mb-4">Support</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#contact" className="text-white/70 hover:text-white transition-colors">Contact</a></li>
                <li><a href="#privacy" className="text-white/70 hover:text-white transition-colors">Privacy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-6">
            <p className="text-white/60 text-sm text-center">© 2026 Homey. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </AppLayout>
  );
}
