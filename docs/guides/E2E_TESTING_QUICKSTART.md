# E2E Testing Quick Start for AI Agents

**Target Audience**: Fresh AI instances with no chat history  
**Purpose**: Complete guide to create and run browser-based E2E tests

---

## Critical Success Factors

### 1. Server Must Be Running
```bash
npm run dev
# Server runs on http://localhost:8000
# Check: http://localhost:8000 should load the game
```

### 2. Game Must Advance Past Main Menu
**Default state**: Game loads on main menu (ANTS title, PLAY/OPTIONS/EXIT buttons)  
**Required state**: PLAYING (game terrain, ants, resources visible)

**Solution**: Use `camera_helper.ensureGameStarted()`
```javascript
const cameraHelper = require('../camera_helper');
const gameStarted = await cameraHelper.ensureGameStarted(page);
if (!gameStarted.started) {
  throw new Error('Failed to start game - still on main menu');
}
```

### 3. Force Rendering After State Changes
**Problem**: p5.js doesn't auto-redraw when JavaScript changes game state  
**Solution**: Call `redraw()` + wait before screenshots

```javascript
await page.evaluate(() => {
  window.gameState = 'PLAYING';
  if (window.draggablePanelManager) {
    window.draggablePanelManager.renderPanels('PLAYING');
  }
  if (typeof window.redraw === 'function') {
    window.redraw();
    window.redraw();
    window.redraw();
  }
});
await sleep(500); // Wait for render
await saveScreenshot(page, 'category/name', true);
```

### 4. Panels Need State Visibility
**Problem**: Panels only render if in current game state's visibility list  
**Solution**: Add test panel to PLAYING visibility

```javascript
await page.evaluate(() => {
  if (window.draggablePanelManager && window.draggablePanelManager.stateVisibility) {
    if (!window.draggablePanelManager.stateVisibility.PLAYING) {
      window.draggablePanelManager.stateVisibility.PLAYING = [];
    }
    window.draggablePanelManager.stateVisibility.PLAYING.push('test-panel-id');
  }
});
```

### 5. Screenshots Are Visual Proof
**Purpose**: Verify tests actually work, not just internal state

**What to verify in screenshots**:
- ✅ Game terrain visible (NOT main menu)
- ✅ Expected UI elements present
- ✅ Correct visual state (minimized = title bar only)
- ❌ Black screens or main menu = test failed

---

## Complete Test Template

```javascript
#!/usr/bin/env node
const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');
const cameraHelper = require('../camera_helper');

(async () => {
  const url = process.env.TEST_URL || 'http://localhost:8000?test=1';
  console.log('🧪 Running My E2E Test');

  let browser, page;
  try {
    // 1. SETUP
    browser = await launchBrowser();
    page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });

    console.log('📡 Loading game...');
    await page.goto(url, { waitUntil: 'networkidle2' });
    await sleep(2000);

    // 2. ADVANCE PAST MENU (CRITICAL!)
    console.log('▶️  Starting game...');
    const gameStarted = await cameraHelper.ensureGameStarted(page);
    console.log('   ✅ Game started:', gameStarted.started);
    
    if (!gameStarted.started) {
      throw new Error('Failed to start game');
    }
    await sleep(1000);

    // 3. CREATE/CONFIGURE TEST ELEMENTS
    const setup = await page.evaluate(() => {
      // Force PLAYING state
      window.gameState = 'PLAYING';
      
      // Create test elements
      // Example: panel, spawn ants, etc.
      
      return { success: true };
    });

    if (!setup.success) {
      throw new Error('Setup failed');
    }

    // 4. FORCE RENDER + INITIAL SCREENSHOT
    await page.evaluate(() => {
      window.gameState = 'PLAYING';
      if (window.draggablePanelManager) {
        window.draggablePanelManager.gameState = 'PLAYING';
        if (typeof window.draggablePanelManager.renderPanels === 'function') {
          window.draggablePanelManager.renderPanels('PLAYING');
        }
      }
      if (typeof window.redraw === 'function') {
        window.redraw();
        window.redraw();
        window.redraw();
      }
    });
    
    await sleep(500);
    await saveScreenshot(page, 'myCategory/initial_state', true);

    // 5. TEST ACTIONS
    await page.evaluate(() => {
      // Perform test action
      // Example: panel.toggleMinimized()
    });

    // 6. FORCE RENDER AFTER STATE CHANGE (CRITICAL!)
    await page.evaluate(() => {
      window.gameState = 'PLAYING';
      if (window.draggablePanelManager) {
        window.draggablePanelManager.gameState = 'PLAYING';
        if (typeof window.draggablePanelManager.renderPanels === 'function') {
          window.draggablePanelManager.renderPanels('PLAYING');
        }
      }
      if (typeof window.redraw === 'function') {
        window.redraw();
        window.redraw();
        window.redraw();
      }
    });
    
    await sleep(500);
    await saveScreenshot(page, 'myCategory/after_action', true);

    // 7. VERIFY
    console.log('✅ ALL TESTS PASSED! 🎉');
    console.log('   Screenshots saved to test/e2e/screenshots/myCategory/');
    
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

## Common Mistakes (Anti-Patterns)

### ❌ Screenshot Shows Main Menu
```javascript
// WRONG: Didn't advance past menu
await page.goto(url);
await saveScreenshot(page, 'test', true); // Shows main menu!
```

```javascript
// RIGHT: Use camera_helper
const gameStarted = await cameraHelper.ensureGameStarted(page);
if (!gameStarted.started) throw new Error('Failed to start game');
await sleep(1000);
await saveScreenshot(page, 'test', true); // Shows game!
```

### ❌ State Changed But Not Visible
```javascript
// WRONG: No render after state change
await page.evaluate(() => {
  panel.toggleMinimized();
});
await saveScreenshot(page, 'minimized', true); // Still shows expanded!
```

```javascript
// RIGHT: Force render after state change
await page.evaluate(() => {
  panel.toggleMinimized();
  // Force render
  window.gameState = 'PLAYING';
  if (window.draggablePanelManager) {
    window.draggablePanelManager.renderPanels('PLAYING');
  }
  if (typeof window.redraw === 'function') {
    window.redraw();
    window.redraw();
    window.redraw();
  }
});
await sleep(500);
await saveScreenshot(page, 'minimized', true); // Now shows minimized!
```

### ❌ Panel Not Visible
```javascript
// WRONG: Panel created but not in state visibility
const panel = window.draggablePanelManager.addPanel({ id: 'test' });
// Panel doesn't render because not in PLAYING visibility list
```

```javascript
// RIGHT: Add to state visibility
window.gameState = 'PLAYING';
if (window.draggablePanelManager.stateVisibility) {
  if (!window.draggablePanelManager.stateVisibility.PLAYING) {
    window.draggablePanelManager.stateVisibility.PLAYING = [];
  }
  window.draggablePanelManager.stateVisibility.PLAYING.push('test');
}
const panel = window.draggablePanelManager.addPanel({ id: 'test' });
```

---

## File Locations

### Test Files
```
test/e2e/
├── ui/pw_panel_minimize.js          ← Reference implementation
├── camera/pw_camera_zoom.js         ← Camera test example
├── puppeteer_helper.js              ← launchBrowser, saveScreenshot
└── camera_helper.js                 ← ensureGameStarted (CRITICAL!)
```

### Screenshots
```
test/e2e/screenshots/
├── ui/
│   ├── success/panel_minimize_initial.png
│   └── failure/fail_panel_error_20251018.png
└── camera/success/zoom_level_100.png
```

### Documentation
```
test/e2e/README.md                   ← Full E2E testing guide
docs/guides/E2E_TESTING_QUICKSTART.md ← This file
docs/standards/testing/              ← Testing standards
```

---

## Running Tests

```bash
# Start server first
npm run dev

# Run single test
node test/e2e/ui/pw_panel_minimize.js

# Run all E2E tests
npm run test:e2e

# Run specific category
npm run test:e2e:ui
npm run test:e2e:camera
```

---

## Verification Checklist

Before declaring test complete:

- [ ] Dev server running (`npm run dev`)
- [ ] Test uses `cameraHelper.ensureGameStarted(page)`
- [ ] Verified `gameStarted.started === true`
- [ ] Test adds panels to state visibility if needed
- [ ] Force render after every state change
- [ ] `await sleep(500)` before every screenshot
- [ ] Screenshots saved to proper category folder
- [ ] Manually reviewed screenshots:
  - [ ] Shows game terrain (NOT main menu)
  - [ ] Shows expected visual state
  - [ ] Shows correct UI elements
- [ ] Test exits with code 0 on success, 1 on failure
- [ ] Error handling saves failure screenshots

---

## Full Working Example

See `test/e2e/ui/pw_panel_minimize.js` for complete implementation with:
- ✅ Server connection
- ✅ Menu bypass via `cameraHelper.ensureGameStarted()`
- ✅ Panel state visibility configuration
- ✅ Force rendering after state changes
- ✅ Multiple screenshots at different states
- ✅ Visual verification via screenshots
- ✅ Proper error handling

Study this file as the reference implementation for all E2E tests.

---

## Key Takeaway for AI Agents

**The Three Critical Steps**:
1. **Advance past menu**: `cameraHelper.ensureGameStarted(page)`
2. **Force renders**: Call `redraw()` after state changes
3. **Verify visually**: Screenshots must show game, not menu

If screenshots show the main menu, the test has failed regardless of what internal state says.
