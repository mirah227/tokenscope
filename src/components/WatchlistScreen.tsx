import React, { useState, useEffect } from 'react';
import { TokenAsset, SecurityIncident, DispatchSettings } from '../types/tokenscope';

interface WatchlistScreenProps {
  tokens: TokenAsset[];
  incidents: SecurityIncident[];
  dispatchSettings: DispatchSettings;
  onUpdateDispatchSettings: (settings: DispatchSettings) => void;
  onToggleWatch: (token: TokenAsset) => void;
  onSelectToken: (token: TokenAsset) => void;
  onSelectIncident: (incident: SecurityIncident) => void;
  onOpenAuditReport: (tokenSymbol: string, auditId?: string, token?: TokenAsset) => void;
  onOpenDispatchModal: () => void;
  onToast: (msg: string) => void;
  onRefreshLiveTokens?: () => Promise<void>;
}

export const WatchlistScreen: React.FC<WatchlistScreenProps> = ({
  tokens,
  incidents,
  dispatchSettings,
  onUpdateDispatchSettings,
  onToggleWatch,
  onSelectToken,
  onSelectIncident,
  onOpenAuditReport,
  onOpenDispatchModal,
  onToast,
  onRefreshLiveTokens
}) => {
  const [activeFilterTab, setActiveFilterTab] = useState<'all' | 'triggers' | 'safe' | 'dex'>('all');
  const [isRescanning, setIsRescanning] = useState(false);
  const [autoSync, setAutoSync] = useState(false);

  const pinnedTokens = tokens.filter(t => t.pinned);

  // Auto-sync live DEX Screener prices every 30 seconds if enabled
  useEffect(() => {
    if (!autoSync || !onRefreshLiveTokens) return;
    const interval = setInterval(async () => {
      try {
        await onRefreshLiveTokens();
      } catch {
        // Handled silently
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [autoSync, onRefreshLiveTokens]);

  const filteredIncidents = incidents.filter(inc => {
    if (activeFilterTab === 'triggers') return inc.severity === 'CRITICAL' || inc.category === 'triggers';
    if (activeFilterTab === 'safe') return inc.severity === 'RESOLVED' || inc.category === 'safe';
    if (activeFilterTab === 'dex') return inc.category === 'dex';
    return true;
  });

  const handleCopyHash = (e: React.MouseEvent, hash: string) => {
    e.stopPropagation();
    navigator.clipboard?.writeText(hash);
    onToast(`Copied ${hash} to clipboard`);
  };

  const handleReScan = async () => {
    setIsRescanning(true);
    try {
      if (onRefreshLiveTokens) {
        await onRefreshLiveTokens();
      }
    } catch {
      // Handled gracefully
    } finally {
      setTimeout(() => {
        setIsRescanning(false);
        onToast('Risk feed & DEX Screener telemetry synchronized');
      }, 700);
    }
  };

  const handleToggleRelay = (service: string, key: keyof DispatchSettings, checked: boolean) => {
    onUpdateDispatchSettings({
      ...dispatchSettings,
      [key]: checked
    });
    onToast(`${service} relay ${checked ? 'enabled' : 'disabled'}`);
  };

  return (
    <div className="flex flex-col w-full pb-8 max-w-4xl mx-auto">
      {/* Top Hero Context & Live Pulse */}
      <div className="px-margin pt-space-md pb-space-sm flex flex-col gap-space-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-space-xs">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-secondary-container text-on-secondary-container">
              <span className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                shield_with_heart
              </span>
            </span>
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold">
              Security Perimeter
            </span>
          </div>
          <div className="flex items-center gap-1.5 bg-surface-container px-2.5 py-1 rounded-full shadow-sm">
            <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
            <span className="font-code-sm text-code-sm text-on-surface-variant font-medium">
              Solana Mempool Live
            </span>
          </div>
        </div>
        <h1 className="font-headline-xl-mobile text-headline-xl-mobile text-on-surface font-semibold tracking-tight">
          Security Watchlist
        </h1>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          Real-time threat detection &amp; smart-contract telemetry for pinned digital assets.
        </p>
      </div>

      {/* Key Metrics Row (Header Stats) */}
      <div className="px-margin py-space-sm">
        <div className="grid grid-cols-3 gap-2 bg-surface-container-low p-2 rounded-xl shadow-sm">
          {/* Stat 1 */}
          <div className="bg-surface-container-lowest p-space-sm rounded-lg flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <span className="font-label-sm text-label-sm uppercase tracking-wide text-on-surface-variant">
                Tracked
              </span>
              <span className="material-symbols-outlined text-on-surface-variant text-[16px]">
                bookmark
              </span>
            </div>
            <div>
              <span className="font-headline-lg text-headline-lg text-on-surface leading-none font-semibold">
                12
              </span>
              <span className="font-code-sm text-code-sm text-secondary block mt-0.5 font-medium">
                +2 this wk
              </span>
            </div>
          </div>

          {/* Stat 2 */}
          <div className="bg-surface-container-lowest p-space-sm rounded-lg flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <span className="font-label-sm text-label-sm uppercase tracking-wide text-tertiary-container font-semibold">
                Alerts
              </span>
              <span className="material-symbols-outlined text-error text-[16px]">
                crisis_alert
              </span>
            </div>
            <div>
              <span className="font-headline-lg text-headline-lg text-error leading-none font-semibold">
                3
              </span>
              <span className="font-code-sm text-code-sm text-on-surface-variant block mt-0.5">
                Active triggers
              </span>
            </div>
          </div>

          {/* Stat 3 */}
          <div className="bg-surface-container-lowest p-space-sm rounded-lg flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <span className="font-label-sm text-label-sm uppercase tracking-wide text-on-surface-variant">
                Breaches
              </span>
              <span className="material-symbols-outlined text-secondary text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                check_circle
              </span>
            </div>
            <div>
              <span className="font-headline-lg text-headline-lg text-on-surface leading-none font-semibold">
                0
              </span>
              <span className="font-code-sm text-code-sm text-secondary block mt-0.5 font-medium">
                Clean 24h
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Alert Filter Segmented Control */}
      <div className="px-margin pt-space-xs pb-space-sm">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar" id="filterTabContainer">
          <button
            className={`tab-btn px-3 py-1.5 rounded-lg font-label-md text-label-md whitespace-nowrap shadow-sm font-semibold transition-all cursor-pointer ${
              activeFilterTab === 'all'
                ? 'bg-primary text-on-primary'
                : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
            }`}
            onClick={() => {
              setActiveFilterTab('all');
              onToast('Filter applied: All Monitored (12)');
            }}
          >
            All Monitored (12)
          </button>
          <button
            className={`tab-btn px-3 py-1.5 rounded-lg font-label-md text-label-md whitespace-nowrap shadow-sm transition-all flex items-center gap-1 cursor-pointer ${
              activeFilterTab === 'triggers'
                ? 'bg-primary text-on-primary font-semibold'
                : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
            }`}
            onClick={() => {
              setActiveFilterTab('triggers');
              onToast('Filter applied: Security Triggers');
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-error"></span>
            Security Triggers
          </button>
          <button
            className={`tab-btn px-3 py-1.5 rounded-lg font-label-md text-label-md whitespace-nowrap shadow-sm transition-all cursor-pointer ${
              activeFilterTab === 'safe'
                ? 'bg-primary text-on-primary font-semibold'
                : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
            }`}
            onClick={() => {
              setActiveFilterTab('safe');
              onToast('Filter applied: High Yield & Safe');
            }}
          >
            High Yield &amp; Safe
          </button>
          <button
            className={`tab-btn px-3 py-1.5 rounded-lg font-label-md text-label-md whitespace-nowrap shadow-sm transition-all cursor-pointer ${
              activeFilterTab === 'dex'
                ? 'bg-primary text-on-primary font-semibold'
                : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
            }`}
            onClick={() => {
              setActiveFilterTab('dex');
              onToast('Filter applied: DEX Migrations');
            }}
          >
            DEX Migrations
          </button>
        </div>
      </div>

      {/* Section 1: Real-Time Incident Radar */}
      <div className="px-margin pt-space-sm pb-space-sm flex flex-col gap-space-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-space-xs">
            <span className="material-symbols-outlined text-primary text-[18px]">
              emergency_home
            </span>
            <h2 className="font-headline-sm text-headline-sm text-on-surface tracking-tight">
              Active Incident Feed
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const next = !autoSync;
                setAutoSync(next);
                onToast(`Auto-sync live DEX market data ${next ? 'enabled (30s interval)' : 'disabled'}`);
              }}
              className={`font-code-sm text-code-sm px-2 py-0.5 rounded flex items-center gap-1 transition-colors cursor-pointer ${
                autoSync
                  ? 'bg-secondary-container text-secondary font-bold shadow-xs'
                  : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
              }`}
              title="Automatically poll DEX Screener for pinned tokens every 30 seconds"
            >
              <span className={`w-1.5 h-1.5 rounded-full ${autoSync ? 'bg-secondary animate-ping' : 'bg-outline-variant'}`}></span>
              <span>Auto-Sync {autoSync ? '(30s)' : 'Off'}</span>
            </button>
            <button
              className="font-code-sm text-code-sm text-on-surface-variant flex items-center gap-1 hover:text-primary transition-colors cursor-pointer"
              onClick={handleReScan}
            >
              <span className={`material-symbols-outlined text-[15px] ${isRescanning ? 'animate-spin' : ''}`} id="refreshIcon">
                refresh
              </span>
              <span>Re-scan</span>
            </button>
          </div>
        </div>

        {/* Alert List Stack */}
        <div className="flex flex-col gap-space-sm" id="incidentsContainer">
          {filteredIncidents.map((incident) => {
            const isCritical = incident.severity === 'CRITICAL';
            const isWarning = incident.severity === 'WARNING';
            const isPass = incident.severity === 'RESOLVED';

            return (
              <div
                key={incident.id}
                onClick={() => onSelectIncident(incident)}
                className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col gap-space-xs relative overflow-hidden transition-all duration-200 cursor-pointer hover:shadow-md border border-outline-variant/10"
              >
                {/* Colored left edge bar */}
                <div
                  className="absolute left-0 top-0 bottom-0 w-1.5"
                  style={{ backgroundColor: incident.borderColor }}
                ></div>

                <div className="flex items-start justify-between gap-space-sm pl-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded font-label-sm text-label-sm uppercase font-semibold ${
                        isCritical
                          ? 'text-error bg-error-container'
                          : isWarning
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
                  <span
                    className="material-symbols-outlined text-[18px]"
                    style={{ color: incident.borderColor }}
                  >
                    {incident.icon}
                  </span>
                </div>

                <div className="pl-1 mt-0.5">
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                      {incident.tokenSymbol}
                    </span>
                    <span className="font-body-md text-body-md text-on-surface">
                      {incident.headline}
                    </span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                    {incident.description}
                  </p>
                </div>

                {/* Telemetry Inset */}
                <div className="pl-1 mt-1">
                  <div className="bg-surface-container p-space-sm rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="material-symbols-outlined text-[16px]"
                        style={{ color: incident.borderColor }}
                      >
                        {incident.telemetryIcon}
                      </span>
                      <span
                        className="font-code-sm text-code-sm truncate font-medium"
                        style={{ color: incident.borderColor }}
                      >
                        {incident.telemetryTag}
                      </span>
                    </div>

                    {incident.actionType === 'audit' ? (
                      <button
                        className="font-code-sm text-code-sm text-on-surface hover:text-primary bg-surface-container-lowest px-2 py-0.5 rounded shadow-sm flex items-center gap-1 font-medium cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenAuditReport(incident.tokenSymbol, incident.txOrSafeHash || 'TS-TEL-01');
                        }}
                      >
                        <span>{incident.actionText || 'View Report'}</span>
                        <span className="material-symbols-outlined text-[13px]">north_east</span>
                      </button>
                    ) : (
                      <button
                        className="font-code-sm text-code-sm text-on-surface-variant hover:text-on-surface bg-surface-container-lowest px-2 py-0.5 rounded shadow-sm flex items-center gap-1 cursor-pointer"
                        onClick={(e) => handleCopyHash(e, incident.txOrSafeHash || '')}
                      >
                        <span>{incident.actionText}</span>
                        <span className="material-symbols-outlined text-[13px]">content_copy</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 2: Monitored Asset Health Matrix */}
      <div className="px-margin pt-space-md pb-space-sm flex flex-col gap-space-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-space-xs">
            <span className="material-symbols-outlined text-primary text-[18px]">
              token
            </span>
            <h2 className="font-headline-sm text-headline-sm text-on-surface tracking-tight">
              Monitored Assets
            </h2>
          </div>
          <span className="font-code-sm text-code-sm text-on-surface-variant">
            {pinnedTokens.length} of {tokens.length} pinned
          </span>
        </div>

        {/* Pinned Tokens Grid */}
        <div className="flex flex-col gap-space-sm">
          {pinnedTokens.length === 0 ? (
            <div className="p-8 text-center bg-surface-container-lowest rounded-xl border border-outline-variant/15 shadow-sm">
              <span className="material-symbols-outlined text-4xl text-on-surface-variant">bookmark_border</span>
              <p className="mt-2 font-headline-sm text-on-surface font-semibold">No assets pinned to watchlist</p>
              <p className="text-xs text-on-surface-variant mt-1">Discover and pin live Solana tokens from the Discover tab.</p>
            </div>
          ) : (
            pinnedTokens.map((token) => {
              const isPositive = token.change24h >= 0;
              const isLive = token.isLiveApi === true;
              // Generate sparkline path points if available, or generate standard trend
              const points = token.sparklineData && token.sparklineData.length > 0
                ? token.sparklineData
                    .map((val, idx) => `${idx === 0 ? 'M' : 'L'} ${2 + idx * 12} ${val}`)
                    .join(' ')
                : isPositive
                ? 'M 2 18 L 16 14 L 30 19 L 44 9 L 54 11 L 62 4'
                : 'M 2 6 L 18 8 L 32 15 L 46 13 L 56 20 L 62 18';

              return (
                <div
                  key={token.id}
                  onClick={() => onSelectToken(token)}
                  className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col gap-space-sm border border-outline-variant/10 cursor-pointer hover:shadow-md transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-space-sm min-w-0">
                      {/* Token Visual Badge / Image */}
                      {token.imageUrl ? (
                        <img
                          src={token.imageUrl}
                          alt={token.name}
                          className="w-10 h-10 rounded-xl object-cover bg-surface-container shadow-sm shrink-0"
                          onError={(e) => {
                            (e.currentTarget as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center font-code-md text-code-md font-bold text-on-surface shadow-sm shrink-0">
                          {token.badge}
                        </div>
                      )}
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-headline-sm text-headline-sm text-on-surface font-semibold truncate">
                            {token.name}
                          </span>
                          <span className="font-code-sm text-code-sm text-on-surface-variant font-medium">
                            ${token.symbol}
                          </span>
                          {isLive ? (
                            <span className="px-1.5 py-0.2 rounded bg-secondary-container text-secondary font-code-sm font-bold text-[9px] shrink-0">
                              LIVE API
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.2 rounded bg-surface-container text-on-surface-variant font-code-sm text-[9px] shrink-0">
                              DEMO
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-label-sm text-label-sm text-on-surface-variant truncate">
                            {token.type}
                          </span>
                          <span className="w-1 h-1 rounded-full bg-outline-variant shrink-0"></span>
                          {token.top5HolderConc !== null && token.top5HolderConc !== undefined ? (
                            <span className="font-code-sm text-code-sm text-secondary font-medium truncate">
                              Top 5 Holder Conc: {token.top5HolderConc}%
                            </span>
                          ) : (
                            <span className="font-code-sm text-code-sm text-secondary font-medium truncate">
                              Liq: {token.liquidity} · Vol: {token.volume24h}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Price & Security Rating Block */}
                    <div className="flex flex-col items-end shrink-0">
                      <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                        {token.price < 0.0001
                          ? `$${token.price.toExponential(3)}`
                          : token.price < 1
                          ? `$${token.price.toFixed(4)}`
                          : `$${token.price.toFixed(2)}`}
                      </span>
                      <div
                        className={`flex items-center gap-1 font-code-sm text-code-sm font-medium ${
                          isPositive ? 'text-secondary' : 'text-error'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[14px]">
                          {isPositive ? 'trending_up' : 'trending_down'}
                        </span>
                        <span>{isPositive ? `+${token.change24h}%` : `${token.change24h}%`}</span>
                      </div>
                    </div>
                  </div>

                  {/* Security Gauge & Audit Sub-bar */}
                  <div className="bg-surface-container-low p-space-sm rounded-lg flex items-center justify-between gap-space-sm">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-secondary-container flex items-center justify-center shrink-0">
                        <span className="font-code-sm text-code-sm font-bold text-on-secondary-container">
                          {token.securityGrade}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1">
                          <span className="font-label-sm text-label-sm uppercase font-semibold text-on-surface">
                            Security Score
                          </span>
                          <span className="font-code-sm text-code-sm font-bold text-secondary">
                            {token.securityScore} / 100
                          </span>
                        </div>
                        <span className="font-body-sm text-body-sm text-on-surface-variant truncate block">
                          {token.securityNote}
                        </span>
                      </div>
                    </div>

                    {/* Micro Sparkline SVG */}
                    <div className="flex items-center gap-2 shrink-0">
                      <svg
                        className={`w-16 h-7 ${isPositive ? 'text-secondary' : 'text-on-surface-variant'}`}
                        fill="none"
                        viewBox="0 0 64 24"
                      >
                        <path
                          d={points}
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                        />
                      </svg>
                      <button
                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                          token.pinned
                            ? 'bg-amber-500/15 text-amber-500 hover:bg-amber-500/25'
                            : 'bg-surface-container text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleWatch(token);
                        }}
                        title={token.pinned ? 'Unpin token from Watchlist' : 'Pin token to Watchlist'}
                        aria-label={token.pinned ? `Unpin ${token.symbol} from Watchlist` : `Pin ${token.symbol} to Watchlist`}
                      >
                        <span
                          className="material-symbols-outlined text-[18px]"
                          style={{ fontVariationSettings: token.pinned ? "'FILL' 1" : "'FILL' 0" }}
                        >
                          star
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Section 3: Notification Integrations Card (Webhook & Telegram) */}
      <div className="px-margin pt-space-sm pb-space-lg">
        <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col gap-space-md border border-outline-variant/10">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-space-sm">
              <div className="w-10 h-10 rounded-xl bg-primary-container text-on-primary-container flex items-center justify-center shadow-sm">
                <span className="material-symbols-outlined text-[20px] text-primary-fixed">
                  sensors
                </span>
              </div>
              <div>
                <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                  Real-Time Dispatch
                </h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Deliver instant zero-delay alerts off-chain
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-space-sm">
            {/* Telegram Bot Row */}
            <div className="bg-surface-container-low p-space-sm rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-space-sm">
                <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-[18px]">send</span>
                </div>
                <div>
                  <span className="font-label-md text-label-md font-semibold text-on-surface block">
                    Telegram Threat Bot
                  </span>
                  <span className="font-code-sm text-code-sm text-on-surface-variant">
                    {dispatchSettings.telegramChatId}
                  </span>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={dispatchSettings.telegramEnabled}
                  onChange={(e) => handleToggleRelay('Telegram Bot', 'telegramEnabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-surface-container-lowest after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-secondary"></div>
              </label>
            </div>

            {/* Custom Webhook Row */}
            <div className="bg-surface-container-low p-space-sm rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-space-sm">
                <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-[18px]">webhook</span>
                </div>
                <div>
                  <span className="font-label-md text-label-md font-semibold text-on-surface block">
                    Enterprise Webhook
                  </span>
                  <span className="font-code-sm text-code-sm text-on-surface-variant">
                    POST payload JSON to sec-ops endpoint
                  </span>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={dispatchSettings.webhookEnabled}
                  onChange={(e) => handleToggleRelay('Enterprise Webhook', 'webhookEnabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-surface-container-lowest after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-secondary"></div>
              </label>
            </div>
          </div>

          {/* Quick Action Configure Button */}
          <div className="flex items-center gap-space-sm pt-space-xs">
            <button
              className="w-full bg-primary text-on-primary py-2.5 px-space-md rounded-lg font-label-md text-label-md font-semibold hover:bg-surface-tint active:bg-primary-container transition-all flex items-center justify-center gap-space-xs shadow-sm cursor-pointer"
              onClick={onOpenDispatchModal}
            >
              <span className="material-symbols-outlined text-[16px]">tune</span>
              <span>Configure Dispatch Channels</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
