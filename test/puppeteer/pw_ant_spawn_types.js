const { launchBrowser, sleep, saveScreenshot } = require('./puppeteer_helper');

(async () => {
  const baseUrl = process.env.TEST_URL || 'http://localhost:8000';
  const url = baseUrl.indexOf('?') === -1 ? baseUrl + '?test=1' : baseUrl + '&test=1';
  if (process.env.TEST_VERBOSE) console.log('Running ant spawn types test against', url);
  const browser = await launchBrowser();
  const page = await browser.newPage();
  page.on('console', msg => { if (process.env.TEST_VERBOSE) console.log('PAGE LOG:', msg.text()); });
  if (process.env.TEST_VERBOSE) await page.evaluateOnNewDocument(() => { window.__TEST_VERBOSE = true; });

  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 });
    await (page.waitForTimeout ? page.waitForTimeout(1000) : sleep(1000));
    // Ensure game advanced past menu
    await (async () => {
      try {
        await page.evaluate(() => { try { const gs = window.GameState || window.g_gameState || null; if (gs && typeof gs.getState === 'function' && gs.getState() !== 'PLAYING') { if (typeof gs.startGame === 'function') gs.startGame(); } if (typeof startGame === 'function') startGame(); } catch(e){} });
        try { await page.waitForFunction(() => (typeof ants !== 'undefined' && Array.isArray(ants) && ants.length > 0) || (window.g_gameState && typeof window.g_gameState.getState === 'function' && window.g_gameState.getState() === 'PLAYING'), { timeout: 3000 }); } catch(e) {}
      } catch (e) {}
    })();
    await page.waitForSelector('canvas', { timeout: 20000 });

  // Discover ant types: look for Ant subclasses or registry
    const antTypes = await page.evaluate(() => {
      try {
        const types = [];
        // Check for global Ant factory methods like createWorker/createSoldier
        if (typeof window.Ant === 'function') {
          // inspect known properties
          for (const k of Object.keys(window.Ant)) {
            if (k.startsWith('create') || k.toLowerCase().includes('worker') || k.toLowerCase().includes('soldier') ) types.push(k);
          }
        }
        // Check for documented ants list in globals (ants may be declared as let ants = [])
        const antArray = (typeof ants !== 'undefined' && Array.isArray(ants)) ? ants : (typeof window.ants !== 'undefined' && Array.isArray(window.ants) ? window.ants : []);
        if (antArray && antArray.length) {
          antArray.forEach(a => { if (a && (a.type || a._type || a.role)) types.push(a.type || a._type || a.role); });
        }
        // Deduplicate and normalize
        return Array.from(new Set(types)).filter(Boolean);
      } catch (e) { return { error: '' + e }; }
    });

    console.log('Discovered ant type indicators:', antTypes);
    // We'll attempt to spawn a queen and at least one generic ant via antsSpawn or testHelpers

  // Spawn queen first if available
  const queenResult = await page.evaluate(() => {
      try {
        if (typeof spawnQueen === 'function') {
          const q = spawnQueen();
          return { spawned: true, info: { idx: q && (q._antIndex || q.antIndex || null) } };
        }
        // If testHelpers provides spawnAntType, use that
        if (window.testHelpers && typeof window.testHelpers.spawnAntType === 'function') {
          const idx = window.testHelpers.spawnAntType('queen', { x: 300, y: 300 });
          return { spawned: !!idx, info: { idx } };
        }
        return { spawned: false, info: 'no-queen-api' };
      } catch (e) { return { spawned: false, error: '' + e }; }
    });

    console.log('Queen spawn attempt:', queenResult);

    // Spawn a set of generic ants via antsSpawn or testHelpers.spawnTestAnt
    const spawnedAnts = [];
    // Try to spawn one ant of N=3 to get some variants
    const spawnCount = await page.evaluate(() => {
      try {
        if (typeof antsSpawn === 'function') { antsSpawn(3, 'player'); return 3; }
        if (window.testHelpers && typeof window.testHelpers.spawnTestAnt === 'function') {
          const a1 = window.testHelpers.spawnTestAnt({ x: 220, y: 220 });
          const a2 = window.testHelpers.spawnTestAnt({ x: 240, y: 240 });
          return 2;
        }
        // Last resort: try to instantiate Ant directly
        if (typeof window.Ant === 'function') { new window.Ant(200,200); return 1; }
      } catch (e) { return 0; }
    });

    console.log('Requested spawnCount result:', spawnCount);
    // wait for ants array to be populated after spawn attempts
    try {
      await page.waitForFunction(() => Array.isArray(window.ants) && window.ants.length > 0, { timeout: 5000 });
    } catch (e) {
      console.warn('ants array not populated after spawn attempts; continuing to collect whatever exists');
    }
    await (page.waitForTimeout ? page.waitForTimeout(400) : sleep(400));

    // Collect ants and attempt to categorize their types
    const antsInfo = await page.evaluate(() => {
      try {
        const antArray = (typeof ants !== 'undefined' && Array.isArray(ants)) ? ants : (typeof window.ants !== 'undefined' && Array.isArray(window.ants) ? window.ants : []);
        if (!antArray || !antArray.length) return [];
        return antArray.map(a => ({ idx: a._antIndex || a.antIndex || null, type: a.type || a._type || a.role || null, isQueen: !!a.isQueen || !!a._isQueen || (a.constructor && a.constructor.name && a.constructor.name.toLowerCase().includes('queen')) }));
      } catch (e) { return { error: '' + e }; }
    });

    console.log('Ants in world after spawn attempts:', antsInfo);

    // Assert that at least one queen exists or queenResult.spawned is true
    const queenExists = antsInfo && antsInfo.find && antsInfo.find(a => a.isQueen);
    if (!queenExists && !(queenResult && queenResult.spawned)) {
      console.error('No queen found or spawned. queenResult:', queenResult, 'antsInfo:', antsInfo);
      try { await saveScreenshot(page, 'ant_spawn_types', false); } catch (e) {}
      await browser.close();
      process.exit(2);
    }

    if (!antsInfo || !antsInfo.length) {
      console.error('No ants present after spawn attempts');
      try { await saveScreenshot(page, 'ant_spawn_types', false); } catch (e) {}
      await browser.close();
      process.exit(2);
    }

    if (process.env.TEST_VERBOSE) console.log('Ant spawn types test passed');
    try { await saveScreenshot(page, 'ant_spawn_types', true); } catch (e) {}
    await browser.close();
    process.exit(0);
  } catch (err) {
    console.error('Ant spawn test error', err);
    try { await page.screenshot({ path: 'test/puppeteer/error_ant_spawn.png' }); } catch (e) {}
    await browser.close();
    process.exit(2);
  }
})();
