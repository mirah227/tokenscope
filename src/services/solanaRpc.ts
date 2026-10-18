/**
 * Solana Public Mainnet RPC Service (Free, unauthenticated, zero secrets)
 * Connects directly to https://api.mainnet-beta.solana.com
 */

export interface SolanaClusterStatus {
  slot: number;
  latencyMs: number;
  status: 'ok' | 'degraded' | 'offline';
  endpoint: string;
  timestamp: number;
}

const PUBLIC_SOLANA_RPC = 'https://api.mainnet-beta.solana.com';

/**
 * Pings Solana public RPC cluster to retrieve real current slot and round-trip latency
 */
export async function checkSolanaRpcHealth(signal?: AbortSignal): Promise<SolanaClusterStatus> {
  const startTime = Date.now();
  try {
    const response = await fetch(PUBLIC_SOLANA_RPC, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getSlot',
        params: [{ commitment: 'confirmed' }]
      }),
      signal
    });

    const latencyMs = Date.now() - startTime;

    if (!response.ok) {
      return {
        slot: 0,
        latencyMs,
        status: 'degraded',
        endpoint: 'api.mainnet-beta.solana.com',
        timestamp: Date.now()
      };
    }

    const data = await response.json();
    const currentSlot = typeof data?.result === 'number' ? data.result : 0;

    return {
      slot: currentSlot,
      latencyMs,
      status: currentSlot > 0 ? 'ok' : 'degraded',
      endpoint: 'api.mainnet-beta.solana.com',
      timestamp: Date.now()
    };
  } catch (error) {
    const latencyMs = Date.now() - startTime;
    return {
      slot: 0,
      latencyMs,
      status: 'offline',
      endpoint: 'api.mainnet-beta.solana.com',
      timestamp: Date.now()
    };
  }
}
