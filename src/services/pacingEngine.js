// Page & Pacing Engine (spec section 4).
// Deliberately configurable rather than hard-coding "1 page = 1 minute" as law —
// callers can pass a different ratio per project/genre later.

const DEFAULT_PAGES_PER_MINUTE = 1;

function targetPagesFromRuntime(runtimeMinutes, pagesPerMinute = DEFAULT_PAGES_PER_MINUTE) {
  if (!runtimeMinutes || runtimeMinutes <= 0) return null;
  return Math.round(runtimeMinutes * pagesPerMinute);
}

// Applies a framework's beat percentages to a project's target page count,
// producing per-beat target pages. Does not touch actual_page (that only moves
// when the writer places/writes a scene against a beat).
function computeBeatTargets(beatsWithPercentage, targetPages) {
  return beatsWithPercentage.map((beat) => ({
    ...beat,
    target_page: beat.target_percentage != null && targetPages
      ? Math.round((beat.target_percentage / 100) * targetPages)
      : beat.target_page,
  }));
}

// Compares a beat's actual placement to its target and returns a deviation
// summary — status only, no "good/bad" verdict; the AI layer explains the
// "why" using this plus scene content (spec section 4: "do NOT automatically
// declare something bad").
function pacingDeviation(beat) {
  if (beat.target_page == null || beat.actual_page == null) {
    return { deviationPages: null, status: 'not_yet_placed' };
  }
  const deviation = beat.actual_page - beat.target_page;
  let status = 'on_target';
  if (Math.abs(deviation) > 5) status = deviation > 0 ? 'potentially_delayed' : 'potentially_early';
  return { deviationPages: deviation, status };
}

function projectCompletion({ currentPages, targetPages }) {
  if (!targetPages) return { percentComplete: null, remainingPages: null };
  const percentComplete = Math.min(100, Math.round((currentPages / targetPages) * 100));
  return { percentComplete, remainingPages: Math.max(0, targetPages - currentPages) };
}

module.exports = {
  targetPagesFromRuntime,
  computeBeatTargets,
  pacingDeviation,
  projectCompletion,
};
