import { TokenAsset } from '../types/tokenscope';
import { INITIAL_TOKENS } from '../data/mockData';

export const WATCHLIST_STORAGE_KEY = 'tokenscope_watchlist_v1';

/**
 * Normalizes Solana address / identifier for strict matching
 */
export function normalizeAddress(addr?: string | null): string {
  if (!addr) return '';
  return addr.trim().toLowerCase();
}

/**
 * Checks whether two token representations refer to the exact same Solana token.
 * Primary identifier: Solana token mint address (contractAddress).
 * Fallback: Token ID or matching live-{address} prefix.
 */
export function areTokensEqual(
  a?: Partial<TokenAsset> | null,
  b?: Partial<TokenAsset> | null
): boolean {
  if (!a || !b) return false;

  // 1. Primary identifier: Solana mint address (contractAddress)
  const addrA = normalizeAddress(a.contractAddress);
  const addrB = normalizeAddress(b.contractAddress);
  if (addrA && addrB) {
    return addrA === addrB;
  }

  // 2. Matching direct ID
  if (a.id && b.id && a.id === b.id) {
    return true;
  }

  // 3. Normalized ID vs live-{address} match
  if (addrA && b.id && b.id.toLowerCase() === `live-${addrA}`) {
    return true;
  }
  if (addrB && a.id && a.id.toLowerCase() === `live-${addrB}`) {
    return true;
  }

  // 4. Fallback symbol match only if neither has an address (edge case)
  if (!addrA && !addrB && a.symbol && b.symbol) {
    return a.symbol.trim().toUpperCase() === b.symbol.trim().toUpperCase();
  }

  return false;
}

/**
 * Checks whether a token is currently pinned in the shared watchlist tokens array.
 */
export function isTokenInWatchlist(token: TokenAsset, watchlistTokens: TokenAsset[]): boolean {
  if (!token || !Array.isArray(watchlistTokens)) return false;
  const match = watchlistTokens.find(t => areTokensEqual(t, token));
  return match ? Boolean(match.pinned) : false;
}

/**
 * Safely loads watchlist from localStorage with thorough validation.
 * Falls back to INITIAL_TOKENS if storage is empty, corrupted, or malformed.
 */
export function loadWatchlist(): TokenAsset[] {
  if (typeof window === 'undefined' || !window.localStorage) {
    return INITIAL_TOKENS;
  }

  try {
    const raw = localStorage.getItem(WATCHLIST_STORAGE_KEY);
    if (!raw) {
      return INITIAL_TOKENS;
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return INITIAL_TOKENS;
    }

    const validatedTokens: TokenAsset[] = [];
    const seenAddresses = new Set<string>();

    for (const item of parsed) {
      if (
        item &&
        typeof item === 'object' &&
        typeof item.name === 'string' &&
        typeof item.symbol === 'string'
      ) {
        const contractAddress = typeof item.contractAddress === 'string' ? item.contractAddress.trim() : '';
        const id = typeof item.id === 'string' && item.id.trim() ? item.id.trim() : contractAddress ? `live-${contractAddress}` : `token-${item.symbol}`;

        // Deduplication safeguard on load
        const dedupKey = contractAddress ? contractAddress.toLowerCase() : id.toLowerCase();
        if (seenAddresses.has(dedupKey)) {
          continue;
        }
        seenAddresses.add(dedupKey);

        const isLive = item.isLiveApi === true;
        const dataSource = isLive ? 'DEX_SCREENER_API' : (item.dataSource === 'DEX_SCREENER_API' ? 'DEX_SCREENER_API' : 'DEMO_TELEMETRY');

        validatedTokens.push({
          id,
          name: item.name,
          symbol: item.symbol,
          badge: typeof item.badge === 'string' ? item.badge : item.symbol.slice(0, 5).toUpperCase(),
          type: typeof item.type === 'string' ? item.type : 'Solana Token',
          categoryDesc: typeof item.categoryDesc === 'string' ? item.categoryDesc : 'SPL Mint',
          price: typeof item.price === 'number' && !isNaN(item.price) ? item.price : 0,
          change24h: typeof item.change24h === 'number' && !isNaN(item.change24h) ? item.change24h : 0,
          securityScore: typeof item.securityScore === 'number' ? item.securityScore : 70,
          securityGrade: item.securityGrade || 'A',
          securityNote: typeof item.securityNote === 'string' ? item.securityNote : '',
          marketCap: typeof item.marketCap === 'string' ? item.marketCap : 'N/A',
          liquidity: typeof item.liquidity === 'string' ? item.liquidity : 'N/A',
          volume24h: typeof item.volume24h === 'string' ? item.volume24h : 'N/A',
          mintAuthority: item.mintAuthority || 'Unknown',
          freezeAuthority: item.freezeAuthority || 'Unknown',
          lpBurnedPercent: typeof item.lpBurnedPercent === 'number' ? item.lpBurnedPercent : null,
          top5HolderConc: typeof item.top5HolderConc === 'number' ? item.top5HolderConc : null,
          sparklineData: Array.isArray(item.sparklineData) ? item.sparklineData : undefined,
          pinned: Boolean(item.pinned),
          contractAddress,
          deployerAddress: typeof item.deployerAddress === 'string' ? item.deployerAddress : undefined,
          snipersDetected: typeof item.snipersDetected === 'number' ? item.snipersDetected : 0,
          riskFlags: Array.isArray(item.riskFlags) ? item.riskFlags : [],
          isLiveApi: isLive,
          dataSource,
          dexId: typeof item.dexId === 'string' ? item.dexId : undefined,
          pairAddress: typeof item.pairAddress === 'string' ? item.pairAddress : undefined,
          quoteTokenSymbol: typeof item.quoteTokenSymbol === 'string' ? item.quoteTokenSymbol : undefined,
          dexUrl: typeof item.dexUrl === 'string' ? item.dexUrl : undefined,
          imageUrl: typeof item.imageUrl === 'string' ? item.imageUrl : undefined,
          fdv: typeof item.fdv === 'number' ? item.fdv : null,
          rawMarketCap: typeof item.rawMarketCap === 'number' ? item.rawMarketCap : null,
          rawVolume24h: typeof item.rawVolume24h === 'number' ? item.rawVolume24h : null,
          rawLiquidityUsd: typeof item.rawLiquidityUsd === 'number' ? item.rawLiquidityUsd : null,
          rawPriceUsd: typeof item.rawPriceUsd === 'number' ? item.rawPriceUsd : null,
          txns24h: item.txns24h || null,
          pairCreatedAt: typeof item.pairCreatedAt === 'number' ? item.pairCreatedAt : null,
          pairsList: Array.isArray(item.pairsList) ? item.pairsList : undefined,
          lastUpdated: typeof item.lastUpdated === 'string' ? item.lastUpdated : undefined
        });
      }
    }

    return validatedTokens.length > 0 ? validatedTokens : INITIAL_TOKENS;
  } catch (err) {
    console.error('Failed to parse watchlist from localStorage, restoring defaults:', err);
    return INITIAL_TOKENS;
  }
}

/**
 * Safely persists tokens to localStorage.
 */
export function saveWatchlist(tokens: TokenAsset[]): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(tokens));
  } catch (err) {
    console.error('Failed to persist watchlist to localStorage:', err);
  }
}

/**
 * Reliable watchlist toggle operation.
 * - Adds unpinned token (pinned: true).
 * - Removes pinned token (pinned: false).
 * - Matches by Solana mint address first to prevent duplicates.
 * - Preserves live vs demo attribution.
 */
export function toggleWatchlistToken(
  tokens: TokenAsset[],
  tokenToToggle: TokenAsset
): {
  updatedTokens: TokenAsset[];
  isNowPinned: boolean;
  targetSymbol: string;
} {
  const existingIndex = tokens.findIndex(t => areTokensEqual(t, tokenToToggle));

  if (existingIndex !== -1) {
    const existing = tokens[existingIndex];
    const newPinned = !existing.pinned;
    const updated = [...tokens];

    // If existing token was unpinned and being pinned with fresh live data, merge live fields
    if (newPinned && tokenToToggle.isLiveApi) {
      updated[existingIndex] = {
        ...existing,
        ...tokenToToggle,
        pinned: true
      };
    } else {
      updated[existingIndex] = {
        ...existing,
        pinned: newPinned
      };
    }

    return {
      updatedTokens: updated,
      isNowPinned: newPinned,
      targetSymbol: existing.symbol
    };
  } else {
    // New token discovered from DEX Screener or search: add as pinned
    const newEntry: TokenAsset = {
      ...tokenToToggle,
      pinned: true
    };
    return {
      updatedTokens: [...tokens, newEntry],
      isNowPinned: true,
      targetSymbol: tokenToToggle.symbol
    };
  }
}
