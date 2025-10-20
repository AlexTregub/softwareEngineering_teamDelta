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

    // Configuration options
    this._config = {
      enabled: true,
      selectionColor: [0, 200, 255], // Cyan
      strokeWidth: 2,
      fillAlpha: 30, // 0 = no fill
      cornerSize: 8,
      cornerThickness: 3,
      dragThreshold: 5 // Minimum pixels for selection
    };

    // Callback system
    this._callbacks = {
      onSelectionStart: null,
      onSelectionUpdate: null,
      onSelectionEnd: null
    };

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
    // Check if selection is enabled
    if (!this._config.enabled) return;

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
      
      // Trigger onSelectionStart callback
      if (this._callbacks.onSelectionStart) {
        try {
          this._callbacks.onSelectionStart(wx, wy, []);
        } catch (e) {
          console.warn('SelectionBoxController: onSelectionStart callback error', e);
        }
      }
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
      
      // Get entities in selection box
      var entitiesInBox = [];
      for (var i = 0; i < this._entities.length; i++) {
        var inBox = SelectionBoxController.isEntityInBox(this._entities[i], x1, x2, y1, y2);
        this._entities[i].isBoxHovered = inBox;
        if (inBox) entitiesInBox.push(this._entities[i]);
      }
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
    
    // Use configurable drag threshold
    if (dragDistance >= this._config.dragThreshold) {
      for (var i = 0; i < this._entities.length; i++) {
        var e = this._entities[i];
        e.isSelected = SelectionBoxController.isEntityInBox(e, x1, x2, y1, y2);
        e.isBoxHovered = false;
        if (e.isSelected) this._selectedEntities.push(e);
      }
    }
    
    // Trigger onSelectionEnd callback
    if (this._callbacks.onSelectionEnd) {
      try {
        var bounds = { x1: x1, y1: y1, x2: x2, y2: y2, width: x2 - x1, height: y2 - y1 };
        this._callbacks.onSelectionEnd(bounds, this._selectedEntities.slice());
      } catch (e) {
        console.warn('SelectionBoxController: onSelectionEnd callback error', e);
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
        
        // Use configurable stroke and fill
        stroke(this._config.selectionColor[0], this._config.selectionColor[1], this._config.selectionColor[2]);
        strokeWeight(this._config.strokeWidth);
        
        if (this._config.fillAlpha > 0) {
          fill(this._config.selectionColor[0], this._config.selectionColor[1], this._config.selectionColor[2], this._config.fillAlpha);
        } else {
          noFill();
        }
        
        rect(rx, ry, rw, rh);
        
        // Draw corner indicators
        this._drawCornerIndicators(rx, ry, rw, rh);
        
        pop();
      } catch (err) {
        // Fallback: draw using world coords if conversion fails
        push();
        stroke(this._config.selectionColor[0], this._config.selectionColor[1], this._config.selectionColor[2]);
        strokeWeight(this._config.strokeWidth);
        if (this._config.fillAlpha > 0) {
          fill(this._config.selectionColor[0], this._config.selectionColor[1], this._config.selectionColor[2], this._config.fillAlpha);
        } else {
          noFill();
        }
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
      // Use terrain's coordinate system if available (syncs with terrain camera including Y-axis inversion)
      if (typeof g_map2 !== 'undefined' && g_map2 && g_map2.renderConversion && 
          typeof g_map2.renderConversion.convCanvasToPos === 'function' && typeof TILE_SIZE !== 'undefined') {
        // Use terrain's inverse converter to get tile position from screen coords
        var tilePos = g_map2.renderConversion.convCanvasToPos([sx, sy]);
        
        // Convert tile position back to world pixel position
        var worldX = tilePos[0] * TILE_SIZE;
        var worldY = tilePos[1] * TILE_SIZE;
        
        return { x: worldX, y: worldY };
      }
      
      // Fallback: use camera manager if terrain not available
      if (typeof window !== 'undefined' && window.g_cameraManager && typeof window.g_cameraManager.screenToWorld === 'function') {
        var w = window.g_cameraManager.screenToWorld(sx, sy);
        return { x: w.worldX !== undefined ? w.worldX : (w.x !== undefined ? w.x : sx), y: w.worldY !== undefined ? w.worldY : (w.y !== undefined ? w.y : sy) };
      }
      if (typeof CameraController !== 'undefined' && typeof CameraController.screenToWorld === 'function') {
        var cw = CameraController.screenToWorld(sx, sy);
        return { x: cw.worldX !== undefined ? cw.worldX : (cw.x !== undefined ? cw.x : sx + (typeof cameraX !== 'undefined' ? cameraX : 0)), y: cw.worldY !== undefined ? cw.worldY : (cw.y !== undefined ? cw.y : sy + (typeof cameraY !== 'undefined' ? cameraY : 0)) };
      }
      // Final fallback: assume globals cameraX/cameraY and no zoom
      var camX = (typeof window !== 'undefined' && typeof window.cameraX !== 'undefined') ? window.cameraX : (typeof cameraX !== 'undefined' ? cameraX : 0);
      var camY = (typeof window !== 'undefined' && typeof window.cameraY !== 'undefined') ? window.cameraY : (typeof cameraY !== 'undefined' ? cameraY : 0);
      return { x: sx + camX, y: sy + camY };
    } catch (e) { return { x: sx, y: sy }; }
  };

  // Helper: convert world coords to screen (canvas/client-local) coords
  SelectionBoxController.prototype._worldToScreen = function (wx, wy) {
    try {
      // Use terrain's coordinate system if available (syncs selection box with terrain camera)
      if (typeof g_map2 !== 'undefined' && g_map2 && g_map2.renderConversion && typeof TILE_SIZE !== 'undefined') {
        // Convert pixel position to tile position
        var tileX = wx / TILE_SIZE;
        var tileY = wy / TILE_SIZE;
        
        // Use terrain's converter to get screen position
        var screenPos = g_map2.renderConversion.convPosToCanvas([tileX, tileY]);
        return { x: Math.round(screenPos[0]), y: Math.round(screenPos[1]) };
      }
      
      // Fallback: use camera manager if terrain not available
      if (typeof window !== 'undefined' && window.g_cameraManager && typeof window.g_cameraManager.worldToScreen === 'function') {
        var s = window.g_cameraManager.worldToScreen(wx, wy);
        return { x: s.screenX !== undefined ? s.screenX : (s.x !== undefined ? s.x : wx), y: s.screenY !== undefined ? s.screenY : (s.y !== undefined ? s.y : wy) };
      }
      if (typeof CameraController !== 'undefined' && typeof CameraController.worldToScreen === 'function') {
        var cs = CameraController.worldToScreen(wx, wy);
        return { x: cs.screenX !== undefined ? cs.screenX : (cs.x !== undefined ? cs.x : wx - (typeof cameraX !== 'undefined' ? cameraX : 0)), y: cs.screenY !== undefined ? cs.screenY : (cs.y !== undefined ? cs.y : wy - (typeof cameraY !== 'undefined' ? cameraY : 0)) };
      }
      // Final fallback: assume globals cameraX/cameraY and no zoom
      var camX = (typeof window !== 'undefined' && typeof window.cameraX !== 'undefined') ? window.cameraX : (typeof cameraX !== 'undefined' ? cameraX : 0);
      var camY = (typeof window !== 'undefined' && typeof window.cameraY !== 'undefined') ? window.cameraY : (typeof cameraY !== 'undefined' ? cameraY : 0);
      return { x: Math.round(wx - camX), y: Math.round(wy - camY) };
    } catch (e) { return { x: wx, y: wy }; }
  };

  // --- NEW CONFIGURATION & QUERY API ---

  /**
   * Draw corner indicators for the selection box
   * @param {number} x - Box X position (screen coords)
   * @param {number} y - Box Y position (screen coords)
   * @param {number} w - Box width
   * @param {number} h - Box height
   * @private
   */
  SelectionBoxController.prototype._drawCornerIndicators = function (x, y, w, h) {
    var cornerSize = this._config.cornerSize;
    var cornerThickness = this._config.cornerThickness;
    
    push();
    stroke(this._config.selectionColor[0], this._config.selectionColor[1], this._config.selectionColor[2]);
    strokeWeight(cornerThickness);
    noFill();
    
    // Top-left corner
    line(x, y, x + cornerSize, y);
    line(x, y, x, y + cornerSize);
    
    // Top-right corner
    line(x + w - cornerSize, y, x + w, y);
    line(x + w, y, x + w, y + cornerSize);
    
    // Bottom-left corner
    line(x, y + h - cornerSize, x, y + h);
    line(x, y + h, x + cornerSize, y + h);
    
    // Bottom-right corner
    line(x + w - cornerSize, y + h, x + w, y + h);
    line(x + w, y + h - cornerSize, x + w, y + h);
    
    pop();
  };

  /**
   * Update configuration options
   * @param {Object} config - Configuration object with any of: enabled, selectionColor, strokeWidth, fillAlpha, cornerSize, cornerThickness, dragThreshold
   * @returns {SelectionBoxController} this for chaining
   */
  SelectionBoxController.prototype.updateConfig = function (config) {
    if (config && typeof config === 'object') {
      Object.assign(this._config, config);
    }
    return this;
  };

  /**
   * Get current configuration
   * @returns {Object} Current configuration object (copy)
   */
  SelectionBoxController.prototype.getConfig = function () {
    return Object.assign({}, this._config);
  };

  /**
   * Set selection callbacks
   * @param {Object} callbacks - Callbacks object with any of: onSelectionStart, onSelectionUpdate, onSelectionEnd
   * @returns {SelectionBoxController} this for chaining
   */
  SelectionBoxController.prototype.setCallbacks = function (callbacks) {
    if (callbacks && typeof callbacks === 'object') {
      if (callbacks.onSelectionStart) this._callbacks.onSelectionStart = callbacks.onSelectionStart;
      if (callbacks.onSelectionUpdate) this._callbacks.onSelectionUpdate = callbacks.onSelectionUpdate;
      if (callbacks.onSelectionEnd) this._callbacks.onSelectionEnd = callbacks.onSelectionEnd;
    }
    return this;
  };

  /**
   * Enable or disable selection functionality
   * @param {boolean} enabled - Whether selection is enabled
   * @returns {SelectionBoxController} this for chaining
   */
  SelectionBoxController.prototype.setEnabled = function (enabled) {
    this._config.enabled = !!enabled;
    return this;
  };

  /**
   * Check if selection is currently enabled
   * @returns {boolean} True if enabled
   */
  SelectionBoxController.prototype.isEnabled = function () {
    return this._config.enabled;
  };

  /**
   * Get current selection bounds (during drag or null if not selecting)
   * @returns {Object|null} Bounds object {x1, y1, x2, y2, width, height} or null
   */
  SelectionBoxController.prototype.getSelectionBounds = function () {
    if (!this._isSelecting || !this._selectionStart || !this._selectionEnd) return null;
    
    var sortedX = [this._selectionStart.x, this._selectionEnd.x].sort(function (a, b) { return a - b; });
    var sortedY = [this._selectionStart.y, this._selectionEnd.y].sort(function (a, b) { return a - b; });
    var x1 = sortedX[0], x2 = sortedX[1], y1 = sortedY[0], y2 = sortedY[1];
    
    return {
      x1: x1,
      y1: y1,
      x2: x2,
      y2: y2,
      width: x2 - x1,
      height: y2 - y1
    };
  };

  /**
   * Get debug information about selection controller
   * @returns {Object} Debug info
   */
  SelectionBoxController.prototype.getDebugInfo = function () {
    return {
      isSelecting: this._isSelecting,
      isEnabled: this._config.enabled,
      selectedEntitiesCount: this._selectedEntities.length,
      totalEntitiesCount: this._entities.length,
      config: this.getConfig(),
      hasCallbacks: {
        onSelectionStart: !!this._callbacks.onSelectionStart,
        onSelectionUpdate: !!this._callbacks.onSelectionUpdate,
        onSelectionEnd: !!this._callbacks.onSelectionEnd
      }
    };
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
