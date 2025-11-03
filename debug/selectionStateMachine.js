/**
 * Selection State Debugging
 * Debug the selection state machine to find why it's not resetting properly
 */

function debugSelectionStateMachine() {
  logNormal('🔍 SELECTION STATE MACHINE DEBUG');
  logNormal('================================\n');
  
  // Check initial state
  logNormal('📊 Initial State Check:');
  if (g_uiSelectionController) {
    const controller = g_uiSelectionController;
    logNormal('UISelectionController state:', {
      isSelecting: controller.isSelecting,
      dragStartPos: controller.dragStartPos,
      selectedEntities: controller.selectedEntities?.length || 0,
      config: controller.config
    });
    
    if (controller.effectsRenderer) {
      logNormal('EffectsRenderer selection box state:', {
        active: controller.effectsRenderer.selectionBox?.active,
        entities: controller.effectsRenderer.selectionBox?.entities?.length || 0,
        callbacks: Object.keys(controller.effectsRenderer.selectionBox?.callbacks || {})
      });
    }
  }
  
  logNormal('\n🎭 Installing State Transition Monitoring...');
  
  // Monitor UISelectionController state changes
  if (g_uiSelectionController) {
    const controller = g_uiSelectionController;
    
    // Wrap handleMousePressed
    const originalPressed = controller.handleMousePressed.bind(controller);
    controller.handleMousePressed = function(x, y, button) {
      logNormal('🖱️ MOUSE PRESSED:', { x, y, button });
      logNormal('  State before:', {
        isSelecting: this.isSelecting,
        dragStartPos: this.dragStartPos
      });
      
      const result = originalPressed(x, y, button);
      
      logNormal('  State after:', {
        isSelecting: this.isSelecting,
        dragStartPos: this.dragStartPos
      });
      
      return result;
    };
    
    // Wrap handleMouseDrag
    const originalDrag = controller.handleMouseDrag.bind(controller);
    controller.handleMouseDrag = function(x, y, dx, dy) {
      logNormal('🖱️ MOUSE DRAG:', { x, y, dx, dy });
      logNormal('  State before:', {
        isSelecting: this.isSelecting,
        dragStartPos: this.dragStartPos
      });
      
      const result = originalDrag(x, y, dx, dy);
      
      logNormal('  State after:', {
        isSelecting: this.isSelecting
      });
      
      return result;
    };
    
    // Wrap handleMouseReleased
    const originalReleased = controller.handleMouseReleased.bind(controller);
    controller.handleMouseReleased = function(x, y, button) {
      logNormal('🖱️ MOUSE RELEASED:', { x, y, button });
      logNormal('  State before:', {
        isSelecting: this.isSelecting,
        dragStartPos: this.dragStartPos
      });
      
      const result = originalReleased(x, y, button);
      
      logNormal('  State after:', {
        isSelecting: this.isSelecting,
        dragStartPos: this.dragStartPos
      });
      
      return result;
    };
    
    // Wrap startSelection
    const originalStartSelection = controller.startSelection.bind(controller);
    controller.startSelection = function(x, y) {
      logNormal('🎯 START SELECTION:', { x, y });
      logNormal('  Effects renderer available:', !!this.effectsRenderer);
      
      const result = originalStartSelection(x, y);
      
      if (this.effectsRenderer) {
        logNormal('  Selection box started:', this.effectsRenderer.selectionBox?.active);
      }
      
      return result;
    };
    
    // Wrap endSelection
    const originalEndSelection = controller.endSelection.bind(controller);
    controller.endSelection = function(x, y) {
      logNormal('🎯 END SELECTION:', { x, y });
      logNormal('  Effects renderer available:', !!this.effectsRenderer);
      
      if (this.effectsRenderer) {
        logNormal('  Selection box active before end:', this.effectsRenderer.selectionBox?.active);
      }
      
      const result = originalEndSelection(x, y);
      
      if (this.effectsRenderer) {
        logNormal('  Selection box active after end:', this.effectsRenderer.selectionBox?.active);
      }
      
      return result;
    };
    
    logNormal('✅ State monitoring installed on UISelectionController');
  }
  
  // Monitor EffectsRenderer selection box methods
  if (typeof window.EffectsRenderer !== 'undefined') {
    const renderer = window.EffectsRenderer;
    
    // Wrap startSelectionBox
    const originalStart = renderer.startSelectionBox.bind(renderer);
    renderer.startSelectionBox = function(x, y, options) {
      logNormal('📦 EFFECTS: startSelectionBox:', { x, y, options });
      logNormal('  Active before:', this.selectionBox?.active);
      
      const result = originalStart(x, y, options);
      
      logNormal('  Active after:', this.selectionBox?.active);
      logNormal('  Callbacks set:', Object.keys(this.selectionBox?.callbacks || {}));
      
      return result;
    };
    
    // Wrap endSelectionBox
    const originalEnd = renderer.endSelectionBox.bind(renderer);
    renderer.endSelectionBox = function() {
      logNormal('📦 EFFECTS: endSelectionBox called');
      logNormal('  Active before:', this.selectionBox?.active);
      logNormal('  Entities count:', this.selectionBox?.entities?.length || 0);
      
      const result = originalEnd();
      
      logNormal('  Active after:', this.selectionBox?.active);
      logNormal('  Callbacks cleared:', Object.keys(this.selectionBox?.callbacks || {}));
      logNormal('  Returned entities:', result?.length || 0);
      
      return result;
    };
    
    logNormal('✅ State monitoring installed on EffectsRenderer');
  }
  
  logNormal('\n💡 Try clicking and dragging to see the state transitions');
  logNormal('🔄 Monitoring will run until page refresh');
}

function quickStateReset() {
  logNormal('🔄 QUICK STATE RESET');
  logNormal('====================\n');
  
  if (g_uiSelectionController) {
    logNormal('Resetting UISelectionController state...');
    g_uiSelectionController.isSelecting = false;
    g_uiSelectionController.dragStartPos = null;
    g_uiSelectionController.selectedEntities = [];
    logNormal('✅ UISelectionController reset');
  }
  
  if (typeof window.EffectsRenderer !== 'undefined') {
    logNormal('Resetting EffectsRenderer selection state...');
    if (window.EffectsRenderer.selectionBox) {
      window.EffectsRenderer.selectionBox.active = false;
      window.EffectsRenderer.selectionBox.entities = [];
      window.EffectsRenderer.selectionBox.callbacks = { onStart: null, onUpdate: null, onEnd: null };
    }
    logNormal('✅ EffectsRenderer reset');
  }
  
  logNormal('\n🎯 State fully reset - try selection again');
}

function testSelectionCycle() {
  logNormal('🧪 TESTING COMPLETE SELECTION CYCLE');
  logNormal('===================================\n');
  
  if (typeof g_uiSelectionController === 'undefined' || !g_uiSelectionController) {
    console.error('❌ UISelectionController not available');
    return;
  }
  
  const controller = g_uiSelectionController;
  
  logNormal('🎭 Simulating full selection cycle...');
  
  // Step 1: Mouse press
  logNormal('\n1️⃣ Mouse Press (200, 200)');
  controller.handleMousePressed(200, 200, 0);
  
  // Step 2: Small drag (under threshold)
  logNormal('\n2️⃣ Small Drag (202, 202) - Should NOT start selection');
  controller.handleMouseDrag(202, 202, 2, 2);
  
  // Step 3: Drag over threshold
  logNormal('\n3️⃣ Drag Over Threshold (210, 210) - Should START selection');
  controller.handleMouseDrag(210, 210, 10, 10);
  
  // Step 4: Continue dragging
  logNormal('\n4️⃣ Continue Drag (250, 250) - Should UPDATE selection');
  controller.handleMouseDrag(250, 250, 50, 50);
  
  // Step 5: Mouse release (after delay to see the box)
  logNormal('\n5️⃣ Mouse Release (after 2 second delay)...');
  setTimeout(() => {
    controller.handleMouseReleased(250, 250, 0);
    
    // Step 6: Try second cycle immediately
    logNormal('\n6️⃣ Testing Second Cycle Immediately...');
    setTimeout(() => {
      logNormal('Starting second selection cycle...');
      controller.handleMousePressed(100, 100, 0);
      controller.handleMouseDrag(110, 110, 10, 10);
      
      setTimeout(() => {
        controller.handleMouseReleased(150, 150, 0);
        logNormal('🎉 Second cycle completed');
      }, 1000);
    }, 500);
  }, 2000);
}

// Make functions available globally
if (typeof window !== 'undefined') {
  window.debugSelectionStateMachine = debugSelectionStateMachine;
  window.quickStateReset = quickStateReset;
  window.testSelectionCycle = testSelectionCycle;
}