import os
import json
import subprocess

# Simple wrapper for queue-based generation
def generate_enemy_frame(prompt, output_path):
    # This calls the fal-ai-image skill's script for generation
    # We use gpt-image-1.5-t2i for consistency with the art style
    cmd = [
        "python", ".agents/skills/fal-ai-image/scripts/fal_queue_image_run.py",
        "--model", "gpt-image-1.5-t2i",
        "--prompt", prompt,
        "--output", output_path
    ]
    subprocess.run(cmd, check=True)

# Test run: Grunt Idle Frame 0
config = json.load(open("experiments/fal-image/enemy-gen-config.json"))[0]
prompt = f"{config['base_prompt']}, Grunt IDLE animation frame 0, subtle chest breathing pose"
output_dir = "assets/sprites/enemies/grunt/test"
os.makedirs(output_dir, exist_ok=True)

print(f"Generating test frame: {prompt}")
generate_enemy_frame(prompt, os.path.join(output_dir, "idle_0.png"))
print("Done.")
