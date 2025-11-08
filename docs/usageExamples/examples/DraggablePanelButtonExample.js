/**
 * @fileoverview Example usage of DraggablePanel with button arrays
 * Shows how to create panels with different button layouts and functionality
 * 
 */

// Example 1: Vertical button layout panel
function createVerticalButtonPanel() {
  return new DraggablePanel({
    id: 'vertical-buttons',
    title: 'Tools Panel',
    position: { x: 50, y: 100 },
    size: { width: 150, height: 200 },
    buttons: {
      layout: 'vertical',
      spacing: 5,
      buttonWidth: 120,
      buttonHeight: 30,
      items: [
        {
          caption: 'Spawn Ant',
          onClick: () => {
            console.log('Spawning ant...');
            // Your ant spawning logic here
          },
          style: ButtonStyles.SUCCESS
        },
        {
          caption: 'Clear All',
          onClick: () => {
            console.log('Clearing all...');
            // Your clearing logic here
          },
          style: ButtonStyles.DANGER
        },
        {
          caption: 'Settings',
          onClick: () => {
            console.log('Opening settings...');
            // Your settings logic here
          },
          style: ButtonStyles.DEFAULT
        }
      ]
    }
  });
}

// Example 2: Horizontal button layout panel
function createHorizontalButtonPanel() {
  return new DraggablePanel({
    id: 'horizontal-buttons',
    title: 'Actions',
    position: { x: 250, y: 100 },
    size: { width: 400, height: 100 },
    buttons: {
      layout: 'horizontal',
      spacing: 10,
      buttonWidth: 80,
      buttonHeight: 35,
      items: [
        {
          caption: 'Play',
          onClick: () => console.log('Play clicked'),
          style: ButtonStyles.SUCCESS
        },
        {
          caption: 'Pause',
          onClick: () => console.log('Pause clicked'),
          style: ButtonStyles.WARNING
        },
        {
          caption: 'Stop',
          onClick: () => console.log('Stop clicked'),
          style: ButtonStyles.DANGER
        },
        {
          caption: 'Reset',
          onClick: () => console.log('Reset clicked'),
          style: ButtonStyles.DEFAULT
        }
      ]
    }
  });
}

// Example 3: Grid layout with image buttons
function createGridButtonPanel() {
  return new DraggablePanel({
    id: 'grid-buttons',
    title: 'Resource Panel',
    position: { x: 100, y: 300 },
    size: { width: 200, height: 180 },
    buttons: {
      layout: 'grid',
      columns: 2,
      spacing: 8,
      buttonWidth: 70,
      buttonHeight: 50,
      items: [
        {
          caption: 'Wood',
          image: null, // You can set images here: loadImage('wood-icon.png')
          onClick: () => console.log('Wood resource selected'),
          style: ButtonStyles.DEFAULT
        },
        {
          caption: 'Food',
          onClick: () => console.log('Food resource selected'),
          style: ButtonStyles.SUCCESS
        },
        {
          caption: 'Stone',
          onClick: () => console.log('Stone resource selected'),
          style: ButtonStyles.DEFAULT
        },
        {
          caption: 'Info',
          onClick: () => console.log('Resource info'),
          style: ButtonStyles.PURPLE
        }
      ]
    }
  });
}

// Example 4: Panel with custom content AND buttons
function createMixedContentPanel() {
  return new DraggablePanel({
    id: 'mixed-content',
    title: 'Game Stats',
    position: { x: 400, y: 200 },
    size: { width: 250, height: 300 },
    buttons: {
      layout: 'horizontal',
      spacing: 5,
      buttonWidth: 60,
      buttonHeight: 25,
      items: [
        {
          caption: 'Save',
          onClick: () => console.log('Game saved'),
          style: ButtonStyles.SUCCESS
        },
        {
          caption: 'Load',
          onClick: () => console.log('Game loaded'),
          style: ButtonStyles.DEFAULT
        },
        {
          caption: 'Export',
          onClick: () => console.log('Stats exported'),
          style: ButtonStyles.PURPLE
        }
      ]
    }
  });
}

// Usage example in your main game code:
let gamePanels = [];

function setupPanels() {
  gamePanels = [
    createVerticalButtonPanel(),
    createHorizontalButtonPanel(),
    createGridButtonPanel(),
    createMixedContentPanel()
  ];

  g_draggablePanelManager.addPanels('testPanel', gamePanels);
  g_draggablePanelManager.setPanelVisibility('testPanel', ['PLAYING']);
}

function updatePanels() {
  if (typeof mouseX !== 'undefined' && typeof mouseY !== 'undefined') {
    gamePanels.forEach(panel => {
      panel.update(mouseX, mouseY, mouseIsPressed);
    });
  }
}

function renderPanels() {
  gamePanels.forEach(panel => {
    // Render with custom content (for mixed content panel)
    if (panel.config.id === 'mixed-content') {
      panel.render((contentArea, style) => {
        // Custom content above buttons
        fill(style.textColor);
        textAlign(LEFT, TOP);
        textSize(12);
        
        let yOffset = 0;
        const lineHeight = 16;
        
        text(`Ants: ${typeof ants !== 'undefined' ? ants.length : 0}`, contentArea.x, contentArea.y + yOffset);
        yOffset += lineHeight;
        
        text(`Resources: ${typeof g_resourceList !== 'undefined' ? (g_resourceList.resources ? g_resourceList.resources.length : 0) : 0}`, contentArea.x, contentArea.y + yOffset);
        yOffset += lineHeight;
        
        text(`Score: ${Math.floor(Math.random() * 1000)}`, contentArea.x, contentArea.y + yOffset);
      });
    } else {
      // Render panels with just buttons
      panel.render();
    }
  });
}

// Dynamic button management example
function addButtonToPanel(panelId, buttonConfig) {
  const panel = gamePanels.find(p => p.config.id === panelId);
  if (panel) {
    panel.addButton(buttonConfig);
  }
}

function removeButtonFromPanel(panelId, buttonIndex) {
  const panel = gamePanels.find(p => p.config.id === panelId);
  if (panel) {
    panel.removeButton(buttonIndex);
  }
}

// Example of adding a button dynamically
function exampleAddButton() {
  addButtonToPanel('vertical-buttons', {
    caption: 'Debug',
    onClick: () => console.log('Debug mode toggled'),
    style: ButtonStyles.WARNING
  });
}

// Make functions available globally
if (typeof window !== 'undefined') {
  window.createVerticalButtonPanel = createVerticalButtonPanel;
  window.createHorizontalButtonPanel = createHorizontalButtonPanel;
  window.createGridButtonPanel = createGridButtonPanel;
  window.createMixedContentPanel = createMixedContentPanel;
  window.setupPanels = setupPanels;
  window.updatePanels = updatePanels;
  window.renderPanels = renderPanels;
  window.addButtonToPanel = addButtonToPanel;
  window.removeButtonFromPanel = removeButtonFromPanel;
  window.exampleAddButton = exampleAddButton;
}