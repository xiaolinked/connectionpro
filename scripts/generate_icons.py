#!/usr/bin/env python3
"""
Generate website favicon and iOS app icon from the ConnectionPro logo.

The logo: A network/globe (interconnected nodes forming a sphere shape)
inside a gradient ring (dark navy blue transitioning to warm gold/amber),
on a clean background.

Uses 4x supersampling for smooth anti-aliased rendering.
"""

import math
from PIL import Image, ImageDraw
import os
import json

# Output directories
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
CLIENT_PUBLIC = os.path.join(PROJECT_ROOT, "client", "public")
IOS_APPICON = os.path.join(
    PROJECT_ROOT, "ios", "ConnectionPro", "Assets.xcassets", "AppIcon.appiconset"
)

# Supersample factor for anti-aliasing
SS = 4


def lerp_color(c1, c2, t):
    """Linearly interpolate between two RGB colors."""
    return tuple(int(c1[i] + (c2[i] - c1[i]) * t) for i in range(3))


def draw_gradient_ring(img, cx, cy, outer_r, inner_r, steps=720):
    """Draw a gradient ring from navy (top-left) to gold (bottom-right).

    Uses thick arc segments for clean rendering.
    """
    draw = ImageDraw.Draw(img)
    navy = (26, 39, 68)
    gold = (196, 154, 60)
    ring_width = outer_r - inner_r
    mid_r = (outer_r + inner_r) / 2

    # Draw filled arcs as thick lines along the mid-radius
    for i in range(steps):
        angle_start = i * 360.0 / steps
        angle_end = (i + 1.5) * 360.0 / steps  # slight overlap to prevent gaps

        # Gradient position: navy at 225deg (top-left), gold at 45deg (bottom-right)
        t = ((angle_start - 225) % 360) / 360.0
        color = lerp_color(navy, gold, t)

        # Draw arc using pieslice trick: draw outer, then overwrite inner
        bbox_outer = [cx - outer_r, cy - outer_r, cx + outer_r, cy + outer_r]
        draw.arc(bbox_outer, start=angle_start - 90, end=angle_end - 90,
                 fill=color + (255,), width=int(ring_width) + 2)


def draw_logo(size):
    """Draw the ConnectionPro logo at the given size with 4x supersampling."""
    ss_size = size * SS
    img = Image.new("RGBA", (ss_size, ss_size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    cx, cy = ss_size / 2, ss_size / 2
    s = ss_size / 1024.0  # scale factor relative to 1024 base

    # --- Background: light blue-gray gradient ---
    for y in range(ss_size):
        t = y / ss_size
        r = int(232 + (208 - 232) * t)
        g = int(237 + (216 - 237) * t)
        b = int(242 + (224 - 242) * t)
        draw.line([(0, y), (ss_size, y)], fill=(r, g, b, 255))

    # --- Gradient ring ---
    ring_outer_r = 380 * s
    ring_inner_r = 330 * s

    draw_gradient_ring(img, cx, cy, ring_outer_r, ring_inner_r)

    # --- White/light fill inside the ring ---
    inner_fill_r = ring_inner_r - 1 * s
    draw.ellipse(
        [cx - inner_fill_r, cy - inner_fill_r, cx + inner_fill_r, cy + inner_fill_r],
        fill=(240, 243, 248, 255)
    )

    # --- Network/globe (interconnected nodes on a fibonacci sphere) ---
    globe_r = 220 * s
    node_r = 10 * s
    line_width = max(int(3 * s), 1)

    # Generate fibonacci sphere points
    num_points = 30
    phi_golden = (1 + math.sqrt(5)) / 2
    points_3d = []
    for i in range(num_points):
        theta = math.acos(1 - 2 * (i + 0.5) / num_points)
        phi = 2 * math.pi * i / phi_golden
        x = math.sin(theta) * math.cos(phi)
        y = math.sin(theta) * math.sin(phi)
        z = math.cos(theta)
        points_3d.append((x, y, z))

    # Rotate sphere for a nice viewing angle
    rot_x, rot_y = 0.3, 0.5
    rotated = []
    for x, y, z in points_3d:
        # Rotate around X axis
        y2 = y * math.cos(rot_x) - z * math.sin(rot_x)
        z2 = y * math.sin(rot_x) + z * math.cos(rot_x)
        y, z = y2, z2
        # Rotate around Y axis
        x2 = x * math.cos(rot_y) + z * math.sin(rot_y)
        z2 = -x * math.sin(rot_y) + z * math.cos(rot_y)
        x, z = x2, z2
        rotated.append((x, y, z))

    # Project to 2D with depth info
    points_2d = []
    for x, y, z in rotated:
        px = cx + x * globe_r
        py = cy + y * globe_r
        depth = (z + 1) / 2  # 0=back, 1=front
        points_2d.append((px, py, depth))

    # Find connections (nearby points in 3D)
    threshold = 0.85
    connections = []
    for i in range(len(rotated)):
        for j in range(i + 1, len(rotated)):
            dx = rotated[i][0] - rotated[j][0]
            dy = rotated[i][1] - rotated[j][1]
            dz = rotated[i][2] - rotated[j][2]
            if math.sqrt(dx*dx + dy*dy + dz*dz) < threshold:
                connections.append((i, j))

    # Sort by depth (back first)
    connections.sort(key=lambda c: (points_2d[c[0]][2] + points_2d[c[1]][2]) / 2)

    # Draw connection lines
    for i, j in connections:
        p1, p2 = points_2d[i], points_2d[j]
        avg_depth = (p1[2] + p2[2]) / 2
        alpha = int(80 + 175 * avg_depth)
        draw.line(
            [(p1[0], p1[1]), (p2[0], p2[1])],
            fill=(26, 39, 68, alpha),
            width=line_width
        )

    # Sort nodes by depth (back first)
    indexed = sorted(enumerate(points_2d), key=lambda p: p[1][2])

    # Draw nodes
    for idx, (px, py, depth) in indexed:
        nr = node_r * (0.5 + 0.5 * depth)
        alpha = int(100 + 155 * depth)
        draw.ellipse(
            [px - nr, py - nr, px + nr, py + nr],
            fill=(26, 39, 68, alpha)
        )

    # --- Downsample with LANCZOS for anti-aliasing ---
    final = img.resize((size, size), Image.LANCZOS)
    return final


def generate_favicon_ico(logo_img, output_path):
    """Generate a multi-size .ico favicon file."""
    sizes = [16, 32, 48, 64, 128, 256]
    icons = []
    for s in sizes:
        resized = logo_img.resize((s, s), Image.LANCZOS)
        icons.append(resized)

    icons[0].save(
        output_path,
        format="ICO",
        sizes=[(s, s) for s in sizes],
        append_images=icons[1:]
    )


def generate_favicon_svg(output_path):
    """Generate an SVG favicon (scalable)."""
    svg = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="rg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1a2744"/>
      <stop offset="100%" stop-color="#c49a3c"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="64" fill="#e8edf2"/>
  <circle cx="256" cy="256" r="190" fill="none" stroke="url(#rg)" stroke-width="50"/>
  <circle cx="256" cy="256" r="163" fill="#f0f3f8"/>
  <g fill="none" stroke="#1a2744" stroke-width="2.5" opacity="0.7">
    <line x1="256" y1="150" x2="200" y2="200"/>
    <line x1="256" y1="150" x2="310" y2="195"/>
    <line x1="200" y1="200" x2="180" y2="270"/>
    <line x1="200" y1="200" x2="260" y2="230"/>
    <line x1="310" y1="195" x2="260" y2="230"/>
    <line x1="310" y1="195" x2="330" y2="265"/>
    <line x1="180" y1="270" x2="220" y2="330"/>
    <line x1="180" y1="270" x2="260" y2="230"/>
    <line x1="260" y1="230" x2="330" y2="265"/>
    <line x1="260" y1="230" x2="220" y2="330"/>
    <line x1="260" y1="230" x2="300" y2="320"/>
    <line x1="330" y1="265" x2="300" y2="320"/>
    <line x1="220" y1="330" x2="256" y2="365"/>
    <line x1="300" y1="320" x2="256" y2="365"/>
    <line x1="220" y1="330" x2="300" y2="320"/>
    <line x1="200" y1="200" x2="310" y2="195"/>
    <line x1="180" y1="270" x2="330" y2="265"/>
  </g>
  <g fill="#1a2744">
    <circle cx="256" cy="150" r="10"/>
    <circle cx="200" cy="200" r="9"/>
    <circle cx="310" cy="195" r="9"/>
    <circle cx="180" cy="270" r="8"/>
    <circle cx="260" cy="230" r="10"/>
    <circle cx="330" cy="265" r="8"/>
    <circle cx="220" cy="330" r="8"/>
    <circle cx="300" cy="320" r="8"/>
    <circle cx="256" cy="365" r="9"/>
  </g>
</svg>'''
    with open(output_path, "w") as f:
        f.write(svg)


def main():
    print("Generating ConnectionPro icons (4x supersampled)...")

    # Generate the master logo at 1024x1024 (internally rendered at 4096x4096)
    print("  Drawing master logo at 1024x1024 (4x SSAA)...")
    master = draw_logo(1024)

    # --- Website Icons ---
    os.makedirs(CLIENT_PUBLIC, exist_ok=True)

    print("  Generating favicon.ico...")
    generate_favicon_ico(master, os.path.join(CLIENT_PUBLIC, "favicon.ico"))

    print("  Generating favicon.svg...")
    generate_favicon_svg(os.path.join(CLIENT_PUBLIC, "favicon.svg"))

    print("  Generating favicon-32x32.png...")
    master.resize((32, 32), Image.LANCZOS).save(
        os.path.join(CLIENT_PUBLIC, "favicon-32x32.png"), format="PNG"
    )

    print("  Generating favicon-16x16.png...")
    master.resize((16, 16), Image.LANCZOS).save(
        os.path.join(CLIENT_PUBLIC, "favicon-16x16.png"), format="PNG"
    )

    print("  Generating apple-touch-icon.png...")
    master.resize((180, 180), Image.LANCZOS).save(
        os.path.join(CLIENT_PUBLIC, "apple-touch-icon.png"), format="PNG"
    )

    print("  Generating icon-192.png...")
    master.resize((192, 192), Image.LANCZOS).save(
        os.path.join(CLIENT_PUBLIC, "icon-192.png"), format="PNG"
    )

    print("  Generating icon-512.png...")
    master.resize((512, 512), Image.LANCZOS).save(
        os.path.join(CLIENT_PUBLIC, "icon-512.png"), format="PNG"
    )

    # --- iOS App Icon ---
    os.makedirs(IOS_APPICON, exist_ok=True)

    print("  Generating iOS AppIcon (1024x1024)...")
    ios_icon_path = os.path.join(IOS_APPICON, "AppIcon.png")

    # Convert to RGB (no alpha) - iOS app icons must not have alpha channel
    ios_icon_rgb = Image.new("RGB", master.size, (232, 237, 242))
    ios_icon_rgb.paste(master, mask=master.split()[3] if master.mode == "RGBA" else None)
    ios_icon_rgb.save(ios_icon_path, format="PNG")

    # Update Contents.json for iOS
    contents = {
        "images": [
            {
                "filename": "AppIcon.png",
                "idiom": "universal",
                "platform": "ios",
                "size": "1024x1024"
            }
        ],
        "info": {
            "author": "xcode",
            "version": 1
        }
    }
    with open(os.path.join(IOS_APPICON, "Contents.json"), "w") as f:
        json.dump(contents, f, indent=4)

    # Remove old vite.svg if it still exists
    old_svg = os.path.join(CLIENT_PUBLIC, "vite.svg")
    if os.path.exists(old_svg):
        os.remove(old_svg)
        print("  Removed old vite.svg")

    print("\nDone! Generated icons:")
    print(f"  Web ({CLIENT_PUBLIC}):")
    print("    - favicon.ico (16/32/48/64/128/256)")
    print("    - favicon.svg (scalable)")
    print("    - favicon-32x32.png, favicon-16x16.png")
    print("    - apple-touch-icon.png (180x180)")
    print("    - icon-192.png, icon-512.png")
    print(f"  iOS ({IOS_APPICON}):")
    print("    - AppIcon.png (1024x1024)")


if __name__ == "__main__":
    main()
