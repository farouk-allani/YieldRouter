"use client";

import { createContext, useContext, useState, ReactNode } from "react";

// Mock InterwovenKit context for Vercel preview
// Real integration uses @initia/interwovenkit-react on Initia testnet
interface WalletContextType {
  connected: boolean;
  address: string | null;
  connect: () => void;
  disconnect: () => void;
}

const WalletContext = createContext<WalletContextType>({
  connected: false,
  address: null,
  connect: () => {},
  disconnect: () => {},
});

export function useInterwovenKit() {
  return useContext(WalletContext);
}

export default function InterwovenProvider({ children }: { children: ReactNode }) {
  const [connected, setConnected] = useState(false);
  const [address] = useState("init1abc...xyz");

  return (
    <WalletContext.Provider
      value={{
        connected,
        address: connected ? address : null,
        connect: () => setConnected(true),
        disconnect: () => setConnected(false),
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}
