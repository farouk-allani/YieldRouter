"use client";

import { createContext, useContext, useState, ReactNode, useCallback } from "react";

// Mock InterwovenKit context for Vercel preview
// Real integration uses @initia/interwovenkit-react on Initia testnet
interface WalletContextType {
  isConnected: boolean;
  address: string | null;
  username: string | null;
  openConnect: () => void;
  openWallet: () => void;
  disconnect: () => void;
  submitTxBlock: (msgs: unknown[]) => Promise<{ txhash: string }>;
}

const WalletContext = createContext<WalletContextType>({
  isConnected: false,
  address: null,
  username: null,
  openConnect: () => {},
  openWallet: () => {},
  disconnect: () => {},
  submitTxBlock: async () => ({ txhash: "" }),
});

export function useInterwovenKit() {
  return useContext(WalletContext);
}

export default function InterwovenProvider({ children }: { children: ReactNode }) {
  const [connected, setConnected] = useState(false);

  const submitTxBlock = useCallback(async (msgs: unknown[]) => {
    // Mock: simulate tx delay
    await new Promise((r) => setTimeout(r, 1500));
    return { txhash: "0x" + Math.random().toString(16).slice(2, 18) };
  }, []);

  return (
    <WalletContext.Provider
      value={{
        isConnected: connected,
        address: connected ? "init1abc...xyz" : null,
        username: connected ? "farouk.init" : null,
        openConnect: () => setConnected(true),
        openWallet: () => setConnected(true),
        disconnect: () => setConnected(false),
        submitTxBlock,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}
