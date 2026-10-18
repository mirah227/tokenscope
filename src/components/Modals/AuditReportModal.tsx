import React, { useState, useEffect } from 'react';
import { TokenAsset } from '../../types/tokenscope';
import { checkSolanaRpcHealth, SolanaClusterStatus } from '../../services/solanaRpc';
import { generateTelemetryReportPdf } from '../../services/telemetryReportPdf';

interface AuditReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  auditId?: string;
  tokenSymbol?: string;
  token?: TokenAsset | null;
  onToast: (msg: string) => void;
}

export const AuditReportModal: React.FC<AuditReportModalProps> = ({
  isOpen,
  onClose,
  auditId = 'TS-TEL-2025-01',
  tokenSymbol = '$DRIFT',
  token = null,
  onToast
}) => {
  const [solanaHealth, setSolanaHealth] = useState<SolanaClusterStatus | null>(null);
  const [loadingRpc, setLoadingRpc] = useState(false);
  const [retrievalTime, setRetrievalTime] = useState<string>('');

  useEffect(() => {
    if (!isOpen) return;

    setRetrievalTime(new Date().toUTCString());
    setLoadingRpc(true);

    const controller = new AbortController();
    checkSolanaRpcHealth(controller.signal)
      .then((status) => {
        setSolanaHealth(status);
      })
      .catch(() => {
        setSolanaHealth({
          slot: 0,
          latencyMs: 0,
          status: 'offline',
          endpoint: 'https://api.mainnet-beta.solana.com',
          timestamp: Date.now()
        });
      })
      .finally(() => {
        setLoadingRpc(false);
      });

    return () => {
      controller.abort();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const cleanSymbol = (token?.symbol || tokenSymbol || '').replace('$', '').toUpperCase();
  const tokenName = token?.name || `${cleanSymbol} Protocol`;
  const mintAddress = token?.contractAddress || null;
  const poolAddress = token?.pairAddress || null;
  const dexId = token?.dexId || (token?.isLiveApi ? 'DEX Pool' : null);
  const priceDisplay = token?.price !== undefined && token?.price !== null ? token.price.toString() : null;
  const volumeDisplay = token?.volume24h || null;
  const liquidityDisplay = token?.liquidity || null;
  const marketCapDisplay = token?.marketCap || null;
  const priceChangeDisplay = token?.change24h !== undefined && token?.change24h !== null ? token.change24h : null;

  const handleDownloadPdf = () => {
    try {
      const doc = generateTelemetryReportPdf({
        reportId: auditId.startsWith('TS-') ? auditId : `TS-TEL-${cleanSymbol}-${Date.now().toString(36).toUpperCase()}`,
        tokenSymbol: cleanSymbol,
        tokenName,
        mintAddress,
        poolAddress,
        dexId,
        quoteSymbol: token?.quoteTokenSymbol || 'SOL',
        pairUrl: token?.dexUrl || null,
        priceUsd: priceDisplay,
        liquidityUsd: liquidityDisplay,
        volume24h: volumeDisplay,
        marketCap: marketCapDisplay,
        priceChange24h: priceChangeDisplay,
        solanaSlot: solanaHealth?.slot && solanaHealth.slot > 0 ? solanaHealth.slot : null,
        solanaRpcEndpoint: solanaHealth?.endpoint || 'https://api.mainnet-beta.solana.com',
        solanaLatencyMs: solanaHealth?.latencyMs ?? null,
        retrievalTimestamp: retrievalTime || new Date().toUTCString()
      });

      const filename = `TokenScope-Telemetry-${cleanSymbol}.pdf`;
      doc.save(filename);
      onToast(`Downloaded ${filename}`);
      onClose();
    } catch {
      onToast('Error generating PDF report');
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      onToast(`Copied ${label} to clipboard`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-surface-container-lowest rounded-2xl w-full max-w-lg shadow-2xl border border-outline-variant/30 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-surface-container-high flex items-center justify-between bg-surface-container-low">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary-container flex items-center justify-center text-on-primary-container">
              <span className="material-symbols-outlined text-[18px]">query_stats</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                  TokenScope On-Chain Telemetry Report
                </h3>
              </div>
              <p className="font-code-sm text-code-sm text-on-surface-variant">
                Snapshot: {cleanSymbol} · Automated Diagnostic Telemetry
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
            aria-label="Close"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 overflow-y-auto space-y-4 font-body-md text-on-surface">
          {/* Target Asset Overview */}
          <div className="bg-surface-container-low p-3.5 rounded-xl border border-outline-variant/20 flex items-center justify-between">
            <div className="min-w-0 pr-2">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider block">
                Target Token
              </span>
              <span className="font-headline-sm text-headline-sm font-semibold truncate block">
                {tokenName} (${cleanSymbol})
              </span>
              <span className="font-code-sm text-code-sm text-on-surface-variant block mt-0.5 truncate">
                {mintAddress ? mintAddress : 'Mint Address: Unavailable'}
              </span>
            </div>
            <div className="text-right shrink-0">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider block">
                Audit Status
              </span>
              <span className="font-code-sm text-xs px-2 py-0.5 rounded bg-amber-500/15 text-amber-600 font-bold inline-block mt-0.5 border border-amber-500/30">
                UNVERIFIED
              </span>
            </div>
          </div>

          {/* On-Chain Addresses (Accurately Labelled, Not Auditor Signatures) */}
          <div className="space-y-2">
            <h4 className="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant flex items-center justify-between">
              <span>On-Chain Identifiers</span>
              <span className="text-[11px] font-normal normal-case text-on-surface-variant">
                Cryptographic Keys (Not Signatures)
              </span>
            </h4>

            {/* Token Mint Address */}
            <div className="p-2.5 bg-surface-container-low rounded-lg border border-outline-variant/15 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <span className="font-code-sm text-[11px] text-on-surface-variant uppercase tracking-wider block">
                  Solana Token Mint Address
                </span>
                <span className="font-code-sm text-xs text-on-surface font-medium truncate block">
                  {mintAddress || 'Unavailable'}
                </span>
              </div>
              {mintAddress && (
                <button
                  onClick={() => copyToClipboard(mintAddress, 'Token Mint Address')}
                  className="px-2 py-1 bg-surface-container rounded hover:bg-surface-container-high transition-colors text-xs font-code-sm flex items-center gap-1 cursor-pointer shrink-0"
                  title="Copy Mint Address"
                >
                  <span>Copy</span>
                  <span className="material-symbols-outlined text-[13px]">content_copy</span>
                </button>
              )}
            </div>

            {/* Primary DEX Liquidity Pool Address */}
            <div className="p-2.5 bg-surface-container-low rounded-lg border border-outline-variant/15 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <span className="font-code-sm text-[11px] text-on-surface-variant uppercase tracking-wider block">
                  DEX Liquidity Pool Address ({dexId || 'Primary Pool'})
                </span>
                <span className="font-code-sm text-xs text-on-surface font-medium truncate block">
                  {poolAddress || 'Unavailable'}
                </span>
              </div>
              {poolAddress && (
                <button
                  onClick={() => copyToClipboard(poolAddress, 'Pool Address')}
                  className="px-2 py-1 bg-surface-container rounded hover:bg-surface-container-high transition-colors text-xs font-code-sm flex items-center gap-1 cursor-pointer shrink-0"
                  title="Copy Pool Address"
                >
                  <span>Copy</span>
                  <span className="material-symbols-outlined text-[13px]">content_copy</span>
                </button>
              )}
            </div>

            {/* Live Solana Cluster Slot */}
            <div className="p-2.5 bg-surface-container-low rounded-lg border border-outline-variant/15 flex items-center justify-between">
              <div>
                <span className="font-code-sm text-[11px] text-on-surface-variant uppercase tracking-wider block">
                  Solana Mainnet Slot (Live RPC)
                </span>
                <span className="font-code-sm text-xs text-on-surface font-medium">
                  {loadingRpc ? (
                    <span className="text-on-surface-variant">Querying api.mainnet-beta.solana.com...</span>
                  ) : solanaHealth && solanaHealth.slot > 0 ? (
                    `${solanaHealth.slot.toLocaleString()} (Latency: ${solanaHealth.latencyMs}ms)`
                  ) : (
                    'Unavailable'
                  )}
                </span>
              </div>
              <span className="font-code-sm text-[11px] px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant">
                Mainnet-Beta
              </span>
            </div>
          </div>

          {/* Retrieved Evidence: Market Telemetry (Source URLs & Timestamps) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
                Retrieved Market Evidence
              </h4>
              <span className="font-code-sm text-[11px] text-secondary font-medium">
                DEX Screener Public API
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-surface-container-low p-2 rounded-lg border border-outline-variant/15">
                <span className="text-on-surface-variant block text-[11px]">USD Price</span>
                <span className="font-code-sm font-bold text-on-surface">
                  {priceDisplay ? `$${priceDisplay}` : 'Unavailable'}
                </span>
              </div>

              <div className="bg-surface-container-low p-2 rounded-lg border border-outline-variant/15">
                <span className="text-on-surface-variant block text-[11px]">24h Volume</span>
                <span className="font-code-sm font-bold text-on-surface">
                  {volumeDisplay || 'Unavailable'}
                </span>
              </div>

              <div className="bg-surface-container-low p-2 rounded-lg border border-outline-variant/15">
                <span className="text-on-surface-variant block text-[11px]">Liquidity</span>
                <span className="font-code-sm font-bold text-on-surface">
                  {liquidityDisplay || 'Unavailable'}
                </span>
              </div>

              <div className="bg-surface-container-low p-2 rounded-lg border border-outline-variant/15">
                <span className="text-on-surface-variant block text-[11px]">Market Cap / FDV</span>
                <span className="font-code-sm font-bold text-on-surface">
                  {marketCapDisplay || 'Unavailable'}
                </span>
              </div>
            </div>

            <p className="font-code-sm text-[11px] text-on-surface-variant">
              Source: <span className="underline">https://api.dexscreener.com</span> · Retrieved: {retrievalTime || 'Unavailable'}
            </p>
          </div>

          {/* Third-Party Security Audit Status: Unverified */}
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-1">
            <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-semibold text-xs">
              <span className="material-symbols-outlined text-[16px]">info</span>
              <span>Third-Party Audit Status: Unverified</span>
            </div>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              No genuine, attributable public security audit record has been verified for this token. TokenScope displays third-party audit status as Unverified unless backed by independent attributable proof.
            </p>
          </div>

          {/* Checks Not Performed or Unavailable */}
          <div className="space-y-1.5">
            <h4 className="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
              Checks Not Performed or Unavailable
            </h4>
            <div className="bg-surface-container-low p-3 rounded-xl border border-outline-variant/15 space-y-1 text-xs text-on-surface-variant">
              <div className="flex items-center justify-between py-0.5 border-b border-outline-variant/10">
                <span>Independent Smart Contract Audit</span>
                <span className="font-code-sm text-[11px] text-error font-medium">Not Performed</span>
              </div>
              <div className="flex items-center justify-between py-0.5 border-b border-outline-variant/10">
                <span>Formal Invariant & Math Verification</span>
                <span className="font-code-sm text-[11px] text-error font-medium">Not Performed</span>
              </div>
              <div className="flex items-center justify-between py-0.5 border-b border-outline-variant/10">
                <span>Program Upgrade Authority Signers</span>
                <span className="font-code-sm text-[11px] text-on-surface-variant font-medium">Unavailable</span>
              </div>
              <div className="flex items-center justify-between py-0.5 border-b border-outline-variant/10">
                <span>Complete Wallet Distribution / Sybils</span>
                <span className="font-code-sm text-[11px] text-on-surface-variant font-medium">Unavailable</span>
              </div>
              <div className="flex items-center justify-between py-0.5">
                <span>Economic Exploit Simulation</span>
                <span className="font-code-sm text-[11px] text-error font-medium">Not Performed</span>
              </div>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="p-2.5 bg-surface-container rounded-lg text-[11px] text-on-surface-variant leading-normal">
            <span className="font-bold text-on-surface">Disclaimer: </span>
            This automated telemetry report is compiled strictly from public API sources for informational purposes. This report is NOT an independent security audit and cannot establish that a token is safe or free of vulnerabilities.
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-surface-container-high bg-surface-container-low flex items-center gap-2">
          <button
            onClick={handleDownloadPdf}
            className="flex-1 bg-primary text-on-primary py-2.5 px-4 rounded-lg font-label-md text-label-md font-semibold hover:bg-surface-tint transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>Download Telemetry Report (PDF)</span>
            <span className="material-symbols-outlined text-[16px]">download</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-lg border border-outline-variant text-on-surface font-label-md text-label-md hover:bg-surface-container transition-colors cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};

export const TelemetryReportModal = AuditReportModal;
