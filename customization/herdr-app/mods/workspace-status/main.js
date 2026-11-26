import { View, div, svg } from "gpui-kit";
import { h_flex } from "gpui-base";
import { spaces, agents, theme, run, window, keys, exec, appHome, checking } from "herdr";

export default class WorkspaceStatus extends View {
  // The palette key as actually bound, not a hardcoded one; without a
  // binding the hint stays useful ("commands") instead of lying.
  hint(t) {
    const mac = window()?.platform === "macos";
    const mod = { cmd: mac ? "⌘" : "Ctrl+", ctrl: mac ? "⌃" : "Ctrl+", shift: mac ? "⇧" : "Shift+", alt: mac ? "⌥" : "Alt+", option: mac ? "⌥" : "Alt+" };
    const b = keys().find((k) => k.section === "global" && k.action === "app.palette");
    const parts = b && b.keys.endsWith("--") ? [...b.keys.slice(0, -2).split("-"), "-"] : b?.keys.split("-");
    const key = parts && parts.map((p) => mod[p.toLowerCase()] ?? p.toUpperCase()).join("");
    return key ? `${key}  commands` : "commands";
  }

  init(_props, cx) {
    this.metrics = null;
    this.metricsBusy = false;
    if (!checking()) cx.timer.every(4000, (tcx) => this.sampleMetrics(tcx));
  }

  // Resource use of the whole herdr tree: app, server, terminals, agents and
  // the commands agents spawn. metrics.ps1 samples twice ~1s apart and walks
  // the process trees rooted at the app/server: mods/workspace-status/metrics.ps1.
  sampleMetrics(cx) {
    if (this.metricsBusy || checking() || window()?.visible === false) return;
    this.metricsBusy = true;
    cx.spawn(async (scx) => {
      try {
        const r = await exec("powershell", [
          "-NoProfile", "-ExecutionPolicy", "Bypass", "-File",
          `${appHome()}/mods/workspace-status/metrics.ps1`,
        ], { timeout: 15000 });
        if (r.code === 0) {
          const line = r.stdout.trim().split("\n").pop();
          const m = JSON.parse(line);
          if (typeof m?.cpu === "number" && typeof m?.ramMb === "number") {
            this.metrics = m;
            scx.notify();
          }
        }
      } catch { /* keep the last good sample */ }
      this.metricsBusy = false;
    });
  }

  meter(t) {
    const m = this.metrics;
    if (!m) return div();
    const ram = m.ramMb >= 1024 ? `${(m.ramMb / 1024).toFixed(1)} GB` : `${m.ramMb} MB`;
    return h_flex().gap(6).items_center().text_color(t.dim)
      .tooltip(`herdr + agents: ${m.procs} processes · ${m.cpu}% of ${m.cores} cores`)
      .child(div().child(`RAM ${ram}`))
      .child(div().text_color(t.border).child("·"))
      .child(div().child(`CPU ${m.cpu}%`));
  }

  render() {
    const t = theme();
    const space = spaces().find(s => s.active);
    const list = agents();
    const needs = list.filter(a => a.status === "blocked").length;
    const label = (icon, text) => h_flex().gap(6).items_center().child(svg(`mods/workspace-chrome/${icon}.svg`).size(13)).child(text);
    return h_flex().size_full().px(14).gap(16).items_center().bg(t.chrome).border_t(1).border_color(t.border).text_size(11.8).text_color(t.muted)
      .child(label(space?.machine ? "server" : "monitor", space?.machine ?? "This computer"))
      .when(Boolean(space?.branch), el => el.child(label("branch", space.branch)))
      .child(h_flex().gap(6).items_center().child(div().size(6).rounded(3).bg(t.dim)).child(`${list.length} ${list.length === 1 ? "agent" : "agents"}`)
        .when(needs > 0, el => el.child(div().text_color(t.blocked).child(`· ${needs} ${needs === 1 ? "needs" : "need"} you`))))
      .child(this.meter(t))
      .child(div().flex_1())
      .child(div().id("palette").text_color(t.dim).on_click(() => run("app.palette")).child(this.hint(t)));
  }
}
