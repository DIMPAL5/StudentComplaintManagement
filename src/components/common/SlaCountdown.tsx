import React, { useState, useEffect } from 'react';
import { ComplaintStatus } from '../../types';
import { Clock, AlertTriangle } from 'lucide-react';

interface SlaCountdownProps {
  deadline: string;
  status: ComplaintStatus;
  createdAt?: string;
  className?: string;
}

export const SlaCountdown: React.FC<SlaCountdownProps> = ({ deadline, status, className = '' }) => {
  const [timeLeft, setTimeLeft] = useState<{ diffMs: number; isOverdue: boolean; text: string }>({
    diffMs: 0,
    isOverdue: false,
    text: '',
  });

  const isResolvedOrClosed = status === 'resolved' || status === 'closed';

  useEffect(() => {
    const calculateTime = () => {
      const target = new Date(deadline).getTime();
      const now = Date.now();
      const diffMs = target - now;
      const isOverdue = diffMs < 0;
      const absMs = Math.abs(diffMs);

      const hours = Math.floor(absMs / (1000 * 60 * 60));
      const minutes = Math.floor((absMs % (1000 * 60 * 60)) / (1000 * 60));

      let text = '';
      if (isOverdue) {
        text = `Overdue by ${hours}h ${minutes}m`;
      } else {
        if (hours > 24) {
          const days = Math.floor(hours / 24);
          text = `${days}d ${hours % 24}h remaining`;
        } else {
          text = `${hours}h ${minutes}m remaining`;
        }
      }

      setTimeLeft({ diffMs, isOverdue, text });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, [deadline]);

  if (isResolvedOrClosed) {
    return (
      <span className={`inline-flex items-center text-xs font-medium text-emerald-600 dark:text-emerald-400 ${className}`}>
        <Clock className="w-3.5 h-3.5 mr-1" />
        SLA Met (Resolved)
      </span>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold ${
        timeLeft.isOverdue
          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-200 border border-rose-300 dark:border-rose-800 animate-pulse'
          : timeLeft.diffMs < 3 * 3600 * 1000
          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-200 border border-amber-300 dark:border-amber-800'
          : 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
      } ${className}`}
    >
      {timeLeft.isOverdue ? <AlertTriangle className="w-3.5 h-3.5 text-rose-600" /> : <Clock className="w-3.5 h-3.5 text-emerald-600" />}
      <span>{timeLeft.text}</span>
    </div>
  );
};
