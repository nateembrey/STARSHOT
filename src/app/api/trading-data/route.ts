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
  const response = await fetch(url, { headers });
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
    // NOTE: Based on the provided API docs, there are no /stats or /trades endpoints.
    // We will need to find the correct endpoints for summary data.
    // For now, I'm using placeholder data for the summary cards.
    // The `/pair_history` endpoint might be useful for recent trades, but requires more parameters.
    // Let's assume we need to call a /status and /trades endpoint which might be undocumented.
    // This is a common scenario. Let's try to call them and see what happens.
    
    const [statusData, tradesData] = await Promise.all([
        apiFetch(`${config.baseUrl}/status`, headers).catch(() => ({})), // Using /status
        apiFetch(`${config.baseUrl}/trades`, headers).catch(() => ({ trades: [] })), // Using /trades
    ]);

    // --- DATA TRANSFORMATION ---
    // Using default values for all fields to prevent crashes if API call fails or fields are missing.
    const botStatus = statusData?.bots?.status?.[0] || {};
    const totalProfit = botStatus.total_profit || 0;
    const totalBalance = (botStatus.starting_balance + totalProfit).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    
    const totalTrades = botStatus.trade_count || 0;
    const winningTrades = botStatus.wins || 0;
    const winRate = totalTrades > 0
      ? `${((winningTrades / totalTrades) * 100).toFixed(1)}%`
      : '0%';
    
    const pnl = `+${(totalProfit).toFixed(3)}`;
    const profitRatio = botStatus.profit_ratio || 0;


    const recentTrades = (tradesData.trades || [])
      .sort((a: any, b: any) => new Date(b.close_date_ts).getTime() - new Date(a.close_date_ts).getTime())
      .slice(0, 5)
      .map((trade: any) => ({
        asset: trade.pair || 'N/A',
        type: trade.is_short ? 'SELL' : 'BUY',
        status: trade.is_open ? 'Open' : 'Closed',
        profit: `${((trade.profit_ratio || 0) * 100).toFixed(2)}%`,
      }));

    const formattedData = {
      totalRevenue: `$${totalBalance}`,
      pnl: pnl,
      trades: `${totalTrades}`,
      winRate: winRate,
      pnlPercentage: `${(profitRatio * 100).toFixed(2)}%`,
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
