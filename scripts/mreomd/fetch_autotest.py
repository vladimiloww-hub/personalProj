"""Build the question bank from the auto-test.online API (Moldova, RU + RO).

Replaces the OCR pipeline: the site serves the official ASP questions as JSON,
with the correct answer hidden in `md5sum` (see decode_answer).

Usage: python scripts/mreomd/fetch_autotest.py [--no-images] [--refresh]

Writes src/app/mreomd/data/questions.json and public/mreomd/q/*.webp.
Raw API responses are cached in scripts/mreomd/.cache/ so reruns are offline.
"""

import argparse
import io
import json
import sys
import time
import urllib.request
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
CACHE = Path(__file__).resolve().parent / ".cache"
OUT_JSON = ROOT / "src/app/mreomd/data/questions.json"
IMG_DIR = ROOT / "public/mreomd/q"

BASE = "https://auto-test.online"
HEADERS = {
    "User-Agent": "Mozilla/5.0",
    "Accept": "application/json",
    "X-Requested-With": "XMLHttpRequest",
    "Referer": f"{BASE}/test/?country=md&language=ru",
}
LANGS = ("ru", "ro")

# Site category -> vehicle groups of its extra questions. B holds the common bank.
CATEGORIES = {"B": None, "C": ["truck"], "D": ["bus"], "E": ["trailer"], "F": ["trolley"]}

# Site subject code -> topic id in data/meta.ts
SUBJECT_TOPIC = {
    "1.1": "general",
    "1.2": "drivers",
    "2.1-2.2 A": "signs",
    "2.1-2.2 B": "signs",
    "2.3": "markings",
    "2.4": "signals",
    "2.5-2.6": "signals",
    "3": "lights",
    "4.1": "maneuvers",
    "4.2": "maneuvers",
    "4.3": "speed",
    "4.4": "overtaking",
    "4.5 A": "intersections",
    "4.5 B": "intersections",
    "4.5 C": "intersections",
    "4.5 D": "intersections",
    "4.5 E": "railway",
    "4.6": "stopping",
    "4.7": "towing",
    "4.8 A": "motorway",
    "4.8 B": "motorway",
    "4.9 A": "law",
    "4.9 B": "law",
    "4.10": "priority-vehicles",
    "5 A": "transport",
    "5 B": "transport",
    "6.1": "pedestrians",
    "6.2": "pedestrians",
    "7 A": "technical",
    "7 B": "technical",
    "8": "safety",
    "8.1": "safety",
    "8.2": "safety",
    "8.3": "safety",
    "9": "firstaid",
    "Regulations": "law",
}


def fetch(url: str) -> bytes:
    for attempt in range(4):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=HEADERS), timeout=60) as r:
                return r.read()
        except Exception as e:  # noqa: BLE001 - network hiccups, retry
            if attempt == 3:
                raise
            print(f"  retry {url}: {e}", file=sys.stderr)
            time.sleep(2 + attempt * 3)
    raise AssertionError


def api(path: str, refresh: bool) -> list[dict]:
    """GET an API list, following pagination; cached by path."""
    key = CACHE / (path.replace("/", "_").replace("?", "_").replace("&", "_").replace("=", "-") + ".json")
    if key.exists() and not refresh:
        return json.loads(key.read_text(encoding="utf-8"))
    results, url = [], BASE + path
    while url:
        page = json.loads(fetch(url))
        results += page["results"]
        url = page.get("next")
        time.sleep(0.4)
    CACHE.mkdir(parents=True, exist_ok=True)
    key.write_text(json.dumps(results, ensure_ascii=False), encoding="utf-8")
    return results


def decode_answer(q: dict) -> int:
    """Index of the correct answer, exactly as the site's test-md.js computes it."""
    return int(q["md5sum"][5 + (q["qid"] % 10) * 2])


def clean(s: str) -> str:
    return " ".join(s.replace("<br>", " ").split())


def load_category(cat: str, refresh: bool) -> dict[str, dict[int, dict]]:
    """{lang: {qid: raw question}} for every question of the category."""
    out = {}
    for lang in LANGS:
        subjects = api(f"/api/subjects/?country=md&language={lang}&category={cat}", refresh)
        qids = sorted({int(x) for s in subjects for x in s["questions"].split(",") if x})
        by_qid = {}
        tickets = 24 if cat == "B" else 6
        for t in range(1, tickets + 1):
            for q in api(f"/api/questions/?country=md&language={lang}&category={cat}&ticket={t}", refresh):
                by_qid[q["qid"]] = q
        missing = [q for q in qids if q not in by_qid]
        # Questions outside every ticket are still listed by subject.
        for i in range(0, len(missing), 25):
            chunk = ",".join(map(str, missing[i : i + 25]))
            for q in api(f"/api/questions/?country=md&language={lang}&category={cat}&qids={chunk}", refresh):
                by_qid[q["qid"]] = q
        still = [q for q in qids if q not in by_qid]
        if still:
            print(f"  {cat}/{lang}: {len(still)} listed questions not returned: {still[:10]}", file=sys.stderr)
        out[lang] = by_qid
        print(f"{cat}/{lang}: {len(by_qid)} questions ({len(qids)} listed by subject)")
    return out


def build(refresh: bool, images: bool) -> None:
    records, problems, pics = [], [], []
    for cat, veh in CATEGORIES.items():
        data = load_category(cat, refresh)
        ru, ro = data["ru"], data["ro"]
        for qid in sorted(ru):
            r, o = ru[qid], ro.get(qid)
            a_ru = json.loads(r["answers"])
            a_ro = json.loads(o["answers"]) if o else []
            c = decode_answer(r)
            topic = SUBJECT_TOPIC.get(r["subject"])
            qa_id = f"{cat.lower()}-{qid:04d}"
            if topic is None:
                problems.append(f"{qa_id}: unknown subject {r['subject']!r}")
                topic = "general"
            if not 0 <= c < len(a_ru):
                problems.append(f"{qa_id}: answer {c} out of range {len(a_ru)}")
                continue
            if o and (len(a_ro) != len(a_ru) or decode_answer(o) != c):
                problems.append(f"{qa_id}: RO differs (answers {len(a_ro)} vs {len(a_ru)}), RO dropped")
                o, a_ro = None, []

            def l(ru_s: str, ro_s: str | None) -> dict:
                d = {"ru": clean(ru_s)}
                if ro_s and ro_s.strip():
                    d["ro"] = clean(ro_s)
                return d

            rec = {"id": qa_id, "no": qid}
            if cat == "B" and r.get("ticket"):
                rec["ticket"] = r["ticket"]
            rec["topic"] = topic
            if veh:
                rec["veh"] = veh
            rec["q"] = l(r["question"], o and o["question"])
            rec["a"] = [l(a, a_ro[i] if a_ro else None) for i, a in enumerate(a_ru)]
            rec["c"] = c
            if r.get("hint", "").strip():
                rec["e"] = l(r["hint"], o and o.get("hint"))
            if r["has_img"]:
                src = f"/mreomd/q/{cat}{qid}.webp"
                rec["img"] = {"kind": "image", "src": src}
                pics.append((f"{BASE}/static/custom/img/md/{cat}/{qid}.jpg", ROOT / "public" / src.lstrip("/")))
            records.append(rec)

    OUT_JSON.write_text(json.dumps(records, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(f"\nwrote {len(records)} questions -> {OUT_JSON.relative_to(ROOT)}")
    for p in problems:
        print("  !", p)

    if images:
        IMG_DIR.mkdir(parents=True, exist_ok=True)
        new = [(u, p) for u, p in pics if refresh or not p.exists()]
        print(f"images: {len(pics)} total, downloading {len(new)}")
        for i, (url, path) in enumerate(new, 1):
            # WebP is about half the size of the site's JPEGs at the same look.
            Image.open(io.BytesIO(fetch(url))).convert("RGB").save(path, "WEBP", quality=80, method=6)
            time.sleep(0.15)
            if i % 50 == 0:
                print(f"  {i}/{len(new)}")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--refresh", action="store_true", help="ignore the cache and refetch everything")
    ap.add_argument("--no-images", action="store_true")
    args = ap.parse_args()
    build(args.refresh, not args.no_images)
