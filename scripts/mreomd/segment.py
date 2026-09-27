"""Split a scanned page of the official MECC question book into question boxes.

Every question sits in a framed box: an optional picture on the left, the
Romanian text, a short separator line, the Russian text, and a large grey
question number on the right. This module finds those parts on the raw page
raster and runs Tesseract on each text half with its own language.
"""

from __future__ import annotations

import os
import re
import subprocess
import sys
import tempfile
from dataclasses import dataclass, field
from pathlib import Path

import numpy as np
from PIL import Image


def page_array(doc, pno: int) -> np.ndarray:
    import pymupdf

    page = doc[pno]
    xref = page.get_images()[0][0]
    pix = pymupdf.Pixmap(doc, xref)
    if pix.n != 3:
        pix = pymupdf.Pixmap(pymupdf.csRGB, pix)
    return np.frombuffer(pix.samples, np.uint8).reshape(pix.height, pix.width, 3).copy()


def _runs(mask: np.ndarray, min_gap: int = 3) -> list[tuple[int, int]]:
    idx = np.where(mask)[0]
    if len(idx) == 0:
        return []
    runs, start, prev = [], idx[0], idx[0]
    for i in idx[1:]:
        if i - prev > min_gap:
            runs.append((start, prev))
            start = i
        prev = i
    runs.append((start, prev))
    return runs


@dataclass
class Box:
    top: int
    bottom: int
    left: int
    right: int
    pic: tuple[int, int, int, int] | None = None  # x0, y0, x1, y1 on the page
    text_x0: int = 0
    sep_y: int | None = None
    ro: str = ""
    ru: str = ""
    num: str = ""
    extra: dict = field(default_factory=dict)


def find_boxes(a: np.ndarray) -> list[Box]:
    g = a.mean(2)
    dark = g < 110
    h, w = g.shape
    rows = dark.mean(1)
    lines = [(s + e) // 2 for s, e in _runs(rows > 0.75)]
    boxes: list[Box] = []
    for top, bottom in zip(lines, lines[1:]):
        if bottom - top < 25:
            continue
        band = dark[top + 3 : bottom - 3]
        cols = band.mean(0)
        frame = np.where(cols > 0.9)[0]
        if len(frame) < 2:
            continue
        left, right = int(frame[0]), int(frame[-1])
        if right - left < w * 0.5:
            continue
        boxes.append(Box(top=top, bottom=bottom, left=left, right=right))
    return boxes


def find_picture(a: np.ndarray, b: Box) -> None:
    """Pictures fill the left part of the box edge to edge; text columns are mostly white."""
    y0, y1 = b.top + 4, b.bottom - 4
    x0, x1 = b.left + 4, b.right - 4
    reg = a[y0:y1, x0:x1].astype(int)
    g = reg.mean(2)
    sat = reg.max(2) - reg.min(2)
    n = g.shape[1]
    # Most picture panels are closed by a vertical rule between picture and text.
    rule = np.where((g < 110).mean(0) > 0.85)[0]
    rule = rule[(rule > n * 0.15) & (rule < n * 0.7)]
    if len(rule):
        # Several panels side by side each have their own rules: the picture ends at the last one.
        k = int(rule[-1])
        b.pic = (x0, y0, x0 + k, y1)
        b.text_x0 = x0 + k + 3
        return
    busy = ((g < 225) | (sat > 40)).mean(0)
    # Otherwise look for the column where the busy picture area ends.
    if busy[: 40].mean() < 0.5:
        b.text_x0 = x0
        return
    k = 40
    while k < n - 30:
        if busy[k : k + 12].max() < 0.35:
            break
        k += 1
    if k >= n * 0.8:
        b.text_x0 = x0
        return
    # Snap back to the picture's own edge so the first letters of text are not cut.
    solid = np.where(busy[:k] > 0.85)[0]
    if len(solid):
        k = int(solid[-1]) + 2
    # Vertical extent of the picture (it may not span the full box height).
    pic = ((g[:, : k] < 225) | (sat[:, : k] > 40)).mean(1)
    rows = np.where(pic > 0.3)[0]
    py0 = y0 + int(rows[0]) if len(rows) else y0
    py1 = y0 + int(rows[-1]) if len(rows) else y1
    b.pic = (x0, py0, x0 + k, py1)
    b.text_x0 = x0 + k + 1


def find_separator(a: np.ndarray, b: Box) -> None:
    """The short rule between the Romanian and Russian halves."""
    x0, x1 = b.text_x0, b.right - 4
    reg = a[b.top + 4 : b.bottom - 4, x0:x1].mean(2) < 140
    width = x1 - x0
    best = None
    for yy in range(reg.shape[0]):
        row = reg[yy]
        cnt = row.sum()
        if cnt < 80 or cnt > width * 0.6:
            continue
        runs = _runs(row, min_gap=2)
        if len(runs) == 1 and 80 <= runs[0][1] - runs[0][0] <= 420:
            # rows just above/below must be blank-ish (a real rule, not text)
            above = reg[max(0, yy - 4)].sum()
            below = reg[min(reg.shape[0] - 1, yy + 4)].sum()
            if above < 15 and below < 15:
                best = yy
                break
    if best is not None:
        b.sep_y = b.top + 4 + best


def _tesseract(img: Image.Image, lang: str, psm: int = 6, extra: list[str] | None = None) -> str:
    if img.width < 8 or img.height < 8:
        return ""
    with tempfile.NamedTemporaryFile(suffix=".png") as tf:
        img.save(tf.name)
        cmd = ["tesseract", tf.name, "-", "-l", lang, "--psm", str(psm)] + (extra or [])
        try:
            out = subprocess.run(cmd, capture_output=True, text=True, check=False, timeout=60,
                                 env={**os.environ, "OMP_THREAD_LIMIT": "1"})
        except subprocess.TimeoutExpired:
            print("tesseract timeout", img.size, file=sys.stderr)
            return ""
        return out.stdout


def _box_mean(m: np.ndarray, r: int) -> np.ndarray:
    """Mean of a boolean mask over a (2r+1)^2 window."""
    c = np.pad(m.astype(np.int32), ((r + 1, r), (r + 1, r))).cumsum(0).cumsum(1)
    k = 2 * r + 1
    s = c[k:, k:] - c[:-k, k:] - c[k:, :-k] + c[:-k, :-k]
    return s / (k * k)


def number_mask(a: np.ndarray) -> np.ndarray:
    """Pixels of the big solid grey/coloured question numbers (text strokes are too thin to match)."""
    reg = a.astype(int)
    g = reg.mean(2)
    sat = reg.max(2) - reg.min(2)
    fill = ((g > 115) & (g < 225) & (sat < 35)) | ((sat > 60) & (g > 90))
    core = _box_mean(fill, 5) > 0.85
    return _box_mean(core, 4) > 0


def _text_image(a: np.ndarray, x0: int, y0: int, x1: int, y1: int, nmask: np.ndarray | None = None) -> Image.Image:
    from PIL import ImageFilter

    if y1 - y0 < 4 or x1 - x0 < 4:
        return Image.new("L", (1, 1), 255)
    reg = a[y0:y1, x0:x1].astype(int)
    g = reg.mean(2)
    # The scan is light and thin: stretch contrast, then thicken strokes a little.
    lum = np.clip((g - 40) * 255 / 160, 0, 255)
    if nmask is not None:
        lum[nmask[y0:y1, x0:x1] & (g > 105)] = 255
    img = Image.fromarray(lum.astype(np.uint8))
    img = img.resize((img.width * 3, img.height * 3), Image.BICUBIC)
    return img.filter(ImageFilter.MinFilter(3))


def read_number(a: np.ndarray, b: Box, nmask: np.ndarray) -> str:
    """OCR the large grey question number at the right edge of the box."""
    x1 = b.right - 3
    x0 = x1 - 260
    m = nmask[b.top + 4 : b.bottom - 4, x0:x1]
    rows = np.where(m.any(1))[0]
    cols = np.where(m.any(0))[0]
    if len(rows) < 30:
        return ""
    sub = m[rows[0] : rows[-1] + 1, cols[0] : cols[-1] + 1]
    img = Image.fromarray(np.where(sub, 0, 255).astype(np.uint8))
    img = img.resize((max(1, img.width // 3), max(1, img.height // 3)), Image.LANCZOS)
    pad = Image.new("L", (img.width + 40, img.height + 40), 255)
    pad.paste(img, (20, 20))
    txt = _tesseract(pad, "eng", psm=7, extra=["-c", "tessedit_char_whitelist=0123456789ABCDEFN"])
    return re.sub(r"\s+", "", txt)


def ocr_box(a: np.ndarray, b: Box, nmask: np.ndarray) -> None:
    x0, x1 = b.text_x0, b.right - 4
    y0, y1 = b.top + 4, b.bottom - 4
    if b.sep_y is not None:
        b.ro = _tesseract(_text_image(a, x0, y0, x1, b.sep_y - 2, nmask), "ron")
        b.ru = _tesseract(_text_image(a, x0, b.sep_y + 3, x1, y1, nmask), "rus")
    else:
        b.extra["nosep"] = True
        b.ro = _tesseract(_text_image(a, x0, y0, x1, y1, nmask), "ron+rus")
    b.num = read_number(a, b, nmask)


def process_page(doc, pno: int) -> tuple[np.ndarray, list[Box]]:
    a = page_array(doc, pno)
    boxes = find_boxes(a)
    nmask = number_mask(a)
    for b in boxes:
        reg = a[b.top + 3 : b.bottom - 3, b.left + 3 : b.right - 3].astype(int)
        yellow = ((reg[..., 0] > 190) & (reg[..., 1] > 100) & (reg[..., 2] < 150)).mean()
        if yellow > 0.25:
            b.extra["header"] = True
            b.ro = _tesseract(_text_image(a, b.left + 3, b.top + 3, b.right - 3, b.bottom - 3), "ron+rus")
            continue
        if b.bottom - b.top < 70:
            b.extra["skip"] = True
            continue
        find_picture(a, b)
        find_separator(a, b)
        ocr_box(a, b, nmask)
    return a, boxes


def save_picture(a: np.ndarray, b: Box, path: Path) -> None:
    if not b.pic:
        return
    x0, y0, x1, y1 = b.pic
    Image.fromarray(a[y0:y1, x0:x1]).save(path, "WEBP", quality=72, method=6)
