"""Generate the BENTHIC-9 app icon set.

Drawn at 4x and downsampled, so edges are clean at every launcher density.
The emblem: a pressure porthole with a research submersible silhouette, a
floodlight cone and a depth ring. No text, so it stays legible at 48 px.
"""

from __future__ import annotations

import os
from PIL import Image, ImageDraw, ImageFilter

OUT = os.path.join("android", "app", "src", "main", "res")
WEB = "public"
SS = 4  # supersample factor

NAVY_TOP = (12, 44, 58)
NAVY_BOTTOM = (3, 14, 20)
CYAN = (79, 224, 230)
CYAN_DIM = (42, 140, 147)
AMBER = (255, 180, 84)
WHITE = (232, 246, 250)


def rounded_mask(size: int, radius: int) -> Image.Image:
    mask = Image.new("L", (size, size), 0)
    draw = ImageDraw.Draw(mask)
    draw.rounded_rectangle((0, 0, size - 1, size - 1), radius=radius, fill=255)
    return mask


def gradient(size: int) -> Image.Image:
    img = Image.new("RGB", (1, size))
    for y in range(size):
        t = y / max(1, size - 1)
        img.putpixel(
            (0, y),
            (
                round(NAVY_TOP[0] + (NAVY_BOTTOM[0] - NAVY_TOP[0]) * t),
                round(NAVY_TOP[1] + (NAVY_BOTTOM[1] - NAVY_TOP[1]) * t),
                round(NAVY_TOP[2] + (NAVY_BOTTOM[2] - NAVY_TOP[2]) * t),
            ),
        )
    return img.resize((size, size), Image.NEAREST)


def emblem(size: int, foreground_only: bool = False) -> Image.Image:
    s = size * SS
    base = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    draw = ImageDraw.Draw(base)

    if not foreground_only:
        bg = gradient(s).convert("RGBA")
        base.paste(bg, (0, 0), rounded_mask(s, int(s * 0.22)))
        draw = ImageDraw.Draw(base)
        # faint depth rings
        for i in range(3):
            r = int(s * (0.30 + i * 0.075))
            draw.ellipse(
                (s // 2 - r, s // 2 - r, s // 2 + r, s // 2 + r),
                outline=(30, 96, 112, 60 - i * 14),
                width=max(1, int(s * 0.004)),
            )

    cx, cy = s // 2, int(s * 0.5)
    ring_r = int(s * 0.315)

    # porthole outer ring
    draw.ellipse(
        (cx - ring_r, cy - ring_r, cx + ring_r, cy + ring_r),
        fill=(7, 26, 34, 255),
        outline=(46, 116, 133, 255),
        width=max(2, int(s * 0.018)),
    )
    # inner glass
    glass_r = int(ring_r * 0.82)
    draw.ellipse(
        (cx - glass_r, cy - glass_r, cx + glass_r, cy + glass_r),
        fill=(5, 34, 46, 255),
        outline=(79, 224, 230, 120),
        width=max(1, int(s * 0.007)),
    )

    # floodlight cone inside the glass
    cone = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    cd = ImageDraw.Draw(cone)
    cd.polygon(
        [
            (cx - int(s * 0.02), cy - int(s * 0.10)),
            (cx + int(s * 0.06), cy - int(s * 0.10)),
            (cx + int(s * 0.22), cy + int(s * 0.22)),
            (cx - int(s * 0.16), cy + int(s * 0.22)),
        ],
        fill=(255, 226, 176, 42),
    )
    cone = cone.filter(ImageFilter.GaussianBlur(s * 0.012))
    base.alpha_composite(cone)

    # submersible: hull, sail, thruster, lamp
    hull_w, hull_h = int(s * 0.42), int(s * 0.15)
    hx, hy = cx - hull_w // 2, cy + int(s * 0.02)
    draw.rounded_rectangle(
        (hx, hy, hx + hull_w, hy + hull_h),
        radius=hull_h // 2,
        fill=(18, 58, 72, 255),
        outline=CYAN,
        width=max(2, int(s * 0.012)),
    )
    draw.rounded_rectangle(
        (hx + int(s * 0.02), hy + int(s * 0.018), hx + hull_w - int(s * 0.02), hy + int(s * 0.05)),
        radius=int(s * 0.01),
        fill=(30, 92, 110, 255),
    )
    # sail
    sail_w, sail_h = int(s * 0.13), int(s * 0.09)
    sx = cx - sail_w // 2
    draw.rounded_rectangle(
        (sx, hy - sail_h, sx + sail_w, hy + int(s * 0.01)),
        radius=max(2, int(s * 0.012)),
        fill=(16, 52, 66, 255),
        outline=CYAN_DIM,
        width=max(1, int(s * 0.008)),
    )
    # periscope
    draw.line(
        (cx, hy - sail_h, cx, hy - sail_h - int(s * 0.05)),
        fill=CYAN,
        width=max(2, int(s * 0.008)),
    )
    # thruster
    draw.ellipse(
        (hx + hull_w - int(s * 0.02), hy + hull_h // 4, hx + hull_w + int(s * 0.035), hy + hull_h - hull_h // 4),
        fill=(8, 30, 38, 255),
        outline=CYAN_DIM,
        width=max(1, int(s * 0.007)),
    )
    # head lamp + glow
    lamp_x, lamp_y = hx - int(s * 0.01), hy + hull_h // 2
    glow = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gr = int(s * 0.05)
    gd.ellipse((lamp_x - gr, lamp_y - gr, lamp_x + gr, lamp_y + gr), fill=(255, 200, 120, 110))
    glow = glow.filter(ImageFilter.GaussianBlur(s * 0.012))
    base.alpha_composite(glow)
    draw.ellipse(
        (lamp_x - int(s * 0.012), lamp_y - int(s * 0.012), lamp_x + int(s * 0.012), lamp_y + int(s * 0.012)),
        fill=AMBER,
    )

    # sonar ping
    ping_r = int(ring_r * 0.62)
    draw.arc(
        (cx - ping_r, cy - ping_r, cx + ping_r, cy + ping_r),
        start=200,
        end=340,
        fill=(232, 246, 250, 90),
        width=max(1, int(s * 0.008)),
    )

    out = base.resize((size, size), Image.LANCZOS)
    if foreground_only:
        return out
    return out


def write(path: str, img: Image.Image) -> None:
    os.makedirs(os.path.dirname(path), exist_ok=True)
    img.save(path, "PNG", optimize=True)
    print(f"{path} -> {img.size[0]}x{img.size[1]}")


DENSITIES = {
    "mdpi": 48,
    "hdpi": 72,
    "xhdpi": 96,
    "xxhdpi": 144,
    "xxxhdpi": 192,
}

for density, px in DENSITIES.items():
    target = os.path.join(OUT, f"mipmap-{density}")
    write(os.path.join(target, "ic_launcher.png"), emblem(px))
    write(os.path.join(target, "ic_launcher_round.png"), emblem(px))
    write(os.path.join(target, "ic_launcher_foreground.png"), emblem(int(px * 108 / 48), foreground_only=True))

# adaptive icon background is a colour resource (res/values/ic_launcher_background.xml);
# writing a drawable PNG with the same name would collide with the vector drawable.

# web + store assets
write(os.path.join(WEB, "icons", "icon-192.png"), emblem(192))
write(os.path.join(WEB, "icons", "icon-512.png"), emblem(512))
write(os.path.join(WEB, "icons", "icon-maskable-512.png"), emblem(512))
write(os.path.join(WEB, "icons", "apple-touch-icon.png"), emblem(180))
write(os.path.join("store", "icon-512.png"), emblem(512))
print("done")
