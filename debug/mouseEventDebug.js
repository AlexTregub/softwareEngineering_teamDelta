/**
 * Mouse Event Flow Debugging
 * Debug why manual mouse events aren't reaching the selection system
 */

function debugMouseEventFlow() {
  console.log('🖱️ DEBUGGING MOUSE EVENT FLOW');
  console.log('==============================\n');
  
  // Check if p5.js mouse events are working
  console.log('Step 1: Testing p5.js mouse event integration...');
  
  // Override p5.js mouse handlers to see if they're being called
  const originalMousePressed = window.mousePressed;
  const originalMouseDragged = window.mouseDragged;
  const originalMouseReleased = window.mouseReleased;
  
  window.mousePressed = function() {
    console.log('🖱️ p5.js mousePressed() called at:', mouseX, mouseY, 'button:', mouseButton);
    
    if (typeof originalMousePressed === 'function') {
      return originalMousePressed();
    }
  };
  
  window.mouseDragged = function() {
    console.log('🖱️ p5.js mouseDragged() called at:', mouseX, mouseY);
    
    if (typeof originalMouseDragged === 'function') {
      return originalMouseDragged();
    }
  };
  
  window.mouseReleased = function() {
    console.log('🖱️ p5.js mouseReleased() called at:', mouseX, mouseY, 'button:', mouseButton);
    
    if (typeof originalMouseReleased === 'function') {
      return originalMouseReleased();
    }
  };
  
  console.log('✅ p5.js mouse event overrides installed');
  console.log('💡 Try clicking - you should see mouse event logs');
  
  // Also check if MouseInputController is getting events
  if (typeof g_mouseController !== 'undefined' && g_mouseController) {
    console.log('\nStep 2: Testing MouseInputController...');
    
    const controller = g_mouseController;
    const originalHandleMousePressed = controller.handleMousePressed.bind(controller);
    const originalHandleMouseDragged = controller.handleMouseDragged.bind(controller);
    const originalHandleMouseReleased = controller.handleMouseReleased.bind(controller);
    
    controller.handleMousePressed = function(x, y, button) {
      console.log('🎛️ MouseInputController.handleMousePressed:', x, y, button);
      console.log('📊 Handler counts before:', {
        click: this.clickHandlers.length,
        drag: this.dragHandlers.length,
        release: this.releaseHandlers.length
      });
      return originalHandleMousePressed(x, y, button);
    };
    
    controller.handleMouseDragged = function(x, y) {
      console.log('🎛️ MouseInputController.handleMouseDragged:', x, y);
      return originalHandleMouseDragged(x, y);
    };
    
    controller.handleMouseReleased = function(x, y, button) {
      console.log('🎛️ MouseInputController.handleMouseReleased:', x, y, button);
      return originalHandleMouseReleased(x, y, button);
    };
    
    console.log('✅ MouseInputController debugging enabled');
  }
  
  // Check if UISelectionController handlers are registered
  if (typeof g_uiSelectionController !== 'undefined' && g_uiSelectionController) {
    console.log('\nStep 3: Checking UISelectionController registration...');
    
    const controller = g_uiSelectionController;
    console.log('Mouse controller reference:', controller.mouseController === g_mouseController ? 'CORRECT ✅' : 'WRONG ❌');
    
    if (controller.mouseController) {
      console.log('Mouse handler counts:', {
        click: controller.mouseController.clickHandlers.length,
        drag: controller.mouseController.dragHandlers.length,
        release: controller.mouseController.releaseHandlers.length
      });
    }
  }
  
  // Restore original handlers after 30 seconds
  setTimeout(() => {
    window.mousePressed = originalMousePressed;
    window.mouseDragged = originalMouseDragged;
    window.mouseReleased = originalMouseReleased;
    console.log('🔄 Original mouse handlers restored');
  }, 30000);
  
  console.log('\n🧪 Mouse event debugging active for 30 seconds');
  console.log('💡 Click and drag to see the event flow');
}

function bypassEventSystemTest() {
  console.log('🚀 BYPASS EVENT SYSTEM TEST');
  console.log('===========================\n');
  
  // Directly connect p5.js events to selection system
  const originalMousePressed = window.mousePressed;
  const originalMouseDragged = window.mouseDragged;
  const originalMouseReleased = window.mouseReleased;
  
  let isDragging = false;
  let dragStart = null;
  
  window.mousePressed = function() {
    console.log('🚀 BYPASS: Mouse pressed at:', mouseX, mouseY);
    
    // Call original handler first
    if (typeof originalMousePressed === 'function') {
      originalMousePressed();
    }
    
    // Directly call UISelectionController
    if (typeof g_uiSelectionController !== 'undefined' && g_uiSelectionController) {
      dragStart = { x: mouseX, y: mouseY };
      isDragging = false;
      
      // Force start selection
      console.log('🚀 BYPASS: Starting selection directly...');
      g_uiSelectionController.handleMousePressed(mouseX, mouseY, mouseButton || 0);
    }
  };
  
  window.mouseDragged = function() {
    // Call original handler first  
    if (typeof originalMouseDragged === 'function') {
      originalMouseDragged();
    }
    
    if (dragStart && typeof g_uiSelectionController !== 'undefined' && g_uiSelectionController) {
      const dragDistance = Math.sqrt(
        Math.pow(mouseX - dragStart.x, 2) + 
        Math.pow(mouseY - dragStart.y, 2)
      );
      
      if (!isDragging && dragDistance >= 5) {
        console.log('🚀 BYPASS: Drag threshold exceeded, starting selection...');
        isDragging = true;
        
        // Force start selection in effects renderer
        if (typeof window.EffectsRenderer !== 'undefined') {
          window.EffectsRenderer.startSelectionBox(dragStart.x, dragStart.y, {
            color: [0, 255, 255],
            strokeWidth: 3,
            fillAlpha: 60
          });
        }
      }
      
      if (isDragging) {
        console.log('🚀 BYPASS: Updating selection to:', mouseX, mouseY);
        
        // Force update selection
        if (typeof window.EffectsRenderer !== 'undefined') {
          window.EffectsRenderer.updateSelectionBox(mouseX, mouseY);
        }
        
        g_uiSelectionController.handleMouseDrag(mouseX, mouseY, 0, 0);
      }
    }
  };
  
  window.mouseReleased = function() {
    console.log('🚀 BYPASS: Mouse released at:', mouseX, mouseY);
    
    // Call original handler first
    if (typeof originalMouseReleased === 'function') {
      originalMouseReleased();
    }
    
    if (typeof g_uiSelectionController !== 'undefined' && g_uiSelectionController) {
      if (isDragging) {
        console.log('🚀 BYPASS: Ending selection...');
        
        // Add delay to see the selection box
        setTimeout(() => {
          if (typeof window.EffectsRenderer !== 'undefined') {
            window.EffectsRenderer.endSelectionBox();
          }
          g_uiSelectionController.handleMouseReleased(mouseX, mouseY, mouseButton || 0);
        }, 1000);
      } else {
        g_uiSelectionController.handleMouseReleased(mouseX, mouseY, mouseButton || 0);
      }
      
      isDragging = false;
      dragStart = null;
    }
  };
  
  console.log('🚀 Bypass event system activated');
  console.log('💡 Try clicking and dragging - this bypasses the normal event chain');
  
  // Restore after 60 seconds
  setTimeout(() => {
    window.mousePressed = originalMousePressed;
    window.mouseDragged = originalMouseDragged;
    window.mouseReleased = originalMouseReleased;
    console.log('🔄 Bypass system deactivated');
  }, 60000);
}

function quickMouseTest() {
  console.log('⚡ QUICK MOUSE TEST');
  console.log('==================\n');
  
  // Test if we can manually trigger the selection
  console.log('🧪 Manually triggering selection...');
  
  if (typeof window.EffectsRenderer !== 'undefined') {
    // Create a selection that follows the mouse
    let testActive = true;
    
    const updateSelection = () => {
      if (testActive && typeof mouseX !== 'undefined' && typeof mouseY !== 'undefined') {
        window.EffectsRenderer.startSelectionBox(100, 100);
        window.EffectsRenderer.updateSelectionBox(mouseX, mouseY);
        console.log('🎯 Test selection updated to mouse position:', mouseX, mouseY);
      }
    };
    
    // Update every frame for 10 seconds
    const interval = setInterval(updateSelection, 100);
    
    setTimeout(() => {
      clearInterval(interval);
      testActive = false;
      window.EffectsRenderer.endSelectionBox();
      console.log('🔚 Quick mouse test ended');
    }, 10000);
    
    console.log('✅ Test selection will follow your mouse for 10 seconds');
  }
}

// Make functions available globally
if (typeof window !== 'undefined') {
  window.debugMouseEventFlow = debugMouseEventFlow;
  window.bypassEventSystemTest = bypassEventSystemTest;
  window.quickMouseTest = quickMouseTest;
}