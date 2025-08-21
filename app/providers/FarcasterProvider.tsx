"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
} from "react";
import { sdk } from "@farcaster/miniapp-sdk";

// Define the types based on the Farcaster SDK's context structure
// Note: These might need to be adjusted if the SDK's API changes.
export type UserContext = {
    fid: number;
    username?: string;
    displayName?: string;
    pfpUrl?: string;
};

export type ClientContext = {
    clientFid: number;
    added: boolean;
};

export type MiniAppContext = {
    client: ClientContext;
    user: UserContext;
};

type FarcasterProviderContextType = {
  farcasterContext: MiniAppContext | null;
  error: string | null;
  sdkClient: typeof sdk;
  isLoaded: boolean;
};

const FarcasterContext = createContext<FarcasterProviderContextType | undefined>(
  undefined,
);

export default function FarcasterProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [farcasterContext, setFarcasterContext] = useState<MiniAppContext | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function initializeFarcaster() {
      try {
        const context = await sdk.context;
        setFarcasterContext(context as MiniAppContext);
      } catch (error) {
        console.error("Failed to initialize Farcaster SDK", error);
        setError(
          error instanceof Error ? error.message : "Failed to initialize SDK",
        );
      } finally {
        await sdk.actions.ready();
        setIsLoaded(true);
      }
    }

    initializeFarcaster();
  }, []);

  const value = useMemo(
    () => ({
      farcasterContext,
      error,
      sdkClient: sdk,
      isLoaded,
    }),
    [farcasterContext, error, isLoaded],
  );

  return (
    <FarcasterContext.Provider value={value}>
      {children}
    </FarcasterContext.Provider>
  );
}

export function useFarcaster() {
  const context = useContext(FarcasterContext);
  if (context === undefined) {
    throw new Error("useFarcaster must be used within a FarcasterProvider");
  }
  return context;
}
