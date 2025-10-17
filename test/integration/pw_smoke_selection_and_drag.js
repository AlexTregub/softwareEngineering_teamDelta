const { launchBrowser, sleep } = require('./puppeteer_helper');

(async () => {
  const url = process.env.TEST_URL || 'http://localhost:8000';
  console.log('Running expanded puppeteer smoke test against', url);
  const browser = await launchBrowser();
  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));

  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 });
    await (page.waitForTimeout ? page.waitForTimeout(1500) : sleep(1500));

    // Ensure in PLAYING state and init dropoff UI & selection controller
    await page.evaluate(() => {
      try {
        const gs = window.GameState || window.g_gameState || null;
        if (gs && typeof gs.getState === 'function' && gs.getState() !== 'PLAYING') {
          if (typeof gs.startGame === 'function') gs.startGame();
          else if (typeof window.startGameTransition === 'function') window.startGameTransition();
        }
        if (typeof window.initDropoffUI === 'function') window.initDropoffUI();
        if (typeof window.initializeUISelectionBox === 'function') window.initializeUISelectionBox();
      } catch (e) { console.error('init helpers failed', e); }
    });

    // Wait for canvas to be present
    await page.waitForSelector('canvas', { timeout: 20000 });
    const canvasBox = await page.evaluate(() => {
      const canvas = document.getElementById('defaultCanvas0') || document.querySelector('canvas');
      if (!canvas) return null;
      const r = canvas.getBoundingClientRect();
      return { left: r.left, top: r.top, width: r.width, height: r.height };
    });

    if (!canvasBox) {
      throw new Error('Canvas not found');
    }

    // Perform a drag selection from top-left quarter to center — this simulates selection-box drag
    const startX = Math.floor(canvasBox.left + canvasBox.width * 0.1);
    const startY = Math.floor(canvasBox.top + canvasBox.height * 0.1);
    const endX = Math.floor(canvasBox.left + canvasBox.width * 0.5);
    const endY = Math.floor(canvasBox.top + canvasBox.height * 0.5);

    console.log('Dragging selection from', startX, startY, 'to', endX, endY);
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    const steps = 12;
    for (let i = 1; i <= steps; i++) {
      const x = startX + ((endX - startX) * i) / steps;
      const y = startY + ((endY - startY) * i) / steps;
      await page.mouse.move(x, y);
      await (page.waitForTimeout ? page.waitForTimeout(16) : sleep(16));
    }
    await page.mouse.up();

    // Wait briefly and then check selected entities count
    await (page.waitForTimeout ? page.waitForTimeout(250) : sleep(250));
    const selected = await page.evaluate(() => {
      try {
        if (window.g_selectionBoxController && typeof window.g_selectionBoxController.getSelectedEntities === 'function') {
          return window.g_selectionBoxController.getSelectedEntities().length;
        }
        if (window.ants && Array.isArray(window.ants)) return window.ants.filter(a => a.isSelected).length;
        return 0;
      } catch (e) { return { error: '' + e }; }
    });

    console.log('Selected entities after drag:', selected);

    await browser.close();
    process.exit(0);
  } catch (err) {
    console.error('Test error', err);
    try { await page.screenshot({ path: 'test/integration/error_selection_and_drag.png' }); } catch (e) {}
    await browser.close();
    process.exit(2);
  }
})();
