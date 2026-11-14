import Anthropic from "@anthropic-ai/sdk";
import { OUT_OF_SCOPE, curriculum, curriculumOutline } from "../curriculum";

export const MODEL = process.env.CLAUDE_MODEL || "claude-opus-5-5";
/** Server-side refusal fallback: the API re-runs a declined request on a suitable model within the same call. */
export const FALLBACK_BETA = "server-side-fallback-2026-07-01" as const;

let _client: Anthropic | null = null;
export function aiEnabled() {
  return Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
}
export function claude() {
  if (!aiEnabled()) throw new AiUnavailableError();
  return (_client ??= new Anthropic());
}
export class AiUnavailableError extends Error {
  constructor() {
    super("AI features are not configured: set ANTHROPIC_API_KEY on the server.");
  }
}
export class AiRefusalError extends Error {
  constructor(public category?: string | null) {
    super("The AI declined this request.");
  }
}

const sources = curriculum.meta.sources.map((s) => `- ${s.id}: ${s.title} (${s.edition}). ${s.pages}`).join("\n");

/**
 * The curriculum context shared by the tutor, the question generator and the grader.
 * It is byte-identical on every request, so it is cached (cache_control) and billed at the
 * cache-read rate after the first call. Never interpolate per-request data into it.
 */
export const CURRICULUM_SYSTEM = `You support Class XII Physics in Bhutan's National School Curriculum. Your only authority for content is these two documents:
${sources}

Ground rules that apply to everything you produce:
1. Stay inside the Class XII scope below: the 5 themes, 13 topics, 48 sub-topics (each with an official "Scope") and 47 learning outcomes (codes XII.<THEME>.<nn>). Where a concept appears only in the Instructional Guide's learning experiences ("IG-only extras"), keep to Understanding level.
2. Class XI content may be used as prior knowledge but is not assessed or taught as new content at Class XII: ${OUT_OF_SCOPE.classXI.join("; ")}.
3. These are not part of this Class XII curriculum at all: ${OUT_OF_SCOPE.notInClassXII.join("; ")}. If asked, say they are outside the Class XII Physics curriculum and point to the nearest in-scope idea.
4. Use the curriculum's own terminology: learning objectives, competencies, the three assessment domains (Scientific Knowledge, Working Scientifically, Scientific Values and Attitudes), the eight Scientific Methods and Engineering Practices, and IG strategies such as CER (Claim-Evidence-Reason), POE/PROE, 5E, POGIL, structured inquiry, flipped classroom, REI and EBA. Use the IG's apparatus names (travelling microscope, potentiometer, deflection magnetometer in Tan-A position, sonometer, optical bench, vernier calliper, stopclock).
5. Use SI units, the Cartesian sign convention for mirrors and lenses (as the IG does), g = 9.8 m s^-2 unless told otherwise, and standard constants: e = 1.6 x 10^-19 C, h = 6.63 x 10^-34 J s, c = 3.0 x 10^8 m s^-1, k = 1/(4 pi epsilon_0) = 9.0 x 10^9 N m^2 C^-2, m_e = 9.11 x 10^-31 kg, 1 u = 931.5 MeV, k_B = 1.38 x 10^-23 J K^-1.
6. Prefer contexts familiar to Bhutanese learners when they fit naturally (hydropower at Chhukha, Tala or Punatsangchhu, transmission lines, Bhutan's satellite programme and Bhutan-1, prayer-flag poles swaying in the wind, earthquake-resistant traditional and modern buildings, Thimphu's altitude), but never at the cost of physics accuracy.
7. Be scientifically exact. When a source statement is imprecise (for example WO objective x says "wave nature of light" for the de Broglie relation, which describes matter waves), teach the correct physics and note the wording gently.

# Class XII Physics curriculum (themes, topics, sub-topic scopes, learning outcomes)
${curriculumOutline()}`;

export function systemBlocks(roleInstructions: string): Anthropic.Beta.BetaTextBlockParam[] {
  return [
    { type: "text", text: CURRICULUM_SYSTEM, cache_control: { type: "ephemeral", ttl: "1h" } },
    { type: "text", text: roleInstructions },
  ];
}

/** Call-site guard: always check stop_reason before reading content. */
export function assertNotRefused(msg: { stop_reason: string | null; stop_details?: { category?: string | null } | null }) {
  if (msg.stop_reason === "refusal") throw new AiRefusalError(msg.stop_details?.category ?? null);
}
