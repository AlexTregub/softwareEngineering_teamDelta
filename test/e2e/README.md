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
