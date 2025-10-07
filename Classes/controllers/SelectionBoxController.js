// SelectionBoxController - IIFE implementation with debug delegation
(function () {
  function SelectionBoxController(g_mouseController, entities) {
    if (SelectionBoxController._instance) return SelectionBoxController._instance;

    this._mouse = g_mouseController;
    this._entities = entities || [];

    this._isSelecting = false;
    this._selectionStart = null;
    this._selectionEnd = null;
    this._selectedEntities = [];

    if (this._mouse) {
      if (typeof this._mouse.onClick === 'function') this._mouse.onClick((x, y, button) => this.handleClick(x, y, button));
      if (typeof this._mouse.onDrag === 'function') this._mouse.onDrag((x, y, dx, dy) => this.handleDrag(x, y));
      if (typeof this._mouse.onRelease === 'function') this._mouse.onRelease((x, y, button) => this.handleRelease(x, y, button));
    }

    SelectionBoxController._instance = this;
  }

  SelectionBoxController.getInstance = function (g_mouseController, entities) {
    if (!SelectionBoxController._instance) SelectionBoxController._instance = new SelectionBoxController(g_mouseController, entities);
    return SelectionBoxController._instance;
  };

  SelectionBoxController.prototype.handleClick = function (x, y, button) {
    if (button === 'right') {
      this.deselectAll();
      return;
    }

    var clicked = false;
    for (var i = 0; i < this._entities.length; i++) {
      var entity = this._entities[i];
      if (SelectionBoxController.isEntityUnderMouse(entity, x, y)) {
        this.deselectAll();
        entity.isSelected = true;
        this._selectedEntities = [entity];
        clicked = true;
        break;
      }
    }

    if (!clicked) {
      if (this._selectedEntities && this._selectedEntities.length > 0) {
        if (typeof moveSelectedEntitiesToTile === 'function') moveSelectedEntitiesToTile(x, y, typeof TILE_SIZE !== 'undefined' ? TILE_SIZE : 16);
      }
      this.deselectAll();
      this._isSelecting = true;
      this._selectionStart = createVector(x + cameraX, y + cameraY);
      this._selectionEnd = this._selectionStart.copy();
    }
  };

  SelectionBoxController.prototype.handleDrag = function (x, y) {
    if (this._isSelecting && this._selectionStart) {
      this._selectionEnd = createVector(x + cameraX, y + cameraY);
      var sortedX = [this._selectionStart.x, this._selectionEnd.x].sort(function (a, b) { return a - b; });
      var sortedY = [this._selectionStart.y, this._selectionEnd.y].sort(function (a, b) { return a - b; });
      var x1 = sortedX[0], x2 = sortedX[1], y1 = sortedY[0], y2 = sortedY[1];
      for (var i = 0; i < this._entities.length; i++) {
        this._entities[i].isBoxHovered = SelectionBoxController.isEntityInBox(this._entities[i], x1, x2, y1, y2);
      }
    }
  };

  SelectionBoxController.prototype.handleRelease = function (x, y, button) {
    if (!this._isSelecting) return;
    this._selectedEntities = [];
    var sortedX = [this._selectionStart.x, this._selectionEnd.x].sort(function (a, b) { return a - b; });
    var sortedY = [this._selectionStart.y, this._selectionEnd.y].sort(function (a, b) { return a - b; });
    var x1 = sortedX[0], x2 = sortedX[1], y1 = sortedY[0], y2 = sortedY[1];
    var dragDistance = dist(x1, y1, x2, y2);
    if (dragDistance >= 5) {
      for (var i = 0; i < this._entities.length; i++) {
        var e = this._entities[i];
        e.isSelected = SelectionBoxController.isEntityInBox(e, x1, x2, y1, y2);
        e.isBoxHovered = false;
        if (e.isSelected) this._selectedEntities.push(e);
      }
    }
    this._isSelecting = false;
    this._selectionStart = null;
    this._selectionEnd = null;
  };

  SelectionBoxController.prototype.deselectAll = function () {
    for (var i = 0; i < this._selectedEntities.length; i++) {
      var e = this._selectedEntities[i];
      e.isSelected = false;
      if (typeof e.isBoxHovered !== 'undefined') e.isBoxHovered = false;
    }
    this._selectedEntities = [];
    if (this._entities && Array.isArray(this._entities)) {
      for (var j = 0; j < this._entities.length; j++) {
        if (typeof this._entities[j].isBoxHovered !== 'undefined') this._entities[j].isBoxHovered = false;
      }
    }
  };

  // Public API: return a shallow copy of currently selected entities (wrapper objects)
  SelectionBoxController.prototype.getSelectedEntities = function () {
    return Array.isArray(this._selectedEntities) ? this._selectedEntities.slice() : [];
  };

  // Public API: replace the entities list used for selection tests
  SelectionBoxController.prototype.setEntities = function (entities) {
    this._entities = entities || [];
  };

  // Public API: get the entities list
  SelectionBoxController.prototype.getEntities = function () {
    return this._entities;
  };

  SelectionBoxController.prototype.draw = function () {
    if (this._isSelecting && this._selectionStart && this._selectionEnd) {
      push();
      stroke(0, 200, 255);
      noFill();
      rect(this._selectionStart.x, this._selectionStart.y, this._selectionEnd.x - this._selectionStart.x, this._selectionEnd.y - this._selectionStart.y);
      pop();
    }

    if (devConsoleEnabled) {
      for (var i = 0; i < this._selectedEntities.length; i++) {
        var entity = this._selectedEntities[i];
        try {
          if (entity && typeof entity.getController === 'function') {
            var rc = entity.getController('render');
            if (rc && typeof rc.renderDebugInfo === 'function') {
              rc.renderDebugInfo();
              continue;
            }
          }

          if (typeof DebugRenderer !== 'undefined' && DebugRenderer && typeof DebugRenderer.renderEntityDebug === 'function') {
            DebugRenderer.renderEntityDebug(entity);
            continue;
          }

          var posX = (entity && (entity.posX || entity.x)) || (entity.getPosition && entity.getPosition().x) || 0;
          var posY = (entity && (entity.posY || entity.y)) || (entity.getPosition && entity.getPosition().y) || 0;
          push();
          fill(0, 0, 0, 150);
          noStroke();
          rect(posX, posY + 20, 120, 60);
          fill(255);
          textSize(8);
          textAlign(LEFT, TOP);
          text('ID: ' + (entity && (entity._antIndex || 'unknown')), posX + 2, posY + 24);
          text('Pos: (' + Math.round(posX) + ', ' + Math.round(posY) + ')', posX + 2, posY + 34);
          pop();
        } catch (err) {
          console.warn('SelectionBoxController debug render failed for entity', entity, err);
        }
      }
    }
  };

  SelectionBoxController.isEntityInBox = function (entity, x1, x2, y1, y2) {
    var pos = (entity && typeof entity.getPosition === 'function') ? entity.getPosition() : (entity && entity.sprite && entity.sprite.pos) || { x: (entity && entity.posX) || 0, y: (entity && entity.posY) || 0 };
    var size = (entity && typeof entity.getSize === 'function') ? entity.getSize() : (entity && entity.sprite && entity.sprite.size) || { x: (entity && entity.sizeX) || 0, y: (entity && entity.sizeY) || 0 };
    var cx = pos.x + size.x / 2;
    var cy = pos.y + size.y / 2;
    return (cx >= x1 && cx <= x2 && cy >= y1 && cy <= y2);
  };

  SelectionBoxController.isEntityUnderMouse = function (entity, mx, my) {
    if (entity && typeof entity.isMouseOver === 'function') return entity.isMouseOver(mx, my);
    var pos = (entity && typeof entity.getPosition === 'function') ? entity.getPosition() : (entity && entity.sprite && entity.sprite.pos) || { x: (entity && entity.posX) || 0, y: (entity && entity.posY) || 0 };
    var size = (entity && typeof entity.getSize === 'function') ? entity.getSize() : (entity && entity.sprite && entity.sprite.size) || { x: (entity && entity.sizeX) || 0, y: (entity && entity.sizeY) || 0 };
    return (mx >= pos.x && mx <= pos.x + size.x && my >= pos.y && my <= pos.y + size.y);
  };

  // Export
  // Backwards-compatible property mappings
  Object.defineProperty(SelectionBoxController.prototype, 'entities', {
    get: function() { return this._entities; },
    set: function(val) { this._entities = val || []; }
  });

  Object.defineProperty(SelectionBoxController.prototype, 'selectedEntities', {
    get: function() { return this._selectedEntities; }
  });

  window.SelectionBoxController = SelectionBoxController;
})();
