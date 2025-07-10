

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
import {
    DollarSign,
    Activity,
    TrendingUp,
    Percent,
} from 'lucide-react';
import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import {
  Area,
  Bar,
  BarChart,
  AreaChart,
  CartesianGrid,
  Legend,
  Rectangle,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ChartContainer, ChartTooltipContent, ChartTooltip } from '@/components/ui/chart';

interface Trade {
    asset: string;
    type: 'BUY' | 'SELL';
    status: 'Open' | 'Closed';
    profitPercentage: number | null;
    profitAbs: number | null;
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

interface TradingData {
  totalBalance: number;
  pnl: number;
  totalTrades: number;
  winRate: number;
  profitRatio: number;
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
                        <Skeleton className="h-7 w-3/4" />
                        {subtext && <Skeleton className="h-4 w-1/2 mt-1" />}
                    </>
                ) : hasData ? (
                    <>
                        <div className="text-xl font-bold">{value}</div>
                        {subtext && <p className="text-xs text-muted-foreground">{subtext}</p>}
                    </>
                ) : (
                    <>
                        <div className="text-xl font-bold text-muted-foreground/50">N/A</div>
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
                                    <TableHead className="px-2">Asset</TableHead>
                                    <TableHead className="px-2">Type</TableHead>
                                    <TableHead className="px-2">Amount</TableHead>
                                    <TableHead className="px-2">Open Rate</TableHead>
                                    <TableHead className="px-2">{isClosedTrades ? "Close Rate" : "Open Date"}</TableHead>
                                    <TableHead className="px-2 text-right">{isClosedTrades ? "Profit" : "Status"}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {trades.map((trade, index) => (
                                    <TableRow key={index}>
                                        <TableCell className="font-medium p-2 whitespace-nowrap">{trade.asset}</TableCell>
                                        <TableCell className="p-2">
                                            <Badge variant={trade.type === 'BUY' ? 'secondary' : 'default'} className={`text-xs ${trade.type === 'BUY' ? 'bg-blue-900/50 text-blue-300' : 'bg-purple-900/50 text-purple-300'}`}>
                                                {trade.type}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="p-2">{trade.amount.toFixed(4)}</TableCell>
                                        <TableCell className="p-2">{trade.openRate.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</TableCell>
                                        <TableCell className="p-2 whitespace-nowrap">{isClosedTrades ? (trade.closeRate ? trade.closeRate.toLocaleString('en-US', { style: 'currency', currency: 'USD' }) : 'N/A') : format(new Date(trade.openDate), 'PPp')}</TableCell>
                                        <TableCell className="p-2 text-right font-semibold whitespace-nowrap">
                                            {isClosedTrades ? (
                                                <span className={(trade.profitAbs ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'}>
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
                <div className="h-[250px]">
                    <ChartContainer config={{
                        profit: {
                            label: "Profit",
                            color: "hsl(var(--primary))",
                        },
                    }}>
                        <BarChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.5)" />
                            <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                            <ChartTooltip
                                cursor={{ fill: 'hsl(var(--muted))' }}
                                content={<ChartTooltipContent />}
                            />
                            <Bar dataKey="profit" name="Profit">
                                {data.map((entry, index) => (
                                    <Rectangle key={`cell-${index}`} fill={entry.profit >= 0 ? 'hsl(var(--primary))' : 'hsl(var(--destructive))'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ChartContainer>
                </div>
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
                <div className="h-[250px]">
                   <ChartContainer config={{
                        cumulativeProfit: {
                            label: "Cumulative Profit",
                            color: "hsl(var(--primary))",
                        },
                   }}>
                        <AreaChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.5)" />
                            <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                            <ChartTooltip
                                cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 1 }}
                                content={<ChartTooltipContent />}
                            />
                            <defs>
                                <linearGradient id="colorCumulative" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <Area type="monotone" dataKey="cumulativeProfit" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorCumulative)" />
                        </AreaChart>
                    </ChartContainer>
                </div>
            )}
        </CardContent>
    </Card>
);

export function DashboardTab({ modelName }: { modelName: string }) {
  const [data, setData] = React.useState<TradingData | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const { toast } = useToast();

  React.useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/trading-data?model=${modelName.toLowerCase()}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Failed to fetch data: ${response.statusText}`);
        }
        const result: TradingData = await response.json();
        setData(result);
      } catch (err: any) {
        console.error(`Error fetching ${modelName} data:`, err);
        toast({
            variant: "destructive",
            title: `Error fetching ${modelName} data`,
            description: err.message,
        });
        setData(null);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [modelName, toast]);

  const hasData = !!data;
  const pnlValue = data?.pnl ?? 0;
  const pnlColor = pnlValue >= 0 ? 'text-green-400' : 'text-red-400';

  return (
    <div className="space-y-4">
        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard isLoading={isLoading} hasData={hasData && (data?.totalBalance ?? 0) > 0} title="Total Balance" value={data?.totalBalance.toLocaleString('en-US', { style: 'currency', currency: 'USD' }) ?? 'N/A'} icon={DollarSign} subtext="Initial capital + P&L" />
            <StatCard isLoading={isLoading} hasData={hasData} title="Total P&L" value={<span className={pnlColor}>{pnlValue.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</span>} icon={TrendingUp} subtext={`${((data?.profitRatio ?? 0) * 100).toFixed(2)}% of balance`} />
            <StatCard isLoading={isLoading} hasData={hasData && (data?.totalTrades ?? 0) > 0} title="Total Trades" value={data?.totalTrades.toLocaleString() ?? 'N/A'} icon={Activity} subtext="Number of closed trades" />
            <StatCard isLoading={isLoading} hasData={hasData && (data?.totalTrades ?? 0) > 0} title="Win Rate" value={`${((data?.winRate ?? 0) * 100).toFixed(1)}%`} icon={Percent} subtext={`${data?.winningTrades ?? 0} Wins / ${data?.losingTrades ?? 0} Losses`} />
        </div>
        
        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ProfitLossChart data={data?.tradeHistoryForCharts ?? []} isLoading={isLoading} hasData={hasData && (data?.tradeHistoryForCharts?.length ?? 0) > 0} />
            <CumulativeProfitChart data={data?.cumulativeProfitHistory ?? []} isLoading={isLoading} hasData={hasData && (data?.cumulativeProfitHistory?.length ?? 0) > 0} />
        </div>

        {/* Open and Closed Trades Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
             <TradesTable 
                title="Open Trades"
                description="Trades that are currently active."
                trades={data?.openTrades ?? []}
                isLoading={isLoading}
                hasData={hasData}
            />
            <TradesTable 
                title="Recent Closed Trades"
                description="The last 10 closed trades."
                trades={(data?.closedTrades ?? []).slice(0, 10)}
                isLoading={isLoading}
                hasData={hasData}
            />
        </div>

    </div>
  );
}
