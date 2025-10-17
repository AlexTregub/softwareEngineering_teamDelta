const { launchBrowser, sleep } = require('./puppeteer_helper');

(async () => {
  const baseUrl = process.env.TEST_URL || 'http://localhost:8000';
  const url = baseUrl.indexOf('?') === -1 ? baseUrl + '?test=1' : baseUrl + '&test=1';
  console.log('Running helper smoke test against', url);
  const browser = await launchBrowser();
  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));

  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 });
    await (page.waitForTimeout ? page.waitForTimeout(1500) : sleep(1500));

    // Wait for testHelpers
    await page.waitForFunction(() => window.testHelpers && typeof window.testHelpers.spawnTestAnt === 'function', { timeout: 10000 });

    const spawned = await page.evaluate(() => {
      try {
        const p = window.testHelpers.spawnTestAnt({ x: 150, y: 150 });
        const idxs = window.testHelpers.getSpawnedAntIndexes();
        const screen = window.testHelpers.worldToScreen(p.pos.x, p.pos.y);
        return { p, idxs, screen };
      } catch (e) { return { error: ''+e } }
    });

    console.log('Spawned result:', spawned);

    const cleared = await page.evaluate(() => {
      try { return window.testHelpers.clearTestAnts(); } catch (e) { return { error: ''+e }; }
    });

    console.log('Cleared count:', cleared);

    await browser.close();
    process.exit(0);
  } catch (err) {
    console.error('Helper smoke test error', err);
    try { await page.screenshot({ path: 'test/puppeteer/error_helper_smoke_test.png' }); } catch (e) {}
    await browser.close();
    process.exit(2);
  }
})();
