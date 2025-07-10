import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export function SettingsTab() {
  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Exchange API</CardTitle>
          <CardDescription>
            Connect your exchange account by providing your API keys.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="api-key">API Key</Label>
              <Input id="api-key" placeholder="Enter your API key" defaultValue="********************" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="api-secret">API Secret</Label>
              <Input id="api-secret" type="password" placeholder="Enter your API secret" defaultValue="********************************" />
            </div>
          </form>
        </CardContent>
        <CardFooter className="border-t px-6 py-4">
          <Button>Save API Keys</Button>
        </CardFooter>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Bot Configuration</CardTitle>
          <CardDescription>
            Manage the core settings for your trading bot.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                    <Label className="text-base">Enable Auto-Trading</Label>
                    <p className="text-sm text-muted-foreground">
                        Allow the bot to execute trades automatically based on its strategy.
                    </p>
                </div>
                <Switch defaultChecked />
            </div>
            <div className="space-y-2">
              <Label htmlFor="risk-level">Risk Level (%)</Label>
              <Input id="risk-level" type="number" placeholder="e.g., 2" defaultValue="2" />
              <p className="text-sm text-muted-foreground">
                Maximum percentage of capital to risk per trade.
              </p>
            </div>
          </form>
        </CardContent>
        <CardFooter className="border-t px-6 py-4">
          <Button>Save Configuration</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
