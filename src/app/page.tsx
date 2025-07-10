
'use client';

import { UserNav } from '@/components/dashboard/user-nav';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DashboardTab, type TradingData } from '@/components/dashboard/dashboard-tab';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Notifications } from '@/components/dashboard/notifications';
import { cn } from '@/lib/utils';

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
  const [activeTab, setActiveTab] = useState('chatgpt');
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);


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
    fetchAllData(true);
  }, [fetchAllData]);

  useEffect(() => {
    if (isVisible) {
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
  
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
    touchEndX.current = e.targetTouches[0].clientX; 
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    const swipeThreshold = 50; 
    const swipeDistance = touchStartX.current - touchEndX.current;

    if (swipeDistance > swipeThreshold) {
      // Swiped left
      if (activeTab === 'chatgpt') {
        setActiveTab('gemini');
      }
    } else if (swipeDistance < -swipeThreshold) {
      // Swiped right
      if (activeTab === 'gemini') {
        setActiveTab('chatgpt');
      }
    }
  };

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <div className="flex-col md:flex bg-background min-h-screen">
        <header className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 shadow-md">
          <div className="flex h-20 items-center px-4 md:px-16">
            <div className="flex flex-1 items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 md:h-6 md:w-6 text-[hsl(var(--chart-2))]">
                  <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(45 12 12)"/>
                  <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(-45 12 12)"/>
                </svg>
                <h1 className="text-2xl font-bold text-white" style={{ letterSpacing: '0.3em' }}>
                  <span className="hidden md:inline">STARSHOT</span>
                </h1>
            </div>
            <div className="flex justify-center">
              <TabsList className="grid w-full grid-cols-2 max-w-[200px] sm:max-w-[240px] rounded-full">
                <TabsTrigger value="chatgpt" className="rounded-full">
                  CHATGPT
                </TabsTrigger>
                <TabsTrigger value="gemini" className="rounded-full">
                  GEMINI
                </TabsTrigger>
              </TabsList>
            </div>
            <div className="flex flex-1 items-center justify-end space-x-2">
              <Notifications count={newTradesCount} onClear={handleClearNotifications} />
              <UserNav />
            </div>
          </div>
        </header>
        <div onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd} className="overflow-x-hidden">
            <main className="flex-1">
                <div
                    className={cn(
                        'flex w-[200%] transition-transform duration-500 ease-in-out',
                        activeTab === 'gemini' ? '-translate-x-1/2' : 'translate-x-0'
                    )}
                >
                    <div className="w-1/2 flex-shrink-0 space-y-4 p-8 pt-6 md:p-16">
                        <DashboardTab modelName="ChatGPT" data={chatGptData} isLoading={isLoading} />
                    </div>
                    <div className="w-1/2 flex-shrink-0 space-y-4 p-8 pt-6 md:p-16">
                        <DashboardTab modelName="Gemini" data={geminiData} isLoading={isLoading} />
                    </div>
                </div>
            </main>
        </div>
      </div>
    </Tabs>
  );
}
