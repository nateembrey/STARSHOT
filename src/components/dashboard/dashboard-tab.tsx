
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
  Percent,
} from 'lucide-react';
import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

// Data structure we expect from the API
interface TradingData {
  totalRevenue: number;
  pnl: number;
  trades: number;
  winRate: number;
  pnlPercentage: number;
  recentTrades: {
    asset: string;
    type: string;
    status: string;
    profit: string;
    profitAbs: number | null;
  }[];
}

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
        setData(null); // Clear data on error
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [modelName, toast]);

  const displayData = data;

  const renderCardContent = (value: React.ReactNode, subtext?: string) => {
    if (isLoading) {
      return (
        <>
          <Skeleton className="h-7 w-3/4" />
          <Skeleton className="h-4 w-1/2 mt-1" />
        </>
      )
    }
     if (displayData === null) {
        return (
            <>
                <div className="text-xl font-bold text-muted-foreground/50">N/A</div>
                <p className="text-xs text-muted-foreground/50">No data available</p>
            </>
        )
    }
    return (
        <>
            <div className="text-xl font-bold">{value}</div>
            {subtext && <p className="text-xs text-muted-foreground">{subtext}</p>}
        </>
    )
  }

  const pnlValue = displayData?.pnl ?? 0;
  const pnlColor = pnlValue >= 0 ? 'text-green-500' : 'text-red-500';

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
            <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
             {renderCardContent(
                displayData?.totalRevenue.toLocaleString('en-US', { style: 'currency', currency: 'USD' }),
                `Initial + P&L`
             )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
            <CardTitle className="text-sm font-medium">Total P&L</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            {renderCardContent(
                <span className={pnlColor}>
                    {pnlValue.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                </span>,
                displayData ? `${(displayData.pnlPercentage * 100).toFixed(2)}% of total trades` : undefined
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
            <CardTitle className="text-sm font-medium">Total Trades</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            {renderCardContent(
                displayData?.trades.toLocaleString(),
                "Completed trades"
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
            <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            {renderCardContent(
                displayData ? `${(displayData.winRate * 100).toFixed(1)}%` : "0%",
                "Based on closed trades"
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
          <CardHeader className="p-4">
            <CardTitle className="text-lg">Recent Trades</CardTitle>
            <CardDescription>
              {`The 5 most recent trades executed by ${modelName}.`}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0">
             {isLoading ? (
                <div className="space-y-2">
                    {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                </div>
             ) : !displayData || displayData.recentTrades.length === 0 ? (
                <div className="flex items-center justify-center h-24 text-muted-foreground">
                    No recent trades found.
                </div>
             ) : (
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead className="h-10 px-2">Asset</TableHead>
                    <TableHead className="h-10 px-2">Type</TableHead>
                    <TableHead className="h-10 px-2">Status</TableHead>
                    <TableHead className="h-10 px-2 text-right">Profit %</TableHead>
                    <TableHead className="h-10 px-2 text-right">Profit (USD)</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {displayData.recentTrades.map((trade, index) => (
                    <TableRow key={index}>
                        <TableCell className="font-medium p-2">{trade.asset}</TableCell>
                        <TableCell className="p-2">
                        <Badge
                            variant={'secondary'}
                            className={`flex items-center gap-1 w-fit border-transparent text-xs ${
                            trade.type === 'BUY'
                                ? 'bg-blue-900/50 text-blue-300 hover:bg-blue-900/80'
                                : 'bg-purple-900/50 text-purple-300 hover:bg-purple-900/80'
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
                        <TableCell className={`p-2 text-right font-semibold ${trade.profit === 'Pending' ? 'text-muted-foreground' : parseFloat(trade.profit) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {trade.profit}
                        </TableCell>
                         <TableCell className={`p-2 text-right font-semibold ${trade.profitAbs === null ? 'text-muted-foreground' : (trade.profitAbs ?? 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {trade.profitAbs === null ? 'N/A' : trade.profitAbs.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                        </TableCell>
                    </TableRow>
                    ))}
                </TableBody>
                </Table>
             )}
          </CardContent>
        </Card>
    </div>
  );
}
