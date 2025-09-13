let isSelecting = false;
let selectionStart = null;
let selectionEnd = null;
let selectedEntities = [];

// Deselect all entities
function deselectAllEntities() {
  selectedEntities.forEach(entity => entity.isSelected = false);
  selectedEntities = [];
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
  if (entity.isMouseOver) return entity.isMouseOver(mx, my);
  const pos = entity.getPosition ? entity.getPosition() : entity.sprite.pos;
  const size = entity.getSize ? entity.getSize() : entity.sprite.size;
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
    const radius = 40;
    const angleStep = (2 * Math.PI) / selectedEntities.length;
    for (let i = 0; i < selectedEntities.length; i++) {
      const angle = i * angleStep;
      const offsetX = Math.cos(angle) * radius;
      const offsetY = Math.sin(angle) * radius;
      if (selectedEntities[i].moveToLocation)
        selectedEntities[i].moveToLocation(mouseX + offsetX, mouseY + offsetY);
      selectedEntities[i].isSelected = false;
    }
    deselectAllEntities();
    return;
  } else if (selectedEntities.length === 1 && mousePressed === RIGHT) {
    deselectAllEntities();
    return;
  }

  // Check if an entity was clicked for single selection
  let entityWasClicked = false;
  for (let i = 0; i < entities.length; i++) {
    let entity = entities[i].antObject ? entities[i].antObject : entities[i];
    if (isEntityUnderMouse(entity, mouseX, mouseY)) {
      selectEntityCallback();
      entityWasClicked = true;
      break;
    }
  }
  // If no entity was clicked and one is selected, move it to the tile
  if (!entityWasClicked && selectedEntity && moveSelectedEntityToTile) {
    moveSelectedEntityToTile(mouseX, mouseY, TILE_SIZE);
  }
  // If no entity was clicked, start box selection
  if (!entityWasClicked && !selectedEntity) {
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
      let entity = entities[i].antObject ? entities[i].antObject : entities[i];
      entity.isBoxHovered = isEntityInBox(entity, x1, x2, y1, y2);
    }
  }
}

// Handles mouse release for selecting entities in box
function handleMouseReleased(entities) {
  if (isSelecting) {
    selectedEntities = [];
    let x1 = Math.min(selectionStart.x, selectionEnd.x);
    let x2 = Math.max(selectionStart.x, selectionEnd.x);
    let y1 = Math.min(selectionStart.y, selectionEnd.y);
    let y2 = Math.max(selectionStart.y, selectionEnd.y);

    for (let i = 0; i < entities.length; i++) {
      let entity = entities[i].antObject ? entities[i].antObject : entities[i];
      entity.isSelected = isEntityInBox(entity, x1, x2, y1, y2);
      entity.isBoxHovered = false;
      if (entity.isSelected) selectedEntities.push(entity);
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

