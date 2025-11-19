/**
 * @fileoverview Presentation Panel System
 * Creates draggable panels for presentation state management and Kanban display
 * 
 * @author Software Engineering Team Delta
 * @version 1.0.0
 */

// Global presentation variables
let sprint5Image = null;
let presentationTimer = null;
let presentationStartTime = null;
let showSprintImageInMenu = false; // Toggle state for showing image in main menu

/**
 * Initialize the presentation system panels
 * Creates both the menu presentation panel and kanban transition panel
 */
function initializePresentationPanels() {
  try {
    // Check if DraggablePanelManager is available
    if (typeof DraggablePanelManager === 'undefined' || !window.draggablePanelManager) {
      console.error('❌ DraggablePanelManager not available for presentation panels');
      return false;
    }

    // Create the presentation control panel (visible in MENU state)
    const presentationPanel = window.draggablePanelManager.addPanel({
      id: 'presentation-control',
      title: 'Presentation Control',
      position: { x: 300, y: 100 },
      size: { width: 200, height: 120 },
      style: {
        backgroundColor: [60, 80, 40, 200],
        titleColor: [255, 255, 255],
        textColor: [255, 255, 255],
        borderColor: [100, 150, 100],
        titleBarHeight: 25,
        padding: 10,
        fontSize: 12
      },
      behavior: {
        draggable: true,
        persistent: true,
        constrainToScreen: true,
        snapToEdges: true
      },
      visible: false, // Start hidden, will be shown when in MENU state
      contentFunction: renderPresentationControlContent
    });

    // Create the kanban transition panel (visible in KANBAN state)
    const kanbanTransitionPanel = window.draggablePanelManager.addPanel({
      id: 'kanban-transition',
      title: 'Navigation',
      position: { x: 50, y: 400 },
      size: { width: 180, height: 100 },
      style: {
        backgroundColor: [80, 40, 40, 200],
        titleColor: [255, 255, 255],
        textColor: [255, 255, 255],
        borderColor: [150, 100, 100],
        titleBarHeight: 25,
        padding: 10,
        fontSize: 12
      },
      behavior: {
        draggable: true,
        persistent: true,
        constrainToScreen: true,
        snapToEdges: true
      },
      visible: false, // Start hidden, will be shown when in KANBAN state
      contentFunction: renderKanbanTransitionContent
    });

    return true;
  } catch (error) {
    console.error('❌ Error initializing presentation panels:', error);
    return false;
  }
}

/**
 * Render content for the presentation control panel (MENU state)
 */
function renderPresentationControlContent(panel, x, y, width, height) {
  if (typeof textAlign === 'undefined' || typeof fill === 'undefined') {
    return; // p5.js not available
  }

  // Set text properties
  textAlign(CENTER, CENTER);
  textSize(12);
  fill(255, 255, 255);

  const buttonWidth = 140;
  const buttonHeight = 35;
  const buttonX = x + (width - buttonWidth) / 2;
  const buttonY = y + (height - buttonHeight) / 2;

  // Presentation button
  const isHovered = mouseX >= buttonX && mouseX <= buttonX + buttonWidth && 
                    mouseY >= buttonY && mouseY <= buttonY + buttonHeight;
  
  if (isHovered) {
    fill(100, 150, 60, 180);
  } else {
    fill(60, 100, 40, 150);
  }
  
  rect(buttonX, buttonY, buttonWidth, buttonHeight);
  
  // Button border
  stroke(150, 200, 150);
  strokeWeight(2);
  noFill();
  rect(buttonX, buttonY, buttonWidth, buttonHeight);
  noStroke();

  // Button text
  fill(255, 255, 255);
  textAlign(CENTER, CENTER);
  textSize(14);
  text('Presentation', buttonX + buttonWidth/2, buttonY + buttonHeight/2);

  // Handle click
  if (isHovered && mouseIsPressed) {
    transitionToPresentation();
  }
}

/**
 * Render content for the kanban transition panel (KANBAN state)
 */
function renderKanbanTransitionContent(panel, x, y, width, height) {
  if (typeof textAlign === 'undefined' || typeof fill === 'undefined') {
    return; // p5.js not available
  }

  // Set text properties
  textAlign(CENTER, CENTER);
  textSize(12);
  fill(255, 255, 255);

  const buttonWidth = 120;
  const buttonHeight = 30;
  const buttonX = x + (width - buttonWidth) / 2;
  const buttonY = y + (height - buttonHeight) / 2;

  // Back to Game button
  const isHovered = mouseX >= buttonX && mouseX <= buttonX + buttonWidth && 
                    mouseY >= buttonY && mouseY <= buttonY + buttonHeight;
  
  if (isHovered) {
    fill(150, 60, 60, 180);
  } else {
    fill(100, 40, 40, 150);
  }
  
  rect(buttonX, buttonY, buttonWidth, buttonHeight);
  
  // Button border
  stroke(200, 100, 100);
  strokeWeight(2);
  noFill();
  rect(buttonX, buttonY, buttonWidth, buttonHeight);
  noStroke();

  // Button text
  fill(255, 255, 255);
  textAlign(CENTER, CENTER);
  textSize(12);
  text('Back to Game', buttonX + buttonWidth/2, buttonY + buttonHeight/2);

  // Handle click
  if (isHovered && mouseIsPressed) {
    transitionToPlaying();
  }
}

/**
 * Transition from MENU to KANBAN state and start presentation timer
 */
function transitionToPresentation() {
  if (typeof GameState !== 'undefined') {
    // Start the 5-minute countdown timer
    presentationStartTime = Date.now();
    presentationTimer = 5 * 60 * 1000; // 5 minutes in milliseconds
    
    // Transition to KANBAN state
    GameState.goToKanban();
    
  } else {
    console.error('❌ GameState not available for transition');
  }
}

/**
 * Transition from KANBAN back to PLAYING state
 */
function transitionToPlaying() {
  if (typeof GameState !== 'undefined') {
    // Reset presentation timer
    presentationTimer = null;
    presentationStartTime = null;
    
    // Transition to PLAYING state
    GameState.setState('PLAYING');
    
  } else {
    console.error('❌ GameState not available for transition');
  }
}

/**
 * Update presentation panels based on current game state
 */
function updatePresentationPanels(currentState) {
  if (!window.draggablePanelManager) return;

  // Show/hide panels based on current state
  if (currentState === 'MENU') {
    showPresentationControlPanel();
    hideKanbanTransitionPanel();
  } else if (currentState === 'KANBAN') {
    hidePresentationControlPanel();
    showKanbanTransitionPanel();
  } else {
    hidePresentationControlPanel();
    hideKanbanTransitionPanel();
  }

  // Update presentation timer
  if (currentState === 'KANBAN' && presentationStartTime && presentationTimer !== null) {
    const elapsed = Date.now() - presentationStartTime;
    presentationTimer = Math.max(0, (5 * 60 * 1000) - elapsed);
    
    // Auto-transition when timer expires
    if (presentationTimer <= 0) {
      if (typeof GameState !== 'undefined') {
        GameState.goToMenu();
      }
      presentationTimer = null;
      presentationStartTime = null;
    }
  }
}

/**
 * Get formatted time remaining for presentation timer
 * @returns {string} Formatted time string (MM:SS)
 */
function getPresentationTimeRemaining() {
  if (presentationTimer === null) return '00:00';
  
  const totalSeconds = Math.ceil(presentationTimer / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Show the presentation control panel
 */
function showPresentationControlPanel() {
  if (window.draggablePanelManager && window.draggablePanelManager.hasPanel('presentation-control')) {
    const panel = window.draggablePanelManager.getPanel('presentation-control');
    if (panel && typeof panel.show === 'function') {
      panel.show();
    }
  }
}

/**
 * Hide the presentation control panel
 */
function hidePresentationControlPanel() {
  if (window.draggablePanelManager && window.draggablePanelManager.hasPanel('presentation-control')) {
    const panel = window.draggablePanelManager.getPanel('presentation-control');
    if (panel && typeof panel.setVisible === 'function') {
      panel.setVisible(false);
    }
  }
}

/**
 * Show the kanban transition panel
 */
function showKanbanTransitionPanel() {
  if (window.draggablePanelManager && window.draggablePanelManager.hasPanel('kanban-transition')) {
    const panel = window.draggablePanelManager.getPanel('kanban-transition');
    if (panel && typeof panel.setVisible === 'function') {
      panel.setVisible(true);
    }
  }
}

/**
 * Hide the kanban transition panel
 */
function hideKanbanTransitionPanel() {
  if (window.draggablePanelManager && window.draggablePanelManager.hasPanel('kanban-transition')) {
    const panel = window.draggablePanelManager.getPanel('kanban-transition');
    if (panel && typeof panel.setVisible === 'function') {
      panel.setVisible(false);
    }
  }
}

/**
 * Load Sprint 5.png image for presentation display
 */
function loadPresentationAssets() {
  if (typeof loadImage !== 'undefined') {
    sprint5Image = loadImage('Images/KanBan/Sprint 6.png', 
      () => {
      },
      () => {
        console.warn('⚠️ Failed to load Sprint 5.png, using fallback');
        sprint5Image = null;
      }
    );
  }
}

/**
 * Render the Kanban presentation screen
 * Called by the UI_MENU layer when in KANBAN state
 */
function renderKanbanPresentation() {
  if (typeof fill === 'undefined') return;

  // Clear background with dark color
  background(20, 20, 30);

  // Display Sprint 5 image if loaded
  if (sprint5Image) {
    // Center the image on screen
    const imgWidth = Math.min(width * 0.8, sprint5Image.width);
    const imgHeight = (imgWidth / sprint5Image.width) * sprint5Image.height;
    const imgX = (width - imgWidth) / 2;
    const imgY = (height - imgHeight) / 2;
    
    image(sprint5Image, imgX, imgY, imgWidth, imgHeight);
  } else {
    // Fallback if image didn't load
    fill(100, 100, 120);
    textAlign(CENTER, CENTER);
    textSize(32);
    text('Sprint 5 Presentation', width / 2, height / 2);
    
    fill(80, 80, 100);
    textSize(16);
    text('(Sprint 5.png not found)', width / 2, height / 2 + 50);
  }

  // Display countdown timer in top-left corner
  if (presentationTimer !== null) {
    fill(255, 0, 0); // Red color
    textAlign(LEFT, TOP);
    textSize(24);
    text(getPresentationTimeRemaining(), 20, 20);
  } else {
    // Show static timer if not running
    fill(255, 0, 0);
    textAlign(LEFT, TOP);
    textSize(24);
    text('05:00', 20, 20);
  }
}

/**
 * Render Sprint 5 image overlay in the main menu
 * Called when showSprintImageInMenu is true
 */
function renderSprintImageInMenu() {
  if (typeof fill === 'undefined' || !sprint5Image || !showSprintImageInMenu) return;

  // Semi-transparent overlay background
  fill(0, 0, 0, 150);
  rect(0, 0, width, height);

  // Display Sprint 5 image if loaded
  if (sprint5Image) {
    // Center the image on screen with some padding
    const maxWidth = width * 0.9;
    const maxHeight = height * 0.9;

    let imgWidth = sprint5Image.width;
    let imgHeight = sprint5Image.height;
    
    // Scale down if too large
    if (imgWidth > maxWidth) {
      imgHeight = (imgHeight * maxWidth) / imgWidth;
      imgWidth = maxWidth;
    }
    if (imgHeight > maxHeight) {
      imgWidth = (imgWidth * maxHeight) / imgHeight;
      imgHeight = maxHeight;
    }
    
    const imgX = g_canvasX/2;
    const imgY = g_canvasY/2;

    image(sprint5Image, imgX, imgY, imgWidth, imgHeight);
    
    // Add "Press Shift+Z to toggle" text
    fill(255, 255, 255, 200);
    textAlign(RIGHT, BOTTOM);
    textSize(14);
    text('Press Shift+Z to toggle', width - 20, height - 20);
  }
}

/**
 * Toggle the Sprint 5 image visibility in main menu
 */
function toggleSprintImageInMenu() {
  showSprintImageInMenu = !showSprintImageInMenu;
}

/**
 * Get current state of Sprint image toggle
 * @returns {boolean} Current toggle state
 */
function getSprintImageToggleState() {
  return showSprintImageInMenu;
}

// Export functions for browser usage
if (typeof window !== 'undefined') {
  window.initializePresentationPanels = initializePresentationPanels;
  window.updatePresentationPanels = updatePresentationPanels;
  window.loadPresentationAssets = loadPresentationAssets;
  window.renderKanbanPresentation = renderKanbanPresentation;
  window.getPresentationTimeRemaining = getPresentationTimeRemaining;
  window.transitionToPresentation = transitionToPresentation;
  window.transitionToPlaying = transitionToPlaying;
  window.renderSprintImageInMenu = renderSprintImageInMenu;
  window.toggleSprintImageInMenu = toggleSprintImageInMenu;
  window.getSprintImageToggleState = getSprintImageToggleState;
}