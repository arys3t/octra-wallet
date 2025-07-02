import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GenerateWallet } from './GenerateWallet';
import { ImportWallet } from './ImportWallet';
import { Wallet as WalletIcon, Plus, Download } from 'lucide-react';
import { Wallet } from '../types/wallet';

interface WelcomeScreenProps {
  onWalletCreated: (wallet: Wallet) => void;
}

export function WelcomeScreen({ onWalletCreated }: WelcomeScreenProps) {
  const [activeTab, setActiveTab] = useState<string>('generate');

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-primary rounded-full">
              <WalletIcon className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-2">Welcome to Octra Wallet</h1>
          <p className="text-xl text-muted-foreground mb-6">
            Your secure gateway to the Octra blockchain
          </p>
        </div>

        {/* Main Card */}
        <Card className="shadow-2xl border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl">Get Started</CardTitle>
            <p className="text-muted-foreground">
              Create a new wallet or import an existing one to begin
            </p>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="generate" className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Create New Wallet
                </TabsTrigger>
                <TabsTrigger value="import" className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Import Wallet
                </TabsTrigger>
              </TabsList>

              <TabsContent value="generate" className="space-y-4">
                <div className="text-center mb-4">
                  <h3 className="text-lg font-semibold mb-2">Create New Wallet</h3>
                  <p className="text-sm text-muted-foreground">
                    Generate a brand new wallet with a secure mnemonic phrase
                  </p>
                </div>
                <GenerateWallet onWalletGenerated={onWalletCreated} />
              </TabsContent>

              <TabsContent value="import" className="space-y-4">
                <div className="text-center mb-4">
                  <h3 className="text-lg font-semibold mb-2">Import Existing Wallet</h3>
                  <p className="text-sm text-muted-foreground">
                    Restore your wallet using a private key or mnemonic phrase
                  </p>
                </div>
                <ImportWallet onWalletImported={onWalletCreated} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-muted-foreground">
          <p>
            By using Octra Wallet, you agree to our terms of service and privacy policy.
          </p>
          <p className="mt-2">
            Always keep your private keys and mnemonic phrase secure and never share them with anyone.
          </p>
        </div>
      </div>
    </div>
  );
}