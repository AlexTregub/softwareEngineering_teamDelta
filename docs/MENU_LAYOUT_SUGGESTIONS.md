Menu layout and UX suggestions

- Use a header image with a controlled size (percent of canvas width) so logo doesn't take over the screen.
- Allow per-state layout options inside `MENU_CONFIGS`, e.g. `layout: { spacing: 12, maxWidth: 400 }` so each menu can look distinct.
- Allow `cfg.img` in `MENU_CONFIGS` to override image selection by text.
- Add keyboard navigation (up/down/enter) for accessibility.
- Add per-group alignment flags (left/center/right) for rows with multiple buttons.
- Add animation options (drop-in, fade, scale) with configurable easing for the header and buttons.
- Consider storing button metadata (id, role) for analytics/telemetry if desired.
- Provide an explicit `menu.reset()` to refresh layout after canvas resize rather than relying on `loadButtons()` only.

Small UX tweaks:
- Increase vertical spacing slightly for larger canvases (scale spacing by `g_canvasY / 600`).
- Make small buttons (like credits/debug) use icon-only compact buttons to save vertical space.
- Use a subtle shadow and parallax on header for depth.
