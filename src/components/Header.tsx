import React, { useState, useEffect } from 'react';
import { checkSolanaRpcHealth } from '../services/solanaRpc';

interface HeaderProps {
  onOpenNotifications: () => void;
  onOpenProfile: () => void;
  unreadCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenNotifications,
  onOpenProfile,
  unreadCount = 3
}) => {
  const [tps, setTps] = useState(2840);
  const [slotNumber, setSlotNumber] = useState<number | null>(null);

  useEffect(() => {
    // 1. Fetch real Solana slot number from public RPC
    let active = true;
    async function updateSlot() {
      const status = await checkSolanaRpcHealth();
      if (active && status.slot > 0) {
        setSlotNumber(status.slot);
      }
    }
    updateSlot();
    const slotInterval = setInterval(updateSlot, 12000);

    // 2. Continuous TPS cadence
    const interval = setInterval(() => {
      const delta = Math.floor(Math.random() * 25) - 12;
      setTps(prev => Math.min(3100, Math.max(2650, prev + delta)));
    }, 3200);

    return () => {
      active = false;
      clearInterval(slotInterval);
      clearInterval(interval);
    };
  }, []);

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-surface/85 backdrop-blur-xl shadow-[0_1px_8px_rgba(11,28,48,0.04)] pt-safe">
      <div className="h-16 px-margin flex items-center justify-between gap-space-sm max-w-4xl mx-auto">
        <div className="flex items-center gap-space-sm min-w-0">
          <img
            alt="TokenScope Logo"
            className="h-8 w-auto object-contain flex-shrink-0"
            src="https://lh3.googleusercontent.com/aida/AEtjO1VurXp36ev7fMFePih2mXwhqpWjYu6k6qHYj5_Bux0sctEO2YrZJ9arrXz0WUsKs4TiL-le7wXbUxmRxRH4RHwEELrC1dvrttpBlaHAg-AK0ynSUfEj483S_-LUPsHC1LfH7jwW_Tx0GrdrHZqObIRBA8j_dK0bG_FP_mUI-yuZbhvLrSzx1XNps9iSjg-Va8NoPSCLWZ99zizh4G72J5xUM85hd_iH57sAzT4V-y2mtNgFvEiX414AGmQ"
            onError={(e) => {
              // Graceful fallback to styled SVG insignia if remote asset is blocked
              (e.currentTarget as HTMLElement).style.display = 'none';
              const fallback = document.getElementById('logo-fallback');
              if (fallback) fallback.style.display = 'flex';
            }}
          />
          <div
            id="logo-fallback"
            style={{ display: 'none' }}
            className="w-8 h-8 rounded-lg bg-primary text-on-primary items-center justify-center font-bold text-xs"
          >
            TS
          </div>

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-space-xs">
              <span className="font-headline-sm text-headline-sm text-on-surface tracking-tight truncate">
                TokenScope
              </span>
              <span className="font-code-sm text-code-sm px-space-xs py-0.5 rounded bg-surface-container-high text-on-surface-variant font-medium">
                SOL
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span>
              <span className="font-code-sm text-code-sm text-on-surface-variant truncate">
                {slotNumber ? `Slot #${slotNumber.toLocaleString()} · ${tps.toLocaleString()} TPS` : `Mainnet-Beta | ${tps.toLocaleString()} TPS`}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-space-xs flex-shrink-0">
          <button
            aria-label="Alerts"
            onClick={onOpenNotifications}
            className="w-11 h-11 flex items-center justify-center rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors relative cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">notifications</span>
            {unreadCount > 0 && (
              <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-error ring-2 ring-surface"></span>
            )}
          </button>
          <button
            aria-label="User Account"
            onClick={onOpenProfile}
            className="w-8 h-8 rounded-full bg-primary flex items-center justify-center cursor-pointer hover:bg-surface-tint transition-colors"
          >
            <span className="material-symbols-outlined text-on-primary text-[18px]">person</span>
          </button>
        </div>
      </div>
    </header>
  );
};
