import data from "@curriculum/class-xii-physics.json";
import exemplars from "@curriculum/ig-exemplars.json";

/**
 * Static, read-only view of the Class XII curriculum (built from SCF 2022 + Physics IG 2022
 * by curriculum/build_curriculum.py). The same data is seeded into PostgreSQL; this module lets
 * prompts and pages use it without a database round-trip.
 */
export interface ThemeData {
  code: string;
  order: number;
  name: string;
  ig_pages: string;
  scf_table: number;
  competencies: string[];
  ks5_standards: string[];
  weighting: number;
  minutes: number;
  notes?: string;
}
export interface TopicData { code: string; theme: string; name: string; minutes: number; weighting: number }
export interface SubtopicData { number: string; topic: string; title: string; scope: string; ig_pedagogy: string; ig_exemplar_questions: number; ig_extra_concepts: string[] }
export interface OutcomeData {
  code: string;
  source_ref: string;
  roman: string;
  theme: string;
  topic: string;
  subtopics: string[];
  statement: string;
  bloom_primary: string;
  practical: boolean;
  numerical: boolean;
  sep: string[];
}
export interface ExemplarData { id: string; theme: string; subtopic: string | null; kind: string; n: number; text: string; has_figure: boolean }

export const curriculum = data as unknown as {
  meta: { sources: { id: string; title: string; publisher: string; edition: string; pages: string }[]; bloom_levels: string[] };
  themes: ThemeData[];
  topics: TopicData[];
  subtopics: SubtopicData[];
  learning_objectives: OutcomeData[];
  practicals: { title: string; subtopic: string; apparatus: string }[];
};
export const igExemplars = exemplars as ExemplarData[];

export const themeByCode = new Map(curriculum.themes.map((t) => [t.code, t]));
export const topicByCode = new Map(curriculum.topics.map((t) => [t.code, t]));
export const subtopicByNumber = new Map(curriculum.subtopics.map((s) => [s.number, s]));
export const outcomeByCode = new Map(curriculum.learning_objectives.map((o) => [o.code, o]));

export const bloomEnum = (label: string) => label.toUpperCase() as "REMEMBERING" | "UNDERSTANDING" | "APPLYING" | "ANALYSING" | "EVALUATING" | "CREATING";

/** Areas the generator and tutor must not assess as Class XII content (see docs/01 §8). */
export const OUT_OF_SCOPE = {
  classXI: [
    "Motion in a Straight Line", "Motion in a Plane (vectors, projectiles)", "Laws of Motion", "Mechanical Properties of Solids (elasticity, Young's modulus)",
    "Work and Energy", "Thermal Physics / thermodynamics", "Magnetic Fields (Lorentz force)", "Class XI Electric Circuit (colour code, series/parallel resistors)",
    "Class XI Ray Optics (total internal reflection, optical fibres)", "Waves (polarisation)", "Electromagnetic Waves (EM spectrum)", "Atoms (atomic spectra)",
    "Radioactive Decay (half-life)", "Space Applications (Class XI)",
  ],
  notInClassXII: [
    "stationary waves", "gravitational field strength and gravitational potential", "Wien's displacement law and Stefan-Boltzmann law", "standard candles",
    "Hubble's law and the Big Bang", "p-n junction diodes, rectifiers and transistors",
  ],
};

/** Compact, deterministic curriculum outline for AI system prompts (stable text = prompt-cache friendly). */
export function curriculumOutline(): string {
  const lines: string[] = [];
  for (const t of curriculum.themes) {
    lines.push(`\n## Theme ${t.order}: ${t.name} (${t.weighting}% of Class XII)`);
    lines.push(`Competencies: ${t.competencies.map((c, i) => `(${i + 1}) ${c}`).join(" ")}`);
    for (const tp of curriculum.topics.filter((x) => x.theme === t.code)) {
      lines.push(`### Topic ${tp.code} ${tp.name}`);
      for (const s of curriculum.subtopics.filter((x) => x.topic === tp.code)) {
        lines.push(`- ${s.number} ${s.title}. Scope: ${s.scope}. IG approach: ${s.ig_pedagogy}.${s.ig_extra_concepts.length ? ` IG-only extras (Understanding level only): ${s.ig_extra_concepts.join("; ")}.` : ""}`);
      }
      for (const o of curriculum.learning_objectives.filter((x) => x.topic === tp.code)) {
        lines.push(`  * ${o.code} (${o.theme} ${o.roman}; ${o.bloom_primary}${o.numerical ? "; numerical" : ""}${o.practical ? "; practical" : ""}): ${o.statement} [sub-topics ${o.subtopics.join(", ")}]`);
      }
    }
  }
  return lines.join("\n");
}

export function exemplarsForOutcome(code: string, limit = 6) {
  const o = outcomeByCode.get(code);
  if (!o) return [];
  return igExemplars.filter((e) => e.subtopic && o.subtopics.includes(e.subtopic) && !e.has_figure).slice(0, limit);
}
