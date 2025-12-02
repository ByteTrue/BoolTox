/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

"use client";

import { useSpotlight } from "@/contexts/spotlight-context";

export function useSpotlightBackground() {
  const { spotlight } = useSpotlight();

  const background = spotlight.visible
    ? `radial-gradient(${spotlight.size}px at ${spotlight.x}px ${spotlight.y}px, ${spotlight.color}, transparent 80%)`
    : "";

  return { background };
}
