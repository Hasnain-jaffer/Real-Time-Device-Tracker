import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { haversineMeters } from './geo';

export const SPEED_OPTIONS = [0.5, 1, 2, 5, 10];

const BASE_MS = 600; // time per point at 1x
const MIN_MS = 70;

// Plays a list of pings back in order, at an even pace (not real time):
// "elapsed" still shows the real time between the first point and the current one.
export function useRoutePlayback(pings) {
  const [index, setIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(5);
  const timer = useRef(null);

  const times = useMemo(() => pings.map((p) => new Date(p.createdAt).getTime()), [pings]);

  const cumulativeKm = useMemo(() => {
    const out = [0];
    for (let i = 1; i < pings.length; i++) {
      const meters = haversineMeters(pings[i - 1].latitude, pings[i - 1].longitude, pings[i].latitude, pings[i].longitude);
      out.push(out[i - 1] + meters / 1000);
    }
    return out;
  }, [pings]);

  useEffect(() => {
    setIndex(0);
    setIsPlaying(false);
  }, [pings]);

  useEffect(() => {
    clearTimeout(timer.current);
    if (!isPlaying) return undefined;
    if (index >= pings.length - 1) {
      setIsPlaying(false);
      return undefined;
    }
    timer.current = setTimeout(() => setIndex((i) => Math.min(i + 1, pings.length - 1)), Math.max(MIN_MS, BASE_MS / speed));
    return () => clearTimeout(timer.current);
  }, [isPlaying, index, speed, pings.length]);

  const play = useCallback(() => {
    if (index >= pings.length - 1) setIndex(0);
    setIsPlaying(true);
  }, [index, pings.length]);
  const pause = useCallback(() => setIsPlaying(false), []);
  const restart = useCallback(() => {
    setIndex(0);
    setIsPlaying(false);
  }, []);
  const seek = useCallback(
    (i) => setIndex(Math.max(0, Math.min(pings.length - 1, Math.round(i)))),
    [pings.length]
  );

  return {
    index,
    isPlaying,
    speed,
    setSpeed,
    play,
    pause,
    restart,
    seek,
    canPlay: pings.length > 1,
    elapsedSeconds: times.length ? Math.max(0, (times[index] - times[0]) / 1000) : 0,
    distanceSoFarKm: cumulativeKm[index] || 0,
    totalKm: cumulativeKm.length ? cumulativeKm[cumulativeKm.length - 1] : 0,
  };
}