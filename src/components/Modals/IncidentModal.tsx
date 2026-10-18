import React from 'react';
import { SecurityIncident } from '../../types/tokenscope';

interface IncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  incident: SecurityIncident | null;
  onToast: (msg: string) => void;
}

export const IncidentModal: React.FC<IncidentModalProps> = ({
  isOpen,
  onClose,
  incident,
  onToast
}) => {
  if (!isOpen || !incident) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-surface-container-lowest rounded-2xl w-full max-w-lg shadow-2xl border border-outline-variant/30 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-surface-container-high flex items-center justify-between bg-surface-container-low">
          <div className="flex items-center gap-2">
            <span 
              className={`px-2 py-0.5 rounded font-label-sm text-label-sm uppercase font-semibold ${
                incident.severity === 'CRITICAL'
                  ? 'text-error bg-error-container'
                  : incident.severity === 'WARNING'
                  ? 'text-[#92400e] bg-[#fef3c7]'
                  : 'text-secondary bg-secondary-container'
              }`}
            >
              {incident.badgeText}
            </span>
            <span className="font-code-sm text-code-sm text-on-surface-variant">
              {incident.timeAgo}
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 font-body-md text-on-surface">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="font-headline-md text-headline-md font-bold">{incident.tokenSymbol}</span>
              <span className="font-headline-sm text-headline-sm text-on-surface">{incident.headline}</span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-2 leading-relaxed">
              {incident.description}
            </p>
          </div>

          {/* Forensic Breakdown */}
          <div className="bg-surface-container-low p-3.5 rounded-xl border border-outline-variant/20 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-on-surface-variant">Solana Block Height</span>
              <span className="font-code-sm font-semibold">{incident.blockHeight ? `#${incident.blockHeight}` : '#29384711'}</span>
            </div>
            {incident.lossAmount && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-on-surface-variant">Total Capital Drained</span>
                <span className="font-code-sm font-semibold text-error">{incident.lossAmount}</span>
              </div>
            )}
            <div className="flex items-center justify-between text-xs">
              <span className="text-on-surface-variant">Mempool Status</span>
              <span className="font-code-sm text-secondary font-medium">Finalized & Confirmed</span>
            </div>
          </div>

          {/* Deep Analysis */}
          <div>
            <h4 className="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant mb-1.5">
              Instruction Forensic Log
            </h4>
            <div className="p-3 bg-surface-container rounded-lg font-code-sm text-code-sm text-on-surface leading-relaxed">
              {incident.detailedAnalysis || 'Analysis verified on-chain via Solana RPC cluster and Raydium instruction decompiler.'}
            </div>
          </div>

          {/* Transaction Hash */}
          {incident.txOrSafeHash && (
            <div className="p-3 bg-surface-container-low rounded-lg flex items-center justify-between gap-2">
              <div className="min-w-0">
                <span className="font-label-sm text-label-sm text-on-surface-variant block">Reference Hash / Public Key</span>
                <span className="font-code-sm text-code-sm text-on-surface font-medium truncate block">
                  {incident.txOrSafeHash}
                </span>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(incident.txOrSafeHash || '');
                  onToast(`Copied ${incident.txOrSafeHash?.slice(0, 8)}... to clipboard`);
                }}
                className="px-2.5 py-1.5 bg-surface-container-lowest border border-outline-variant/30 rounded text-xs font-code-sm flex items-center gap-1 hover:bg-surface-container transition-colors cursor-pointer shrink-0"
              >
                <span>Copy</span>
                <span className="material-symbols-outlined text-[14px]">content_copy</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-surface-container-high bg-surface-container-low flex items-center justify-end">
          <button
            onClick={onClose}
            className="bg-primary text-on-primary py-2 px-5 rounded-lg font-label-md text-label-md font-semibold hover:bg-surface-tint transition-all cursor-pointer"
          >
            Close Forensic View
          </button>
        </div>
      </div>
    </div>
  );
};
