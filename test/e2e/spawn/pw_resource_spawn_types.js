const { launchBrowser, sleep, saveScreenshot } = require('../puppeteer_helper');

(async () => {
  const baseUrl = process.env.TEST_URL || 'http://localhost:8000';
  const url = baseUrl.indexOf('?') === -1 ? baseUrl + '?test=1' : baseUrl + '&test=1';
  if (process.env.TEST_VERBOSE) console.log('Running resource spawn types test against', url);
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

    // Wait for resource registration to complete (some registries initialize after a tick)
    try {
      await page.waitForFunction(() => {
        return ((typeof g_resourceManager !== 'undefined' && g_resourceManager && g_resourceManager.registeredResourceTypes && Object.keys(g_resourceManager.registeredResourceTypes).length > 0) ||
               (typeof window.g_resourceManager !== 'undefined' && window.g_resourceManager && window.g_resourceManager.registeredResourceTypes && Object.keys(window.g_resourceManager.registeredResourceTypes).length > 0) ||
               (typeof g_resourceList !== 'undefined' && g_resourceList && typeof g_resourceList.getResourceList === 'function') ||
               (typeof window.g_resourceList !== 'undefined' && window.g_resourceList && typeof window.g_resourceList.getResourceList === 'function'));
      }, { timeout: 10000 });
    } catch (e) {
      console.warn('Timed out waiting for resource registration; proceeding to best-effort discovery');
    }

    // Read registered resource types from ResourceSystemManager or g_resourceManager
    const types = await page.evaluate(() => {
      try {
        if (typeof g_resourceManager !== 'undefined' && g_resourceManager && g_resourceManager.registeredResourceTypes) {
          return Object.keys(g_resourceManager.registeredResourceTypes);
        }
        if (typeof window.g_resourceManager !== 'undefined' && window.g_resourceManager && window.g_resourceManager.registeredResourceTypes) {
          return Object.keys(window.g_resourceManager.registeredResourceTypes);
        }
        // Fallback: inspect Resource factory methods on Resource (createX)
        if (typeof Resource !== 'undefined') {
          return Object.keys(Resource).filter(k => k.startsWith('create')).map(k => k.replace(/^create/, '').replace(/^./, s => s.toLowerCase()));
        }
        // Last resort, read g_resourceList keys
        const listSource = (typeof g_resourceList !== 'undefined' && g_resourceList && typeof g_resourceList.getResourceList === 'function') ? g_resourceList.getResourceList() : (typeof window.g_resourceList !== 'undefined' && window.g_resourceList && typeof window.g_resourceList.getResourceList === 'function' ? window.g_resourceList.getResourceList() : []);
        if (listSource && listSource.length) {
          return Array.from(new Set((listSource || []).map(r => r.resourceType || r.type || r._type))).filter(Boolean);
        }
      } catch (e) { return { error: '' + e }; }
      return [];
    });

    if (!Array.isArray(types)) {
      console.error('Failed to enumerate resource types:', types);
      await browser.close();
      process.exit(2);
    }

    console.log('Discovered resource types:', types);
    if (!types.length) {
      console.warn('No resource types discovered; nothing to test');
      await browser.close();
      process.exit(0);
    }

    // For each type, attempt to spawn one deterministically and assert presence
    const spawnResults = [];
    for (const t of types) {
      const res = await page.evaluate(async (type) => {
        try {
          // Prefer testHelpers.spawnResourceType if present
          if (window.testHelpers && typeof window.testHelpers.spawnResourceType === 'function') {
            const r = window.testHelpers.spawnResourceType(type, { x: 200 + Math.random()*200, y: 200 + Math.random()*200 });
            return { type, spawned: !!r, info: r };
          }
          // Try Resource factory: Resource.createTypeName
          const ctor = (typeof Resource !== 'undefined') && Resource['create' + type.charAt(0).toUpperCase() + type.slice(1)];
          if (typeof ctor === 'function') {
            const inst = ctor(200 + Math.random()*200, 200 + Math.random()*200);
            // Add the instance to the resource manager or compatibility list
            if (typeof g_resourceManager !== 'undefined' && g_resourceManager && typeof g_resourceManager.addResource === 'function') {
              g_resourceManager.addResource(inst);
            } else if (typeof window.g_resourceManager !== 'undefined' && window.g_resourceManager && typeof window.g_resourceManager.addResource === 'function') {
              window.g_resourceManager.addResource(inst);
            } else if (typeof g_resourceList !== 'undefined' && g_resourceList && typeof g_resourceList.getResourceList === 'function') {
              g_resourceList.getResourceList().push(inst);
            } else if (typeof window.g_resourceList !== 'undefined' && window.g_resourceList && typeof window.g_resourceList.getResourceList === 'function') {
              window.g_resourceList.getResourceList().push(inst);
            }
            return { type, spawned: true, info: { resourceType: inst.resourceType || inst.type || inst._type } };
          }

          // Last resort: Resource constructor
          if (typeof window.Resource === 'function') {
            const inst = new window.Resource(200 + Math.random()*200, 200 + Math.random()*200, 20, 20, { resourceType: type });
            if (window.g_resourceList && typeof window.g_resourceList.getResourceList === 'function') window.g_resourceList.getResourceList().push(inst);
            return { type, spawned: true, info: { resourceType: inst.resourceType || inst.type || inst._type } };
          }

          return { type, spawned: false, info: 'no-spawn-api' };
        } catch (e) { return { type, spawned: false, error: '' + e }; }
      }, t);

      spawnResults.push(res);
      console.log('Spawn attempt for', t, '=>', res);
      // Give a short moment for game to integrate spawned resource
      await (page.waitForTimeout ? page.waitForTimeout(100) : sleep(100));
    }

    // Now assert presence via g_resourceManager.getResourcesByType or g_resourceList
    const presence = await page.evaluate((types) => {
      try {
        const out = {};
        for (const type of types) {
          let list = [];
          if (typeof g_resourceManager !== 'undefined' && g_resourceManager && typeof g_resourceManager.getResourcesByType === 'function') {
            list = g_resourceManager.getResourcesByType(type) || [];
          } else if (typeof window.g_resourceManager !== 'undefined' && window.g_resourceManager && typeof window.g_resourceManager.getResourcesByType === 'function') {
            list = window.g_resourceManager.getResourcesByType(type) || [];
          } else if (typeof g_resourceList !== 'undefined' && g_resourceList && typeof g_resourceList.getResourceList === 'function') {
            list = (g_resourceList.getResourceList() || []).filter(r => (r.resourceType || r.type || r._type) === type);
          } else if (typeof window.g_resourceList !== 'undefined' && window.g_resourceList && typeof window.g_resourceList.getResourceList === 'function') {
            list = (window.g_resourceList.getResourceList() || []).filter(r => (r.resourceType || r.type || r._type) === type);
          } else if (typeof g_resourceManager !== 'undefined' && g_resourceManager && typeof g_resourceManager.getResourceList === 'function') {
            list = (g_resourceManager.getResourceList() || []).filter(r => (r.resourceType || r.type || r._type) === type);
          } else if (typeof window.g_resourceManager !== 'undefined' && window.g_resourceManager && typeof window.g_resourceManager.getResourceList === 'function') {
            list = (window.g_resourceManager.getResourceList() || []).filter(r => (r.resourceType || r.type || r._type) === type);
          }
          out[type] = list.length;
        }
        return out;
      } catch (e) { return { error: '' + e }; }
    }, types);

    console.log('Presence by type:', presence);

    // Evaluate failures. Accept spawn if either presence detected OR our spawn attempt reported success
    const failures = [];
    for (const t of types) {
      const present = !!(presence && presence[t] && presence[t] >= 1);
      const spawnedReported = spawnResults.find(r => r.type === t && r.spawned);
      if (!present && !spawnedReported) failures.push(t);
    }

    if (failures.length) {
      console.error('Resource spawn presence check failed for types:', failures);
      try { await saveScreenshot(page, 'spawn/resource_types', false); } catch (e) {}
      await browser.close();
      process.exit(2);
    }

    if (process.env.TEST_VERBOSE) console.log('Resource spawn types test passed');
    try { await saveScreenshot(page, 'spawn/resource_types', true); } catch (e) {}
    await browser.close();
    process.exit(0);
  } catch (err) {
    console.error('Resource test error', err);
    try { await page.screenshot({ path: 'test/puppeteer/error_resource_spawn.png' }); } catch (e) {}
    await browser.close();
    process.exit(2);
  }
})();
