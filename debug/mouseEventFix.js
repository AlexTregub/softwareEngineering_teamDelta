/**
 * Direct Mouse Event Fix
 * Bypass the broken event chain and connect mouse events directly
 */

function fixMouseEventChain() {
  console.log('🔧 FIXING MOUSE EVENT CHAIN');
  console.log('============================\n');
  
  if (typeof g_uiSelectionController === 'undefined' || !g_uiSelectionController) {
    console.error('❌ UISelectionController not available');
    return;
  }
  
  // Override p5.js mouse events to ensure they reach the selection controller
  const controller = g_uiSelectionController;
  let manualDragStart = null;
  let manualIsSelecting = false;
  
  // Store original handlers
  const originalMousePressed = window.mousePressed;
  const originalMouseDragged = window.mouseDragged;
  const originalMouseReleased = window.mouseReleased;
  
  // New mouse pressed handler
  window.mousePressed = function() {
    console.log('🔧 FIX: mousePressed at', mouseX, mouseY, 'button:', mouseButton);
    
    // Call original handler
    if (typeof originalMousePressed === 'function') {
      try {
        originalMousePressed();
      } catch (e) {
        console.warn('Original mousePressed error:', e);
      }
    }
    
    // Force set drag start position
    manualDragStart = { x: mouseX, y: mouseY };
    manualIsSelecting = false;
    
    // Also call the controller directly
    controller.handleMousePressed(mouseX, mouseY, mouseButton || 0);
    
    console.log('🔧 FIX: Drag start set to', manualDragStart);
  };
  
  // New mouse dragged handler
  window.mouseDragged = function() {
    console.log('🔧 FIX: mouseDragged at', mouseX, mouseY);
    
    // Call original handler
    if (typeof originalMouseDragged === 'function') {
      try {
        originalMouseDragged();
      } catch (e) {
        console.warn('Original mouseDragged error:', e);
      }
    }
    
    if (manualDragStart) {
      const dx = mouseX - manualDragStart.x;
      const dy = mouseY - manualDragStart.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      console.log('🔧 FIX: Distance from start:', distance, 'threshold:', controller.dragThreshold);
      
      if (!manualIsSelecting && distance >= controller.dragThreshold) {
        console.log('🔧 FIX: Starting selection manually...');
        manualIsSelecting = true;
        
        // Force start selection
        controller.startSelection(manualDragStart.x, manualDragStart.y);
      }
      
      if (manualIsSelecting) {
        console.log('🔧 FIX: Updating selection to', mouseX, mouseY);
        controller.updateSelection(mouseX, mouseY);
      }
      
      // Also call the normal drag handler
      controller.handleMouseDrag(mouseX, mouseY, dx, dy);
    }
  };
  
  // New mouse released handler
  window.mouseReleased = function() {
    console.log('🔧 FIX: mouseReleased at', mouseX, mouseY, 'button:', mouseButton);
    
    // Call original handler
    if (typeof originalMouseReleased === 'function') {
      try {
        originalMouseReleased();
      } catch (e) {
        console.warn('Original mouseReleased error:', e);
      }
    }
    
    if (manualIsSelecting) {
      console.log('🔧 FIX: Ending selection...');
      
      // Add a delay so we can see the selection box
      setTimeout(() => {
        controller.endSelection(mouseX, mouseY);
        manualIsSelecting = false;
        manualDragStart = null;
      }, 1000);
    } else {
      // Just call the normal release handler
      controller.handleMouseReleased(mouseX, mouseY, mouseButton || 0);
      manualDragStart = null;
    }
  };
  
  console.log('✅ Mouse event chain fixed');
  console.log('💡 Try clicking and dragging now - should work properly');
  console.log('🔄 Refresh page to restore original behavior');
  
  // Return restore function
  return function restore() {
    window.mousePressed = originalMousePressed;
    window.mouseDragged = originalMouseDragged;
    window.mouseReleased = originalMouseReleased;
    console.log('🔄 Original mouse handlers restored');
  };
}

function testMousePressOnly() {
  console.log('🖱️ TESTING MOUSE PRESS DETECTION');
  console.log('=================================\n');
  
  const originalMousePressed = window.mousePressed;
  
  window.mousePressed = function() {
    console.log('✅ Mouse press detected at:', mouseX, mouseY, 'button:', mouseButton);
    
    if (typeof originalMousePressed === 'function') {
      originalMousePressed();
    }
  };
  
  console.log('💡 Click anywhere to test mouse press detection');
  console.log('🔄 Refresh to restore normal behavior');
}

// Make functions available globally
if (typeof window !== 'undefined') {
  window.fixMouseEventChain = fixMouseEventChain;
  window.testMousePressOnly = testMousePressOnly;
}