class SelectionBoxController {
  static instance = null;
  static getInstance(mouseController, entities) {
    if (!SelectionBoxController.instance) {
      SelectionBoxController.instance = new SelectionBoxController(mouseController, entities);
    }
    return SelectionBoxController.instance;
  }
  constructor(mouseController, entities) {
    if (SelectionBoxController.instance) {
      return SelectionBoxController.instance;
    }
  this.mouse = mouseController;
  this.entities = entities;
  this.isSelecting = false;
  this.selectionStart = null;
  this.selectionEnd = null;
  this.selectedEntities = [];

  // Register mouse event handlers
  this.mouse.onClick((x, y, button) => this.handleClick(x, y, button));
  this.mouse.onDrag((x, y, dx, dy) => this.handleDrag(x, y));
  this.mouse.onRelease((x, y, button) => this.handleRelease(x, y, button));

  SelectionBoxController.instance = this;
  }

  handleClick(x, y, button) {
    if (button === "right") {
      this.deselectAll();
      return;
    }
    // Check for entity click
    let clicked = false;
    for (const entity of this.entities) {
      if (SelectionBoxController.isEntityUnderMouse(entity, x, y)) {
        this.deselectAll();
        entity.isSelected = true;
        this.selectedEntities = [entity];
        clicked = true;
        break;
      }
    }
    if (!clicked) {
      // Use canonical movement system from ants.js
      if (this.selectedEntities && this.selectedEntities.length > 0) {
        // Always use group movement abstraction for any selection size
        moveSelectedEntitiesToTile(x, y, TILE_SIZE);
      }
      // Deselect all if clicking on empty space
      this.deselectAll();
      // Start box selection
      this.isSelecting = true;
      this.selectionStart = createVector(x, y);
      this.selectionEnd = this.selectionStart.copy();
    }
  }

  handleDrag(x, y) {
    if (this.isSelecting && this.selectionStart) {
      this.selectionEnd = createVector(x, y);
      // Highlight entities in box
      const [x1, x2] = [this.selectionStart.x, this.selectionEnd.x].sort((a,b)=>a-b);
      const [y1, y2] = [this.selectionStart.y, this.selectionEnd.y].sort((a,b)=>a-b);
      for (const entity of this.entities) {
        entity.isBoxHovered = SelectionBoxController.isEntityInBox(entity, x1, x2, y1, y2);
      }
    }
  }

  handleRelease(x, y, button) {
    if (!this.isSelecting) return;
    this.selectedEntities = [];
    const [x1, x2] = [this.selectionStart.x, this.selectionEnd.x].sort((a,b)=>a-b);
    const [y1, y2] = [this.selectionStart.y, this.selectionEnd.y].sort((a,b)=>a-b);
    const dragDistance = dist(x1, y1, x2, y2);
    if (dragDistance < 5) {
      // Treat as click: do nothing (already handled)
    } else {
      for (const entity of this.entities) {
        entity.isSelected = SelectionBoxController.isEntityInBox(entity, x1, x2, y1, y2);
        entity.isBoxHovered = false;
        if (entity.isSelected) this.selectedEntities.push(entity);
      }
    }
    this.isSelecting = false;
    this.selectionStart = null;
    this.selectionEnd = null;
  }

  deselectAll() {
    for (const entity of this.selectedEntities) {
      entity.isSelected = false;
      if (typeof entity.isBoxHovered !== 'undefined') entity.isBoxHovered = false;
    }
    this.selectedEntities = [];
    // Also clear hover state for all entities in case any are hovered but not selected
    if (this.entities && Array.isArray(this.entities)) {
      for (const entity of this.entities) {
        if (typeof entity.isBoxHovered !== 'undefined') entity.isBoxHovered = false;
      }
    }
  }

  getSelectedEntities() {
    return this.selectedEntities;
  }

  draw() {
    if (this.isSelecting && this.selectionStart && this.selectionEnd) {
      push();
      rectMode(CORNERS);
      fill(0, 150, 255, 50);
      noStroke();
      rect(this.selectionStart.x, this.selectionStart.y, this.selectionEnd.x, this.selectionEnd.y);
      noFill();
      stroke(0, 150, 255);
      strokeWeight(3);
      rect(this.selectionStart.x, this.selectionStart.y, this.selectionEnd.x, this.selectionEnd.y);
      pop();
    }
  }

  // --- Static helpers ---
  static isEntityInBox(entity, x1, x2, y1, y2) {
    const pos = entity.getPosition ? entity.getPosition() : entity.sprite?.pos || { x: entity.posX, y: entity.posY };
    const size = entity.getSize ? entity.getSize() : entity.sprite?.size || { x: entity.sizeX, y: entity.sizeY };
    const cx = pos.x + size.x / 2;
    const cy = pos.y + size.y / 2;
    const inside = (cx >= x1 && cx <= x2 && cy >= y1 && cy <= y2);
    return inside;
  }
  static isEntityUnderMouse(entity, mx, my) {
    let result = false;
    if (entity && typeof entity.isMouseOver === 'function') {
      result = entity.isMouseOver(mx, my);
    } else {
      const pos = entity.getPosition ? entity.getPosition() : entity.sprite?.pos || { x: entity.posX, y: entity.posY };
      const size = entity.getSize ? entity.getSize() : entity.sprite?.size || { x: entity.sizeX, y: entity.sizeY };
      result = (
        mx >= pos.x &&
        mx <= pos.x + size.x &&
        my >= pos.y &&
        my <= pos.y + size.y
      );
    }
    return result;
  }
}

// Export for use in your main file
// window.SelectionBoxController = SelectionBoxController;
