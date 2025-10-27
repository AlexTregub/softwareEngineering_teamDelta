/**
 * Selection Box Render Debugging
 * Add visual debugging to see what's happening with the selection box
 */

function debugSelectionBoxRender() {
  logNormal('🎨 SELECTION BOX RENDER DEBUG');
  logNormal('============================\n');
  
  if (typeof window.EffectsRenderer === 'undefined') {
    logNormal('❌ EffectsRenderer not available');
    return;
  }
  
  const renderer = window.EffectsRenderer;
  
  // Override renderSelectionBox to add debug logging
  const originalRenderSelectionBox = renderer.renderSelectionBox.bind(renderer);
  
  renderer.renderSelectionBox = function() {
    const selectionBox = this.selectionBox;
    
    logNormal('🎨 renderSelectionBox called:', {
      active: selectionBox.active,
      startX: selectionBox.startX,
      startY: selectionBox.startY,
      endX: selectionBox.endX,
      endY: selectionBox.endY
    });
    
    if (selectionBox.active) {
      logNormal('🎯 Selection box is ACTIVE - should be visible');
      
      const bounds = this.getSelectionBoxBounds();
      if (bounds) {
        logNormal('📐 Bounds:', bounds);
        
        // Force render a visible test rectangle
        push();
        stroke(255, 0, 255); // Magenta for debugging
        strokeWeight(5);
        noFill();
        rect(bounds.x1, bounds.y1, bounds.width, bounds.height);
        pop();
        
        // Add text label
        push();
        fill(255, 0, 255);
        textAlign(CENTER, CENTER);
        text('SELECTION DEBUG', bounds.x1 + bounds.width/2, bounds.y1 + bounds.height/2);
        pop();
      } else {
        logNormal('❌ No bounds calculated');
      }
    } else {
      logNormal('💤 Selection box is INACTIVE');
    }
    
    // Call original method
    return originalRenderSelectionBox();
  };
  
  logNormal('✅ Debug render override installed');
  logNormal('💡 Now try creating a selection - you should see magenta debug rectangles');
}

function persistentSelectionTest() {
  logNormal('⏱️ PERSISTENT SELECTION TEST');
  logNormal('===========================\n');
  
  if (typeof window.EffectsRenderer === 'undefined') {
    logNormal('❌ EffectsRenderer not available');
    return;
  }
  
  logNormal('📍 Creating persistent selection box...');
  
  // Create a selection box that stays active
  window.EffectsRenderer.startSelectionBox(50, 50, {
    color: [255, 255, 0], // Yellow
    strokeWidth: 4,
    fillAlpha: 60
  });
  
  window.EffectsRenderer.updateSelectionBox(200, 200);
  
  logNormal('✅ Persistent selection box created');
  logNormal('🎯 This box should stay visible until you call: window.EffectsRenderer.endSelectionBox()');
  logNormal('📊 Selection state:', window.EffectsRenderer.selectionBox);
  
  // Don't end it automatically - let it persist
  logNormal('⚠️ Selection box will stay active - manually end with: window.EffectsRenderer.endSelectionBox()');
}

function fixSelectionTiming() {
  logNormal('⏱️ FIXING SELECTION TIMING');
  logNormal('==========================\n');
  
  if (typeof g_uiSelectionController === 'undefined') {
    logNormal('❌ UISelectionController not available');
    return;
  }
  
  // Reduce drag threshold to make selection easier
  g_uiSelectionController.dragThreshold = 2; // Reduced from 5
  logNormal('✅ Drag threshold reduced to 2 pixels');
  
  // Override the mouse release handler to add delay
  const controller = g_uiSelectionController;
  const originalHandleMouseReleased = controller.handleMouseReleased.bind(controller);
  
  controller.handleMouseReleased = function(x, y, button) {
    logNormal('🖱️ Mouse released - delaying selection end...');
    
    if (this.isSelecting) {
      // Add a 2-second delay before ending selection
      logNormal('⏱️ Selection will end in 2 seconds...');
      setTimeout(() => {
        logNormal('🔚 Ending selection now');
        originalHandleMouseReleased.call(this, x, y, button);
      }, 2000);
    } else {
      originalHandleMouseReleased.call(this, x, y, button);
    }
  };
  
  logNormal('✅ Selection timing fixed - selections will last 2 seconds');
  logNormal('💡 Try clicking and dragging now');
}

function forceVisibleSelection() {
  logNormal('💪 FORCE VISIBLE SELECTION');
  logNormal('==========================\n');
  
  // Combine all fixes
  debugSelectionBoxRender();
  fixSelectionTiming();
  
  // Also create a persistent test
  setTimeout(() => {
    persistentSelectionTest();
  }, 1000);
  
  logNormal('✅ All selection visibility fixes applied');
  logNormal('💡 Try clicking and dragging - you should now see:');
  logNormal('   1. Magenta debug rectangles');
  logNormal('   2. Yellow persistent test selection');
  logNormal('   3. Delayed selection ending (2 seconds)');
}

// Make functions available globally
if (typeof window !== 'undefined') {
  window.debugSelectionBoxRender = debugSelectionBoxRender;
  window.persistentSelectionTest = persistentSelectionTest;
  window.fixSelectionTiming = fixSelectionTiming;
  window.forceVisibleSelection = forceVisibleSelection;
}