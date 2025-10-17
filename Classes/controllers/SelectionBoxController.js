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
    // Right-click clears selection
    if (button === 'right') {
      this.deselectAll();
      return;
    }

    // Convert incoming screen coordinates to world coordinates (camera-aware)
    var worldPt = this._screenToWorld(x, y);
    var wx = worldPt.x;
    var wy = worldPt.y;

  var clicked = false;
    for (var i = 0; i < this._entities.length; i++) {
      var entity = this._entities[i];
      if (SelectionBoxController.isEntityUnderMouse(entity, wx, wy)) {
        this.deselectAll();
        entity.isSelected = true;
        this._selectedEntities = [entity];
        clicked = true;
        break;
      }
    }

    if (!clicked) {
      if (this._selectedEntities && this._selectedEntities.length > 0) {
        if (typeof moveSelectedEntitiesToTile === 'function') moveSelectedEntitiesToTile(wx, wy, typeof TILE_SIZE !== 'undefined' ? TILE_SIZE : 16);
      }
      this.deselectAll();
      this._isSelecting = true;
      this._selectionStart = createVector(wx, wy);
      this._selectionEnd = this._selectionStart.copy();
    }
    try {
      if ((typeof window !== 'undefined') && (window.TESTING_ENABLED || (window.location && window.location.search && window.location.search.indexOf('test=1') !== -1))) {
        console.log('SelectionBoxController.handleClick worldPt=', wx, wy, 'selectionStart=', this._selectionStart && this._selectionStart.x, this._selectionStart && this._selectionStart.y);
      }
    } catch (e) {}
  };

  SelectionBoxController.prototype.handleDrag = function (x, y) {
    if (this._isSelecting && this._selectionStart) {
      var worldPt = this._screenToWorld(x, y);
      this._selectionEnd = createVector(worldPt.x, worldPt.y);
      var sortedX = [this._selectionStart.x, this._selectionEnd.x].sort(function (a, b) { return a - b; });
      var sortedY = [this._selectionStart.y, this._selectionEnd.y].sort(function (a, b) { return a - b; });
      var x1 = sortedX[0], x2 = sortedX[1], y1 = sortedY[0], y2 = sortedY[1];
      for (var i = 0; i < this._entities.length; i++) {
        this._entities[i].isBoxHovered = SelectionBoxController.isEntityInBox(this._entities[i], x1, x2, y1, y2);
      }
      try {
        if ((typeof window !== 'undefined') && (window.TESTING_ENABLED || (window.location && window.location.search && window.location.search.indexOf('test=1') !== -1))) {
          console.log('SelectionBoxController.handleDrag selStart=', this._selectionStart, 'selEnd=', this._selectionEnd);
        }
      } catch (e) {}
    }
  };

  SelectionBoxController.prototype.handleRelease = function (x, y, button) {
    if (!this._isSelecting) return;
    this._selectedEntities = [];
    // ensure release coords are accounted for
    var worldPt = this._screenToWorld(x, y);
    if (this._selectionEnd == null) this._selectionEnd = createVector(worldPt.x, worldPt.y);
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
    try {
      if ((typeof window !== 'undefined') && (window.TESTING_ENABLED || (window.location && window.location.search && window.location.search.indexOf('test=1') !== -1))) {
        console.log('SelectionBoxController.handleRelease selRect=', { x1, x2, y1, y2 }, 'selectedCount=', this._selectedEntities.length);
        try {
          // log entity positions
          var ents = this._entities.map(function(e){ return { idx: e._antIndex || e.antIndex || null, pos: (e.getPosition?e.getPosition():{x:e.posX,y:e.posY}), isSelected: e.isSelected }; });
          console.log('SelectionBoxController.entities=', ents);
        } catch (e) {}
      }
    } catch (e) {}
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
      // Convert world selection coords to screen coords for drawing
      try {
        var s1 = this._worldToScreen(this._selectionStart.x, this._selectionStart.y);
        var s2 = this._worldToScreen(this._selectionEnd.x, this._selectionEnd.y);
        var rx = Math.min(s1.x, s2.x);
        var ry = Math.min(s1.y, s2.y);
        var rw = Math.abs(s2.x - s1.x);
        var rh = Math.abs(s2.y - s1.y);
        push();
        stroke(0, 200, 255);
        noFill();
        rect(rx, ry, rw, rh);
        pop();
      } catch (err) {
        // Fallback: draw using world coords if conversion fails
        push();
        stroke(0, 200, 255);
        noFill();
        rect(this._selectionStart.x, this._selectionStart.y, this._selectionEnd.x - this._selectionStart.x, this._selectionEnd.y - this._selectionStart.y);
        pop();
      }
      redraw();
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

  // Helper: convert screen coords (canvas/client-local) to world coords using camera systems
  SelectionBoxController.prototype._screenToWorld = function (sx, sy) {
    try {
      if (typeof window !== 'undefined' && window.g_cameraManager && typeof window.g_cameraManager.screenToWorld === 'function') {
        var w = window.g_cameraManager.screenToWorld(sx, sy);
        return { x: w.worldX !== undefined ? w.worldX : (w.x !== undefined ? w.x : sx), y: w.worldY !== undefined ? w.worldY : (w.y !== undefined ? w.y : sy) };
      }
      if (typeof CameraController !== 'undefined' && typeof CameraController.screenToWorld === 'function') {
        var cw = CameraController.screenToWorld(sx, sy);
        return { x: cw.worldX !== undefined ? cw.worldX : (cw.x !== undefined ? cw.x : sx + (typeof cameraX !== 'undefined' ? cameraX : 0)), y: cw.worldY !== undefined ? cw.worldY : (cw.y !== undefined ? cw.y : sy + (typeof cameraY !== 'undefined' ? cameraY : 0)) };
      }
      // Fallback: assume globals cameraX/cameraY and no zoom
      var camX = (typeof window !== 'undefined' && typeof window.cameraX !== 'undefined') ? window.cameraX : (typeof cameraX !== 'undefined' ? cameraX : 0);
      var camY = (typeof window !== 'undefined' && typeof window.cameraY !== 'undefined') ? window.cameraY : (typeof cameraY !== 'undefined' ? cameraY : 0);
      return { x: sx + camX, y: sy + camY };
    } catch (e) { return { x: sx, y: sy }; }
  };

  // Helper: convert world coords to screen (canvas/client-local) coords
  SelectionBoxController.prototype._worldToScreen = function (wx, wy) {
    try {
      if (typeof window !== 'undefined' && window.g_cameraManager && typeof window.g_cameraManager.worldToScreen === 'function') {
        var s = window.g_cameraManager.worldToScreen(wx, wy);
        return { x: s.screenX !== undefined ? s.screenX : (s.x !== undefined ? s.x : wx), y: s.screenY !== undefined ? s.screenY : (s.y !== undefined ? s.y : wy) };
      }
      if (typeof CameraController !== 'undefined' && typeof CameraController.worldToScreen === 'function') {
        var cs = CameraController.worldToScreen(wx, wy);
        return { x: cs.screenX !== undefined ? cs.screenX : (cs.x !== undefined ? cs.x : wx - (typeof cameraX !== 'undefined' ? cameraX : 0)), y: cs.screenY !== undefined ? cs.screenY : (cs.y !== undefined ? cs.y : wy - (typeof cameraY !== 'undefined' ? cameraY : 0)) };
      }
      // Fallback: assume globals cameraX/cameraY and no zoom
      var camX = (typeof window !== 'undefined' && typeof window.cameraX !== 'undefined') ? window.cameraX : (typeof cameraX !== 'undefined' ? cameraX : 0);
      var camY = (typeof window !== 'undefined' && typeof window.cameraY !== 'undefined') ? window.cameraY : (typeof cameraY !== 'undefined' ? cameraY : 0);
      return { x: Math.round(wx - camX), y: Math.round(wy - camY) };
    } catch (e) { return { x: wx, y: wy }; }
  };

  SelectionBoxController.isSelecting = function () {
    return _isSelecting;
  }

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
