// server/src/utils/delayNote.util.js
// Pure helpers for the delay note (no database, no network) so they are easy to test.

export const DELAY_NOTE_THRESHOLD_MINUTES = 15;   // below this, no note is shown
export const MAX_REASONABLE_DELAY_MINUTES = 180;  // above this the schedule/arrival pair is not meaningful (e.g. a late-evening return trip)

// Causes the system does not measure. If the model mentions one, the note is rejected.
const CAUSE_WORDS = /\b(traffic|weather|rain|raining|fog|accident|breakdown|broke|broken|mechanical|jam|congestion|construction|roadwork|protest|strike|fuel|driver|engine|tyre|tire|police|flood)\b/i;

/** Deterministic sentence(s) built only from the metrics. Used when the AI is off, fails, or is rejected. */
export function buildFallbackNote(m) {
  let note = `${m.busName} reached ${m.stopName} ${m.delayMinutes} min behind its ${m.scheduledTime} schedule.`;
  if (m.todayAvgMovingSpeedKmh != null && m.last7DaysAvgMovingSpeedKmh != null) {
    note += ` Its average moving speed today was ${m.todayAvgMovingSpeedKmh} km/h, compared with ${m.last7DaysAvgMovingSpeedKmh} km/h over the previous 7 days.`;
  }
  return note;
}

function numbersIn(text) {
  return (String(text).match(/\d+(?:\.\d+)?/g) || []).map(Number);
}

/**
 * True only if the note is short, mentions no unmeasured cause, and every number in it
 * comes from the metrics (rounded forms such as 14 for 14.2 are allowed).
 */
export function isGroundedNote(note, metrics) {
  if (typeof note !== 'string') return false;
  const text = note.trim();
  if (!text || text.length > 300) return false;
  if (CAUSE_WORDS.test(text)) return false;
  if ((text.match(/[.!?](\s|$)/g) || []).length > 2) return false; // asked for one sentence

  const allowed = new Set();
  for (const n of numbersIn(JSON.stringify(Object.values(metrics)))) {
    allowed.add(n);
    allowed.add(Math.round(n));
  }
  return numbersIn(text).every((n) => allowed.has(n));
}