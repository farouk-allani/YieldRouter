"use client";

import { ReactNode, useEffect } from "react";
import {
  InterwovenKitProvider,
  InterwovenKit,
  injectStyles,
  TESTNET,
} from "@initia/interwovenkit-react";
import interwovenKitStyles from "@initia/interwovenkit-react/styles.js";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, createConfig, http } from "wagmi";
import { defineChain } from "viem";

const initiaEvmTestnet = defineChain({
  id: 2124225178762456,
  name: "Initia EVM Testnet",
  nativeCurrency: { name: "INIT", symbol: "INIT", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://jsonrpc-evm-1.anvil.asia-southeast.initia.xyz"] },
  },
  blockExplorers: {
    default: { name: "Initia Scan", url: "https://scan.testnet.initia.xyz/evm-1" },
  },
});

const wagmiConfig = createConfig({
  chains: [initiaEvmTestnet],
  transports: {
    [initiaEvmTestnet.id]: http(),
  },
});

const queryClient = new QueryClient();

export default function InterwovenProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    injectStyles(interwovenKitStyles);
  }, []);

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <InterwovenKitProvider
          {...TESTNET}
          theme="light"
          enableAutoSign={true}
        >
          {children}
          <InterwovenKit />
        </InterwovenKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
