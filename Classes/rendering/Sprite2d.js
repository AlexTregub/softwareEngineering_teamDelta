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
    if (!this.img) return; // Don't render if no image
    
    push();
    translate(this.pos.x + this.size.x / 2, this.pos.y + this.size.y / 2);
    rotate(radians(this.rotation));
    imageMode(CENTER);
    
    // Apply opacity if set
    if (this.alpha !== undefined && this.alpha < 255) {
      tint(255, this.alpha);
    }
    
    image(this.img, 0, 0, this.size.x, this.size.y);
    pop();
  }
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = Sprite2D;
}
