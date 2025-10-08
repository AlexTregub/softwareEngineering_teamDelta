/**
 * Mouse Handler Priority Fix
 * Fix the mouse event handler order so UISelectionController gets events
 */

function fixMouseHandlerPriority() {
  console.log('🔧 FIXING MOUSE HANDLER PRIORITY');
  console.log('=================================\n');
  
  if (typeof g_mouseController === 'undefined' || !g_mouseController) {
    console.error('❌ MouseController not available');
    return;
  }
  
  console.log('📊 Current handler order:');
  console.log('Click handlers:', g_mouseController.clickHandlers.map(h => h.name || 'anonymous'));
  console.log('Drag handlers:', g_mouseController.dragHandlers.map(h => h.name || 'anonymous'));
  console.log('Release handlers:', g_mouseController.releaseHandlers.map(h => h.name || 'anonymous'));
  
  // Find and remove the old SelectionBoxController handlers
  const removeOldSelectionHandlers = () => {
    // Remove click handlers
    g_mouseController.clickHandlers = g_mouseController.clickHandlers.filter(handler => {
      const isOldSelection = handler.name === 'SelectionBoxController' || 
                            handler.toString().includes('SelectionBoxController');
      if (isOldSelection) {
        console.log('🗑️ Removed old SelectionBoxController click handler');
      }
      return !isOldSelection;
    });
    
    // Remove drag handlers
    g_mouseController.dragHandlers = g_mouseController.dragHandlers.filter(handler => {
      const isOldSelection = handler.name === 'SelectionBoxController' || 
                            handler.toString().includes('SelectionBoxController');
      if (isOldSelection) {
        console.log('🗑️ Removed old SelectionBoxController drag handler');
      }
      return !isOldSelection;
    });
    
    // Remove release handlers
    g_mouseController.releaseHandlers = g_mouseController.releaseHandlers.filter(handler => {
      const isOldSelection = handler.name === 'SelectionBoxController' || 
                            handler.toString().includes('SelectionBoxController');
      if (isOldSelection) {
        console.log('🗑️ Removed old SelectionBoxController release handler');
      }
      return !isOldSelection;
    });
  };
  
  removeOldSelectionHandlers();
  
  console.log('\n📊 New handler order:');
  console.log('Click handlers:', g_mouseController.clickHandlers.map(h => h.name || 'anonymous'));
  console.log('Drag handlers:', g_mouseController.dragHandlers.map(h => h.name || 'anonymous'));
  console.log('Release handlers:', g_mouseController.releaseHandlers.map(h => h.name || 'anonymous'));
  
  console.log('\n✅ Old selection system removed');
  console.log('💡 Try clicking and dragging now - UISelectionController should work');
}

function temporarilyDisableOldSelection() {
  console.log('⏸️ TEMPORARILY DISABLING OLD SELECTION');
  console.log('======================================\n');
  
  if (g_selectionBoxController) {
    console.log('Found g_selectionBoxController - disabling...');
    
    // Store original methods
    const originalHandlers = {
      handleMousePressed: g_selectionBoxController.handleMousePressed,
      handleMouseDrag: g_selectionBoxController.handleMouseDrag,
      handleMouseReleased: g_selectionBoxController.handleMouseReleased
    };
    
    // Replace with no-ops
    g_selectionBoxController.handleMousePressed = function() {
      console.log('🚫 Old selection handleMousePressed blocked');
      return false; // Don't consume the event
    };
    
    g_selectionBoxController.handleMouseDrag = function() {
      console.log('🚫 Old selection handleMouseDrag blocked');
      return false;
    };
    
    g_selectionBoxController.handleMouseReleased = function() {
      console.log('🚫 Old selection handleMouseReleased blocked');
      return false;
    };
    
    console.log('✅ Old selection controller disabled');
    
    // Return restore function
    return function restore() {
      g_selectionBoxController.handleMousePressed = originalHandlers.handleMousePressed;
      g_selectionBoxController.handleMouseDrag = originalHandlers.handleMouseDrag;
      g_selectionBoxController.handleMouseReleased = originalHandlers.handleMouseReleased;
      console.log('🔄 Old selection controller restored');
    };
  } else {
    console.log('No g_selectionBoxController found');
  }
}

function reorderMouseHandlers() {
  console.log('🔄 REORDERING MOUSE HANDLERS');
  console.log('============================\n');
  
  if (typeof g_mouseController === 'undefined' || !g_mouseController) {
    console.error('❌ MouseController not available');
    return;
  }
  
  // Move UISelectionController handlers to the front
  const moveUISelectionToFront = (handlers) => {
    const uiSelectionHandlers = [];
    const otherHandlers = [];
    
    handlers.forEach(handler => {
      if (handler.name === 'setupMouseHandlers' || 
          handler.toString().includes('UISelectionController') ||
          handler.toString().includes('setupMouseHandlers')) {
        uiSelectionHandlers.push(handler);
      } else {
        otherHandlers.push(handler);
      }
    });
    
    return [...uiSelectionHandlers, ...otherHandlers];
  };
  
  console.log('🔄 Moving UISelectionController handlers to front...');
  
  g_mouseController.clickHandlers = moveUISelectionToFront(g_mouseController.clickHandlers);
  g_mouseController.dragHandlers = moveUISelectionToFront(g_mouseController.dragHandlers);
  g_mouseController.releaseHandlers = moveUISelectionToFront(g_mouseController.releaseHandlers);
  
  console.log('\n📊 New handler order:');
  console.log('Click handlers:', g_mouseController.clickHandlers.map(h => h.name || 'anonymous'));
  console.log('Drag handlers:', g_mouseController.dragHandlers.map(h => h.name || 'anonymous'));
  console.log('Release handlers:', g_mouseController.releaseHandlers.map(h => h.name || 'anonymous'));
  
  console.log('\n✅ UISelectionController now has priority');
  console.log('💡 Try clicking and dragging');
}

// Make functions available globally
if (typeof window !== 'undefined') {
  window.fixMouseHandlerPriority = fixMouseHandlerPriority;
  window.temporarilyDisableOldSelection = temporarilyDisableOldSelection;
  window.reorderMouseHandlers = reorderMouseHandlers;
}