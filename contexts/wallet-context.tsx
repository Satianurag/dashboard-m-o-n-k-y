'use client';

import { FC, ReactNode, useMemo, useCallback, createContext, useContext, useState, useEffect } from 'react';
import { ConnectionProvider, WalletProvider, useWallet, useConnection } from '@solana/wallet-adapter-react';
import { Adapter, WalletError } from '@solana/wallet-adapter-base';
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  TorusWalletAdapter,
  LedgerWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { DEVNET_RPC } from '@/server/api/config';

interface WalletContextState {
  connected: boolean;
  connecting: boolean;
  publicKey: string | null;
  balance: number | null;
  balanceLoading: boolean;
  walletName: string | null;
  disconnect: () => Promise<void>;
  refreshBalance: () => Promise<void>;
}

const WalletStateContext = createContext<WalletContextState>({
  connected: false,
  connecting: false,
  publicKey: null,
  balance: null,
  balanceLoading: false,
  walletName: null,
  disconnect: async () => { },
  refreshBalance: async () => { },
});

export const useWalletState = () => useContext(WalletStateContext);

function WalletStateProvider({ children }: { children: ReactNode }) {
  const { connected, connecting, publicKey, disconnect, wallet } = useWallet();
  const { connection } = useConnection();
  const [balance, setBalance] = useState<number | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);

  const refreshBalance = useCallback(async () => {
    if (!publicKey || !connection) {
      setBalance(null);
      return;
    }

    try {
      setBalanceLoading(true);
      const bal = await connection.getBalance(publicKey);
      setBalance(bal / LAMPORTS_PER_SOL);
    } catch (error) {
      console.error('Error fetching balance:', error);
      setBalance(null);
    } finally {
      setBalanceLoading(false);
    }
  }, [publicKey, connection]);

  useEffect(() => {
    if (connected && publicKey) {
      refreshBalance();
      const interval = setInterval(refreshBalance, 30000);
      return () => clearInterval(interval);
    } else {
      setBalance(null);
    }
  }, [connected, publicKey, refreshBalance]);

  const value: WalletContextState = {
    connected,
    connecting,
    publicKey: publicKey?.toBase58() || null,
    balance,
    balanceLoading,
    walletName: wallet?.adapter.name || null,
    disconnect,
    refreshBalance,
  };

  return (
    <WalletStateContext.Provider value={value}>
      {children}
    </WalletStateContext.Provider>
  );
}

interface WalletContextProviderProps {
  children: ReactNode;
}

export const WalletContextProvider: FC<WalletContextProviderProps> = ({ children }) => {
  const endpoint = useMemo(() => DEVNET_RPC, []);

  // Configure wallet adapters - Wallet Standard-compliant wallets are auto-detected
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      new TorusWalletAdapter(),
      new LedgerWalletAdapter(),
    ],
    []
  );

  // Error handler for wallet errors
  const onError = useCallback((error: WalletError, adapter?: Adapter) => {
    console.error('Wallet error:', error.message, adapter?.name);
  }, []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} onError={onError} autoConnect>
        <WalletStateProvider>
          {children}
        </WalletStateProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};
