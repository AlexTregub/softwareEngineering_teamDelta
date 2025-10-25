// Clean selection box mock for unit tests
let isSelecting = false;
let selectionStart = null;
let selectionEnd = null;
let selectedEntities = [];

function deselectAllEntities() {
  const list = (typeof global !== 'undefined' && Array.isArray(global.selectedEntities) && global.selectedEntities.length > 0) ? global.selectedEntities : selectedEntities;
  list.forEach(entity => { if (entity) entity.isSelected = false; });
  selectedEntities = [];
  if (typeof global !== 'undefined') global.selectedEntities = [];
}

function isEntityInBox(entity, x1, x2, y1, y2) {
  const pos = entity.getPosition ? entity.getPosition() : (entity._sprite && entity._sprite.pos) || { x: (entity && entity.posX) || 0, y: (entity && entity.posY) || 0 };
  const size = entity.getSize ? entity.getSize() : (entity._sprite && entity._sprite.size) || { x: (entity && entity.sizeX) || 0, y: (entity && entity.sizeY) || 0 };
  const cx = pos.x + size.x / 2;
  const cy = pos.y + size.y / 2;
  return (cx >= x1 && cx <= x2 && cy >= y1 && cy <= y2);
}

function isEntityUnderMouse(entity, mx, my) {
  if (entity && typeof entity.isMouseOver === 'function') return entity.isMouseOver(mx, my);
  const pos = entity.getPosition ? entity.getPosition() : (entity._sprite && entity._sprite.pos) || { x: (entity && entity.posX) || 0, y: (entity && entity.posY) || 0 };
  const size = entity.getSize ? entity.getSize() : (entity._sprite && entity._sprite.size) || { x: (entity && entity.sizeX) || 0, y: (entity && entity.sizeY) || 0 };
  return mx >= pos.x && mx <= pos.x + size.x && my >= pos.y && my <= pos.y + size.y;
}

function handleMousePressed(entities, mouseX, mouseY, selectEntityCallback, selectedEntity, moveSelectedEntityToTile, TILE_SIZE, mousePressed) {
  if (mousePressed === 2) { deselectAllEntities(); return; }
  for (let i = 0; i < entities.length; i++) {
    const ent = entities[i].antObject ? entities[i].antObject : entities[i];
    if (isEntityUnderMouse(ent, mouseX, mouseY)) {
      if (selectEntityCallback) selectEntityCallback();
      return;
    }
  }
  isSelecting = true;
  selectionStart = { x: mouseX, y: mouseY, copy: function() { return { x: this.x, y: this.y }; } };
  selectionEnd = selectionStart.copy();
  if (typeof global !== 'undefined') { global.isSelecting = true; global.selectionStart = selectionStart; global.selectionEnd = selectionEnd; }
}

function handleMouseDragged(mouseX, mouseY, entities) {
  if (!isSelecting) return;
  selectionEnd = { x: mouseX, y: mouseY };
  if (typeof global !== 'undefined') global.selectionEnd = selectionEnd;
  const x1 = Math.min(selectionStart.x, selectionEnd.x);
  const x2 = Math.max(selectionStart.x, selectionEnd.x);
  const y1 = Math.min(selectionStart.y, selectionEnd.y);
  const y2 = Math.max(selectionStart.y, selectionEnd.y);
  for (let i = 0; i < entities.length; i++) {
    const ent = entities[i].antObject ? entities[i].antObject : entities[i];
    ent.isBoxHovered = isEntityInBox(ent, x1, x2, y1, y2);
  }
}

function handleMouseReleased(entities, selectedEntity, moveSelectedEntityToTile, tileSize) {
  if (!isSelecting) return;
  const x1 = Math.min(selectionStart.x, selectionEnd.x);
  const x2 = Math.max(selectionStart.x, selectionEnd.x);
  const y1 = Math.min(selectionStart.y, selectionEnd.y);
  const y2 = Math.max(selectionStart.y, selectionEnd.y);
  const dist = Math.sqrt(Math.pow(x2-x1,2)+Math.pow(y2-y1,2));
  const isClick = dist < 5;
  if (!isClick) {
    selectedEntities = [];
    for (let i = 0; i < entities.length; i++) {
      const ent = entities[i].antObject ? entities[i].antObject : entities[i];
      ent.isSelected = isEntityInBox(ent, x1, x2, y1, y2);
      ent.isBoxHovered = false;
      if (ent.isSelected) selectedEntities.push(ent);
    }
    if (typeof global !== 'undefined') global.selectedEntities = selectedEntities.slice();
  }
  isSelecting = false;
  selectionStart = null;
  selectionEnd = null;
  if (typeof global !== 'undefined') { global.isSelecting = false; global.selectionStart = null; global.selectionEnd = null; }
}

module.exports = {
  handleMousePressed,
  handleMouseDragged,
  handleMouseReleased,
  isEntityInBox,
  isEntityUnderMouse,
  deselectAllEntities,
  selectedEntities
};

function deselectAllEntities() {
  // Prefer module-scoped selectedEntities, but if global.selectedEntities exists use that
  const list = (typeof global !== 'undefined' && Array.isArray(global.selectedEntities) && global.selectedEntities.length > 0) ? global.selectedEntities : selectedEntities;
  list.forEach(entity => { if (entity) entity.isSelected = false; });
  selectedEntities = [];
  if (typeof global !== 'undefined') global.selectedEntities = [];
}

function isEntityInBox(entity, x1, x2, y1, y2) {
  const pos = entity.getPosition ? entity.getPosition() : entity._sprite && entity._sprite.pos;
  const size = entity.getSize ? entity.getSize() : entity._sprite && entity._sprite.size;
  const p = pos || { x: (entity && entity.posX) || 0, y: (entity && entity.posY) || 0 };
  const s = size || { x: (entity && entity.sizeX) || 0, y: (entity && entity.sizeY) || 0 };
  const cx = p.x + s.x / 2;
  const cy = p.y + s.y / 2;
  return (cx >= x1 && cx <= x2 && cy >= y1 && cy <= y2);
}

function isEntityUnderMouse(entity, mx, my) {
  if (entity && typeof entity.isMouseOver === 'function') return entity.isMouseOver(mx, my);
  const pos = entity.getPosition ? entity.getPosition() : (entity._sprite && entity._sprite.pos) || { x: (entity && entity.posX) || 0, y: (entity && entity.posY) || 0 };
  const size = entity.getSize ? entity.getSize() : (entity._sprite && entity._sprite.size) || { x: (entity && entity.sizeX) || 0, y: (entity && entity.sizeY) || 0 };
  return (
    mx >= pos.x &&
    mx <= pos.x + size.x &&
    my >= pos.y &&
    my <= pos.y + size.y
  );
}

function handleMousePressed(entities, mouseX, mouseY, selectEntityCallback, selectedEntity, moveSelectedEntityToTile, TILE_SIZE, mousePressed) {
  // Right click clears selection immediately
  if (mousePressed === 2) { // RIGHT
    deselectAllEntities();
    selectedEntities = [];
    if (typeof global !== 'undefined') global.selectedEntities = [];
    return;
  }

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
    // Right click clears selection
    if (mousePressed === 2) { // RIGHT
      deselectAllEntities();
      selectedEntities = [];
      if (typeof global !== 'undefined') global.selectedEntities = [];
      return;
    }

    // If a single entity is currently selected (selectedEntity param), make a tentative move command
    if (selectedEntity && typeof moveSelectedEntityToTile === 'function' && mousePressed === 0) {
      // Create a tentative move record on the entity's moveCommands so tests that don't call release see it
      if (selectedEntity.moveCommands) selectedEntity.moveCommands.push({ x: mouseX, y: mouseY, tentative: true });
      _tentativeMoves.push({ entity: selectedEntity });
      // do not return; continue to potentially start selection (which may cancel tentative move on drag)
    }

    // If multiple entities are selected, try to move them as a group if helper exists
    const multiSelected = (selectedEntities && selectedEntities.length > 1) || (typeof global !== 'undefined' && Array.isArray(global.selectedEntities) && global.selectedEntities.length > 1);
    if (multiSelected && mousePressed === 0) { // 0 = LEFT
      if (typeof moveSelectedEntitiesToTile === 'function') {
        moveSelectedEntitiesToTile(mouseX, mouseY, TILE_SIZE);
      } else if (typeof moveSelectedEntityToTile === 'function') {
        // Fallback: move each entity individually
        const listToMove = (typeof global !== 'undefined' && Array.isArray(global.selectedEntities) && global.selectedEntities.length > 0) ? global.selectedEntities : selectedEntities;
        for (const ent of listToMove) moveSelectedEntityToTile(mouseX, mouseY, TILE_SIZE, ent);
      }
      deselectAllEntities();
      return;
    }

    // Otherwise start a selection box
    isSelecting = true;
    selectionStart = { x: mouseX, y: mouseY, copy: function() { return { x: this.x, y: this.y }; } };
    selectionEnd = selectionStart.copy();
    if (typeof global !== 'undefined') {
      global.isSelecting = true;
      global.selectionStart = selectionStart;
      global.selectionEnd = selectionEnd;
    }
    if (process && process.env && process.env.TEST_VERBOSE) {
      console.log('[selectionBox.mock] start selection', { mouseX, mouseY, selectedEntitiesLength: selectedEntities.length, globalSelectedLength: (global.selectedEntities||[]).length });
    }
  }
}

function handleMouseDragged(mouseX, mouseY, entities) {
  // If a tentative move was created, cancel it and start selection
  if (_tentativeMoves.length > 0) {
    for (const t of _tentativeMoves) {
      const arr = t.entity.moveCommands;
      if (arr && arr.length > 0 && arr[arr.length-1].tentative) arr.pop();
    }
    _tentativeMoves = [];
    // start selection as dragging implies selection box is intended
    isSelecting = true;
    selectionStart = selectionStart || { x: mouseX, y: mouseY, copy: function() { return { x: this.x, y: this.y }; } };
  }

  if (isSelecting) {
    selectionEnd = { x: mouseX, y: mouseY };
    if (typeof global !== 'undefined') global.selectionEnd = selectionEnd;

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
      if (typeof global !== 'undefined') global.selectedEntities = selectedEntities.slice();
    }
    else {
      // Small click/drags should be interpreted as a move command for currently selected entity/entities
      if (selectedEntities && selectedEntities.length > 1) {
        if (typeof moveSelectedEntitiesToTile === 'function') {
          moveSelectedEntitiesToTile(selectionEnd.x, selectionEnd.y, tileSize);
        } else if (typeof moveSelectedEntityToTile === 'function') {
          for (const ent of selectedEntities) moveSelectedEntityToTile(selectionEnd.x, selectionEnd.y, tileSize, ent);
        }
        deselectAllEntities();
        if (typeof global !== 'undefined') global.selectedEntities = [];
      } else if (selectedEntity && typeof moveSelectedEntityToTile === 'function') {
        // If a tentative move was already added on press (and not canceled), keep it; otherwise add now
        const arr = selectedEntity.moveCommands;
        const hasTentative = arr && arr.length > 0 && arr[arr.length-1].tentative;
        if (!hasTentative) moveSelectedEntityToTile(selectionEnd.x, selectionEnd.y, tileSize);
      }
    }

    isSelecting = false;
    selectionStart = null;
    selectionEnd = null;
    if (typeof global !== 'undefined') {
      global.isSelecting = false;
      global.selectionStart = null;
      global.selectionEnd = null;
    }
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    handleMousePressed,
    handleMouseDragged,
    handleMouseReleased,
    selectedEntities,
    isEntityInBox,
    isEntityUnderMouse,
    deselectAllEntities
  };
}
let _tentativeMoves = [];

function deselectAllEntities() {
  // Prefer module-scoped selectedEntities, but if global.selectedEntities exists use that
  const list = (typeof global !== 'undefined' && Array.isArray(global.selectedEntities) && global.selectedEntities.length > 0) ? global.selectedEntities : selectedEntities;
  list.forEach(entity => { if (entity) entity.isSelected = false; });
  selectedEntities = [];
  if (typeof global !== 'undefined') global.selectedEntities = [];
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
  // Right click clears selection immediately
  if (mousePressed === 2) { // RIGHT
    deselectAllEntities();
    selectedEntities = [];
    if (typeof global !== 'undefined') global.selectedEntities = [];
    return;
  }

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
    // Right click clears selection
    if (mousePressed === 2) { // RIGHT
      deselectAllEntities();
      selectedEntities = [];
      if (typeof global !== 'undefined') global.selectedEntities = [];
      return;
    }

    // If a single entity is currently selected (selectedEntity param), make a tentative move command
    if (selectedEntity && typeof moveSelectedEntityToTile === 'function' && mousePressed === 0) {
      // Create a tentative move record on the entity's moveCommands so tests that don't call release see it
      if (selectedEntity.moveCommands) selectedEntity.moveCommands.push({ x: mouseX, y: mouseY, tentative: true });
      _tentativeMoves.push({ entity: selectedEntity });
      // do not return; continue to potentially start selection (which may cancel tentative move on drag)
    }

    // If multiple entities are selected, try to move them as a group if helper exists
    const multiSelected = (selectedEntities && selectedEntities.length > 1) || (typeof global !== 'undefined' && Array.isArray(global.selectedEntities) && global.selectedEntities.length > 1);
    if (multiSelected && mousePressed === 0) { // 0 = LEFT
      if (typeof moveSelectedEntitiesToTile === 'function') {
        moveSelectedEntitiesToTile(mouseX, mouseY, TILE_SIZE);
      } else if (typeof moveSelectedEntityToTile === 'function') {
        // Fallback: move each entity individually
        const listToMove = (typeof global !== 'undefined' && Array.isArray(global.selectedEntities) && global.selectedEntities.length > 0) ? global.selectedEntities : selectedEntities;
        for (const ent of listToMove) moveSelectedEntityToTile(mouseX, mouseY, TILE_SIZE, ent);
      }
      deselectAllEntities();
      return;
    }

    // Otherwise start a selection box
    isSelecting = true;
    selectionStart = { x: mouseX, y: mouseY, copy: function() { return { x: this.x, y: this.y }; } };
    selectionEnd = selectionStart.copy();
    if (typeof global !== 'undefined') {
      global.isSelecting = true;
      global.selectionStart = selectionStart;
      global.selectionEnd = selectionEnd;
    }
    if (process && process.env && process.env.TEST_VERBOSE) {
      console.log('[selectionBox.mock] start selection', { mouseX, mouseY, selectedEntitiesLength: selectedEntities.length, globalSelectedLength: (global.selectedEntities||[]).length });
    }
  }
}

function handleMouseDragged(mouseX, mouseY, entities) {
  // If a tentative move was created, cancel it and start selection
  if (_tentativeMoves.length > 0) {
    for (const t of _tentativeMoves) {
      const arr = t.entity.moveCommands;
      if (arr && arr.length > 0 && arr[arr.length-1].tentative) arr.pop();
    }
    _tentativeMoves = [];
    // start selection as dragging implies selection box is intended
    isSelecting = true;
    selectionStart = selectionStart || { x: mouseX, y: mouseY, copy: function() { return { x: this.x, y: this.y }; } };
  }

  if (isSelecting) {
    selectionEnd = { x: mouseX, y: mouseY };
    if (typeof global !== 'undefined') global.selectionEnd = selectionEnd;

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
      if (typeof global !== 'undefined') global.selectedEntities = selectedEntities.slice();
    }
    else {
      // Small click/drags should be interpreted as a move command for currently selected entity/entities
      if (selectedEntities && selectedEntities.length > 1) {
        if (typeof moveSelectedEntitiesToTile === 'function') {
          moveSelectedEntitiesToTile(selectionEnd.x, selectionEnd.y, tileSize);
        } else if (typeof moveSelectedEntityToTile === 'function') {
          for (const ent of selectedEntities) moveSelectedEntityToTile(selectionEnd.x, selectionEnd.y, tileSize, ent);
        }
        deselectAllEntities();
        if (typeof global !== 'undefined') global.selectedEntities = [];
      } else if (selectedEntity && typeof moveSelectedEntityToTile === 'function') {
        // If a tentative move was already added on press (and not canceled), keep it; otherwise add now
        const arr = selectedEntity.moveCommands;
        const hasTentative = arr && arr.length > 0 && arr[arr.length-1].tentative;
        if (!hasTentative) moveSelectedEntityToTile(selectionEnd.x, selectionEnd.y, tileSize);
      }
    }
    
    isSelecting = false;
    selectionStart = null;
    selectionEnd = null;
    if (typeof global !== 'undefined') {
      global.isSelecting = false;
      global.selectionStart = null;
      global.selectionEnd = null;
    }
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    handleMousePressed,
    handleMouseDragged,
    handleMouseReleased,
    selectedEntities,
    isEntityInBox,
    isEntityUnderMouse,
    deselectAllEntities
  };
}