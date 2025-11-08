/**
 * @fileoverview Example demonstrating dynamic panel and button resizing
 */

// Example of creating a panel that automatically adjusts its size based on content

function createDynamicResizingExample() {
  const dynamicPanel = new DraggablePanel({
    id: 'dynamic-resize-panel',
    title: 'Dynamic Resizing Demo - This title will adjust the title bar height automatically',
    position: { x: 50, y: 50 },
    size: { width: 200, height: 100 }, // Initial size - will auto-adjust
    scale: 1.0,
    buttons: {
      layout: 'vertical',
      spacing: 5,
      buttonWidth: 180,
      buttonHeight: 35, // Base height - buttons will resize to fit text
      items: [
        {
          caption: 'Short',
          onClick: () => console.log('Short button clicked'),
          style: ButtonStyles.DEFAULT
        },
        {
          caption: 'This button has medium length text that should wrap nicely',
          onClick: () => console.log('Medium button clicked'),
          style: ButtonStyles.SUCCESS
        },
        {
          caption: 'This is an extremely long button caption that will definitely need multiple lines and should cause the button to grow taller automatically to accommodate all the text properly',
          onClick: () => console.log('Long button clicked'),
          style: ButtonStyles.WARNING
        },
        {
          caption: 'Change Text',
          onClick: function() {
            // Demonstrate dynamic text updating
            const texts = [
              'Short',
              'Medium length text here',
              'This is a very long text that will cause the button and panel to resize automatically when clicked',
              'Back to short'
            ];
            
            const currentText = this.caption;
            const currentIndex = texts.indexOf(currentText);
            const nextIndex = (currentIndex + 1) % texts.length;
            
            // Update the button text - this will trigger auto-resize
            dynamicPanel.updateButtonText(3, texts[nextIndex]);
          },
          style: ButtonStyles.PURPLE
        }
      ]
    }
  });
  
  return dynamicPanel;
}

// Example usage in main sketch
/*
let dynamicPanel;

function setup() {
  createCanvas(1200, 800);
  
  // Initialize panel manager
  const panelManager = new DraggablePanelManager();
  panelManager.initialize();
  
  // Create dynamic panel
  dynamicPanel = createDynamicResizingExample();
  panelManager.addPanel(dynamicPanel);
}

function draw() {
  background(50);
  
  // Update and render
  if (typeof g_draggablePanelManager !== 'undefined') {
    g_draggablePanelManager.update(mouseX, mouseY, mouseIsPressed);
    g_draggablePanelManager.render();
  }
  
  // Instructions
  fill(255);
  textAlign(LEFT, TOP);
  textSize(14);
  text("Dynamic Resizing Demo", 10, 10);
  text("• Panel and buttons auto-resize to fit content", 10, 30);
  text("• Click 'Change Text' to see dynamic resizing", 10, 50);
  text("• Try scaling with +/- keys", 10, 70);
  text("• Long text automatically wraps and adjusts heights", 10, 90);
}
*/

// Utility function to test different button layouts with dynamic sizing
function createGridLayoutTest() {
  return new DraggablePanel({
    id: 'grid-layout-test',
    title: 'Grid Layout with Dynamic Heights',
    position: { x: 300, y: 50 },
    size: { width: 250, height: 100 },
    buttons: {
      layout: 'grid',
      columns: 2,
      spacing: 8,
      buttonWidth: 110,
      buttonHeight: 30,
      items: [
        {
          caption: 'Short',
          onClick: () => console.log('Button 1'),
          style: ButtonStyles.DEFAULT
        },
        {
          caption: 'This is longer text that wraps',
          onClick: () => console.log('Button 2'),
          style: ButtonStyles.SUCCESS
        },
        {
          caption: 'Medium',
          onClick: () => console.log('Button 3'),
          style: ButtonStyles.WARNING
        },
        {
          caption: 'This button has very long text that will definitely wrap to multiple lines',
          onClick: () => console.log('Button 4'),
          style: ButtonStyles.DANGER
        }
      ]
    }
  });
}

// Export for use in other files
if (typeof window !== 'undefined') {
  window.createDynamicResizingExample = createDynamicResizingExample;
  window.createGridLayoutTest = createGridLayoutTest;
}