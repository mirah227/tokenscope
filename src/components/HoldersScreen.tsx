import React, { useState } from 'react';
import { HolderItem } from '../types/tokenscope';

interface HoldersScreenProps {
  holders: HolderItem[];
  onToast: (msg: string) => void;
}

export const HoldersScreen: React.FC<HoldersScreenProps> = ({ holders, onToast }) => {
  const [filterType, setFilterType] = useState<string>('all');

  const filteredHolders = holders.filter(h => {
    if (filterType === 'all') return true;
    return h.type.toLowerCase() === filterType.toLowerCase();
  });

  const totalWhaleConcentration = holders
    .filter(h => h.type === 'Whale' || h.type === 'Team')
    .reduce((acc, curr) => acc + curr.percentage, 0);

  return (
    <div className="flex flex-col w-full pb-8 max-w-4xl mx-auto">
      {/* Top Hero Context */}
      <div className="px-margin pt-space-md pb-space-sm flex flex-col gap-space-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-space-xs">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-secondary-container text-on-secondary-container">
              <span className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                pie_chart
              </span>
            </span>
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold">
              Supply Distribution
            </span>
          </div>
          <div className="flex items-center gap-1.5 bg-surface-container px-2.5 py-1 rounded-full shadow-sm">
            <span className="w-2 h-2 rounded-full bg-secondary"></span>
            <span className="font-code-sm text-code-sm text-on-surface-variant font-medium">
              Whale Alert Engine
            </span>
          </div>
        </div>
        <h1 className="font-headline-xl-mobile text-headline-xl-mobile text-on-surface font-semibold tracking-tight">
          Holder Intelligence
        </h1>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          Cluster analysis of major wallets, Squads multisig vaults, DEX liquidity, and insider dump risks.
        </p>
      </div>

      {/* Summary KPI Cards */}
      <div className="px-margin py-space-sm">
        <div className="grid grid-cols-3 gap-2 bg-surface-container-low p-2 rounded-xl shadow-sm">
          <div className="bg-surface-container-lowest p-space-sm rounded-lg flex flex-col justify-between shadow-sm">
            <span className="font-label-sm text-label-sm uppercase tracking-wide text-on-surface-variant">
              Top 10 Conc
            </span>
            <div>
              <span className="font-headline-lg text-headline-lg text-on-surface font-semibold">
                84.6%
              </span>
              <span className="font-code-sm text-code-sm text-secondary block mt-0.5 font-medium">
                Distributed
              </span>
            </div>
          </div>

          <div className="bg-surface-container-lowest p-space-sm rounded-lg flex flex-col justify-between shadow-sm">
            <span className="font-label-sm text-label-sm uppercase tracking-wide text-on-surface-variant">
              Multisig Safe
            </span>
            <div>
              <span className="font-headline-lg text-headline-lg text-secondary font-semibold">
                34.5%
              </span>
              <span className="font-code-sm text-code-sm text-on-surface-variant block mt-0.5">
                Squads v3 Locked
              </span>
            </div>
          </div>

          <div className="bg-surface-container-lowest p-space-sm rounded-lg flex flex-col justify-between shadow-sm">
            <span className="font-label-sm text-label-sm uppercase tracking-wide text-on-surface-variant">
              Insider Risk
            </span>
            <div>
              <span className="font-headline-lg text-headline-lg text-on-surface font-semibold">
                {totalWhaleConcentration.toFixed(1)}%
              </span>
              <span className="font-code-sm text-code-sm text-secondary block mt-0.5 font-medium">
                Low Deviation
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Supply Distribution Bar */}
      <div className="px-margin py-space-xs">
        <div className="bg-surface-container-lowest p-3.5 rounded-xl border border-outline-variant/15 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span>Supply Breakdown by Category</span>
            <span className="text-secondary font-code-sm">1,000,000,000 Total Supply</span>
          </div>
          {/* Multi-segment progress bar */}
          <div className="h-3.5 w-full bg-surface-container rounded-full overflow-hidden flex">
            <div style={{ width: '34.5%' }} className="bg-secondary" title="Multisig: 34.5%"></div>
            <div style={{ width: '18.2%' }} className="bg-primary" title="DEX Pool: 18.2%"></div>
            <div style={{ width: '20.4%' }} className="bg-surface-tint" title="Exchanges: 20.4%"></div>
            <div style={{ width: '11.5%' }} className="bg-[#d97706]" title="Whales: 11.5%"></div>
            <div style={{ width: '15.4%' }} className="bg-outline-variant" title="Retail & Community"></div>
          </div>
          <div className="flex items-center gap-3 text-[11px] font-code-sm text-on-surface-variant flex-wrap pt-1">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-secondary"></span> Multisig Safe (34.5%)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-primary"></span> DEX Liquidity (18.2%)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-surface-tint"></span> Exchanges (20.4%)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#d97706]"></span> Whales / Devs (11.5%)
            </span>
          </div>
        </div>
      </div>

      {/* Holder Filter Tabs */}
      <div className="px-margin pt-space-xs pb-space-sm">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {['all', 'multisig', 'dex pool', 'exchange', 'whale', 'team'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1.5 rounded-lg font-label-md text-label-md whitespace-nowrap shadow-sm capitalize transition-all cursor-pointer ${
                filterType === type
                  ? 'bg-primary text-on-primary font-semibold'
                  : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {type === 'all' ? 'All Top Holders' : type}
            </button>
          ))}
        </div>
      </div>

      {/* Holders List */}
      <div className="px-margin flex flex-col gap-space-sm">
        {filteredHolders.map((holder, idx) => {
          return (
            <div
              key={idx}
              className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm border border-outline-variant/15 flex flex-col gap-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-surface-container flex items-center justify-center text-xs font-bold font-code-sm text-on-surface shrink-0">
                      #{idx + 1}
                    </span>
                    <span className="font-headline-sm text-headline-sm font-semibold truncate">
                      {holder.label}
                    </span>
                  </div>
                  <span className="font-code-sm text-code-sm text-on-surface-variant truncate block mt-0.5">
                    {holder.address}
                  </span>
                </div>

                <div className="text-right shrink-0">
                  <span className="font-headline-sm text-headline-sm font-bold text-on-surface">
                    {holder.percentage}%
                  </span>
                  <span className="font-code-sm text-code-sm text-on-surface-variant block">
                    {holder.usdValue}
                  </span>
                </div>
              </div>

              <div className="p-2 bg-surface-container-low rounded-lg flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded font-label-sm font-semibold uppercase text-[10px] ${
                    holder.riskLevel === 'safe'
                      ? 'bg-secondary-container text-secondary'
                      : holder.riskLevel === 'warning'
                      ? 'bg-[#fef3c7] text-[#92400e]'
                      : 'bg-error-container text-error'
                  }`}>
                    {holder.type}
                  </span>
                  <span className="text-on-surface-variant font-code-sm">
                    24h: {holder.transfer24h || '0 SOL'}
                  </span>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(holder.address);
                    onToast('Address copied to clipboard');
                  }}
                  className="px-2 py-0.5 bg-surface-container rounded hover:bg-surface-container-high transition-colors font-code-sm flex items-center gap-1 cursor-pointer"
                >
                  <span>Copy</span>
                  <span className="material-symbols-outlined text-[12px]">content_copy</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
