import { QUIZ_BLOOMS, type Bloom, type QuestionType } from "./questions";

/** Default cognitive-demand mix for a Class XII test (higher key stages emphasise apply/analyse/evaluate - SCF 7.1). */
export const DEFAULT_BLOOM_MIX: Record<(typeof QUIZ_BLOOMS)[number], number> = {
  REMEMBERING: 10,
  UNDERSTANDING: 25,
  APPLYING: 30,
  ANALYSING: 20,
  EVALUATING: 15,
};

const BLOOM_ORDER: Bloom[] = ["REMEMBERING", "UNDERSTANDING", "APPLYING", "ANALYSING", "EVALUATING", "CREATING"];

/** Largest-remainder apportionment: split `total` across keys in proportion to `weights`. */
export function apportion<K extends string>(weights: Record<K, number>, total: number): Record<K, number> {
  const keys = Object.keys(weights) as K[];
  const sum = keys.reduce((s, k) => s + Math.max(0, weights[k]), 0);
  const out = {} as Record<K, number>;
  if (sum === 0 || total <= 0) {
    keys.forEach((k) => (out[k] = 0));
    return out;
  }
  const raw = keys.map((k) => ({ k, exact: (Math.max(0, weights[k]) / sum) * total }));
  raw.forEach((r) => (out[r.k] = Math.floor(r.exact)));
  let left = total - raw.reduce((s, r) => s + Math.floor(r.exact), 0);
  raw
    .sort((a, b) => b.exact - Math.floor(b.exact) - (a.exact - Math.floor(a.exact)))
    .forEach((r) => {
      if (left > 0) {
        out[r.k] += 1;
        left -= 1;
      }
    });
  return out;
}

export interface Candidate {
  id: string;
  topicCode: string;
  outcomeCode: string;
  bloom: Bloom;
  type: QuestionType;
  difficulty: number;
  marks: number;
  /** How many times it has been served - fresher items are preferred. */
  timesUsed: number;
}

export interface BlueprintSpec {
  questionCount: number;
  /** topicCode -> weighting (defaults to IG Annexure 2 weighting of the selected topics). */
  topicWeights: Record<string, number>;
  bloomMix?: Partial<Record<Bloom, number>>;
  types?: QuestionType[];
  /** Deterministic shuffling for reproducible tests. */
  seed?: number;
}

export interface BlueprintResult {
  questionIds: string[];
  perTopic: Record<string, { target: number; picked: number }>;
  perBloom: Record<string, { target: number; picked: number }>;
  shortfall: string[];
}

function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32);
}

/**
 * Pick questions so that (1) topic counts follow the curriculum weighting,
 * (2) Bloom levels follow the requested mix as closely as the bank allows,
 * (3) each topic spreads across its learning outcomes, and
 * (4) the final order ramps from lower to higher demand (SCF 10.15 good practice).
 */
export function buildBlueprint(candidates: Candidate[], spec: BlueprintSpec): BlueprintResult {
  const rand = rng(spec.seed ?? Date.now());
  const pool = candidates.filter((c) => (spec.types?.length ? spec.types.includes(c.type) : true) && c.bloom !== "CREATING");
  const topicTargets = apportion(spec.topicWeights, spec.questionCount);
  const mix = { ...DEFAULT_BLOOM_MIX, ...(spec.bloomMix ?? {}) } as Record<string, number>;
  const bloomTargets = apportion(mix, spec.questionCount);
  const bloomLeft = { ...bloomTargets };
  const chosen: Candidate[] = [];
  const shortfall: string[] = [];
  const perTopic: BlueprintResult["perTopic"] = {};

  // Topics with the scarcest banks first, so scarce Bloom slots go where they are needed most.
  const topics = Object.keys(topicTargets).sort(
    (a, b) => pool.filter((c) => c.topicCode === a).length - pool.filter((c) => c.topicCode === b).length,
  );
  for (const topic of topics) {
    const need = topicTargets[topic];
    perTopic[topic] = { target: need, picked: 0 };
    let avail = pool.filter((c) => c.topicCode === topic).map((c) => ({ c, r: rand() }));
    const outcomeUse = new Map<string, number>();
    for (let i = 0; i < need; i++) {
      if (avail.length === 0) {
        shortfall.push(`${topic}: only ${perTopic[topic].picked} of ${need} approved questions available`);
        break;
      }
      avail.sort((x, y) => {
        const score = (o: { c: Candidate; r: number }) =>
          (bloomLeft[o.c.bloom] > 0 ? 0 : 10) + // honour the Bloom mix
          (outcomeUse.get(o.c.outcomeCode) ?? 0) * 3 + // spread across outcomes
          Math.min(o.c.timesUsed, 5) * 0.5 + // prefer fresh items
          o.r; // random tie-break
        return score(x) - score(y);
      });
      const pick = avail.shift()!;
      chosen.push(pick.c);
      perTopic[topic].picked++;
      bloomLeft[pick.c.bloom] = (bloomLeft[pick.c.bloom] ?? 0) - 1;
      outcomeUse.set(pick.c.outcomeCode, (outcomeUse.get(pick.c.outcomeCode) ?? 0) + 1);
    }
  }

  chosen.sort((a, b) => BLOOM_ORDER.indexOf(a.bloom) - BLOOM_ORDER.indexOf(b.bloom) || a.difficulty - b.difficulty);
  const perBloom: BlueprintResult["perBloom"] = {};
  for (const b of Object.keys(bloomTargets)) perBloom[b] = { target: bloomTargets[b], picked: chosen.filter((c) => c.bloom === b).length };
  return { questionIds: chosen.map((c) => c.id), perTopic, perBloom, shortfall };
}
