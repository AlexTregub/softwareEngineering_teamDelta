/**
 * @fileoverview Sprite2D - 2D sprite rendering with position, size, and rotation
 * @module Sprite2D
 * @see {@link docs/api/Sprite2D.md} Complete API documentation
 * @see {@link docs/quick-reference.md} Sprite rendering reference
 */

/**
 * Simple 2D sprite class with image rendering, positioning, and rotation.
 * 
 * **Features**: p5.js integration, position/size vectors, opacity support
 * 
 * @class Sprite2D
 * @see {@link docs/api/Sprite2D.md} Full documentation and examples
 */
class Sprite2D {
  constructor(img, pos, size, rotation = 0) {
    this.img = img; // p5.Image object
    this.pos = pos.copy ? pos.copy() : createVector(pos.x, pos.y); // p5.Vector
    this.size = size.copy ? size.copy() : createVector(size.x, size.y); // p5.Vector
    this.rotation = rotation;
    this.flipX = false;
    this.flipY = false;
  }

  setImage(img) { this.img = img; }
  setPosition(pos) { this.pos = pos.copy ? pos.copy() : createVector(pos.x, pos.y); }
  setSize(size) { this.size = size.copy ? size.copy() : createVector(size.x, size.y); }
  setRotation(rotation) { this.rotation = rotation; }
  
  // Additional methods expected by Entity
  getImage() { return this.img; }
  hasImage() { return this.img != null; }
  setOpacity(alpha) { this.alpha = alpha; }
  getOpacity() { return this.alpha || 255; }

  render() {
    if (!this.img) {
      return; // Don't render if no image
    }
    
    // Convert world position (pixels) to screen position using terrain's coordinate converter
    let screenX = this.pos.x;
    let screenY = this.pos.y;
    
    // Use terrain's coordinate system if available (syncs entities with terrain camera)
    if (typeof g_activeMap !== 'undefined' && g_activeMap && g_activeMap.renderConversion && typeof TILE_SIZE !== 'undefined') {
      // Entity positions are stored in world pixels
      // GridTerrain works in tile coordinates and handles screen conversion
      // Convert pixel position to tile position (with proper centering)
      // Grid coordinates are centered on tiles, so we add +0.5 to position sprites at tile centers
      const tileX = (this.pos.x / TILE_SIZE) + 0.5;
      const tileY = (this.pos.y / TILE_SIZE) + 0.5;
      
      // Use terrain's converter to get screen position (handles Y-axis inversion)
      const screenPos = g_activeMap.renderConversion.convPosToCanvas([tileX, tileY]);
      screenX = screenPos[0];
      screenY = screenPos[1];
    }
    
    push();
    translate(screenX, screenY);
    scale(this.flipX ? -1 : 1, this.flipY ? -1 : 1);
    rotate(radians(this.rotation));
    imageMode(CENTER);
    
    // Apply opacity if set
    if (this.alpha && this.alpha < 255) {
      tint(255, this.alpha);
    }
    // Render sprite centered at translated position
    image(this.img, 0, 0, this.size.x, this.size.y);
    pop();
  }
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Sprite2D;
}
