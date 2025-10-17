const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Small cross-version helper: some puppeteer versions don't implement page.waitForTimeout
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

(async () => {
  const url = process.env.TEST_URL || 'http://localhost:8000';
  console.log('Running puppeteer smoke test against', url);

  let browser;
  try {
    // Try default launch (will use bundled Chromium if puppeteer installed that way)
    browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox','--disable-setuid-sandbox'] });
  } catch (launchErr) {
    console.warn('Default puppeteer launch failed:', launchErr.message);
    // Try to find an installed Chrome on common Windows paths or via TEST_CHROME_PATH env var
    const candidatePaths = [];
    if (process.env.TEST_CHROME_PATH) candidatePaths.push(process.env.TEST_CHROME_PATH);
    // Common Windows install locations
    candidatePaths.push('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe');
    candidatePaths.push('C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe');
    candidatePaths.push(path.join(process.env['PROGRAMFILES'] || 'C:\\Program Files', 'Google', 'Chrome', 'Application', 'chrome.exe'));
    candidatePaths.push(path.join(process.env['PROGRAMFILES(X86)'] || 'C:\\Program Files (x86)', 'Google', 'Chrome', 'Application', 'chrome.exe'));

    let found = null;
    for (const p of candidatePaths) {
      try { if (p && fs.existsSync(p)) { found = p; break; } } catch (e) {}
    }

    if (found) {
      console.log('Found system Chrome at', found, '- launching with executablePath');
      browser = await puppeteer.launch({ headless: true, executablePath: found, args: ['--no-sandbox','--disable-setuid-sandbox'] });
    } else {
      console.error('\nCould not find a Chromium/Chrome executable for Puppeteer.');
      console.error('Options:');
      console.error('  1) Install bundled Chromium for Puppeteer by running:');
      console.error('     npm install puppeteer --ignore-scripts=false');
      console.error('     or run: npx puppeteer install');
      console.error('  2) Point the test to your Chrome install by setting the TEST_CHROME_PATH environment variable to the chrome.exe path');
      console.error('     e.g.: $env:TEST_CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"');
      console.error('\nAfter installing or setting TEST_CHROME_PATH, re-run the test.');
      process.exit(4);
    }
  }

  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));

  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 });

    // Give the app a moment to initialize (p5 setup/draw may need a frame)
  // wait a couple frames for p5 to initialize
  await (page.waitForTimeout ? page.waitForTimeout(2000) : sleep(2000));

    // If we're sitting on a main menu, attempt to start the game so UI_GAME layer becomes active.
    // This is guarded and best-effort: it will call GameState.startGame() or startGameTransition()
    // if those functions exist in the page. After calling, wait briefly for the state to become PLAYING.
    await page.evaluate(() => {
      try {
        const gs = window.GameState || window.g_gameState || null;
        if (gs && typeof gs.getState === 'function' && gs.getState() !== 'PLAYING') {
          console.log('Test: GameState detected, attempting to start game via GameState.startGame() or startGameTransition()');
          if (typeof gs.startGame === 'function') {
            try { gs.startGame(); } catch (e) { console.error('GameState.startGame() threw', e); }
          } else if (typeof window.startGameTransition === 'function') {
            try { window.startGameTransition(); } catch (e) { console.error('startGameTransition() threw', e); }
          }
        } else if (!gs && typeof window.startGameTransition === 'function') {
          console.log('Test: fallback startGameTransition()');
          try { window.startGameTransition(); } catch (e) { console.error('startGameTransition() threw', e); }
        }
      } catch (e) { console.error('Test: start game helper error', e); }
    });

    try {
      await page.waitForFunction(() => {
        const gs = window.GameState || window.g_gameState;
        return gs && typeof gs.getState === 'function' && gs.getState() === 'PLAYING';
      }, { timeout: 10000 });
      console.log('Test: GameState reached PLAYING');

      // After entering PLAYING, ensure dropoff UI is initialized (some UI is only created once in-game)
      await page.evaluate(() => {
        try {
          if (typeof window.initDropoffUI === 'function') {
            console.log('Test: calling initDropoffUI() after PLAYING');
            try { window.initDropoffUI(); } catch (e) { console.error('initDropoffUI() threw', e); }
          }
        } catch (e) { console.error('Test: post-PLAY initDropoffUI error', e); }
      });

      // Wait for the button to be created (longer timeout because UI initialization can be delayed)
      await page.waitForFunction(() => typeof window.dropoffUI !== 'undefined' && window.dropoffUI.button != null, { timeout: 20000 });
      console.log('Test: dropoffUI.button is present after PLAYING');

    } catch (e) {
      console.log('Test: Game did not enter PLAYING or dropoff button did not appear within timeout; continuing (UI may still be present)');
    }

    // Diagnostic dump of key globals to help debug missing UI
    const globalsDump = await page.evaluate(() => {
      try {
        return {
          dropoffUI: typeof window.dropoffUI !== 'undefined',
          drawDropoffUI: typeof window.drawDropoffUI === 'function',
          dropoffUI_placing: window.dropoffUI ? !!window.dropoffUI.placing : null,
          button_exists: window.dropoffUI && window.dropoffUI.button ? true : false,
          button_props: window.dropoffUI && window.dropoffUI.button ? { x: window.dropoffUI.button.x, y: window.dropoffUI.button.y, width: window.dropoffUI.button.width, height: window.dropoffUI.button.height } : null,
          g_uiSelectionController: typeof window.g_uiSelectionController !== 'undefined'
        };
      } catch (e) { return { error: ''+e }; }
    });
    console.log('PAGE GLOBALS DUMP:', JSON.stringify(globalsDump, null, 2));
    // If the app didn't auto-initialize dropoff UI or selection, try initializing them now
    await page.evaluate(() => {
      try {
        if (typeof window.initDropoffUI === 'function' && typeof window.dropoffUI === 'undefined') {
          console.log('Test: calling initDropoffUI() to ensure dropoff UI is created');
          window.initDropoffUI();
        }
        if (typeof window.initializeUISelectionBox === 'function' && typeof window.g_uiSelectionController === 'undefined') {
          console.log('Test: calling initializeUISelectionBox() to ensure selection controller is created');
          window.initializeUISelectionBox();
        }
      } catch (e) { console.error('Test: init helper error', e); }
    });

    // Wait for dropoffUI to be available
    await page.waitForFunction(() => typeof window.dropoffUI !== 'undefined' && window.dropoffUI.button !== null, { timeout: 20000 });

    // Ensure button has been positioned by the UI logic
    await page.waitForFunction(() => {
      const b = window.dropoffUI.button;
      return b && (typeof b.x === 'number' || typeof b.getPosition === 'function');
    }, { timeout: 5000 });

    // Compute button position relative to the canvas element and click it via page.mouse
    const btnRect = await page.evaluate(() => {
      try {
        const b = window.dropoffUI.button;
        // Find the canvas element used by p5 (defaultCanvas0) or the first canvas
        const canvas = document.getElementById('defaultCanvas0') || document.querySelector('canvas');
        const rect = canvas ? canvas.getBoundingClientRect() : { left: 0, top: 0 };

        let bx = 0, by = 0, bw = 0, bh = 0;
        if (b.getPosition && b.width && b.height) {
          const p = b.getPosition(); bx = p.x; by = p.y; bw = b.width; bh = b.height;
        } else if (typeof b.x === 'number' && typeof b.y === 'number' && b.width && b.height) {
          bx = b.x; by = b.y; bw = b.width; bh = b.height;
        } else {
          // fallback to bottom center of canvas
          const cx = (window.innerWidth || rect.width) / 2;
          return { x: cx, y: (rect.top || 0) + (window.innerHeight || 600) - 40 };
        }

        // Compute center of the button in client coordinates
        const clientX = (rect.left || 0) + bx + (bw / 2);
        const clientY = (rect.top || 0) + by + (bh / 2);
        return { x: clientX, y: clientY };
      } catch (e) { return { x: window.innerWidth/2, y: window.innerHeight - 40 }; }
    });

    console.log('Clicking dropoff button at', btnRect);
    await page.mouse.click(btnRect.x, btnRect.y, { delay: 50 });

    // Wait a short time and then check placing state
  await (page.waitForTimeout ? page.waitForTimeout(250) : sleep(250));

    const placing = await page.evaluate(() => !!(window.dropoffUI && window.dropoffUI.placing));

    if (!placing) {
      console.error('❌ Dropoff placing did not activate');
      await page.screenshot({ path: 'test/integration/failure_dropoff.png' });
      await browser.close();
      process.exit(2);
    }

    console.log('✅ Dropoff placing activated');

    // Clean up: cancel placing (press Escape) so the app returns to normal
    await page.keyboard.press('Escape');

    await browser.close();
    process.exit(0);
  } catch (err) {
    console.error('Test error', err);
    try { await page.screenshot({ path: 'test/integration/error_dropoff.png' }); } catch(e){}
    await browser.close();
    process.exit(3);
  }
})();
