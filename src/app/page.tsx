import { UserNav } from '@/components/dashboard/user-nav';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DashboardTab } from '@/components/dashboard/dashboard-tab';

export default function DashboardPage() {
  return (
    <Tabs defaultValue="chatgpt">
      <div className="flex-col md:flex bg-background min-h-screen">
        <header className="border-b sticky top-0 bg-background/95 backdrop-blur-sm z-10">
          <div className="flex h-14 items-center px-4">
            <h1 className="text-2xl font-bold tracking-tight text-white">STARSHOT</h1>
            <div className="flex-1 flex justify-center">
              <TabsList className="grid w-full grid-cols-2 sm:max-w-[240px] rounded-full">
                <TabsTrigger value="chatgpt" className="rounded-full">
                  CHATGPT
                </TabsTrigger>
                <TabsTrigger value="gemini" className="rounded-full">
                  GEMINI
                </TabsTrigger>
              </TabsList>
            </div>
            <div className="flex items-center space-x-4">
              <UserNav />
            </div>
          </div>
        </header>
        <main className="flex-1 space-y-4 p-4 pt-6">
           <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tight">Bot Performance Comparison</h2>
              <p className="text-muted-foreground">
                An overview of each bot's trading performance.
              </p>
            </div>
          <TabsContent value="chatgpt" className="space-y-4">
            <DashboardTab modelName="ChatGPT" />
          </TabsContent>
          <TabsContent value="gemini" className="space-y-4">
            <DashboardTab modelName="Gemini" />
          </TabsContent>
        </main>
      </div>
    </Tabs>
  );
}
