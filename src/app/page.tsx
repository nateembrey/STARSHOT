import { ArrowRightLeft, FileText, LayoutDashboard, Settings as SettingsIcon } from 'lucide-react';
import { OverviewTab } from '@/components/dashboard/overview-tab';
import { TradesTab } from '@/components/dashboard/trades-tab';
import { LogsTab } from '@/components/dashboard/logs-tab';
import { SettingsTab } from '@/components/dashboard/settings-tab';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserNav } from '@/components/dashboard/user-nav';

export default function DashboardPage() {
  return (
    <div className="flex-col md:flex bg-background min-h-screen">
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur-sm z-10">
        <div className="flex h-16 items-center px-4 md:px-8">
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">STARSHOT</h1>
          <div className="ml-auto flex items-center space-x-4">
            <UserNav />
          </div>
        </div>
      </header>
      <main className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 sm:w-auto">
            <TabsTrigger value="overview">
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="trades">
              <ArrowRightLeft className="mr-2 h-4 w-4" />
              Trades
            </TabsTrigger>
            <TabsTrigger value="logs">
              <FileText className="mr-2 h-4 w-4" />
              Logs
            </TabsTrigger>
            <TabsTrigger value="settings">
              <SettingsIcon className="mr-2 h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="space-y-4">
            <OverviewTab />
          </TabsContent>
          <TabsContent value="trades" className="space-y-4">
            <TradesTab />
          </TabsContent>
          <TabsContent value="logs" className="space-y-4">
            <LogsTab />
          </TabsContent>
          <TabsContent value="settings" className="space-y-4">
            <SettingsTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
