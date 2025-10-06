/**
 * Selection Box Debug Script
 * Run this in the browser console to diagnose selection box issues
 */

function debugSelectionBox() {
  console.log('🔍 SELECTION BOX DIAGNOSTIC REPORT');
  console.log('=====================================\n');

  // Check basic components
  console.log('📦 COMPONENT AVAILABILITY:');
  console.log('UISelectionController class:', typeof UISelectionController !== 'undefined' ? '✅' : '❌');
  console.log('EffectsLayerRenderer class:', typeof EffectsLayerRenderer !== 'undefined' ? '✅' : '❌');
  console.log('MouseInputController class:', typeof MouseInputController !== 'undefined' ? '✅' : '❌');
  console.log('window.EffectsRenderer instance:', typeof window.EffectsRenderer !== 'undefined' ? '✅' : '❌');
  console.log('g_uiSelectionController instance:', typeof g_uiSelectionController !== 'undefined' ? '✅' : '❌');
  console.log('g_mouseController instance:', typeof g_mouseController !== 'undefined' ? '✅' : '❌');
  console.log('');

  // Check RenderLayerManager
  console.log('🎨 RENDER SYSTEM:');
  console.log('RenderManager class:', typeof RenderManager !== 'undefined' ? '✅' : '❌');
  console.log('RenderManager initialized:', (RenderManager && RenderManager.isInitialized) ? '✅' : '❌');
  
  if (RenderManager && RenderManager.layerRenderers) {
    console.log('Effects layer registered:', RenderManager.layerRenderers.has('effects') ? '✅' : '❌');
    console.log('Disabled layers:', Array.from(RenderManager.disabledLayers || []));
  }
  console.log('');

  // Check EffectsRenderer details
  if (typeof window.EffectsRenderer !== 'undefined') {
    console.log('🎯 EFFECTS RENDERER:');
    console.log('Selection box methods available:');
    console.log('  startSelectionBox:', typeof window.EffectsRenderer.startSelectionBox === 'function' ? '✅' : '❌');
    console.log('  updateSelectionBox:', typeof window.EffectsRenderer.updateSelectionBox === 'function' ? '✅' : '❌');
    console.log('  endSelectionBox:', typeof window.EffectsRenderer.endSelectionBox === 'function' ? '✅' : '❌');
    console.log('  renderSelectionBox:', typeof window.EffectsRenderer.renderSelectionBox === 'function' ? '✅' : '❌');
    
    console.log('Selection box state:', window.EffectsRenderer.selectionBox);
    console.log('');
  }

  // Check UISelectionController details
  if (g_uiSelectionController) {
    console.log('🎛️ UI SELECTION CONTROLLER:');
    const debugInfo = g_uiSelectionController.getDebugInfo();
    console.log('Debug info:', debugInfo);
    console.log('');
  }

  // Check mouse controller
  if (g_mouseController) {
    console.log('🖱️ MOUSE CONTROLLER:');
    console.log('Click handlers:', g_mouseController.clickHandlers?.length || 0);
    console.log('Drag handlers:', g_mouseController.dragHandlers?.length || 0);
    console.log('Release handlers:', g_mouseController.releaseHandlers?.length || 0);
    console.log('');
  }

  // Check integration functions
  console.log('🔗 INTEGRATION:');
  console.log('initializeUISelectionBox:', typeof initializeUISelectionBox === 'function' ? '✅' : '❌');
  console.log('updateUISelectionEntities:', typeof updateUISelectionEntities === 'function' ? '✅' : '❌');
  console.log('getUISelectionDebugInfo:', typeof getUISelectionDebugInfo === 'function' ? '✅' : '❌');
  console.log('');

  // Check ant system
  console.log('🐜 ANT SYSTEM:');
  console.log('ants array available:', typeof ants !== 'undefined' ? '✅' : '❌');
  console.log('ants count:', (ants && Array.isArray(ants)) ? ants.length : 'N/A');
  console.log('');

  // Provide suggestions
  console.log('💡 SUGGESTIONS:');
  
  if (typeof g_uiSelectionController === 'undefined') {
    console.log('❌ UISelectionController not initialized. Try refreshing the page.');
  }
  
  if (typeof window.EffectsRenderer === 'undefined') {
    console.log('❌ EffectsRenderer not available. Check if RenderManager.initialize() was called.');
  }
  
  if (typeof RenderManager !== 'undefined' && RenderManager.disabledLayers && RenderManager.disabledLayers.has('effects')) {
    console.log('❌ Effects layer is disabled. Enable it with: RenderManager.toggleLayer("effects")');
  }

  console.log('\n📋 QUICK TESTS:');
  console.log('Run these commands to test:');
  console.log('1. testSelectionBoxVisual() - Interactive visual test');
  console.log('2. manualTestSelection() - Force create selection box');
  console.log('3. RenderManager.toggleLayer("effects") - Toggle effects layer');
  
  return 'Diagnostic complete! Check the output above.';
}

function manualTestSelection() {
  console.log('🧪 Manual Selection Test');
  
  if (typeof window.EffectsRenderer === 'undefined') {
    console.log('❌ EffectsRenderer not available');
    return;
  }

  // Force create a selection box
  console.log('📍 Creating test selection box...');
  window.EffectsRenderer.startSelectionBox(100, 100, {
    color: [255, 0, 0], // Red for testing
    strokeWidth: 3,
    fillAlpha: 50
  });
  
  window.EffectsRenderer.updateSelectionBox(200, 200);
  
  console.log('✅ Test selection box created (should be visible as red box)');
  console.log('Selection box state:', window.EffectsRenderer.selectionBox);
  
  // End it after 3 seconds
  setTimeout(() => {
    window.EffectsRenderer.endSelectionBox();
    console.log('🔚 Test selection box ended');
  }, 3000);
}

function forceInitializeSelection() {
  console.log('🔄 Force initializing selection system...');
  
  if (typeof UISelectionController !== 'undefined' && typeof window.EffectsRenderer !== 'undefined' && typeof g_mouseController !== 'undefined') {
    // Force create the controller
    window.g_uiSelectionController = new UISelectionController(window.EffectsRenderer, g_mouseController);
    console.log('✅ UISelectionController force-created');
    
    // Initialize the integration
    if (typeof initializeUISelectionBox === 'function') {
      initializeUISelectionBox();
      console.log('✅ Selection box integration initialized');
    }
    
    return true;
  } else {
    console.log('❌ Required components not available for force initialization');
    return false;
  }
}

function quickSelectionTest() {
  console.log('⚡ Quick Selection Test');
  console.log('1. Click and drag on the canvas');
  console.log('2. Watch the console for selection events');
  console.log('3. Look for a cyan selection box');
  
  // Enable debug logging for selection events
  if (g_uiSelectionController) {
    const originalCallbacks = { ...g_uiSelectionController.callbacks };
    
    g_uiSelectionController.setCallbacks({
      onSelectionStart: (x, y) => {
        console.log(`🎯 Selection started at (${x}, ${y})`);
      },
      onSelectionUpdate: (bounds, entities) => {
        console.log(`🔄 Selection updated: ${entities.length} entities`);
      },
      onSelectionEnd: (bounds, entities) => {
        console.log(`✅ Selection ended: ${entities.length} entities selected`);
      },
      onSingleClick: (x, y, button, entity) => {
        console.log(`👆 Single click at (${x}, ${y}), entity: ${entity ? 'Yes' : 'No'}`);
      }
    });
    
    console.log('✅ Debug callbacks enabled');
    
    // Restore original callbacks after 30 seconds
    setTimeout(() => {
      g_uiSelectionController.setCallbacks(originalCallbacks);
      console.log('🔄 Debug callbacks restored');
    }, 30000);
  } else {
    console.log('❌ UISelectionController not available');
  }
}

// Auto-expose functions to global scope
if (typeof window !== 'undefined') {
  window.debugSelectionBox = debugSelectionBox;
  window.manualTestSelection = manualTestSelection;
  window.forceInitializeSelection = forceInitializeSelection;
  window.quickSelectionTest = quickSelectionTest;
  
  console.log('🛠️ Selection box debug tools loaded!');
  console.log('Available commands:');
  console.log('- debugSelectionBox() - Full diagnostic');
  console.log('- manualTestSelection() - Force create selection box');
  console.log('- forceInitializeSelection() - Force initialize system');
  console.log('- quickSelectionTest() - Enable debug logging');
}