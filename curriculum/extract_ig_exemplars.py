"""Extract the Class XII exemplar and revision questions from the Physics Instructional Guide (2022).

Usage: python3 -I extract_ig_exemplars.py <ig_class_xii_text.txt> <out.json>
The input is `pdftotext -layout` output of IG pp. 78-157, blank lines removed.
"""
import json, re, sys
from pathlib import Path

src, out = Path(sys.argv[1]), Path(sys.argv[2])
lines = src.read_text().splitlines()

THEMES = {"1. Newtonian Mechanics": "NM", "2. Fluid Mechanics and Thermal Physics": "FMT",
          "3. Electricity and Magnetism": "EM", "4. Waves and Optics": "WO",
          "5. Atomic, Nuclear, and Space Physics": "ANSP"}
NOISE = re.compile(r"(Instructional Guide for Physics|^\s*\d{1,3}\s*$|^\s*Annexure)")
SUB = re.compile(r"^\s*(\d\.\d\.\d)\.?\s+[A-Z]")
QSTART = re.compile(r"^\s*(Questions?|Reflective Questions|Revision Questions?):?\s*$")
ITEM = re.compile(r"^\s*(\d{1,2})\.\s*(.*)")

theme, sub, in_wave_optics = None, None, False
mode, kind = None, None
items, cur = [], None

def flush():
    global cur
    if cur and cur["text"].strip():
        t = re.sub(r"\s+", " ", cur["text"]).strip()
        t = t.replace("—---------------", "________")
        cur["text"] = t
        cur["has_figure"] = bool(re.search(r"figure|graph(s)? (given|shown|below)|shown below|given below", t, re.I))
        items.append(cur)
    cur = None

for raw in lines:
    line = raw.rstrip()
    s = line.strip()
    if s in THEMES:
        flush(); theme = THEMES[s]; sub = None; mode = None; in_wave_optics = False
        continue
    if s.startswith("4.2.Wave Optics") or s.startswith("4.2. Wave Optics"):
        in_wave_optics = True
    m = SUB.match(line)
    if m and mode is None or (m and not ITEM.match(line)):
        if m:
            flush(); mode = None
            num = m.group(1)
            if in_wave_optics and num in ("4.1.1", "4.1.2"):   # IG misnumbering under 4.2
                num = num.replace("4.1.", "4.2.")
            sub = num
            continue
    if QSTART.match(s):
        flush()
        mode = "q"
        kind = "revision" if s.lower().startswith("revision") else "exemplar"
        continue
    if mode == "q" and (s.startswith("Assessment") or s.startswith("Objective")):
        flush(); mode = None; continue
    if mode != "q" or NOISE.search(line):
        continue
    im = ITEM.match(line)
    if im and int(im.group(1)) <= 20 and (cur is None or int(im.group(1)) == cur["n"] + 1 or kind == "exemplar" and int(im.group(1)) == 1):
        flush()
        cur = dict(theme=theme, subtopic=None if kind == "revision" else sub, kind=kind,
                   n=int(im.group(1)), text=im.group(2))
    elif cur is not None:
        cur["text"] += " " + s
flush()

for i, it in enumerate(items, 1):
    it["id"] = f"IG-XII-{it['theme']}-{'R' if it['kind']=='revision' else it['subtopic']}-{it['n']}"
Path(out).write_text(json.dumps(items, indent=2, ensure_ascii=False))
from collections import Counter
print(len(items), Counter(i["kind"] for i in items), Counter(i["theme"] for i in items))
print("with figure:", sum(i["has_figure"] for i in items))
