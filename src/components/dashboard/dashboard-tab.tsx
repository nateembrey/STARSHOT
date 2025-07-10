
"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Activity, Percent, ChevronsUp, ChevronsDown } from 'lucide-react';
import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { format, isValid } from 'date-fns';
import {
  Area,
  Bar,
  BarChart,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
  ReferenceLine,
  LabelList,
} from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

interface Trade {
    // Shared fields
    asset: string;
    type: 'BUY' | 'SELL';
    status: 'Open' | 'Closed';
    amount: number;
    openRate: number;
    openDate: string;
    profitPercentage: number;
    profitAbs: number;
    
    // Closed Trade specific
    closeDate: string | null;
    closeRate: number;
    
    // Open Trade specific
    trade_id?: number;
    stake_amount?: number;
    leverage?: number;
    currentRate?: number;
    open_timestamp?: number;
}

interface ChartData {
    name: string;
    date: string;
    profit: number;
    cumulativeProfit?: number;
}

export interface TradingData {
  pnl: number;
  totalTrades: number;
  winRate: number;
  winningTrades: number;
  losingTrades: number;
  openTrades: Trade[];
  closedTrades: Trade[];
  tradeHistoryForCharts: ChartData[];
  cumulativeProfitHistory: ChartData[];
  biggestWin: number;
  percentageProfit: number;
}

const StatCard = ({ title, value, icon: Icon, subtext, isLoading, hasData }: { title: string, value: string | React.ReactNode, icon: React.ElementType, subtext?: string, isLoading: boolean, hasData: boolean }) => {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-6">
                <CardTitle className="text-lg">{title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-6">
                {isLoading ? (
                    <>
                        <Skeleton className="h-10 w-3/4" />
                        {subtext && <Skeleton className="h-4 w-1/2 mt-2" />}
                    </>
                ) : hasData ? (
                    <>
                        <div className="text-4xl font-bold tracking-tight">{value}</div>
                        {subtext && <p className="text-xs text-muted-foreground mt-2">{subtext}</p>}
                    </>
                ) : (
                    <>
                        <div className="text-4xl font-bold tracking-tight text-muted-foreground/50">N/A</div>
                        {subtext && <p className="text-xs text-muted-foreground/50 mt-2">No data available</p>}
                    </>
                )}
            </CardContent>
        </Card>
    );
}

const formatTradeDate = (dateString: string) => {
    const date = new Date(dateString);
    if (!isValid(date)) return 'N/A';
    return format(date, 'yyyy-MM-dd HH:mm:ss');
};


const TradesTable = ({ trades, title, description, isLoading, hasData }: { trades: Trade[], title: string, description: string, isLoading: boolean, hasData: boolean }) => {
    const isClosedTrades = title.toLowerCase().includes('closed');

    if (!isClosedTrades) { // Render new Open Trades table
        return (
            <Card>
                <CardHeader className="p-6">
                    <CardTitle className="text-lg">{title}</CardTitle>
                    <CardDescription className="text-xs">{description}</CardDescription>
                </CardHeader>
                <CardContent className="p-2 pt-0">
                     {isLoading ? (
                        <div className="space-y-2 px-2">
                            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
                        </div>
                    ) : !hasData ? (
                        <div className="flex items-center justify-center h-24 text-muted-foreground text-sm">
                            {isLoading ? 'Loading...' : 'No open trades found.'}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="text-xs">ID</TableHead>
                                        <TableHead className="text-xs">Pair</TableHead>
                                        <TableHead className="text-xs">Amount</TableHead>
                                        <TableHead className="text-xs">Stake Amount</TableHead>
                                        <TableHead className="text-xs">Open Rate</TableHead>
                                        <TableHead className="text-xs">Current Rate</TableHead>
                                        <TableHead className="text-xs text-right">Current Profit %</TableHead>
                                        <TableHead className="text-xs">Open Date</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {trades.map((trade) => {
                                        const isProfit = trade.profitPercentage >= 0;
                                        return (
                                            <TableRow key={trade.trade_id}>
                                                <TableCell className="font-medium text-xs">{trade.trade_id}</TableCell>
                                                <TableCell className="whitespace-nowrap text-xs">{trade.asset}</TableCell>
                                                <TableCell className="text-xs">{trade.amount.toFixed(2)}</TableCell>
                                                <TableCell className="text-xs whitespace-nowrap">
                                                    {trade.stake_amount?.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} ({trade.leverage}x)
                                                </TableCell>
                                                <TableCell className="text-xs">{trade.openRate}</TableCell>
                                                <TableCell className="text-xs">{trade.currentRate}</TableCell>
                                                <TableCell className={`text-right font-semibold whitespace-nowrap text-xs ${isProfit ? 'text-[hsl(var(--chart-2))]' : 'text-[hsl(var(--accent))]'}`}>
                                                    {isProfit ? '▲' : '▼'} {trade.profitPercentage.toFixed(2)}% (${trade.profitAbs?.toFixed(2)})
                                                </TableCell>
                                                <TableCell className="whitespace-nowrap text-xs">{formatTradeDate(trade.openDate)}</TableCell>
                                            </TableRow>
                                        )
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        );
    }


    return (
        <Card>
            <CardHeader className="p-6">
                <CardTitle className="text-lg">{title}</CardTitle>
                <CardDescription className="text-xs">{description}</CardDescription>
            </CardHeader>
            <CardContent className="p-2 pt-0">
                {isLoading ? (
                    <div className="space-y-2 px-2">
                        {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
                    </div>
                ) : !hasData ? (
                    <div className="flex items-center justify-center h-24 text-muted-foreground text-sm">
                        {isLoading ? 'Loading...' : 'No trades found.'}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-xs">Asset</TableHead>
                                    <TableHead className="text-xs">Type</TableHead>
                                    <TableHead className="text-xs">Amount</TableHead>
                                    <TableHead className="text-xs">Open Rate</TableHead>
                                    <TableHead className="text-xs">Close Rate</TableHead>
                                    <TableHead className="text-right text-xs">Profit</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {trades.map((trade, index) => {
                                    return (
                                        <TableRow key={index}>
                                            <TableCell className="font-medium whitespace-nowrap text-xs">{trade.asset}</TableCell>
                                            <TableCell>
                                                <Badge variant={trade.type === 'BUY' ? 'secondary' : 'default'} className={`text-xs ${trade.type === 'BUY' ? 'bg-blue-900/50 text-blue-300' : 'bg-purple-900/50 text-purple-300'}`}>
                                                    {trade.type}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-xs">{trade.amount.toFixed(4)}</TableCell>
                                            <TableCell className="text-xs">{trade.openRate.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</TableCell>
                                            <TableCell className="whitespace-nowrap text-xs">
                                                {trade.closeRate ? trade.closeRate.toLocaleString('en-US', { style: 'currency', currency: 'USD' }) : 'N/A'}
                                            </TableCell>
                                            <TableCell className="text-right font-semibold whitespace-nowrap text-xs">
                                                <span className={trade.profitAbs >= 0 ? 'text-[hsl(var(--chart-2))]' : 'text-[hsl(var(--accent))]'}>
                                                    {trade.profitAbs?.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                                                </span>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

const ProfitLossChart = ({ data, isLoading, hasData, biggestWin }: { data: ChartData[], isLoading: boolean, hasData: boolean, biggestWin: number }) => (
    <Card>
        <CardHeader className="p-6">
            <div className="flex justify-between items-start">
                <div>
                    <CardTitle className="text-lg">Profit/Loss per Trade</CardTitle>
                    <CardDescription className="text-xs">Outcome of each closed trade.</CardDescription>
                </div>
                {hasData && (
                    <div className="text-right">
                        <p className="text-xs text-muted-foreground">Biggest Trade</p>
                        <p className="font-bold text-lg text-[hsl(var(--chart-2))]">
                            {biggestWin.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                        </p>
                    </div>
                )}
            </div>
        </CardHeader>
        <CardContent className="p-2 pt-0">
            {isLoading ? (
                <Skeleton className="h-[200px] w-full" />
            ) : !hasData || data.length === 0 ? (
                 <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">No chart data.</div>
            ) : (
                 <ChartContainer config={{ profit: { label: 'Profit' } }} className="h-[200px] w-full">
                    <BarChart accessibilityLayer data={data} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border) / 0.5)" />
                        <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                        <ChartTooltip cursor={{ fill: 'hsl(var(--muted))' }} content={<ChartTooltipContent />} />
                        <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
                        <Bar dataKey="profit" radius={2}>
                          <LabelList
                            dataKey="profit"
                            position="insideTop"
                            offset={12}
                            fontSize={12}
                            fontWeight="bold"
                            fill="hsl(var(--primary))"
                            formatter={(value: number) =>
                              value.toLocaleString('en-US', {
                                style: 'currency',
                                currency: 'USD',
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 0,
                              })
                            }
                          />
                          {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.profit >= 0 ? 'hsl(var(--chart-2))' : 'hsl(var(--accent))'} />
                          ))}
                        </Bar>
                    </BarChart>
                </ChartContainer>
            )}
        </CardContent>
    </Card>
);

const CumulativeProfitChart = ({ data, isLoading, hasData }: { data: ChartData[], isLoading: boolean, hasData: boolean }) => {
    const finalProfit = data.length > 0 ? data[data.length - 1].cumulativeProfit ?? 0 : 0;
    const isPositive = finalProfit >= 0;

    const mainColor = isPositive ? "hsl(var(--chart-2))" : "hsl(var(--accent))";
    const gradientId = isPositive ? "gradient-green" : "gradient-red";
    
    return (
        <Card>
            <CardHeader className="p-6">
                <CardTitle className="text-lg">Cumulative Profit</CardTitle>
                <CardDescription className="text-xs">Growth of total profit over time.</CardDescription>
            </CardHeader>
            <CardContent className="p-2 pt-0">
                {isLoading ? (
                    <Skeleton className="h-[200px] w-full" />
                ) : !hasData || data.length === 0 ? (
                    <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">No chart data.</div>
                ) : (
                    <ChartContainer config={{ cumulativeProfit: { label: 'Cumulative Profit' } }} className="h-[200px] w-full">
                        <AreaChart accessibilityLayer data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }} allowDataOverflow={true}>
                            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border) / 0.5)" />
                            <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
                            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                            <ChartTooltip cursor={{ stroke: 'hsl(var(--accent))', strokeWidth: 1 }} content={<ChartTooltipContent />} />
                            <defs>
                                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={mainColor} stopOpacity={0.4}/>
                                    <stop offset="95%" stopColor={mainColor} stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
                            <Area type="monotone" dataKey="cumulativeProfit" stroke={mainColor} fill={`url(#${gradientId})`} strokeWidth={2} />
                        </AreaChart>
                    </ChartContainer>
                )}
            </CardContent>
        </Card>
    );
};


export function DashboardTab({ modelName, data, isLoading }: { modelName: string, data: TradingData | null, isLoading: boolean }) {
  const hasData = !!data && (data.totalTrades > 0 || data.openTrades.length > 0);
  const pnlValue = data?.pnl ?? 0;
  const pnlColor = pnlValue >= 0 ? 'text-[hsl(var(--chart-2))]' : 'text-[hsl(var(--accent))]';
  const winsLossesIcon = (data?.winningTrades ?? 0) >= (data?.losingTrades ?? 0) ? ChevronsUp : ChevronsDown;
  const percentageProfitValue = data?.percentageProfit ?? 0;
  const percentageProfitColor = percentageProfitValue >= 0 ? 'text-[hsl(var(--chart-2))]' : 'text-[hsl(var(--accent))]';

  const formatPnl = (value: number) => {
    const absValue = Math.abs(value);
    if (absValue < 1000) {
      return value.toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      });
    }
    const formatted = (value / 1000).toLocaleString('en-US', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    });
    return `$${formatted}k`;
  };

  return (
    <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <StatCard isLoading={isLoading} hasData={!!data && data.totalTrades > 0} title="Total P&L" value={<span className={pnlColor}>{formatPnl(pnlValue)}</span>} icon={TrendingUp} subtext="Profit & Loss from closed trades."/>
            <StatCard isLoading={isLoading} hasData={!!data && data.totalTrades > 0} title="Percentage Profit" value={<span className={percentageProfitColor}>{`${percentageProfitValue.toFixed(2)}%`}</span>} icon={TrendingUp} subtext="Total P&L / total invested capital." />
            <StatCard isLoading={isLoading} hasData={!!data && data.totalTrades > 0} title="Closed Trades" value={data?.totalTrades.toLocaleString() ?? 'N/A'} icon={Activity} subtext="Total trades completed." />
            <StatCard isLoading={isLoading} hasData={!!data && data.totalTrades > 0} title="Win Rate" value={`${((data?.winRate ?? 0) * 100).toFixed(1)}%`} icon={Percent} subtext="Percentage of profitable trades."/>
            <StatCard isLoading={isLoading} hasData={!!data && data.totalTrades > 0} title="Wins/Losses" value={`${data?.winningTrades ?? 0}/${data?.losingTrades ?? 0}`} icon={winsLossesIcon} subtext="Profitable vs. unprofitable trades." />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ProfitLossChart 
                data={data?.tradeHistoryForCharts ?? []} 
                isLoading={isLoading} 
                hasData={!!data && (data?.tradeHistoryForCharts?.length ?? 0) > 0}
                biggestWin={data?.biggestWin ?? 0}
            />
            <CumulativeProfitChart data={data?.cumulativeProfitHistory ?? []} isLoading={isLoading} hasData={!!data && (data?.cumulativeProfitHistory?.length ?? 0) > 1} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
             <TradesTable 
                title="Open Trades"
                description="Trades that are currently active."
                trades={data?.openTrades ?? []}
                isLoading={isLoading}
                hasData={!!data && data.openTrades.length > 0}
            />
            <TradesTable 
                title="Recent Closed Trades"
                description="A history of all closed trades."
                trades={(data?.closedTrades ?? []).slice(0, 20)}
                isLoading={isLoading}
                hasData={!!data && data.closedTrades.length > 0}
            />
        </div>
    </div>
  );
}
