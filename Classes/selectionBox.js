let isSelecting = false;
let selectionStart = null;
let selectionEnd = null;
let selectedEntities = [];

// Deselect all entities
function deselectAllEntities() {
  selectedEntities.forEach(entity => entity.isSelected = false);
  selectedEntities = [];
  // Also clear single selected ant if it exists
  if (typeof selectedAnt !== "undefined" && selectedAnt) {
    selectedAnt.isSelected = false;
    selectedAnt = null;
  }
}

// Abstract: checks if entity center is inside box
function isEntityInBox(entity, x1, x2, y1, y2) {
  const pos = entity.getPosition ? entity.getPosition() : entity.sprite.pos;
  const size = entity.getSize ? entity.getSize() : entity.sprite.size;
  const cx = pos.x + size.x / 2;
  const cy = pos.y + size.y / 2;
  return (cx >= x1 && cx <= x2 && cy >= y1 && cy <= y2);
}

// Abstract: checks if entity is under mouse
function isEntityUnderMouse(entity, mx, my) {
  // Safety check: ensure entity exists
  if (!entity) return false;
  
  if (entity.isMouseOver && typeof entity.isMouseOver === 'function') {
    return entity.isMouseOver(mx, my);
  }
  
  // Fallback to manual calculation
  const pos = entity.getPosition ? entity.getPosition() : (entity.sprite ? entity.sprite.pos : { x: entity.posX || 0, y: entity.posY || 0 });
  const size = entity.getSize ? entity.getSize() : (entity.sprite ? entity.sprite.size : { x: entity.sizeX || 32, y: entity.sizeY || 32 });
  
  // Safety check: ensure pos and size exist
  if (!pos || !size) return false;
  
  return (
    mx >= pos.x &&
    mx <= pos.x + size.x &&
    my >= pos.y &&
    my <= pos.y + size.y
  );
}

// Handles mouse press for selection box and group movement
function handleMousePressed(entities, mouseX, mouseY, selectEntityCallback, selectedEntity, moveSelectedEntityToTile, TILE_SIZE, mousePressed) {
  // Spread out multi-selected entities around the clicked location
  if (selectedEntities.length > 1 && mousePressed === LEFT) {
    moveSelectedAntsToTile(mouseX, mouseY, TILE_SIZE);
    deselectAllEntities();
    return;
  } else if (mousePressed == RIGHT) {
    deselectAllEntities();
    return;
  }

  // Check if an entity was clicked for single selection
  let entityWasClicked = false;
  for (let i = 0; i < entities.length; i++) {
    // Safety check: ensure entity exists and is valid
    if (!entities[i]) continue;
    
    let entity = entities[i].antObject ? entities[i].antObject : entities[i];
    
    // Safety check: ensure entity has required methods
    if (!entity || typeof entity.isMouseOver !== 'function') continue;
    
    if (isEntityUnderMouse(entity, mouseX, mouseY)) {
      // Safety check: ensure callback exists before calling
      if (typeof selectEntityCallback === 'function') {
        selectEntityCallback();
      }
      entityWasClicked = true;
      break;
    }
  }

  // If no entity was clicked, start box selection (regardless of whether an entity is selected)
  if (!entityWasClicked) {
    isSelecting = true;
    selectionStart = createVector(mouseX, mouseY);
    selectionEnd = selectionStart.copy();
  }
}

// Handles mouse drag for updating selection box
function handleMouseDragged(mouseX, mouseY, entities) {
  if (isSelecting) {
    selectionEnd = createVector(mouseX, mouseY);

    let x1 = Math.min(selectionStart.x, selectionEnd.x);
    let x2 = Math.max(selectionStart.x, selectionEnd.x);
    let y1 = Math.min(selectionStart.y, selectionEnd.y);
    let y2 = Math.max(selectionStart.y, selectionEnd.y);

    for (let i = 0; i < entities.length; i++) {
      // Safety check: ensure entity exists
      if (!entities[i]) continue;
      
      let entity = entities[i].antObject ? entities[i].antObject : entities[i];
      
      // Safety check: ensure entity is valid
      if (!entity) continue;
      
      entity.isBoxHovered = isEntityInBox(entity, x1, x2, y1, y2);
    }
  }
}

// Handles mouse release for selecting entities in box
function handleMouseReleased(entities, selectedEntity, moveSelectedEntityToTile, tileSize) {
  if (isSelecting) {
    selectedEntities = [];
    let x1 = Math.min(selectionStart.x, selectionEnd.x);
    let x2 = Math.max(selectionStart.x, selectionEnd.x);
    let y1 = Math.min(selectionStart.y, selectionEnd.y);
    let y2 = Math.max(selectionStart.y, selectionEnd.y);

    // Check if this was a small drag (click) vs a real selection box
    const dragDistance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    const isClick = dragDistance < 5; // Less than 5 pixels is considered a click

    // If it was a click and we have a selected ant, move it
    if (isClick && selectedEntity && typeof moveSelectedEntityToTile === 'function') {
      moveSelectedEntityToTile(selectionStart.x, selectionStart.y, tileSize);
    } else {
      // Otherwise, do box selection
      for (let i = 0; i < entities.length; i++) {
        // Safety check: ensure entity exists
        if (!entities[i]) continue;
        
        let entity = entities[i].antObject ? entities[i].antObject : entities[i];
        
        // Safety check: ensure entity is valid
        if (!entity) continue;
        
        entity.isSelected = isEntityInBox(entity, x1, x2, y1, y2);
        entity.isBoxHovered = false;
        if (entity.isSelected) selectedEntities.push(entity);
      }
    }
    
    isSelecting = false;
    selectionStart = null;
    selectionEnd = null;
  }
}

// Draws the selection box
function drawSelectionBox() {
  if (isSelecting && selectionStart && selectionEnd) {
    push();
    noFill();
    stroke(0, 150, 255);
    strokeWeight(2);
    rectMode(CORNERS);
    rect(selectionStart.x, selectionStart.y, selectionEnd.x, selectionEnd.y);
    pop();
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    handleMousePressed,
    handleMouseDragged,
    handleMouseReleased,
    drawSelectionBox,
    selectedEntities
  };
}

// --- Abstract Highlighting Functions ---

// Highlight an entity with a specific color and style
function highlightEntity(entity, highlightType = "selected", customColor = null) {
  const pos = entity.getPosition ? entity.getPosition() : entity.sprite?.pos || { x: entity.posX, y: entity.posY };
  const size = entity.getSize ? entity.getSize() : entity.sprite?.size || { x: entity.sizeX, y: entity.sizeY };
  
  if (!pos || !size) return; // Safety check
  
  push();
  noFill();
  strokeWeight(2);
  
  // Define highlight colors and styles
  switch (highlightType) {
    case "selected":
      stroke(customColor || color(0, 0, 255)); // Blue for selected
      break;
    case "hover":
      stroke(customColor || color(255, 255, 0)); // Yellow for hover
      break;
    case "boxHovered":
      stroke(customColor || color(0, 255, 0)); // Green for box selection
      break;
    case "combat":
      stroke(customColor || color(255, 0, 0)); // Red for combat
      strokeWeight(1);
      rect(pos.x - 2, pos.y - 2, size.x + 4, size.y + 4);
      pop();
      return;
    case "custom":
      stroke(customColor || color(255, 255, 255)); // White default
      break;
    default:
      stroke(color(255, 255, 255)); // White fallback
  }
  
  rect(pos.x, pos.y, size.x, size.y);
  pop();
}

// Render state indicators for an entity
function renderStateIndicators(entity) {
  const pos = entity.getPosition ? entity.getPosition() : entity.sprite?.pos || { x: entity.posX, y: entity.posY };
  const size = entity.getSize ? entity.getSize() : entity.sprite?.size || { x: entity.sizeX, y: entity.sizeY };
  
  if (!pos || !size || !entity._stateMachine) return; // Safety check
  
  push();
  
  // Building state indicator
  if (entity._stateMachine.isBuilding && entity._stateMachine.isBuilding()) {
    fill(139, 69, 19); // Brown
    noStroke();
    ellipse(pos.x + size.x - 5, pos.y + 5, 6, 6);
  }
  
  // Gathering state indicator
  if (entity._stateMachine.isGathering && entity._stateMachine.isGathering()) {
    fill(0, 255, 0); // Green
    noStroke();
    ellipse(pos.x + size.x - 5, pos.y + 5, 6, 6);
  }
  
  // Following state indicator
  if (entity._stateMachine.isFollowing && entity._stateMachine.isFollowing()) {
    fill(255, 255, 0); // Yellow
    noStroke();
    ellipse(pos.x + size.x - 5, pos.y + 5, 6, 6);
  }
  
  // Terrain effect indicators
  if (entity._stateMachine.terrainModifier && entity._stateMachine.terrainModifier !== "DEFAULT") {
    let terrainColor;
    switch (entity._stateMachine.terrainModifier) {
      case "IN_WATER": terrainColor = color(0, 100, 255); break;
      case "IN_MUD": terrainColor = color(101, 67, 33); break;
      case "ON_SLIPPERY": terrainColor = color(200, 200, 255); break;
      case "ON_ROUGH": terrainColor = color(100, 100, 100); break;
      default: terrainColor = color(255);
    }
    
    fill(terrainColor);
    noStroke();
    rect(pos.x, pos.y + size.y - 3, size.x, 3);
  }
  
  pop();
}

// Render debug information for selected entity
function renderDebugInfo(entity) {
  if (typeof devConsoleEnabled === 'undefined' || !devConsoleEnabled) return;
  
  const pos = entity.getPosition ? entity.getPosition() : entity.sprite?.pos || { x: entity.posX, y: entity.posY };
  
  if (!pos || !entity.getCurrentState) return; // Safety check
  
  push();
  noStroke();
  fill(255);
  textAlign(LEFT);
  textSize(10);
  text(`State: ${entity.getCurrentState()}`, pos.x, pos.y - 30);
  text(`Faction: ${entity._faction || entity.faction || 'unknown'}`, pos.x, pos.y - 20);
  if (entity.getEffectiveMovementSpeed) {
    text(`Speed: ${entity.getEffectiveMovementSpeed().toFixed(1)}`, pos.x, pos.y - 10);
  }
  pop();
}

// Export for Node.js testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    handleMousePressed,
    handleMouseDragged,
    handleMouseReleased,
    drawSelectionBox,
    deselectAllEntities,
    isEntityInBox,
    isEntityUnderMouse,
    renderDebugInfo
  };
}

