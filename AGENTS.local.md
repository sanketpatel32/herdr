# Local machine setup (sanket) — not part of upstream herdr

This machine has a cross-provider visible-subagent orchestration layer on top
of stock herdr. Canonical reference: `~/.agents/rules/herdr-orchestration.md`.
The same workflow is injected into the global configs of devin, codex, opencode.

## Pieces

1. **Orchestration reference** — `~/.agents/rules/herdr-orchestration.md`:
   launch matrix (provider/model -> exact CLI command), hc run/wait/read/send
   workflow, report-back contract, cleanup, approval recipes.

2. **Role templates** — `%APPDATA%\herdr-core\templates\`:
   - `implementer` — devin `--model swe-2-1-medium --permission-mode smart`
   - `researcher` — agy `--model gemini-4-hydrogen-medium` + approval recipe
   - `reviewer` — agy `--model gemini-4-hydrogen-high` + approval recipe
   Use `hc run <template> "task"`; override provider/model per the launch matrix
   when the user asks for a specific one.

3. **Approval/permission setup (verified live 2026-11-26)**:
   - agy children: `--mode accept-edits --settings '{"toolPermission":"always-proceed"}'`
     (per-session, never persisted). `--mode auto` does NOT work: its semantic
     evaluation flags cross-terminal `hc send` and overrides allow rules.
   - `command(hc)` added to `~/.gemini/antigravity-cli/settings.json` allow list.
   - agy trust dialog appears once per new folder before the agent starts;
     approve with `hc keys <child> enter` and resend the task.
   - devin: `--permission-mode smart` auto-approves hc commands, no extra setup.
   - claude: `Bash(hc:*)` allow rule in `~/.claude/settings.json` (created).
   - opencode: `--auto` flag on launch (verified live, zero prompts) plus
     `hc`/`hc *` bash allow rules in `~/.config/opencode/opencode.json`.
     Caveat: the interactive TUI in this version has no `-m` flag — per-child
     model selection is not possible via CLI; the config default model applies.
   - codex: `-a never -s danger-full-access` (verified live). workspace-write
     sandbox hard-blocks the herdr pipe on Windows; `--approve-for-me` too.
     No sandbox = real risk tradeoff; prefer codex as driver, devin/agy as kids.
     Codex needs the task as positional PROMPT arg (else it shows a dashboard)
     and has a one-time-per-folder trust dialog like agy.

4. **Devin in the herdr-app launcher** — documented in
   `~/.config/herdr-app/AGENTS.local.md` (programs.json + my-icons/devin.svg).

## Verified end-to-end

- agy researcher child: spawns nested in sidebar, reads files, reports back
  via `hc send` with zero manual approvals (template path).
- devin implementer child: same, no approval friction at all.
- codex child (sol 6.2): reports back with `-a never -s danger-full-access`.
- opencode child: reports back with `--auto`.
- muse child: REAL task verified — read AGENTS.md, wrote accurate summary file,
  reported back, all with `--yolo` (sandbox must be off: sandboxed commands run
  as separate Windows users and cannot reach the herdr pipe).
- muse added to herdr-app launcher (programs.json + my-icons/muse.svg);
  detection manifest already existed in core. `worker` template = muse ember.
- Parent receives tagged `<hc from="...">` notes; children die with parent.

## Status-bar resource meter (2026-11-26)

`~/.config/herdr-app/mods/workspace-status/` now renders `RAM x GB · CPU y%`
for the whole herdr tree (app + server + terminals + agents + their commands)
in the status bar. `metrics.ps1` does the two-sample CIM walk every 4s;
the mod pauses when the window is hidden and keeps the last good sample on
error. Windows-only, local machine only. Repo copy: `customization/herdr-app/mods/workspace-status/`.
