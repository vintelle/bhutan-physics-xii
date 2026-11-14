import { answerSchemas, responseSchemas, type QuestionType } from "./questions";

export interface GradeResult {
  /** 0..1 credit before any hint penalty. */
  credit: number;
  isCorrect: boolean;
  /** Per-part detail for multi-part items (blanks, matching pairs). */
  parts?: boolean[];
  note?: string;
}

/** Each hint revealed costs 15% of the item, floored at 40% so hints never feel punishing. */
export const HINT_PENALTY = 0.15;
export const HINT_FLOOR = 0.4;
export function applyHintPenalty(credit: number, hintsUsed: number) {
  if (credit <= 0) return 0;
  const factor = Math.max(HINT_FLOOR, 1 - HINT_PENALTY * Math.min(hintsUsed, 3));
  return Math.round(credit * factor * 1000) / 1000;
}

const normalise = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9.+\-−/ ]/g, " ")
    .replace(/−/g, "-")
    .replace(/\s+/g, " ")
    .trim();

/** Parse "9.8", "9.8 m/s^2", "1.2e-3", "1.2 × 10^-3", "6,500" into a number. */
export function parseNumber(input: number | string): number | null {
  if (typeof input === "number") return Number.isFinite(input) ? input : null;
  let s = input.trim().replace(/,/g, "").replace(/−/g, "-");
  const sci = s.match(/^([-+]?\d*\.?\d+)\s*(?:x|×|\*)\s*10\s*\^?\s*\(?\s*([-+]?\d+)\s*\)?/i);
  if (sci) return Number(sci[1]) * 10 ** Number(sci[2]);
  s = s.match(/^[-+]?\d*\.?\d+(?:e[-+]?\d+)?/i)?.[0] ?? "";
  const n = Number(s);
  return s && Number.isFinite(n) ? n : null;
}

export function gradeObjective(type: Exclude<QuestionType, "CONCEPTUAL">, answerRaw: unknown, responseRaw: unknown): GradeResult {
  switch (type) {
    case "MCQ":
    case "ASSERTION_REASON": {
      const a = answerSchemas[type].parse(answerRaw);
      const r = responseSchemas[type].parse(responseRaw);
      const ok = a.index === r.index;
      return { credit: ok ? 1 : 0, isCorrect: ok };
    }
    case "TRUE_FALSE": {
      const a = answerSchemas.TRUE_FALSE.parse(answerRaw);
      const r = responseSchemas.TRUE_FALSE.parse(responseRaw);
      const ok = a.value === r.value;
      return { credit: ok ? 1 : 0, isCorrect: ok };
    }
    case "FILL_BLANK": {
      const a = answerSchemas.FILL_BLANK.parse(answerRaw);
      const r = responseSchemas.FILL_BLANK.parse(responseRaw);
      const parts = a.blanks.map((accepted, i) => {
        const given = normalise(r.blanks[i] ?? "");
        if (!given) return false;
        return accepted.some((acc) => {
          const n = normalise(acc);
          const gNum = parseNumber(given), aNum = parseNumber(n);
          if (gNum !== null && aNum !== null && /^[-+\d.]/.test(n)) return Math.abs(gNum - aNum) <= Math.abs(aNum) * 0.01;
          return given === n;
        });
      });
      const credit = parts.filter(Boolean).length / parts.length;
      return { credit, isCorrect: credit === 1, parts };
    }
    case "MATCHING": {
      const a = answerSchemas.MATCHING.parse(answerRaw);
      const r = responseSchemas.MATCHING.parse(responseRaw);
      const parts = a.pairs.map((p, i) => r.pairs[i] === p);
      const credit = parts.filter(Boolean).length / parts.length;
      return { credit, isCorrect: credit === 1, parts };
    }
    case "NUMERICAL": {
      const a = answerSchemas.NUMERICAL.parse(answerRaw);
      const r = responseSchemas.NUMERICAL.parse(responseRaw);
      const v = parseNumber(r.value);
      if (v === null) return { credit: 0, isCorrect: false, note: "Could not read a number from your answer." };
      const tol = Math.max(Math.abs(a.value) * (a.tolerancePct / 100), 1e-12);
      const diff = Math.abs(v - a.value);
      if (diff <= tol) return { credit: 1, isCorrect: true };
      // Power-of-ten slip (unit prefix error) gets a targeted note, no credit.
      const ratio = Math.abs(v / a.value);
      const log = Math.log10(ratio);
      if (a.value !== 0 && Math.abs(log - Math.round(log)) < 0.01 && Math.round(log) !== 0)
        return { credit: 0, isCorrect: false, note: `Your value is off by a factor of 10^${Math.round(log)} - check unit conversions (e.g. cm→m, µF→F, nm→m).` };
      if (diff <= tol * 2.5) return { credit: 0.5, isCorrect: false, note: "Close - check rounding or the value used for a constant." };
      return { credit: 0, isCorrect: false };
    }
  }
}

/**
 * Offline fallback for conceptual answers (used when no Claude API key is configured):
 * share of the marking key points whose content words appear in the answer.
 */
export function gradeConceptualByKeywords(keyPoints: string[], text: string): GradeResult {
  const STOP = new Set("the a an of to in is are and or for on by with as that this it be its at from which when into than then".split(" "));
  const answer = normalise(text);
  const tokens = (s: string) => s.split(" ").map((w) => w.replace(/^[.\-/+]+|[.\-/+]+$/g, "")).filter(Boolean);
  const words = new Set(tokens(answer));
  const stem = (w: string) => w.replace(/(ing|ed|es|s)$/, "");
  const stems = new Set([...words].map(stem));
  const parts = keyPoints.map((kp) => {
    const content = tokens(normalise(kp)).filter((w) => w.length > 2 && !STOP.has(w));
    if (content.length === 0) return false;
    const hit = content.filter((w) => words.has(w) || stems.has(stem(w))).length;
    return hit / content.length >= 0.5;
  });
  const credit = answer.length < 15 ? 0 : parts.filter(Boolean).length / parts.length;
  return {
    credit: Math.round(credit * 100) / 100,
    isCorrect: credit >= 0.75,
    parts,
    note: "Marked automatically against the key points (keyword match). Your teacher may review this mark.",
  };
}
