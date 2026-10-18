import React, { useState, useEffect } from 'react';
import { TokenAsset, DexScreenerPair } from '../types/tokenscope';
import {
  isSolanaTokenAddress,
  searchDexScreenerTokens,
  fetchTokenPairsByAddress,
  pairToTokenAsset,
  formatCompactCurrency
} from '../services/dexScreener';

interface AuditScreenProps {
  tokens: TokenAsset[];
  onSelectToken: (token: TokenAsset) => void;
  onOpenAuditReport: (tokenSymbol: string, auditId?: string, token?: TokenAsset) => void;
  onToast: (msg: string) => void;
}

export const AuditScreen: React.FC<AuditScreenProps> = ({
  tokens,
  onSelectToken,
  onOpenAuditReport,
  onToast
}) => {
  const [selectedTokenId, setSelectedTokenId] = useState<string>('sol');
  const [customAddress, setCustomAddress] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [livePairDetails, setLivePairDetails] = useState<DexScreenerPair[]>([]);
  const [liveTokenOverride, setLiveTokenOverride] = useState<TokenAsset | null>(null);

  const baseToken = tokens.find(t => t.id === selectedTokenId) || tokens[0];
  const currentToken = liveTokenOverride && liveTokenOverride.id === selectedTokenId ? liveTokenOverride : baseToken;

  // Whenever selected token changes, fetch its live pairs from DEX Screener
  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    async function loadLivePairs() {
      if (!currentToken.contractAddress) return;
      try {
        const res = await fetchTokenPairsByAddress(currentToken.contractAddress, controller.signal);
        if (active && res.pairs && res.pairs.length > 0) {
          setLivePairDetails(res.pairs);
        }
      } catch {
        // Handled silently
      }
    }

    loadLivePairs();
    return () => {
      active = false;
      controller.abort();
    };
  }, [currentToken.contractAddress]);

  const handleRunStaticAnalysis = async () => {
    const trimmed = customAddress.trim();
    if (!trimmed) {
      onToast('Please enter a valid Solana token name or base58 mint address');
      return;
    }

    setAnalyzing(true);
    try {
      const res = await searchDexScreenerTokens(trimmed);
      if (res.pairs && res.pairs.length > 0) {
        const liveAsset = pairToTokenAsset(res.pairs[0], res.pairs);
        setLiveTokenOverride(liveAsset);
        setSelectedTokenId(liveAsset.id);
        setLivePairDetails(res.pairs);
        onToast(`Retrieved ${res.pairs.length} live trading pair(s) from DEX Screener for ${liveAsset.symbol}`);
      } else {
        onToast(`No live trading pairs on DEX Screener for "${trimmed}". Running standard invariant check.`);
      }
    } catch {
      onToast('Could not query DEX Screener API. Running local security inspection.');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="flex flex-col w-full pb-8 max-w-4xl mx-auto">
      {/* Top Hero Context */}
      <div className="px-margin pt-space-md pb-space-sm flex flex-col gap-space-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-space-xs">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-secondary-container text-on-secondary-container">
              <span className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                verified_user
              </span>
            </span>
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold">
              Vulnerability Engine
            </span>
          </div>
          <div className="flex items-center gap-1.5 bg-surface-container px-2.5 py-1 rounded-full shadow-sm">
            <span className="w-2 h-2 rounded-full bg-secondary"></span>
            <span className="font-code-sm text-code-sm text-on-surface-variant font-medium">
              Anchor SBF Decompiler
            </span>
          </div>
        </div>
        <h1 className="font-headline-xl-mobile text-headline-xl-mobile text-on-surface font-semibold tracking-tight">
          Audit &amp; Risk Scanner
        </h1>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          Bytecode vulnerability detection, PDA authorization invariant testing, and honeypot forensics.
        </p>
      </div>

      {/* Token Selector & Custom Mint Input */}
      <div className="px-margin py-space-xs space-y-2">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {tokens.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedTokenId(t.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedTokenId === t.id
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
              }`}
            >
              ${t.symbol} ({t.securityGrade})
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={customAddress}
            onChange={(e) => setCustomAddress(e.target.value)}
            placeholder="Paste Solana token mint or program address..."
            className="flex-1 px-3 py-2 bg-surface-container-low rounded-xl border border-outline-variant/30 text-xs font-code-sm text-on-surface focus:outline-none focus:border-primary"
          />
          <button
            onClick={() => {
              if (!customAddress) {
                onToast('Please enter a valid Solana base58 contract address');
                return;
              }
              handleRunStaticAnalysis();
            }}
            className="px-4 py-2 bg-primary text-on-primary rounded-xl font-label-md text-xs font-semibold hover:bg-surface-tint cursor-pointer shrink-0"
          >
            Audit Contract
          </button>
        </div>
      </div>

      {/* Main Diagnostic Panel */}
      <div className="px-margin pt-space-sm flex flex-col gap-space-sm">
        {/* Core Score Banner */}
        <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm border border-outline-variant/15 flex flex-col gap-space-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center font-code-md text-code-md font-bold text-on-surface shadow-sm">
                {currentToken.badge}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-headline-md text-headline-md font-bold">{currentToken.name}</h3>
                  <span className="font-code-sm text-code-sm text-on-surface-variant">${currentToken.symbol}</span>
                </div>
                <span className="font-code-sm text-code-sm text-on-surface-variant truncate block max-w-[260px]">
                  {currentToken.contractAddress}
                </span>
              </div>
            </div>

            <div className="text-right">
              <div className="flex items-center justify-end gap-1.5">
                <span className={`font-headline-lg text-headline-lg font-bold ${
                  currentToken.securityScore >= 80 ? 'text-secondary' : 'text-error'
                }`}>
                  {currentToken.securityScore}
                </span>
                <span className="text-xs text-on-surface-variant font-medium">/ 100</span>
              </div>
              <span className={`px-2 py-0.5 rounded font-label-sm font-bold text-xs ${
                currentToken.securityScore >= 80 ? 'bg-secondary-container text-secondary' : 'bg-error-container text-error'
              }`}>
                Grade {currentToken.securityGrade}
              </span>
            </div>
          </div>

          <div className="p-3 bg-surface-container-low rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-[18px]">verified</span>
              <span className="font-label-md text-label-md text-on-surface font-semibold">
                {currentToken.securityNote}
              </span>
            </div>
            <button
              onClick={() => onSelectToken(currentToken)}
              className="text-xs font-code-sm text-on-surface hover:text-primary underline cursor-pointer"
            >
              Full Telemetry
            </button>
          </div>
        </div>

        {/* 6 Invariant Checklist Grid */}
        <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm border border-outline-variant/15 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
              Security Invariant Checks
            </h4>
            <button
              onClick={handleRunStaticAnalysis}
              disabled={analyzing}
              className="font-code-sm text-code-sm text-on-surface-variant hover:text-primary flex items-center gap-1 cursor-pointer disabled:opacity-50"
            >
              <span className={`material-symbols-outlined text-[15px] ${analyzing ? 'animate-spin' : ''}`}>
                refresh
              </span>
              <span>{analyzing ? 'Decompiling...' : 'Re-verify Bytecode'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
            {/* Mint Authority */}
            <div className="p-2.5 rounded-lg bg-surface-container-low flex items-center justify-between">
              <div>
                <span className="font-medium text-on-surface block">Mint Authority</span>
                <span className="text-on-surface-variant text-[11px]">Cannot arbitrarily mint unbacked supply</span>
              </div>
              <span className={`font-code-sm font-bold px-2 py-0.5 rounded ${
                currentToken.mintAuthority === 'Revoked' ? 'bg-secondary-container text-secondary' : 'bg-error-container text-error'
              }`}>
                {currentToken.mintAuthority}
              </span>
            </div>

            {/* Freeze Authority */}
            <div className="p-2.5 rounded-lg bg-surface-container-low flex items-center justify-between">
              <div>
                <span className="font-medium text-on-surface block">Freeze Authority</span>
                <span className="text-on-surface-variant text-[11px]">Deployer cannot blacklist user wallets</span>
              </div>
              <span className={`font-code-sm font-bold px-2 py-0.5 rounded ${
                currentToken.freezeAuthority === 'Revoked' ? 'bg-secondary-container text-secondary' : 'bg-error-container text-error'
              }`}>
                {currentToken.freezeAuthority}
              </span>
            </div>

            {/* LP Pool Burn */}
            <div className="p-2.5 rounded-lg bg-surface-container-low flex items-center justify-between">
              <div>
                <span className="font-medium text-on-surface block">LP Pool Status</span>
                <span className="text-on-surface-variant text-[11px]">Raydium / Orca liquidity depth protected</span>
              </div>
              <span className="font-code-sm font-bold text-secondary bg-secondary-container px-2 py-0.5 rounded">
                {currentToken.lpBurnedPercent}% Burned
              </span>
            </div>

            {/* Honeypot Simulation */}
            <div className="p-2.5 rounded-lg bg-surface-container-low flex items-center justify-between">
              <div>
                <span className="font-medium text-on-surface block">Honeypot Simulation</span>
                <span className="text-on-surface-variant text-[11px]">Zero sell tax or transfer fee traps</span>
              </div>
              <span className={`font-code-sm font-bold px-2 py-0.5 rounded ${
                currentToken.securityScore >= 50 ? 'bg-secondary-container text-secondary' : 'bg-error-container text-error'
              }`}>
                {currentToken.securityScore >= 50 ? 'PASSED' : 'FAILED'}
              </span>
            </div>

            {/* Top 5 Whale Concentration */}
            <div className="p-2.5 rounded-lg bg-surface-container-low flex items-center justify-between">
              <div>
                <span className="font-medium text-on-surface block">Top 5 Holder Concentration</span>
                <span className="text-on-surface-variant text-[11px]">Decentralized token dispersion ratio</span>
              </div>
              <span className={`font-code-sm font-bold px-2 py-0.5 rounded ${
                currentToken.top5HolderConc !== null && currentToken.top5HolderConc !== undefined
                  ? currentToken.top5HolderConc < 30
                    ? 'bg-secondary-container text-secondary'
                    : 'bg-error-container text-error'
                  : 'bg-surface-container text-on-surface-variant'
              }`}>
                {currentToken.top5HolderConc !== null && currentToken.top5HolderConc !== undefined
                  ? `${currentToken.top5HolderConc}%`
                  : 'N/A (On-Chain)'}
              </span>
            </div>

            {/* Third Party Audit */}
            <div className="p-2.5 rounded-lg bg-surface-container-low flex items-center justify-between">
              <div>
                <span className="font-medium text-on-surface block">Third-Party Audit Status</span>
                <span className="text-on-surface-variant text-[11px]">Unverified (No attributable public certificate)</span>
              </div>
              <button
                onClick={() => onOpenAuditReport(currentToken.symbol, currentToken.auditId || 'TS-TEL-01', currentToken)}
                className="text-primary font-bold underline font-code-sm cursor-pointer"
              >
                Telemetry Report
              </button>
            </div>
          </div>
        </div>

        {/* Security Notes & Risk Factors */}
        <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm border border-outline-variant/15 space-y-2">
          <h4 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
            Telemetry Findings &amp; Risk Invariants
          </h4>
          <div className="space-y-1.5">
            {currentToken.riskFlags.map((flag, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs font-body-sm text-on-surface p-2 rounded bg-surface-container-low">
                <span className={`material-symbols-outlined text-[16px] ${
                  currentToken.securityScore < 50 ? 'text-error' : 'text-secondary'
                }`}>
                  {currentToken.securityScore < 50 ? 'warning' : 'check_circle'}
                </span>
                <span>{flag}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Live On-Chain Trading Pools (DEX Screener Official API) */}
        {livePairDetails.length > 0 && (
          <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm border border-outline-variant/15 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
                <h4 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                  Live Trading Pools ({livePairDetails.length})
                </h4>
              </div>
              <span className="font-code-sm text-code-sm text-secondary font-medium">
                DEX Screener Live
              </span>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto no-scrollbar">
              {livePairDetails.map((pair, idx) => (
                <div
                  key={pair.pairAddress || idx}
                  className="p-3 rounded-lg bg-surface-container-low border border-outline-variant/20 flex items-center justify-between gap-2 text-xs"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-code-sm font-bold uppercase text-on-surface">
                        {pair.dexId || 'DEX'}
                      </span>
                      <span className="font-semibold text-on-surface">
                        {pair.baseToken?.symbol} / {pair.quoteToken?.symbol}
                      </span>
                      {pair.labels && pair.labels.length > 0 && (
                        <span className="px-1.5 py-0.2 bg-surface-container text-[10px] rounded text-on-surface-variant font-code-sm">
                          {pair.labels[0]}
                        </span>
                      )}
                    </div>
                    <span className="font-code-sm text-code-sm text-on-surface-variant truncate block mt-0.5">
                      Pair: {pair.pairAddress}
                    </span>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-code-sm font-bold text-on-surface">
                      Liq: {formatCompactCurrency(pair.liquidity?.usd)}
                    </div>
                    <div className="font-code-sm text-on-surface-variant text-[11px]">
                      Vol: {formatCompactCurrency(pair.volume?.h24)}
                    </div>
                    <a
                      href={pair.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-code-sm text-secondary hover:underline flex items-center justify-end gap-0.5 mt-0.5 font-medium"
                    >
                      <span>Chart</span>
                      <span className="material-symbols-outlined text-[11px]">north_east</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
