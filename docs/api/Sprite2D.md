# Sprite2D API Documentation

> **Module**: `Classes/rendering/Sprite2d.js`  
> **Version**: 1.0.0  
> **Last Updated**: October 2025

## Overview

The `Sprite2D` class provides simple 2D sprite rendering with p5.js integration. It handles image rendering, positioning, sizing, rotation, and opacity effects.

## Class: Sprite2D

### Constructor

#### `new Sprite2D(img, pos, size, rotation = 0)`

**Parameters:**
- `img` (p5.Image): Image object to render
- `pos` (p5.Vector | Object): Position {x, y}  
- `size` (p5.Vector | Object): Size {x, y} (width, height)
- `rotation` (number, optional): Rotation in degrees, default 0

Creates a new sprite with specified image and transform properties.

**Implementation:**
```javascript
constructor(img, pos, size, rotation = 0) {
  this.img = img;
  this.pos = pos.copy ? pos.copy() : createVector(pos.x, pos.y);
  this.size = size.copy ? size.copy() : createVector(size.x, size.y);
  this.rotation = rotation;
}
```

## Property Setters

### `setImage(img)`
Updates the sprite's image.

### `setPosition(pos)`  
Updates position with vector copying for safety.

### `setSize(size)`
Updates size with vector copying.

### `setRotation(rotation)`
Updates rotation in degrees.

### `setOpacity(alpha)`
**Parameters:**
- `alpha` (number): Opacity value 0-255

Sets sprite opacity for transparency effects.

## Rendering

### `render()`

Renders the sprite with current transform properties.

**Implementation:**
```javascript
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
  
  image(this.img, 0, 0, this.size.x, this.size.y);
  pop();
}
```

**Features:**
- **Center-based rendering**: Rotation occurs around sprite center
- **Opacity support**: Automatic tinting for transparency
- **Safe rendering**: Gracefully handles missing images
- **Transform isolation**: Uses push/pop for clean transforms

## Entity Integration Methods

### `getImage()` / `hasImage()`
Compatibility methods for entity systems.

### `getOpacity()`
Returns current opacity value.

## Usage Examples

```javascript
// Basic sprite creation
const antImage = loadImage('ant.png');
const antSprite = new Sprite2D(antImage, {x: 100, y: 100}, {x: 32, y: 32});

// Animated sprite
function updateAnt() {
  antSprite.setRotation(antSprite.rotation + 2);
  antSprite.setOpacity(sin(frameCount * 0.1) * 127 + 128);
  antSprite.render();
}

// Entity integration
class Ant {
  constructor() {
    this._sprite = new Sprite2D(antImage, this.pos, {x: 32, y: 32});
  }
  
  render() {
    this._sprite.setPosition(this.pos);
    this._sprite.render();
  }
}
```

## Performance Considerations

- **Image Loading**: Check `hasImage()` before rendering
- **Transform Efficiency**: Minimal push/pop overhead
- **Vector Copying**: Safe but creates new objects
- **Tint State**: Automatic tint clearing between renders

---

## See Also

- **[RenderController API Documentation](RenderController.md)** - Advanced sprite rendering
- **[EntityAccessor API Documentation](EntityAccessor.md)** - Sprite property access integration