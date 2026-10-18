import React, { useState } from 'react';
import { SecurityIncident } from '../../types/tokenscope';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  incidents: SecurityIncident[];
  onSelectIncident: (inc: SecurityIncident) => void;
  onToast: (msg: string) => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  incidents,
  onSelectIncident,
  onToast
}) => {
  const [filter, setFilter] = useState<'all' | 'critical' | 'warnings'>('all');

  if (!isOpen) return null;

  const filtered = incidents.filter((inc) => {
    if (filter === 'critical') return inc.severity === 'CRITICAL';
    if (filter === 'warnings') return inc.severity === 'WARNING';
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-surface-container-lowest rounded-2xl w-full max-w-lg shadow-2xl border border-outline-variant/30 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-surface-container-high flex items-center justify-between bg-surface-container-low">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[20px]">notifications_active</span>
            <div>
              <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                Active Security Alerts &amp; Triggers
              </h3>
              <p className="font-code-sm text-code-sm text-on-surface-variant">
                Live Solana mempool exploit signals
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Filter Bar */}
        <div className="p-3 bg-surface-container border-b border-outline-variant/20 flex items-center gap-1.5">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-md text-xs font-label-sm font-semibold transition-all cursor-pointer ${
              filter === 'all' ? 'bg-primary text-on-primary' : 'bg-surface-container-lowest text-on-surface-variant'
            }`}
          >
            All Alerts ({incidents.length})
          </button>
          <button
            onClick={() => setFilter('critical')}
            className={`px-3 py-1 rounded-md text-xs font-label-sm font-semibold transition-all cursor-pointer ${
              filter === 'critical' ? 'bg-error text-on-error' : 'bg-surface-container-lowest text-on-surface-variant'
            }`}
          >
            Critical Only
          </button>
          <button
            onClick={() => setFilter('warnings')}
            className={`px-3 py-1 rounded-md text-xs font-label-sm font-semibold transition-all cursor-pointer ${
              filter === 'warnings' ? 'bg-[#d97706] text-white' : 'bg-surface-container-lowest text-on-surface-variant'
            }`}
          >
            Authority Changes
          </button>
        </div>

        {/* List of Alerts */}
        <div className="p-4 overflow-y-auto space-y-3 font-body-md text-on-surface">
          {filtered.map((inc) => (
            <div
              key={inc.id}
              onClick={() => {
                onSelectIncident(inc);
                onClose();
              }}
              className="p-3 rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors border border-outline-variant/20 cursor-pointer flex flex-col gap-1.5"
            >
              <div className="flex items-center justify-between">
                <span
                  className={`px-2 py-0.5 rounded font-label-sm text-[10px] uppercase font-bold ${
                    inc.severity === 'CRITICAL'
                      ? 'text-error bg-error-container'
                      : inc.severity === 'WARNING'
                      ? 'text-[#92400e] bg-[#fef3c7]'
                      : 'text-secondary bg-secondary-container'
                  }`}
                >
                  {inc.badgeText}
                </span>
                <span className="font-code-sm text-code-sm text-on-surface-variant">
                  {inc.timeAgo}
                </span>
              </div>
              <div className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                {inc.title}
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-2">
                {inc.description}
              </p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-surface-container-high bg-surface-container-low flex items-center justify-between">
          <button
            onClick={() => onToast('All notifications marked as acknowledged')}
            className="text-xs font-code-sm text-on-surface-variant hover:text-on-surface cursor-pointer"
          >
            Mark all acknowledged
          </button>
          <button
            onClick={onClose}
            className="bg-primary text-on-primary py-1.5 px-4 rounded-lg font-label-md text-label-md font-semibold hover:bg-surface-tint cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
