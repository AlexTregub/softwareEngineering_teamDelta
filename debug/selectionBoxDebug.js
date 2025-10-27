/**
 * Selection Box Debug Script
 * Run this in the browser console to diagnose selection box issues
 */

function debugSelectionBox() {
  logNormal('🔍 SELECTION BOX DIAGNOSTIC REPORT');
  logNormal('=====================================\n');

  // Check basic components
  logNormal('📦 COMPONENT AVAILABILITY:');
  logNormal('UISelectionController class:', typeof UISelectionController !== 'undefined' ? '✅' : '❌');
  logNormal('EffectsLayerRenderer class:', typeof EffectsLayerRenderer !== 'undefined' ? '✅' : '❌');
  logNormal('MouseInputController class:', typeof MouseInputController !== 'undefined' ? '✅' : '❌');
  logNormal('window.EffectsRenderer instance:', typeof window.EffectsRenderer !== 'undefined' ? '✅' : '❌');
  logNormal('g_uiSelectionController instance:', typeof g_uiSelectionController !== 'undefined' ? '✅' : '❌');
  logNormal('g_mouseController instance:', typeof g_mouseController !== 'undefined' ? '✅' : '❌');
  logNormal('');

  // Check RenderLayerManager
  logNormal('🎨 RENDER SYSTEM:');
  logNormal('RenderManager class:', typeof RenderManager !== 'undefined' ? '✅' : '❌');
  logNormal('RenderManager initialized:', (RenderManager && RenderManager.isInitialized) ? '✅' : '❌');
  
  if (RenderManager && RenderManager.layerRenderers) {
    logNormal('Effects layer registered:', RenderManager.layerRenderers.has('effects') ? '✅' : '❌');
    logNormal('Disabled layers:', Array.from(RenderManager.disabledLayers || []));
  }
  logNormal('');

  // Check EffectsRenderer details
  if (typeof window.EffectsRenderer !== 'undefined') {
    logNormal('🎯 EFFECTS RENDERER:');
    logNormal('Selection box methods available:');
    logNormal('  startSelectionBox:', typeof window.EffectsRenderer.startSelectionBox === 'function' ? '✅' : '❌');
    logNormal('  updateSelectionBox:', typeof window.EffectsRenderer.updateSelectionBox === 'function' ? '✅' : '❌');
    logNormal('  endSelectionBox:', typeof window.EffectsRenderer.endSelectionBox === 'function' ? '✅' : '❌');
    logNormal('  renderSelectionBox:', typeof window.EffectsRenderer.renderSelectionBox === 'function' ? '✅' : '❌');
    
    logNormal('Selection box state:', window.EffectsRenderer.selectionBox);
    logNormal('');
  }

  // Check UISelectionController details
  if (g_uiSelectionController) {
    logNormal('🎛️ UI SELECTION CONTROLLER:');
    const debugInfo = g_uiSelectionController.getDebugInfo();
    logNormal('Debug info:', debugInfo);
    logNormal('');
  }

  // Check mouse controller
  if (g_mouseController) {
    logNormal('🖱️ MOUSE CONTROLLER:');
    logNormal('Click handlers:', g_mouseController.clickHandlers?.length || 0);
    logNormal('Drag handlers:', g_mouseController.dragHandlers?.length || 0);
    logNormal('Release handlers:', g_mouseController.releaseHandlers?.length || 0);
    logNormal('');
  }

  // Check integration functions
  logNormal('🔗 INTEGRATION:');
  logNormal('initializeUISelectionBox:', typeof initializeUISelectionBox === 'function' ? '✅' : '❌');
  logNormal('updateUISelectionEntities:', typeof updateUISelectionEntities === 'function' ? '✅' : '❌');
  logNormal('getUISelectionDebugInfo:', typeof getUISelectionDebugInfo === 'function' ? '✅' : '❌');
  logNormal('');

  // Check ant system
  logNormal('🐜 ANT SYSTEM:');
  logNormal('ants array available:', typeof ants !== 'undefined' ? '✅' : '❌');
  logNormal('ants count:', (ants && Array.isArray(ants)) ? ants.length : 'N/A');
  logNormal('');

  // Provide suggestions
  logNormal('💡 SUGGESTIONS:');
  
  if (typeof g_uiSelectionController === 'undefined') {
    logNormal('❌ UISelectionController not initialized. Try refreshing the page.');
  }
  
  if (typeof window.EffectsRenderer === 'undefined') {
    logNormal('❌ EffectsRenderer not available. Check if RenderManager.initialize() was called.');
  }
  
  if (typeof RenderManager !== 'undefined' && RenderManager.disabledLayers && RenderManager.disabledLayers.has('effects')) {
    logNormal('❌ Effects layer is disabled. Enable it with: RenderManager.toggleLayer("effects")');
  }

  logNormal('\n📋 QUICK TESTS:');
  logNormal('Run these commands to test:');
  logNormal('1. testSelectionBoxVisual() - Interactive visual test');
  logNormal('2. manualTestSelection() - Force create selection box');
  logNormal('3. RenderManager.toggleLayer("effects") - Toggle effects layer');
  
  return 'Diagnostic complete! Check the output above.';
}

function manualTestSelection() {
  logNormal('🧪 Manual Selection Test');
  
  if (typeof window.EffectsRenderer === 'undefined') {
    logNormal('❌ EffectsRenderer not available');
    return;
  }

  // Force create a selection box
  logNormal('📍 Creating test selection box...');
  window.EffectsRenderer.startSelectionBox(100, 100, {
    color: [255, 0, 0], // Red for testing
    strokeWidth: 3,
    fillAlpha: 50
  });
  
  window.EffectsRenderer.updateSelectionBox(200, 200);
  
  logNormal('✅ Test selection box created (should be visible as red box)');
  logNormal('Selection box state:', window.EffectsRenderer.selectionBox);
  
  // End it after 3 seconds
  setTimeout(() => {
    window.EffectsRenderer.endSelectionBox();
    logNormal('🔚 Test selection box ended');
  }, 3000);
}

function forceInitializeSelection() {
  logNormal('🔄 Force initializing selection system...');
  
  if (typeof UISelectionController !== 'undefined' && typeof window.EffectsRenderer !== 'undefined' && typeof g_mouseController !== 'undefined') {
    // Force create the controller
    window.g_uiSelectionController = new UISelectionController(window.EffectsRenderer, g_mouseController);
    logNormal('✅ UISelectionController force-created');
    
    // Initialize the integration
    if (typeof initializeUISelectionBox === 'function') {
      initializeUISelectionBox();
      logNormal('✅ Selection box integration initialized');
    }
    
    return true;
  } else {
    logNormal('❌ Required components not available for force initialization');
    return false;
  }
}

function quickSelectionTest() {
  logNormal('⚡ Quick Selection Test');
  logNormal('1. Click and drag on the canvas');
  logNormal('2. Watch the console for selection events');
  logNormal('3. Look for a cyan selection box');
  
  // Enable debug logging for selection events
  if (g_uiSelectionController) {
    const originalCallbacks = { ...g_uiSelectionController.callbacks };
    
    g_uiSelectionController.setCallbacks({
      onSelectionStart: (x, y) => {
        logNormal(`🎯 Selection started at (${x}, ${y})`);
      },
      onSelectionUpdate: (bounds, entities) => {
        logNormal(`🔄 Selection updated: ${entities.length} entities`);
      },
      onSelectionEnd: (bounds, entities) => {
        logNormal(`✅ Selection ended: ${entities.length} entities selected`);
      },
      onSingleClick: (x, y, button, entity) => {
        logNormal(`👆 Single click at (${x}, ${y}), entity: ${entity ? 'Yes' : 'No'}`);
      }
    });
    
    logNormal('✅ Debug callbacks enabled');
    
    // Restore original callbacks after 30 seconds
    setTimeout(() => {
      g_uiSelectionController.setCallbacks(originalCallbacks);
      logNormal('🔄 Debug callbacks restored');
    }, 30000);
  } else {
    logNormal('❌ UISelectionController not available');
  }
}

// Auto-expose functions to global scope
if (typeof window !== 'undefined') {
  window.debugSelectionBox = debugSelectionBox;
  window.manualTestSelection = manualTestSelection;
  window.forceInitializeSelection = forceInitializeSelection;
  window.quickSelectionTest = quickSelectionTest;
  
  // Proper async initialization
  (async function initializeDebugTools() {
    if (globalThis.globalDebugVerbosity === undefined) {
      await awaitDebugVerbosity(); // Actually wait for it
    }
    
    // Now check verbosity after we know it's defined
    if (globalThis.globalDebugVerbosity >= 1) {
      if (typeof globalThis.logQuiet === 'function') {
        globalThis.logQuiet('🛠️ Selection box debug tools loaded!');
        globalThis.logQuiet('Available commands:');
        globalThis.logQuiet('- debugSelectionBox() - Full diagnostic');
        globalThis.logQuiet('- manualTestSelection() - Force create selection box');
        globalThis.logQuiet('- forceInitializeSelection() - Force initialize system');
        globalThis.logQuiet('- quickSelectionTest() - Enable debug logging');
      } else {
        logNormal('🛠️ Selection box debug tools loaded!');
        logNormal('Available commands:');
        logNormal('- debugSelectionBox() - Full diagnostic');
        logNormal('- manualTestSelection() - Force create selection box');
        logNormal('- forceInitializeSelection() - Force initialize system');
        logNormal('- quickSelectionTest() - Enable debug logging');
      }
    }
  })();
}

async function awaitDebugVerbosity() {
  while (globalThis.globalDebugVerbosity === undefined) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}
