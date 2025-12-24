'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletState } from '@/contexts/wallet-context';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import Image from "next/image";
import XandeumLogo from "@/components/icons/xandeum-logo";
import GearIcon from "@/components/icons/gear";
import DotsVerticalIcon from "@/components/icons/dots-vertical";
import { Skeleton } from "@/components/ui/skeleton";

const WalletIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
    <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
    <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
  </svg>
);

const DisconnectIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" x2="9" y1="12" y2="12" />
  </svg>
);

export function WalletProfile() {
  const { select, wallets, connect, disconnect, connecting } = useWallet();
  const { connected, publicKey, balance, balanceLoading, walletName } = useWalletState();

  const handleConnect = async (walletName: string) => {
    const wallet = wallets.find(w => w.adapter.name === walletName);
    if (wallet) {
      select(wallet.adapter.name);
      try {
        await connect();
      } catch (error) {
        console.error('Failed to connect:', error);
      }
    }
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  if (connecting) {
    return (
      <div className="flex gap-0.5 w-full">
        <div className="shrink-0 flex size-14 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
          <Skeleton className="w-8 h-8 rounded-full" />
        </div>
        <div className="pl-3 pr-1.5 pt-2 pb-1.5 flex-1 flex bg-sidebar-accent items-center rounded">
          <div className="grid flex-1 gap-1">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      </div>
    );
  }

  if (!connected) {
    return (
      <Popover>
        <PopoverTrigger className="flex gap-0.5 w-full group cursor-pointer">
          <div className="shrink-0 flex size-14 items-center justify-center rounded-lg bg-primary/20 text-primary border-2 border-dashed border-primary/40">
            <WalletIcon className="size-6" />
          </div>
          <div className="group/item pl-3 pr-1.5 pt-2 pb-1.5 flex-1 flex bg-sidebar-accent hover:bg-sidebar-accent-active/75 items-center rounded group-data-[state=open]:bg-sidebar-accent-active group-data-[state=open]:hover:bg-sidebar-accent-active group-data-[state=open]:text-sidebar-accent-foreground">
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate text-lg font-display text-primary">
                CONNECT WALLET
              </span>
              <span className="truncate text-xs uppercase opacity-50">
                Click to connect
              </span>
            </div>
            <DotsVerticalIcon className="ml-auto size-4" />
          </div>
        </PopoverTrigger>
        <PopoverContent
          className="w-64 p-2"
          side="top"
          align="end"
          sideOffset={4}
        >
          <div className="text-sm font-medium mb-2 px-2">Select Wallet</div>
          <div className="flex flex-col gap-1">
            {wallets.length > 0 ? (
              wallets.map((wallet) => (
                <button
                  key={wallet.adapter.name}
                  onClick={() => handleConnect(wallet.adapter.name)}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent transition-colors"
                >
                  {wallet.adapter.icon && (
                    <Image
                      src={wallet.adapter.icon}
                      alt={wallet.adapter.name}
                      width={24}
                      height={24}
                      unoptimized
                      className="w-6 h-6"
                    />
                  )}
                  <span>{wallet.adapter.name}</span>
                  {wallet.readyState === 'Installed' && (
                    <span className="ml-auto text-xs text-green-500">Detected</span>
                  )}
                </button>
              ))
            ) : (
              <div className="px-3 py-4 text-center text-muted-foreground text-sm">
                <p>No wallets detected.</p>
                <p className="mt-1">Install Phantom or Solflare</p>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Popover>
      <PopoverTrigger className="flex gap-0.5 w-full group cursor-pointer">
        <div className="shrink-0 flex size-14 items-center justify-center rounded-lg bg-green-500/20 text-green-400 border border-green-500/40">
          <WalletIcon className="size-6" />
        </div>
        <div className="group/item pl-3 pr-1.5 pt-2 pb-1.5 flex-1 flex bg-sidebar-accent hover:bg-sidebar-accent-active/75 items-center rounded group-data-[state=open]:bg-sidebar-accent-active group-data-[state=open]:hover:bg-sidebar-accent-active group-data-[state=open]:text-sidebar-accent-foreground">
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate text-lg font-display text-green-400">
              {publicKey ? truncateAddress(publicKey) : 'CONNECTED'}
            </span>
            <span className="truncate text-xs uppercase opacity-70">
              {balanceLoading ? (
                'Loading...'
              ) : balance !== null ? (
                `${balance.toFixed(4)} SOL`
              ) : (
                walletName || 'Connected'
              )}
            </span>
          </div>
          <DotsVerticalIcon className="ml-auto size-4" />
        </div>
      </PopoverTrigger>
      <PopoverContent
        className="w-56 p-0"
        side="top"
        align="end"
        sideOffset={4}
      >
        <div className="p-3 border-b border-border">
          <div className="text-xs text-muted-foreground uppercase">Connected Wallet</div>
          <div className="font-mono text-sm mt-1 break-all">
            {publicKey}
          </div>
          {balance !== null && (
            <div className="mt-2 text-lg font-display text-primary">
              {balance.toFixed(4)} SOL
            </div>
          )}
        </div>
        <div className="flex flex-col">
          <button className="flex items-center px-4 py-2 text-sm hover:bg-accent">
            <XandeumLogo className="mr-2 h-4 w-4" />
            View on Explorer
          </button>
          <button className="flex items-center px-4 py-2 text-sm hover:bg-accent">
            <GearIcon className="mr-2 h-4 w-4" />
            Settings
          </button>
          <button
            onClick={() => disconnect()}
            className="flex items-center px-4 py-2 text-sm hover:bg-accent text-red-400"
          >
            <DisconnectIcon className="mr-2 h-4 w-4" />
            Disconnect
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
