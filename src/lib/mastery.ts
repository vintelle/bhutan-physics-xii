/**
 * Mastery model: an exponentially-weighted moving average (EWMA) of hint-adjusted
 * credit per learning outcome. Recent work counts more, so improvement shows quickly.
 */
export const MASTERY_ALPHA = 0.35;
export const MASTERED_SCORE = 0.8;
export const MASTERED_MIN_ATTEMPTS = 3;
export const WEAK_SCORE = 0.5;
export const WEAK_MIN_ATTEMPTS = 2;
/** A class needs intervention on an outcome when fewer than this share of active students are on track. */
export const INTERVENTION_ON_TRACK_SHARE = 0.5;

export type MasteryState = "not_started" | "learning" | "weak" | "mastered";

export function nextMasteryScore(prev: number, attemptsSoFar: number, credit: number) {
  if (attemptsSoFar === 0) return credit;
  return prev + MASTERY_ALPHA * (credit - prev);
}

export function masteryState(score: number, attempts: number): MasteryState {
  if (attempts === 0) return "not_started";
  if (score >= MASTERED_SCORE && attempts >= MASTERED_MIN_ATTEMPTS) return "mastered";
  if (score < WEAK_SCORE && attempts >= WEAK_MIN_ATTEMPTS) return "weak";
  return "learning";
}

export const STATE_LABEL: Record<MasteryState, string> = {
  not_started: "Not started",
  learning: "Learning",
  weak: "Needs work",
  mastered: "Mastered",
};
