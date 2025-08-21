'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { sdk } from '@farcaster/miniapp-sdk';
import { useFarcaster } from './FarcasterProvider';

interface AuthContextType {
  authToken: string | null;
  isLoadingAuth: boolean;
  errorAuth: string | null;
  login: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(true);
  const [errorAuth, setErrorAuth] = useState<string | null>(null);
  const { isLoaded, farcasterContext } = useFarcaster();

  const login = async () => {
    setIsLoadingAuth(true);
    setErrorAuth(null);
    try {
      const { token } = await sdk.quickAuth.getToken();
      
      if (!token) {
        throw new Error("Failed to get auth token from Farcaster.");
      }

      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Backend verification failed.');
      }

      setAuthToken(token);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setErrorAuth(errorMessage || 'Failed to authenticate.');
      setAuthToken(null);
    } finally {
      setIsLoadingAuth(false);
    }
  };

  useEffect(() => {
    if (isLoaded) {
      if (farcasterContext) {
        login();
      } else {
        // Not in a Farcaster client
        setIsLoadingAuth(false);
      }
    }
  }, [isLoaded, farcasterContext]);

  return (
    <AuthContext.Provider value={{ authToken, isLoadingAuth, errorAuth, login }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
