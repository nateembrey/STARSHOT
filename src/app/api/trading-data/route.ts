
'use server';

import {NextResponse} from 'next/server';

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

function getAuthHeader(username: string, password?: string) {
  if (!password) return {};
  const credentials = Buffer.from(`${username}:${password}`).toString('base64');
  return { Authorization: `Basic ${credentials}` };
}

async function apiFetch(url: string, headers: HeadersInit) {
  try {
    const response = await fetch(url, { headers, cache: 'no-store' });
    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`API request to ${url} failed with status ${response.status}: ${errorBody}`);
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }
    try {
        return await response.json();
    } catch (e: any) {
        console.error(`Failed to parse JSON from ${url}:`, e.message);
        return null; 
    }
  } catch (e: any) {
    console.error(`Failed to fetch from ${url}:`, e.message);
    return null; 
  }
}

export async function GET(request: Request) {
  const {searchParams} = new URL(request.url);
  const model = searchParams.get('model');

  if (!model || (model !== 'chatgpt' && model !== 'gemini')) {
    return NextResponse.json({error: 'Invalid model specified'}, {status: 400});
  }

  const config = API_CONFIG[model as 'chatgpt' | 'gemini'];
  const authHeaders = getAuthHeader(config.username, config.password);
  const headers = { ...authHeaders, 'Content-Type': 'application/json' };

  try {
    const [tradesApiResponse, statusApiResponse] = await Promise.all([
        apiFetch(`${config.baseUrl}/trades`, headers),
        apiFetch(`${config.baseUrl}/status`, headers)
    ]);
    
    const openTradesSource = statusApiResponse?.orders;
    const openTrades = Array.isArray(openTradesSource) ? openTradesSource
      .filter((trade: any) => trade.is_open)
      .map((trade: any) => ({
        asset: trade.pair || 'N/A',
        type: trade.ft_order_side?.toUpperCase() === 'SELL' ? 'SELL' : 'BUY',
        status: 'Open',
        profitPercentage: 0,
        profitAbs: 0,
        openDate: trade.order_timestamp ? new Date(trade.order_timestamp).toISOString() : new Date().toISOString(),
        closeDate: null,
        openRate: trade.safe_price ?? 0,
        closeRate: 0,
        amount: trade.amount ?? 0,
    })).sort((a: any, b: any) => {
        const dateA = a.openDate ? new Date(a.openDate).getTime() : 0;
        const dateB = b.openDate ? new Date(b.openDate).getTime() : 0;
        return dateB - dateA;
    }) : [];

    const allTradesSource = tradesApiResponse?.trades;
    const closedTrades = Array.isArray(allTradesSource) ? allTradesSource
      .filter((trade: any) => trade.close_date_ts !== null)
      .map((trade: any) => ({
        asset: trade.pair || 'N/A',
        type: trade.is_short ? 'SELL' : 'BUY',
        status: 'Closed',
        profitPercentage: (trade.profit_ratio ?? 0) * 100,
        profitAbs: trade.profit_abs ?? 0,
        openDate: trade.open_date_ts ? new Date(trade.open_date_ts).toISOString() : new Date().toISOString(),
        closeDate: trade.close_date_ts ? new Date(trade.close_date_ts).toISOString() : null,
        openRate: trade.open_rate ?? 0,
        closeRate: trade.close_rate ?? 0,
        amount: trade.amount ?? 0,
      }))
      .sort((a: any, b: any) => {
          const dateA = a.closeDate ? new Date(a.closeDate).getTime() : 0;
          const dateB = b.closeDate ? new Date(b.closeDate).getTime() : 0;
          return dateB - dateA;
      }) : [];

    const totalTrades = closedTrades.length;
    const winningTrades = closedTrades.filter(t => (t.profitAbs ?? 0) > 0).length;
    const losingTrades = totalTrades - winningTrades;
    const winRate = totalTrades > 0 ? (winningTrades / totalTrades) : 0;
    const pnl = closedTrades.reduce((acc: number, trade: any) => acc + (trade.profitAbs ?? 0), 0);
    const biggestWin = Math.max(0, ...closedTrades.map(trade => trade.profitAbs ?? 0));
    const totalInvested = closedTrades.reduce((acc, trade) => acc + (trade.amount * trade.openRate), 0);
    const percentageProfit = totalInvested > 0 ? (pnl / totalInvested) * 100 : 0;
    
    const tradeHistoryForCharts = closedTrades
        .slice() 
        .reverse()
        .map((trade: any, index: number) => ({
            name: `Trade ${index + 1}`,
            date: trade.closeDate ? new Date(trade.closeDate).toLocaleString() : '',
            profit: trade.profitAbs ?? 0,
        }));
    
    let cumulativeProfit = 0;
    const cumulativeProfitHistoryWithTrades = tradeHistoryForCharts.map((trade: any) => {
        cumulativeProfit += trade.profit;
        return { ...trade, cumulativeProfit };
    });
    
    const cumulativeProfitHistory = [
      { name: 'Start', date: '', profit: 0, cumulativeProfit: 0 },
      ...cumulativeProfitHistoryWithTrades
    ];

    const formattedData = {
      pnl,
      totalTrades,
      winRate,
      winningTrades,
      losingTrades,
      openTrades,
      closedTrades,
      tradeHistoryForCharts,
      cumulativeProfitHistory,
      biggestWin,
      percentageProfit,
    };

    return NextResponse.json(formattedData);

  } catch (error: any) {
    console.error(`API_ERROR (${model}):`, error.message);
    return NextResponse.json(
      {error: `Failed to fetch data from ${model} API. Check server logs for details.`},
      {status: 500}
    );
  }
}
