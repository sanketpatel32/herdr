# Launcher for agy child agents in Herdr. Builds per-session settings with the
# real cwd pre-trusted (no trust dialog) and always-proceed (no command prompts),
# then runs agy. argv passing via Python keeps the JSON intact on Windows.
import json, os, subprocess, sys

model = sys.argv[1] if len(sys.argv) > 1 else "gemini-4-hydrogen-medium"
settings = json.dumps({
    "toolPermission": "always-proceed",
    "trustedWorkspaces": [os.getcwd()],
})
sys.exit(subprocess.run(
    ["agy", "--model", model, "--mode", "accept-edits", "--settings", settings]
).returncode)
