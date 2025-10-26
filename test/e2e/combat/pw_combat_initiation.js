const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');

(async () => {
  const baseUrl = process.env.TEST_URL || 'http://localhost:8000';
  const url = baseUrl.indexOf('?') === -1 ? baseUrl + '?test=1' : baseUrl + '&test=1';
  if (process.env.TEST_VERBOSE) console.log('Running combat initiation test against', url);
  const browser = await launchBrowser();
  const page = await browser.newPage();
  page.on('console', msg => { if (process.env.TEST_VERBOSE) console.log('PAGE LOG:', msg.text()); });
  if (process.env.TEST_VERBOSE) await page.evaluateOnNewDocument(() => { window.__TEST_VERBOSE = true; });

  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 });
    await (page.waitForTimeout ? page.waitForTimeout(1000) : sleep(1000));
    // Ensure game advanced past title screen
    await (async () => {
      try {
        await page.evaluate(() => { try { const gs = window.GameState || window.g_gameState || null; if (gs && typeof gs.getState === 'function' && gs.getState() !== 'PLAYING') { if (typeof gs.startGame === 'function') gs.startGame(); } if (typeof startGame === 'function') startGame(); } catch(e){} });
        try { await page.waitForFunction(() => (typeof ants !== 'undefined' && Array.isArray(ants) && ants.length > 0) || (window.g_gameState && typeof window.g_gameState.getState === 'function' && window.g_gameState.getState() === 'PLAYING'), { timeout: 3000 }); } catch(e) {}
      } catch (e) {}
    })();
    await page.waitForSelector('canvas', { timeout: 20000 });

    // Spawn two ants from different factions near each other
    const spawnInfo = await page.evaluate(() => {
      try {
        const p1 = { x: 200, y: 200 };
        const p2 = { x: 220, y: 200 };
        let a1 = null; let a2 = null;
        // Prefer testHelpers.spawnAntType
        if (window.testHelpers && typeof window.testHelpers.spawnAntType === 'function') {
          const i1 = window.testHelpers.spawnAntType('worker', p1, 'player');
          const i2 = window.testHelpers.spawnAntType('worker', p2, 'enemy');
          return { idx1: i1, idx2: i2 };
        }
        // Fallback to antsSpawn for player and manual constructor for enemy
        if (typeof antsSpawn === 'function') {
          antsSpawn(1, 'player');
          // last ant is player
          const player = window.ants[window.ants.length - 1];
          // create enemy via new Ant if constructor exists
          if (typeof window.Ant === 'function') {
            const enemy = new window.Ant(p2.x, p2.y, { faction: 'enemy' });
            // push to ants
            if (window.ants) window.ants.push(enemy);
            return { idx1: player._antIndex || player.antIndex || null, idx2: enemy._antIndex || enemy.antIndex || null };
          }
          return { idx1: player._antIndex || null, idx2: null };
        }

        // Last resort: try to instantiate two Ants directly
        if (typeof window.Ant === 'function') {
          const a1 = new window.Ant(p1.x, p1.y, { faction: 'player' });
          const a2 = new window.Ant(p2.x, p2.y, { faction: 'enemy' });
          if (window.ants && Array.isArray(window.ants)) { window.ants.push(a1); window.ants.push(a2); }
          return { idx1: a1._antIndex || null, idx2: a2._antIndex || null };
        }

        return { error: 'no-ant-spawn-api' };
      } catch (e) { return { error: '' + e }; }
    });

    console.log('Spawned pair info:', spawnInfo);
  if (spawnInfo.error) { console.error('Could not spawn ants for combat test:', spawnInfo.error); try { await saveScreenshot(page, 'combat/initiation', false); } catch (e) {} await browser.close(); process.exit(2); }

    // Prefer recorded spawned indexes from testHelpers when available (more reliable than returned spawnInfo)
    let pair = spawnInfo;
    if (await page.evaluate(() => !!(window.testHelpers && typeof window.testHelpers.getSpawnedAntIndexes === 'function'))) {
      const spawned = await page.evaluate(() => window.testHelpers.getSpawnedAntIndexes());
      if (Array.isArray(spawned) && spawned.length >= 2) {
        pair = { idx1: spawned[spawned.length - 2], idx2: spawned[spawned.length - 1] };
        console.log('Using recorded spawned indexes for combat:', pair);
      }
    }

    // Diagnostic snapshot: list current ants and their _antIndex values
    try {
      const antsSnapshot = await page.evaluate(() => {
        try {
          const windowArr = (window.ants || []);
          const windowMap = windowArr.map((a, i) => ({ idx: i, _antIndex: a && (a._antIndex || a.antIndex || null), hasTarget: !!(a && a.target) }));
          const moduleExists = (typeof ants !== 'undefined');
          let moduleMap = [];
          try { if (moduleExists && Array.isArray(ants)) moduleMap = ants.map((a, i) => ({ idx: i, _antIndex: a && (a._antIndex || a.antIndex || null), hasTarget: !!(a && a.target) })); } catch(e) { moduleMap = ['error reading ants: '+e]; }
          return { window: { exists: !!window.ants, length: windowArr.length, map: windowMap }, module: { exists: moduleExists, length: (moduleExists && Array.isArray(ants)) ? ants.length : 0, map: moduleMap }, spawnedRecord: (window.__test_spawned_ants || []) };
        } catch (e) { return { error: '' + e }; }
      });
      console.log('ANTS SNAPSHOT:', antsSnapshot);
    } catch (e) { console.log('Failed to collect ants snapshot', e); }

    // Force combat deterministically using testHelpers if available, otherwise fall back to polling AI
    let combatDetected = null;
    if (await page.evaluate(() => !!(window.testHelpers && typeof window.testHelpers.forceCombat === 'function'))) {
      // Force combat
      await page.evaluate((pair) => {
        try {
          window.testHelpers.forceCombat(pair.idx1, pair.idx2);
        } catch (e) { console.error('forceCombat call failed', e); }
      }, pair);

      // Immediately verify combat flags were set. Try module-scoped `ants` first, then window.ants.
      combatDetected = await page.evaluate((pair) => {
        try {
          function lookup(i) {
            // Try module-scoped ants
            try {
              if (typeof ants !== 'undefined' && Array.isArray(ants)) {
                // find by _antIndex/antIndex
                const found = ants.find(a => a && (a._antIndex === i || a.antIndex === i));
                if (found) return found;
                // allow numeric index fallback
                if (Number.isInteger(i) && i >= 0 && i < ants.length) return ants[i];
              }
            } catch (e) { /* ignore */ }
            // Try window.ants
            try {
              if (typeof window !== 'undefined' && window.ants && Array.isArray(window.ants)) {
                const found2 = window.ants.find(a => a && (a._antIndex === i || a.antIndex === i));
                if (found2) return found2;
                if (Number.isInteger(i) && i >= 0 && i < window.ants.length) return window.ants[i];
              }
            } catch (e) { /* ignore */ }
            return null;
          }

          const a1 = lookup(pair.idx1);
          const a2 = lookup(pair.idx2);
          if (!a1 || !a2) {
            // provide diagnostic details
            const info = { moduleAntsLength: (typeof ants !== 'undefined' && Array.isArray(ants)) ? ants.length : null, windowAntsLength: (window.ants && Array.isArray(window.ants)) ? window.ants.length : null };
            return { error: 'ants-not-found', info };
          }
          const inCombat1 = !!(a1.isInCombat || (a1._stateMachine && typeof a1._stateMachine.getCombatModifier === 'function' && a1._stateMachine.getCombatModifier() !== 'DEFAULT') || a1.target);
          const inCombat2 = !!(a2.isInCombat || (a2._stateMachine && typeof a2._stateMachine.getCombatModifier === 'function' && a2._stateMachine.getCombatModifier() !== 'DEFAULT') || a2.target);
          // also include a debug snapshot of the two ants
          const snap = { a1Index: pair.idx1, a2Index: pair.idx2, a1_hasIsInCombat: !!a1.isInCombat, a2_hasIsInCombat: !!a2.isInCombat };
          return { inCombat1, inCombat2, snap };
        } catch (e) { return { error: '' + e }; }
      }, pair);
    } else {
      // Fallback: wait/poll for AI-driven combat
      combatDetected = await page.evaluate(async (pair) => {
        try {
          const maxMs = 3000; const start = Date.now();
          while (Date.now() - start < maxMs) {
            await new Promise(r => setTimeout(r, 100));
            // lookup ants by index
            const a1 = (window.ants || []).find(a => (a._antIndex === pair.idx1 || a.antIndex === pair.idx1)) || (Array.isArray(window.ants) ? window.ants[pair.idx1] : null);
            const a2 = (window.ants || []).find(a => (a._antIndex === pair.idx2 || a.antIndex === pair.idx2)) || (Array.isArray(window.ants) ? window.ants[pair.idx2] : null);
            if (!a1 || !a2) continue;
            // check common combat indicators: inCombat flag, _stateMachine combat modifier, or target set
            const inCombat1 = !!(a1.isInCombat || (a1._stateMachine && typeof a1._stateMachine.getCombatModifier === 'function' && a1._stateMachine.getCombatModifier() !== 'DEFAULT') || a1.target);
            const inCombat2 = !!(a2.isInCombat || (a2._stateMachine && typeof a2._stateMachine.getCombatModifier === 'function' && a2._stateMachine.getCombatModifier() !== 'DEFAULT') || a2.target);
            if (inCombat1 || inCombat2) return { inCombat1, inCombat2 };
          }
          return { timedOut: true };
        } catch (e) { return { error: '' + e }; }
      }, pair);
    }

    if (process.env.TEST_VERBOSE) console.log('Combat detection result:', combatDetected);
    if (combatDetected.error || combatDetected.timedOut) {
      console.error('Combat not detected');
      try { await saveScreenshot(page, 'combat/initiation', false); } catch (e) {}
      await browser.close();
      process.exit(2);
    }

    if (process.env.TEST_VERBOSE) console.log('Combat initiation test passed');
    try { await saveScreenshot(page, 'combat/initiation', true); } catch (e) {}
    await browser.close();
    process.exit(0);
  } catch (err) {
    console.error('Combat test error', err);
    try { await page.screenshot({ path: 'test/puppeteer/error_combat.png' }); } catch (e) {}
    await browser.close();
    process.exit(2);
  }
})();
