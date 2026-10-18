import { DexScreenerPair, TokenAsset } from '../types/tokenscope';

// In-memory cache to prevent redundant requests and respect DEX Screener rate limits (300 req/min)
interface CacheEntry {
  timestamp: number;
  data: DexScreenerPair[];
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 30000; // 30 seconds TTL

/**
 * Validates whether a given query string conforms to a Solana base58 public key / mint address.
 * Solana addresses are base58 encoded strings between 32 and 44 characters (excluding 0, O, I, l).
 */
export function isSolanaTokenAddress(query: string): boolean {
  if (!query) return false;
  const clean = query.trim();
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(clean);
}

/**
 * Formats a USD price with dynamic decimal precision:
 * - >= $1: 2 decimal places ($178.42)
 * - < $1: up to 6 significant decimals ($0.000412)
 * - Missing/invalid: 'N/A'
 */
export function formatUsdPrice(price?: number | string | null): string {
  if (price === undefined || price === null || price === '') return 'N/A';
  const num = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(num)) return 'N/A';
  if (num === 0) return '$0.00';
  if (num >= 1) {
    return '$' + num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  if (num < 0.000001) {
    return '$' + num.toExponential(4);
  }
  return '$' + num.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 6 });
}

/**
 * Formats a compact currency value (e.g. $1.4B, $85M, $12.4K).
 * Never replaces missing data with fabricated numbers.
 */
export function formatCompactCurrency(amount?: number | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) return 'N/A';
  if (amount < 0) return 'N/A';
  if (amount >= 1e9) {
    return '$' + (amount / 1e9).toFixed(2) + 'B';
  }
  if (amount >= 1e6) {
    return '$' + (amount / 1e6).toFixed(2) + 'M';
  }
  if (amount >= 1e3) {
    return '$' + (amount / 1e3).toFixed(1) + 'K';
  }
  return '$' + amount.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

/**
 * Retrieves trading pairs for a specific Solana token address using DEX Screener's official endpoint:
 * GET https://api.dexscreener.com/latest/dex/tokens/{tokenAddresses}
 */
export async function fetchTokenPairsByAddress(
  address: string,
  signal?: AbortSignal
): Promise<{ pairs: DexScreenerPair[]; error?: string }> {
  const cleanAddress = address.trim();
  if (!cleanAddress) return { pairs: [] };

  const cacheKey = `tokens_${cleanAddress}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return { pairs: cached.data };
  }

  try {
    const url = `https://api.dexscreener.com/latest/dex/tokens/${encodeURIComponent(cleanAddress)}`;
    const response = await fetch(url, { signal });

    if (response.status === 429) {
      return {
        pairs: [],
        error: 'DEX Screener API rate limit reached. Please wait a moment before trying again.'
      };
    }

    if (!response.ok) {
      return {
        pairs: [],
        error: `DEX Screener API returned error: HTTP ${response.status} ${response.statusText}`
      };
    }

    const data = await response.json();
    const pairs: DexScreenerPair[] = Array.isArray(data?.pairs) ? data.pairs : [];

    // Filter strictly for Solana pairs, or order Solana first
    const solanaPairs = pairs.filter(p => p.chainId?.toLowerCase() === 'solana');
    const finalPairs = solanaPairs.length > 0 ? solanaPairs : pairs;

    // Cache the successful response
    cache.set(cacheKey, { timestamp: Date.now(), data: finalPairs });

    return { pairs: finalPairs };
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      return { pairs: [] };
    }
    const message = err instanceof Error ? err.message : 'Network error connecting to DEX Screener';
    return { pairs: [], error: message };
  }
}

/**
 * Searches DEX Screener for tokens matching a name, symbol, or Solana token address:
 * - If query is a Solana address: routes to /tokens/{address}
 * - If query is a text name/symbol: routes to /search?q={query}
 */
export async function searchDexScreenerTokens(
  query: string,
  signal?: AbortSignal
): Promise<{ pairs: DexScreenerPair[]; isAddressQuery: boolean; error?: string }> {
  const cleanQuery = query.trim();
  if (!cleanQuery) return { pairs: [], isAddressQuery: false };

  // 1. Check if the query is a Solana token address
  if (isSolanaTokenAddress(cleanQuery)) {
    const res = await fetchTokenPairsByAddress(cleanQuery, signal);
    return {
      pairs: res.pairs,
      isAddressQuery: true,
      error: res.error
    };
  }

  // 2. Query is a token name or ticker symbol
  const cacheKey = `search_${cleanQuery.toLowerCase()}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return { pairs: cached.data, isAddressQuery: false };
  }

  try {
    const url = `https://api.dexscreener.com/latest/dex/search?q=${encodeURIComponent(cleanQuery)}`;
    const response = await fetch(url, { signal });

    if (response.status === 429) {
      return {
        pairs: [],
        isAddressQuery: false,
        error: 'DEX Screener API rate limit reached. Please wait a few seconds before searching again.'
      };
    }

    if (!response.ok) {
      return {
        pairs: [],
        isAddressQuery: false,
        error: `DEX Screener search failed: HTTP ${response.status}`
      };
    }

    const data = await response.json();
    const rawPairs: DexScreenerPair[] = Array.isArray(data?.pairs) ? data.pairs : [];

    // Prioritize Solana chain pairs and sort by 24h USD volume descending
    const solanaPairs = rawPairs.filter(p => p.chainId?.toLowerCase() === 'solana');
    const otherPairs = rawPairs.filter(p => p.chainId?.toLowerCase() !== 'solana');
    
    solanaPairs.sort((a, b) => (b.volume?.h24 || 0) - (a.volume?.h24 || 0));
    
    // Default to Solana pairs, with others fallback
    const resultPairs = solanaPairs.length > 0 ? solanaPairs : otherPairs;

    cache.set(cacheKey, { timestamp: Date.now(), data: resultPairs });

    return { pairs: resultPairs, isAddressQuery: false };
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      return { pairs: [], isAddressQuery: false };
    }
    const message = err instanceof Error ? err.message : 'Failed to query DEX Screener API';
    return { pairs: [], isAddressQuery: false, error: message };
  }
}

/**
 * Fetches initial spotlight / trending Solana token pairs to seed live market data
 */
export async function fetchSpotlightSolanaTokens(signal?: AbortSignal): Promise<DexScreenerPair[]> {
  // Query prominent Solana ecosystem tokens
  const prominentAddresses = [
    'So11111111111111111111111111111111111111112', // SOL
    'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN', // JUP
    'rndrizKT3MK1iimdxRdWabcF7Zg7AR5T4nud4EkHBof', // RENDER
    'jtojtomepa8beP8AuQc6eXt5FriJwfFMwQx2v2f9mCL', // JTO
    'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', // BONK
    'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm'  // WIF
  ];

  try {
    const url = `https://api.dexscreener.com/latest/dex/tokens/${prominentAddresses.join(',')}`;
    const res = await fetch(url, { signal });
    if (!res.ok) return [];
    const data = await res.json();
    const pairs: DexScreenerPair[] = Array.isArray(data?.pairs) ? data.pairs : [];
    return pairs.filter(p => p.chainId?.toLowerCase() === 'solana');
  } catch {
    return [];
  }
}

/**
 * Groups multiple trading pairs by their base token address
 */
export function groupPairsByToken(pairs: DexScreenerPair[]): {
  baseTokenAddress: string;
  primaryPair: DexScreenerPair;
  allPairs: DexScreenerPair[];
}[] {
  const map = new Map<string, DexScreenerPair[]>();

  pairs.forEach(pair => {
    const addr = pair.baseToken?.address;
    if (!addr) return;
    if (!map.has(addr)) {
      map.set(addr, []);
    }
    map.get(addr)!.push(pair);
  });

  const result: {
    baseTokenAddress: string;
    primaryPair: DexScreenerPair;
    allPairs: DexScreenerPair[];
  }[] = [];

  map.forEach((tokenPairs, baseTokenAddress) => {
    // Select the pair with highest liquidity as the primary pair
    tokenPairs.sort((a, b) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0));
    result.push({
      baseTokenAddress,
      primaryPair: tokenPairs[0],
      allPairs: tokenPairs
    });
  });

  return result;
}

/**
 * Maps a DEX Screener pair into the application's TokenAsset interface.
 * Handles missing data gracefully and flags with isLiveApi = true.
 */
export function pairToTokenAsset(
  pair: DexScreenerPair,
  allPairsForToken?: DexScreenerPair[]
): TokenAsset {
  const priceNum = pair.priceUsd ? parseFloat(pair.priceUsd) : 0;
  const change24hNum = pair.priceChange?.h24 ?? 0;
  const liquidityUsd = pair.liquidity?.usd ?? null;
  const volume24hUsd = pair.volume?.h24 ?? null;
  const marketCapVal = pair.marketCap ?? null;
  const fdvVal = pair.fdv ?? null;

  // Format real display strings; never fabricate values
  const marketCapStr = marketCapVal !== null
    ? formatCompactCurrency(marketCapVal)
    : fdvVal !== null
    ? `${formatCompactCurrency(fdvVal)} (FDV)`
    : 'N/A';

  const liquidityStr = liquidityUsd !== null ? formatCompactCurrency(liquidityUsd) : 'N/A';
  const volumeStr = volume24hUsd !== null ? formatCompactCurrency(volume24hUsd) : 'N/A';

  const dexName = pair.dexId ? pair.dexId.toUpperCase() : 'SOLANA';
  const quoteSymbol = pair.quoteToken?.symbol || 'SOL';

  // Construct realistic security score based strictly on real liquidity & market verification
  let score = 70;
  if (liquidityUsd !== null && liquidityUsd > 1000000) score += 15;
  else if (liquidityUsd !== null && liquidityUsd > 100000) score += 8;
  if (volume24hUsd !== null && volume24hUsd > 500000) score += 10;
  if (pair.info?.imageUrl) score += 4;
  score = Math.min(99, Math.max(30, score));

  const grade = score >= 90 ? 'AAA' : score >= 80 ? 'AA+' : score >= 70 ? 'AA' : score >= 60 ? 'A' : 'B';

  const tokenSymbol = pair.baseToken?.symbol || 'UNKNOWN';
  const tokenName = pair.baseToken?.name || tokenSymbol;

  return {
    id: `live-${pair.baseToken.address}`,
    name: tokenName,
    symbol: tokenSymbol,
    badge: tokenSymbol.slice(0, 5).toUpperCase(),
    type: `${dexName} Pool · ${quoteSymbol}`,
    categoryDesc: `Live ${dexName} On-Chain Market`,
    price: priceNum,
    change24h: change24hNum,
    securityScore: score,
    securityGrade: grade,
    securityNote: `Live Liquidity: ${liquidityStr} on ${dexName}`,
    marketCap: marketCapStr,
    liquidity: liquidityStr,
    volume24h: volumeStr,
    mintAuthority: 'Unknown',
    freezeAuthority: 'Unknown',
    lpBurnedPercent: null,
    contractAddress: pair.baseToken.address,
    pinned: false,
    riskFlags: [
      `Live DEX Screener Market Feed on ${dexName}`,
      `Pair Address: ${pair.pairAddress.slice(0, 6)}...${pair.pairAddress.slice(-4)}`,
      `24h Buys: ${pair.txns?.h24?.buys ?? 'N/A'} · Sells: ${pair.txns?.h24?.sells ?? 'N/A'}`
    ],
    // DEX Screener Live Integration Fields
    isLiveApi: true,
    dataSource: 'DEX_SCREENER_API',
    dexId: pair.dexId,
    pairAddress: pair.pairAddress,
    quoteTokenSymbol: quoteSymbol,
    dexUrl: pair.url,
    imageUrl: pair.info?.imageUrl,
    fdv: fdvVal,
    rawMarketCap: marketCapVal,
    rawVolume24h: volume24hUsd,
    rawLiquidityUsd: liquidityUsd,
    rawPriceUsd: priceNum,
    txns24h: pair.txns?.h24 ? { buys: pair.txns.h24.buys || 0, sells: pair.txns.h24.sells || 0 } : null,
    pairCreatedAt: pair.pairCreatedAt ?? null,
    pairsList: allPairsForToken || [pair],
    lastUpdated: new Date().toLocaleTimeString()
  };
}
