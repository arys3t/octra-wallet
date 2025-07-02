import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Key, FileText, AlertTriangle, Loader2 } from 'lucide-react';
import { Wallet } from '../types/wallet';
import { importWalletFromPrivateKey, importWalletFromMnemonic } from '../utils/wallet';
import { useToast } from '@/hooks/use-toast';

interface ImportWalletProps {
  onWalletImported: (wallet: Wallet) => void;
}

export function ImportWallet({ onWalletImported }: ImportWalletProps) {
  const [privateKey, setPrivateKey] = useState('');
  const [mnemonic, setMnemonic] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const { toast } = useToast();

  const handleImportFromPrivateKey = async () => {
    if (!privateKey.trim()) {
      toast({
        title: "Error",
        description: "Please enter a private key",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);
    try {
      const wallet = await importWalletFromPrivateKey(privateKey.trim());
      onWalletImported(wallet);
      toast({
        title: "Success!",
        description: "Wallet imported successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to import wallet. Please check your private key.",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleImportFromMnemonic = async () => {
    if (!mnemonic.trim()) {
      toast({
        title: "Error",
        description: "Please enter a mnemonic phrase",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);
    try {
      const wallet = await importWalletFromMnemonic(mnemonic.trim());
      onWalletImported(wallet);
      toast({
        title: "Success!",
        description: "Wallet imported successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to import wallet. Please check your mnemonic phrase.",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-4">
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Only import wallets from trusted sources. Never share your private key or mnemonic phrase with anyone.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="private-key" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="private-key" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            Private Key
          </TabsTrigger>
          <TabsTrigger value="mnemonic" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Mnemonic
          </TabsTrigger>
        </TabsList>

        <TabsContent value="private-key" className="space-y-4 mt-6">
          <div className="space-y-2">
            <Label htmlFor="private-key">Private Key</Label>
            <Input
              id="private-key"
              type="password"
              placeholder="Enter your private key (Base64 or Hex)"
              value={privateKey}
              onChange={(e) => setPrivateKey(e.target.value)}
              className="font-mono"
            />
            <p className="text-sm text-muted-foreground">
              Enter your private key in Base64 or Hex format (with or without 0x prefix)
            </p>
          </div>

          <Button 
            onClick={handleImportFromPrivateKey}
            disabled={isImporting || !privateKey.trim()}
            className="w-full"
            size="lg"
          >
            {isImporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Importing...
              </>
            ) : (
              "Import from Private Key"
            )}
          </Button>
        </TabsContent>

        <TabsContent value="mnemonic" className="space-y-4 mt-6">
          <div className="space-y-2">
            <Label htmlFor="mnemonic">Mnemonic Phrase</Label>
            <Textarea
              id="mnemonic"
              placeholder="Enter your 12 or 24 word mnemonic phrase"
              value={mnemonic}
              onChange={(e) => setMnemonic(e.target.value)}
              rows={4}
              className="font-mono"
            />
            <p className="text-sm text-muted-foreground">
              Enter your mnemonic phrase separated by spaces (12 or 24 words)
            </p>
          </div>

          <Button 
            onClick={handleImportFromMnemonic}
            disabled={isImporting || !mnemonic.trim()}
            className="w-full"
            size="lg"
          >
            {isImporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Importing...
              </>
            ) : (
              "Import from Mnemonic"
            )}
          </Button>
        </TabsContent>
      </Tabs>
    </div>
  );
}