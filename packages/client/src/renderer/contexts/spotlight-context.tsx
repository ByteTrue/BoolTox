/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

'use client';

import { createContext, useContext, useState, useMemo } from 'react';
import type { ReactNode } from 'react';

type SpotlightState = {
  x: number;
  y: number;
  visible: boolean;
  size: number;
  color: string;
};

type SpotlightContextValue = {
  spotlight: SpotlightState;
  setSpotlight: (state: Partial<SpotlightState>) => void;
};

const SpotlightContext = createContext<SpotlightContextValue | undefined>(undefined);

export function SpotlightProvider({ children }: { children: ReactNode }) {
  const [spotlight, setSpotlightState] = useState<SpotlightState>({
    x: 0,
    y: 0,
    visible: false,
    size: 2000,
    color: 'rgba(29, 78, 216, 0.05)',
  });

  const setSpotlight = (state: Partial<SpotlightState>) => {
    setSpotlightState(prevState => ({ ...prevState, ...state }));
  };

  const contextValue = useMemo(() => ({ spotlight, setSpotlight }), [spotlight]);

  return <SpotlightContext.Provider value={contextValue}>{children}</SpotlightContext.Provider>;
}

export function useSpotlight() {
  const context = useContext(SpotlightContext);
  if (!context) {
    throw new Error('useSpotlight must be used within a SpotlightProvider');
  }
  return context;
}
