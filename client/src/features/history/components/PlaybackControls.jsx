// client/src/features/history/components/PlaybackControls.jsx
export default function PlaybackControls({ playback, totalPoints, tokens = {} }) {
  const {
    currentIndex,
    isPlaying,
    speed,
    setSpeed,
    play,
    pause,
    restart,
    seek,
    elapsedSeconds,
    distanceSoFarKm,
    speedOptions,
    canPlay,
  } = playback;

  const accent = tokens['--accent-primary'] || '#5E8C61';
  const iconOnAccent = tokens['--bg-sidebar'] || '#173B32';
  const text = tokens['--text-primary'] || '#173B32';
  const muted = tokens['--text-muted'] || '#9C8F73';
  const border = tokens['--border'] || '#E1D9C8';
  const primary = tokens['--text-primary'] || '#173B32';
  const page = tokens['--bg-page'] || '#F4EFE6';

  if (!canPlay) {
    return (
      <p className="text-sm text-center" style={{ color: muted }}>
        Not enough recorded points to play back this route.
      </p>
    );
  }

  const minutes = Math.floor(elapsedSeconds / 60);
  const seconds = Math.floor(elapsedSeconds % 60);
  const progressPct = totalPoints > 1 ? (currentIndex / (totalPoints - 1)) * 100 : 0;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={restart}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
          style={{ backgroundColor: page, color: primary }}
          aria-label="Restart playback"
        >
          ⏮
        </button>
        <button
          onClick={isPlaying ? pause : play}
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: accent, color: iconOnAccent }}
          aria-label={isPlaying ? 'Pause playback' : 'Play route'}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>

        <div className="relative flex-1 min-w-[120px] h-1.5 rounded-full" style={{ backgroundColor: border }}>
          <div
            className="absolute left-0 top-0 h-full rounded-full"
            style={{ width: `${progressPct}%`, backgroundColor: accent }}
          />
          <input
            type="range"
            min="0"
            max={totalPoints - 1}
            value={currentIndex}
            onChange={(e) => seek(Number(e.target.value))}
            className="absolute inset-0 w-full opacity-0 cursor-pointer"
            aria-label="Playback position"
          />
          <div
            className="absolute top-1/2 w-3 h-3 rounded-full -translate-y-1/2 -translate-x-1/2 pointer-events-none"
            style={{ left: `${progressPct}%`, border: `2px solid ${accent}`, backgroundColor: '#fff' }}
          />
        </div>

        <div className="flex gap-1 flex-wrap flex-shrink-0">
          {speedOptions.map((option) => (
            <button
              key={option}
              onClick={() => setSpeed(option)}
              className="px-2 py-1 rounded-full text-xs font-medium transition-colors duration-150"
              style={
                speed === option
                  ? { backgroundColor: accent, color: iconOnAccent }
                  : { backgroundColor: 'transparent', color: muted }
              }
            >
              {option}x
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:justify-between gap-1 text-[10.5px]" style={{ color: muted }}>
        <span>Point {currentIndex + 1} of {totalPoints}</span>
        <span>Elapsed: {minutes}m {seconds}s · {distanceSoFarKm.toFixed(2)} km travelled</span>
      </div>
    </div>
  );
}