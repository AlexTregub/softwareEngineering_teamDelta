# Camera & Map API Inventory — test/puppeteer

This document summarizes the camera and map APIs discovered in the codebase, the pitfalls observed while running the camera probes, and recommended test patterns for the Puppeteer camera tests in `test/puppeteer`.

Summary of findings
- CameraManager (class) is defined in `Classes/controllers/CameraManager.js` and exposes zoom-aware transforms (`worldToScreen`, `screenToWorld`), `setZoom(targetZoom, focusX, focusY)`, `centerOn(worldX, worldY)`, `cameraX/cameraY/cameraZoom` properties, and `clampToBounds()` behavior.
- CameraController (class) is present as a global `window.CameraController` and exposes many global helper functions that are installed onto `window` (for example: `window.worldToScreen`, `window.screenToWorld`, `window.setCameraPosition`, `window.centerCameraOn`). Important: `CameraController.worldToScreen` and `screenToWorld` do NOT apply any zoom factor — they assume a non-scaled camera. They perform simple add/subtract against `cameraX`/`cameraY` globals.
- There are multiple possible camera entry points and globals in the runtime:
  - `window.g_cameraManager` (may or may not be instantiated at runtime) — if present, this is the best source for zoom-aware transforms.
  - `window.CameraController` (class & static methods) — always present and installs global helpers like `window.worldToScreen` that are NOT zoom-aware.
  - `window.cameraX`, `window.cameraY`, `window.cameraZoom` — legacy globals that may be present and can be assigned directly.
- Map/terrain
  - `g_map2` may be present as the gridTerrain instance providing `getCacheStats()`, `setCameraPosition()` and caching internals. In the probe runs `g_map2` was not present (probe returned false), so map-specific behavior may not be available in all runs.

Key probe results (from `pw_camera_zoom_probe.js` run)
- `CameraController` present, `g_cameraManager` was false (no global manager instance available) in the probe run.
- `window.setCameraZoom` global exists and calling it returned true, but `window.worldToScreen` (CameraController) does not apply zoom so measured distances did not scale.
- Directly assigning `window.cameraZoom = 1.5` changed the global but the measurement pipeline used by the tests still relied on `worldToScreen` from CameraController, so the observed scale remained unchanged.
- Result: calling various zoom APIs changed different runtime values, but the measurement path used by the tests (global worldToScreen) did not account for zoom; consequently visual scaling was not observed.

Why the earlier zoom test passed incorrectly
- The original test compared world->screen coordinates for a single point before/after zoom. That check is necessary for a focus-preserving zoom, but it's insufficient to detect whether zoom actually happened. If the test measures using `window.worldToScreen` from CameraController (which ignores zoom), then changes to `cameraZoom` or `g_cameraManager` will not be reflected in the measurement, yielding a false-positive pass.

Recommended testing patterns (what to call in tests)
1) Prefer `g_cameraManager` (or `cameraManager`) if an instance exists at runtime. Its `worldToScreen`/`screenToWorld` are zoom-aware and `setZoom(...)` will correctly change `cameraZoom` and camera position.

  Example (in a Puppeteer page.evaluate):
  - if (window.g_cameraManager) { const screen = window.g_cameraManager.worldToScreen(wx, wy); }

2) If `g_cameraManager` is not available, prefer to use CameraManager APIs by obtaining/creating an instance or invoking the class where possible. If tests cannot access the CameraManager instance, then be aware that the fallback `window.worldToScreen` uses `CameraController` semantics (no zoom).

3) When asserting zoom behavior, always measure at least two nearby world points and assert that the screen distance between them scales by the expected zoom factor. Also sample the canvas pixels at the focus point to catch rendering-level issues.

4) Do not rely solely on a single focus point staying in place. Combine these three checks:
  - cameraZoom changed as reported by the authoritative source (g_cameraManager.cameraZoom or window.cameraZoom if that is the source of truth in your runtime),
  - observed scale between two world points changed (distAfter / distBefore ≈ zoomFactor),
  - canvas pixel sample at the focused screen coords changed (visual verification).

Practical test implementation checklist
- Before running a zoom action, collect diagnostics: `camera = (g_cameraManager ? g_cameraManager : { cameraX, cameraY, cameraZoom })`, `mapStats = (g_map2 ? g_map2.getCacheStats() : null)`.
- Use `camera.centerOn(worldX, worldY)` (prefer `g_cameraManager.centerOn`) to set up the focus.
- Measure `distBefore` between two distinct world points using the SAME transform implementation you will later use to interpret results (i.e., if you will assert on pixels, use canvas sampling; if you will assert on transforms, use `g_cameraManager.worldToScreen`).
- Invoke the zoom API you intend to test (programmatic setZoom, mouse wheel, or global assignment). Wait a short time for the frame/render loop.
- Measure `distAfter` and canvas pixel(s) again.
- Assert: `abs(distAfter / distBefore - zoomFactor) < tolerance` and canvas pixels changed meaningfully.

Suggested immediate next actions
- Update tests to explicitly use `window.g_cameraManager` when available. If tests must run in environments where `g_map2` or `g_cameraManager` may be missing, have the test probe and either skip/mark tests as 'inapplicable' or fail with a clear diagnostic explaining the missing authoritative camera instance.
- If the desired behavior is that CameraController global helpers should be zoom-aware, consider adding a small adapter in the page test setup that maps `window.worldToScreen`/`window.screenToWorld` to `g_cameraManager` methods when the manager exists. Example (page.evaluateOnNewDocument in Puppeteer):

```js
if (window.g_cameraManager) {
  window.worldToScreen = (wx, wy) => window.g_cameraManager.worldToScreen(wx, wy);
  window.screenToWorld = (sx, sy) => window.g_cameraManager.screenToWorld(sx, sy);
}
```

Files inspected
- `Classes/controllers/CameraManager.js` (zoom-aware transforms, setZoom, centerOn, clampToBounds, applyTransform uses scale)
- `Classes/controllers/CameraController.js` (global helpers, non-zoom world/screen helpers)
- `Classes/terrainUtils/gridTerrain.js` (map caching APIs, getCacheStats, setCameraPosition)
- `test/puppeteer/pw_camera_zoom.js` and `pw_camera_transforms.js` (tests that exercise transforms and zoom)
- `test/puppeteer/pw_camera_zoom_probe.js` (the probe script used to generate diagnostics)

Recorded probe outputs
- Probe output was written to `test/puppeteer/screenshots/failure/fail_camera/zoom_probe_*` and `test/puppeteer/screenshots/success/camera/zoom_probe_direct_assign_cameraZoom_global.png`.
- The JSON summary of the probe run is present in the test logs (look for the `zoom probe results` printout when running `node test/puppeteer/pw_camera_zoom_probe.js`).

If you'd like
- I can update the test harness to automatically patch `window.worldToScreen`/`window.screenToWorld` to point at `g_cameraManager` when available (safe shim). This is the smallest change that makes the existing tests correctly measure zoom behavior without requiring large engine changes.
- Alternatively, we can keep tests strict and require tests to run only when `g_cameraManager` is available — that will surface engine gaps earlier.

— end of README
