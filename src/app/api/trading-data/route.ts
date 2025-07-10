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
    // Fetch stats and trades data in parallel
    const [statsData, tradesData] = await Promise.all([
      apiFetch(`${config.baseUrl}/stats`, headers),
      apiFetch(`${config.baseUrl}/trades`, headers),
    ]);
    
    // --- DATA TRANSFORMATION ---
    const latestStats = statsData.stats_for_period.slice(-1)[0] || {};
    const totalProfit = statsData.profit_total_coin || 0;
    const totalBalance = (statsData.starting_balance + totalProfit).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    
    const winRate = latestStats.winning_trades > 0 
      ? `${((latestStats.winning_trades / latestStats.total_trades) * 100).toFixed(1)}%`
      : '0%';

    const pnl = `+${(latestStats.profit_total_coin || 0).toFixed(3)}`;

    const recentTrades = (tradesData.trades || [])
      .sort((a: any, b: any) => new Date(b.close_date).getTime() - new Date(a.close_date).getTime())
      .slice(0, 5)
      .map((trade: any) => ({
        asset: trade.pair,
        type: trade.is_short ? 'SELL' : 'BUY',
        status: trade.is_open ? 'Open' : 'Closed',
        profit: `${(trade.profit_ratio * 100).toFixed(2)}%`,
      }));

    const formattedData = {
      totalRevenue: `$${totalBalance}`,
      pnl: pnl,
      trades: `${latestStats.total_trades || 0}`,
      winRate: winRate,
      pnlPercentage: `${(latestStats.profit_total_ratio * 100).toFixed(2)}%`,
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
