'use server';

import {NextResponse} from 'next/server';

// --- API CONFIGURATION ---
const API_CONFIG = {
  chatgpt: {
    baseUrl: 'http://35.228.171.101:8071/api/v1',
    username: 'ai_trading_agent',
    password: 'ai_trading_agent',
  },
  gemini: {
    baseUrl: 'http://35.228.171.101:8073/api/v1',
    username: 'ai_trading_agent',
    password: 'ai_trading_agent',
  },
};
// --- END CONFIGURATION ---

// Helper function to create Authorization header for Basic Auth
function getAuthHeader(username: string, password?: string) {
  if (!password) {
    return {};
  }
  const credentials = Buffer.from(`${username}:${password}`).toString('base64');
  return { Authorization: `Basic ${credentials}` };
}

// Helper to make fetch requests
async function apiFetch(url: string, headers: HeadersInit) {
  const response = await fetch(url, { headers, cache: 'no-store' });
  if (!response.ok) {
    const errorBody = await response.text();
    console.error(`API request to ${url} failed with status ${response.status}: ${errorBody}`);
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }
  try {
    return response.json();
  } catch (e) {
    console.error(`Failed to parse JSON from ${url}`);
    return {}; // Return empty object if JSON parsing fails
  }
}


export async function GET(request: Request) {
  const {searchParams} = new URL(request.url);
  const model = searchParams.get('model');

  if (!model || (model !== 'chatgpt' && model !== 'gemini')) {
    return NextResponse.json(
      {error: 'Invalid model specified'},
      {status: 400}
    );
  }

  const config = API_CONFIG[model as 'chatgpt' | 'gemini'];
  const authHeaders = getAuthHeader(config.username, config.password);
  const headers = { ...authHeaders, 'Content-Type': 'application/json' };

  try {
    // Only fetch from /trades endpoint
    const tradesData = await apiFetch(`${config.baseUrl}/trades`, headers).catch(() => ({ trades: [] }));

    // --- DATA TRANSFORMATION (ROBUST) ---
    const allTrades = (tradesData?.trades ?? []).map((trade: any) => ({
        asset: trade.pair || 'N/A',
        type: trade.is_short ? 'SELL' : 'BUY',
        // A trade is closed ONLY if close_date_ts is not null. Handles 0 or "" from API.
        status: trade.close_date_ts !== null ? 'Closed' : 'Open',
        profitPercentage: (trade.profit_ratio ?? 0) * 100,
        profitAbs: trade.profit_abs ?? 0,
        openDate: trade.open_date_ts ? new Date(trade.open_date_ts).toISOString() : new Date().toISOString(),
        closeDate: trade.close_date_ts ? new Date(trade.close_date_ts).toISOString() : null,
        openRate: trade.open_rate ?? 0,
        closeRate: trade.close_rate ?? 0,
        amount: trade.amount ?? 0,
      }));

    const openTrades = allTrades.filter((t: any) => t.status === 'Open')
        .sort((a: any, b: any) => new Date(b.openDate).getTime() - new Date(a.openDate).getTime());

    const closedTrades = allTrades.filter((t: any) => t.status === 'Closed')
        .sort((a: any, b: any) => new Date(b.closeDate).getTime() - new Date(a.closeDate).getTime());

    // --- CALCULATE STATS FROM TRADES ---
    const totalTrades = closedTrades.length;
    const winningTrades = closedTrades.filter(t => (t.profitAbs ?? 0) > 0).length;
    const losingTrades = totalTrades - winningTrades;
    const winRate = totalTrades > 0 ? (winningTrades / totalTrades) : 0;
    const pnl = closedTrades.reduce((acc: number, trade: any) => acc + (trade.profitAbs ?? 0), 0);
    
    // Data for charts
    const tradeHistoryForCharts = closedTrades
        .slice() 
        .reverse()
        .map((trade: any, index: number) => ({
            name: `Trade ${index + 1}`,
            date: trade.closeDate ? new Date(trade.closeDate).toLocaleDateString() : '',
            profit: trade.profitAbs,
        }));
    
    let cumulativeProfit = 0;
    const cumulativeProfitHistory = tradeHistoryForCharts.map((trade: any) => {
        cumulativeProfit += trade.profit;
        return { ...trade, cumulativeProfit };
    });

    const formattedData = {
      // Summary Stats (Calculated)
      pnl,
      totalTrades,
      winRate,
      winningTrades,
      losingTrades,
      
      // Trade Lists
      openTrades,
      closedTrades,

      // Chart Data
      tradeHistoryForCharts,
      cumulativeProfitHistory,
    };
    // --- END DATA TRANSFORMATION ---

    return NextResponse.json(formattedData);

  } catch (error: any) {
    console.error(`API_ERROR (${model}):`, error.message);
    return NextResponse.json(
      {error: `Failed to fetch data from ${model} API. Check server logs for details.`},
      {status: 500}
    );
  }
}
