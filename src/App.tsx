import React, { useState, useEffect } from 'react';
import { WelcomeScreen } from './components/WelcomeScreen';
import { WalletDashboard } from './components/WalletDashboard';
import { ThemeProvider } from './components/ThemeProvider';
import { Wallet } from './types/wallet';
import { Toaster } from '@/components/ui/toaster';

function App() {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [wallets, setWallets] = useState<Wallet[]>([]);

  useEffect(() => {
    const storedWallets = localStorage.getItem('wallets');
    if (storedWallets) {
      const parsedWallets = JSON.parse(storedWallets);
      setWallets(parsedWallets);
      if (parsedWallets.length > 0) {
        setWallet(parsedWallets[0]);
      }
    }
  }, []);

  const saveWallet = (newWallet: Wallet) => {
    const updatedWallets = [...wallets, newWallet];
    setWallets(updatedWallets);
    setWallet(newWallet);
    localStorage.setItem('wallets', JSON.stringify(updatedWallets));
  };

  const disconnectWallet = () => {
    setWallet(null);
    setWallets([]);
    localStorage.removeItem('wallets');
    
    // Reset theme to light when disconnecting
    localStorage.setItem('octra-wallet-theme', 'light');
    // Force theme reset by dispatching storage event
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'octra-wallet-theme',
      newValue: 'light'
    }));
  };

  return (
    <ThemeProvider defaultTheme="light" storageKey="octra-wallet-theme">
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        {!wallet ? (
          <WelcomeScreen onWalletCreated={saveWallet} />
        ) : (
          <WalletDashboard wallet={wallet} onDisconnect={disconnectWallet} />
        )}
        <Toaster />
      </div>
    </ThemeProvider>
  );
}

export default App;