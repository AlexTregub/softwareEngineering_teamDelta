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

      if (typeof antsSpawn === 'function' || typeof ant === 'function') {
        // Create one ant at a predictable position by using the ant constructor directly and pushing into ants array
        if (typeof ant === 'function') {
          const newAnt = new ant(x, y, (antSize && antSize.x) || 20, (antSize && antSize.y) || 20, 30, 0, antBaseSprite, 'Scout', 'player');
          if (typeof newAnt.assignJob === 'function') newAnt.assignJob('Scout', JobImages && JobImages.Scout);
          try {
            if (typeof ants !== 'undefined' && Array.isArray(ants)) ants.push(newAnt);
            else if (window.ants && Array.isArray(window.ants)) window.ants.push(newAnt);
            else { window.ants = window.ants || []; window.ants.push(newAnt); }
          } catch (e) {
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
          const idx = newAnt._antIndex || newAnt.antIndex || (newAnt.getAntIndex && newAnt.getAntIndex()) || (window.ants ? window.ants.indexOf(newAnt) : null);
          try { window.__test_spawned_ants.push(idx); } catch(e) {}
          return { index: idx, pos: (newAnt.getPosition && newAnt.getPosition()) || { x, y } };
        }
      }

      // Fallback: try antsSpawn
      if (typeof antsSpawn === 'function') {
        antsSpawn(1, 'player');
        // return last ant position and index
        const last = (window.ants && window.ants.length) ? window.ants[window.ants.length - 1] : (typeof ants !== 'undefined' && ants.length ? ants[ants.length-1] : null);
        const idx = last ? (last._antIndex || last.antIndex || (last.getAntIndex && last.getAntIndex()) || (window.ants ? window.ants.indexOf(last) : null)) : null;
        try { window.__test_spawned_ants = window.__test_spawned_ants || []; if (idx!==null) window.__test_spawned_ants.push(idx); } catch(e) {}
        return (last && last.getPosition && last.getPosition()) ? { index: idx, pos: last.getPosition() } : { index: idx, pos: { x, y } };
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
      // Normalize faction
      const fac = faction || 'player';
      // Prefer an Ant subclass factory if available (e.g., QueenAnt)
      let newAnt = null;
      if (type && typeof type === 'string' && type.toLowerCase().includes('queen') && typeof window.spawnQueen === 'function') {
        newAnt = window.spawnQueen();
      } else if (typeof window.ant === 'function') {
        // Create a regular ant and mark job/type accordingly
        newAnt = new window.ant(x, y, (antSize && antSize.x) || 20, (antSize && antSize.y) || 20, 30, 0, antBaseSprite, type || 'Scout', fac);
        if (typeof newAnt.assignJob === 'function') newAnt.assignJob(type || 'Scout', (JobImages && JobImages[type]) || null);
      }

      if (!newAnt) return null;

      // Ensure ants array exists
      if (typeof ants === 'undefined') window.ants = window.ants || [];
      if (Array.isArray(ants) && ants.indexOf(newAnt) === -1) ants.push(newAnt);
      if (Array.isArray(window.ants) && window.ants.indexOf(newAnt) === -1) window.ants.push(newAnt);

      // Register with tile interaction manager if present
      try { if (window.g_tileInteractionManager && typeof g_tileInteractionManager.addObject === 'function') g_tileInteractionManager.addObject(newAnt, 'ant'); } catch(e){}

      // Keep selection controller in sync
      try {
        const inst = (window.SelectionBoxController && window.SelectionBoxController._instance) ? window.SelectionBoxController._instance : (window.g_selectionBoxController || null);
        if (inst && Array.isArray(inst._entities) && inst._entities.indexOf(newAnt) === -1) {
          inst._entities.push(newAnt);
          if (typeof inst.setEntities === 'function') inst.setEntities(inst._entities);
        }
      } catch (e) {}

      // Track for cleanup
      window.__test_spawned_ants = window.__test_spawned_ants || [];
      // Ensure a stable index value exists. Some game code assigns _antIndex asynchronously; prefer explicit assignment
      let idx = (newAnt && (newAnt._antIndex || newAnt.antIndex)) || (newAnt && newAnt.getAntIndex && newAnt.getAntIndex());
      try {
        const arrIndex = (Array.isArray(window.ants) ? window.ants.indexOf(newAnt) : -1);
        if ((idx === null || typeof idx === 'undefined' || idx === false) && arrIndex !== -1) idx = arrIndex;
        if ((idx === null || typeof idx === 'undefined' || idx === false) && Array.isArray(window.ants)) idx = window.ants.length - 1;
        // set the _antIndex on the ant object if missing so lookups are consistent
        try { if (newAnt && (typeof newAnt._antIndex === 'undefined' || newAnt._antIndex === null)) newAnt._antIndex = idx; } catch (e) {}
      } catch (e) { idx = idx || null; }
      try { window.__test_spawned_ants.push(idx); } catch(e){}

      // Try to trigger a fresh update so state machine initializes
      try { if (typeof newAnt.update === 'function') newAnt.update(); } catch (e) {}

      return idx;
    } catch (e) { console.error('spawnAntType failed', e); return null; }
  };

  // Force combat between two ants by setting each as the other's target and toggling combat flags.
  // This exists only for deterministic tests and does not replace game AI.
  window.testHelpers.forceCombat = function(attackerIdx, defenderIdx) {
    try {
      const findByIdx = (i) => {
        // First attempt: find by ant._antIndex or ant.antIndex
        try {
          if (typeof ants !== 'undefined' && Array.isArray(ants)) {
            const found = ants.find(a => a && (a._antIndex === i || a.antIndex === i));
            if (found) return found;
          }
        } catch (e) {}
        try {
          if (typeof window.ants !== 'undefined' && Array.isArray(window.ants)) {
            const found = window.ants.find(a => a && (a._antIndex === i || a.antIndex === i));
            if (found) return found;
          }
        } catch (e) {}
        // Fallback: allow caller to pass the array index directly
        try {
          if (Array.isArray(window.ants) && Number.isInteger(i) && i >= 0 && i < window.ants.length) return window.ants[i];
          if (typeof ants !== 'undefined' && Array.isArray(ants) && Number.isInteger(i) && i >= 0 && i < ants.length) return ants[i];
        } catch (e) {}
        return null;
      };
      const a = findByIdx(attackerIdx);
      const b = findByIdx(defenderIdx);
      if (!a || !b) return false;

      // Set each as the other's target and flip combat state if state machine is present
      try {
        if (a._stateMachine && typeof a._stateMachine.setCombatModifier === 'function') a._stateMachine.setCombatModifier('IN_COMBAT');
        if (b._stateMachine && typeof b._stateMachine.setCombatModifier === 'function') b._stateMachine.setCombatModifier('IN_COMBAT');
      } catch (e) {}
      try { a.target = b; b.target = a; } catch (e) {}
      try { a.isInCombat = true; b.isInCombat = true; } catch (e) {}

      // If there is a CombatController, notify it as well
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
