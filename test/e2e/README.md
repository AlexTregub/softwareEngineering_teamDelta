# End-to-End (E2E) Tests

**Purpose**: Test complete user workflows in a real browser environment using Puppeteer.

---

## Structure

```
e2e/
├── camera/              # Camera zoom, pan, transform tests
├── spawn/               # Ant and resource spawning tests
├── combat/              # Combat initiation tests
├── selection/           # Selection box and entity selection tests
├── ui/                  # UI panel dragging and interaction tests
├── screenshots/         # Test screenshots (success/failure per category)
├── puppeteer_helper.js  # Browser launch, screenshot utilities
├── camera_helper.js     # Camera-specific test helpers
└── run-tests.js         # Test runner for all E2E tests
```

---

## Running Tests

### Run All E2E Tests
```bash
npm run test:e2e
```

### Run Specific Category
```bash
npm run test:e2e:camera
npm run test:e2e:spawn
npm run test:e2e:combat
npm run test:e2e:selection
npm run test:e2e:ui
```

### Run Individual Test
```bash
node test/e2e/camera/pw_camera_zoom.js
node test/e2e/selection/selection-box.test.js
```

---

## Prerequisites

1. **Start dev server** (in separate terminal):
```bash
npm run dev
```
   - Server runs on `http://localhost:8000`
   - Background task: `startDevServer` in VS Code tasks
   - Check if running: `Get-Task-Output` for `startDevServer`

2. **Chrome browser** installed (or set `TEST_CHROME_PATH`)

---

## Server Management for Tests

### Automatic Server Detection
Tests will connect to `http://localhost:8000` by default. If the dev server isn't running:

```bash
# Start server in background (Windows PowerShell)
Start-Process powershell -ArgumentList "npm run dev" -WindowStyle Hidden

# Or start in foreground
npm run dev
```

### Verify Server is Running
```bash
# PowerShell
(Invoke-WebRequest -Uri http://localhost:8000 -UseBasicParsing).StatusCode
# Should return 200

# Or check VS Code tasks
# Look for "startDevServer" in Terminal panel
```

### Browser Cache Issues
If tests fail with stale JavaScript, clear Chrome cache:
```bash
npm run test:clear-cache
# Or manually run: .vscode/clear-chrome-cache.ps1
```

---

## Advancing Past Main Menu (CRITICAL!)

**Problem**: Game starts on main menu by default. Most tests need the game in PLAYING state.

### Solution 1: Use `camera_helper.ensureGameStarted()` (RECOMMENDED)

```javascript
const cameraHelper = require('../camera_helper');

// After page.goto()...
const gameStarted = await cameraHelper.ensureGameStarted(page);
console.log('Game started:', gameStarted.started);
console.log('Methods called:', gameStarted.diagnostics?.called);
```

**What it does**:
1. Checks if `GameState.getState() === 'PLAYING'`
2. Calls `GameState.startGame()` if available
3. Tries `startGameTransition()` legacy function
4. **Clicks the PLAY button** in the DOM
5. Waits 500ms for state transition
6. Verifies game started (checks for ants array or PLAYING state)

### Solution 2: Manual Game State (Less Reliable)

```javascript
await page.evaluate(() => {
  window.gameState = 'PLAYING';
  if (window.GameState && typeof window.GameState.startGame === 'function') {
    window.GameState.startGame();
  }
});
await sleep(1000); // Wait for state to settle
```

### Verification: Check Screenshots
If your screenshot shows the main menu (ANTS title, PLAY/OPTIONS/EXIT buttons), the game **did not advance**. You must:
1. Use `cameraHelper.ensureGameStarted(page)`
2. Verify `gameStarted.started === true`
3. Add `await sleep(1000)` after game start for rendering to catch up

---

## Screenshot Expectations and Evidence

### Purpose
Screenshots provide **visual proof** that tests are actually working, not just checking internal state.

### Location
```
test/e2e/screenshots/
├── ui/
│   ├── success/
│   │   ├── panel_minimize_initial.png
│   │   └── panel_minimize_minimized.png
│   └── failure/
│       └── fail_panel_error_TIMESTAMP.png
├── camera/
│   └── success/zoom_level_100.png
└── ...
```

### Naming Convention
```javascript
await saveScreenshot(page, 'category/descriptive_name', isSuccess);
//                          ↑                           ↑
//                   Matches folder          true = success/, false = failure/
```

### Visual Validation Checklist

When reviewing screenshots, verify:

✅ **NOT on main menu** - Should see game terrain, ants, resources, UI panels
❌ **Main menu visible** - Means `ensureGameStarted()` failed or wasn't called
✅ **Expected UI elements** - Panels, buttons, controls should be visible
✅ **Correct state** - Minimized panel should show only title bar, not full content
✅ **Proper rendering** - No black screens, no missing graphics

### Example: Panel Minimize Test

**Expected Screenshots**:
1. `panel_minimize_initial.png`:
   - ✅ Game terrain visible (not main menu)
   - ✅ Full panel showing (title + 5 content lines)
   - ✅ Panel positioned at (300, 150)

2. `panel_minimize_minimized_actual.png`:
   - ✅ Game terrain visible
   - ✅ Panel showing ONLY title bar (50px height)
   - ✅ No content lines visible
   - ✅ Minimize button changed from `−` to `+`

3. `panel_minimize_restored.png`:
   - ✅ Full panel restored with all content

### Common Screenshot Issues

| Issue | Cause | Fix |
|-------|-------|-----|
| Main menu visible | Game didn't start | Use `cameraHelper.ensureGameStarted()` |
| Black/blank screen | Rendering not ready | Add `await sleep(500)` before screenshot |
| State changed but not visible | No redraw after state change | Call `window.redraw()` or `renderPanels()` |
| Wrong panel state | Screenshot taken before render | Add render call + sleep before screenshot |

---

## Force Rendering After State Changes (p5.js)

**Critical**: p5.js doesn't auto-redraw when you change game state via JavaScript. You must force renders:

```javascript
// After changing panel state (minimize, show, hide, etc.)
await page.evaluate(() => {
  // Set game state
  window.gameState = 'PLAYING';
  
  // Force panel rendering
  if (window.draggablePanelManager) {
    if (window.draggablePanelManager.gameState !== undefined) {
      window.draggablePanelManager.gameState = 'PLAYING';
    }
    if (typeof window.draggablePanelManager.renderPanels === 'function') {
      window.draggablePanelManager.renderPanels('PLAYING');
    }
  }
  
  // Force p5.js redraw
  if (typeof window.redraw === 'function') {
    window.redraw();
    window.redraw(); // Multiple redraws ensure layers update
    window.redraw();
  }
});

await sleep(500); // Wait for render to complete
await saveScreenshot(page, 'category/after_state_change', true);
```

### When to Force Renders

- ✅ After `panel.toggleMinimized()`
- ✅ After `panel.show()` or `panel.hide()`
- ✅ After changing `window.gameState`
- ✅ After spawning entities
- ✅ Before taking screenshots

---

## Panel State Visibility System

**Important**: Panels only render if they're in the current game state's visibility list.

### How It Works

```javascript
// In DraggablePanelManager
stateVisibility = {
  'MENU': ['presentation-control', 'debug'],
  'PLAYING': ['ant_spawn', 'health_controls', 'debug'],
  // Your test panel NOT in these lists by default!
}
```

### Adding Test Panels to Visibility

```javascript
// After creating panel
await page.evaluate(() => {
  // Ensure PLAYING state visibility exists
  if (window.draggablePanelManager && window.draggablePanelManager.stateVisibility) {
    if (!window.draggablePanelManager.stateVisibility.PLAYING) {
      window.draggablePanelManager.stateVisibility.PLAYING = [];
    }
    
    // Add your test panel
    const panelId = 'test-minimize-panel';
    if (!window.draggablePanelManager.stateVisibility.PLAYING.includes(panelId)) {
      window.draggablePanelManager.stateVisibility.PLAYING.push(panelId);
      console.log('✅ Added', panelId, 'to PLAYING state visibility');
    }
  }
});
```

---

## Prerequisites

1. **Start dev server** (in separate terminal):
```bash
npm run dev
```

2. **Chrome browser** installed (or set `TEST_CHROME_PATH`)

---

## Writing New E2E Tests

### Template

```javascript
#!/usr/bin/env node
const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');

(async () => {
  const url = process.env.TEST_URL || 'http://localhost:8000?test=1';
  console.log('Running my test against', url);

  let browser;
  try {
    browser = await launchBrowser();
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });
    
    // Navigate to game
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 });
    await sleep(2000);

    // Ensure game started
    await page.evaluate(() => {
      if (typeof window.ensureGameStarted === 'function') {
        window.ensureGameStarted();
      }
    });

    // Your test logic here...
    const result = await page.evaluate(() => {
      // Test game state
      return { success: true };
    });

    // Save screenshot (category/name format)
    await saveScreenshot(page, 'myCategory/test_name', result.success);

    await browser.close();
    process.exit(result.success ? 0 : 1);

  } catch (error) {
    console.error('Test failed:', error.message);
    if (browser) {
      const page = (await browser.pages())[0];
      if (page) await saveScreenshot(page, 'myCategory/test_error', false);
      await browser.close();
    }
    process.exit(1);
  }
})();
```

### Best Practices

✅ **DO**:
- Use `?test=1` URL parameter for test helpers
- Call `ensureGameStarted()` before testing
- Use category-based screenshot paths: `'camera/zoom_in'`
- Set viewport for consistent rendering
- Include error handling and failure screenshots
- Test with headless Chrome (CI/CD compatible)

❌ **DON'T**:
- Test internal mechanics (loop counters, private methods)
- Use mocks when testing the real system
- Take screenshots without verifying game started
- Change state without forcing renders
- Assume panels are visible without adding to state visibility

---

## Complete Working Example: Panel Minimize Test

See `test/e2e/ui/pw_panel_minimize.js` for full implementation. Key sections:

### 1. Setup and Server Connection
```javascript
const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');
const cameraHelper = require('../camera_helper');

(async () => {
  const url = process.env.TEST_URL || 'http://localhost:8000?test=1';
  console.log('🧪 Running DraggablePanel Minimize E2E Test');

  let browser, page;
  try {
    browser = await launchBrowser();
    page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });

    console.log('📡 Loading game...');
    await page.goto(url, { waitUntil: 'networkidle2' });
    await sleep(2000);
```

### 2. Advance Past Main Menu (CRITICAL!)
```javascript
    // Use camera_helper's robust ensureGameStarted
    console.log('▶️  Starting game and advancing past menu...');
    const gameStarted = await cameraHelper.ensureGameStarted(page);
    console.log('   ✅ Game started:', gameStarted.started);
    console.log('   Methods called:', gameStarted.diagnostics?.called);
    
    if (!gameStarted.started) {
      console.warn('⚠️  Warning: Game may not have started properly');
      throw new Error('Failed to start game - still on main menu');
    }
    
    await sleep(1000);
```

### 3. Create Test Panel with Visibility
```javascript
    const panelSetup = await page.evaluate(() => {
      try {
        // Force PLAYING state
        window.gameState = 'PLAYING';
        
        // Add test panel to PLAYING state visibility
        if (window.draggablePanelManager && window.draggablePanelManager.stateVisibility) {
          if (!window.draggablePanelManager.stateVisibility.PLAYING) {
            window.draggablePanelManager.stateVisibility.PLAYING = [];
          }
          const panelId = 'test-minimize-panel';
          if (!window.draggablePanelManager.stateVisibility.PLAYING.includes(panelId)) {
            window.draggablePanelManager.stateVisibility.PLAYING.push(panelId);
            console.log('✅ Added test-minimize-panel to PLAYING state visibility');
          }
        }
        
        // Create panel
        const panel = window.draggablePanelManager.addPanel({
          id: 'test-minimize-panel',
          title: '🔽 MINIMIZE TEST PANEL',
          position: { x: 300, y: 150 },
          size: { width: 500, height: 300 },
          style: {
            backgroundColor: [220, 50, 50, 230], // Bright red for visibility
            titleColor: [255, 255, 255],
          },
          buttons: {
            items: [
              { caption: 'Content Line 1', width: 450, height: 40 },
              { caption: 'Content Line 2', width: 450, height: 40 },
              // ... more content
            ]
          }
        });
        
        panel.show();
        return { success: true, position: panel.state.position };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });
    
    if (!panelSetup.success) {
      throw new Error('Failed to create panel: ' + panelSetup.error);
    }
```

### 4. Force Render and Screenshot
```javascript
    // Wait for panel to be added to DOM
    await sleep(1500);
    
    // Force rendering in PLAYING state
    await page.evaluate(() => {
      window.gameState = 'PLAYING';
      
      if (window.draggablePanelManager) {
        if (window.draggablePanelManager.gameState !== undefined) {
          window.draggablePanelManager.gameState = 'PLAYING';
        }
        if (typeof window.draggablePanelManager.renderPanels === 'function') {
          window.draggablePanelManager.renderPanels('PLAYING');
        }
        if (typeof window.draggablePanelManager.render === 'function') {
          window.draggablePanelManager.render();
        }
      }
      
      if (typeof window.redraw === 'function') {
        window.redraw();
        window.redraw();
        window.redraw();
      }
    });
    
    await sleep(500);
    await saveScreenshot(page, 'ui/panel_minimize_initial', true);
    console.log('📸 Screenshot: Initial panel state (should show BIG RED PANEL!)');
```

### 5. Test State Change with Render
```javascript
    // Toggle minimize
    await page.evaluate(() => {
      const panel = window.draggablePanelManager.getPanel('test-minimize-panel');
      panel.toggleMinimized();
    });
    
    // CRITICAL: Force render after state change!
    await page.evaluate(() => {
      window.gameState = 'PLAYING';
      if (window.draggablePanelManager) {
        if (window.draggablePanelManager.gameState !== undefined) {
          window.draggablePanelManager.gameState = 'PLAYING';
        }
        if (typeof window.draggablePanelManager.renderPanels === 'function') {
          window.draggablePanelManager.renderPanels('PLAYING');
        }
        if (window.draggablePanelManager.render) {
          window.draggablePanelManager.render();
        }
      }
      if (typeof window.redraw === 'function') {
        window.redraw();
        window.redraw();
        window.redraw();
      }
    });
    
    await sleep(500); // Wait for render
    await saveScreenshot(page, 'ui/panel_minimize_minimized', true);
    console.log('📸 Screenshot: Minimized panel (should show ONLY TITLE BAR!)');
```

### 6. Verify with Screenshots
```javascript
    // Verify screenshots show expected state
    // - panel_minimize_initial.png: Full panel with content
    // - panel_minimize_minimized.png: Only title bar, no content
    
    console.log('✅ ALL TESTS PASSED! 🎉');
    console.log('   Screenshots saved to test/e2e/screenshots/ui/');
    
    await browser.close();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ TEST FAILED:', error.message);
    if (browser) await browser.close();
    process.exit(1);
  }
})();
```

---

## Quick Reference Checklist

When creating new E2E tests, ensure:

- [ ] Dev server running (`npm run dev`)
- [ ] Using `cameraHelper.ensureGameStarted(page)`
- [ ] Verified `gameStarted.started === true`
- [ ] Added test panel to state visibility list
- [ ] Set `window.gameState = 'PLAYING'`
- [ ] Force render after every state change
- [ ] `await sleep(500)` before screenshots
- [ ] Screenshots show game (NOT main menu)
- [ ] Screenshots show expected visual state
- [ ] Error handling saves failure screenshots
- [ ] Test exits with proper exit code (0 = pass, 1 = fail)

---

## Troubleshooting

### "Screenshot shows main menu instead of game"
- ❌ Didn't call `cameraHelper.ensureGameStarted()`
- ❌ Called it but didn't verify `gameStarted.started === true`
- ✅ Use camera_helper and check diagnostics

### "Panel created but not visible in screenshot"
- ❌ Panel not in state visibility list
- ❌ Wrong game state (MENU instead of PLAYING)
- ✅ Add panel to `stateVisibility.PLAYING` array

### "State changed but screenshot shows old state"
- ❌ Didn't call `redraw()` after state change
- ❌ Took screenshot too quickly
- ✅ Force render + `await sleep(500)` before screenshot

### "Test passes but visual proof is wrong"
- ❌ Test checking internal state, not visual rendering
- ✅ Always verify screenshots match test assertions

---

## Testing Standards

See `docs/standards/testing/` for full guidelines:
- `TESTING_METHODOLOGY_STANDARDS.md` - Overall testing philosophy
- `BDD_LANGUAGE_STYLE_GUIDE.md` - Language conventions for test descriptions

**Core Principle**: Tests must use system APIs and catch real bugs, not test internal mechanics.

---

### Best Practices

✅ **DO**:
- Use `?test=1` URL parameter for test helpers
- Call `ensureGameStarted()` before testing
- Use category-based screenshot paths: `'camera/zoom_in'`
- Set viewport for consistent rendering
- Include error handling and failure screenshots
- Test with headless Chrome (CI/CD compatible)

❌ **DON'T**:
- Hardcode coordinates without canvas bounds check
- Skip error handling
- Use absolute paths for screenshots
- Test implementation details (test behavior!)

---

## Screenshot Organization

Screenshots are saved to:
```
e2e/screenshots/
├── camera/
│   ├── success/     # zoom.png, transforms.png, etc.
│   └── failure/     # fail_zoom_TIMESTAMP.png
├── selection/
│   ├── success/
│   └── failure/
└── ...
```

Use format: `saveScreenshot(page, 'category/name', pass)`

---

## Helper Functions

### puppeteer_helper.js

```javascript
const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');

// launchBrowser() - Launch headless Chrome
const browser = await launchBrowser();

// sleep(ms) - Wait for milliseconds
await sleep(1000);

// saveScreenshot(page, testName, pass)
await saveScreenshot(page, 'camera/zoom', true);  // Success
await saveScreenshot(page, 'camera/zoom', false); // Failure with timestamp
```

### camera_helper.js

Camera-specific utilities for testing zoom, pan, transforms.

---

## Test Categories

### Camera Tests
- `pw_camera_zoom.js` - Zoom in/out functionality
- `pw_camera_zoom_probe.js` - Zoom API discovery and diagnostics
- `pw_camera_transforms.js` - Screen↔World coordinate transforms

### Spawn Tests
- `pw_ant_spawn_types.js` - Ant spawning (queen, workers, etc.)
- `pw_resource_spawn_types.js` - Resource spawning (food, water, etc.)

### Combat Tests
- `pw_combat_initiation.js` - Combat system initialization

### Selection Tests
- `pw_selection_deterministic.js` - Click-to-select entities
- `selection-box.test.js` - Drag selection box (comprehensive)

### UI Tests
- `pw_panel_dragging.js` - Draggable panel system
- `pw_panel_minimize.js` - Panel minimize feature with mouse detection validation

---

## Troubleshooting

### `ERR_CONNECTION_REFUSED`
**Cause**: Dev server not running  
**Solution**: `npm run dev` in separate terminal

### `Could not find Chrome`
**Cause**: Chrome not in default location  
**Solution**: 
```powershell
$env:TEST_CHROME_PATH = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
```

### Test Times Out
**Cause**: Game not loading  
**Solution**: Check browser console logs, increase timeout

---

## See Also

- `README_CAMERA.md` - Camera test documentation
- `screenshots/README.md` - Screenshot system guide
- `docs/guides/TESTING_TYPES_GUIDE.md` - All test types explained
