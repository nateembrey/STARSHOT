import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const trades = [
    { pair: 'BTC/USD', type: 'BUY', amount: 0.05, price: 67500, time: '2024-07-07 14:30:15', status: 'Filled' },
    { pair: 'ETH/USD', type: 'SELL', amount: 1.2, price: 3550, time: '2024-07-07 11:15:45', status: 'Filled' },
    { pair: 'SOL/USD', type: 'BUY', amount: 15, price: 150.20, time: '2024-07-07 09:05:02', status: 'Partial Fill' },
    { pair: 'DOGE/USD', type: 'BUY', amount: 10000, price: 0.125, time: '2024-07-06 22:45:10', status: 'Filled' },
    { pair: 'XRP/USD', type: 'SELL', amount: 500, price: 0.478, time: '2024-07-06 18:20:30', status: 'Canceled' },
    { pair: 'ADA/USD', type: 'BUY', amount: 2000, price: 0.39, time: '2024-07-06 15:00:00', status: 'Pending' },
    { pair: 'BTC/USD', type: 'SELL', amount: 0.02, price: 68100, time: '2024-07-05 19:55:18', status: 'Filled' },
]

export function TradesTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Trades</CardTitle>
        <CardDescription>A log of your bot's most recent trading activities.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Pair</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead>Time</TableHead>
              <TableHead className="text-center">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {trades.map((trade, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium">{trade.pair}</TableCell>
                <TableCell>
                  <Badge variant={trade.type === 'BUY' ? "default" : "secondary"} className={trade.type === 'BUY' ? 'bg-green-600/20 text-green-400 border-green-600/30' : 'bg-red-600/20 text-red-400 border-red-600/30'}>
                    {trade.type}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">{trade.amount.toLocaleString()}</TableCell>
                <TableCell className="text-right">${trade.price.toLocaleString()}</TableCell>
                <TableCell>{trade.time}</TableCell>
                <TableCell className="text-center">
                    <Badge 
                      variant="outline"
                      className={
                        trade.status === 'Filled' ? 'text-green-400 border-green-400/50' : 
                        trade.status === 'Pending' ? 'text-yellow-400 border-yellow-400/50' :
                        trade.status === 'Partial Fill' ? 'text-blue-400 border-blue-400/50' :
                        'text-gray-400 border-gray-400/50'
                      }
                    >
                        {trade.status}
                    </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
