
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
import { TrendingUp, Activity, Percent, ChevronsUp, ChevronsDown, ArrowUp, ArrowDown, History } from 'lucide-react';
import React, { useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
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
  ComposedChart,
} from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { cn } from '@/lib/utils';
import { predictProfit, type PredictProfitInput, type PredictProfitOutput } from '@/ai/flows/predict-profit-flow';


interface Trade {
    asset: string;
    type: 'BUY' | 'SELL';
    status: 'Open' | 'Closed';
    amount: number;
    openRate: number;
    openDate: string;
    profitPercentage: number;
    profitAbs: number;
    closeDate: string | null;
    closeRate: number;
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
  rawStatusResponse?: any;
}

type PredictionDuration = '1W' | '1M' | '3M' | '1Y';

const StatCard = ({ title, value, icon: Icon, subtext, isLoading, hasData }: { title: string, value: string | React.ReactNode, icon: React.ElementType, subtext?: string, isLoading: boolean, hasData: boolean }) => {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0 p-8">
                <CardTitle className="text-xl">{title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-8 pt-0">
                <div className={cn(!isLoading && 'animate-content-in')}>
                    {isLoading ? (
                        <>
                            <Skeleton className="h-10 w-3/4" />
                            {subtext && <Skeleton className="h-4 w-1/2 mt-4" />}
                        </>
                    ) : hasData ? (
                        <>
                            <div className="text-6xl font-bold tracking-tight">{value}</div>
                            {subtext && <p className="text-xs text-muted-foreground mt-4">{subtext}</p>}
                        </>
                    ) : (
                        <>
                            <div className="text-6xl font-bold tracking-tight text-muted-foreground/50">N/A</div>
                            {subtext && <p className="text-xs text-muted-foreground/50 mt-4">No data available</p>}
                        </>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

const ClosedTradesTable = ({ trades, title, description, isLoading, hasData }: { trades: Trade[], title: string, description: string, isLoading: boolean, hasData: boolean }) => {
    return (
        <Card>
            <CardHeader className="p-8">
                <CardTitle className="text-xl">{title}</CardTitle>
                <CardDescription className="text-xs">{description}</CardDescription>
            </CardHeader>
            <CardContent className={cn('p-8 pt-0', !isLoading && 'animate-content-in')}>
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
                                                <Badge variant={trade.type === 'BUY' ? 'secondary' : 'default'} className="text-xs">
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
        <CardHeader className="p-8">
            <div className="flex justify-between items-start">
                <div>
                    <CardTitle className="text-xl">Profit/Loss per Trade</CardTitle>
                    <CardDescription className="text-xs">Outcome of each closed trade.</CardDescription>
                </div>
                {hasData && (
                    <div className={cn(!isLoading && 'animate-content-in')}>
                        <p className="text-xs text-muted-foreground">Biggest Trade</p>
                        <p className="font-bold text-lg text-[hsl(var(--chart-2))]">
                            {biggestWin.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                        </p>
                    </div>
                )}
            </div>
        </CardHeader>
        <CardContent className={cn('p-8 pt-0', !isLoading && 'animate-content-in')}>
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
    const [isFlipped, setIsFlipped] = useState(false);
    const [isPredicting, setIsPredicting] = useState(false);
    const [prediction, setPrediction] = useState<PredictProfitOutput['prediction'] | null>(null);
    const [predictionDuration, setPredictionDuration] = useState<PredictionDuration>('1M');
    
    const handlePredict = async (duration: PredictionDuration) => {
        if (!data || data.length < 2) return;
        setIsPredicting(true);
        setPredictionDuration(duration);
        setPrediction(null); // Clear previous prediction
        
        try {
            const historyForPrediction = data
                .filter(d => d.date) // Ensure there's a date
                .map(d => ({
                    date: new Date(d.date).toISOString().split('T')[0], // format as yyyy-MM-dd
                    cumulativeProfit: d.cumulativeProfit || 0,
                }));

            const result = await predictProfit({ history: historyForPrediction, duration });
            const lastHistoricalPoint = data[data.length - 1];
            if (lastHistoricalPoint) {
                const bridgePoint = {
                    name: lastHistoricalPoint.name,
                    date: new Date(lastHistoricalPoint.date).toISOString().split('T')[0],
                    predictedProfit: lastHistoricalPoint.cumulativeProfit || 0,
                };
                 setPrediction([bridgePoint, ...result.prediction]);
            } else {
                 setPrediction(result.prediction);
            }

        } catch (error) {
            console.error("Prediction failed:", error);
            // Optionally, show a toast notification here
        } finally {
            setIsPredicting(false);
        }
    };
    
    const handleFlip = () => {
        setIsFlipped(prev => !prev);
        if (!isFlipped && !prediction) {
            handlePredict(predictionDuration);
        }
    };

    const combinedChartData = isFlipped && prediction ? [
        ...data.map(d => ({ ...d, predictedProfit: null })),
        ...prediction.map(p => ({
            name: p.name,
            date: p.date,
            cumulativeProfit: null, 
            predictedProfit: p.predictedProfit,
        }))
    ] : data.map(d => ({ ...d, predictedProfit: null }));


    const finalProfit = data.length > 0 ? data[data.length - 1].cumulativeProfit ?? 0 : 0;
    const isPositive = finalProfit >= 0;
    const mainColor = isPositive ? "hsl(var(--chart-2))" : "hsl(var(--accent))";
    const gradientId = isPositive ? "gradient-green" : "gradient-red";
    
    return (
        <div className="relative perspective h-[364px]">
            <div className={cn("w-full h-full transform-style-3d transition-transform duration-700", isFlipped && "rotate-y-180")}>
                {/* Front Face */}
                <Card className="absolute w-full h-full backface-hidden">
                    <CardHeader className="p-8 flex flex-row items-start justify-between">
                       <div>
                            <CardTitle className="text-xl">Cumulative Profit</CardTitle>
                            <CardDescription className="text-xs">Growth of total profit over time.</CardDescription>
                        </div>
                        <Button variant="outline" size="sm" onClick={handleFlip} disabled={isLoading || !hasData}>
                            <History className="mr-2 h-4 w-4" />
                            PREDICT
                        </Button>
                    </CardHeader>
                    <CardContent className={cn('p-8 pt-0', !isLoading && 'animate-content-in')}>
                        {isLoading ? (
                            <Skeleton className="h-[200px] w-full" />
                        ) : !hasData || data.length < 2 ? (
                            <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">No chart data.</div>
                        ) : (
                            <ChartContainer config={{ cumulativeProfit: { label: 'Cumulative Profit' } }} className="h-[200px] w-full">
                                <AreaChart accessibilityLayer data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
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
                
                {/* Back Face */}
                <Card className="absolute w-full h-full backface-hidden rotate-y-180">
                     <CardHeader className="p-8 flex flex-row items-start justify-between">
                       <div>
                            <CardTitle className="text-xl">Profit Forecast</CardTitle>
                            <CardDescription className="text-xs">AI-powered prediction based on historical data.</CardDescription>
                        </div>
                        <Button variant="outline" size="sm" onClick={handleFlip}>
                           <History className="mr-2 h-4 w-4" />
                            BACK
                        </Button>
                    </CardHeader>
                    <CardContent className="p-8 pt-0">
                         <div className="flex items-center justify-center space-x-2 mb-4">
                            {(['1W', '1M', '3M', '1Y'] as PredictionDuration[]).map(d => (
                                <Button key={d} size="sm" variant={predictionDuration === d ? 'secondary' : 'ghost'} onClick={() => handlePredict(d)} disabled={isPredicting}>
                                    {isPredicting && predictionDuration === d ? '...' : d}
                                </Button>
                            ))}
                        </div>
                        {isPredicting ? (
                             <Skeleton className="h-[168px] w-full" />
                        ) : !prediction ? (
                            <div className="flex items-center justify-center h-[168px] text-muted-foreground text-sm">Select a duration to generate a prediction.</div>
                        ) : (
                            <ChartContainer config={{ cumulativeProfit: { label: 'History', color: 'hsl(var(--chart-2))' }, predictedProfit: { label: 'Prediction', color: 'hsl(var(--chart-3))' } }} className="h-[168px] w-full">
                               <ComposedChart accessibilityLayer data={combinedChartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border) / 0.5)" />
                                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} allowDuplicatedCategory={false} tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}/>
                                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} domain={['dataMin - 100', 'dataMax + 100']}/>
                                    <ChartTooltip cursor={{ stroke: 'hsl(var(--accent))', strokeWidth: 1 }} content={<ChartTooltipContent />} />
                                    <defs>
                                        <linearGradient id="gradient-blue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="hsl(var(--chart-3))" stopOpacity={0.4}/>
                                            <stop offset="95%" stopColor="hsl(var(--chart-3))" stopOpacity={0}/>
                                        </linearGradient>
                                         <linearGradient id="gradient-green-solid" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.4}/>
                                            <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <Area type="monotone" dataKey="cumulativeProfit" stroke="hsl(var(--chart-2))" fill="url(#gradient-green-solid)" strokeWidth={2} name="History" />
                                    <Area type="monotone" dataKey="predictedProfit" stroke="hsl(var(--chart-3))" strokeDasharray="4 4" fill="url(#gradient-blue)" strokeWidth={2} name="Prediction" />
                                </ComposedChart>
                            </ChartContainer>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
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
  
  const openTradesFromStatus = data?.rawStatusResponse?.orders?.filter((t: any) => t.is_open) ?? [];

  return (
    <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
            <StatCard isLoading={isLoading} hasData={!!data && data.totalTrades > 0} title="Total P&L" value={<span className={pnlColor}>{formatPnl(pnlValue)}</span>} icon={TrendingUp} subtext="Profit & Loss from closed trades."/>
            <StatCard isLoading={isLoading} hasData={!!data && data.totalTrades > 0} title="% Profit" value={<span className={percentageProfitColor}>{`${percentageProfitValue.toFixed(2)}%`}</span>} icon={TrendingUp} subtext="Total P&L / total invested capital." />
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

        <Card>
            <CardHeader className="p-8">
                <CardTitle className="text-xl">Open Trades</CardTitle>
            </CardHeader>
            <CardContent className={cn('p-8 pt-0', !isLoading && 'animate-content-in')}>
              {isLoading ? (
                  <Skeleton className="h-40 w-full" />
              ) : openTradesFromStatus.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Asset</TableHead>
                        <TableHead className="text-right text-xs">Unrealized P/L</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {openTradesFromStatus.map((trade: any) => {
                        const profit = trade.profit_abs ?? 0;
                        const profitPct = trade.profit_pct ?? 0;
                        const isPositive = profit >= 0;
                        const colorClass = isPositive ? 'text-[hsl(var(--chart-2))]' : 'text-[hsl(var(--accent))]';
                        const Icon = isPositive ? ArrowUp : ArrowDown;

                        return (
                          <TableRow key={trade.trade_id}>
                            <TableCell className="font-medium whitespace-nowrap text-xs">{trade.pair}</TableCell>
                            <TableCell className={`text-right font-semibold whitespace-nowrap text-xs ${colorClass}`}>
                              <div className="flex items-center justify-end gap-1">
                                <Icon className="h-3 w-3" />
                                <span>
                                  {profit.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                                  <span className="text-muted-foreground ml-1">({(profitPct * 100).toFixed(2)}%)</span>
                                </span>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
              ) : (
                  <div className="flex items-center justify-center h-24 text-muted-foreground text-sm">
                      No open trades found in status response.
                  </div>
              )}
            </CardContent>
        </Card>
        
        <ClosedTradesTable 
            title="Recent Closed Trades"
            description="A history of all closed trades."
            trades={(data?.closedTrades ?? []).slice(0, 20)}
            isLoading={isLoading}
            hasData={!!data && data.closedTrades.length > 0}
        />
    </div>
  );
}

    