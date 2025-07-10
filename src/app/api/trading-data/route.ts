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
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }
  return response.json();
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
    const [statusData, tradesData] = await Promise.all([
        apiFetch(`${config.baseUrl}/status`, headers).catch(() => ({})), // Using /status
        apiFetch(`${config.baseUrl}/trades`, headers).catch(() => ({ trades: [] })), // Using /trades
    ]);

    // --- DATA TRANSFORMATION ---
    // Using default values for all fields to prevent crashes if API call fails or fields are missing.
    const botStatus = (Array.isArray(statusData?.bots?.status) && statusData.bots.status[0]) || {};
    
    const totalProfit = botStatus.total_profit || 0;
    const startingBalance = botStatus.starting_balance || 0;
    const totalBalance = (startingBalance + totalProfit);
    
    const totalTrades = botStatus.trade_count || 0;
    const winningTrades = botStatus.wins || 0;
    const winRate = totalTrades > 0
      ? (winningTrades / totalTrades)
      : 0;
    
    const pnl = totalProfit;
    const profitRatio = botStatus.profit_ratio || 0;


    const recentTrades = (tradesData.trades || [])
      .sort((a: any, b: any) => new Date(b.close_date_ts).getTime() - new Date(a.close_date_ts).getTime())
      .slice(0, 5)
      .map((trade: any) => ({
        asset: trade.pair || 'N/A',
        type: trade.is_short ? 'SELL' : 'BUY',
        status: trade.is_open ? 'Open' : 'Closed',
        profit: trade.is_open ? 'Pending' : `${((trade.profit_ratio || 0) * 100).toFixed(2)}%`,
        profitAbs: trade.is_open ? null : trade.profit_abs || 0,
      }));

    const formattedData = {
      totalRevenue: totalBalance,
      pnl: pnl,
      trades: totalTrades,
      winRate: winRate,
      pnlPercentage: profitRatio,
      recentTrades,
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
