
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
        apiFetch(`${config.baseUrl}/status`, headers).catch(() => ({})),
        apiFetch(`${config.baseUrl}/trades`, headers).catch(() => ({ trades: [] })),
    ]);
    
    // --- START DEBUG LOGGING ---
    console.log(`--- RAW DATA FOR ${model.toUpperCase()} ---`);
    console.log("Raw /status response:", JSON.stringify(statusData, null, 2));
    console.log("Raw /trades response:", JSON.stringify(tradesData, null, 2));
    console.log(`-------------------------------------`);
    // --- END DEBUG LOGGING ---


    // --- DATA TRANSFORMATION ---
    const botStatus = (Array.isArray(statusData?.bots?.status) && statusData.bots.status[0]) || {};
    
    const totalProfit = botStatus.total_profit || 0;
    const startingBalance = botStatus.starting_balance || 0;
    const totalBalance = (startingBalance + totalProfit);
    
    const totalTrades = botStatus.trade_count || 0;
    const winningTrades = botStatus.wins || 0;
    const winRate = totalTrades > 0 ? (winningTrades / totalTrades) : 0;
    
    const pnl = totalProfit;
    const profitRatio = botStatus.profit_ratio || 0;

    const allTrades = (tradesData.trades || []).map((trade: any) => ({
        asset: trade.pair || 'N/A',
        type: trade.is_short ? 'SELL' : 'BUY',
        status: trade.is_open ? 'Open' : 'Closed',
        profitPercentage: trade.is_open ? null : (trade.profit_ratio || 0) * 100,
        profitAbs: trade.is_open ? null : trade.profit_abs || 0,
        openDate: trade.open_date_ts || '',
        closeDate: trade.close_date_ts || null,
        openRate: trade.open_rate || 0,
        closeRate: trade.close_rate || 0,
        amount: trade.amount || 0,
      }));

    const openTrades = allTrades.filter((t: any) => t.status === 'Open')
        .sort((a: any, b: any) => new Date(b.openDate).getTime() - new Date(a.openDate).getTime());

    const closedTrades = allTrades.filter((t: any) => t.status === 'Closed')
        .sort((a: any, b: any) => new Date(b.closeDate).getTime() - new Date(a.closeDate).getTime());
    
    // Data for charts
    const tradeHistoryForCharts = closedTrades
        .slice() 
        .reverse()
        .map((trade: any, index: number) => ({
            name: `Trade ${index + 1}`,
            date: new Date(trade.closeDate).toLocaleDateString(),
            profit: trade.profitAbs,
        }));
    
    let cumulativeProfit = 0;
    const cumulativeProfitHistory = tradeHistoryForCharts.map((trade: any) => {
        cumulativeProfit += trade.profit;
        return { ...trade, cumulativeProfit };
    });

    const formattedData = {
      // Summary Stats
      totalBalance,
      pnl,
      totalTrades,
      winRate,
      profitRatio,
      winningTrades,
      losingTrades: totalTrades - winningTrades,
      
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
