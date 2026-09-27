"""OCR every question page of the official book into a raw JSON dump (one entry per box)."""
import json
import sys
from multiprocessing import Pool
from pathlib import Path

import pymupdf

import segment

PDF, OUT, FIRST, LAST = sys.argv[1], Path(sys.argv[2]), int(sys.argv[3]), int(sys.argv[4])


def work(pno):
    doc = pymupdf.open(PDF)
    a, boxes = segment.process_page(doc, pno)
    (OUT / "img").mkdir(parents=True, exist_ok=True)
    res = []
    for i, b in enumerate(boxes):
        pic = None
        if b.pic and not b.extra.get("header"):
            pic = f"p{pno:03d}_{i}.webp"
            segment.save_picture(a, b, OUT / "img" / pic)
        res.append({"page": pno, "i": i, "top": b.top, "bottom": b.bottom, "pic": pic, "sep": b.sep_y,
                    "ro": b.ro, "ru": b.ru, "num": b.num, **b.extra})
    return res


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    with Pool(4) as p:
        pages = p.map(work, range(FIRST, LAST + 1), chunksize=1)
    (OUT / "raw.json").write_text(json.dumps([b for pg in pages for b in pg], ensure_ascii=False, indent=1, default=int))
    print("boxes", sum(len(pg) for pg in pages))
