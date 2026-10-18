export type TabType = 'discover' | 'audit-and-risk' | 'holders' | 'watchlist';

export interface DexScreenerToken {
  address: string;
  name: string;
  symbol: string;
}

export interface DexScreenerTxns {
  buys?: number;
  sells?: number;
}

export interface DexScreenerVolume {
  h24?: number;
  h6?: number;
  h1?: number;
  m5?: number;
}

export interface DexScreenerPriceChange {
  h24?: number;
  h6?: number;
  h1?: number;
  m5?: number;
}

export interface DexScreenerLiquidity {
  usd?: number;
  base?: number;
  quote?: number;
}

export interface DexScreenerPairInfo {
  imageUrl?: string;
  header?: string;
  openGraph?: string;
  websites?: { label: string; url: string }[];
  socials?: { type: string; url: string }[];
}

export interface DexScreenerPair {
  chainId: string;
  dexId: string;
  url: string;
  pairAddress: string;
  labels?: string[];
  baseToken: DexScreenerToken;
  quoteToken: DexScreenerToken;
  priceNative?: string;
  priceUsd?: string;
  txns?: {
    m5?: DexScreenerTxns;
    h1?: DexScreenerTxns;
    h6?: DexScreenerTxns;
    h24?: DexScreenerTxns;
  };
  volume?: DexScreenerVolume;
  priceChange?: DexScreenerPriceChange;
  liquidity?: DexScreenerLiquidity;
  fdv?: number;
  marketCap?: number;
  pairCreatedAt?: number;
  info?: DexScreenerPairInfo;
  boosts?: { active?: number };
}

export interface TokenAsset {
  id: string;
  name: string;
  symbol: string;
  badge: string;
  type: string;
  categoryDesc: string;
  price: number;
  change24h: number;
  securityScore: number;
  securityGrade: 'AAA' | 'AA+' | 'AA' | 'A' | 'B' | 'D' | 'F';
  securityNote: string;
  top5HolderConc?: number | null;
  marketCap: string;
  liquidity: string;
  volume24h: string;
  mintAuthority: 'Revoked' | 'Active' | 'Multisig' | 'Unknown';
  freezeAuthority: 'Revoked' | 'Active' | 'Unknown';
  lpBurnedPercent?: number | null;
  auditor?: string;
  auditId?: string;
  sparklineData?: number[];
  pinned: boolean;
  contractAddress: string;
  deployerAddress?: string;
  snipersDetected?: number;
  riskFlags: string[];
  // DEX Screener Live Integration Fields
  isLiveApi?: boolean;
  dataSource: 'DEX_SCREENER_API' | 'DEMO_TELEMETRY';
  dexId?: string;
  pairAddress?: string;
  quoteTokenSymbol?: string;
  dexUrl?: string;
  imageUrl?: string;
  fdv?: number | null;
  rawMarketCap?: number | null;
  rawVolume24h?: number | null;
  rawLiquidityUsd?: number | null;
  rawPriceUsd?: number | null;
  txns24h?: { buys: number; sells: number } | null;
  pairCreatedAt?: number | null;
  pairsList?: DexScreenerPair[];
  lastUpdated?: string;
}

export interface SecurityIncident {
  id: string;
  title: string;
  tokenSymbol: string;
  headline: string;
  description: string;
  timeAgo: string;
  severity: 'CRITICAL' | 'WARNING' | 'RESOLVED' | 'INFO';
  badgeText: string;
  borderColor: string;
  icon: string;
  telemetryTag: string;
  telemetryIcon: string;
  telemetryClass: string;
  actionText?: string;
  actionType: 'copy' | 'link' | 'audit';
  txOrSafeHash?: string;
  category: 'all' | 'triggers' | 'safe' | 'dex';
  blockHeight?: number;
  lossAmount?: string;
  detailedAnalysis?: string;
}

export interface HolderItem {
  address: string;
  label: string;
  percentage: number;
  amount: string;
  usdValue: string;
  type: 'Multisig' | 'DEX Pool' | 'Treasury' | 'Whale' | 'Team' | 'Exchange';
  riskLevel: 'safe' | 'warning' | 'critical';
  transfer24h?: string;
}

export interface DispatchSettings {
  telegramEnabled: boolean;
  telegramChatId: string;
  webhookEnabled: boolean;
  webhookUrl: string;
  discordEnabled: boolean;
  discordWebhook: string;
  minSeverityAlert: 'CRITICAL' | 'WARNING' | 'ALL';
  alertOnLiquidityDrain: boolean;
  alertOnAuthorityChange: boolean;
  alertOnLargeTransfer: boolean;
}
