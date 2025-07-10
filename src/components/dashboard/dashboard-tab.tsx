

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
import { TrendingUp, Activity, Percent } from 'lucide-react';
import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
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
  Rectangle,
} from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

interface Trade {
    asset: string;
    type: 'BUY' | 'SELL';
    status: 'Open' | 'Closed';
    profitPercentage: number;
    profitAbs: number;
    openDate: string;
    closeDate: string | null;
    openRate: number;
    closeRate: number;
    amount: number;
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
}

const StatCard = ({ title, value, icon: Icon, subtext, isLoading, hasData }: { title: string, value: string | React.ReactNode, icon: React.ElementType, subtext?: string, isLoading: boolean, hasData: boolean }) => {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
                {isLoading ? (
                    <>
                        <Skeleton className="h-12 w-3/4" />
                        {subtext && <Skeleton className="h-4 w-1/2 mt-1" />}
                    </>
                ) : hasData ? (
                    <>
                        <div className="text-6xl font-bold">{value}</div>
                        {subtext && <p className="text-xs text-muted-foreground">{subtext}</p>}
                    </>
                ) : (
                    <>
                        <div className="text-6xl font-bold text-muted-foreground/50">N/A</div>
                        {subtext && <p className="text-xs text-muted-foreground/50">No data available</p>}
                    </>
                )}
            </CardContent>
        </Card>
    );
}

const TradesTable = ({ trades, title, description, isLoading, hasData }: { trades: Trade[], title: string, description: string, isLoading: boolean, hasData: boolean }) => {
    const isClosedTrades = title.toLowerCase().includes('closed');

    return (
        <Card>
            <CardHeader className="p-4">
                <CardTitle className="text-lg">{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0">
                {isLoading ? (
                    <div className="space-y-2">
                        {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                    </div>
                ) : !hasData || trades.length === 0 ? (
                    <div className="flex items-center justify-center h-24 text-muted-foreground">
                        {isLoading ? 'Loading...' : 'No trades found.'}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Asset</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Open Rate</TableHead>
                                    <TableHead>{isClosedTrades ? "Close Rate" : "Open Date"}</TableHead>
                                    <TableHead className="text-right">{isClosedTrades ? "Profit" : "Status"}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {trades.map((trade, index) => (
                                    <TableRow key={index}>
                                        <TableCell className="font-medium whitespace-nowrap">{trade.asset}</TableCell>
                                        <TableCell>
                                            <Badge variant={trade.type === 'BUY' ? 'secondary' : 'default'} className={`text-xs ${trade.type === 'BUY' ? 'bg-blue-900/50 text-blue-300' : 'bg-purple-900/50 text-purple-300'}`}>
                                                {trade.type}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{trade.amount.toFixed(4)}</TableCell>
                                        <TableCell>{trade.openRate.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</TableCell>
                                        <TableCell className="whitespace-nowrap">
                                          {isClosedTrades 
                                            ? (trade.closeRate ? trade.closeRate.toLocaleString('en-US', { style: 'currency', currency: 'USD' }) : 'N/A') 
                                            : (trade.openDate && new Date(trade.openDate).getTime() > 0 ? format(new Date(trade.openDate), 'PPp') : 'N/A')}
                                        </TableCell>
                                        <TableCell className="text-right font-semibold whitespace-nowrap">
                                            {isClosedTrades ? (
                                                <span className={trade.profitAbs >= 0 ? 'text-green-400' : 'text-red-400'}>
                                                    {trade.profitAbs?.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                                                </span>
                                            ) : (
                                                <Badge variant="outline">{trade.status}</Badge>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

const ProfitLossChart = ({ data, isLoading, hasData }: { data: ChartData[], isLoading: boolean, hasData: boolean }) => (
    <Card>
        <CardHeader className="p-4">
            <CardTitle className="text-lg">Profit/Loss per Trade</CardTitle>
            <CardDescription>Visualizing the outcome of each closed trade.</CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-0">
            {isLoading ? (
                <Skeleton className="h-[250px] w-full" />
            ) : !hasData || data.length === 0 ? (
                 <div className="flex items-center justify-center h-[250px] text-muted-foreground">No chart data available.</div>
            ) : (
                 <ChartContainer config={{ profit: { label: 'Profit' } }} className="h-[250px] w-full">
                    <BarChart accessibilityLayer data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border) / 0.5)" />
                        <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                        <ChartTooltip cursor={{ fill: 'hsl(var(--muted))' }} content={<ChartTooltipContent />} />
                        <Bar dataKey="profit" radius={4}>
                            {data.map((entry, index) => (
                                <Rectangle key={`cell-${index}`} fill={entry.profit >= 0 ? 'hsl(var(--chart-2))' : 'hsl(var(--accent))'} />
                            ))}
                        </Bar>
                    </BarChart>
                </ChartContainer>
            )}
        </CardContent>
    </Card>
);

const CumulativeProfitChart = ({ data, isLoading, hasData }: { data: ChartData[], isLoading: boolean, hasData: boolean }) => (
    <Card>
        <CardHeader className="p-4">
            <CardTitle className="text-lg">Cumulative Profit Over Time</CardTitle>
            <CardDescription>Tracking the growth of the total profit.</CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-0">
            {isLoading ? (
                <Skeleton className="h-[250px] w-full" />
            ) : !hasData || data.length === 0 ? (
                <div className="flex items-center justify-center h-[250px] text-muted-foreground">No chart data available.</div>
            ) : (
                <ChartContainer config={{ cumulativeProfit: { label: 'Cumulative Profit', color: 'hsl(var(--accent))' } }} className="h-[250px] w-full">
                    <AreaChart accessibilityLayer data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border) / 0.5)" />
                        <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                        <ChartTooltip cursor={{ stroke: 'hsl(var(--accent))', strokeWidth: 1 }} content={<ChartTooltipContent />} />
                        <defs>
                            <linearGradient id="colorCumulative" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <Area type="monotone" dataKey="cumulativeProfit" name="Cumulative Profit" stroke="hsl(var(--accent))" fillOpacity={1} fill="url(#colorCumulative)" />
                    </AreaChart>
                </ChartContainer>
            )}
        </CardContent>
    </Card>
);

export function DashboardTab({ modelName, data, isLoading }: { modelName: string, data: TradingData | null, isLoading: boolean }) {
  const hasData = !!data && data.totalTrades > 0;
  const pnlValue = data?.pnl ?? 0;
  const pnlColor = pnlValue >= 0 ? 'text-green-400' : 'text-red-400';

  return (
    <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <StatCard isLoading={isLoading} hasData={hasData} title="Total P&L" value={<span className={pnlColor}>{pnlValue.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</span>} icon={TrendingUp} subtext="Net profit from all closed trades" />
            <StatCard isLoading={isLoading} hasData={hasData} title="Closed Trades" value={data?.totalTrades.toLocaleString() ?? 'N/A'} icon={Activity} subtext="Total number of completed trades" />
            <StatCard isLoading={isLoading} hasData={hasData} title="Win Rate" value={`${((data?.winRate ?? 0) * 100).toFixed(1)}%`} icon={Percent} subtext={`${data?.winningTrades ?? 0} Wins / ${data?.losingTrades ?? 0} Losses`} />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ProfitLossChart data={data?.tradeHistoryForCharts ?? []} isLoading={isLoading} hasData={hasData && (data?.tradeHistoryForCharts?.length ?? 0) > 0} />
            <CumulativeProfitChart data={data?.cumulativeProfitHistory ?? []} isLoading={isLoading} hasData={hasData && (data?.cumulativeProfitHistory?.length ?? 0) > 0} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
             <TradesTable 
                title="Open Trades"
                description="Trades that are currently active."
                trades={data?.openTrades ?? []}
                isLoading={isLoading}
                hasData={!!data}
            />
            <TradesTable 
                title="Recent Closed Trades"
                description="A history of all closed trades."
                trades={(data?.closedTrades ?? []).slice(0, 20)}
                isLoading={isLoading}
                hasData={hasData}
            />
        </div>
    </div>
  );
}
