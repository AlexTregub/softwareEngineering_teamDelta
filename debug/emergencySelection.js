/**
 * Emergency Selection Box Setup
 * Call this function in the browser console if the selection box isn't working
 */

function emergencySelectionSetup() {
  console.log('🚨 EMERGENCY SELECTION BOX SETUP');
  console.log('================================\n');
  
  let success = true;
  
  // Step 0: Check if we already have a working system
  console.log('Step 0: Checking existing system...');
  if (g_uiSelectionController) {
    console.log('✅ UISelectionController exists');
    
    // Check if it has handlers registered
    const mouseController = g_uiSelectionController.mouseController;
    if (mouseController) {
      console.log(`📊 Mouse handlers: click=${mouseController.clickHandlers.length}, drag=${mouseController.dragHandlers.length}, release=${mouseController.releaseHandlers.length}`);
      
      if (mouseController.clickHandlers.length > 0) {
        console.log('⚠️ Existing system detected - will reinitialize anyway');
      }
    }
  }
  
  // Step 1: Ensure EffectsRenderer exists
  console.log('Step 1: Checking EffectsRenderer...');
  if (typeof window.EffectsRenderer === 'undefined') {
    console.log('❌ EffectsRenderer not found, creating...');
    if (typeof EffectsLayerRenderer !== 'undefined') {
      window.EffectsRenderer = new EffectsLayerRenderer();
      console.log('✅ EffectsRenderer created');
    } else {
      console.log('❌ EffectsLayerRenderer class not available');
      success = false;
    }
  } else {
    console.log('✅ EffectsRenderer already exists');
  }
  
  // Step 2: Ensure MouseController exists  
  console.log('\nStep 2: Checking MouseController...');
  if (typeof g_mouseController === 'undefined') {
    console.log('❌ g_mouseController not found, creating...');
    if (typeof MouseInputController !== 'undefined') {
      g_mouseController = new MouseInputController();
      console.log('✅ MouseController created');
    } else {
      console.log('❌ MouseInputController class not available');
      success = false;
    }
  } else {
    console.log('✅ MouseController already exists');
  }
  
  // Step 3: Create UISelectionController
  console.log('\nStep 3: Creating UISelectionController...');
  if (success && typeof UISelectionController !== 'undefined') {
    try {
      g_uiSelectionController = new UISelectionController(window.EffectsRenderer, g_mouseController);
      console.log('✅ UISelectionController created');
      
      // Configure it
      g_uiSelectionController.updateConfig({
        enableSelection: true,
        selectionColor: [0, 200, 255],
        strokeWidth: 2,
        fillAlpha: 30,
        minSelectionSize: 5
      });
      
      console.log('✅ UISelectionController configured');
      
      // Set up basic callbacks with console logging
      g_uiSelectionController.setCallbacks({
        onSelectionStart: (x, y) => {
          console.log(`🎯 Selection started at (${x}, ${y})`);
        },
        onSelectionUpdate: (bounds, entities) => {
          console.log(`🔄 Selection updating: ${entities.length} entities in box`);
        },
        onSelectionEnd: (bounds, entities) => {
          console.log(`✅ Selection ended: ${entities.length} entities selected`);
        },
        onSingleClick: (x, y, button, entity) => {
          console.log(`👆 Single click at (${x}, ${y})`);
        }
      });
      
      console.log('✅ Callbacks configured with logging');
      
      // Verify that the mouse handlers are actually registered
      console.log('🔍 Verifying mouse handler registration...');
      const mouseController = g_uiSelectionController.mouseController;
      if (mouseController) {
        console.log(`📊 Final handler counts: click=${mouseController.clickHandlers.length}, drag=${mouseController.dragHandlers.length}, release=${mouseController.releaseHandlers.length}`);
        
        // Test mouse controller directly
        console.log('🧪 Testing mouse controller directly...');
        try {
          // Simulate a mouse press
          mouseController.handleMousePressed(100, 100, 0);
          console.log('✅ Mouse press simulation successful');
          
          // Simulate drag
          mouseController.handleMouseDragged(150, 150);
          console.log('✅ Mouse drag simulation successful');
          
          // Simulate release
          mouseController.handleMouseReleased(150, 150, 0);
          console.log('✅ Mouse release simulation successful');
          
        } catch (error) {
          console.log('❌ Mouse controller simulation failed:', error);
        }
      }
      
    } catch (error) {
      console.log('❌ Error creating UISelectionController:', error);
      success = false;
    }
  } else {
    console.log('❌ UISelectionController class not available');
    success = false;
  }
  
  // Step 4: Set up entities (ants)
  console.log('\nStep 4: Setting up selectable entities...');
  if (success && ants && Array.isArray(ants)) {
    const selectableAnts = [];
    for (const ant of ants) {
      if (ant && ant.antObject) {
        selectableAnts.push(ant.antObject);
      } else if (ant) {
        selectableAnts.push(ant);
      }
    }
    
    g_uiSelectionController.setSelectableEntities(selectableAnts);
    console.log(`✅ ${selectableAnts.length} selectable entities configured`);
  } else if (success) {
    console.log('⚠️ No ants found - selection will work but won\'t select anything');
    g_uiSelectionController.setSelectableEntities([]);
  }
  
  // Step 5: Test the system
  console.log('\nStep 5: Testing the system...');
  if (success) {
    console.log('🧪 Creating test selection box...');
    
    // Test the effects renderer directly
    try {
      window.EffectsRenderer.startSelectionBox(50, 50);
      window.EffectsRenderer.updateSelectionBox(150, 150);
      console.log('✅ Test selection box created (should be visible)');
      console.log('Selection box state:', window.EffectsRenderer.selectionBox);
      
      setTimeout(() => {
        window.EffectsRenderer.endSelectionBox();
        console.log('🔚 Test selection box removed');
      }, 2000);
      
    } catch (error) {
      console.log('❌ Error testing selection box:', error);
    }
  }
  
  console.log('\n📋 FINAL STATUS:');
  if (success) {
    console.log('🎉 Emergency setup completed successfully!');
    console.log('💡 Try clicking and dragging on the canvas');
    console.log('🎯 You should see a cyan selection box appear');
  } else {
    console.log('❌ Emergency setup failed - check console errors above');
  }
  
  return success;
}

/**
 * Test the complete mouse event flow
 */
function testMouseEventFlow() {
  console.log('🖱️ TESTING MOUSE EVENT FLOW');
  console.log('============================\n');
  
  // Test 1: Check p5.js mouse handlers
  console.log('Test 1: p5.js mouse event handlers...');
  console.log('mousePressed function exists:', typeof mousePressed === 'function');
  console.log('mouseDragged function exists:', typeof mouseDragged === 'function');
  console.log('mouseReleased function exists:', typeof mouseReleased === 'function');
  
  // Test 2: Check global mouse controller
  console.log('\nTest 2: Global mouse controller...');
  if (g_mouseController) {
    console.log('✅ g_mouseController exists');
    console.log(`Handler counts: click=${g_mouseController.clickHandlers.length}, drag=${g_mouseController.dragHandlers.length}, release=${g_mouseController.releaseHandlers.length}`);
  } else {
    console.log('❌ g_mouseController missing');
  }
  
  // Test 3: Check UISelectionController connection
  console.log('\nTest 3: UISelectionController mouse connection...');
  if (g_uiSelectionController) {
    console.log('✅ g_uiSelectionController exists');
    console.log('Mouse controller reference:', g_uiSelectionController.mouseController === g_mouseController ? 'SAME ✅' : 'DIFFERENT ❌');
    console.log('Selection enabled:', g_uiSelectionController.config.enableSelection);
  } else {
    console.log('❌ g_uiSelectionController missing');
  }
  
  // Test 4: Simulate complete event flow
  console.log('\nTest 4: Simulating complete event flow...');
  
  if (typeof mousePressed === 'function' && typeof g_mouseController !== 'undefined') {
    console.log('📍 Simulating mouse press at (100, 100)...');
    
    // Override mouseX, mouseY, mouseButton for testing
    const originalMouseX = typeof mouseX !== 'undefined' ? mouseX : 0;
    const originalMouseY = typeof mouseY !== 'undefined' ? mouseY : 0;
    const originalMouseButton = typeof mouseButton !== 'undefined' ? mouseButton : 0;
    
    window.mouseX = 100;
    window.mouseY = 100;
    window.mouseButton = 0; // LEFT button
    
    try {
      // Call the p5.js handler directly
      mousePressed();
      console.log('✅ mousePressed() called successfully');
      
      // Simulate drag
      window.mouseX = 150;
      window.mouseY = 150;
      
      if (typeof mouseDragged === 'function') {
        mouseDragged();
        console.log('✅ mouseDragged() called successfully');
      }
      
      // Simulate release
      if (typeof mouseReleased === 'function') {
        mouseReleased();
        console.log('✅ mouseReleased() called successfully');
      }
      
      // Check if selection box was created
      if (typeof window.EffectsRenderer !== 'undefined' && window.EffectsRenderer.selectionBox) {
        console.log('🎯 Selection box state:', window.EffectsRenderer.selectionBox.active ? 'ACTIVE' : 'INACTIVE');
      }
      
    } catch (error) {
      console.log('❌ Error in event simulation:', error);
    }
    
    // Restore original values
    window.mouseX = originalMouseX;
    window.mouseY = originalMouseY;
    window.mouseButton = originalMouseButton;
  }
  
  console.log('\n📋 Event flow test complete');
}

/**
 * Force enable selection and test
 */
function forceEnableAndTest() {
  console.log('⚡ FORCE ENABLE AND TEST');
  console.log('=======================\n');
  
  // Force create everything if needed
  emergencySelectionSetup();
  
  // Force enable selection
  if (g_uiSelectionController) {
    g_uiSelectionController.updateConfig({ enableSelection: true });
    console.log('✅ Selection force-enabled');
    
    // Add extra debug logging to mouse handlers
    const originalHandleMousePressed = g_uiSelectionController.handleMousePressed.bind(g_uiSelectionController);
    const originalHandleMouseDrag = g_uiSelectionController.handleMouseDrag.bind(g_uiSelectionController);
    const originalHandleMouseReleased = g_uiSelectionController.handleMouseReleased.bind(g_uiSelectionController);
    
    g_uiSelectionController.handleMousePressed = function(x, y, button) {
      console.log(`🖱️ MOUSE PRESSED: (${x}, ${y}) button=${button}`);
      return originalHandleMousePressed(x, y, button);
    };
    
    g_uiSelectionController.handleMouseDrag = function(x, y, dx, dy) {
      console.log(`🖱️ MOUSE DRAG: (${x}, ${y}) delta=(${dx}, ${dy})`);
      return originalHandleMouseDrag(x, y, dx, dy);
    };
    
    g_uiSelectionController.handleMouseReleased = function(x, y, button) {
      console.log(`🖱️ MOUSE RELEASED: (${x}, ${y}) button=${button}`);
      return originalHandleMouseReleased(x, y, button);
    };
    
    console.log('🔍 Debug logging enabled on mouse handlers');
    console.log('💡 Now try clicking and dragging - you should see mouse event logs');
  }
}

// Make it available globally
if (typeof window !== 'undefined') {
  window.emergencySelectionSetup = emergencySelectionSetup;
  window.testMouseEventFlow = testMouseEventFlow;
  window.forceEnableAndTest = forceEnableAndTest;
}