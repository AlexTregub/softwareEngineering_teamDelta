/**
 * Selection State Debugging
 * Debug the selection state machine to find why it's not resetting properly
 */

function debugSelectionStateMachine() {
  console.log('🔍 SELECTION STATE MACHINE DEBUG');
  console.log('================================\n');
  
  // Check initial state
  console.log('📊 Initial State Check:');
  if (typeof g_uiSelectionController !== 'undefined' && g_uiSelectionController) {
    const controller = g_uiSelectionController;
    console.log('UISelectionController state:', {
      isSelecting: controller.isSelecting,
      dragStartPos: controller.dragStartPos,
      selectedEntities: controller.selectedEntities?.length || 0,
      config: controller.config
    });
    
    if (controller.effectsRenderer) {
      console.log('EffectsRenderer selection box state:', {
        active: controller.effectsRenderer.selectionBox?.active,
        entities: controller.effectsRenderer.selectionBox?.entities?.length || 0,
        callbacks: Object.keys(controller.effectsRenderer.selectionBox?.callbacks || {})
      });
    }
  }
  
  console.log('\n🎭 Installing State Transition Monitoring...');
  
  // Monitor UISelectionController state changes
  if (typeof g_uiSelectionController !== 'undefined' && g_uiSelectionController) {
    const controller = g_uiSelectionController;
    
    // Wrap handleMousePressed
    const originalPressed = controller.handleMousePressed.bind(controller);
    controller.handleMousePressed = function(x, y, button) {
      console.log('🖱️ MOUSE PRESSED:', { x, y, button });
      console.log('  State before:', {
        isSelecting: this.isSelecting,
        dragStartPos: this.dragStartPos
      });
      
      const result = originalPressed(x, y, button);
      
      console.log('  State after:', {
        isSelecting: this.isSelecting,
        dragStartPos: this.dragStartPos
      });
      
      return result;
    };
    
    // Wrap handleMouseDrag
    const originalDrag = controller.handleMouseDrag.bind(controller);
    controller.handleMouseDrag = function(x, y, dx, dy) {
      console.log('🖱️ MOUSE DRAG:', { x, y, dx, dy });
      console.log('  State before:', {
        isSelecting: this.isSelecting,
        dragStartPos: this.dragStartPos
      });
      
      const result = originalDrag(x, y, dx, dy);
      
      console.log('  State after:', {
        isSelecting: this.isSelecting
      });
      
      return result;
    };
    
    // Wrap handleMouseReleased
    const originalReleased = controller.handleMouseReleased.bind(controller);
    controller.handleMouseReleased = function(x, y, button) {
      console.log('🖱️ MOUSE RELEASED:', { x, y, button });
      console.log('  State before:', {
        isSelecting: this.isSelecting,
        dragStartPos: this.dragStartPos
      });
      
      const result = originalReleased(x, y, button);
      
      console.log('  State after:', {
        isSelecting: this.isSelecting,
        dragStartPos: this.dragStartPos
      });
      
      return result;
    };
    
    // Wrap startSelection
    const originalStartSelection = controller.startSelection.bind(controller);
    controller.startSelection = function(x, y) {
      console.log('🎯 START SELECTION:', { x, y });
      console.log('  Effects renderer available:', !!this.effectsRenderer);
      
      const result = originalStartSelection(x, y);
      
      if (this.effectsRenderer) {
        console.log('  Selection box started:', this.effectsRenderer.selectionBox?.active);
      }
      
      return result;
    };
    
    // Wrap endSelection
    const originalEndSelection = controller.endSelection.bind(controller);
    controller.endSelection = function(x, y) {
      console.log('🎯 END SELECTION:', { x, y });
      console.log('  Effects renderer available:', !!this.effectsRenderer);
      
      if (this.effectsRenderer) {
        console.log('  Selection box active before end:', this.effectsRenderer.selectionBox?.active);
      }
      
      const result = originalEndSelection(x, y);
      
      if (this.effectsRenderer) {
        console.log('  Selection box active after end:', this.effectsRenderer.selectionBox?.active);
      }
      
      return result;
    };
    
    console.log('✅ State monitoring installed on UISelectionController');
  }
  
  // Monitor EffectsRenderer selection box methods
  if (typeof window.EffectsRenderer !== 'undefined') {
    const renderer = window.EffectsRenderer;
    
    // Wrap startSelectionBox
    const originalStart = renderer.startSelectionBox.bind(renderer);
    renderer.startSelectionBox = function(x, y, options) {
      console.log('📦 EFFECTS: startSelectionBox:', { x, y, options });
      console.log('  Active before:', this.selectionBox?.active);
      
      const result = originalStart(x, y, options);
      
      console.log('  Active after:', this.selectionBox?.active);
      console.log('  Callbacks set:', Object.keys(this.selectionBox?.callbacks || {}));
      
      return result;
    };
    
    // Wrap endSelectionBox
    const originalEnd = renderer.endSelectionBox.bind(renderer);
    renderer.endSelectionBox = function() {
      console.log('📦 EFFECTS: endSelectionBox called');
      console.log('  Active before:', this.selectionBox?.active);
      console.log('  Entities count:', this.selectionBox?.entities?.length || 0);
      
      const result = originalEnd();
      
      console.log('  Active after:', this.selectionBox?.active);
      console.log('  Callbacks cleared:', Object.keys(this.selectionBox?.callbacks || {}));
      console.log('  Returned entities:', result?.length || 0);
      
      return result;
    };
    
    console.log('✅ State monitoring installed on EffectsRenderer');
  }
  
  console.log('\n💡 Try clicking and dragging to see the state transitions');
  console.log('🔄 Monitoring will run until page refresh');
}

function quickStateReset() {
  console.log('🔄 QUICK STATE RESET');
  console.log('====================\n');
  
  if (typeof g_uiSelectionController !== 'undefined' && g_uiSelectionController) {
    console.log('Resetting UISelectionController state...');
    g_uiSelectionController.isSelecting = false;
    g_uiSelectionController.dragStartPos = null;
    g_uiSelectionController.selectedEntities = [];
    console.log('✅ UISelectionController reset');
  }
  
  if (typeof window.EffectsRenderer !== 'undefined') {
    console.log('Resetting EffectsRenderer selection state...');
    if (window.EffectsRenderer.selectionBox) {
      window.EffectsRenderer.selectionBox.active = false;
      window.EffectsRenderer.selectionBox.entities = [];
      window.EffectsRenderer.selectionBox.callbacks = { onStart: null, onUpdate: null, onEnd: null };
    }
    console.log('✅ EffectsRenderer reset');
  }
  
  console.log('\n🎯 State fully reset - try selection again');
}

function testSelectionCycle() {
  console.log('🧪 TESTING COMPLETE SELECTION CYCLE');
  console.log('===================================\n');
  
  if (typeof g_uiSelectionController === 'undefined' || !g_uiSelectionController) {
    console.error('❌ UISelectionController not available');
    return;
  }
  
  const controller = g_uiSelectionController;
  
  console.log('🎭 Simulating full selection cycle...');
  
  // Step 1: Mouse press
  console.log('\n1️⃣ Mouse Press (200, 200)');
  controller.handleMousePressed(200, 200, 0);
  
  // Step 2: Small drag (under threshold)
  console.log('\n2️⃣ Small Drag (202, 202) - Should NOT start selection');
  controller.handleMouseDrag(202, 202, 2, 2);
  
  // Step 3: Drag over threshold
  console.log('\n3️⃣ Drag Over Threshold (210, 210) - Should START selection');
  controller.handleMouseDrag(210, 210, 10, 10);
  
  // Step 4: Continue dragging
  console.log('\n4️⃣ Continue Drag (250, 250) - Should UPDATE selection');
  controller.handleMouseDrag(250, 250, 50, 50);
  
  // Step 5: Mouse release (after delay to see the box)
  console.log('\n5️⃣ Mouse Release (after 2 second delay)...');
  setTimeout(() => {
    controller.handleMouseReleased(250, 250, 0);
    
    // Step 6: Try second cycle immediately
    console.log('\n6️⃣ Testing Second Cycle Immediately...');
    setTimeout(() => {
      console.log('Starting second selection cycle...');
      controller.handleMousePressed(100, 100, 0);
      controller.handleMouseDrag(110, 110, 10, 10);
      
      setTimeout(() => {
        controller.handleMouseReleased(150, 150, 0);
        console.log('🎉 Second cycle completed');
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