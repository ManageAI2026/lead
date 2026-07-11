'use client';

import { useEffect, useState } from 'react';
import { RunCard } from './cards';

/** Home-hero run card that ticks the FOUND counts up over time. */
export function HeroRunCard() {
  const [found, setFound] = useState(3);

  useEffect(() => {
    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      setFound(9);
      return;
    }
    const t = setInterval(() => {
      setFound((f) => (f < 9 ? f + (Math.random() < 0.5 ? 1 : 0) : f));
    }, 1100);
    return () => clearInterval(t);
  }, []);

  return <RunCard found={found} />;
}
