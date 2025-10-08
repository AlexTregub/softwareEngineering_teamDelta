// Mock selection box for testing
let isSelecting = false;
let selectionStart = null;
let selectionEnd = null;
let selectedEntities = [];

function deselectAllEntities() {
  selectedEntities.forEach(entity => entity.isSelected = false);
  selectedEntities = [];
}

function isEntityInBox(entity, x1, x2, y1, y2) {
  const pos = entity.getPosition ? entity.getPosition() : entity._sprite.pos;
  const size = entity.getSize ? entity.getSize() : entity._sprite.size;
  const cx = pos.x + size.x / 2;
  const cy = pos.y + size.y / 2;
  return (cx >= x1 && cx <= x2 && cy >= y1 && cy <= y2);
}

function isEntityUnderMouse(entity, mx, my) {
  if (entity.isMouseOver) return entity.isMouseOver(mx, my);
  const pos = entity.getPosition ? entity.getPosition() : entity._sprite.pos;
  const size = entity.getSize ? entity.getSize() : entity._sprite.size;
  return (
    mx >= pos.x &&
    mx <= pos.x + size.x &&
    my >= pos.y &&
    my <= pos.y + size.y
  );
}

function handleMousePressed(entities, mouseX, mouseY, selectEntityCallback, selectedEntity, moveSelectedEntityToTile, TILE_SIZE, mousePressed) {
  // Check if an entity was clicked for single selection
  let entityWasClicked = false;
  for (let i = 0; i < entities.length; i++) {
    let entity = entities[i].antObject ? entities[i].antObject : entities[i];
    if (isEntityUnderMouse(entity, mouseX, mouseY)) {
      if (selectEntityCallback) selectEntityCallback();
      entityWasClicked = true;
      break;
    }
  }

  // If no entity was clicked, start box selection or move group
  if (!entityWasClicked) {
    if (selectedEntities.length > 1 && mousePressed === 0) { // 0 = LEFT
      moveSelectedEntitiesToTile(mouseX, mouseY, TILE_SIZE);
      deselectAllEntities();
      return;
    }
    isSelecting = true;
    selectionStart = { x: mouseX, y: mouseY, copy: function() { return { x: this.x, y: this.y }; } };
    selectionEnd = selectionStart.copy();
  }
}

function handleMouseDragged(mouseX, mouseY, entities) {
  if (isSelecting) {
    selectionEnd = { x: mouseX, y: mouseY };

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

function handleMouseReleased(entities, selectedEntity, moveSelectedEntityToTile, tileSize) {
  if (isSelecting) {
    selectedEntities = [];
    let x1 = Math.min(selectionStart.x, selectionEnd.x);
    let x2 = Math.max(selectionStart.x, selectionEnd.x);
    let y1 = Math.min(selectionStart.y, selectionEnd.y);
    let y2 = Math.max(selectionStart.y, selectionEnd.y);

    // Check if this was a small drag (click) vs a real selection box
    const dragDistance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    const isClick = dragDistance < 5;

    if (!isClick) {
      // Do box selection
      for (let i = 0; i < entities.length; i++) {
        let entity = entities[i].antObject ? entities[i].antObject : entities[i];
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

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    handleMousePressed,
    handleMouseDragged,
    handleMouseReleased,
    selectedEntities,
    isEntityInBox,
    isEntityUnderMouse
  };
}