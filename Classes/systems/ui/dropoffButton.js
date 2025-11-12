/**
 * Dropoff placement UI
 * - Shows a "Place Dropoff" button near the bottom while GameState is PLAYING.
 * - Click button to enter placement mode; click a tile to create a DropoffLocation.
 * - Requires: Button (createMenuButton), DropoffLocation, InventoryController (optional), GameState, TILE_SIZE (or fallback).
 *
 * Usage:
 *  - call initDropoffUI() once (setup)
 *  - call updateDropoffUI() each frame (uiRender or draw loop)
 *  - call drawDropoffUI() each frame after update (uiRender or draw loop)
 */

let dropoffUI = {
  button: null,
  placing: false,
  prevMousePressed: false,
  tileSize: (typeof TILE_SIZE !== 'undefined') ? TILE_SIZE : (typeof g_tileSize !== 'undefined' ? g_tileSize : 32),
  dropoffs: (typeof dropoffs !== 'undefined') ? dropoffs : []
};

function initDropoffUI() {
  console.log("Initializing Dropoff Placement UI");
  // create button centered at bottom (will update position each frame to follow canvas size)
  dropoffUI.button = createMenuButton(0, 0, 140, 34, "Place Dropoff", 'default', () => {
    // toggle placing mode when clicked
    dropoffUI.placing = true;
    logNormal("Place Dropoff: click a tile to place, press ESC to cancel.");
  });
  
  // Register with UI Debug System if available
  if (window.g_uiDebugManager) {
    window.g_uiDebugManager.registerElement(
      'dropoff-placement-button',
      { x: 0, y: 0, width: 140, height: 34 },
      (x, y) => {
        if (dropoffUI.button && dropoffUI.button.setPosition) {
          dropoffUI.button.setPosition(x, y);
        }
      },
      {
        label: 'Dropoff Placement Button',
        isDraggable: true,
        persistKey: 'dropoffPlacementButton'
      }
    );
  }
  
  // expose for console if helpful
  window.dropoffUI = dropoffUI;
  if (!window.dropoffs) window.dropoffs = dropoffUI.dropoffs;
}

/**
 * updateDropoffUI
 * - call from your UI update loop (e.g. uiRender)
 */
function updateDropoffUI() {
  if (!dropoffUI.button) return;
  // show only while in PLAYING
  if (!(typeof GameState !== 'undefined' && GameState.isInGame && GameState.isInGame())) return;

  // keep button anchored to bottom-center
  const bx = Math.floor((width - dropoffUI.button.width) / 2);
  const by = Math.max(8, height - dropoffUI.button.height - 12);
  dropoffUI.button.setPosition(bx, by);

  // update button (tracks clicks)
  dropoffUI.button.update(mouseX, mouseY, mouseIsPressed);

  // if button was clicked, entering placing mode handled by the click handler
  // handle placement clicks when in placing mode (wait for a fresh mouse press)
  if (dropoffUI.placing) {
    // cancel with ESC
    if (keyIsDown && keyIsDown(27)) { dropoffUI.placing = false; logNormal("Place Dropoff cancelled."); }
    // detect fresh click (mouse press edge)
    if (mouseIsPressed && !dropoffUI.prevMousePressed) {
      // ignore clicks on the UI button itself
      if (!dropoffUI.button.isMouseOver(mouseX, mouseY)) {
        const ts = dropoffUI.tileSize;
        const gx = Math.floor(mouseX / ts);
        const gy = Math.floor(mouseY / ts);
        try {
          const d = new DropoffLocation(gx, gy, 1, 1, { tileSize: ts, grid: (typeof g_grid !== 'undefined' ? g_grid : null) });
          // ensure inventory controller available (DropoffLocation uses InventoryController if present)
          dropoffUI.dropoffs.push(d);
          if (typeof window.dropoffs === 'undefined') window.dropoffs = dropoffUI.dropoffs;
          logNormal(`✅ Dropoff placed at tile (${gx}, ${gy})`);
        } catch (e) {
          console.error("Failed to create DropoffLocation:", e);
        } finally {
          dropoffUI.placing = false;
        }
      }
    }
  }

  dropoffUI.prevMousePressed = !!mouseIsPressed;
}

/**
 * drawDropoffUI
 * - call from your UI draw loop after other UI so preview is visible
 */
function drawDropoffUI() {
  if (!dropoffUI.button) return;
  if (!(typeof GameState !== 'undefined' && GameState.isInGame && GameState.isInGame())) return;

  // render existing dropoffs
  if (dropoffUI.dropoffs && dropoffUI.dropoffs.length) {
    for (const d of dropoffUI.dropoffs) {
      if (d && typeof d.draw === 'function') d.draw();
    }
  }

  // draw button
  dropoffUI.button.render();

  // draw placement preview
  if (dropoffUI.placing) {
    const ts = dropoffUI.tileSize;
    const gx = Math.floor(mouseX / ts);
    const gy = Math.floor(mouseY / ts);
    push();
    noStroke();
    fill(0, 0, 255, 120);
    rect(gx * ts, gy * ts, ts, ts);
    stroke(0, 0, 200);
    strokeWeight(2);
    noFill();
    rect(gx * ts, gy * ts, ts, ts);
    fill(255);
    noStroke();
    textSize(12);
    textAlign(LEFT, TOP);
    text("Click to place dropoff (ESC to cancel)", gx * ts + 4, gy * ts + 4);
    pop();
  }
}

// expose helpers globally for easy wiring and debugging
if (typeof window !== 'undefined') {
  window.initDropoffUI = initDropoffUI;
  window.updateDropoffUI = updateDropoffUI;
  window.drawDropoffUI = drawDropoffUI;
  window.dropoffUI = dropoffUI;
}

// Inline adapter to integrate with RenderLayerManager interactive API
try {
  if (typeof RenderManager !== 'undefined' && RenderManager && typeof RenderManager.addInteractiveDrawable === 'function') {
    const dropoffAdapter = {
      hitTest: (pointer) => {
        try {
          // Use screen coords for UI elements
          const x = pointer.screen.x;
          const y = pointer.screen.y;
          if (dropoffUI && dropoffUI.button && typeof dropoffUI.button.isMouseOver === 'function') {
            return dropoffUI.button.isMouseOver(x, y);
          }
        } catch (e) {}
        return false;
      },
      onPointerDown: (pointer) => {
        try {
          const x = pointer.screen.x;
          const y = pointer.screen.y;
          if (dropoffUI && dropoffUI.button && typeof dropoffUI.button.update === 'function') {
            // Delegate to existing update which handles click edges
            dropoffUI.button.update(x, y, pointer.isPressed === true);
            // If placing mode started, consume
            if (dropoffUI.placing) return true;
          }
        } catch (e) {}
        return false;
      },
      onPointerMove: (pointer) => {
        try {
          const x = pointer.screen.x;
          const y = pointer.screen.y;
          if (dropoffUI && dropoffUI.button && typeof dropoffUI.button.update === 'function') {
            dropoffUI.button.update(x, y, pointer.isPressed === true);
          }
        } catch (e) {}
        return false;
      },
      onPointerUp: (pointer) => {
        try {
          const x = pointer.screen.x;
          const y = pointer.screen.y;
          if (dropoffUI && dropoffUI.prevMousePressed !== undefined) {
            // Let updateDropoffUI detect placement on release if needed
            // We don't consume to allow other systems to receive the event
            return false;
          }
        } catch (e) {}
        return false;
      },
      update: (pointer) => {
        try {
          // call existing per-frame updater if present
          if (typeof updateDropoffUI === 'function') updateDropoffUI();
        } catch (e) {}
      },
      render: (gameState, pointer) => {
        try {
          if (typeof drawDropoffUI === 'function') drawDropoffUI();
        } catch (e) {}
      }
    };

    RenderManager.addInteractiveDrawable(RenderManager.layers.UI_GAME, dropoffAdapter);
  }
} catch (e) {
  console.warn('dropoffButton: failed to register RenderManager adapter', e);
}