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
  constructor(img, pos, size, rotation = 0, alpha = 0) {
    this._img = img; // p5.Image object
    this._pos = pos.copy ? pos.copy() : createVector(pos.x, pos.y); // p5.Vector
    this._size = size.copy ? size.copy() : createVector(size.x, size.y); // p5.Vector
    this._rotation = rotation;
    this._alpha = alpha;
  }

  setImage(img) { this._img = img; }
  setPosition(pos) { this._pos = pos.copy ? pos.copy() : createVector(pos.x, pos.y); }
  setSize(size) { this._size = size.copy ? size.copy() : createVector(size.x, size.y); }
  setRotation(rotation) { this._rotation = rotation; }
  
  // Additional methods expected by Entity
  getImage() { return this._img; }
  hasImage() { return this._img != null; }
  setOpacity(alpha) { this._alpha = alpha; }
  getOpacity() { return this._alpha || 255; }

  render() {
    if (!this._img) {
      return; // Don't render if no image
    }
    
    push();
    translate(this._pos.x + this._size.x / 2, this._pos.y + this._size.y / 2);
    rotate(radians(this._rotation));
    imageMode(CENTER);
    
    // Apply opacity if set
    if (this._alpha && this._alpha < 255) {
      tint(255, this._alpha);
    }
    
    image(this._img, 0, 0, this._size.x, this._size.y);
    pop();
  }
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Sprite2D;
}
