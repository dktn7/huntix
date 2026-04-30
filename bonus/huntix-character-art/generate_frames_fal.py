"""
Dependencies:
pip install fal-client requests Pillow imageio numpy opencv-python
"""

import os
import sys
import time
import requests
import argparse
from pathlib import Path
from PIL import Image
import fal_client
import numpy as np
import cv2

# --- CONFIG BLOCK ---
FAL_KEY = os.environ.get("FAL_KEY")
if not FAL_KEY:
    print("Error: FAL_KEY environment variable is not set. API calls will fail.")
    # We don't exit here to allow help/cli to work, but main loop will check this.

HUNTERS = ["dabik", "benzu", "sereisa", "vesol"]
BOSSES = ["thyxis", "kibad", "vrael", "zarth"]
ENEMIES = ["grunt", "ranged", "bruiser", "grunt-zone-variant", "ranged-zone-variant", "bruiser-zone-variant"]
STATES = ["idle", "run", "attack_light", "attack_heavy", "dodge", "spell_minor",
          "spell_advanced", "weapon_swap", "hurt", "dead", "downed", "revive", "ultimate"]
CELL_W, CELL_H = 160, 240
SKIP_EXISTING = True

DABIK_MOTION_PROMPTS = {
    "idle": "character standing completely still, barely breathing, subtle weight shift on one foot, faint black-purple shadow spreading at feet, daggers at hips, absolute stillness of a predator at rest",
    "run": "character sprinting at high speed, low crouched run, shadow aura trailing behind, daggers drawn, fast powerful strides, nearly silent movement",
    "attack_light": "character performs a rapid dagger slash, fast arm extension forward, immediate recovery stance, small purple aura flash at blade tip on contact",
    "attack_heavy": "character lunges forward with both daggers in a cross slash, full body commitment, deep purple shadow burst on impact, brief recovery pause",
    "dodge": "character blinks — disappears and reappears instantly one step behind their original position, shadow particle burst at origin point, no arc no jump",
    "spell_minor": "character flickers forward in a shadow blink, reappears behind target position, brief purple eye glow, dagger raised for follow strike",
    "spell_advanced": "character raises one hand, a dark shadow clone materialises beside them with a faint purple outline, clone holds a matching dagger stance",
    "weapon_swap": "character stands still, twin daggers remain in hand, deep purple aura pulse radiates from both blades, 4 frame flash, returns to idle",
    "hurt": "character recoils backward sharply from an impact, torso twists away, brief stagger step, controlled recovery — shows discipline even when hit",
    "dead": "character crumples to the ground, falls to one knee then collapses forward, shadow aura dissipates on landing, final stillness",
    "downed": "character lying on the ground face down, faint purple pulse at wrists indicating life signs, no movement",
    "revive": "character rises from the ground, pushes up from knees, shadow aura slowly reforms at feet and hands, stands to ready stance",
    "ultimate": "character stands still as all shadow in the scene rushes inward, eyes glow full purple, body flickers between visible and invisible rapidly before vanishing into shadow",
}

BENZU_MOTION_PROMPTS = {
    "idle": "enormous character standing rooted, weight forward on both feet, fists loose at sides, knees barely bent, deep red-gold fracture aura pulsing at knuckles and shoulder plates, completely immovable",
    "run": "massive character running with heavy thundering strides, ground shakes, deep red aura blazing at gauntlets, each footfall sends a small shockwave ripple",
    "attack_light": "character throws a short sharp gauntlet jab, fast for his size, gold fracture flash at knuckle on contact, immediate guard return",
    "attack_heavy": "character winds up a full gauntlet uppercut with enormous body rotation, deep red-gold aura eruption on impact, ground cracks at feet on follow-through",
    "dodge": "character performs a short forward shoulder charge, lowers head and drives forward, staggers anything in the way, not a dodge — a controlled collision",
    "spell_minor": "character drives gauntlet forward in a short range shield bash, gold fracture burst on contact, stun pulse radiates outward from impact point",
    "spell_advanced": "character leaps upward then slams both gauntlets into the ground, massive seismic shockwave ripples outward in all directions, red-gold aura explosion",
    "weapon_swap": "character stands still, gauntlets remain on hands, deep red-gold fracture pulse flares across both knuckles, 4 frame flash, returns to idle",
    "hurt": "character barely moves from a hit, rocks slightly backward, shakes it off with a grimace, almost contemptuous of the damage",
    "dead": "character staggers, drops to one knee with a heavy impact, gauntlets hit the ground, collapses slowly under their own weight, earth shakes on landing",
    "downed": "character lying on side, one gauntlet still raised slightly, faint red pulse at knuckles indicating life signs",
    "revive": "character pushes gauntlets into the ground and levers themselves upright, slow powerful rise, red-gold aura reignites at knuckles as they stand",
    "ultimate": "character raises both gauntlets above head, red-gold aura blazes to full intensity, slams both fists into the ground simultaneously, full screen shockwave erupts outward",
}

SEREISA_MOTION_PROMPTS = {
    "idle": "character in fencer's idle stance, weight on back foot, rapier tip raised slightly, bright yellow-white electric crackle at hand and feet, sparks when weight shifts, upright and deliberate",
    "run": "character running at speed with fencer's upright posture, electric aura crackling at feet, lightning trails on the ground behind each step, rapier held forward",
    "attack_light": "character performs a fast rapier thrust, lunging forward with one foot, electric crackle at blade tip on contact, instant recovery to guard",
    "attack_heavy": "character executes a sweeping rapier slash with full body rotation, yellow-white electric burst along full blade length on impact, brief dramatic pose after",
    "dodge": "character electric dashes forward through enemy position, yellow lightning trail left behind, sparks on exit, reappears in new position instantly",
    "spell_minor": "character raises rapier and fires a small electric dart projectile forward, yellow spark burst at blade tip on release, brief crackle up the arm",
    "spell_advanced": "character points rapier forward, chain lightning arcs from blade tip between multiple targets in sequence, yellow-white electric chain visible",
    "weapon_swap": "character stands still, rapier in hand, intense yellow-white electric pulse crackles along the full blade length, 4 frame flash, returns to fencer idle",
    "hurt": "character takes a hit and pivots away in a trained fencing parry-step, controlled distance recovery, electric sparks briefly disrupted",
    "dead": "character stumbles backward, loses footing, goes down hard, rapier hits ground beside them, electric aura fades to nothing",
    "downed": "character lying on back, rapier beside them, faint yellow spark at fingers indicating life signs",
    "revive": "character rolls to one knee, grabs the rapier, electric aura crackles back to life from the blade outward up the arm, rises to fencer stance",
    "ultimate": "character stands as yellow-white aura expands to full intensity, sparks fill entire frame, character blurs into pure electric speed, afterimages of each dash position",
}

VESOL_MOTION_PROMPTS = {
    "idle": "character standing in precise still posture, cold blue flame particles rising gently from both hands and feet, gate crystal at left wrist glowing faintly, absolutely composed, one loose strand of hair moves slightly",
    "run": "character running at medium pace, structured navy coat flowing behind, cold blue aura at feet intensifying with each step, wrist crystal glowing during movement",
    "attack_light": "character extends left wrist forward, crystal focus flares cold blue, a fast flame bolt projects forward from the crystal, brief recoil of the arm on fire",
    "attack_heavy": "character raises both hands, crystal flares intensely, large flame projectile launches forward with deep blue core shifting to crimson on contact, coat billows back from the force",
    "dodge": "character releases a burst of embers from their hands, orange-red ember scatter pushes outward in all directions, character steps backward out of the ember cloud",
    "spell_minor": "character aims wrist crystal forward, flame bolt fires with cold blue core and orange outer burn, crystal dims slightly after cast",
    "spell_advanced": "character sweeps left arm in an arc, a wall of fire erupts from the ground in a line ahead, blue flame at base shifting to crimson at top",
    "weapon_swap": "character stands still, crystal focus at wrist remains, aura shifts visibly from deep blue to crimson confirming slot switch, 4 frame flash, returns to still idle",
    "hurt": "character flinches back, posture breaks for one moment, aura flickers and dims, recovers composure quickly and reasserts still stance",
    "dead": "character's aura extinguishes entirely, they sink to their knees in a controlled way, then settle to the ground, coat pools around them, crystal goes dark",
    "downed": "character lying on side, coat spread around them, crystal wrist facing upward with a single faint blue pulse indicating life signs",
    "revive": "character's crystal begins to glow first, then cold blue aura reforms from the wrist outward up the arm, character rises in a single composed movement",
    "ultimate": "character raises both hands, aura builds from cold blue through purple to full deep crimson, fire fills the entire frame around them, crystal blazes white-hot, Vesol stands perfectly still in the centre",
}

THYXIS_MOTION_PROMPTS = {
    "idle": "massive fox-wolf yokai standing still, pale blue-white fur crackling with low-level static, thin lightning arcing between bone-white horns, watchful and animal, blue-white aura",
    "move": "massive wolf running with fast aerial strides, lean body built for sudden direction changes, lightning trails from paws, fur blowing in storm",
    "ground_pound": "massive wolf leaps high into the air, aura pulls inward, then slams down with a massive blue-white shockwave erupting from landing point",
    "claw_combo": "massive wolf performs a three-hit sweeping claw sequence, head low, ears flat, wide powerful arcs of blue energy from claws",
    "bolt_dive": "massive wolf dives from the top of the frame wrapped in intense lightning, tracking target below, fur flares bright white",
    "chain_lightning": "massive wolf standing firm, horns charging fully, massive arcs of lightning jumping from horns to multiple points in the frame",
    "howl": "massive wolf tilts head back and howls silently, storm intensity doubles, blue aura pulses with massive power",
    "phase_shift": "massive wolf fur shifts from pale blue to blinding full white, character becomes almost invisible inside the radiating light",
    "defeat": "massive wolf's lightning fades, fur settles to grey-brown, drops to the floor and lies breathing heavily, exhausted, ancient essence dissipating",
}

KIBAD_MOTION_PROMPTS = {
    "idle": "lean angel standing still, white and gold tactical armour, twin bone-white daggers held loosely, wild spiky black hair, white-gold aura radiating outward",
    "run": "lean angel running with economy of motion, feet barely touching the ground, daggers drawn, trailing white-gold particles",
    "blink_slash": "angel disappears in a flash of gold light and instantly reappears in a precise striking pose with daggers extended",
    "dagger_combo": "angel executes a four-hit dagger sequence, extremely fast, each strike brighter than the last, gold energy trails from blades",
    "twin_clones": "angel's aura splits into three identical figures, all moving in synchronised dagger stances, blinding gold light fills the frame",
    "radiant_burst": "angel stands completely still, eyes glow intense gold, aura maximises into a full-screen flash of white-gold light",
    "phase_transition": "angel rises slightly off the ground, aura expands to fill the edges, gold in eyes brightens to solid gold color",
    "ascension": "angel lowers daggers, smiles gently, and rises slowly upward trailing white-gold light that fades as he goes",
}

MOTION_PROMPTS = {
    "dabik": DABIK_MOTION_PROMPTS,
    "benzu": BENZU_MOTION_PROMPTS,
    "sereisa": SEREISA_MOTION_PROMPTS,
    "vesol": VESOL_MOTION_PROMPTS,
    "thyxis": THYXIS_MOTION_PROMPTS,
    "kibad": KIBAD_MOTION_PROMPTS,
}

def needs_regeneration(state_output_dir, cell_w, cell_h, min_frames=8) -> tuple[bool, str]:
    """
    Returns (should_regenerate, reason_string).
    Runs 8 quality checks to determine if frames are game-usable.
    Requires: pip install numpy opencv-python
    """
    import numpy as np
    import cv2

    if not state_output_dir.exists():
        return True, "folder missing"

    pngs = sorted(state_output_dir.glob("*.png"))

    # CHECK 1 — Frame count
    if len(pngs) < min_frames:
        return True, f"only {len(pngs)} frames found (need >= {min_frames})"

    frame_arrays = []
    for f in pngs:

        # CHECK 2 — File not empty
        if f.stat().st_size == 0:
            return True, f"{f.name} is 0 bytes"

        try:
            img = Image.open(f).convert("RGBA")
        except Exception as e:
            return True, f"failed to open {f.name}: {e}"
            
        w, h = img.size

        # CHECK 3 — Correct cell dimensions
        if (w, h) != (cell_w, cell_h):
            return True, f"{f.name} is {w}x{h}, expected {cell_w}x{cell_h}"

        arr = np.array(img)
        rgb = arr[:, :, :3]

        # CHECK 4 — Not a blank green frame (character missing entirely)
        # Check for #00FF00
        green_mask = (rgb[:,:,0] < 20) & (rgb[:,:,1] > 235) & (rgb[:,:,2] < 20)
        green_ratio = float(green_mask.sum()) / (cell_w * cell_h)
        if green_ratio > 0.95:
            return True, f"{f.name} is {green_ratio:.0%} green — character did not render"

        # CHECK 5 — Enough character content visible (not invisible/transparent character)
        non_green_ratio = 1.0 - green_ratio
        if non_green_ratio < 0.04:
            return True, f"{f.name} has only {non_green_ratio:.1%} non-green pixels — character too small or missing"

        # CHECK 6 — Not pitch black (render failure) or pure white (overexposed)
        mean_brightness = float(rgb.mean())
        if mean_brightness < 5:
            return True, f"{f.name} too dark (brightness {mean_brightness:.1f}) — render failed"
        if mean_brightness > 250:
            return True, f"{f.name} overexposed (brightness {mean_brightness:.1f})"

        # CHECK 7 — Sharpness: character must have visible edges, not a blurry smear
        # Variance of Laplacian — blurry images score < 10, sharp sprites score > 50
        gray = cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY)
        sharpness = float(cv2.Laplacian(gray, cv2.CV_64F).var())
        if sharpness < 10.0:
            return True, f"{f.name} too blurry (sharpness {sharpness:.1f}) — unusable for sprites"

        frame_arrays.append(rgb.astype("int32"))

    # CHECK 8 — Animation motion: frames must not all be identical
    # Compare first, middle, and last frame — if all identical, no animation was generated
    if len(frame_arrays) >= 3:
        mid = len(frame_arrays) // 2
        diff_start_mid = float(np.abs(frame_arrays[0] - frame_arrays[mid]).mean())
        diff_start_end = float(np.abs(frame_arrays[0] - frame_arrays[-1]).mean())
        if diff_start_mid < 1.5 and diff_start_end < 1.5:
            return True, f"frames are static — no animation motion detected (diff={diff_start_end:.2f})"

    return False, f"all {len(pngs)} frames pass quality checks"

def main():
    parser = argparse.ArgumentParser(description="Generate Huntix character animation frames using fal.ai Wan 2.1")
    parser.add_argument("--character", help="Regenerate only this character (hunter, boss, or enemy)")
    parser.add_argument("--state", help="Regenerate only this state")
    parser.add_argument("--force", action="store_true", help="Ignore SKIP_EXISTING and quality checks, force regeneration")
    args = parser.parse_args()

    if not FAL_KEY:
        print("Error: FAL_KEY is not set. Cannot call API.")
        sys.exit(1)

    all_characters = HUNTERS + BOSSES + ENEMIES
    chars_to_process = [args.character] if args.character else all_characters
    
    for char in chars_to_process:
        if char not in MOTION_PROMPTS:
            print(f"Warning: No motion prompts defined for {char}. Skipping.")
            continue

        # Reference image lookup logic
        ref_path = None
        # Check standard paths
        standard_paths = [
            Path(f"assets/sprites/hunters/{char}/reference/gamemaster.png"),
            Path(f"assets/sprites/bosses/{char}/reference/gamemaster.png"),
            Path(f"assets/sprites/enemies/{char}/reference/gamemaster.png"),
        ]
        for p in standard_paths:
            if p.exists():
                ref_path = p
                break
        
        # Fallback: Check flow_output for the idle sheet (Step 2)
        if not ref_path:
            flow_dirs = [
                Path(f"assets/flow-output/{char}"),
                Path(f"flow_output/{char}")
            ]
            for flow_dir in flow_dirs:
                if not flow_dir.exists(): continue
                idle_candidates = list(flow_dir.glob(f"{char}-idle_*.jpeg"))
                if idle_candidates:
                    ref_path = idle_candidates[0]
                    print(f"Using idle sheet as reference for {char}: {ref_path}")
                    break
        
        if not ref_path or not ref_path.exists():
            print(f"Warning: Reference image for {char} missing. Skipping.")
            continue
            
        char_states = MOTION_PROMPTS[char]
        states_to_process = [args.state] if args.state else list(char_states.keys())
        
        for state in states_to_process:
            if state not in char_states:
                print(f"Warning: State {state} not defined for {char}. Skipping.")
                continue

            state_dir = Path(f"flow_output/{char}/{state}")
            
            should_regen = True
            reason = "forced"
            
            if not args.force:
                should_regen, reason = needs_regeneration(state_dir, CELL_W, CELL_H)
                
            if not should_regen and SKIP_EXISTING:
                print(f"Skipping {char}/{state}: {reason}")
                continue
                
            print(f"Regenerating {char}/{state} - {reason}")
            
            # Delete old content if folder exists
            if state_dir.exists():
                import shutil
                shutil.rmtree(state_dir)
            state_dir.mkdir(parents=True, exist_ok=True)
            
            try:
                prompt = char_states[state]
                print(f"  Uploading reference: {ref_path}")
                image_url = fal_client.upload_file(str(ref_path))
                
                print(f"  Calling fal-ai/wan-i2v...")
                result = fal_client.subscribe(
                    "fal-ai/wan-i2v",
                    arguments={
                        "image_url": image_url,
                        "prompt": prompt,
                    }
                )
                
                video_url = result["video"]["url"]
                print(f"  Video generated: {video_url}")
                
                # Download the MP4
                video_path = state_dir / f"{char}_{state}_temp.mp4"
                with requests.get(video_url, stream=True) as r:
                    r.raise_for_status()
                    with open(video_path, "wb") as f:
                        for chunk in r.iter_content(chunk_size=8192):
                            f.write(chunk)
                
                # Extract frames and pad to fixed cell size
                print(f"  Extracting frames to {CELL_W}x{CELL_H}...")
                cap = cv2.VideoCapture(str(video_path))
                frame_idx = 0
                while True:
                    ret, frame = cap.read()
                    if not ret:
                        break
                    
                    # Convert BGR (cv2) to RGB
                    frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                    pil_img = Image.fromarray(frame_rgb)
                    
                    # Pad to fixed size
                    canvas = Image.new("RGB", (CELL_W, CELL_H), (0, 255, 0))
                    
                    offset_x = (CELL_W - pil_img.width) // 2
                    offset_y = (CELL_H - pil_img.height) // 2
                    
                    canvas.paste(pil_img, (offset_x, offset_y))
                    
                    output_path = state_dir / f"frame_{frame_idx:04d}.png"
                    canvas.save(output_path)
                    frame_idx += 1
                
                cap.release()
                video_path.unlink() # Delete temp video
                print(f"  Successfully saved {frame_idx} frames to {state_dir}")
                
            except Exception as e:
                print(f"  Error generating {char}/{state}: {e}")

if __name__ == "__main__":
    main()
