// SM-2 spaced-repetition scheduler, adapted to LinguistAI's three rating buttons.
//
//   still-learning  -> lapse  (reset, re-due immediately, ease penalised)
//   getting-there   -> pass   (interval grows, ease unchanged)
//   mastered        -> easy   (interval grows faster, ease bonus)
//
// State shape: { ease_factor, interval_days, repetitions }
// Returns the next scheduling state plus an ISO `due_at`.

const MIN_EASE = 1.3;
const MAX_EASE = 3.0;
const DAY_MS = 24 * 60 * 60 * 1000;

const clampEase = (e) => Math.min(MAX_EASE, Math.max(MIN_EASE, e));

export function schedule(state, grade, now = new Date()) {
  let ease = state?.ease_factor ?? 2.5;
  let interval = state?.interval_days ?? 0;
  let reps = state?.repetitions ?? 0;

  if (grade === 'still-learning') {
    // Lapse: forget progress and surface again today.
    reps = 0;
    interval = 0;
    ease = clampEase(ease - 0.2);
  } else {
    // Pass or easy.
    reps += 1;
    if (grade === 'mastered') ease = clampEase(ease + 0.1);

    if (reps === 1) {
      interval = 1;
    } else if (reps === 2) {
      interval = grade === 'mastered' ? 4 : 3;
    } else {
      interval = Math.max(1, Math.round(interval * ease));
    }
  }

  const due_at = new Date(now.getTime() + interval * DAY_MS).toISOString();
  return { ease_factor: ease, interval_days: interval, repetitions: reps, due_at };
}

export const GRADES = ['still-learning', 'getting-there', 'mastered'];
