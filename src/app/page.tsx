import { Bot, BrainCircuit } from 'lucide-react';
import { UserNav } from '@/components/dashboard/user-nav';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DashboardTab } from '@/components/dashboard/dashboard-tab';

export default function DashboardPage() {
  return (
    <div className="flex-col md:flex bg-background min-h-screen">
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur-sm z-10">
        <div className="flex h-14 items-center px-4">
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">AI-COMPARE</h1>
          <div className="ml-auto flex items-center space-x-4">
            <UserNav />
          </div>
        </div>
      </header>
      <main className="flex-1 space-y-2 p-4">
        <Tabs defaultValue="chatgpt" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 sm:max-w-[360px]">
            <TabsTrigger value="chatgpt">
              <Bot className="mr-2 h-4 w-4" />
              CHATGPT
            </TabsTrigger>
            <TabsTrigger value="gemini">
              <BrainCircuit className="mr-2 h-4 w-4" />
              GEMINI
            </TabsTrigger>
          </TabsList>
          <TabsContent value="chatgpt" className="space-y-4">
            <DashboardTab modelName="ChatGPT" />
          </TabsContent>
          <TabsContent value="gemini" className="space-y-4">
            <DashboardTab modelName="Gemini" />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
