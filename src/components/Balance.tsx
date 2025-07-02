import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Copy, RefreshCw, Wallet, Eye, EyeOff } from 'lucide-react';
import { Wallet as WalletType } from '../types/wallet';
import { fetchBalance } from '../utils/api';
import { useToast } from '@/hooks/use-toast';

interface BalanceProps {
  wallet: WalletType | null;
}

export function Balance({ wallet }: BalanceProps) {
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const { toast } = useToast();

  const fetchWalletBalance = async () => {
    if (!wallet) return;
    
    setLoading(true);
    try {
      const balanceData = await fetchBalance(wallet.address);
      setBalance(balanceData.balance);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch balance",
        variant: "destructive",
      });
      console.error('Balance fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWalletBalance();
  }, [wallet]);

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

  if (!wallet) {
    return (
      <Alert>
        <Wallet className="h-4 w-4" />
        <AlertDescription>
          No wallet available. Please generate or import a wallet first.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Balance Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-2xl font-bold">Wallet Balance</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchWalletBalance}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            {loading ? (
              <Skeleton className="h-12 w-32 mx-auto" />
            ) : (
              <div className="space-y-2">
                <div className="text-4xl font-bold text-primary">
                  {balance !== null ? `${balance.toFixed(8)}` : '0.00000000'}
                </div>
                <Badge variant="secondary" className="text-sm">
                  OCT
                </Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Wallet Information */}
      <Card>
        <CardHeader>
          <CardTitle>Wallet Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Address */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Wallet Address</label>
            <div className="flex items-center space-x-2">
              <div className="flex-1 p-3 bg-muted rounded-md font-mono text-sm break-all">
                {wallet.address}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(wallet.address, 'Address')}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Private Key */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Private Key (Base64)</label>
            <div className="flex items-center space-x-2">
              <div className="flex-1 p-3 bg-muted rounded-md font-mono text-sm break-all">
                {showPrivateKey ? wallet.privateKey : '•'.repeat(44)}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPrivateKey(!showPrivateKey)}
              >
                {showPrivateKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              {showPrivateKey && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(wallet.privateKey, 'Private Key')}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Public Key */}
          {wallet.publicKey && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Public Key (Hex)</label>
              <div className="flex items-center space-x-2">
                <div className="flex-1 p-3 bg-muted rounded-md font-mono text-sm break-all">
                  {wallet.publicKey}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(wallet.publicKey!, 'Public Key')}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Mnemonic */}
          {wallet.mnemonic && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Mnemonic Phrase</label>
              <div className="p-3 bg-muted rounded-md">
                <div className="grid grid-cols-3 gap-2">
                  {wallet.mnemonic.split(' ').map((word, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <span className="text-xs text-muted-foreground w-6">
                        {index + 1}.
                      </span>
                      <span className="font-mono text-sm">{word}</span>
                    </div>
                  ))}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(wallet.mnemonic!, 'Mnemonic')}
                className="w-full mt-2"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy Mnemonic Phrase
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}