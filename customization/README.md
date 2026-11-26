# Herdr customization: cross-provider visible subagents

Machine-level customization layer on top of stock herdr + herdr-app.
Gives every supported agent (devin, codex, agy, opencode, muse, claude) a
shared orchestration workflow: spawn visible child terminals on any
provider/model, read and steer them, get tagged report-backs, clean up.

## Contents

| Path | What | Install target |
| --- | --- | --- |
| `herdr-orchestration.md` | Canonical workflow reference: launch matrix, approval recipes, hc workflow | `~/.agents/rules/` (already referenced from agents' global configs) |
| `templates/*.md` | hc role templates: implementer (devin), researcher/reviewer (agy) | `%APPDATA%\herdr-core	emplates\` |
| `herdr-app/programs.json` | Launcher entries: devin, muse | `~/.config/herdr-app/programs.json` |
| `herdr-app/my-icons/*.svg` | Agent icons (lobehub set) | `~/.config/herdr-app/my-icons/` |
| `permissions/*-snippet.json` | hc allow rules per provider | merge into each provider's own settings |
| `herdr-app/mods/workspace-status/` | status-bar resource meter (RAM + CPU of the whole herdr tree: app, server, terminals, agents, agents' commands) | `~/.config/herdr-app/mods/workspace-status/` |

The meter samples all processes twice ~1s apart every 4s (`metrics.ps1`), walks
the trees rooted at herdr-app.exe / herdr-core.exe, and renders RAM + CPU% of
total machine capacity in the status bar, with a process-count tooltip.
Windows-only; pauses when the window is hidden. Local machine only — remote
spaces are not yet broken out.

## Approval recipes (verified live 2026-11-26, Windows)

- devin: `--permission-mode smart` — zero friction
- agy: `--mode accept-edits --settings '{"toolPermission":"always-proceed"}'`
  (per-session; `--mode auto` is broken for hc — semantic evaluation overrides allow rules)
- codex: `-a never -s danger-full-access` — the Windows sandbox hard-blocks the
  herdr IPC pipe, no sandboxed recipe can report back. Unsandboxed: real risk.
  Pass the task as positional PROMPT (else a dashboard appears).
- opencode: `--auto` — model is config-default only (interactive TUI has no -m flag)
- muse: `--yolo` — sandbox runs commands as separate Windows users which breaks
  hc IPC, so `--disable-sandbox` is mandatory; yolo bundles it with no-approval
  and workspace trust. Unsandboxed: same risk class as codex.
- claude: `Bash(hc:*)` allow rule (untested, not installed here)

All providers: first launch in a new folder may show a one-time trust dialog.
The parent approves with `hc keys <child> enter` and resends the task.
