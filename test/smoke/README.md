# Smoke Tests

**Purpose**: Quick sanity checks to ensure the game loads and basic functionality works. These are the "Is it on fire?" tests. 🔥

---

## What Are Smoke Tests?

Smoke tests are **minimal, fast tests** that verify:
- ✅ Game loads without crashing
- ✅ Core managers initialize
- ✅ Basic systems are available
- ✅ No critical errors on startup

Think of them as the first line of defense - if smoke tests fail, don't bother running the full suite!

---

## Running Smoke Tests

**Prerequisites**: Dev server must be running on `localhost:8000`

```bash
# Terminal 1 - Start dev server (keep running)
npm run dev
# OR
python -m http.server 8000

# Terminal 2 - Run smoke tests
npm run test:smoke
```

**✨ Smart Test Runner**: The smoke test runner will:
- ✅ Detect if server is already running (preferred!)
- ✅ Attempt to start server automatically if not running
- ✅ Run all smoke tests in sequence  
- ✅ Show clean output (errors only, not verbose logs)
- ✅ Leave server running for continued development

**💡 Tip**: Keep the dev server running in a separate terminal during development. This is faster and lets you manually test the game between automated test runs.

---

## Current Smoke Tests

### `helper_smoke_test.js`
- Verifies browser helper functions work
- Tests game initialization
- Checks core managers exist

### `_smoke_camera_test.js`
- Quick camera system check
- Verifies camera manager initialized
- Tests basic camera functionality

---

## Writing Smoke Tests

Smoke tests should be:
- ⚡ **Very fast** (< 5 seconds each)
- 🎯 **Focused** (one critical thing per test)
- 🚨 **Early failure** (fail fast if basics broken)

### Template

```javascript
const { launchBrowser, sleep } = require('./smoke_helper');

(async () => {
  const url = 'http://localhost:8000';
  console.log('🔥 Running smoke test...');

  let browser;
  try {
    browser = await launchBrowser();
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 10000 });

    // Quick check - does game load?
    const loaded = await page.evaluate(() => {
      return typeof window.setup === 'function' &&
             typeof window.draw === 'function';
    });

    if (!loaded) {
      console.error('❌ SMOKE TEST FAILED: Game did not load');
      await browser.close();
      process.exit(1);
    }

    console.log('✅ SMOKE TEST PASSED');
    await browser.close();
    process.exit(0);

  } catch (error) {
    console.error('❌ SMOKE TEST FAILED:', error.message);
    if (browser) await browser.close();
    process.exit(1);
  }
})();
```

---

## When to Run

- ✅ After every commit
- ✅ Before running full test suite
- ✅ First step in CI/CD pipeline
- ✅ After deployments

---

## Smoke vs. E2E Tests

| Smoke Tests | E2E Tests |
|-------------|-----------|
| ⚡ Very fast (< 1 min total) | 🐢 Slower (minutes) |
| 🎯 Minimal coverage | 🌍 Comprehensive coverage |
| 🚨 Early warning | 🔍 Detailed validation |
| Basic sanity | Full workflows |

**Rule**: Run smoke tests first. If they pass, run E2E tests.

---

## See Also

- `test/e2e/` - Full E2E test suite
- `docs/guides/TESTING_TYPES_GUIDE.md` - All test types explained
