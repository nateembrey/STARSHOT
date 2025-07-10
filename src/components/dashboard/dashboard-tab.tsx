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
  ArrowUp,
  ArrowDown,
  TrendingUp,
} from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';


// Data structure we expect from the API
interface TradingData {
  totalRevenue: string;
  pnl: string;
  pnlPercentage: string;
  trades: string;
  winRate: string;
  recentTrades: {
    asset: string;
    type: string;
    status: string;
    profit: string;
  }[];
}

export function DashboardTab({ modelName }: { modelName: string }) {
  const [data, setData] = React.useState<TradingData | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/trading-data?model=${modelName.toLowerCase()}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch data: ${response.statusText}`);
        }
        const result: TradingData = await response.json();
        setData(result);
      } catch (err: any) {
        setError(err.message);
        // On error, use mock data to keep the UI functional
        setData(getMockData(modelName)); 
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [modelName]);

  const isGpt = modelName === 'ChatGPT';
  
  // Use fetched data if available, otherwise fallback to mock data (or initial empty state)
  const displayData = data || getMockData(modelName);

  const chartData = isGpt ? [
    { month: 'Jan', gpt: 4000, gemini: 2400 },
    { month: 'Feb', gpt: 3000, gemini: 1398 },
    { month: 'Mar', gpt: 2000, gemini: 9800 },
    { month: 'Apr', gpt: 2780, gemini: 3908 },
    { month: 'May', gpt: 1890, gemini: 4800 },
    { month: 'Jun', gpt: 2390, gemini: 3800 },
    { month: 'Jul', gpt: 3490, gemini: 4300 },
    ] : [
    { month: 'Jan', gpt: 3800, gemini: 2600 },
    { month: 'Feb', gpt: 3200, gemini: 1598 },
    { month: 'Mar', gpt: 2200, gemini: 8800 },
    { month: 'Apr', gpt: 2980, gemini: 4108 },
    { month: 'May', gpt: 2090, gemini: 5200 },
    { month: 'Jun', gpt: 2590, gemini: 4000 },
    { month: 'Jul', gpt: 3690, gemini: 4500 },
  ];

  const chartConfig = {
    gpt: {
      label: 'ChatGPT',
      color: 'hsl(var(--chart-1))',
    },
    gemini: {
      label: 'Gemini',
      color: 'hsl(var(--chart-2))',
    },
  };
  
  const singleModelChartConfig = isGpt ? {
    performance: {
      label: "ChatGPT",
      color: 'hsl(var(--chart-1))',
    }
  } : {
    performance: {
      label: "Gemini",
      color: 'hsl(var(--chart-2))',
    }
  };

  const singleModelChartData = chartData.map(d => ({ month: d.month, performance: isGpt ? d.gpt : d.gemini }));

  if (error) {
    return (
        <div className="flex items-center justify-center h-full">
            <Card className="m-4 p-4 bg-destructive/10 border-destructive">
                <CardHeader>
                    <CardTitle className="text-destructive">Error Fetching Data</CardTitle>
                    <CardDescription className="text-destructive/80">
                        Could not fetch live trading data. Displaying mock data instead.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-destructive">{error}</p>
                </CardContent>
            </Card>
        </div>
    )
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
             {isLoading ? <Skeleton className="h-7 w-3/4" /> : <div className="text-xl font-bold">{displayData.totalRevenue}</div>}
             {isLoading ? <Skeleton className="h-4 w-1/2 mt-1" /> : <p className="text-xs text-muted-foreground">{displayData.pnl} from last month</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
            <CardTitle className="text-sm font-medium">P&L ({modelName})</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            {isLoading ? <Skeleton className="h-7 w-3/4" /> : <div className={`text-xl font-bold ${displayData.pnl.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>{displayData.pnl}</div>}
            {isLoading ? <Skeleton className="h-4 w-1/2 mt-1" /> :<p className="text-xs text-muted-foreground">{displayData.pnlPercentage} vs last month</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
            <CardTitle className="text-sm font-medium">Total Trades</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            {isLoading ? <Skeleton className="h-7 w-3/4" /> : <div className="text-xl font-bold">{displayData.trades}</div>}
            {isLoading ? <Skeleton className="h-4 w-1/2 mt-1" /> : <p className="text-xs text-muted-foreground">+180 since last hour</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
            <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            {isLoading ? <Skeleton className="h-7 w-3/4" /> : <div className="text-xl font-bold">{displayData.winRate}</div>}
            {isLoading ? <Skeleton className="h-4 w-1/2 mt-1" /> : <p className="text-xs text-muted-foreground">+1.2% since yesterday</p>}
          </CardContent>
        </Card>
      </div>

      <Card className="w-full">
        <CardHeader className="p-4">
          <CardTitle className="text-lg">{modelName} Performance</CardTitle>
          <CardDescription>January - July</CardDescription>
        </CardHeader>
        <CardContent className="pl-2 pr-4 pb-4">
          <ChartContainer config={singleModelChartConfig} className="h-[150px] w-full">
              <LineChart data={singleModelChartData}>
                  <CartesianGrid vertical={false} />
                  <XAxis 
                      dataKey="month" 
                      tickLine={false}
                      tickMargin={10}
                      axisLine={false}
                      />
                  <YAxis 
                      tickLine={false}
                      tickMargin={10}
                      axisLine={false}
                      tickFormatter={(value) => `$${value / 1000}k`}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line dataKey="performance" type="monotone" stroke={`var(--color-performance)`} strokeWidth={2} dot={false} name={modelName} />
              </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader className="p-4">
            <CardTitle className="text-lg">Performance Comparison</CardTitle>
            <CardDescription>ChatGPT vs. Gemini</CardDescription>
          </CardHeader>
          <CardContent className="pl-2 pr-4 pb-4">
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <LineChart data={chartData}>
                    <CartesianGrid vertical={false} />
                    <XAxis 
                        dataKey="month" 
                        tickLine={false}
                        tickMargin={10}
                        axisLine={false}
                        />
                    <YAxis 
                        tickLine={false}
                        tickMargin={10}
                        axisLine={false}
                        tickFormatter={(value) => `$${value / 1000}k`}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Line dataKey="gpt" type="monotone" stroke="var(--color-gpt)" strokeWidth={2} dot={false} name="ChatGPT" />
                    <Line dataKey="gemini" type="monotone" stroke="var(--color-gemini)" strokeWidth={2} dot={false} name="Gemini" />
                </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card className="lg:col-span-3">
          <CardHeader className="p-4">
            <CardTitle className="text-lg">Recent Trades</CardTitle>
            <CardDescription>
              {`The latest trades executed by ${modelName}.`}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0">
             {isLoading ? (
                <div className="space-y-2">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                </div>
             ) : (
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead className="h-10 px-2">Asset</TableHead>
                    <TableHead className="h-10 px-2">Type</TableHead>
                    <TableHead className="h-10 px-2">Status</TableHead>
                    <TableHead className="h-10 px-2 text-right">Profit</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {displayData.recentTrades.map((trade, index) => (
                    <TableRow key={index}>
                        <TableCell className="font-medium p-2">{trade.asset}</TableCell>
                        <TableCell className="p-2">
                        <Badge
                            variant={'secondary'}
                            className={`flex items-center gap-1 w-fit border-transparent ${
                            trade.type === 'BUY'
                                ? 'bg-muted/70 text-card-foreground hover:bg-muted/80'
                                : 'bg-black text-white hover:bg-black/80'
                            }`}
                        >
                            {trade.type === 'BUY' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                            {trade.type}
                        </Badge>
                        </TableCell>
                        <TableCell className="p-2">
                            <Badge variant={trade.status === 'Open' ? 'outline' : 'secondary'}
                            className={trade.status === 'Open' ? 'border-accent text-foreground' : ''}
                            >
                                {trade.status}
                            </Badge>
                        </TableCell>
                        <TableCell className={`p-2 text-right font-semibold ${trade.profit === 'Pending' ? 'text-muted-foreground' : trade.profit.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>
                        {trade.profit}
                        </TableCell>
                    </TableRow>
                    ))}
                </TableBody>
                </Table>
             )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}


function getMockData(modelName: string): TradingData {
  const isGpt = modelName === 'ChatGPT';
  return {
    totalRevenue: isGpt ? '$45,231.89' : '$39,121.42',
    pnl: isGpt ? '+$2,501.32' : '+$1,890.12',
    pnlPercentage: isGpt ? '+20.1%' : '+18.5%',
    trades: isGpt ? '1,230' : '1,150',
    winRate: isGpt ? '72.5%' : '70.1%',
    recentTrades: isGpt ? [
      { asset: 'BTC/USD', type: 'BUY', profit: '+$543.21', status: 'Closed' },
      { asset: 'ETH/USD', type: 'SELL', profit: '+$1,201.50', status: 'Closed' },
      { asset: 'SOL/USD', type: 'BUY', profit: '-$89.30', status: 'Closed' },
      { asset: 'ADA/USD', type: 'BUY', profit: 'Pending', status: 'Open' },
      { asset: 'XRP/USD', type: 'SELL', profit: '+$231.98', status: 'Closed' },
    ] : [
      { asset: 'BTC/USD', type: 'BUY', profit: '+$443.21', status: 'Closed' },
      { asset: 'ETH/USD', type: 'SELL', profit: '+$1,101.50', status: 'Closed' },
      { asset: 'DOGE/USD', type: 'BUY', profit: '+$1500.00', status: 'Closed' },
      { asset: 'LINK/USD', type: 'BUY', profit: 'Pending', status: 'Open' },
      { asset: 'AVAX/USD', type: 'BUY', profit: '-$112.50', status: 'Closed' },
    ],
  };
}
