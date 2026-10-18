import React, { useState, useEffect } from 'react';
import { checkSolanaRpcHealth, SolanaClusterStatus } from '../../services/solanaRpc';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onToast: (msg: string) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, onToast }) => {
  const [isChecking, setIsChecking] = useState(false);
  const [rpcStatus, setRpcStatus] = useState<SolanaClusterStatus | null>(null);

  useEffect(() => {
    if (isOpen && !rpcStatus) {
      runCheck();
    }
  }, [isOpen]);

  const runCheck = async () => {
    setIsChecking(true);
    try {
      const status = await checkSolanaRpcHealth();
      setRpcStatus(status);
      onToast(`Solana RPC verified: Slot #${status.slot.toLocaleString()} (${status.latencyMs}ms latency)`);
    } catch {
      onToast('RPC cluster health check timed out');
    } finally {
      setIsChecking(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-surface-container-lowest rounded-2xl w-full max-w-lg shadow-2xl border border-outline-variant/30 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-surface-container-high flex items-center justify-between bg-surface-container-low">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-on-primary">
              <span className="material-symbols-outlined text-[18px]">security</span>
            </div>
            <div>
              <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                Sec-Ops Terminal Console
              </h3>
              <p className="font-code-sm text-code-sm text-on-surface-variant">
                Live Public Solana Cluster &amp; RPC Telemetry
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

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 font-body-md text-on-surface">
          <div className="bg-surface-container-low p-3.5 rounded-xl border border-outline-variant/20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary text-on-primary flex items-center justify-center font-bold">
                TS
              </div>
              <div>
                <span className="font-headline-sm text-headline-sm font-semibold block">Solana Mainnet Cluster</span>
                <span className="font-code-sm text-code-sm text-secondary font-medium">
                  {rpcStatus ? `${rpcStatus.endpoint}` : 'Connecting...'}
                </span>
              </div>
            </div>
            <span className="font-code-sm text-code-sm px-2 py-0.5 rounded bg-secondary-container text-secondary font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span>
              <span>ONLINE</span>
            </span>
          </div>

          <div className="space-y-2 font-body-sm text-body-sm">
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface-container-low">
              <span className="text-on-surface-variant">Live Slot Height</span>
              <span className="font-code-sm font-semibold text-on-surface">
                {rpcStatus?.slot ? `#${rpcStatus.slot.toLocaleString()}` : 'Syncing...'}
              </span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface-container-low">
              <span className="text-on-surface-variant">Round-Trip RPC Latency</span>
              <span className="font-code-sm font-semibold text-secondary">
                {rpcStatus ? `${rpcStatus.latencyMs}ms` : 'Measuring...'}
              </span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface-container-low">
              <span className="text-on-surface-variant">DEX Screener Rate Limit</span>
              <span className="font-code-sm font-semibold">300 requests/min (Cached: 30s TTL)</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface-container-low">
              <span className="text-on-surface-variant">CORS Protocol</span>
              <span className="font-code-sm font-semibold text-secondary">Direct Client Fetch (Zero Proxy)</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-surface-container-high bg-surface-container-low flex items-center justify-between">
          <button
            onClick={runCheck}
            disabled={isChecking}
            className="text-xs font-label-md text-on-surface hover:text-primary transition-colors cursor-pointer flex items-center gap-1 disabled:opacity-50"
          >
            <span className={`material-symbols-outlined text-[15px] ${isChecking ? 'animate-spin' : ''}`}>
              refresh
            </span>
            <span>{isChecking ? 'Pinging Node...' : 'Ping Solana RPC Node'}</span>
          </button>
          <button
            onClick={onClose}
            className="bg-primary text-on-primary py-2 px-4 rounded-lg font-label-md text-label-md font-semibold hover:bg-surface-tint transition-all cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
