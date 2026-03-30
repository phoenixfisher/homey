import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router';
import { LogIn, X } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  message?: string;
}

export function LoginPromptModal({ open, onClose, message }: Props) {
  const navigate = useNavigate();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 16 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="login-prompt-title"
            className="glass rounded-3xl p-8 w-full max-w-sm flex flex-col gap-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
                <LogIn className="w-6 h-6 text-white" />
              </div>
              <button
                onClick={onClose}
                aria-label="Close dialog"
                className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-all"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            <div>
              <h2 id="login-prompt-title" className="text-xl font-bold text-white mb-1">Sign in to save your progress</h2>
              <p className="text-white/70 text-base leading-relaxed">
                {message ?? 'Log in or create a free account to save your pre-approval data to your account.'}
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => void navigate('/login')}
                className="w-full py-3 bg-white text-[#3e78b2] rounded-xl font-semibold text-base hover:bg-white/90 transition-all"
              >
                Log In
              </button>
              <button
                onClick={onClose}
                className="w-full py-3 glass rounded-xl text-white/70 text-base hover:bg-white/10 transition-all"
              >
                Continue without saving
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
