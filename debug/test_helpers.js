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

      // Use antsSpawn to create one ant, but place it deterministically by temporarily overriding random
      // If antsSpawn isn't available, try spawnQueen or construct directly.
      // Ensure a global ants array is present (some files declare `let ants` and it's not a window property)
      if (typeof ants === 'undefined') {
        try { window.ants = []; } catch (e) { /* ignore */ }
      }

      if (typeof antsSpawn === 'function') {
        // Create one ant at a predictable position by using the ant constructor directly and pushing into ants array
        if (typeof ant === 'function') {
          const newAnt = new ant(x, y, (antSize && antSize.x) || 20, (antSize && antSize.y) || 20, 30, 0, antBaseSprite, 'Scout', 'player');
          if (typeof newAnt.assignJob === 'function') newAnt.assignJob('Scout', JobImages && JobImages.Scout);
          try {
            if (typeof ants !== 'undefined') ants.push(newAnt);
            else window.ants.push(newAnt);
          } catch (e) {
            // Last resort: set window.ants
            window.ants = window.ants || [];
            window.ants.push(newAnt);
          }
          // Register with tile interaction manager if present
          if (window.g_tileInteractionManager && typeof g_tileInteractionManager.addObject === 'function') {
            g_tileInteractionManager.addObject(newAnt, 'ant');
          }
          // Let the selection controller know about new list
          try {
            // If a selection controller instance exists on the constructor, add the new ant into its entities list so selection logic will see it
            if (window.SelectionBoxController && window.SelectionBoxController._instance) {
              try {
                const inst = window.SelectionBoxController._instance;
                if (Array.isArray(inst._entities)) {
                  inst._entities.push(newAnt);
                }
                // keep selection controller internal lists in sync
                if (typeof inst.setEntities === 'function') inst.setEntities(inst._entities);
              } catch (e) { /* ignore */ }
            }
          } catch (e) {}
          try { if (typeof newAnt.update === 'function') newAnt.update(); } catch (e) {}
          // Track spawned test ants for cleanup and identification
          window.__test_spawned_ants = window.__test_spawned_ants || [];
          try { window.__test_spawned_ants.push(newAnt._antIndex || newAnt.antIndex || (newAnt.getAntIndex && newAnt.getAntIndex())); } catch(e) {}
          return { index: newAnt._antIndex || newAnt.antIndex || (newAnt.getAntIndex && newAnt.getAntIndex()), pos: (newAnt.getPosition && newAnt.getPosition()) || { x, y } };
        }
      }

      // Fallback: try antsSpawn
      if (typeof antsSpawn === 'function') {
        antsSpawn(1, 'player');
        // return last ant position
        const last = ants[ants.length - 1];
        return (last && last.getPosition && last.getPosition()) || { x, y };
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
      if (window.g_cameraManager && typeof window.g_cameraManager.centerOn === 'function') {
        window.g_cameraManager.centerOn(x,y);
        return true;
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

  // Clear spawned test ants from global ants array (best-effort)
  window.testHelpers.clearTestAnts = function() {
    try {
      if (!window.__test_spawned_ants || !window.__test_spawned_ants.length) return 0;
      const ids = window.__test_spawned_ants;
      if (typeof ants !== 'undefined' && Array.isArray(ants)) {
        for (let i = ants.length - 1; i >= 0; i--) {
          if (ids.indexOf(ants[i]._antIndex) !== -1) ants.splice(i,1);
        }
      }
      if (window.ants && Array.isArray(window.ants)) {
        for (let i = window.ants.length - 1; i >= 0; i--) {
          if (ids.indexOf(window.ants[i]._antIndex) !== -1) window.ants.splice(i,1);
        }
      }
      const removed = window.__test_spawned_ants.length;
      window.__test_spawned_ants = [];
      return removed;
    } catch (e) { console.error('clearTestAnts failed', e); return 0; }
  };

  // Convert world to client coordinates (uses g_cameraManager or camera globals)
  window.testHelpers.worldToScreen = function(worldX, worldY) {
    try {
      const canvas = document.getElementById('defaultCanvas0') || document.querySelector('canvas');
      const rect = canvas.getBoundingClientRect();
      if (window.g_cameraManager && typeof window.g_cameraManager.worldToScreen === 'function') {
        const s = window.g_cameraManager.worldToScreen(worldX, worldY);
        return { x: Math.round(rect.left + s.screenX), y: Math.round(rect.top + s.screenY) };
      }
      const camX = (typeof window.cameraX !== 'undefined') ? window.cameraX : (window.g_cameraManager ? window.g_cameraManager.cameraX : 0);
      const camY = (typeof window.cameraY !== 'undefined') ? window.cameraY : (window.g_cameraManager ? window.g_cameraManager.cameraY : 0);
      const camZoom = (window.g_cameraManager && typeof window.g_cameraManager.cameraZoom === 'number') ? window.g_cameraManager.cameraZoom : (window.cameraZoom || 1);
      const screenX = Math.round((worldX - camX) * camZoom);
      const screenY = Math.round((worldY - camY) * camZoom);
      return { x: Math.round(rect.left + screenX), y: Math.round(rect.top + screenY) };
    } catch (e) { return null; }
  };

  console.log('testHelpers exposed');
})();
