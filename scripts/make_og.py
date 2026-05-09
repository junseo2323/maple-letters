"""Build the Open Graph share image for Maple Letters.

Outputs:
  public/og-image.jpg  (1200x630, JPEG)
"""
from __future__ import annotations

from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parents[1]
SRC = Path("/home/user/workspace/IMG_4873.jpeg")
OUT = ROOT / "public" / "og-image.jpg"
OUT.parent.mkdir(parents=True, exist_ok=True)

W, H = 1200, 630


def cover_resize(img: Image.Image, target_w: int, target_h: int) -> Image.Image:
    src_w, src_h = img.size
    ratio = max(target_w / src_w, target_h / src_h)
    new_w, new_h = int(src_w * ratio), int(src_h * ratio)
    resized = img.resize((new_w, new_h), Image.LANCZOS)
    # Center crop, but bias upward (subject is in upper-mid of original)
    left = (new_w - target_w) // 2
    top = max(0, (new_h - target_h) // 2 - int(new_h * 0.08))
    return resized.crop((left, top, left + target_w, top + target_h))


def find_font(candidates: list[str], size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    for name in candidates:
        try:
            return ImageFont.truetype(name, size=size)
        except (OSError, IOError):
            continue
    return ImageFont.load_default()


def main() -> None:
    base = Image.open(SRC).convert("RGB")
    canvas = cover_resize(base, W, H)

    # Subtle dark vignette + bottom-up gradient for text legibility
    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)
    # Bottom gradient: 0 -> ~180 alpha over bottom 70%
    grad_top = int(H * 0.30)
    for y in range(grad_top, H):
        t = (y - grad_top) / (H - grad_top)
        a = int(t * t * 200)  # ease-in
        od.rectangle([0, y, W, y + 1], fill=(0, 0, 0, a))
    # Light top fade for the maple-leaf badge area
    for y in range(0, 120):
        t = 1 - (y / 120)
        a = int(t * 90)
        od.rectangle([0, y, W, y + 1], fill=(0, 0, 0, a))

    composite = Image.alpha_composite(canvas.convert("RGBA"), overlay)
    draw = ImageDraw.Draw(composite)

    # Fonts
    bold_candidates = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
    ]
    reg_candidates = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
    ]
    title_font = find_font(bold_candidates, 64)
    sub_font = find_font(reg_candidates, 28)
    eyebrow_font = find_font(bold_candidates, 22)

    # Maple-red accent dot
    accent = (208, 38, 46)  # canadian flag red
    pad_x = 64
    pad_b = 64

    # Eyebrow
    eyebrow_text = "MAPLE LETTERS"
    eyebrow_y = H - pad_b - 70 - 70 - 28 - 36 - 12
    # Red accent square + label
    sq = 14
    draw.rectangle([pad_x, eyebrow_y + 8, pad_x + sq, eyebrow_y + 8 + sq], fill=accent)
    draw.text(
        (pad_x + sq + 12, eyebrow_y),
        eyebrow_text,
        font=eyebrow_font,
        fill=(255, 255, 255),
    )

    # Title (two lines)
    title_line1 = "Leave a letter"
    title_line2 = "from your Canada days"
    title_y = eyebrow_y + 36 + 6
    draw.text((pad_x, title_y), title_line1, font=title_font, fill=(255, 255, 255))
    draw.text((pad_x, title_y + 70), title_line2, font=title_font, fill=(255, 255, 255))

    # Subtitle (KR)
    sub_text = "캐나다에서 함께한 시간을 편지로 남겨보세요"
    sub_y = title_y + 70 + 64 + 12
    # Try a font with Korean glyphs
    kr_font = find_font(
        [
            "/usr/share/fonts/truetype/noto/NotoSansCJK-Regular.ttc",
            "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc",
            "/usr/share/fonts/truetype/noto-cjk/NotoSansCJK-Regular.ttc",
        ],
        32,
    )
    draw.text((pad_x, sub_y), sub_text, font=kr_font, fill=(235, 235, 235))

    # Top-right badge: maple-letters.vercel.app
    url_text = "maple-letters.vercel.app"
    url_font = find_font(reg_candidates, 22)
    bbox = draw.textbbox((0, 0), url_text, font=url_font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    bx, by = W - pad_x - tw - 32, 36
    # Pill
    draw.rounded_rectangle(
        [bx, by, bx + tw + 32, by + th + 22],
        radius=24,
        fill=(0, 0, 0, 140),
        outline=(255, 255, 255, 80),
        width=1,
    )
    draw.text((bx + 16, by + 9), url_text, font=url_font, fill=(255, 255, 255))

    out = composite.convert("RGB")
    out.save(OUT, "JPEG", quality=88, optimize=True, progressive=True)
    print(f"wrote {OUT} ({OUT.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
