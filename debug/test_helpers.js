// Lightweight test helpers exposed only when TESTING_ENABLED or ?test=1 is present
(function(){
  function shouldExpose() {
    try {
      if (typeof window === 'undefined') return false;
      if (window.TESTING_ENABLED) return true;
      // Allow exposure when URL contains ?test=1 for CI/Puppeteer runs
      try { return window.location && window.location.search && window.location.search.indexOf('test=1') !== -1; } catch(e) { return false; }
    } catch(e) { return false; }
  }

  if (!shouldExpose()) return;

  window.testHelpers = window.testHelpers || {};

  // Spawn a single ant at a given world position. Returns the created ant's position.
  window.testHelpers.spawnTestAnt = function(pos) {
    try {
      const x = (pos && typeof pos.x === 'number') ? pos.x : (g_canvasX || window.innerWidth || 400) / 2;
      const y = (pos && typeof pos.y === 'number') ? pos.y : (g_canvasY || window.innerHeight || 400) / 2;

      // Ensure a global ants array is present
      if (typeof ants === 'undefined') {
        try { window.ants = []; } catch (e) { /* ignore */ }
      }

      // Method 1: Try AntFactory (MVC pattern - PREFERRED)
      if (typeof AntFactory !== 'undefined' && typeof AntFactory.createAnt === 'function') {
        const antMVC = AntFactory.createAnt(x, y, {
          faction: 'player',
          job: 'Scout'
        });
        
        // Register with tile interaction manager if present
        if (window.g_tileInteractionManager && typeof g_tileInteractionManager.addObject === 'function') {
          g_tileInteractionManager.addObject(antMVC, 'ant');
        }
        
        // Track spawned test ants for cleanup
        window.__test_spawned_ants = window.__test_spawned_ants || [];
        const idx = window.ants ? window.ants.indexOf(antMVC) : null;
        try { window.__test_spawned_ants.push(idx); } catch(e) {}
        
        return { 
          index: idx, 
          pos: antMVC.model ? { x: antMVC.model.getX(), y: antMVC.model.getY() } : { x, y }
        };
      }

      // Fallback: try antsSpawn
      if (typeof antsSpawn === 'function') {
        antsSpawn(1, 'player');
        const last = (window.ants && window.ants.length) ? window.ants[window.ants.length - 1] : null;
        const idx = last ? (window.ants ? window.ants.indexOf(last) : null) : null;
        try { window.__test_spawned_ants = window.__test_spawned_ants || []; if (idx!==null) window.__test_spawned_ants.push(idx); } catch(e) {}
        const lastPos = last && last.model ? { x: last.model.getX(), y: last.model.getY() } : { x, y };
        return { index: idx, pos: lastPos };
      }

      return { x, y };
    } catch (e) {
      console.error('spawnTestAnt failed', e);
      return null;
    }
  };

  // Center camera on a world position (x,y)
  window.testHelpers.centerCameraOn = function(x,y) {
    try {
      if ((window.g_cameraManager && typeof window.g_cameraManager.centerOn === 'function') || (window.cameraManager && typeof window.cameraManager.centerOn === 'function')) {
        const cam = window.g_cameraManager || window.cameraManager || null;
        if (cam && typeof cam.centerOn === 'function') { cam.centerOn(x,y); return true; }
      }
      if (typeof CameraController !== 'undefined' && typeof CameraController.centerCameraOn === 'function') {
        CameraController.centerCameraOn(x,y);
        return true;
      }
      return false;
    } catch (e) { console.error('centerCameraOn failed', e); return false; }
  };

  // Return list of spawned test ant indexes
  window.testHelpers.getSpawnedAntIndexes = function() {
    return Array.isArray(window.__test_spawned_ants) ? window.__test_spawned_ants.slice() : [];
  };

  // Spawn an ant of a given 'type' at a position with a faction. Returns the ant index.
  // This is a deterministic helper for tests: it constructs the ant directly and registers it in globals.
  window.testHelpers.spawnAntType = function(type, pos, faction) {
    try {
      const x = (pos && typeof pos.x === 'number') ? pos.x : (g_canvasX || window.innerWidth || 400) / 2;
      const y = (pos && typeof pos.y === 'number') ? pos.y : (g_canvasY || window.innerHeight || 400) / 2;
      const fac = faction || 'player';
      
      // Ensure ants array exists
      if (typeof ants === 'undefined') window.ants = window.ants || [];
      
      let newAnt = null;
      
      // Method 1: Try AntFactory for queens (MVC pattern - PREFERRED)
      if (type && typeof type === 'string' && type.toLowerCase().includes('queen') && typeof AntFactory !== 'undefined' && typeof AntFactory.createQueen === 'function') {
        newAnt = AntFactory.createQueen(x, y, {
          faction: fac
        });
      }
      // Method 2: Try AntFactory for regular ants (MVC pattern - PREFERRED)
      else if (typeof AntFactory !== 'undefined' && typeof AntFactory.createAnt === 'function') {
        newAnt = AntFactory.createAnt(x, y, {
          faction: fac,
          job: type || 'Scout'
        });
      }
      // Method 3: Fallback to spawnQueen if available
      else if (type && typeof type === 'string' && type.toLowerCase().includes('queen') && typeof window.spawnQueen === 'function') {
        newAnt = window.spawnQueen();
      }

      if (!newAnt) return null;

      // Register with tile interaction manager if present
      try { if (window.g_tileInteractionManager && typeof g_tileInteractionManager.addObject === 'function') g_tileInteractionManager.addObject(newAnt, 'ant'); } catch(e){}

      // Track for cleanup
      window.__test_spawned_ants = window.__test_spawned_ants || [];
      let idx = (Array.isArray(window.ants) ? window.ants.indexOf(newAnt) : -1);
      try { window.__test_spawned_ants.push(idx); } catch(e){}

      return idx;
    } catch (e) { console.error('spawnAntType failed', e); return null; }
  };

  // Force combat between two ants by setting each as the other's target and toggling combat flags.
  // This exists only for deterministic tests and does not replace game AI.
  window.testHelpers.forceCombat = function(attackerIdx, defenderIdx) {
    try {
      const findByIdx = (i) => {
        // Find in global ants array (now contains MVC objects or old ants)
        try {
          if (Array.isArray(window.ants) && Number.isInteger(i) && i >= 0 && i < window.ants.length) {
            return window.ants[i];
          }
          if (typeof ants !== 'undefined' && Array.isArray(ants) && Number.isInteger(i) && i >= 0 && i < ants.length) {
            return ants[i];
          }
        } catch (e) {}
        return null;
      };
      
      const a = findByIdx(attackerIdx);
      const b = findByIdx(defenderIdx);
      if (!a || !b) return false;

      // Handle MVC ants (have .controller property)
      if (a.controller && b.controller) {
        try {
          if (a.controller._stateMachine && typeof a.controller._stateMachine.setCombatModifier === 'function') {
            a.controller._stateMachine.setCombatModifier('IN_COMBAT');
          }
          if (b.controller._stateMachine && typeof b.controller._stateMachine.setCombatModifier === 'function') {
            b.controller._stateMachine.setCombatModifier('IN_COMBAT');
          }
        } catch (e) {}
        
        try { 
          if (a.model) a.model._target = b; 
          if (b.model) b.model._target = a; 
        } catch (e) {}
        
        try { 
          if (a.model) a.model._isInCombat = true; 
          if (b.model) b.model._isInCombat = true; 
        } catch (e) {}
        
        // If there is a CombatController
        try {
          const aCombat = a.controller.getController ? a.controller.getController('combat') : null;
          const bCombat = b.controller.getController ? b.controller.getController('combat') : null;
          if (aCombat && typeof aCombat.onEngage === 'function') aCombat.onEngage(b);
          if (bCombat && typeof bCombat.onEngage === 'function') bCombat.onEngage(a);
        } catch (e) {}
        
        return true;
      }
      
      // Handle old ant class (fallback for backward compatibility during migration)
      try {
        if (a._stateMachine && typeof a._stateMachine.setCombatModifier === 'function') a._stateMachine.setCombatModifier('IN_COMBAT');
        if (b._stateMachine && typeof b._stateMachine.setCombatModifier === 'function') b._stateMachine.setCombatModifier('IN_COMBAT');
      } catch (e) {}
      try { a.target = b; b.target = a; } catch (e) {}
      try { a.isInCombat = true; b.isInCombat = true; } catch (e) {}
      try {
        if (a._combatController && typeof a._combatController.onEngage === 'function') a._combatController.onEngage(b);
        if (b._combatController && typeof b._combatController.onEngage === 'function') b._combatController.onEngage(a);
      } catch (e) {}

      return true;
    } catch (e) { console.error('forceCombat failed', e); return false; }
  };

  // Clear spawned test ants from global ants array (best-effort)
  window.testHelpers.clearTestAnts = function() {
    try {
      if (!window.__test_spawned_ants || !window.__test_spawned_ants.length) return 0;
      const ids = window.__test_spawned_ants;
      let removed = 0;
      
      // Clear from ants array using indices
      if (typeof ants !== 'undefined' && Array.isArray(ants)) {
        for (let i = ants.length - 1; i >= 0; i--) {
          if (ids.indexOf(i) !== -1) {
            ants.splice(i, 1);
            removed++;
          }
        }
      }
      
      if (window.ants && Array.isArray(window.ants) && window.ants !== ants) {
        for (let i = window.ants.length - 1; i >= 0; i--) {
          if (ids.indexOf(i) !== -1) {
            window.ants.splice(i, 1);
            removed++;
          }
        }
      }
      
      window.__test_spawned_ants = [];
      return removed;
    } catch (e) { console.error('clearTestAnts failed', e); return 0; }
  };

  // Convert world to client coordinates (uses g_cameraManager or camera globals)
  window.testHelpers.worldToScreen = function(worldX, worldY) {
    try {
      const canvas = document.getElementById('defaultCanvas0') || document.querySelector('canvas');
      const rect = canvas.getBoundingClientRect();
      const cam = window.g_cameraManager || window.cameraManager || null;
      if (cam && typeof cam.worldToScreen === 'function') {
        const s = cam.worldToScreen(worldX, worldY);
        // Accept objects returning either {x,y} or {screenX,screenY}
        const sx = (s.screenX !== undefined) ? s.screenX : (s.x !== undefined ? s.x : s[0]);
        const sy = (s.screenY !== undefined) ? s.screenY : (s.y !== undefined ? s.y : s[1]);
        return { x: Math.round(rect.left + sx), y: Math.round(rect.top + sy) };
      }
      const camX = (typeof window.cameraX !== 'undefined') ? window.cameraX : (cam ? (cam.cameraX || 0) : 0);
      const camY = (typeof window.cameraY !== 'undefined') ? window.cameraY : (cam ? (cam.cameraY || 0) : 0);
      const camZoom = (cam && typeof cam.cameraZoom === 'number') ? cam.cameraZoom : (window.cameraZoom || 1);
      const screenX = Math.round((worldX - camX) * camZoom);
      const screenY = Math.round((worldY - camY) * camZoom);
      return { x: Math.round(rect.left + screenX), y: Math.round(rect.top + screenY) };
    } catch (e) { return null; }
  };

  try { if (window.__TEST_VERBOSE) console.log('testHelpers exposed'); } catch (e) { /* ignore */ }
  // Provide a canonical testAPI surface that wraps testHelpers for future tests
  try {
    window.testAPI = window.testAPI || {};
    const map = ['spawnTestAnt','spawnAntType','forceCombat','getSpawnedAntIndexes','clearTestAnts','centerCameraOn','worldToScreen','worldToScreen'];
    map.forEach(k => {
      try {
        if (window.testHelpers && typeof window.testHelpers[k] === 'function') window.testAPI[k] = window.testHelpers[k].bind(window.testHelpers);
      } catch (e) {}
    });
    // fallback aliases
    if (!window.testAPI.spawn) window.testAPI.spawn = window.testAPI.spawnTestAnt || window.testAPI.spawnAntType || null;
  } catch (e) {}
})();
