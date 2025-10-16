// /**
//  * Dropoff Placement UI - Universal Button System Integration
//  * ---------------------------------------------------------
//  * This file replaces the legacy dropoffButton.js system with
//  * Universal Button System integration while maintaining compatibility.
//  * 
//  * The functionality is now provided through the button configuration
//  * in config/button-groups/legacy-conversions.json
//  */

// let dropoffUI = {
//   // Legacy compatibility
//   button: null,
//   placing: false,
//   prevMousePressed: false,
//   tileSize: (typeof TILE_SIZE !== 'undefined') ? TILE_SIZE : (typeof g_tileSize !== 'undefined' ? g_tileSize : 32),
//   dropoffs: (typeof dropoffs !== 'undefined') ? dropoffs : [],
//   // Flag to indicate this is now handled by Universal Button System
//   usingUniversalSystem: false
// };

// /**
//  * Initialize dropoff UI - now with Universal Button System integration
//  */
// function initDropoffUI() {
//   if (typeof globalThis.logNormal === 'function') {
//     globalThis.logNormal('🔄 Initializing Dropoff UI (Universal Button System)');
//   } else {
//     console.log('🔄 Initializing Dropoff UI (Universal Button System)');
//   }
  
//   // Check if Universal Button System is available
//   if (window.buttonGroupManager && 
//       typeof window.buttonGroupManager.loadConfiguration === 'function') {
    
//     if (typeof globalThis.logVerbose === 'function') {
//       globalThis.logVerbose('✅ Dropoff UI integrated with Universal Button System');
//     } else {
//       console.log('✅ Dropoff UI integrated with Universal Button System');
//     }
//     dropoffUI.usingUniversalSystem = true;
//   } else {
//     if (typeof globalThis.logQuiet === 'function') {
//       globalThis.logQuiet('⚠️ Universal Button System not available, using legacy fallback');
//     } else {
//       console.log('⚠️ Universal Button System not available, using legacy fallback');
//     }
//     initLegacyDropoffUI();
//     dropoffUI.usingUniversalSystem = false;
//   }
  
//   // expose for console if helpful
//   if (typeof window !== 'undefined') {
//     window.dropoffUI = dropoffUI;
//     if (!window.dropoffs) window.dropoffs = dropoffUI.dropoffs;
//   }
// }

// /**
//  * Legacy fallback implementation
//  */
// function initLegacyDropoffUI() {
//   // create button centered at bottom (will update position each frame to follow canvas size)
//   dropoffUI.button = createMenuButton(0, 0, 140, 34, "Place Dropoff", 'default', () => {
//     // toggle placing mode when clicked
//     dropoffUI.placing = true;
//     console.log("Place Dropoff: click a tile to place, press ESC to cancel.");
//   });
  
//   // Register with UI Debug System if available
//   if (window.g_uiDebugManager) {
//     window.g_uiDebugManager.registerElement(
//       'dropoff-placement-button',
//       { x: 0, y: 0, width: 140, height: 34 },
//       (x, y) => {
//         if (dropoffUI.button && dropoffUI.button.setPosition) {
//           dropoffUI.button.setPosition(x, y);
//         }
//       },
//       {
//         label: 'Dropoff Placement Button',
//         isDraggable: true,
//         persistKey: 'dropoffPlacementButton'
//       }
//     );
//   }
// }

// /**
//  * Toggle dropoff placement mode - enhanced for Universal Button System
//  */
// function toggleDropoffPlacementMode() {
//   dropoffUI.placing = !dropoffUI.placing;
//   const status = dropoffUI.placing ? 'activated' : 'deactivated';
//   console.log(`🏗️ Dropoff placement mode ${status}`);
  
//   if (dropoffUI.placing) {
//     console.log("Click a tile to place dropoff, press ESC to cancel.");
//   }
// }

// /**
//  * updateDropoffUI - call from your UI update loop (e.g. uiRender)
//  */
// function updateDropoffUI() {
//   if (dropoffUI.usingUniversalSystem) {
//     // Universal Button System handles button updates automatically
//     // We just handle placement mode logic
//     handleDropoffPlacement();
//     return;
//   }
  
//   // Legacy system update
//   updateLegacyDropoffUI();
// }

// function updateLegacyDropoffUI() {
//   if (!dropoffUI.button) return;
//   // show only while in PLAYING
//   if (!(typeof GameState !== 'undefined' && GameState.isInGame && GameState.isInGame())) return;

//   // keep button anchored to bottom-center
//   const bx = Math.floor((width - dropoffUI.button.width) / 2);
//   const by = Math.max(8, height - dropoffUI.button.height - 12);
//   dropoffUI.button.setPosition(bx, by);

//   // update button (tracks clicks)
//   dropoffUI.button.update(mouseX, mouseY, mouseIsPressed);

//   // Handle placement mode
//   handleDropoffPlacement();
// }

// function handleDropoffPlacement() {
//   // if button was clicked, entering placing mode handled by the click handler
//   // handle placement clicks when in placing mode (wait for a fresh mouse press)
//   if (dropoffUI.placing) {
//     // cancel with ESC
//     if (keyIsDown && keyIsDown(27)) { 
//       dropoffUI.placing = false; 
//       console.log("Place Dropoff cancelled."); 
//     }
    
//     // detect fresh click (mouse press edge)
//     if (mouseIsPressed && !dropoffUI.prevMousePressed) {
//       // ignore clicks on the UI button itself if using legacy system
//       let clickOnButton = false;
//       if (!dropoffUI.usingUniversalSystem && dropoffUI.button && dropoffUI.button.isMouseOver) {
//         clickOnButton = dropoffUI.button.isMouseOver(mouseX, mouseY);
//       }
      
//       if (!clickOnButton) {
//         const ts = dropoffUI.tileSize;
//         const gx = Math.floor(mouseX / ts);
//         const gy = Math.floor(mouseY / ts);
//         try {
//           const d = new DropoffLocation(gx, gy, 1, 1, { 
//             tileSize: ts, 
//             grid: (typeof g_grid !== 'undefined' ? g_grid : null) 
//           });
//           // ensure inventory controller available (DropoffLocation uses InventoryController if present)
//           dropoffUI.dropoffs.push(d);
//           if (typeof window.dropoffs === 'undefined') window.dropoffs = dropoffUI.dropoffs;
//           console.log(`✅ Dropoff placed at tile (${gx}, ${gy})`);
//         } catch (e) {
//           console.error("Failed to create DropoffLocation:", e);
//         } finally {
//           dropoffUI.placing = false;
//         }
//       }
//     }
//   }

//   dropoffUI.prevMousePressed = !!mouseIsPressed;
// }

// /**
//  * drawDropoffUI - call from your UI draw loop after other UI so preview is visible
//  */
// function drawDropoffUI() {
//   // Render existing dropoffs
//   if (dropoffUI.dropoffs && dropoffUI.dropoffs.length) {
//     for (const d of dropoffUI.dropoffs) {
//       if (d && typeof d.draw === 'function') d.draw();
//     }
//   }

//   if (dropoffUI.usingUniversalSystem) {
//     // Universal Button System handles button rendering automatically
//     // We just handle placement preview
//     drawDropoffPlacementPreview();
//     return;
//   }
  
//   // Legacy system render
//   drawLegacyDropoffUI();
// }

// function drawLegacyDropoffUI() {
//   if (!dropoffUI.button) return;
//   if (!(typeof GameState !== 'undefined' && GameState.isInGame && GameState.isInGame())) return;

//   // draw button
//   dropoffUI.button.render();

//   // draw placement preview
//   drawDropoffPlacementPreview();
// }

// function drawDropoffPlacementPreview() {
//   if (dropoffUI.placing) {
//     const ts = dropoffUI.tileSize;
//     const gx = Math.floor(mouseX / ts);
//     const gy = Math.floor(mouseY / ts);
//     push();
//     noStroke();
//     fill(0, 0, 255, 120);
//     rect(gx * ts, gy * ts, ts, ts);
//     stroke(0, 0, 200);
//     strokeWeight(2);
//     noFill();
//     rect(gx * ts, gy * ts, ts, ts);
//     fill(255);
//     noStroke();
//     textSize(12);
//     textAlign(LEFT, TOP);
//     text("Click to place dropoff (ESC to cancel)", gx * ts + 4, gy * ts + 4);
//     pop();
//   }
// }

// /**
//  * Check if in placement mode
//  */
// function isDropoffPlacementActive() {
//   return dropoffUI.placing;
// }

// /**
//  * Cancel placement mode
//  */
// function cancelDropoffPlacement() {
//   dropoffUI.placing = false;
//   console.log("🚫 Dropoff placement cancelled");
// }

// /**
//  * Get all placed dropoffs
//  */
// function getDropoffs() {
//   return dropoffUI.dropoffs;
// }

// /**
//  * Add a dropoff programmatically
//  */
// function addDropoff(x, y, options = {}) {
//   try {
//     const ts = options.tileSize || dropoffUI.tileSize;
//     const d = new DropoffLocation(x, y, 1, 1, { 
//       tileSize: ts, 
//       grid: options.grid || (typeof g_grid !== 'undefined' ? g_grid : null) 
//     });
//     dropoffUI.dropoffs.push(d);
//     console.log(`✅ Dropoff added programmatically at (${x}, ${y})`);
//     return d;
//   } catch (error) {
//     console.error("Failed to add dropoff:", error);
//     return null;
//   }
// }

// // expose helpers globally for easy wiring and debugging
// if (typeof window !== 'undefined') {
//   window.initDropoffUI = initDropoffUI;
//   window.updateDropoffUI = updateDropoffUI;
//   window.drawDropoffUI = drawDropoffUI;
//   window.dropoffUI = dropoffUI;
//   window.toggleDropoffPlacementMode = toggleDropoffPlacementMode;
//   window.isDropoffPlacementActive = isDropoffPlacementActive;
//   window.cancelDropoffPlacement = cancelDropoffPlacement;
//   window.getDropoffs = getDropoffs;
//   window.addDropoff = addDropoff;
// }

// // Auto-initialize when loaded
// if (typeof window !== 'undefined') {
//   if (document.readyState === 'loading') {
//     document.addEventListener('DOMContentLoaded', initDropoffUI);
//   } else {
//     // Try to initialize immediately, or defer if dependencies aren't ready
//     setTimeout(initDropoffUI, 100);
//   }
// }