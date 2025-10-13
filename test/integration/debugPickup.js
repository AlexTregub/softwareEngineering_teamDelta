// Temporary debug helper to spawn an ant and a resource near each other and observe pickup
(function(){
  console.log('[debugPickup] helper loaded');

  // Wait for global constructors to be available
  function waitFor(fn, cb, timeout = 2000) {
    const start = Date.now();
    (function poll(){
      if (fn()) return cb();
      if (Date.now() - start > timeout) return console.warn('[debugPickup] timeout waiting for', fn.toString());
      setTimeout(poll, 50);
    })();
  }

  waitFor(() => typeof Ant !== 'undefined' && typeof Resource !== 'undefined' && typeof g_resourceList !== 'undefined', () => {
    console.log('[debugPickup] environment ready');

    // Create a mock ant near the middle
    try {
      // Use any existing spawn function if present
      if (typeof spawnAnt === 'function') {
        spawnAnt(1);
      } else if (typeof Ant === 'function' && typeof antIndex !== 'undefined') {
        // Create an ant via Ant class if available
        const a = new Ant(200, 200);
        if (typeof ants !== 'undefined') ants.push(a);
      }

      // create a resource near the ant
      const res = new Resource(205, 205, 16, 16, 'leaf');
      if (g_resourceList && typeof g_resourceList.getResourceList === 'function') {
        g_resourceList.getResourceList().push(res);
      } else if (typeof resources !== 'undefined') {
        resources.push(res);
      }

      console.log('[debugPickup] spawned ant and resource; watch console for pickup behavior');

      // Monitor for resource being picked up and send a beacon to the server
      const checkInterval = setInterval(() => {
        if (res.pickedBy) {
          console.log('[debugPickup] resource picked by', res.pickedBy);
          try {
            fetch('/__test_report?d=' + encodeURIComponent(JSON.stringify({ pickup: true }))).catch(()=>{});
          } catch(e) {}
          clearInterval(checkInterval);
        }
      }, 100);

      // After 6 seconds, stop monitoring
      setTimeout(() => {
        clearInterval(checkInterval);
        console.log('[debugPickup] debug finished');
      }, 6000);

    } catch (e) {
      console.error('[debugPickup] error', e);
    }
  });
})();
