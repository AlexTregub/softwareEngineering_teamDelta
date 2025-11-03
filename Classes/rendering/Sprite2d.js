/**
 * @fileoverview Sprite2D - 2D sprite rendering with position, size, and rotation
 * @module Sprite2D
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
    
    // CRITICAL: RenderLayerManager applies camera transform (translate/scale) before calling this.
    // In IN_GAME state (CustomLevelCamera), we're already in transformed space.
    // In PLAYING state (GridTerrain), terrain uses convPosToCanvas for its own coordinate system.
    // We need to detect which system is active and render accordingly.
    
    let renderX = this.pos.x;
    let renderY = this.pos.y;
    
    // Check if we're using GridTerrain's coordinate system (PLAYING state with g_activeMap)
    const usingGridTerrain = typeof g_activeMap !== 'undefined' && 
                            g_activeMap && 
                            g_activeMap.renderConversion && 
                            typeof TILE_SIZE !== 'undefined';
    
    if (usingGridTerrain) {
      // GridTerrain: Entity positions are tile-centered, need convPosToCanvas conversion
      const tileX = this.pos.x / TILE_SIZE;
      const tileY = this.pos.y / TILE_SIZE;
      const screenPos = g_activeMap.renderConversion.convPosToCanvas([tileX, tileY]);
      renderX = screenPos[0];
      renderY = screenPos[1];
    }
    // else: CustomLevelCamera (IN_GAME state) - camera transform already applied by RenderLayerManager,
    //       use world coordinates directly (they're already in transformed space)
    
    push();
    noSmooth();
    imageMode(CENTER);
    // Translate to center of sprite for proper rotation/flipping
    translate(renderX + this.size.x / 2, renderY + this.size.y / 2);
    scale(this.flipX ? -1 : 1, this.flipY ? -1 : 1);
    rotate(radians(this.rotation));
    
    // Apply opacity if set
    if (this.alpha && this.alpha < 255) {
      tint(255, this.alpha);
    }
    // Render sprite centered at origin
    image(this.img, 0, 0, this.size.x, this.size.y);
    pop();
  }
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Sprite2D;
}
