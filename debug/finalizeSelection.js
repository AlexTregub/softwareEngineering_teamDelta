/**
 * Final Selection Box Configuration
 * Clean up debug code and configure the selection box for normal use
 */

function finalizeSelectionBox() {
  console.log('🎯 FINALIZING SELECTION BOX SYSTEM');
  console.log('=================================\n');
  
  if (typeof window.EffectsRenderer === 'undefined' || typeof g_uiSelectionController === 'undefined') {
    console.log('❌ Required components not available');
    return false;
  }
  
  // Clear any existing persistent selections
  window.EffectsRenderer.endSelectionBox();
  console.log('🧹 Cleared persistent test selections');
  
  // Configure selection box for better visibility
  g_uiSelectionController.updateConfig({
    enableSelection: true,
    selectionColor: [0, 255, 255], // Bright cyan
    strokeWidth: 3,                 // Thicker stroke
    fillAlpha: 50,                  // More visible fill
    minSelectionSize: 3             // Smaller minimum
  });
  
  // Reduce drag threshold for easier selection
  g_uiSelectionController.dragThreshold = 3;
  
  console.log('✅ Selection box configured for optimal visibility');
  
  // Set up clean callbacks without excessive logging
  g_uiSelectionController.setCallbacks({
    onSelectionStart: (x, y) => {
      console.log(`🎯 Selection started at (${x}, ${y})`);
    },
    onSelectionEnd: (bounds, entities) => {
      if (bounds && bounds.area > 100) { // Only log significant selections
        console.log(`✅ Selection completed: ${entities.length} entities selected (${Math.round(bounds.area)} pixels)`);
      }
    },
    onSingleClick: (x, y, button, entity) => {
      if (entity) {
        console.log(`👆 Selected entity at (${x}, ${y})`);
      }
    }
  });
  
  console.log('✅ Clean callbacks configured');
  
  // Update selectable entities
  if (typeof updateUISelectionEntities === 'function') {
    updateUISelectionEntities();
    console.log('✅ Selectable entities updated');
  }
  
  console.log('\n🎉 Selection box system ready!');
  console.log('💡 Usage:');
  console.log('   • Click and drag to select multiple entities');
  console.log('   • Single click to select individual entities'); 
  console.log('   • Selection box will be bright cyan with thick border');
  
  return true;
}

/**
 * Test normal selection behavior
 */
function testNormalSelection() {
  console.log('🧪 TESTING NORMAL SELECTION');
  console.log('==========================\n');
  
  if (!finalizeSelectionBox()) {
    return;
  }
  
  console.log('📋 Selection Test Instructions:');
  console.log('1. Click and drag on empty space to create selection box');
  console.log('2. Selection box should appear as bright cyan rectangle');
  console.log('3. Release mouse to complete selection');
  console.log('4. Check console for selection results');
  console.log('5. Try selecting ants if any are visible');
  
  // Enable verbose logging for testing
  if (typeof g_uiSelectionController !== 'undefined') {
    const originalUpdate = g_uiSelectionController.updateSelection.bind(g_uiSelectionController);
    g_uiSelectionController.updateSelection = function(x, y) {
      console.log(`🔄 Selection updating to (${x}, ${y})`);
      return originalUpdate(x, y);
    };
    
    console.log('🔍 Verbose selection logging enabled for testing');
    
    // Restore normal logging after 30 seconds
    setTimeout(() => {
      g_uiSelectionController.updateSelection = originalUpdate;
      console.log('🔄 Verbose logging disabled');
    }, 30000);
  }
}

/**
 * Quick selection status check
 */
function checkSelectionStatus() {
  console.log('📊 SELECTION SYSTEM STATUS');
  console.log('==========================');
  
  const status = {
    effectsRenderer: typeof window.EffectsRenderer !== 'undefined',
    uiController: typeof g_uiSelectionController !== 'undefined',
    mouseController: typeof g_mouseController !== 'undefined',
    selectionActive: false,
    entitiesCount: 0,
    config: null
  };
  
  if (status.uiController) {
    const debugInfo = g_uiSelectionController.getDebugInfo();
    status.selectionActive = debugInfo.isSelecting;
    status.entitiesCount = debugInfo.selectableEntitiesCount;
    status.config = debugInfo.config;
  }
  
  if (status.effectsRenderer) {
    status.selectionBoxActive = window.EffectsRenderer.selectionBox.active;
  }
  
  console.table(status);
  
  if (status.effectsRenderer && status.uiController && status.mouseController) {
    console.log('✅ All systems operational');
    console.log('🎯 Selection box ready for use');
  } else {
    console.log('❌ Some systems missing - run emergencySelectionSetup()');
  }
  
  return status;
}

// Make functions available globally
if (typeof window !== 'undefined') {
  window.finalizeSelectionBox = finalizeSelectionBox;
  window.testNormalSelection = testNormalSelection;
  window.checkSelectionStatus = checkSelectionStatus;
}