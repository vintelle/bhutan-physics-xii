import json, sys
from pathlib import Path
d = json.loads(Path(sys.argv[1]).read_text())
out = []
w = out.append
th = {t["code"]: t for t in d["themes"]}
tp = {t["code"]: t for t in d["topics"]}
sub = {s["number"]: s for s in d["subtopics"]}

w("# Class XII Physics: Curriculum Analysis and Learning Outcome Extraction\n")
w("Step 1 of the *Bhutan Grade XII Physics Quiz Platform* build. Everything below comes from only two documents:\n")
for s in d["meta"]["sources"]:
    w(f"- **{s['id']}**: *{s['title']}*. {s['publisher']}, {s['edition']}. Used: {s['pages']}.")
w("\nThe machine-readable version, used to seed the database, is [`curriculum/class-xii-physics.json`](../curriculum/class-xii-physics.json).\n")

w("## 1. At a glance\n")
n_lo = len(d["learning_objectives"])
w("| Item | Count |\n|---|---|")
w(f"| Themes (Units) | {len(d['themes'])} |")
w(f"| Topics (Chapters, IG Annexure 2) | {len(d['topics'])} |")
w(f"| Sub-topics (Concepts, each with an official *Scope*) | {len(d['subtopics'])} |")
w(f"| Learning Objectives (Learning Outcomes) | {n_lo} |")
w(f"| Theme competencies | {sum(len(t['competencies']) for t in d['themes'])} |")
w(f"| Practical investigations named in IG | {len(d['practicals'])} |")
w(f"| IG exemplar questions (topic-level) | {sum(s['ig_exemplar_questions'] for s in d['subtopics'])} (+ about 40 revision questions) |")
w(f"| Teaching time | {d['meta']['total_minutes']} minutes (120 hours) |\n")

w("**Hierarchy used by the platform:** " + d["meta"]["hierarchy"] + ".\n")
w("Learning-outcome codes take the form `XII.<THEME>.<nn>`, for example `XII.EM.07`. The source documents number objectives with Roman numerals that restart in each theme (`EM vii`). Each outcome keeps that original reference too.\n")

w("## 2. Theme and topic weighting (IG Annexure 2)\n")
w("This weighting drives the test blueprint: by default, a generated test spreads its marks in these proportions.\n")
w("| Theme (Unit) | Topic (Chapter) | Minutes | Weighting % |\n|---|---|---:|---:|")
for t in d["themes"]:
    first = True
    for c in [x for x in d["topics"] if x["theme"] == t["code"]]:
        w(f"| {t['name'] if first else ''} | {c['name']} | {c['minutes']} | {c['weighting']} |")
        first = False
    w(f"| | **{t['name']} total** | **{t['minutes']}** | **{t['weighting']}** |")
w("| | **Grand total** | **7200** | **100** |\n")

w("## 3. Competencies by theme (IG Class XII, matching SCF Class-wise Competency)\n")
for t in d["themes"]:
    w(f"### {t['order']}. {t['name']}  (IG pp. {t['ig_pages']}; SCF Table {t['scf_table']})\n")
    w("**Class XII competencies**\n")
    for i, c in enumerate(t["competencies"], 1):
        w(f"{i}. {c}")
    if t.get("notes"):
        w(f"\n> Note: {t['notes']}")
    w("\n**Key Stage 5 competency-based standard(s) this theme feeds**\n")
    for s in t["ks5_standards"]:
        w(f"- {s}")
    w("")

w("## 4. Full learning-outcome map\n")
w("Bloom level is the *primary* cognitive demand of the objective's command verb (SCF 7.1 uses Bloom's taxonomy to write learning outcomes). The quiz engine still writes items at Remembering through Evaluating for every outcome; *Creating*-level outcomes are measured through teacher-assigned performance tasks. P = practical or investigation outcome; N = numerical problems are in scope.\n")
for t in d["themes"]:
    w(f"### {t['name']}\n")
    for c in [x for x in d["topics"] if x["theme"] == t["code"]]:
        w(f"#### Topic: {c['name']}  ({c['minutes']} min · {c['weighting']}%)\n")
        for s in [x for x in d["subtopics"] if x["topic"] == c["code"]]:
            w(f"- **{s['number']} {s['title']}**  \n  *Scope:* {s['scope']}.  \n  *IG approach:* {s['ig_pedagogy']}." + (f"  \n  *Also in IG learning experiences:* {'; '.join(s['ig_extra_concepts'])}." if s["ig_extra_concepts"] else ""))
        w("")
        w("| Code | Obj. | Learning outcome | Sub-topics | Bloom | P | N |\n|---|---|---|---|---|:-:|:-:|")
        for l in [x for x in d["learning_objectives"] if x["topic"] == c["code"]]:
            w(f"| `{l['code']}` | {l['roman']} | {l['statement']} | {', '.join(l['subtopics'])} | {l['bloom_primary']} | {'✓' if l['practical'] else ''} | {'✓' if l['numerical'] else ''} |")
        w("")

w("## 5. Skills and assessment framework the platform must use\n")
w("**Assessment domains (SCF 15.3).** Every item and every mastery report is tagged to one of these:\n")
for k, v in d["meta"]["assessment_domains"].items():
    w(f"- **{k}: {v}**")
w("\n**Scientific Methods and Engineering Practices (SEPs).** Each learning outcome carries the SEPs listed against it in SCF Tables 16–20:\n")
for s in d["meta"]["scientific_methods_engineering_practices"]:
    w(f"- {s}")
w("\n**Society and Technology strand:** " + "; ".join(d["meta"]["society_and_technology"]) + ".\n")
w("**IG pedagogies the AI tutor will name and follow:** CER (Claim–Evidence–Reason), POE / PROE, 5E, POGIL, flipped classroom, structured and guided inquiry, guided discovery, EBA debate, REI (Research–Evidence–Inference), DBGL / digital game-based learning, collaborative learning, CLT (Collaborative Learning Technology) submissions, and CFA (Continuous Formative Assessment) with rubrics, checklists and observation forms.\n")

w("## 6. Practical investigations (IG learning experiences)\n")
w("| Practical | Sub-topic | Apparatus |\n|---|---|---|")
for p in d["practicals"]:
    w(f"| {p['title']} | {p['subtopic']} {sub[p['subtopic']]['title']} | {p['apparatus']} |")
w("")

w("## 7. Bloom profile of the 47 outcomes\n")
from collections import Counter
cnt = Counter(l["bloom_primary"] for l in d["learning_objectives"])
w("| Bloom level | Outcomes |\n|---|---:|")
for b in d["meta"]["bloom_levels"]:
    w(f"| {b} | {cnt.get(b,0)} |")
w(f"\nOf the {n_lo} outcomes, {sum(l['numerical'] for l in d['learning_objectives'])} include numerical problems and {sum(l['practical'] for l in d['learning_objectives'])} are practical or investigation outcomes.\n")

w("## 8. Scope guard-rails for question generation\n")
w("To meet the strict alignment requirement, the generator and the AI tutor will **refuse or redirect** requests on these areas. They are Physics topics, but not Class XII topics in these two documents:\n")
w("- **Class XI content** (IG Annexure 1 topics): Motion in a Straight Line, Motion in a Plane, Laws of Motion, Mechanical Properties of Solids, Work and Energy, Thermal Physics, Magnetic Fields, Class XI Electric Circuit, Class XI Ray Optics, Waves, Electromagnetic Waves, Atoms, Radioactive Decay, Space Applications. Class XII items may *use* these as prior knowledge, but must not *assess* them.")
w("- **Not in either document's Class XII content:** stationary waves, gravitational field and potential, Wien's and Stefan–Boltzmann laws, standard candles, Hubble's law and the Big Bang, p-n junction diodes and transistors. Some of these appear in the newer KS5 2026–2030 drafts, which are deliberately excluded.")
w("- Concepts that appear **only** in IG learning experiences or exemplar questions (listed per sub-topic above) are allowed, but get a `scope_note` and are capped at Understanding level. Examples: Reynolds number, Maxwell speed distribution, Heisenberg's uncertainty principle, NTC and PTC thermistors.\n")

w("## 9. Source discrepancies found, and how they are resolved\n")
w("| # | Issue | Resolution |\n|---|---|---|")
w("| 1 | IG numbers the Wave Optics sub-topics 4.1.1 and 4.1.2 under heading 4.2 (a duplicate of the Ray Optics numbering). | Renumbered 4.2.1 and 4.2.2, following the SCF Table 19 order. |")
w("| 2 | SCF Class XII FMT competencies list 3 items; IG lists 4 (adds kinetic theory). SCF Table 17 still has kinetic-theory objectives iv and v. | Used IG's 4 competencies. |")
w("| 3 | Sub-topic 2.1.1 scope includes *motion of bodies in a uniform gravitational field with fluid resistance*, which sits oddly under Surface Tension. | Kept as written (IG has a learning experience for it); items are tagged to 2.1.1. |")
w("| 4 | WO objective viii (photon energy in eV) and ix (Einstein equation) share one IG lesson block (4.3.1–4.3.3). | Mapped viii to 4.3.1–4.3.2 and ix to 4.3.2–4.3.3. |")
w("| 5 | Objective x (WO) says *wave nature of **light** through the de Broglie wave equation*; the de Broglie relation is the wave nature of **matter** (the sub-topic title). | Statement kept verbatim; items assess *wave nature of matter*, and the explanation notes the wording. |")
w("| 6 | Some IG lessons have no exemplar questions (5.2.2 Nuclear Fission, 5.3.1 Satellite Development), or none that address part of their scope (3.3.1 magnetic-circuit terms). | AI-generated items fill these, marked `source = generated`, and teachers review them before students see them. |")
w("| 7 | SCF lists *Society and Technology* activities (for example *design a model to trap light energy*) that IG does not develop. | Treated as performance-task prompts only, not quiz content. |")
w("")
Path(sys.argv[2]).write_text("\n".join(out))
print("report lines", len(out))
