#!/usr/bin/env python3
"""Generate Huntix enemy sprite strips with fal.ai, or emit manual Google Flow checklists."""

from __future__ import annotations

import argparse
import json
import os
import shutil
import subprocess
import sys
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List

ROOT = Path(__file__).resolve().parents[1]
CONFIG_PATH = ROOT / "experiments" / "fal-image" / "enemy-gen-config.json"
ENEMY_ROOT = ROOT / "assets" / "sprites" / "enemies"
MANUAL_DIR = ROOT / "experiments" / "fal-image" / "manual"
RUNS_DIR = ROOT / "experiments" / "fal-image" / "runs"
FAL_RUNNER = ROOT / ".agents" / "skills" / "fal-ai-image" / "scripts" / "fal_queue_image_run.py"


@dataclass
class Job:
    enemy_id: str
    enemy_name: str
    variant_id: str
    folder: str
    state_id: str
    frame_count: int
    state_brief: str
    reference_image: str
    palette_note: str
    prompt: str

    @property
    def key(self) -> str:
        return f"{self.folder}:{self.state_id}"

    @property
    def strip_filename(self) -> str:
        return f"{self.state_id}-strip.png"

    @property
    def strip_path(self) -> Path:
        return ENEMY_ROOT / self.folder / self.strip_filename


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate Huntix enemy strips or emit manual checklist.")
    parser.add_argument("--config", default=str(CONFIG_PATH), help="Path to enemy generation config JSON.")
    parser.add_argument("--mode", choices=["auto", "fal", "manual"], default="auto")
    parser.add_argument("--dry-run", action="store_true", help="Resolve jobs and write manifests without generating images.")
    parser.add_argument("--limit", type=int, default=0, help="Limit number of jobs (debug only).")
    parser.add_argument("--manual-checklist", default="enemy-strip-checklist.md")
    parser.add_argument("--jobs-json", default="enemy-strip-jobs.json")
    return parser.parse_args()


def load_config(path: Path) -> Dict[str, Any]:
    with path.open("r", encoding="utf-8") as fh:
        return json.load(fh)


def build_prompt(config: Dict[str, Any], enemy: Dict[str, Any], variant: Dict[str, Any], state: Dict[str, Any]) -> str:
    style = ", ".join(config.get("style_constraints", []))
    return "\n".join(
        [
            f"Create a sprite strip for {enemy['display_name']} ({variant['id']} variant).",
            "Use the provided reference image to preserve silhouette and proportions.",
            f"Animation: {state['id']} with exactly {state['frames']} frames. {state['brief']}",
            "Layout: one single row, frames left-to-right, equal frame spacing, no extra panels.",
            f"Art direction: {style}.",
            f"Base palette: {enemy['base_palette']}.",
            f"Variant rule: {variant['palette_note']}",
            "Hard constraints: no text, no UI, no motion blur, no camera tilt.",
            "Background: flat solid #00FF00 only (no gradients, no shadows on background, no texture, no spill).",
            "Do not copy any hunter outfit, color scheme, or character-specific details.",
            "Output: one strip image only.",
        ]
    )


def build_jobs(config: Dict[str, Any]) -> List[Job]:
    jobs: List[Job] = []
    for enemy in config.get("enemies", []):
        for variant in enemy.get("variants", []):
            for state in enemy.get("states", []):
                jobs.append(
                    Job(
                        enemy_id=enemy["id"],
                        enemy_name=enemy["display_name"],
                        variant_id=variant["id"],
                        folder=variant["folder"],
                        state_id=state["id"],
                        frame_count=int(state["frames"]),
                        state_brief=state["brief"],
                        reference_image=variant["reference_image"],
                        palette_note=variant["palette_note"],
                        prompt=build_prompt(config, enemy, variant, state),
                    )
                )
    return jobs


def write_json(path: Path, payload: Dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as fh:
        json.dump(payload, fh, indent=2)


def resolve_mode(requested_mode: str) -> str:
    if requested_mode != "auto":
        return requested_mode
    return "fal" if os.getenv("FAL_KEY") else "manual"


def ensure_drop_instructions(jobs: List[Job]) -> None:
    by_folder: Dict[str, List[Job]] = {}
    for job in jobs:
        by_folder.setdefault(job.folder, []).append(job)

    for folder, folder_jobs in by_folder.items():
        target_dir = ENEMY_ROOT / folder
        target_dir.mkdir(parents=True, exist_ok=True)
        expected = sorted({job.strip_filename for job in folder_jobs})
        note = [
            "Drop generated strips in this folder with these exact names:",
            *[f"- {name}" for name in expected],
            "",
            "Format: single-row strips, equal frame spacing, #00FF00 background.",
        ]
        (target_dir / "_DROP_STRIPS_HERE.txt").write_text("\n".join(note), encoding="utf-8")


def write_manual_checklist(jobs: List[Job], checklist_name: str, jobs_name: str) -> None:
    MANUAL_DIR.mkdir(parents=True, exist_ok=True)
    ensure_drop_instructions(jobs)

    checklist_path = MANUAL_DIR / checklist_name
    jobs_json_path = MANUAL_DIR / jobs_name

    rows = []
    lines = [
        "# Huntix Enemy Strip Manual Checklist",
        "",
        "When fal.ai is unavailable, generate strips in Google Flow and save to the expected output paths.",
        "",
        "| Job | Output path | Reference | Frames |",
        "|---|---|---|---|",
    ]

    for job in jobs:
        lines.append(
            f"| `{job.key}` | `{job.strip_path.relative_to(ROOT).as_posix()}` | `{job.reference_image}` | `{job.frame_count}` |"
        )
        rows.append(
            {
                "job": job.key,
                "output_path": str(job.strip_path.relative_to(ROOT).as_posix()),
                "reference_image": job.reference_image,
                "frames": job.frame_count,
                "prompt": job.prompt,
            }
        )

    lines.append("")
    lines.append("## Prompt Blocks")
    lines.append("")
    for job in jobs:
        lines.append(f"### {job.key}")
        lines.append("```")
        lines.append(job.prompt)
        lines.append("```")
        lines.append("")

    checklist_path.write_text("\n".join(lines), encoding="utf-8")
    write_json(jobs_json_path, {"jobs": rows})
    print(f"wrote manual checklist: {checklist_path}")
    print(f"wrote jobs json: {jobs_json_path}")


def find_generated_image(run_dir: Path, prefix: str) -> Path:
    candidates = sorted(run_dir.glob(f"{prefix}-output-*"))
    for path in candidates:
        if path.suffix.lower() in {".png", ".jpg", ".jpeg", ".webp"}:
            return path
    run_manifest = run_dir / f"{prefix}-run.json"
    if run_manifest.exists():
        payload = json.loads(run_manifest.read_text(encoding="utf-8"))
        output_files = payload.get("output_files") or []
        for rel in output_files:
            abs_path = ROOT / rel
            if abs_path.exists():
                return abs_path
    raise FileNotFoundError(f"No generated image found for prefix {prefix} in {run_dir}")


def run_fal_generation(config: Dict[str, Any], jobs: List[Job]) -> None:
    if not os.getenv("FAL_KEY"):
        raise SystemExit("FAL_KEY is missing. Use --mode manual or set FAL_KEY.")
    if not FAL_RUNNER.exists():
        raise SystemExit(f"fal runner script not found: {FAL_RUNNER}")

    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")

    for index, job in enumerate(jobs, start=1):
        reference_path = ROOT / job.reference_image
        if not reference_path.exists():
            raise SystemExit(f"Missing reference image for {job.key}: {reference_path}")

        target_dir = job.strip_path.parent
        target_dir.mkdir(parents=True, exist_ok=True)

        run_dir = RUNS_DIR / stamp / job.folder
        run_dir.mkdir(parents=True, exist_ok=True)
        prefix = f"{job.folder}-{job.state_id}"

        cmd = [
            sys.executable,
            str(FAL_RUNNER),
            "--model-alias",
            str(config.get("model_alias", "nano-banana-2-edit")),
            "--prompt",
            job.prompt,
            "--image-file",
            str(reference_path),
            "--out-dir",
            str(run_dir),
            "--filename-prefix",
            prefix,
            "--task-slug",
            f"huntix-enemy-strip-{job.folder}-{job.state_id}",
            "--num-images",
            "1",
            "--aspect-ratio",
            "16:9",
            "--output-format",
            "png",
            "--resolution",
            "1K",
        ]

        print(f"[{index}/{len(jobs)}] generating {job.key}")
        subprocess.run(cmd, check=True)

        generated = find_generated_image(run_dir, prefix)
        shutil.copy2(generated, job.strip_path)
        print(f"  -> {job.strip_path}")


def main() -> None:
    args = parse_args()
    config_path = Path(args.config)
    config = load_config(config_path)
    jobs = build_jobs(config)

    if args.limit and args.limit > 0:
        jobs = jobs[: args.limit]

    resolved_mode = resolve_mode(args.mode)
    print(f"resolved mode: {resolved_mode}")
    print(f"resolved jobs: {len(jobs)}")

    manifest_path = ROOT / "experiments" / "fal-image" / "enemy-generation-manifest.json"
    write_json(
        manifest_path,
        {
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "mode": resolved_mode,
            "job_count": len(jobs),
            "jobs": [
                {
                    "job": job.key,
                    "folder": job.folder,
                    "state": job.state_id,
                    "frames": job.frame_count,
                    "reference_image": job.reference_image,
                    "strip_path": str(job.strip_path.relative_to(ROOT).as_posix()),
                }
                for job in jobs
            ],
        },
    )
    print(f"wrote generation manifest: {manifest_path}")

    if args.dry_run:
        return

    if resolved_mode == "manual":
        write_manual_checklist(jobs, args.manual_checklist, args.jobs_json)
        return

    run_fal_generation(config, jobs)


if __name__ == "__main__":
    main()
