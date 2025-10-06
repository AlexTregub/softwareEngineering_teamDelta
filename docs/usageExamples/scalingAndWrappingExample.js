/**
 * @fileoverview Example demonstrating scaling and word wrapping in DraggablePanel and Button systems
 * @author Software Engineering Team Delta - David Willman
 * @version 1.0.0
 */

// Example of using the new scaling and word wrapping features

function setupScalingExample() {
  // Initialize the panel manager
  const panelManager = new DraggablePanelManager();
  panelManager.initialize();
  
  // Create a test panel with long text to demonstrate word wrapping
  const testPanel = new DraggablePanel({
    id: 'scaling-test-panel',
    title: 'This is a very long title that should wrap to multiple lines when the panel is small',
    position: { x: 50, y: 50 },
    size: { width: 200, height: 300 },
    scale: 1.0,
    buttons: {
      layout: 'vertical',
      spacing: 5,
      buttonWidth: 180,
      buttonHeight: 40,
      items: [
        {
          caption: 'Short Button',
          onClick: () => console.log('Short button clicked'),
          style: ButtonStyles.DEFAULT
        },
        {
          caption: 'This is a very long button caption that should wrap to multiple lines',
          onClick: () => console.log('Long button clicked'),
          style: ButtonStyles.SUCCESS
        },
        {
          caption: 'Scale Up Panel',
          onClick: () => testPanel.scaleUp(),
          style: ButtonStyles.WARNING
        },
        {
          caption: 'Scale Down Panel',
          onClick: () => testPanel.scaleDown(),
          style: ButtonStyles.DANGER
        },
        {
          caption: 'Reset Scale',
          onClick: () => testPanel.resetScale(),
          style: ButtonStyles.PURPLE
        }
      ]
    }
  });
  
  panelManager.addPanel(testPanel);
  
  return panelManager;
}

// Keyboard shortcuts for testing scaling
function keyPressed() {
  if (typeof g_draggablePanelManager === 'undefined') return;
  
  if (key === '+' || key === '=') {
    g_draggablePanelManager.scaleUp();
  } else if (key === '-' || key === '_') {
    g_draggablePanelManager.scaleDown();
  } else if (key === '0') {
    g_draggablePanelManager.resetScale();
  }
}

// Example usage in your main sketch:
/*
let panelManager;

function setup() {
  createCanvas(1200, 800);
  panelManager = setupScalingExample();
}

function draw() {
  background(50);
  
  // Update and render panels
  panelManager.update(mouseX, mouseY, mouseIsPressed);
  panelManager.render();
  
  // Instructions
  fill(255);
  textAlign(LEFT, TOP);
  textSize(16);
  text("Scaling & Word Wrapping Demo", 10, 10);
  text("Press +/- to scale all panels", 10, 30);
  text("Press 0 to reset scale", 10, 50);
  text("Try resizing window to see text wrap differently", 10, 70);
}
*/

// Additional utility functions for testing

/**
 * Create a button with intentionally long text to test wrapping
 */
function createLongTextButton(x, y, width, height) {
  return new Button(
    x, y, width, height,
    "This is an extremely long button caption that definitely needs to wrap across multiple lines to fit properly",
    {
      backgroundColor: '#3498db',
      hoverColor: '#2980b9',
      textColor: 'white',
      onClick: (btn) => {
        console.log('Long text button clicked!');
        // Test dynamic text change
        btn.setCaption("Text changed! Still very long though so it should still wrap nicely");
      }
    }
  );
}

/**
 * Demo function to show different scaling effects
 */
function demonstrateScaling() {
  const panel = new DraggablePanel({
    id: 'scale-demo',
    title: 'Scaling Demo Panel',
    position: { x: 100, y: 100 },
    size: { width: 250, height: 200 },
    buttons: {
      layout: 'vertical',
      spacing: 8,
      buttonWidth: 200,
      buttonHeight: 35,
      items: [
        {
          caption: 'Scale to 0.5x (Small)',
          onClick: () => panel.setScale(0.5),
          style: ButtonStyles.DEFAULT
        },
        {
          caption: 'Scale to 1.0x (Normal)',
          onClick: () => panel.setScale(1.0),
          style: ButtonStyles.SUCCESS
        },
        {
          caption: 'Scale to 1.5x (Large)',
          onClick: () => panel.setScale(1.5),
          style: ButtonStyles.WARNING
        },
        {
          caption: 'Scale to 2.0x (Extra Large)',
          onClick: () => panel.setScale(2.0),
          style: ButtonStyles.DANGER
        }
      ]
    }
  });
  
  return panel;
}

// Export for use in other files
if (typeof window !== 'undefined') {
  window.setupScalingExample = setupScalingExample;
  window.createLongTextButton = createLongTextButton;
  window.demonstrateScaling = demonstrateScaling;
}