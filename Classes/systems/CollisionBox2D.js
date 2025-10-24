/**
 * @fileoverview CollisionBox2D class for geometric operations and collision detection
 * Provides bounds checking, intersection testing, and common rectangular collision box operations.
 * 
 * @author Software Engineering Team Delta - David Willman
 * @version 1.0.0
 */

/**
 * Represents a 2D collision box with position and dimensions, providing collision detection
 * and geometric utility methods commonly needed in game development.
 * 
 * @class CollisionBox2D
 */
class CollisionBox2D {
  /**
   * Creates a new CollisionBox2D instance.
   * 
   * @param {number} x - X position of the collision box's top-left corner
   * @param {number} y - Y position of the collision box's top-left corner
   * @param {number} width - Width of the collision box
   * @param {number} height - Height of the collision box
   */
  constructor(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  /**
   * Checks if a point is inside this collision box.
   * 
   * @param {number} pointX - X coordinate of the point
   * @param {number} pointY - Y coordinate of the point
   * @returns {boolean} True if point is inside collision box
   */
  contains(pointX, pointY) {
    const result = pointX >= this.x && 
                   pointX <= this.x + this.width && 
                   pointY >= this.y && 
                   pointY <= this.y + this.height;
    
    return result;
  }

  /**
   * Checks if a point is inside this collision box (alias for contains).
   * 
   * @param {number} pointX - X coordinate of the point
   * @param {number} pointY - Y coordinate of the point
   * @returns {boolean} True if point is inside collision box
   */
  isPointInside(pointX, pointY) {
    return this.contains(pointX, pointY);
  }

  /**
   * Checks if this collision box intersects with another collision box.
   * 
   * @param {CollisionBox2D} other - Another collision box to check intersection with
   * @returns {boolean} True if collision boxes intersect
   */
  intersects(other) {
    return !(other.x > this.x + this.width ||
             other.x + other.width < this.x ||
             other.y > this.y + this.height ||
             other.y + other.height < this.y);
  }

  /**
   * Checks if this collision box completely contains another collision box.
   * 
   * @param {CollisionBox2D} other - CollisionBox2D to check if contained
   * @returns {boolean} True if other collision box is completely inside this one
   */
  containsRectangle(other) {
    return other.x >= this.x &&
           other.y >= this.y &&
           other.x + other.width <= this.x + this.width &&
           other.y + other.height <= this.y + this.height;
  }

  /**
   * Gets the center point of the collision box.
   * 
   * @returns {Object} Object with x and y properties representing the center
   */
  getCenter() {
    return {
      x: this.x + this.width / 2,
      y: this.y + this.height / 2
    };
  }

  /**
   * Gets the area of the collision box.
   * 
   * @returns {number} The area (width * height)
   */
  getArea() {
    return this.width * this.height;
  }

  /**
   * Gets the perimeter of the collision box.
   * 
   * @returns {number} The perimeter (2 * (width + height))
   */
  getPerimeter() {
    return 2 * (this.width + this.height);
  }

  /**
   * Gets the top-left corner coordinates.
   * 
   * @returns {Object} Object with x and y properties
   */
  getTopLeft() {
    return { x: this.x, y: this.y };
  }

  /**
   * Gets the top-right corner coordinates.
   * 
   * @returns {Object} Object with x and y properties
   */
  getTopRight() {
    return { x: this.x + this.width, y: this.y };
  }

  /**
   * Gets the bottom-left corner coordinates.
   * 
   * @returns {Object} Object with x and y properties
   */
  getBottomLeft() {
    return { x: this.x, y: this.y + this.height };
  }

  /**
   * Gets the bottom-right corner coordinates.
   * 
   * @returns {Object} Object with x and y properties
   */
  getBottomRight() {
    return { x: this.x + this.width, y: this.y + this.height };
  }

  /**
   * Gets all four corners of the collision box.
   * 
   * @returns {Array} Array of corner objects with x and y properties
   */
  getCorners() {
    return [
      this.getTopLeft(),
      this.getTopRight(),
      this.getBottomRight(),
      this.getBottomLeft()
    ];
  }

  /**
   * Calculates the distance from the center of this collision box to a point.
   * 
   * @param {number} pointX - X coordinate of the point
   * @param {number} pointY - Y coordinate of the point
   * @returns {number} Distance from collision box center to point
   */
  distanceToPoint(pointX, pointY) {
    const center = this.getCenter();
    const dx = center.x - pointX;
    const dy = center.y - pointY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Calculates the distance between centers of this and another collision box.
   * 
   * @param {CollisionBox2D} other - Another collision box
   * @returns {number} Distance between collision box centers
   */
  distanceToRectangle(other) {
    const thisCenter = this.getCenter();
    const otherCenter = other.getCenter();
    const dx = thisCenter.x - otherCenter.x;
    const dy = thisCenter.y - otherCenter.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Moves the collision box by the specified offset.
   * 
   * @param {number} deltaX - Amount to move horizontally
   * @param {number} deltaY - Amount to move vertically
   * @returns {CollisionBox2D} Returns this collision box for method chaining
   */
  translate(deltaX, deltaY) {
    this.x += deltaX;
    this.y += deltaY;
    return this;
  }

  /**
   * Sets the position of the collision box.
   * Supports both separate x,y parameters and p5.Vector objects for sprite-like sync.
   * 
   * @param {number|p5.Vector|Object} newX - New X position, or vector/object with x,y properties
   * @param {number} [newY] - New Y position (optional if first param is vector)
   * @returns {CollisionBox2D} Returns this collision box for method chaining
   */
  setPosition(newX, newY) {
    // Support p5.Vector or object with x,y properties (sprite-like sync)
    if (typeof newX === 'object' && newX !== null) {
      this.x = newX.x;
      this.y = newX.y;
    } else {
      this.x = newX;
      this.y = newY;
    }
    return this;
  }

  getPosX(){
    return this.x
  }
  getPosY(){
    return this.y
  }
  getPos(){
    const returnVal = [this.x,this.y]
    return returnVal
  }

  /**
   * Sets the size of the collision box.
   * 
   * @param {number} newWidth - New width
   * @param {number} newHeight - New height
   * @returns {CollisionBox2D} Returns this collision box for method chaining
   */
  setSize(newWidth, newHeight) {
    this.width = newWidth;
    this.height = newHeight;
    return this;
  }

  /**
   * Scales the collision box by the specified factors.
   * 
   * @param {number} scaleX - Horizontal scale factor
   * @param {number} [scaleY=scaleX] - Vertical scale factor (defaults to scaleX)
   * @returns {CollisionBox2D} Returns this collision box for method chaining
   */
  scale(scaleX, scaleY = scaleX) {
    const center = this.getCenter();
    this.width *= scaleX;
    this.height *= scaleY;
    // Keep collision box centered after scaling
    this.x = center.x - this.width / 2;
    this.y = center.y - this.height / 2;
    return this;
  }

  /**
   * Expands the collision box by the specified amount in all directions.
   * 
   * @param {number} amount - Amount to expand (positive) or contract (negative)
   * @returns {CollisionBox2D} Returns this collision box for method chaining
   */
  expand(amount) {
    this.x -= amount;
    this.y -= amount;
    this.width += amount * 2;
    this.height += amount * 2;
    return this;
  }

  /**
   * Creates a copy of this collision box.
   * 
   * @returns {CollisionBox2D} New collision box with same properties
   */
  clone() {
    return new CollisionBox2D(this.x, this.y, this.width, this.height);
  }

  /**
   * Checks if this collision box is equal to another collision box.
   * 
   * @param {CollisionBox2D} other - CollisionBox2D to compare with
   * @returns {boolean} True if collision boxes have same position and size
   */
  equals(other) {
    return this.x === other.x &&
           this.y === other.y &&
           this.width === other.width &&
           this.height === other.height;
  }

  /**
   * Gets the intersection collision box of this and another collision box.
   * 
   * @param {CollisionBox2D} other - CollisionBox2D to intersect with
   * @returns {CollisionBox2D|null} Intersection collision box, or null if no intersection
   */
  getIntersection(other) {
    if (!this.intersects(other)) {
      return null;
    }

    const left = Math.max(this.x, other.x);
    const top = Math.max(this.y, other.y);
    const right = Math.min(this.x + this.width, other.x + other.width);
    const bottom = Math.min(this.y + this.height, other.y + other.height);

    return new CollisionBox2D(left, top, right - left, bottom - top);
  }

  /**
   * Gets the union (bounding box) of this and another collision box.
   * 
   * @param {CollisionBox2D} other - CollisionBox2D to unite with
   * @returns {CollisionBox2D} CollisionBox2D that bounds both collision boxes
   */
  getUnion(other) {
    const left = Math.min(this.x, other.x);
    const top = Math.min(this.y, other.y);
    const right = Math.max(this.x + this.width, other.x + other.width);
    const bottom = Math.max(this.y + this.height, other.y + other.height);

    return new CollisionBox2D(left, top, right - left, bottom - top);
  }

  /**
   * Checks if the collision box is valid (positive width and height).
   * 
   * @returns {boolean} True if collision box has positive dimensions
   */
  isValid() {
    return this.width > 0 && this.height > 0;
  }

  /**
   * Normalizes the collision box (ensures positive width and height).
   * 
   * @returns {CollisionBox2D} Returns this collision box for method chaining
   */
  normalize() {
    if (this.width < 0) {
      this.x += this.width;
      this.width = -this.width;
    }
    if (this.height < 0) {
      this.y += this.height;
      this.height = -this.height;
    }
    return this;
  }

  /**
   * Renders the collision box outline using p5.js (for debugging).
   * 
   * @param {string} [color='red'] - Stroke color for the collision box
   * @param {number} [strokeWeight=1] - Line thickness
   */
  debugRender(color = 'red', strokeWeight = 1) {
    if (typeof push !== 'undefined') {
      push();
      stroke(color);
      strokeWeight(strokeWeight);
      noFill();
      rect(this.x, this.y, this.width, this.height);
      pop();
    }
  }

  /**
   * Gets a string representation of the collision box.
   * 
   * @returns {string} String describing the collision box
   */
  toString() {
    return `CollisionBox2D(x: ${this.x}, y: ${this.y}, width: ${this.width}, height: ${this.height})`;
  }

  /**
   * Gets debug information about the collision box.
   * 
   * @returns {Object} Object containing all collision box properties and computed values
   */
  getDebugInfo() {
    return {
      position: { x: this.x, y: this.y },
      size: { width: this.width, height: this.height },
      center: this.getCenter(),
      area: this.getArea(),
      perimeter: this.getPerimeter(),
      corners: this.getCorners(),
      isValid: this.isValid()
    };
  }

  // Static factory methods

  /**
   * Creates a collision box from center point and dimensions.
   * 
   * @param {number} centerX - X coordinate of center
   * @param {number} centerY - Y coordinate of center
   * @param {number} width - Width of collision box
   * @param {number} height - Height of collision box
   * @returns {CollisionBox2D} New collision box centered at the specified point
   * @static
   */
  static fromCenter(centerX, centerY, width, height) {
    return new CollisionBox2D(
      centerX - width / 2,
      centerY - height / 2,
      width,
      height
    );
  }

  /**
   * Creates a collision box from two corner points.
   * 
   * @param {number} x1 - X coordinate of first corner
   * @param {number} y1 - Y coordinate of first corner
   * @param {number} x2 - X coordinate of second corner
   * @param {number} y2 - Y coordinate of second corner
   * @returns {CollisionBox2D} New collision box spanning the two points
   * @static
   */
  static fromCorners(x1, y1, x2, y2) {
    const left = Math.min(x1, x2);
    const top = Math.min(y1, y2);
    const right = Math.max(x1, x2);
    const bottom = Math.max(y1, y2);
    
    return new CollisionBox2D(left, top, right - left, bottom - top);
  }

  /**
   * Creates a square collision box with equal width and height.
   * 
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} size - Side length of the square
   * @returns {CollisionBox2D} New square collision box
   * @static
   */
  static square(x, y, size) {
    return new CollisionBox2D(x, y, size, size);
  }
}

// Export for Node.js compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CollisionBox2D;
}