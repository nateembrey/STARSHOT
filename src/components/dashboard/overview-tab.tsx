"use client"

import { DollarSign, Wallet, Activity, TrendingUp } from "lucide-react"
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ChartConfig, ChartContainer, ChartTooltipContent } from "@/components/ui/chart"

const pnlData = [
  { date: "2024-07-01", pnl: 250 },
  { date: "2024-07-02", pnl: 305 },
  { date: "2024-07-03", pnl: 280 },
  { date: "2024-07-04", pnl: 450 },
  { date: "2024-07-05", pnl: 400 },
  { date: "2024-07-06", pnl: 520 },
  { date: "2024-07-07", pnl: 590 },
];

const volumeData = [
    { pair: "BTC/USD", volume: 580000 },
    { pair: "ETH/USD", volume: 450000 },
    { pair: "SOL/USD", volume: 320000 },
    { pair: "DOGE/USD", volume: 210000 },
    { pair: "XRP/USD", volume: 150000 },
]

const pnlChartConfig = {
  pnl: {
    label: "P/L",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig

const volumeChartConfig = {
    volume: {
        label: "Volume",
        color: "hsl(var(--chart-2))",
    },
} satisfies ChartConfig

export function OverviewTab() {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$45,231.89</div>
            <p className="text-xs text-muted-foreground">+20.1% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">24h Volume</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$1,250,345.00</div>
            <p className="text-xs text-muted-foreground">+180.1% from last day</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">72.5%</div>
            <p className="text-xs text-muted-foreground">+5.2% from last week</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Bots</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">Running on 5 pairs</p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Profit & Loss (Last 7 Days)</CardTitle>
            <CardDescription>A summary of your trading performance.</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <ChartContainer config={pnlChartConfig} className="h-[300px] w-full">
              <LineChart data={pnlData} margin={{ left: 12, right: 12 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => value.slice(5)} />
                <YAxis tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => `$${value}`} />
                <Tooltip cursor={{ strokeDasharray: '3 3', fill: 'hsl(var(--muted))' }} content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="pnl" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={false} />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card className="col-span-4 lg:col-span-3">
          <CardHeader>
            <CardTitle>Volume by Pair (24h)</CardTitle>
            <CardDescription>Trading volume across different pairs.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={volumeChartConfig} className="h-[300px] w-full">
                <BarChart data={volumeData} layout="vertical" margin={{ left: 10, right: 10 }}>
                    <CartesianGrid horizontal={false} />
                    <XAxis type="number" dataKey="volume" hide />
                    <YAxis type="category" dataKey="pair" tickLine={false} axisLine={false} tickMargin={8} width={60} />
                    <Tooltip cursor={{ fill: 'hsl(var(--muted))' }} content={<ChartTooltipContent />} />
                    <Bar dataKey="volume" fill="hsl(var(--chart-2))" radius={4} />
                </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
