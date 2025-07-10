"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEffect, useState } from "react";

const mockLogs = [
  "[INFO] - Initializing trading bot...",
  "[INFO] - Connecting to exchange API...",
  "[SUCCESS] - Connection established.",
  "[INFO] - Fetching market data for BTC/USD.",
  "[INFO] - Analyzing market trends.",
  "[ALERT] - High volatility detected for ETH/USD.",
  "[TRADE] - Executing BUY order for 0.05 BTC at $67,500.",
  "[SUCCESS] - Order filled successfully.",
  "[INFO] - Monitoring open position.",
  "[INFO] - No new trade signals found.",
  "[ERROR] - Failed to fetch data for ADA/USD. Retrying in 30s.",
  "[INFO] - Bot is running. Current P/L: +$250.34",
  "[TRADE] - Executing SELL order for 1.2 ETH at $3,550.",
  "[SUCCESS] - Order filled successfully. Realized P/L: +$75.10",
  "[INFO] - Updating portfolio balance.",
];

export function LogsTab() {
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    const initialLogs = mockLogs.slice(0, 6);
    setLogs(initialLogs);

    let logIndex = 6;
    const interval = setInterval(() => {
      if (logIndex < mockLogs.length) {
        setLogs(prevLogs => [...prevLogs, mockLogs[logIndex]]);
        logIndex++;
      } else {
        clearInterval(interval);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Trading Logs</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[450px] w-full">
          <div className="bg-black rounded-md p-4 font-code text-sm">
            {logs.map((log, index) => {
              const color = log.startsWith("[ERROR]")
                ? "text-red-500"
                : log.startsWith("[SUCCESS]")
                ? "text-green-500"
                : log.startsWith("[ALERT]")
                ? "text-yellow-500"
                : log.startsWith("[TRADE]")
                ? "text-primary"
                : "text-gray-400";
              return (
                <div key={index} className="flex">
                  <span className="text-gray-600 mr-4">{`[${new Date().toLocaleTimeString()}]`}</span>
                  <p className={color}>{log}</p>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
