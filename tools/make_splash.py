"""Branded splash screens for every Android density.

Keeps the same file names Capacitor generates, replaces the default artwork
with the station emblem over the abyss gradient.
"""

from __future__ import annotations

import glob
import os

from PIL import Image, ImageDraw, ImageFilter

NAVY_TOP = (12, 44, 58)
NAVY_BOTTOM = (1, 7, 12)


def gradient(size):
    w, h = size
    img = Image.new("RGB", (1, h))
    for y in range(h):
        t = y / max(1, h - 1)
        img.putpixel(
            (0, y),
            (
                round(NAVY_TOP[0] + (NAVY_BOTTOM[0] - NAVY_TOP[0]) * t),
                round(NAVY_TOP[1] + (NAVY_BOTTOM[1] - NAVY_TOP[1]) * t),
                round(NAVY_TOP[2] + (NAVY_BOTTOM[2] - NAVY_TOP[2]) * t),
            ),
        )
    return img.resize(size, Image.NEAREST)


def splash(size):
    w, h = size
    base = gradient(size).convert("RGBA")

    # soft light shaft from the top
    shaft = Image.new("RGBA", size, (0, 0, 0, 0))
    sd = ImageDraw.Draw(shaft)
    sd.polygon(
        [(w * 0.34, 0), (w * 0.46, 0), (w * 0.78, h), (w * 0.52, h)],
        fill=(120, 214, 233, 26),
    )
    shaft = shaft.filter(ImageFilter.GaussianBlur(max(6, w * 0.02)))
    base.alpha_composite(shaft)

    icon_path = os.path.join("public", "icons", "icon-512.png")
    icon = Image.open(icon_path).convert("RGBA")
    target = int(min(w, h) * 0.42)
    icon = icon.resize((target, target), Image.LANCZOS)

    # halo behind the emblem
    halo = Image.new("RGBA", size, (0, 0, 0, 0))
    hd = ImageDraw.Draw(halo)
    r = int(target * 0.78)
    hd.ellipse(
        (w // 2 - r, h // 2 - r, w // 2 + r, h // 2 + r),
        fill=(79, 224, 230, 26),
    )
    halo = halo.filter(ImageFilter.GaussianBlur(max(8, w * 0.02)))
    base.alpha_composite(halo)

    base.alpha_composite(icon, (w // 2 - target // 2, h // 2 - target // 2))

    # depth ticks along the bottom
    draw = ImageDraw.Draw(base)
    for i in range(9):
        x = w * 0.5 - w * 0.06 + i * (w * 0.015)
        draw.line([(x, h * 0.82), (x, h * 0.82 + (6 if i % 2 == 0 else 3))], fill=(79, 224, 230, 60), width=2)

    return base.convert("RGB")


for path in glob.glob("android/app/src/main/res/drawable*/splash.png"):
    with Image.open(path) as ref:
        size = ref.size
    img = splash(size)
    img.save(path, "PNG", optimize=True)
    print(f"{path} -> {size[0]}x{size[1]}")

print("splash done")
