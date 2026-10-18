import React, { useState, useEffect, useRef } from 'react';
import { TokenAsset, DexScreenerPair } from '../types/tokenscope';
import {
  isSolanaTokenAddress,
  searchDexScreenerTokens,
  groupPairsByToken,
  pairToTokenAsset,
  fetchSpotlightSolanaTokens
} from '../services/dexScreener';
import { isTokenInWatchlist } from '../services/watchlistStorage';

interface DiscoverScreenProps {
  tokens: TokenAsset[];
  onSelectToken: (token: TokenAsset) => void;
  onToggleWatch: (token: TokenAsset) => void;
  onToast: (msg: string) => void;
}

export const DiscoverScreen: React.FC<DiscoverScreenProps> = ({
  tokens,
  onSelectToken,
  onToggleWatch,
  onToast
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDex, setSelectedDex] = useState<string>('all');
  const [dataSourceTab, setDataSourceTab] = useState<'live' | 'demo'>('live');
  const [sortBy, setSortBy] = useState<'liquidity' | 'volume' | 'gainers' | 'losers'>('liquidity');

  // Live API search state
  const [liveTokens, setLiveTokens] = useState<TokenAsset[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isAddressMode, setIsAddressMode] = useState(false);
  const [lastSearchedQuery, setLastSearchedQuery] = useState('');

  const abortControllerRef = useRef<AbortController | null>(null);

  // Quick ticker presets
  const QUICK_TICKERS = ['SOL', 'JUP', 'BONK', 'WIF', 'RENDER', 'RAY', 'DRIFT', 'POPCAT'];

  // Load initial spotlight tokens from DEX Screener on mount
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    async function loadSpotlight() {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const pairs = await fetchSpotlightSolanaTokens(controller.signal);
        if (!isMounted) return;
        if (pairs.length > 0) {
          const grouped = groupPairsByToken(pairs);
          const assets = grouped.map(g => pairToTokenAsset(g.primaryPair, g.allPairs));
          setLiveTokens(assets);
        }
      } catch (err) {
        if (!isMounted) return;
        setErrorMessage('Failed to load initial Solana market feed from DEX Screener.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadSpotlight();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, []);

  // Handle debounced search when user types
  useEffect(() => {
    const trimmed = searchQuery.trim();

    // Reset address detection indicator
    setIsAddressMode(isSolanaTokenAddress(trimmed));

    if (!trimmed) {
      setErrorMessage(null);
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const timer = setTimeout(async () => {
      setIsLoading(true);
      setErrorMessage(null);
      setLastSearchedQuery(trimmed);

      try {
        const res = await searchDexScreenerTokens(trimmed, controller.signal);
        
        if (res.error) {
          setErrorMessage(res.error);
          setLiveTokens([]);
        } else if (res.pairs.length === 0) {
          setLiveTokens([]);
        } else {
          const grouped = groupPairsByToken(res.pairs);
          const assets = grouped.map(g => pairToTokenAsset(g.primaryPair, g.allPairs));
          setLiveTokens(assets);
        }
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setErrorMessage('Error querying DEX Screener API. Please try again.');
        setLiveTokens([]);
      } finally {
        setIsLoading(false);
      }
    }, 400);

    return () => {
      clearTimeout(timer);
    };
  }, [searchQuery]);

  // Determine which tokens to display based on tab
  const displayedTokens = dataSourceTab === 'live' ? liveTokens : tokens;

  // Filter by DEX and Sort
  const filteredTokens = displayedTokens
    .filter(token => {
      if (selectedDex === 'all') return true;
      if (selectedDex === 'raydium') return token.dexId?.toLowerCase().includes('raydium');
      if (selectedDex === 'orca') return token.dexId?.toLowerCase().includes('orca');
      if (selectedDex === 'meteora') return token.dexId?.toLowerCase().includes('meteora');
      if (selectedDex === 'pumpfun') return token.dexId?.toLowerCase().includes('pumpfun');
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'liquidity') return (b.rawLiquidityUsd || 0) - (a.rawLiquidityUsd || 0);
      if (sortBy === 'volume') return (b.rawVolume24h || 0) - (a.rawVolume24h || 0);
      if (sortBy === 'gainers') return b.change24h - a.change24h;
      if (sortBy === 'losers') return a.change24h - b.change24h;
      return 0;
    });

  return (
    <div className="flex flex-col w-full pb-8 max-w-4xl mx-auto">
      {/* Top Hero Context */}
      <div className="px-margin pt-space-md pb-space-sm flex flex-col gap-space-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-space-xs">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-secondary-container text-on-secondary-container">
              <span className="material-symbols-outlined text-[13px]">
                radar
              </span>
            </span>
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold">
              Live DEX Screener Market Feed
            </span>
          </div>
          <div className="flex items-center gap-1.5 bg-surface-container px-2.5 py-1 rounded-full shadow-sm">
            <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
            <span className="font-code-sm text-code-sm text-on-surface-variant font-medium">
              api.dexscreener.com
            </span>
          </div>
        </div>
        <h1 className="font-headline-xl-mobile text-headline-xl-mobile text-on-surface font-semibold tracking-tight">
          Discover Solana Assets
        </h1>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          Real on-chain pricing, liquidity pools, 24h volume, and market cap retrieved directly from the official DEX Screener public API.
        </p>
      </div>

      {/* Search Input Bar with Solana Address Auto-Detection */}
      <div className="px-margin py-space-xs flex flex-col gap-1.5">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-3 text-on-surface-variant text-[20px]">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by token name (e.g. Jupiter), ticker ($BONK), or Solana address..."
            className="w-full pl-10 pr-10 py-2.5 bg-surface-container-low rounded-xl border border-outline-variant/30 text-sm font-body-md focus:outline-none focus:border-primary text-on-surface transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setErrorMessage(null);
              }}
              className="absolute right-3 top-2.5 text-on-surface-variant hover:text-on-surface cursor-pointer p-0.5"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          )}
        </div>

        {/* Dynamic Address Query Badge */}
        {isAddressMode && (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-primary-container text-primary-fixed rounded-lg text-xs font-code-sm animate-fade-in">
            <span className="material-symbols-outlined text-[15px]">tag</span>
            <span>Solana Mint Address detected — Querying token trading pairs via DEX Screener API</span>
          </div>
        )}

        {/* Quick Ticker Presets */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar pt-0.5">
          <span className="font-label-sm text-[10px] text-on-surface-variant uppercase tracking-wider shrink-0 mr-1">
            Trending:
          </span>
          {QUICK_TICKERS.map(ticker => (
            <button
              key={ticker}
              onClick={() => {
                setSearchQuery(ticker);
                onToast(`Searching DEX Screener for $${ticker}...`);
              }}
              className="px-2 py-0.5 rounded bg-surface-container-low hover:bg-surface-container border border-outline-variant/20 text-xs font-code-sm text-on-surface font-medium transition-colors cursor-pointer shrink-0"
            >
              ${ticker}
            </button>
          ))}
        </div>
      </div>

      {/* Data Source & DEX Filter Controls */}
      <div className="px-margin pt-space-xs pb-space-sm flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          {/* Source Toggle Tabs */}
          <div className="flex items-center p-0.5 bg-surface-container rounded-lg">
            <button
              onClick={() => setDataSourceTab('live')}
              className={`px-3 py-1 rounded-md text-xs font-label-sm font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                dataSourceTab === 'live'
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span>
              <span>Live DEX Screener API</span>
            </button>
            <button
              onClick={() => setDataSourceTab('demo')}
              className={`px-3 py-1 rounded-md text-xs font-label-sm font-semibold transition-all cursor-pointer ${
                dataSourceTab === 'demo'
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span>Demo Watchlist ({tokens.length})</span>
            </button>
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-1.5 bg-surface-container px-2 py-1 rounded-lg">
            <span className="material-symbols-outlined text-[15px] text-on-surface-variant">sort</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-xs font-label-md font-semibold text-on-surface focus:outline-none cursor-pointer"
            >
              <option value="liquidity">Most Liquid</option>
              <option value="volume">Highest 24h Vol</option>
              <option value="gainers">Top 24h Gainers</option>
              <option value="losers">Top 24h Losers</option>
            </select>
          </div>
        </div>

        {/* DEX Pool Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {[
            { id: 'all', label: 'All DEX Pools' },
            { id: 'raydium', label: 'Raydium' },
            { id: 'orca', label: 'Orca' },
            { id: 'meteora', label: 'Meteora' },
            { id: 'pumpfun', label: 'Pump.fun' }
          ].map(dex => (
            <button
              key={dex.id}
              onClick={() => setSelectedDex(dex.id)}
              className={`px-3 py-1.5 rounded-lg font-label-md text-label-md whitespace-nowrap shadow-sm transition-all cursor-pointer ${
                selectedDex === dex.id
                  ? 'bg-primary text-on-primary font-semibold'
                  : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {dex.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content State: Loading, Error, Empty, or Token List */}
      <div className="px-margin pt-space-xs flex flex-col gap-space-sm">
        {/* Loading Indicator */}
        {isLoading && (
          <div className="p-8 text-center bg-surface-container-lowest rounded-xl border border-outline-variant/20 shadow-sm flex flex-col items-center justify-center gap-2">
            <span className="material-symbols-outlined text-3xl text-primary animate-spin">
              refresh
            </span>
            <p className="font-headline-sm text-headline-sm text-on-surface font-semibold">
              Querying DEX Screener Public API...
            </p>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Fetching real-time Solana trading pairs, liquidity depth, and USD pricing.
            </p>
          </div>
        )}

        {/* Error State */}
        {!isLoading && errorMessage && (
          <div className="p-4 bg-error-container text-on-error-container rounded-xl border border-error/30 flex items-start gap-3">
            <span className="material-symbols-outlined text-error text-[22px] shrink-0 mt-0.5">
              error
            </span>
            <div className="flex-1 min-w-0">
              <h4 className="font-headline-sm text-headline-sm text-error font-semibold">
                DEX Screener Request Notice
              </h4>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                {errorMessage}
              </p>
              <button
                onClick={() => {
                  setErrorMessage(null);
                  setSearchQuery(lastSearchedQuery);
                }}
                className="mt-2 px-3 py-1 bg-surface-container-lowest text-xs font-semibold rounded shadow-sm hover:bg-surface-container transition-colors cursor-pointer text-on-surface"
              >
                Retry Request
              </button>
            </div>
          </div>
        )}

        {/* Empty Search Results */}
        {!isLoading && !errorMessage && filteredTokens.length === 0 && (
          <div className="p-8 text-center bg-surface-container-lowest rounded-xl border border-outline-variant/20 shadow-sm">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant">
              search_off
            </span>
            <h3 className="mt-2 font-headline-sm text-headline-sm text-on-surface font-semibold">
              No Solana trading pairs found
            </h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 max-w-md mx-auto">
              {searchQuery
                ? `No active trading pairs were returned on DEX Screener for "${searchQuery}". Please check the token symbol or try pasting the exact Solana mint address.`
                : 'No tokens match the selected DEX filter.'}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="mt-3 px-3.5 py-1.5 bg-primary text-on-primary rounded-lg text-xs font-semibold hover:bg-surface-tint transition-all cursor-pointer"
              >
                Clear Search
              </button>
            )}
          </div>
        )}

        {/* Real Token List */}
        {!isLoading && filteredTokens.length > 0 && (
          <div className="flex flex-col gap-space-sm">
            {filteredTokens.map((token) => {
              const isPinned = isTokenInWatchlist(token, tokens);
              const isLive = token.isLiveApi === true;
              const isPositive = token.change24h >= 0;
              const hasPairs = token.pairsList && token.pairsList.length > 1;

              return (
                <div
                  key={token.id}
                  onClick={() => onSelectToken(token)}
                  className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm border border-outline-variant/15 hover:shadow-md transition-all cursor-pointer flex flex-col gap-space-sm relative overflow-hidden"
                >
                  {/* Top Bar on Card: Live Source Badge */}
                  <div className="flex items-center justify-between text-xs pb-1 border-b border-outline-variant/10">
                    <div className="flex items-center gap-1.5">
                      {isLive ? (
                        <span className="px-2 py-0.5 rounded font-label-sm font-bold bg-secondary-container text-secondary flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span>
                          <span>LIVE DEX SCREENER</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded font-label-sm font-bold bg-surface-container text-on-surface-variant">
                          DEMO TELEMETRY
                        </span>
                      )}

                      {token.dexId && (
                        <span className="font-code-sm text-code-sm text-on-surface-variant uppercase font-medium">
                          {token.dexId}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {hasPairs && (
                        <span className="font-code-sm text-code-sm text-on-surface-variant">
                          {token.pairsList!.length} Pairs
                        </span>
                      )}
                      {token.dexUrl && (
                        <a
                          href={token.dexUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="font-code-sm text-code-sm text-on-surface-variant hover:text-primary flex items-center gap-0.5"
                          title="View on DEX Screener"
                        >
                          <span>DEX Screener</span>
                          <span className="material-symbols-outlined text-[12px]">north_east</span>
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Token Info & Real Market Metrics */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
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

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-headline-sm text-headline-sm text-on-surface font-semibold truncate">
                            {token.name}
                          </span>
                          <span className="font-code-sm text-code-sm text-on-surface-variant font-medium">
                            ${token.symbol}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="font-code-sm text-on-surface-variant truncate">
                            {token.type}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Live USD Price & 24h Change */}
                    <div className="flex flex-col items-end shrink-0">
                      <span className="font-headline-sm text-headline-sm font-semibold">
                        {token.price < 0.0001
                          ? `$${token.price.toExponential(3)}`
                          : token.price < 1
                          ? `$${token.price.toFixed(6)}`
                          : `$${token.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
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

                  {/* Real On-Chain Telemetry Strip: Liquidity, 24h Volume, Market Cap */}
                  <div className="bg-surface-container-low p-space-sm rounded-lg flex items-center justify-between gap-2 flex-wrap">
                    <div className="grid grid-cols-3 gap-3 flex-1 min-w-[240px] text-xs">
                      <div>
                        <span className="font-label-sm text-label-sm text-on-surface-variant uppercase block">
                          Liquidity
                        </span>
                        <span className="font-code-sm font-semibold text-on-surface">
                          {token.liquidity}
                        </span>
                      </div>
                      <div>
                        <span className="font-label-sm text-label-sm text-on-surface-variant uppercase block">
                          24h Volume
                        </span>
                        <span className="font-code-sm font-semibold text-on-surface">
                          {token.volume24h}
                        </span>
                      </div>
                      <div>
                        <span className="font-label-sm text-label-sm text-on-surface-variant uppercase block">
                          Market Cap
                        </span>
                        <span className="font-code-sm font-semibold text-on-surface">
                          {token.marketCap}
                        </span>
                      </div>
                    </div>

                    {/* Star Pin Toggle */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleWatch(token);
                      }}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                        isPinned
                          ? 'bg-amber-500/15 text-amber-500 hover:bg-amber-500/25'
                          : 'bg-surface-container text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
                      }`}
                      title={isPinned ? 'Unpin from Watchlist' : 'Pin to Watchlist'}
                      aria-label={isPinned ? `Unpin ${token.symbol} from Watchlist` : `Pin ${token.symbol} to Watchlist`}
                    >
                      <span
                        className="material-symbols-outlined text-[18px]"
                        style={{ fontVariationSettings: isPinned ? "'FILL' 1" : "'FILL' 0" }}
                      >
                        star
                      </span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
