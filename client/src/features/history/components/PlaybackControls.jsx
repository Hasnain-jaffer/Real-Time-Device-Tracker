// client/src/features/history/components/PlaybackControls.jsx
export default function PlaybackControls({ playback, totalPoints }) {
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

  if (!canPlay) {
    return (
      <div className="glass rounded-2xl shadow-soft p-4 text-sm text-gray-400 text-center">
        Not enough recorded points to play back this route.
      </div>
    );
  }

  const minutes = Math.floor(elapsedSeconds / 60);
  const seconds = Math.floor(elapsedSeconds % 60);

  return (
    <div className="glass rounded-2xl shadow-soft p-4 space-y-3">
      <div className="flex items-center gap-3">
        <button
          onClick={restart}
          className="w-8 h-8 rounded-lg border border-gray-300 dark:border-gray-700 flex items-center justify-center text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          aria-label="Restart playback"
        >
          ⏮
        </button>
        <button
          onClick={isPlaying ? pause : play}
          className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center hover:bg-primary-600 transition"
          aria-label={isPlaying ? 'Pause playback' : 'Play route'}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>

        <input
          type="range"
          min="0"
          max={totalPoints - 1}
          value={currentIndex}
          onChange={(e) => seek(Number(e.target.value))}
          className="flex-1 accent-primary"
          aria-label="Playback position"
        />

        <div className="flex gap-1 flex-shrink-0">
          {speedOptions.map((option) => (
            <button
              key={option}
              onClick={() => setSpeed(option)}
              className={`px-2 py-1 rounded-lg text-xs font-medium transition ${
                speed === option
                  ? 'bg-primary text-white'
                  : 'border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              {option}x
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>
          Point {currentIndex + 1} of {totalPoints}
        </span>
        <span>
          Elapsed: {minutes}m {seconds}s · {distanceSoFarKm.toFixed(2)} km travelled
        </span>
      </div>
    </div>
  );
}