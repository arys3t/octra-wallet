import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  Wallet as WalletIcon, 
  Send, 
  History, 
  LogOut,
  Copy,
  PieChart
} from 'lucide-react';
import { Balance } from './Balance';
import { MultiSend } from './MultiSend';
import { TxHistory } from './TxHistory';
import { ThemeToggle } from './ThemeToggle';
import { Wallet } from '../types/wallet';
import { useToast } from '@/hooks/use-toast';

interface WalletDashboardProps {
  wallet: Wallet;
  onDisconnect: () => void;
}

export function WalletDashboard({ wallet, onDisconnect }: WalletDashboardProps) {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const { toast } = useToast();

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: `${label} copied to clipboard`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleDisconnect = () => {
    if (window.confirm('Are you sure you want to disconnect your wallet? Make sure you have backed up your private key or mnemonic phrase.')) {
      onDisconnect();
    }
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 8)}...${address.slice(-6)}`;
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    <WalletIcon className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-xl font-bold">Octra Wallet</h1>
                  <div className="flex items-center space-x-2">
                    <p className="text-sm text-muted-foreground">
                      {truncateAddress(wallet.address)}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(wallet.address, 'Address')}
                      className="h-6 w-6 p-0"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
              <Badge variant="secondary" className="hidden sm:inline-flex">
                Connected
              </Badge>
            </div>

            <div className="flex items-center space-x-2">
              <ThemeToggle />
              <Button
                variant="outline"
                size="sm"
                onClick={handleDisconnect}
                className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Disconnect
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <PieChart className="h-4 w-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="send" className="flex items-center gap-2">
              <Send className="h-4 w-4" />
              <span className="hidden sm:inline">Send</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              <span className="hidden sm:inline">History</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <Balance wallet={wallet} />
          </TabsContent>

          <TabsContent value="send">
            <MultiSend wallet={wallet} />
          </TabsContent>

          <TabsContent value="history">
            <TxHistory wallet={wallet} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}