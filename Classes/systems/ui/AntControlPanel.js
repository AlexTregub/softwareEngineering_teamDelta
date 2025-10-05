/**
 * @fileoverview Ant Spawning Control Panel
 * Provides a draggable UI panel with buttons for spawning ants and changing states
 * 
 * @author Software Engineering Team Delta
 * @version 1.0.0
 */

/**
 * Initialize the Ant Control Panel with spawning and state management buttons
 * @returns {boolean} Success status
 */
function initializeAntControlPanel() {
  try {
    // Check if DraggablePanelManager is available
    if (typeof DraggablePanelManager === 'undefined') {
      console.error('❌ DraggablePanelManager not loaded for ant control panel');
      return false;
    }

    if (!window.draggablePanelManager) {
      console.error('❌ DraggablePanelManager instance not created');
      return false;
    }

    // Create the ant control panel
    const antControlPanel = window.draggablePanelManager.addPanel({
      id: 'ant-control',
      title: 'Ant Control Panel',
      position: { x: 520, y: 20 },
      size: { width: 280, height: 320 },
      style: {
        backgroundColor: [40, 40, 80, 200],
        titleColor: [255, 255, 255],
        textColor: [255, 255, 255],
        borderColor: [100, 100, 150],
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
      visible: true,
      // Custom content function for the panel
      contentFunction: renderAntControlPanelContent
    });

    console.log('✅ Ant Control Panel created');
    
    // Ensure panel is visible and force update
    if (antControlPanel && typeof antControlPanel.setVisible === 'function') {
      antControlPanel.setVisible(true);
      console.log('✅ Ant Control Panel visibility explicitly set to true');
    }
    
    // Log panel manager state for debugging
    if (window.draggablePanelManager) {
      console.log(`📊 Panel Manager Stats: ${window.draggablePanelManager.getPanelCount()} panels registered`);
      console.log(`👁️ Visible panels: ${window.draggablePanelManager.getVisiblePanelCount()}`);
    }

    // Delayed visibility check and force show (in case of initialization timing issues)
    setTimeout(() => {
      if (window.draggablePanelManager && window.draggablePanelManager.hasPanel('ant-control')) {
        const isVisible = window.draggablePanelManager.isPanelVisible('ant-control');
        console.log(`🔍 Delayed check - Ant Control Panel visible: ${isVisible}`);
        
        if (!isVisible) {
          console.log('⚡ Panel was not visible, forcing visibility...');
          showAntControlPanel();
        }
      }
    }, 1000);

    // Add keyboard shortcut to toggle panel (Shift+N)
    if (typeof g_keyboardController !== 'undefined' && g_keyboardController) {
      g_keyboardController.onKeyPress((keyCode, key) => {
        if (keyPressed && keyCode === 78 && (keyIsDown(SHIFT)) && !(keyIsDown(CONTROL))) { // Shift+N
          antControlPanel.toggleVisibility();
        }
      });
    }

    return true;
  } catch (error) {
    console.error('❌ Error initializing ant control panel:', error);
    return false;
  }
}

/**
 * Render content for the ant control panel
 * @param {Object} panel - Panel object
 * @param {number} x - Panel content x position
 * @param {number} y - Panel content y position
 * @param {number} width - Panel content width
 * @param {number} height - Panel content height
 */
function renderAntControlPanelContent(panel, x, y, width, height) {
  if (typeof textAlign === 'undefined' || typeof fill === 'undefined') {
    return; // p5.js not available
  }

  // Set text properties
  textAlign(LEFT, TOP);
  textSize(12);
  fill(255, 255, 255);

  const buttonWidth = 80;
  const buttonHeight = 25;
  const buttonSpacing = 5;
  const sectionSpacing = 15;
  let currentY = y;

  // === SPAWNING SECTION ===
  fill(200, 200, 255);
  text('SPAWN ANTS:', x, currentY);
  currentY += 18;

  // Job buttons row 1
  const jobs1 = ['Builder', 'Scout', 'Farmer'];
  for (let i = 0; i < jobs1.length; i++) {
    const btnX = x + i * (buttonWidth + buttonSpacing);
    renderJobSpawnButton(jobs1[i], btnX, currentY, buttonWidth, buttonHeight);
  }
  currentY += buttonHeight + buttonSpacing;

  // Job buttons row 2
  const jobs2 = ['Warrior', 'Spitter'];
  for (let i = 0; i < jobs2.length; i++) {
    const btnX = x + i * (buttonWidth + buttonSpacing);
    renderJobSpawnButton(jobs2[i], btnX, currentY, buttonWidth, buttonHeight);
  }
  currentY += buttonHeight + sectionSpacing;

  // === FACTION SECTION ===
  fill(255, 200, 200);
  text('FACTIONS:', x, currentY);
  currentY += 18;

  const factions = ['red', 'blue', 'neutral'];
  for (let i = 0; i < factions.length; i++) {
    const btnX = x + i * (buttonWidth + buttonSpacing);
    renderFactionButton(factions[i], btnX, currentY, buttonWidth, buttonHeight);
  }
  currentY += buttonHeight + sectionSpacing;

  // === STATE CONTROL SECTION ===
  fill(200, 255, 200);
  text('SELECTED ANTS STATE:', x, currentY);
  currentY += 18;

  // State buttons row 1
  const states1 = ['IDLE', 'GATHER', 'PATROL'];
  for (let i = 0; i < states1.length; i++) {
    const btnX = x + i * (buttonWidth + buttonSpacing);
    renderStateButton(states1[i], btnX, currentY, buttonWidth, buttonHeight);
  }
  currentY += buttonHeight + buttonSpacing;

  // State buttons row 2  
  const states2 = ['COMBAT', 'BUILD'];
  for (let i = 0; i < states2.length; i++) {
    const btnX = x + i * (buttonWidth + buttonSpacing);
    renderStateButton(states2[i], btnX, currentY, buttonWidth, buttonHeight);
  }

  // Show selected ants count
  if (typeof ants !== 'undefined' && typeof AntUtilities !== 'undefined') {
    const selectedCount = AntUtilities.getSelectedAnts(ants).length;
    fill(255, 255, 0);
    text(`Selected: ${selectedCount}`, x, currentY + buttonHeight + 10);
  }
}

/**
 * Render a job spawn button
 * @param {string} jobName - Job name
 * @param {number} x - Button x position
 * @param {number} y - Button y position
 * @param {number} w - Button width
 * @param {number} h - Button height
 */
function renderJobSpawnButton(jobName, x, y, w, h) {
  // Button background
  const isHovered = mouseX >= x && mouseX <= x + w && mouseY >= y && mouseY <= y + h;
  
  if (isHovered) {
    fill(100, 150, 100, 180);
  } else {
    fill(60, 80, 60, 150);
  }
  
  rect(x, y, w, h);
  
  // Button border
  stroke(150, 150, 150);
  strokeWeight(1);
  noFill();
  rect(x, y, w, h);
  noStroke();

  // Button text
  fill(255, 255, 255);
  textAlign(CENTER, CENTER);
  text(jobName, x + w/2, y + h/2);

  // Handle click
  if (isHovered && mouseIsPressed && typeof AntUtilities !== 'undefined') {
    const spawnX = mouseX + 50; // Spawn near cursor
    const spawnY = mouseY + 50;
    const currentFaction = getSelectedFaction();
    
    AntUtilities.spawnAnt(spawnX, spawnY, jobName, currentFaction);
    console.log(`Spawned ${jobName} ant with faction ${currentFaction}`);
  }
}

/**
 * Render a faction selection button
 * @param {string} factionName - Faction name
 * @param {number} x - Button x position
 * @param {number} y - Button y position
 * @param {number} w - Button width
 * @param {number} h - Button height
 */
function renderFactionButton(factionName, x, y, w, h) {
  const isSelected = getSelectedFaction() === factionName;
  const isHovered = mouseX >= x && mouseX <= x + w && mouseY >= y && mouseY <= y + h;
  
  // Button background with faction colors
  let bgColor;
  if (factionName === 'red') {
    bgColor = isSelected ? [150, 50, 50, 200] : [100, 30, 30, 150];
  } else if (factionName === 'blue') {
    bgColor = isSelected ? [50, 50, 150, 200] : [30, 30, 100, 150];
  } else {
    bgColor = isSelected ? [100, 100, 100, 200] : [60, 60, 60, 150];
  }
  
  if (isHovered) {
    bgColor = bgColor.map(c => c + 30);
  }
  
  fill(bgColor[0], bgColor[1], bgColor[2], bgColor[3]);
  rect(x, y, w, h);
  
  // Button border (thicker if selected)
  stroke(200, 200, 200);
  strokeWeight(isSelected ? 2 : 1);
  noFill();
  rect(x, y, w, h);
  noStroke();

  // Button text
  fill(255, 255, 255);
  textAlign(CENTER, CENTER);
  text(factionName.toUpperCase(), x + w/2, y + h/2);

  // Handle click
  if (isHovered && mouseIsPressed) {
    setSelectedFaction(factionName);
  }
}

/**
 * Render a state change button
 * @param {string} stateName - State name
 * @param {number} x - Button x position
 * @param {number} y - Button y position
 * @param {number} w - Button width
 * @param {number} h - Button height
 */
function renderStateButton(stateName, x, y, w, h) {
  const isHovered = mouseX >= x && mouseX <= x + w && mouseY >= y && mouseY <= y + h;
  
  // Button background
  if (isHovered) {
    fill(100, 100, 150, 180);
  } else {
    fill(60, 60, 100, 150);
  }
  
  rect(x, y, w, h);
  
  // Button border
  stroke(150, 150, 200);
  strokeWeight(1);
  noFill();
  rect(x, y, w, h);
  noStroke();

  // Button text
  fill(255, 255, 255);
  textAlign(CENTER, CENTER);
  text(stateName, x + w/2, y + h/2);

  // Handle click
  if (isHovered && mouseIsPressed && typeof AntUtilities !== 'undefined' && typeof ants !== 'undefined') {
    switch(stateName) {
      case 'IDLE':
        AntUtilities.setSelectedAntsIdle(ants);
        break;
      case 'GATHER':
        AntUtilities.setSelectedAntsGathering(ants);
        break;
      case 'PATROL':
        AntUtilities.setSelectedAntsPatrol(ants);
        break;
      case 'COMBAT':
        AntUtilities.setSelectedAntsCombat(ants);
        break;
      case 'BUILD':
        AntUtilities.setSelectedAntsBuilding(ants);
        break;
    }
  }
}

// Global faction selection state
let selectedFaction = 'neutral';

/**
 * Get currently selected faction for spawning
 * @returns {string} Current faction
 */
function getSelectedFaction() {
  return selectedFaction;
}

/**
 * Set the faction for spawning
 * @param {string} faction - Faction name
 */
function setSelectedFaction(faction) {
  selectedFaction = faction;
}

/**
 * Show the ant control panel
 */
function showAntControlPanel() {
  if (window.draggablePanelManager && window.draggablePanelManager.hasPanel('ant-control')) {
    const panel = window.draggablePanelManager.getPanel('ant-control');
    if (panel && typeof panel.setVisible === 'function') {
      panel.setVisible(true);
      console.log('👁️ Ant Control Panel is now visible');
    } else {
      // Fallback method if setVisible doesn't exist
      window.draggablePanelManager.showPanel('ant-control');
      console.log('👁️ Ant Control Panel shown via showPanel');
    }
  } else {
    console.error('❌ Cannot show panel - DraggablePanelManager or panel not available');
  }
}

/**
 * Hide the ant control panel
 */
function hideAntControlPanel() {
  if (window.draggablePanelManager && window.draggablePanelManager.hasPanel('ant-control')) {
    const panel = window.draggablePanelManager.getPanel('ant-control');
    if (panel && typeof panel.setVisible === 'function') {
      panel.setVisible(false);
      console.log('👁️ Ant Control Panel is now hidden');
    } else {
      // Fallback method
      window.draggablePanelManager.hidePanel('ant-control');
      console.log('👁️ Ant Control Panel hidden via hidePanel');
    }
  } else {
    console.error('❌ Cannot hide panel - DraggablePanelManager or panel not available');
  }
}

/**
 * Toggle the ant control panel visibility
 */
function toggleAntControlPanel() {
  if (window.draggablePanelManager && window.draggablePanelManager.hasPanel('ant-control')) {
    const panel = window.draggablePanelManager.getPanel('ant-control');
    if (panel && typeof panel.toggleVisibility === 'function') {
      panel.toggleVisibility();
      console.log('👁️ Ant Control Panel visibility toggled');
    } else {
      // Try to determine current state and toggle
      const isVisible = window.draggablePanelManager.isPanelVisible('ant-control');
      if (isVisible) {
        hideAntControlPanel();
      } else {
        showAntControlPanel();
      }
    }
  } else {
    console.error('❌ Cannot toggle panel - DraggablePanelManager or panel not available');
  }
}

// Export for browser usage
if (typeof window !== 'undefined') {
  window.initializeAntControlPanel = initializeAntControlPanel;
  window.renderAntControlPanelContent = renderAntControlPanelContent;
  window.getSelectedFaction = getSelectedFaction;
  window.setSelectedFaction = setSelectedFaction;
  window.showAntControlPanel = showAntControlPanel;
  window.hideAntControlPanel = hideAntControlPanel;
  window.toggleAntControlPanel = toggleAntControlPanel;
}