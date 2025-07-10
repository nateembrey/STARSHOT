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


export function DashboardTab({ modelName }: { modelName: string }) {
  const isGpt = modelName === 'ChatGPT';
  // Mock data - in a real app, this would come from an API
  const totalRevenue = isGpt ? '$45,231.89' : '$39,121.42';
  const pnl = isGpt ? '+$2,501.32' : '+$1,890.12';
  const pnlPercentage = isGpt ? '+20.1%' : '+18.5%';
  const trades = isGpt ? '1,230' : '1,150';
  const winRate = isGpt ? '72.5%' : '70.1%';

  const recentTrades = isGpt ? [
    {
      asset: 'BTC/USD',
      type: 'BUY',
      amount: '0.5 BTC',
      price: '$68,123.45',
      profit: '+$543.21',
      status: 'Closed',
    },
    {
      asset: 'ETH/USD',
      type: 'SELL',
      amount: '10 ETH',
      price: '$3,543.21',
      profit: '+$1,201.50',
      status: 'Closed',
    },
    {
      asset: 'SOL/USD',
      type: 'BUY',
      amount: '100 SOL',
      price: '$165.80',
      profit: '-$89.30',
      status: 'Closed',
    },
     {
      asset: 'ADA/USD',
      type: 'BUY',
      amount: '5000 ADA',
      price: '$0.45',
      profit: 'Pending',
      status: 'Open',
    },
     {
      asset: 'XRP/USD',
      type: 'SELL',
      amount: '10000 XRP',
      price: '$0.52',
      profit: '+$231.98',
      status: 'Closed',
    },
  ] : [
    {
        asset: 'BTC/USD',
        type: 'BUY',
        amount: '0.4 BTC',
        price: '$68,223.45',
        profit: '+$443.21',
        status: 'Closed',
      },
      {
        asset: 'ETH/USD',
        type: 'SELL',
        amount: '8 ETH',
        price: '$3,553.21',
        profit: '+$1,101.50',
        status: 'Closed',
      },
      {
        asset: 'DOGE/USD',
        type: 'BUY',
        amount: '100000 DOGE',
        price: '$0.158',
        profit: '+$1500.00',
        status: 'Closed',
      },
      {
        asset: 'LINK/USD',
        type: 'BUY',
        amount: '300 LINK',
        price: '$18.50',
        profit: 'Pending',
        status: 'Open',
      },
      {
        asset: 'AVAX/USD',
        type: 'BUY',
        amount: '150 AVAX',
        price: '$35.70',
        profit: '-$112.50',
        status: 'Closed',
      },
  ];

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

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRevenue}</div>
            <p className="text-xs text-muted-foreground">
              {pnl} from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">P&L ({modelName})</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${pnl.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>{pnl}</div>
            <p className="text-xs text-muted-foreground">
              {pnlPercentage} vs last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Trades</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{trades}</div>
            <p className="text-xs text-muted-foreground">
              +180 since last hour
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{winRate}</div>
            <p className="text-xs text-muted-foreground">
              +1.2% since yesterday
            </p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Performance Overview</CardTitle>
            <CardDescription>January - July</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <ChartContainer config={chartConfig} className="h-[350px] w-full">
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
          <CardHeader>
            <CardTitle>Recent Trades</CardTitle>
            <CardDescription>
              {`The latest trades executed by ${modelName}.`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Profit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentTrades.map((trade, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{trade.asset}</TableCell>
                    <TableCell>
                      <Badge
                        variant={trade.type === 'BUY' ? 'default' : 'destructive'}
                        className="flex items-center gap-1 w-fit"
                      >
                        {trade.type === 'BUY' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                        {trade.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                        <Badge variant={trade.status === 'Open' ? 'outline' : 'secondary'}>
                            {trade.status}
                        </Badge>
                    </TableCell>
                    <TableCell className={`text-right font-semibold ${trade.profit === 'Pending' ? '' : trade.profit.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>
                      {trade.profit}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
