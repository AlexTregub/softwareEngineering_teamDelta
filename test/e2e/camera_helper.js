const { launchBrowser, sleep, saveScreenshot } = require('./puppeteer_helper');

// Central camera test harness for Puppeteer tests
async function launch() {
  return await launchBrowser();
}

async function newPageReady(browser, opts = {}) {
  const page = await browser.newPage();
  const viewport = opts.viewport || { width: 1024, height: 768 };
  await page.setViewport(viewport);

  // Forward console logs when verbose
  page.on('console', msg => {
    if (process.env.TEST_VERBOSE) console.log('PAGE LOG:', msg.text());
  });

  // Inject test-visible verbose flag early
  if (process.env.TEST_VERBOSE) await page.evaluateOnNewDocument(() => { window.__TEST_VERBOSE = true; });

  // small helper to navigate to the app and wait for canvas
  page.appGoto = async function(baseUrl = (process.env.TEST_URL || 'http://localhost:8000')) {
    const url = baseUrl.indexOf('?') === -1 ? baseUrl + '?test=1' : baseUrl + '&test=1';
    if (process.env.TEST_VERBOSE) console.log('camera_helper: navigating to', url);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 });
    await (page.waitForTimeout ? page.waitForTimeout(800) : sleep(800));
    try { await page.waitForSelector('canvas', { timeout: 20000 }); } catch (e) { /* allow tests to handle */ }
    return page;
  };

  return page;
}

// Try to advance past the title screen using available APIs without forcing test internals.
// Returns { started: bool, reason, diagnostics }
async function ensureGameStarted(page) {
  try {
    const res = await page.evaluate(async () => {
      const diag = { called: [], errors: [] };
      try {
        // If there's a global GameState with startGame, use it
        const gs = window.GameState || window.g_gameState || null;
        if (gs && typeof gs.getState === 'function' && gs.getState() === 'PLAYING') return { started: true, diagnostics: diag };
        try {
          if (gs && typeof gs.startGame === 'function') { diag.called.push('gs.startGame'); gs.startGame(); }
          else if (gs && typeof gs.start === 'function') { diag.called.push('gs.start'); gs.start(); }
        } catch (e) { diag.errors.push('gs.start error: ' + e); }

        // Try legacy functions / globals
        try {
          if (typeof window.startGameTransition === 'function') { diag.called.push('startGameTransition'); window.startGameTransition(); }
          if (typeof window.startGame === 'function') { diag.called.push('startGame'); window.startGame(); }
        } catch (e) { diag.errors.push('startGameTransition/startGame error: ' + e); }

        // Try clicking UI: look for a button with text 'PLAY' (case-insensitive)
        try {
          const buttons = Array.from(document.querySelectorAll('button, a, div'));
          const playBtn = buttons.find(n => n.innerText && /play/i.test(n.innerText));
          if (playBtn) { diag.called.push('clicked-play-button'); playBtn.click(); }
        } catch (e) { diag.errors.push('ui click error: ' + e); }

        // Wait a short moment for state to change
        await new Promise(r => setTimeout(r, 500));

        const gs2 = window.GameState || window.g_gameState || null;
        if (gs2 && typeof gs2.getState === 'function' && gs2.getState && gs2.getState() === 'PLAYING') return { started: true, diagnostics: diag };

        // As a last resort, if ants array appears, consider the game started
        if ((typeof ants !== 'undefined' && Array.isArray(ants) && ants.length) || (window.ants && Array.isArray(window.ants) && window.ants.length)) {
          return { started: true, diagnostics: diag };
        }

        return { started: false, diagnostics: diag };
      } catch (e) { return { started: false, diagnostics: { error: '' + e } } }
    });

    if (process.env.TEST_VERBOSE) console.log('ensureGameStarted result:', res);
    return res;
  } catch (e) {
    return { started: false, diagnostics: { error: '' + e } };
  }
}

// Send a wheel event to the page at client coordinates (cx,cy) with deltaY sign
async function sendWheel(page, deltaY = -100, opts = {}) {
  const cx = opts.cx || (opts.clientX || 200);
  const cy = opts.cy || (opts.clientY || 200);
  await page.mouse.move(cx, cy);
  // dispatch wheel via evaluate to ensure event properties
  await page.evaluate((x,y,d) => {
    const el = document.elementFromPoint(x,y) || document.body;
    const ev = new WheelEvent('wheel', { deltaY: d, clientX: x, clientY: y, bubbles: true, cancelable: true });
    el.dispatchEvent(ev);
  }, cx, cy, deltaY);
  await (page.waitForTimeout ? page.waitForTimeout(120) : sleep(120));
}

// Set zoom using available APIs (CameraManager or CameraController). focusX/Y are world-space coords
async function setZoom(page, targetZoom, focusWorldX = null, focusWorldY = null) {
  return await page.evaluate((z, fx, fy) => {
    const out = { attempted: [] };
    try {
      if (typeof window.g_cameraManager !== 'undefined' && window.g_cameraManager && typeof window.g_cameraManager.setZoom === 'function') {
        out.attempted.push('g_cameraManager.setZoom');
        return { ok: !!window.g_cameraManager.setZoom(z, fx, fy), attempted: out.attempted };
      }
      if (typeof window.setCameraZoom === 'function') {
        out.attempted.push('setCameraZoom');
        return { ok: !!window.setCameraZoom(z, fx, fy), attempted: out.attempted };
      }
      if (typeof window.CameraController !== 'undefined' && typeof window.CameraController.setCameraZoom === 'function') {
        out.attempted.push('CameraController.setCameraZoom');
        window.CameraController.setCameraZoom(z, fx, fy);
        return { ok: true, attempted: out.attempted };
      }
      // fallback to directly setting cameraZoom if present
      if (typeof window.g_cameraManager !== 'undefined' && window.g_cameraManager) {
        try { window.g_cameraManager.cameraZoom = z; out.attempted.push('direct set g_cameraManager.cameraZoom'); return { ok: true, attempted: out.attempted }; } catch(e) {}
      }
    } catch (e) { return { ok: false, error: '' + e, attempted: out.attempted } }
    return { ok: false, attempted: out.attempted };
  }, targetZoom, focusWorldX, focusWorldY);
}

// Center camera on world coords using available APIs
async function centerOn(page, worldX, worldY) {
  return await page.evaluate((x,y) => {
    const out = { attempted: [] };
    try {
      if (window.testHelpers && typeof window.testHelpers.centerCameraOn === 'function') { out.attempted.push('testHelpers.centerCameraOn'); return { ok: !!window.testHelpers.centerCameraOn(x,y), attempted: out.attempted }; }
      if (window.g_cameraManager && typeof window.g_cameraManager.centerOn === 'function') { out.attempted.push('g_cameraManager.centerOn'); return { ok: !!window.g_cameraManager.centerOn(x,y), attempted: out.attempted }; }
      if (typeof window.centerCameraOn === 'function') { out.attempted.push('centerCameraOn global'); window.centerCameraOn(x,y); return { ok: true, attempted: out.attempted }; }
      if (typeof window.CameraController !== 'undefined' && typeof window.CameraController.centerCameraOn === 'function') { out.attempted.push('CameraController.centerCameraOn'); window.CameraController.centerCameraOn(x,y); return { ok: true, attempted: out.attempted }; }
      return { ok: false, attempted: out.attempted };
    } catch (e) { return { ok: false, error: '' + e, attempted: out.attempted } }
  }, worldX, worldY);
}

// Try to enter Level Editor from main menu and wait for panels to initialize.
// Returns { started: bool, reason, diagnostics, panels: [] }
async function ensureLevelEditorStarted(page) {
  try {
    const res = await page.evaluate(async () => {
      const diag = { called: [], errors: [], panels: [] };
      try {
        // Check if already in Level Editor
        const gs = window.GameState || window.g_gameState || null;
        if (gs && typeof gs.getState === 'function' && gs.getState() === 'LEVEL_EDITOR') {
          // Already in Level Editor, check if panels registered
          if (window.draggablePanelManager && window.draggablePanelManager.panels) {
            const panelsObj = window.draggablePanelManager.panels;
            diag.panels = panelsObj instanceof Map ? Array.from(panelsObj.keys()) : Object.keys(panelsObj);
            
            if (diag.panels.includes('level-editor-materials')) {
              return { started: true, diagnostics: diag };
            }
          }
        }
        
        // Try to click Level Editor button from main menu
        try {
          const buttons = Array.from(document.querySelectorAll('button, a, div'));
          const levelEditorBtn = buttons.find(n => n.innerText && /level\s*editor/i.test(n.innerText));
          if (levelEditorBtn) { 
            diag.called.push('clicked-level-editor-button'); 
            levelEditorBtn.click(); 
          }
        } catch (e) { diag.errors.push('button click error: ' + e); }
        
        // Try mainMenu.buttons array
        try {
          if (window.mainMenu && window.mainMenu.buttons) {
            const levelEditorButton = window.mainMenu.buttons.find(btn => 
              btn.label && /level\s*editor/i.test(btn.label)
            );
            if (levelEditorButton && levelEditorButton.action) {
              diag.called.push('mainMenu.buttons.action');
              levelEditorButton.action();
            }
          }
        } catch (e) { diag.errors.push('mainMenu.buttons error: ' + e); }
        
        // Try GameState.setState directly
        try {
          if (gs && typeof gs.setState === 'function') {
            diag.called.push('GameState.setState(LEVEL_EDITOR)');
            gs.setState('LEVEL_EDITOR');
          }
        } catch (e) { diag.errors.push('setState error: ' + e); }
        
        // Wait for panels to initialize (up to 3 seconds)
        for (let i = 0; i < 6; i++) {
          await new Promise(r => setTimeout(r, 500));
          
          if (window.draggablePanelManager && window.draggablePanelManager.panels) {
            const panelsObj = window.draggablePanelManager.panels;
            diag.panels = panelsObj instanceof Map ? Array.from(panelsObj.keys()) : Object.keys(panelsObj);
            
            if (diag.panels.includes('level-editor-materials')) {
              diag.called.push(`panels-ready-after-${(i + 1) * 500}ms`);
              return { started: true, diagnostics: diag };
            }
          }
        }
        
        // Check final state
        const gs2 = window.GameState || window.g_gameState || null;
        if (gs2 && typeof gs2.getState === 'function' && gs2.getState() === 'LEVEL_EDITOR') {
          // State is correct but panels not registered
          return { started: false, reason: 'Level Editor state active but panels not registered', diagnostics: diag };
        }
        
        return { started: false, reason: 'Could not enter Level Editor', diagnostics: diag };
      } catch (e) { return { started: false, reason: 'Exception: ' + e, diagnostics: { error: '' + e } } }
    });

    if (process.env.TEST_VERBOSE) console.log('ensureLevelEditorStarted result:', res);
    return res;
  } catch (e) {
    return { started: false, reason: 'Exception: ' + e, diagnostics: { error: '' + e } };
  }
}

// Utility: read camera and map diagnostics
async function getDiagnostics(page) {
  return await page.evaluate(() => {
    try {
      const cam = (window.g_cameraManager) ? { x: window.g_cameraManager.cameraX, y: window.g_cameraManager.cameraY, zoom: window.g_cameraManager.cameraZoom } : (typeof window.cameraX !== 'undefined' ? { x: window.cameraX, y: window.cameraY, zoom: window.cameraZoom || 1 } : null);
      const map = (typeof g_activeMap !== 'undefined' && g_activeMap) ? { xCount: g_activeMap._xCount, yCount: g_activeMap._yCount, tileSize: g_activeMap.tileSize || window.TILE_SIZE || null, cacheStats: (typeof g_activeMap.getCacheStats === 'function' ? g_activeMap.getCacheStats() : null) } : null;
      return { camera: cam, map };
    } catch (e) { return { error: '' + e }; }
  });
}

module.exports = { launch, newPageReady, ensureGameStarted, ensureLevelEditorStarted, sendWheel, setZoom, centerOn, getDiagnostics, saveScreenshot };
