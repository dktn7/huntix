#!/usr/bin/env python3
"""
Huntix Sprite Pipeline — Green Screen Keyer + TexturePacker Automation

Usage:
    python process_sprites.py

Expects this input folder structure:
    flow_output/
        dabik/
            idle/           <- PNG or JPG frames from Google Flow
            run/
            attack_light/
            attack_heavy/
            dodge/
            spell_minor/
            spell_advanced/
            weapon_swap/
            hurt/
            dead/
            downed/
            revive/
            ultimate/
        benzu/
        sereisa/
        vesol/

Outputs keyed transparent PNGs to:
    assets/hunters/{hunter}/{state}/

Optionally runs TexturePacker CLI to pack per-hunter atlases.
Set PACK_ATLAS = True below if TexturePacker is installed.

Requirements:
    pip install Pillow
    (Optional) TexturePacker CLI — https://www.codeandweb.com/texturepacker
"""

import os
import subprocess
from pathlib import Path
from PIL import Image

# ─── CONFIG ──────────────────────────────────────────────────────────────────

INPUT_ROOT = Path("flow_output")
OUTPUT_ROOT = Path("assets/hunters")

HUNTERS = ["dabik", "benzu", "sereisa", "vesol"]

STATES = [
    "idle",
    "run",
    "attack_light",
    "attack_heavy",
    "dodge",
    "spell_minor",
    "spell_advanced",
    "weapon_swap",
    "hurt",
    "dead",
    "downed",
    "revive",
    "ultimate",
]

# Green screen colour from all prompts: #00FF00
GREEN_KEY = (0, 255, 0)

# How close to pure green a pixel must be to get keyed out.
# Lower = stricter (only exact green). Higher = more aggressive (catches edge fringing).
# Recommended: 40. Increase to 60 if you see green fringing on edges.
THRESHOLD = 40

# Set to True if TexturePacker CLI is installed and on your PATH.
# Download from https://www.codeandweb.com/texturepacker
PACK_ATLAS = False

# TexturePacker output format. Options: json-array, json-hash, xml, phaser3, etc.
ATLAS_FORMAT = "json-array"

# ─── GREEN KEY ───────────────────────────────────────────────────────────────

def is_green(r, g, b, threshold):
    """
    Returns True if the pixel is close enough to #00FF00 to be keyed out.
    Uses a simple distance check: green channel dominates, red and blue are low.
    """
    return (
        g > 200
        and r < threshold + (g - 200)
        and b < threshold + (g - 200)
    )


def key_green_screen(input_path: Path, output_path: Path, threshold: int = THRESHOLD):
    """
    Opens an image, removes the #00FF00 green background, saves as transparent PNG.
    """
    img = Image.open(input_path).convert("RGBA")
    pixels = img.load()

    width, height = img.size
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            if is_green(r, g, b, threshold):
                pixels[x, y] = (r, g, b, 0)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    img.save(output_path, "PNG")


# ─── FOLDER PROCESSING ───────────────────────────────────────────────────────

def process_state(input_dir: Path, output_dir: Path):
    """
    Keys all images in a state folder and saves transparent PNGs to output_dir.
    Skips non-image files silently.
    """
    if not input_dir.exists():
        return 0

    output_dir.mkdir(parents=True, exist_ok=True)
    count = 0

    image_files = sorted([
        f for f in input_dir.iterdir()
        if f.suffix.lower() in (".png", ".jpg", ".jpeg", ".webp")
    ])

    for file in image_files:
        out_file = output_dir / (file.stem + ".png")
        try:
            key_green_screen(file, out_file)
            count += 1
            print(f"  ✓ {file.name} → {out_file}")
        except Exception as e:
            print(f"  ✗ {file.name} — ERROR: {e}")

    return count


def process_hunter(hunter: str):
    """
    Processes all 13 states for a single hunter.
    """
    print(f"\n{'─' * 50}")
    print(f"  HUNTER: {hunter.upper()}")
    print(f"{'─' * 50}")

    total = 0
    for state in STATES:
        input_dir = INPUT_ROOT / hunter / state
        output_dir = OUTPUT_ROOT / hunter / state

        if not input_dir.exists():
            print(f"  — {state:20s} (no input folder, skipping)")
            continue

        print(f"  Processing: {state}")
        count = process_state(input_dir, output_dir)
        print(f"  → {count} frame(s) keyed")
        total += count

    print(f"\n  {hunter.upper()} done — {total} total frames processed")
    return total


# ─── TEXTUREPACKER ───────────────────────────────────────────────────────────

def pack_atlas(hunter: str):
    """
    Calls TexturePacker CLI to pack all state folders for a hunter into one atlas.
    Outputs atlas.png + atlas.json into assets/hunters/{hunter}/
    """
    hunter_dir = OUTPUT_ROOT / hunter
    sheet_path = hunter_dir / "atlas.png"
    data_path = hunter_dir / "atlas.json"

    # Collect all state folders that exist and have frames
    state_folders = [
        str(hunter_dir / state)
        for state in STATES
        if (hunter_dir / state).exists()
        and any((hunter_dir / state).iterdir())
    ]

    if not state_folders:
        print(f"  No state folders found for {hunter} — skipping atlas pack")
        return

    cmd = [
        "TexturePacker",
        "--format", ATLAS_FORMAT,
        "--sheet", str(sheet_path),
        "--data", str(data_path),
        "--trim-mode", "Trim",
        "--extrude", "1",
        "--algorithm", "MaxRects",
        "--pack-mode", "Best",
        "--filename-strip-extension",
    ] + state_folders

    print(f"\n  Packing atlas for {hunter.upper()}...")
    try:
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode == 0:
            print(f"  ✓ Atlas packed → {sheet_path}")
            print(f"  ✓ Data file   → {data_path}")
        else:
            print(f"  ✗ TexturePacker error:\n{result.stderr}")
    except FileNotFoundError:
        print("  ✗ TexturePacker CLI not found. Install from https://www.codeandweb.com/texturepacker")
        print("    Or set PACK_ATLAS = False to skip atlas packing.")


# ─── MAIN ────────────────────────────────────────────────────────────────────

def main():
    print("\n╔══════════════════════════════════════════════╗")
    print("║   HUNTIX SPRITE PIPELINE                     ║")
    print("║   Green Screen Keyer + TexturePacker          ║")
    print("╚══════════════════════════════════════════════╝")

    if not INPUT_ROOT.exists():
        print(f"\n✗ Input folder '{INPUT_ROOT}' not found.")
        print("  Create it and drop your Flow outputs in:")
        print("  flow_output/{hunter}/{state}/*.png")
        return

    grand_total = 0
    for hunter in HUNTERS:
        hunter_input = INPUT_ROOT / hunter
        if not hunter_input.exists():
            print(f"\n— {hunter.upper()}: no input folder found, skipping")
            continue
        total = process_hunter(hunter)
        grand_total += total

        if PACK_ATLAS:
            pack_atlas(hunter)

    print(f"\n{'═' * 50}")
    print(f"  ALL DONE — {grand_total} total frames keyed across all hunters")
    if PACK_ATLAS:
        print("  Atlas files written to assets/hunters/{{hunter}}/atlas.png + .json")
    else:
        print("  Tip: set PACK_ATLAS = True to auto-pack atlases after keying")
    print(f"{'═' * 50}\n")


if __name__ == "__main__":
    main()
