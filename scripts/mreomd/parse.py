"""Turn the raw OCR dump + answer table into question records.

Usage: python3 parse.py RAW_DIR ANSWERS_TSV VOLUME_TAG OUT_JSON
"""

import json
import re
import sys
from pathlib import Path

CYR = re.compile(r"[А-Яа-яЁё]")
LAT = re.compile(r"[A-Za-zĂÂÎȘȚŞŢăâîșțşţ]")
OPT = re.compile(r"^\s*[\[\(|]?\s*([1-6$§])\s*[\.,:;]\s*(.*)$")

# Answer-table section label -> (site topic id, short label used in ids)
SECTIONS_V1 = [
    ("1.1", "general"),
    ("1.2", "drivers"),
    ("2.2A", "signs"),
    ("2.2B", "signs"),
    ("2.3", "markings"),
    ("2.4", "signals"),
    ("2.5", "signals"),
    ("3", "lights"),
    ("4.1", "maneuvers"),
    ("4.2", "maneuvers"),
    ("4.3", "speed"),
    ("4.4", "overtaking"),
    ("4.5A", "intersections"),
    ("4.5B", "intersections"),
    ("4.5C", "intersections"),
    ("4.5D", "intersections"),
    ("4.5E", "railway"),
    ("4.6", "stopping"),
    ("4.7", "towing"),
    ("4.8A", "motorway"),
    ("4.8B", "motorway"),
    ("4.9A", "law"),
    ("4.9B", "law"),
    ("4.10", "priority-vehicles"),
    ("5A", "transport"),
    ("5B", "transport"),
    ("6", "pedestrians"),
    ("7A", "technical"),
    ("7B", "technical"),
    ("8", "safety"),
    ("8.2", "safety"),
    ("9", "firstaid"),
]

# Rows the answer-table OCR cannot read (white digits on magenta), checked by eye
# against page 150 of the 2022 book.
ANSWER_OVERRIDES_V1 = {"8.2": {1: 5, 2: 4, 3: 4, 4: 1, 5: 1, 6: 4, 7: 4, 8: 4, 9: 2, 10: 4}}


def clean_line(s: str) -> str:
    s = s.replace("—", "-").replace("’", "'").replace("”", '"').replace("“", '"').replace("„", '"')
    s = re.sub(r"\s*[|]\s*$", "", s)
    s = re.sub(r"^\s*[|]\s*", "", s)
    s = re.sub(r"\s+", " ", s)
    return s.strip()


def join(lines: list[str]) -> str:
    out = ""
    for ln in lines:
        if not out:
            out = ln
        elif out.endswith("-") and ln[:1].islower():
            out = out[:-1] + ln
        else:
            out += " " + ln
    out = re.sub(r"\s+([,.;:?!])", r"\1", out)
    return out.strip()


def split_half(text: str):
    lines = [clean_line(x) for x in text.splitlines()]
    lines = [x for x in lines if x and not re.fullmatch(r"[\W_]{1,4}", x)]
    q, opts, cur = [], [], None
    expect = 1
    for ln in lines:
        m = OPT.match(ln)
        if m:
            d = m.group(1)
            n = {"$": 4, "§": 5}.get(d) or int(d)
            if n == expect or (d in "$§" and expect in (4, 5)):
                cur = [m.group(2)]
                opts.append(cur)
                expect += 1
                continue
        if cur is None:
            q.append(ln)
        else:
            cur.append(ln)
    return join(q), [join(o) for o in opts]


def split_mixed(text: str) -> tuple[str, str]:
    """Box without a detected separator: Romanian lines come first, then Russian."""
    lines = text.splitlines()
    for i, ln in enumerate(lines):
        c, l = len(CYR.findall(ln)), len(LAT.findall(ln))
        if c > 8 and c > 2 * l:
            return "\n".join(lines[:i]), "\n".join(lines[i:])
    return text, ""


def _rgb(hexs):
    return tuple(int(hexs[i : i + 2], 16) for i in (0, 2, 4))


def refine_digits(rows):
    """Re-label answer digits by nearest glyph centroid.

    Tesseract reads the bold "1" of this font as "4" now and then. The glyphs
    themselves cluster cleanly, so centroids built from Tesseract's (mostly
    right) labels fix the outliers.
    """
    import numpy as np

    idx, feats, labels = [], [], []
    for i, r in enumerate(rows):
        if len(r) > 5 and r[5] and r[2] in "123456" and len(r[2]) == 1:
            w, h, bits = r[5].split(":")
            feats.append([int(c) for c in bits] + [int(w) / int(h) * 20])
            labels.append(int(r[2]))
            idx.append(i)
    X, lab = np.array(feats, float), np.array(labels)
    for _ in range(10):
        ks = sorted(set(lab))
        cents = np.stack([X[lab == k].mean(0) for k in ks])
        new = np.array(ks)[((X[:, None, :] - cents[None]) ** 2).sum(2).argmin(1)]
        if (new == lab).all():
            break
        lab = new
    for i, v in zip(idx, lab):
        if rows[i][2] != str(v):
            rows[i][2] = str(v)
    return rows


def load_answers(tsv: Path):
    """Split the answer table into sections by row colour.

    Yellow rows are topic headers, orange rows are sub-topic headers, light
    green / white rows are answers, and the magenta block starts a section of
    its own (fire safety) without a header row.
    """
    sections, cur, prev = [], None, None
    rows = refine_digits([ln.split("\t") for ln in tsv.read_text().splitlines()])
    for row in rows:
        _, q, r, full, colour = row[:5]
        R, G, B = _rgb(colour)
        if G > 240 and R < 190:  # column titles
            continue
        yellow = R > 240 and G > 225 and B < 60
        orange = R > 220 and G < 200 and 60 < B < 155
        pink = R > 220 and G < 220 and B >= 155
        kind = "hdr" if (yellow or orange) else ("pink" if pink else "row")
        if kind == "hdr":
            if prev != "hdr":
                cur = {"label": full, "answers": {}, "n": 0}
                sections.append(cur)
            else:
                cur["label"] += " " + full
        else:
            if kind == "pink" and prev not in ("pink", "hdr"):
                cur = {"label": "(pink)", "answers": {}, "n": 0}
                sections.append(cur)
            cur["n"] += 1
            cur["answers"][cur["n"]] = int(r) if r.isdigit() and len(r) == 1 else None
        prev = "hdr" if kind == "hdr" else ("pink" if kind == "pink" else "row")
    return sections


def group_boxes(raw):
    groups, cur = [], None
    prev_header = False
    for b in raw:
        if b.get("skip"):
            continue
        if b.get("header"):
            if not prev_header or cur is None:
                cur = {"header": b["ro"], "boxes": []}
                groups.append(cur)
            else:
                cur["header"] += " / " + b["ro"]
            prev_header = True
            continue
        prev_header = False
        if cur is None:
            cur = {"header": "", "boxes": []}
            groups.append(cur)
        cur["boxes"].append(b)
    return [g for g in groups if g["boxes"]]


def main():
    raw_dir, tsv, vol, out = Path(sys.argv[1]), Path(sys.argv[2]), sys.argv[3], Path(sys.argv[4])
    raw = json.loads((raw_dir / "raw.json").read_text())
    groups = group_boxes(raw)
    answers = load_answers(tsv)
    sections = SECTIONS_V1
    for i, (sec, _) in enumerate(sections):
        for n, c in ANSWER_OVERRIDES_V1.get(sec, {}).items():
            answers[i]["answers"][n] = c
    # The book has exactly as many question boxes, in the same order, as the
    # answer table has rows, so sections are cut by the table's counts. Topic
    # header bars found on the pages only serve as a cross-check.
    flat = [b for g in groups for b in g["boxes"]]
    total = sum(s["n"] for s in answers)
    print(f"boxes {len(flat)}, answer rows {total}, sections {len(answers)}/{len(sections)}")
    if len(flat) != total or len(answers) != len(sections):
        sys.exit("box count does not match the answer table")
    starts, k = set(), 0
    for s in answers:
        starts.add(k)
        k += s["n"]
    k = 0
    for g in groups:
        if k not in starts:
            print(f"  WARNING: header {g['header'][:40]!r} at box {k} is not a section start")
        k += len(g["boxes"])
    cut = []
    k = 0
    for s in answers:
        cut.append({"boxes": flat[k : k + s["n"]]})
        k += s["n"]
    records, problems = [], []
    for gi, g in enumerate(cut):
        sec, topic = sections[gi]
        table = answers[gi]["answers"]
        for n, b in enumerate(g["boxes"], start=1):
            ro_text, ru_text = (b["ro"], b["ru"]) if b.get("sep") else split_mixed(b["ro"])
            qro, aro = split_half(ro_text)
            qru, aru = split_half(ru_text)
            c = table.get(n)
            issues = []
            if not qru or not aru:
                issues.append("no-ru")
            if len(aro) != len(aru):
                issues.append(f"opts ro={len(aro)} ru={len(aru)}")
            if c is None:
                issues.append("no-answer")
            elif c > max(len(aru), len(aro)):
                issues.append(f"answer {c} > options")
            rec = {
                "id": f"{vol}-{sec.lower().replace('.', '')}-{n:03d}",
                "sec": sec,
                "n": n,
                "topic": topic,
                "page": b["page"] + 1,
                "pic": b["pic"],
                "q": {"ru": qru, "ro": qro},
                "a": [{"ru": aru[i] if i < len(aru) else "", "ro": aro[i] if i < len(aro) else ""}
                      for i in range(max(len(aru), len(aro)))],
                "c": (c - 1) if c else None,
                "issues": issues,
            }
            records.append(rec)
            if issues:
                problems.append(rec)
    out.write_text(json.dumps(records, ensure_ascii=False, indent=1))
    print(f"records {len(records)}, with issues {len(problems)}")
    for r in problems[:40]:
        print(" ", r["id"], "p", r["page"], r["issues"])


if __name__ == "__main__":
    main()
