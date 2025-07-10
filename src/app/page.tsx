
'use client';

import { UserNav } from '@/components/dashboard/user-nav';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DashboardTab, type TradingData } from '@/components/dashboard/dashboard-tab';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Notifications } from '@/components/dashboard/notifications';

function usePageVisibility() {
  const [isVisible, setIsVisible] = useState(typeof document === 'undefined' || document.visibilityState === 'visible');

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const handleVisibilityChange = () => {
      setIsVisible(document.visibilityState === 'visible');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return isVisible;
}


export default function DashboardPage() {
  const [chatGptData, setChatGptData] = useState<TradingData | null>(null);
  const [geminiData, setGeminiData] = useState<TradingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newTradesCount, setNewTradesCount] = useState(0);
  const lastChatGptTradeCount = useRef<number | null>(null);
  const lastGeminiTradeCount = useRef<number | null>(null);
  const isVisible = usePageVisibility();

  const { toast } = useToast();

  const fetchDataForModel = useCallback(async (model: 'chatgpt' | 'gemini'): Promise<TradingData | null> => {
    try {
      const response = await fetch(`/api/trading-data?model=${model}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to fetch data for ${model}`);
      }
      return await response.json();
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: `Error fetching ${model} data`,
        description: err.message,
      });
      return null;
    }
  }, [toast]);

  const fetchAllData = useCallback(async (isInitialFetch = false) => {
     if (isInitialFetch) { 
       setIsLoading(true);
     }
     const [chatgpt, gemini] = await Promise.all([
       fetchDataForModel('chatgpt'),
       fetchDataForModel('gemini'),
     ]);
     
     setChatGptData(chatgpt);
     setGeminiData(gemini);
     
     let newlyCompleted = 0;
     if (chatgpt) {
        if (lastChatGptTradeCount.current !== null && chatgpt.totalTrades > lastChatGptTradeCount.current) {
            newlyCompleted += (chatgpt.totalTrades - lastChatGptTradeCount.current);
        }
        lastChatGptTradeCount.current = chatgpt.totalTrades;
     }

     if (gemini) {
         if (lastGeminiTradeCount.current !== null && gemini.totalTrades > lastGeminiTradeCount.current) {
            newlyCompleted += (gemini.totalTrades - lastGeminiTradeCount.current);
        }
        lastGeminiTradeCount.current = gemini.totalTrades;
     }

     if (newlyCompleted > 0) {
        setNewTradesCount(prev => prev + newlyCompleted);
     }

     if (isInitialFetch) {
        setIsLoading(false);
     }
  }, [fetchDataForModel]);

  useEffect(() => {
    fetchAllData(true); // Initial fetch right away
  }, [fetchAllData]);

  useEffect(() => {
    if (isVisible) {
      // Fetch immediately when tab becomes visible
      fetchAllData(false);

      const intervalId = setInterval(() => {
        fetchAllData(false);
      }, 15000);

      return () => {
        clearInterval(intervalId);
      };
    }
  }, [isVisible, fetchAllData]);


  const handleClearNotifications = () => {
    setNewTradesCount(0);
  };


  return (
    <Tabs defaultValue="chatgpt">
      <div className="flex-col md:flex bg-background min-h-screen">
        <header className="border-b sticky top-0 bg-background/95 backdrop-blur-sm z-10">
          <div className="flex h-16 items-center px-4 md:px-8">
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-accent"><path d="m12 11 4 4-4 4-4-4 4-4Z"/><path d="M20.7 4.2a.9.9 0 0 0-.7-.7l-6-2.5a.9.9 0 0 0-.7 0l-6 2.5a.9.9 0 0 0-.7.7c-.1.3 0 .6.2.8l4.9 4.9-3.2 3.2a.9.9 0 0 0 0 1.3l4.1 4.1c.4.4 1 .4 1.3 0l4.1-4.1a.9.9 0 0 0 0-1.3l-3.2-3.2 4.9-4.9c.2-.2.3-.5.2-.8Z"/><path d="m12 2 4.9 2-4.9 2-4.9-2 4.9-2Z"/></svg>
              STARSHOT
            </h1>
            <div className="flex-1 flex justify-center">
              <TabsList className="grid w-full grid-cols-2 sm:max-w-[280px] rounded-full">
                <TabsTrigger value="chatgpt" className="rounded-full">
                  CHATGPT
                </TabsTrigger>
                <TabsTrigger value="gemini" className="rounded-full">
                  GEMINI
                </TabsTrigger>
              </TabsList>
            </div>
            <div className="flex items-center space-x-2">
              <Notifications count={newTradesCount} onClear={handleClearNotifications} />
              <UserNav />
            </div>
          </div>
        </header>
        <main className="flex-1 space-y-4 p-4 pt-6 md:p-8">
           <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tight">Dashboard Overview</h2>
              <p className="text-muted-foreground">
                An overview of each bot's trading performance.
              </p>
            </div>
          <TabsContent value="chatgpt" className="space-y-4">
            <DashboardTab modelName="ChatGPT" data={chatGptData} isLoading={isLoading} />
          </TabsContent>
          <TabsContent value="gemini" className="space-y-4">
            <DashboardTab modelName="Gemini" data={geminiData} isLoading={isLoading} />
          </TabsContent>
        </main>
      </div>
    </Tabs>
  );
}
