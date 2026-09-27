"""Read the answer table (TABELUL CU RĂSPUNSURI) of the official book.

Returns a list of (section_label, [(question_no, answer_no), ...]) in book order.
"""
import re
import sys
from multiprocessing import Pool

import numpy as np
import pymupdf
from PIL import Image

import segment


def _cell(a, x0, x1, y0, y1, whitelist=None, lang="eng", psm=7):
    # max channel: dark digits stay dark on yellow, green and magenta rows alike
    reg = a[y0:y1, x0:x1].max(2).astype(float)
    lum = np.clip((reg - 40) * 255 / 160, 0, 255).astype(np.uint8)
    img = Image.fromarray(lum)
    img = img.resize((img.width * 3, img.height * 3), Image.BICUBIC)
    pad = Image.new("L", (img.width + 30, img.height + 30), 255)
    pad.paste(img, (15, 15))
    extra = ["-c", f"tessedit_char_whitelist={whitelist}"] if whitelist else []
    return segment._tesseract(pad, lang, psm=psm, extra=extra).strip()


def _rows(a):
    g = a.mean(2)
    dark = g < 120
    vx = [int((s + e) / 2) for s, e in segment._runs(dark.mean(0) > 0.5)]
    tables = [vx[i : i + 3] for i in range(0, len(vx) - 2, 3)]
    out = []
    for x0, xm, x1 in tables:
        band = dark[:, x0 + 2 : x1 - 2]
        hy = [int((s + e) / 2) for s, e in segment._runs(band.mean(1) > 0.6)]
        for y0, y1 in zip(hy, hy[1:]):
            if y1 - y0 < 12:
                continue
            reg = a[y0 + 2 : y1 - 1, x0 + 2 : x1 - 2].astype(int)
            # header rows span both cells (no divider at xm)
            divider = dark[y0 + 3 : y1 - 2, xm - 2 : xm + 3].mean() > 0.3
            out.append((x0, xm, x1, y0, y1, divider))
    return out


def _read(args):
    pdf, pno, row = args
    a = segment.page_array(pymupdf.open(pdf), pno)
    x0, xm, x1, y0, y1, divider = row
    full = _cell(a, x0 + 2, x1 - 2, y0 + 2, y1 - 1, lang="ron", psm=7)
    r = _cell(a, xm + 3, x1 - 3, y0 + 2, y1 - 1, whitelist="0123456789")
    q = _cell(a, x0 + 3, xm - 2, y0 + 2, y1 - 1, whitelist="0123456789")
    cell = a[y0 + 2 : y1 - 1, x0 + 2 : xm - 2].reshape(-1, 3)
    bright = cell[cell.mean(1) > 150]
    bg = np.median(bright, 0).astype(int) if len(bright) else np.array([0, 0, 0])
    colour = "%02x%02x%02x" % tuple(bg)
    return ("R", q, r, full.replace("\t", " "), colour, _glyph(a, xm + 3, x1 - 3, y0 + 2, y1 - 1))


def _glyph(a, x0, x1, y0, y1):
    """The answer digit as a 12x18 bitmap, for clustering digits Tesseract confuses (bold 1 vs 4)."""
    reg = a[y0:y1, x0:x1].max(2)
    ink = reg < 110
    ys, xs = np.where(ink)
    if len(ys) < 5:
        return ""
    sub = ink[ys.min() : ys.max() + 1, xs.min() : xs.max() + 1]
    h, w = sub.shape
    if w > h:
        return ""
    img = Image.fromarray((sub * 255).astype(np.uint8)).resize((12, 18), Image.BILINEAR)
    bits = "".join("1" if v > 100 else "0" for v in np.asarray(img).ravel())
    return f"{w}:{h}:{bits}"


def read_table(pdf, pages):
    doc = pymupdf.open(pdf)
    jobs = []
    for pno in pages:
        a = segment.page_array(doc, pno)
        for row in _rows(a):
            jobs.append((pdf, pno, row))
    with Pool(4) as p:
        return p.map(_read, jobs, chunksize=8)


if __name__ == "__main__":
    pdf = sys.argv[1]
    pages = [int(x) for x in sys.argv[2].split(",")]
    for item in read_table(pdf, pages):
        print("\t".join(item))
