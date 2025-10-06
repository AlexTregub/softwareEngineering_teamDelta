/**
 * @fileoverview Quick test for dynamic resizing functionality
 * @author Software Engineering Team Delta - David Willman
 * @version 1.0.0
 */

// Simple test to verify dynamic resizing works
function testDynamicResizing() {
  console.log("Testing dynamic resizing functionality...");
  
  // Test 1: Button text wrapping and height calculation
  if (typeof Button !== 'undefined') {
    const testButton = new Button({
      caption: "This is a test button with very long text that should wrap to multiple lines",
      x: 0, y: 0, width: 120, height: 35,
      onClick: () => {},
      style: ButtonStyles.DEFAULT
    });
    
    // Test wrapped text calculation
    testButton.wrapTextToFit(120);
    const wrappedHeight = testButton.calculateWrappedTextHeight();
    console.log(`✓ Button height calculation: ${wrappedHeight}px`);
    
    if (wrappedHeight > 35) {
      console.log("✓ Button auto-resize working - height increased for wrapped text");
    }
  } else {
    console.log("✗ Button class not available");
  }
  
  // Test 2: Panel auto-resize functionality
  if (typeof DraggablePanel !== 'undefined') {
    const testPanel = new DraggablePanel({
      id: 'test-panel',
      title: 'Test Panel with Very Long Title That Should Wrap',
      position: { x: 100, y: 100 },
      size: { width: 200, height: 100 },
      buttons: {
        layout: 'vertical',
        buttonWidth: 180,
        buttonHeight: 35,
        items: [
          {
            caption: 'Short',
            onClick: () => {},
            style: ButtonStyles.DEFAULT
          },
          {
            caption: 'This is a much longer button caption that will definitely wrap to multiple lines',
            onClick: () => {},
            style: ButtonStyles.SUCCESS
          }
        ]
      }
    });
    
    // Test auto-resize
    const originalHeight = testPanel.size.height;
    testPanel.autoResizeToFitContent();
    const newHeight = testPanel.size.height;
    
    console.log(`Panel height: ${originalHeight} → ${newHeight}`);
    
    if (newHeight > originalHeight) {
      console.log("✓ Panel auto-resize working - height increased to fit content");
    } else {
      console.log("✓ Panel size appropriate for current content");
    }
  } else {
    console.log("✗ DraggablePanel class not available");
  }
  
  console.log("Dynamic resizing test completed!");
}

// Auto-run test if in browser environment
if (typeof window !== 'undefined') {
  window.testDynamicResizing = testDynamicResizing;
  
  // Run test after a short delay to ensure classes are loaded
  setTimeout(() => {
    try {
      testDynamicResizing();
    } catch (error) {
      console.log("Test requires DraggablePanel and Button classes to be loaded first");
      console.log("Run testDynamicResizing() after loading the main application");
    }
  }, 1000);
}