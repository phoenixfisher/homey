import { motion } from 'motion/react';
import { CheckCircle, Lock, BookOpen, FileCheck } from 'lucide-react';

interface PreApprovalProgressBarProps {
  quest1Complete: boolean;
  quest3Complete: boolean;
  activeQuest: 1 | 3;
}

export function PreApprovalProgressBar({
  quest1Complete,
  quest3Complete,
  activeQuest,
}: PreApprovalProgressBarProps) {
  const quests = [
    {
      id: 1 as const,
      label: 'Quest 1: Understand Loans',
      icon: BookOpen,
      complete: quest1Complete,
      locked: false,
    },
    {
      id: 3 as const,
      label: 'Quest 3: Get Pre-Approved',
      icon: FileCheck,
      complete: quest3Complete,
      locked: !quest1Complete,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex items-center justify-center gap-0 w-full max-w-xl mx-auto py-6"
    >
      {quests.map((quest, idx) => {
        const isActive = activeQuest === quest.id && !quest.complete;
        const isDone = quest.complete;
        const isLocked = quest.locked;

        let circleClass = 'bg-white/10 border-2 border-white/20 text-white/30';
        let labelClass = 'text-white/30';

        if (isDone) {
          circleClass = 'bg-[#bdc4a7]/40 border-2 border-[#bdc4a7] text-[#bdc4a7]';
          labelClass = 'text-[#bdc4a7]';
        } else if (isActive) {
          circleClass = 'bg-white/20 border-2 border-white text-white shadow-lg shadow-white/20';
          labelClass = 'text-white font-semibold';
        } else if (isLocked) {
          circleClass = 'bg-white/5 border-2 border-white/20 text-white/20';
          labelClass = 'text-white/20';
        }

        const Icon = isDone ? CheckCircle : isLocked ? Lock : quest.icon;

        return (
          <div key={quest.id} className="flex items-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: idx * 0.15, duration: 0.4 }}
              className="flex flex-col items-center gap-2"
            >
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${circleClass}`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span className={`text-xs text-center max-w-[120px] leading-tight transition-all ${labelClass}`}>
                {quest.label}
              </span>
            </motion.div>

            {idx < quests.length - 1 && (
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="origin-left"
              >
                <div
                  className={`w-24 h-0.5 mx-3 rounded transition-all ${
                    quest1Complete ? 'bg-[#bdc4a7]' : 'bg-white/20'
                  }`}
                />
              </motion.div>
            )}
          </div>
        );
      })}
    </motion.div>
  );
}
