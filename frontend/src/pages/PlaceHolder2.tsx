import { motion } from 'motion/react';
import { Home } from 'lucide-react';
import { useNavigate } from 'react-router';
import { AppLayout } from '@/components/AppLayout';

/**
 * PlaceHolder2 — stub page ready for your feature content.
 * Already wired into routing and styled with the Homey design system.
 */
export function PlaceHolder2() {
  const navigate = useNavigate();

  return (
    <AppLayout>
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-3xl p-12 max-w-lg w-full text-center"
        >
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Home className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">Page 2</h1>
          <p className="text-white/70 mb-8">This page is ready for your content.</p>
          <button
            onClick={() => void navigate('/')}
            className="px-6 py-3 bg-white text-[#3e78b2] rounded-xl hover:bg-white/90 transition-all"
          >
            Back to Home
          </button>
        </motion.div>
      </div>
    </AppLayout>
  );
}
