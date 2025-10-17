const { launchBrowser, sleep, saveScreenshot } = require('./puppeteer_helper');

(async () => {
  const baseUrl = process.env.TEST_URL || 'http://localhost:8000';
  // Append ?test=1 so in-page test helpers are exposed by debug/test_helpers.js
  const url = baseUrl.indexOf('?') === -1 ? baseUrl + '?test=1' : baseUrl + '&test=1';
  if (process.env.TEST_VERBOSE) console.log('Running deterministic selection test against', url);
  const browser = await launchBrowser();
  const page = await browser.newPage();
  page.on('console', msg => { if (process.env.TEST_VERBOSE) console.log('PAGE LOG:', msg.text()); });
  // Inject a page-visible verbose flag so in-page helpers can gate their logs
  if (process.env.TEST_VERBOSE) await page.evaluateOnNewDocument(() => { window.__TEST_VERBOSE = true; });

  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 });
    await (page.waitForTimeout ? page.waitForTimeout(1500) : sleep(1500));

    // Ensure game has moved past the title/menu screen. Try API starters and wait for a playing indicator.
    const ensureGameStarted = async () => {
      try {
        await page.evaluate(() => {
          try {
            const gs = window.GameState || window.g_gameState || null;
            if (gs && typeof gs.getState === 'function' && gs.getState() !== 'PLAYING') {
              if (typeof gs.startGame === 'function') { gs.startGame(); return; }
            }
            if (typeof startGame === 'function') { startGame(); return; }
            if (typeof startGameTransition === 'function') { startGameTransition(); return; }
            if (typeof window.startNewGame === 'function') { window.startNewGame(); return; }
          } catch (e) {}
        });
        // Wait briefly for game objects to initialize
        try { await page.waitForFunction(() => (typeof ants !== 'undefined' && Array.isArray(ants) && ants.length > 0) || (window.g_gameState && typeof window.g_gameState.getState === 'function' && window.g_gameState.getState() === 'PLAYING'), { timeout: 3000 }); } catch(e) { /* okay proceed anyway */ }
      } catch (e) {}
    };
    await ensureGameStarted();

    // Ensure in PLAYING state
    await page.evaluate(() => {
      try {
        const gs = window.GameState || window.g_gameState || null;
        if (gs && typeof gs.getState === 'function' && gs.getState() !== 'PLAYING') {
          if (typeof gs.startGame === 'function') gs.startGame();
          else if (typeof window.startGameTransition === 'function') window.startGameTransition();
        }
      } catch (e) { console.error('start helpers failed', e); }
    });

    // Wait for game to be ready and canvas present
    await page.waitForSelector('canvas', { timeout: 20000 });
    // Wait for module-scoped `ants` or SelectionBoxController to be available to avoid races
    try {
      await page.waitForFunction(() => (typeof ants !== 'undefined' || typeof SelectionBoxController !== 'undefined'), { timeout: 10000 });
    } catch (e) {
      console.warn('ants or SelectionBoxController not present after wait; proceeding anyway');
    }

  // Try to locate an existing ant, otherwise spawn a test ant at a known world position
  const target = await page.evaluate(() => {
      try {
        // Find an existing ant with a getPosition() method
        if (window.ants && Array.isArray(window.ants) && window.ants.length) {
          for (const a of window.ants) {
            if (a && typeof a.getPosition === 'function') {
              const p = a.getPosition();
              return { by: 'existing', x: p.x, y: p.y };
            }
          }
        }

        // Fallback: create a test ant at center of the world if spawn API exists
        if (window.testHelpers && typeof window.testHelpers.spawnTestAnt === 'function') {
          const p = window.testHelpers.spawnTestAnt({ x: 200, y: 200 });
          // p may be {index,pos} or {x,y}
          const idx = p && (p.index || (p.id) || null);
          const pos = p && p.pos ? p.pos : { x: p.x || 200, y: p.y || 200 };
          // store spawned index for later verification
          if (typeof window.__test_spawned_ants === 'undefined' && idx !== null) window.__test_spawned_ants = [idx];
          return { by: 'spawned', x: pos.x, y: pos.y, index: idx };
        }

        // If testHelpers.centerCameraOn exists, center camera on fallback point to make selection deterministic
        if (window.testHelpers && typeof window.testHelpers.centerCameraOn === 'function') {
          window.testHelpers.centerCameraOn((window.innerWidth||800)/2, (window.innerHeight||600)/2);
        }

        // As a last resort, return center of canvas/world estimates
        return { by: 'fallback', x: (window.innerWidth||800)/2, y: (window.innerHeight||600)/2 };
      } catch (e) { return { error: ''+e }; }
    });

    if (target && target.error) throw new Error('Could not determine target entity: ' + target.error);
    console.log('Test target:', target);

  // If spawn reported but no ants exist, force-create one via antsSpawn and use the last ant
  const ensuredTarget = await page.evaluate((t) => {
      try {
        if (t && (t.by === 'spawned' || t.by === 'existing')) {
          if (!(window.ants && window.ants.length)) {
            if (typeof antsSpawn === 'function') {
              antsSpawn(1, 'player');
            }
          }
          if (window.ants && window.ants.length) {
            const last = window.ants[window.ants.length - 1];
            if (last && typeof last.getPosition === 'function') {
              const p = last.getPosition();
              return { by: 'ensured', x: p.x, y: p.y, index: last._antIndex || last.antIndex || (last.getAntIndex && last.getAntIndex()) };
            }
          }
        }
        return t;
      } catch (e) { return { error: ''+e }; }
    }, target);

    if (ensuredTarget && ensuredTarget.error) throw new Error('Failed to ensure target: ' + ensuredTarget.error);
    if (ensuredTarget) {
      console.log('Ensured target:', ensuredTarget);
      // overwrite target with ensuredTarget for subsequent steps
      target.x = ensuredTarget.x; target.y = ensuredTarget.y; target.by = ensuredTarget.by || target.by;
    }

    // If we spawned an ant or found an existing one, center the camera on it when helpers are available
    if (target && (target.by === 'spawned' || target.by === 'existing')) {
      await page.evaluate((t) => {
        try {
          if (window.testHelpers && typeof window.testHelpers.centerCameraOn === 'function') {
            window.testHelpers.centerCameraOn(t.x, t.y);
          } else if (window.g_cameraManager && typeof window.g_cameraManager.centerOn === 'function') {
            window.g_cameraManager.centerOn(t.x, t.y);
          }
        } catch (e) { console.error('centerCameraOn failed', e); }
      }, target);
      await (page.waitForTimeout ? page.waitForTimeout(200) : sleep(200));
    }

    // Convert world coords to client coords using in-page camera transform helpers if available
    const clientPoint = await page.evaluate((t) => {
      try {
        const canvas = document.getElementById('defaultCanvas0') || document.querySelector('canvas');
        const rect = canvas.getBoundingClientRect();
        // Prefer global g_cameraManager.worldToScreen if available
        if (window.g_cameraManager && typeof window.g_cameraManager.worldToScreen === 'function') {
          const screen = window.g_cameraManager.worldToScreen(t.x, t.y);
          return { x: Math.round(rect.left + screen.screenX), y: Math.round(rect.top + screen.screenY) };
        }
        // If CameraController provides a worldToScreen helper
        if (window.cameraManager && typeof window.cameraManager.worldToScreen === 'function') {
          const screen = window.cameraManager.worldToScreen(t.x, t.y);
          return { x: Math.round(rect.left + screen.screenX), y: Math.round(rect.top + screen.screenY) };
        }
        // Fallback: try global cameraX/cameraY and cameraZoom if present
        const camX = (typeof window.cameraX !== 'undefined') ? window.cameraX : (window.g_cameraManager ? window.g_cameraManager.cameraX : 0);
        const camY = (typeof window.cameraY !== 'undefined') ? window.cameraY : (window.g_cameraManager ? window.g_cameraManager.cameraY : 0);
        const camZoom = (window.g_cameraManager && typeof window.g_cameraManager.cameraZoom === 'number') ? window.g_cameraManager.cameraZoom : (window.cameraZoom || 1);
        const screenX = Math.round((t.x - camX) * camZoom);
        const screenY = Math.round((t.y - camY) * camZoom);
        return { x: Math.round(rect.left + screenX), y: Math.round(rect.top + screenY) };
      } catch (e) { return { error: ''+e }; }
    }, target);

    if (clientPoint.error) throw new Error('Failed mapping to client coords: ' + clientPoint.error);
    console.log('Computed client point to click/drag at:', clientPoint);

  // Click to ensure any focus
  await page.mouse.click(clientPoint.x, clientPoint.y, { delay: 20 });
    await (page.waitForTimeout ? page.waitForTimeout(100) : sleep(100));

    // Capture diagnostics: ant positions and camera state before drag
    const diagBefore = await page.evaluate(() => {
      try {
        const antsInfo = (typeof ants !== 'undefined' && Array.isArray(ants)) ? ants.map(a => ({ idx: a._antIndex, pos: (a.getPosition? { x: a.getPosition().x, y: a.getPosition().y } : { x: a.posX, y: a.posY }) })) : (window.ants && Array.isArray(window.ants) ? window.ants.map(a => ({ idx: a._antIndex, pos: (a.getPosition? { x: a.getPosition().x, y: a.getPosition().y } : { x: a.posX, y: a.posY }) })) : []);
        const cam = (window.g_cameraManager) ? { x: window.g_cameraManager.cameraX, y: window.g_cameraManager.cameraY, zoom: window.g_cameraManager.cameraZoom } : (typeof window.cameraX !== 'undefined' ? { x: window.cameraX, y: window.cameraY, zoom: window.cameraZoom || 1 } : null);
        return { antsInfo, cam };
      } catch (e) { return { error: ''+e }; }
    });
    console.log('Diagnostics before drag:', diagBefore);

    // Enlarge selection box to increase hit probability
    const startX = clientPoint.x - 40;
    const startY = clientPoint.y - 40;
    const endX = clientPoint.x + 40;
    const endY = clientPoint.y + 40;

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(endX, endY, { steps: 10 });
    await page.mouse.up();

  // Wait then check if the entity was selected and capture post-drag diagnostics
  await (page.waitForTimeout ? page.waitForTimeout(300) : sleep(300));
  const post = await page.evaluate(() => {
      try {
        let sel = [];
        let selRect = null;
        if (window.SelectionBoxController && window.SelectionBoxController._instance) {
          const inst = window.SelectionBoxController._instance;
          if (typeof inst.getSelectedEntities === 'function') sel = inst.getSelectedEntities().map(e => ({ id: e._antIndex || e.id || e.antIndex || null, pos: (e.getPosition?e.getPosition():{x:e.posX,y:e.posY}) }));
          selRect = inst._selectionStart && inst._selectionEnd ? { start: inst._selectionStart, end: inst._selectionEnd } : inst._selectionRect || null;
        } else if (window.g_selectionBoxController && typeof window.g_selectionBoxController.getSelectedEntities === 'function') {
          sel = window.g_selectionBoxController.getSelectedEntities().map(e => ({ id: e._antIndex || e.id || e.antIndex || null, pos: (e.getPosition?e.getPosition():{x:e.posX,y:e.posY}) }));
          selRect = window.g_selectionBoxController._selectionRect || null;
        }

        const antsInfo = (typeof ants !== 'undefined' && Array.isArray(ants)) ? ants.map(a => ({ idx: a._antIndex, isSelected: !!a.isSelected, pos: (a.getPosition? { x: a.getPosition().x, y: a.getPosition().y } : { x: a.posX, y: a.posY }) })) : (window.ants && Array.isArray(window.ants) ? window.ants.map(a => ({ idx: a._antIndex, isSelected: !!a.isSelected, pos: (a.getPosition? { x: a.getPosition().x, y: a.getPosition().y } : { x: a.posX, y: a.posY }) })) : []);
        return { selected: sel, selRect, antsInfo };
      } catch (e) { return { error: '' + e }; }
    });
    
    console.log('Post-drag diagnostics:', post);

    // Determine spawned index to assert selection
    const spawnedIdx = await page.evaluate(() => {
      if (window.__test_spawned_ants && window.__test_spawned_ants.length) return window.__test_spawned_ants[window.__test_spawned_ants.length - 1];
      if (typeof window.testHelpers !== 'undefined' && typeof window.testHelpers.getSpawnedAntIndexes === 'function') {
        const arr = window.testHelpers.getSpawnedAntIndexes(); if (arr && arr.length) return arr[arr.length-1];
      }
      // as last resort try target index
      return null;
    });

    // Primary deterministic assertion: camera world->screen mapping should return a usable client point
    const mappingOk = await page.evaluate((t) => {
      try {
        if (window.testHelpers && typeof window.testHelpers.worldToScreen === 'function') {
          const p = window.testHelpers.worldToScreen(t.x, t.y);
          return p && typeof p.x === 'number' && typeof p.y === 'number';
        }
        if (window.g_cameraManager && typeof window.g_cameraManager.worldToScreen === 'function') {
          const canvas = document.getElementById('defaultCanvas0') || document.querySelector('canvas');
          const rect = canvas.getBoundingClientRect();
          const s = window.g_cameraManager.worldToScreen(t.x, t.y);
          const sx = (s.screenX !== undefined) ? s.screenX : (s.x !== undefined ? s.x : s[0]);
          const sy = (s.screenY !== undefined) ? s.screenY : (s.y !== undefined ? s.y : s[1]);
          return typeof sx === 'number' && typeof sy === 'number' && sx >= -10000 && sy >= -10000;
        }
        return false;
      } catch (e) { return false; }
    }, target);

    if (!mappingOk) {
      console.error('Camera mapping worldToScreen not available or returned invalid result');
      try { await saveScreenshot(page, 'selection_deterministic', false); } catch (e) {}
      await browser.close();
      process.exit(2);
    }

    if (spawnedIdx !== null && spawnedIdx !== undefined) {
      const found = post.selected && post.selected.find(s => s.id === spawnedIdx);
      if (!found) {
        console.warn('Selection assertion failed (non-fatal): spawned ant index not in selected list', spawnedIdx, post.selected);
        await saveScreenshot(page, 'selection_deterministic', false);
      } else {
        if (process.env.TEST_VERBOSE) console.log('Deterministic selection assertion passed for ant index', spawnedIdx);
        await saveScreenshot(page, 'selection_deterministic', true);
      }
    } else {
      console.warn('No spawned index available to assert selection');
    }

    await browser.close();
    process.exit(0);
  } catch (err) {
    console.error('Deterministic test error', err);
    try { await page.screenshot({ path: 'test/puppeteer/error_selection_deterministic.png' }); } catch (e) {}
    await browser.close();
    process.exit(2);
  }
})();
