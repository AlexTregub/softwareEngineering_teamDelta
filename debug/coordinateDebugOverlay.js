/**
 * Coordinate Debug Overlay
 * Displays detailed position information for debugging entity/mouse coordinate issues
 * Toggle with tilde (~) key
 */

class CoordinateDebugOverlay {
  constructor() {
    this.enabled = false;
    this.queenAnt = null;
  }

  toggle() {
    this.enabled = !this.enabled;
    logNormal(`Coordinate Debug Overlay: ${this.enabled ? 'ENABLED' : 'DISABLED'}`);
  }

  findQueenAnt() {
    // Try to find queen ant from various sources
    if (typeof g_antManager !== 'undefined' && g_antManager && g_antManager.ants) {
      this.queenAnt = g_antManager.ants.find(ant => 
        ant.type === 'Queen' || 
        (ant._jobComponent && ant._jobComponent._currentJob === 'Queen') ||
        (ant.jobName && ant.jobName === 'Queen')
      );
    }
    
    if (!this.queenAnt && typeof ants !== 'undefined' && Array.isArray(ants)) {
      this.queenAnt = ants.find(ant => 
        ant.type === 'Queen' || 
        (ant._jobComponent && ant._jobComponent._currentJob === 'Queen') ||
        (ant.jobName && ant.jobName === 'Queen')
      );
    }
    
    return this.queenAnt;
  }

  getMouseWorldPosition() {
    if (typeof CoordinateConverter !== 'undefined' && CoordinateConverter.isAvailable()) {
      return CoordinateConverter.screenToWorld(mouseX, mouseY);
    }
    return { x: mouseX, y: mouseY };
  }

  getMouseTile() {
    const worldPos = this.getMouseWorldPosition();
    return {
      x: Math.floor(worldPos.x / (typeof TILE_SIZE !== 'undefined' ? TILE_SIZE : 32)),
      y: Math.floor(worldPos.y / (typeof TILE_SIZE !== 'undefined' ? TILE_SIZE : 32))
    };
  }

  render() {
    if (!this.enabled) return;

    push();
    
    // Find queen if not already found
    if (!this.queenAnt) {
      this.findQueenAnt();
    }

    // Get mouse positions
    const worldMouse = this.getMouseWorldPosition();
    const mouseTile = this.getMouseTile();

    // Setup text rendering
    fill(255);
    stroke(0);
    strokeWeight(3);
    textAlign(LEFT, TOP);
    textSize(14);
    
    let y = 10;
    const x = 10;
    const lineHeight = 18;

    // Draw semi-transparent background
    noStroke();
    fill(0, 0, 0, 180);
    const boxWidth = 400;
    const boxHeight = this.queenAnt ? 320 : 120;
    rect(x - 5, y - 5, boxWidth, boxHeight);

    // Mouse Information
    fill(255, 255, 0);
    stroke(0);
    strokeWeight(3);
    text('=== MOUSE INFORMATION ===', x, y);
    y += lineHeight * 1.5;

    fill(255);
    text(`Screen Mouse: (${mouseX.toFixed(1)}, ${mouseY.toFixed(1)})`, x, y);
    y += lineHeight;
    
    text(`World Mouse: (${worldMouse.x.toFixed(1)}, ${worldMouse.y.toFixed(1)})`, x, y);
    y += lineHeight;
    
    text(`Mouse Tile: (${mouseTile.x}, ${mouseTile.y})`, x, y);
    y += lineHeight * 2;

    // Queen Ant Information
    if (this.queenAnt) {
      fill(255, 200, 0);
      text('=== QUEEN ANT INFORMATION ===', x, y);
      y += lineHeight * 1.5;

      // Entity Position
      const pos = this.queenAnt.getPosition ? this.queenAnt.getPosition() : 
                  { x: this.queenAnt.posX || 0, y: this.queenAnt.posY || 0 };
      fill(255);
      text(`Entity Position: (${pos.x.toFixed(1)}, ${pos.y.toFixed(1)})`, x, y);
      y += lineHeight;

      // Collision Box Position
      if (this.queenAnt._collisionBox) {
        const cbX = this.queenAnt._collisionBox.x;
        const cbY = this.queenAnt._collisionBox.y;
        const cbW = this.queenAnt._collisionBox.width;
        const cbH = this.queenAnt._collisionBox.height;
        text(`Collision Box: (${cbX.toFixed(1)}, ${cbY.toFixed(1)}) [${cbW}x${cbH}]`, x, y);
        y += lineHeight;
      }

      // Transform Position
      if (this.queenAnt._transformController) {
        const transformPos = this.queenAnt._transformController.getPosition();
        text(`Transform Pos: (${transformPos.x.toFixed(1)}, ${transformPos.y.toFixed(1)})`, x, y);
        y += lineHeight;
      }

      // Sprite Position
      if (this.queenAnt._sprite && this.queenAnt._sprite.pos) {
        text(`Sprite Pos: (${this.queenAnt._sprite.pos.x.toFixed(1)}, ${this.queenAnt._sprite.pos.y.toFixed(1)})`, x, y);
        y += lineHeight;
      }

      // Selection State
      if (this.queenAnt._selectionController) {
        const isHovered = this.queenAnt._selectionController.isHovered();
        const isSelected = this.queenAnt._selectionController.isSelected();
        fill(isHovered ? color(0, 255, 0) : color(255));
        text(`Hover State: ${isHovered ? 'HOVERED' : 'Not hovered'}`, x, y);
        y += lineHeight;
        
        fill(isSelected ? color(0, 255, 255) : color(255));
        text(`Selected State: ${isSelected ? 'SELECTED' : 'Not selected'}`, x, y);
        y += lineHeight;
      }

      // Render Controller Highlight Box Position
      if (this.queenAnt._renderController) {
        fill(200, 200, 255);
        y += lineHeight * 0.5;
        text('Highlight Box Screen Positions:', x, y);
        y += lineHeight;
        
        // Get the screen position that RenderController would use
        const entityPos = this.queenAnt._renderController.getEntityPosition();
        const screenPos = this.queenAnt._renderController.worldToScreenPosition(entityPos);
        const size = this.queenAnt._renderController.getEntitySize();
        
        fill(255);
        text(`  World: (${entityPos.x.toFixed(1)}, ${entityPos.y.toFixed(1)})`, x, y);
        y += lineHeight;
        text(`  Screen TL: (${screenPos.x.toFixed(1)}, ${screenPos.y.toFixed(1)})`, x, y);
        y += lineHeight;
        text(`  Screen Center: (${(screenPos.x + size.x/2).toFixed(1)}, ${(screenPos.y + size.y/2).toFixed(1)})`, x, y);
        y += lineHeight;
        text(`  Size: ${size.x}x${size.y}`, x, y);
        y += lineHeight;
      }

      y += lineHeight * 0.5;
      fill(150, 150, 150);
      text(`Entity ID: ${this.queenAnt._id || 'N/A'}`, x, y);
      y += lineHeight;
      text(`Type: ${this.queenAnt.type || 'Unknown'}`, x, y);
    } else {
      fill(255, 100, 100);
      text('Queen Ant not found', x, y);
      y += lineHeight;
      fill(200, 200, 200);
      text('(Queen must be spawned in game)', x, y);
    }

    pop();

    // Draw visual indicators on queen
    if (this.queenAnt) {
      this.renderQueenVisualIndicators();
    }
  }

  renderQueenVisualIndicators() {
    if (!this.queenAnt) return;

    push();

    // Get positions
    const pos = this.queenAnt.getPosition ? this.queenAnt.getPosition() : 
                { x: this.queenAnt.posX || 0, y: this.queenAnt.posY || 0 };
    
    // Draw collision box in world coordinates
    if (this.queenAnt._collisionBox && typeof g_activeMap !== 'undefined' && g_activeMap && g_activeMap.renderConversion && typeof TILE_SIZE !== 'undefined') {
      const cbX = this.queenAnt._collisionBox.x;
      const cbY = this.queenAnt._collisionBox.y;
      const cbW = this.queenAnt._collisionBox.width;
      const cbH = this.queenAnt._collisionBox.height;

      // Convert collision box corners to screen
      const tileX1 = cbX / TILE_SIZE;
      const tileY1 = cbY / TILE_SIZE;
      const tileX2 = (cbX + cbW) / TILE_SIZE;
      const tileY2 = (cbY + cbH) / TILE_SIZE;

      const screenTL = g_activeMap.renderConversion.convPosToCanvas([tileX1, tileY1]);
      const screenBR = g_activeMap.renderConversion.convPosToCanvas([tileX2, tileY2]);

      // Draw collision box in RED
      stroke(255, 0, 0);
      strokeWeight(2);
      noFill();
      rect(screenTL[0], screenTL[1], screenBR[0] - screenTL[0], screenBR[1] - screenTL[1]);

      // Draw collision box center point
      fill(255, 0, 0);
      noStroke();
      const centerX = (screenTL[0] + screenBR[0]) / 2;
      const centerY = (screenTL[1] + screenBR[1]) / 2;
      circle(centerX, centerY, 6);
    }

    // Draw entity position point in GREEN
    if (typeof g_activeMap !== 'undefined' && g_activeMap && g_activeMap.renderConversion && typeof TILE_SIZE !== 'undefined') {
      const tileX = pos.x / TILE_SIZE;
      const tileY = pos.y / TILE_SIZE;
      const screenPos = g_activeMap.renderConversion.convPosToCanvas([tileX, tileY]);
      
      fill(0, 255, 0);
      noStroke();
      circle(screenPos[0], screenPos[1], 8);
      
      // Label
      fill(0, 255, 0);
      stroke(0);
      strokeWeight(2);
      textAlign(CENTER, BOTTOM);
      textSize(10);
      text('Entity Pos', screenPos[0], screenPos[1] - 10);
    }

    pop();
  }
}

// Create global instance
if (typeof window !== 'undefined') {
  window.g_coordinateDebugOverlay = new CoordinateDebugOverlay();
  
  // Expose toggle function globally
  window.toggleCoordinateDebug = function() {
    window.g_coordinateDebugOverlay.toggle();
  };
}
