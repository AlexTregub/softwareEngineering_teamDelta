/**
 * Selection Box Render Debugging
 * Add visual debugging to see what's happening with the selection box
 */

function debugSelectionBoxRender() {
  console.log('🎨 SELECTION BOX RENDER DEBUG');
  console.log('============================\n');
  
  if (typeof window.EffectsRenderer === 'undefined') {
    console.log('❌ EffectsRenderer not available');
    return;
  }
  
  const renderer = window.EffectsRenderer;
  
  // Override renderSelectionBox to add debug logging
  const originalRenderSelectionBox = renderer.renderSelectionBox.bind(renderer);
  
  renderer.renderSelectionBox = function() {
    const selectionBox = this.selectionBox;
    
    console.log('🎨 renderSelectionBox called:', {
      active: selectionBox.active,
      startX: selectionBox.startX,
      startY: selectionBox.startY,
      endX: selectionBox.endX,
      endY: selectionBox.endY
    });
    
    if (selectionBox.active) {
      console.log('🎯 Selection box is ACTIVE - should be visible');
      
      const bounds = this.getSelectionBoxBounds();
      if (bounds) {
        console.log('📐 Bounds:', bounds);
        
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
        console.log('❌ No bounds calculated');
      }
    } else {
      console.log('💤 Selection box is INACTIVE');
    }
    
    // Call original method
    return originalRenderSelectionBox();
  };
  
  console.log('✅ Debug render override installed');
  console.log('💡 Now try creating a selection - you should see magenta debug rectangles');
}

function persistentSelectionTest() {
  console.log('⏱️ PERSISTENT SELECTION TEST');
  console.log('===========================\n');
  
  if (typeof window.EffectsRenderer === 'undefined') {
    console.log('❌ EffectsRenderer not available');
    return;
  }
  
  console.log('📍 Creating persistent selection box...');
  
  // Create a selection box that stays active
  window.EffectsRenderer.startSelectionBox(50, 50, {
    color: [255, 255, 0], // Yellow
    strokeWidth: 4,
    fillAlpha: 60
  });
  
  window.EffectsRenderer.updateSelectionBox(200, 200);
  
  console.log('✅ Persistent selection box created');
  console.log('🎯 This box should stay visible until you call: window.EffectsRenderer.endSelectionBox()');
  console.log('📊 Selection state:', window.EffectsRenderer.selectionBox);
  
  // Don't end it automatically - let it persist
  console.log('⚠️ Selection box will stay active - manually end with: window.EffectsRenderer.endSelectionBox()');
}

function fixSelectionTiming() {
  console.log('⏱️ FIXING SELECTION TIMING');
  console.log('==========================\n');
  
  if (typeof g_uiSelectionController === 'undefined') {
    console.log('❌ UISelectionController not available');
    return;
  }
  
  // Reduce drag threshold to make selection easier
  g_uiSelectionController.dragThreshold = 2; // Reduced from 5
  console.log('✅ Drag threshold reduced to 2 pixels');
  
  // Override the mouse release handler to add delay
  const controller = g_uiSelectionController;
  const originalHandleMouseReleased = controller.handleMouseReleased.bind(controller);
  
  controller.handleMouseReleased = function(x, y, button) {
    console.log('🖱️ Mouse released - delaying selection end...');
    
    if (this.isSelecting) {
      // Add a 2-second delay before ending selection
      console.log('⏱️ Selection will end in 2 seconds...');
      setTimeout(() => {
        console.log('🔚 Ending selection now');
        originalHandleMouseReleased.call(this, x, y, button);
      }, 2000);
    } else {
      originalHandleMouseReleased.call(this, x, y, button);
    }
  };
  
  console.log('✅ Selection timing fixed - selections will last 2 seconds');
  console.log('💡 Try clicking and dragging now');
}

function forceVisibleSelection() {
  console.log('💪 FORCE VISIBLE SELECTION');
  console.log('==========================\n');
  
  // Combine all fixes
  debugSelectionBoxRender();
  fixSelectionTiming();
  
  // Also create a persistent test
  setTimeout(() => {
    persistentSelectionTest();
  }, 1000);
  
  console.log('✅ All selection visibility fixes applied');
  console.log('💡 Try clicking and dragging - you should now see:');
  console.log('   1. Magenta debug rectangles');
  console.log('   2. Yellow persistent test selection');
  console.log('   3. Delayed selection ending (2 seconds)');
}

// Make functions available globally
if (typeof window !== 'undefined') {
  window.debugSelectionBoxRender = debugSelectionBoxRender;
  window.persistentSelectionTest = persistentSelectionTest;
  window.fixSelectionTiming = fixSelectionTiming;
  window.forceVisibleSelection = forceVisibleSelection;
}