// client/src/features/history/components/PlaybackControls.jsx

/* ─── SVG Icons ─── */
const IconRestart = ({ size = 14, className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <polygon points="19 20 9 12 19 4 19 20" /><line x1="5" y1="19" x2="5" y2="5" />
  </svg>
);

const IconPlay = ({ size = 18, className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} style={style}>
    <polygon points="5 3 19 12 5 21 5 3" />
  </svg>
);

const IconPause = ({ size = 18, className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} style={style}>
    <rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" />
  </svg>
);

const cardShadow = '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)';

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
  const text = tokens['--text-primary'] || '#173B32';
  const muted = tokens['--text-muted'] || '#9C8F73';
  const border = tokens['--border'] || '#E1D9C8';
  const page = tokens['--bg-page'] || '#F4EFE6';
  const surface = tokens['--bg-surface'] || '#FFFFFF';

  if (!canPlay) {
    return (
      <div className="flex items-center justify-center gap-3 py-2">
        <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: page }}>
          <IconRestart size={14} style={{ color: muted }} />
        </div>
        <p className="text-sm font-medium" style={{ color: muted }}>
          Not enough recorded points to play back this route.
        </p>
      </div>
    );
  }

  const minutes = Math.floor(elapsedSeconds / 60);
  const seconds = Math.floor(elapsedSeconds % 60);
  const progressPct = totalPoints > 1 ? (currentIndex / (totalPoints - 1)) * 100 : 0;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        {/* Restart */}
        <button
          onClick={restart}
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition hover:opacity-80 active:scale-95"
          style={{ backgroundColor: page, color: text, border: `1px solid ${border}` }}
          aria-label="Restart playback"
        >
          <IconRestart size={14} />
        </button>

        {/* Play / Pause */}
        <button
          onClick={isPlaying ? pause : play}
          className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 transition hover:opacity-90 active:scale-95"
          style={{ backgroundColor: accent, color: '#FFFFFF', boxShadow: cardShadow }}
          aria-label={isPlaying ? 'Pause playback' : 'Play route'}
        >
          {isPlaying ? <IconPause size={18} /> : <IconPlay size={18} />}
        </button>

        {/* Progress track */}
        <div className="relative flex-1 min-w-[120px] h-2 rounded-full" style={{ backgroundColor: page, border: `1px solid ${border}` }}>
          <div
            className="absolute left-0 top-0 h-full rounded-full transition-all duration-100"
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
            className="absolute top-1/2 w-3.5 h-3.5 rounded-full -translate-y-1/2 -translate-x-1/2 pointer-events-none shadow"
            style={{ left: `${progressPct}%`, border: `2.5px solid ${accent}`, backgroundColor: surface }}
          />
        </div>

        {/* Speed selector (segmented pills) */}
        <div className="flex p-1 rounded-xl flex-shrink-0" style={{ backgroundColor: page, border: `1px solid ${border}` }}>
          {speedOptions.map((option) => (
            <button
              key={option}
              onClick={() => setSpeed(option)}
              className="px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all"
              style={{
                backgroundColor: speed === option ? surface : 'transparent',
                color: speed === option ? text : muted,
                boxShadow: speed === option ? cardShadow : 'none',
              }}
            >
              {option}x
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:justify-between gap-1 text-[11px]" style={{ color: muted }}>
        <span className="font-medium">Point {currentIndex + 1} of {totalPoints}</span>
        <span>Elapsed: {minutes}m {seconds}s · {distanceSoFarKm.toFixed(2)} km travelled</span>
      </div>
    </div>
  );
}