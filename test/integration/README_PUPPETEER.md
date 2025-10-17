Puppeteer tests
================

This folder contains small automated smoke/integration tests using Puppeteer.

Setup
-----

1. Install dependencies (root of repo):

```powershell
npm install
```

2. Ensure a browser is available for Puppeteer:

- Either install the bundled Chromium used by Puppeteer (recommended in CI):

```powershell
npx puppeteer install
```

- Or point tests to a locally installed Chrome by setting the environment variable TEST_CHROME_PATH to the full path to chrome.exe on Windows. Example (PowerShell):

```powershell
$env:TEST_CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
npm run test:puppeteer
```

What Puppeteer can do
----------------------

Puppeteer controls Chrome/Chromium programmatically. Common uses for these tests:

- Open a page (page.goto)
- Execute JavaScript inside the page context (page.evaluate)
- Emulate mouse and keyboard events (page.mouse, page.keyboard)
- Capture screenshots (page.screenshot)
- Listen to console.log calls emitted by the page

The helper `puppeteer_helper.js` will attempt to launch Puppeteer's Chromium and fall back to system Chrome if not available.

Writing tests
-------------

- Tests should compute coordinates relative to the canvas element and use `page.mouse` to click or drag.
- Use `page.evaluate` to read/modify app state (e.g., call `initDropoffUI()`), then assert with `page.waitForFunction` or `page.evaluate` checks.
