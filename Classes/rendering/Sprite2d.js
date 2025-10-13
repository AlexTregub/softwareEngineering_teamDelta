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
    
    push();
    translate(this.pos.x + this.size.x / 2, this.pos.y + this.size.y / 2);
    rotate(radians(this.rotation));
    imageMode(CENTER);
    
    // Apply opacity if set
    if (this.alpha && this.alpha < 255) {
      tint(255, this.alpha);
    }
    // TODO: fix all of the rendering to use the correct sprite pos.
    //image(this.img, -this.size.x/2, -this.size.y/2, this.size.x, this.size.y);
    image(this.img, 0, 0, this.size.x, this.size.y);
    pop();
  }
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Sprite2D;
}
