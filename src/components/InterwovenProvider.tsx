"use client";

import { InterwovenKitProvider, TESTNET } from "@initia/interwovenkit-react";
import "@initia/interwovenkit-react/styles.css";
import { useEffect } from "react";

function StyleInjector() {
  useEffect(() => {
    // Ensure InterwovenKit styles are loaded
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap";
    document.head.appendChild(link);
  }, []);
  return null;
}

export default function InterwovenProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <InterwovenKitProvider
      {...TESTNET}
      theme="light"
      enableAutoSign={{
        "interwoven-1": ["vault.deposit", "vault.withdraw"],
      }}
    >
      <StyleInjector />
      {children}
    </InterwovenKitProvider>
  );
}
