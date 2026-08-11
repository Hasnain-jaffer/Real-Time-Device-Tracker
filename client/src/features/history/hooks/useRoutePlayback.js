// client/src/features/history/hooks/useRoutePlayback.js
import { useEffect, useRef, useState } from 'react';

const SPEED_OPTIONS = [0.5, 1, 2, 5, 10];
const TICK_MS = 500; // how often the playback advances, independent of playback speed

export function useRoutePlayback(pings) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const intervalRef = useRef(null);

  // Reset playback whenever the underlying route data changes (e.g. new device selected)
  useEffect(() => {
    setCurrentIndex(0);
    setIsPlaying(false);
  }, [pings]);

  useEffect(() => {
    if (!isPlaying || pings.length === 0) return;

    intervalRef.current = setInterval(() => {
      setCurrentIndex((prev) => {
        const next = prev + 1;
        if (next >= pings.length) {
          setIsPlaying(false);
          return pings.length - 1;
        }
        return next;
      });
    }, TICK_MS / speed);

    return () => clearInterval(intervalRef.current);
  }, [isPlaying, speed, pings.length]);

  function play() {
    if (pings.length < 2) return;
    if (currentIndex >= pings.length - 1) setCurrentIndex(0); // restart if at the end
    setIsPlaying(true);
  }

  function pause() {
    setIsPlaying(false);
  }

  function restart() {
    setCurrentIndex(0);
    setIsPlaying(false);
  }

  function seek(index) {
    setIsPlaying(false);
    setCurrentIndex(Math.max(0, Math.min(index, pings.length - 1)));
  }

  const currentPing = pings[currentIndex] || null;

  let elapsedSeconds = 0;
  let distanceSoFarKm = 0;
  if (pings.length > 0 && currentPing) {
    elapsedSeconds = (new Date(currentPing.createdAt) - new Date(pings[0].createdAt)) / 1000;
    for (let i = 1; i <= currentIndex; i++) {
      distanceSoFarKm += haversineKm(pings[i - 1], pings[i]);
    }
  }

  return {
    currentIndex,
    currentPing,
    isPlaying,
    speed,
    setSpeed,
    play,
    pause,
    restart,
    seek,
    elapsedSeconds,
    distanceSoFarKm,
    speedOptions: SPEED_OPTIONS,
    canPlay: pings.length >= 2,
  };
}

function haversineKm(a, b) {
  const R = 6371;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.latitude * Math.PI) / 180) *
      Math.cos((b.latitude * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}