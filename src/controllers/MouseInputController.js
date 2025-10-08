// MouseInputController.js - Simple, modern mouse input controller for games
// Usage:
//   const mouse = new MouseInputController();
//   mouse.onClick((x, y, button) => { ... });
//   mouse.onDrag((x, y, dx, dy) => { ... });
//   mouse.onRelease((x, y, button) => { ... });
//   // In your p5.js handlers:
//   function mousePressed() { mouse.handleMousePressed(mouseX, mouseY, mouseButton); }
//   function mouseDragged() { mouse.handleMouseDragged(mouseX, mouseY); }
//   function mouseReleased() { mouse.handleMouseReleased(mouseX, mouseY, mouseButton); }

class MouseInputController {
  constructor() {
    this.isDragging = false;
    this.lastX = 0;
    this.lastY = 0;
    this.button = null;
    this.clickHandlers = [];
    this.dragHandlers = [];
    this.releaseHandlers = [];
  }

  onClick(fn) {
    if (typeof fn === 'function') this.clickHandlers.push(fn);
  }
  onDrag(fn) {
    if (typeof fn === 'function') this.dragHandlers.push(fn);
  }
  onRelease(fn) {
    if (typeof fn === 'function') this.releaseHandlers.push(fn);
  }

  handleMousePressed(x, y, button) {
    this.isDragging = false;
    this.lastX = x;
    this.lastY = y;
    this.button = button;
    this.clickHandlers.forEach(fn => fn(x, y, button));
  }

  handleMouseDragged(x, y) {
    if (!this.isDragging) this.isDragging = true;
    const dx = x - this.lastX;
    const dy = y - this.lastY;
    this.dragHandlers.forEach(fn => fn(x, y, dx, dy));
    this.lastX = x;
    this.lastY = y;
  }

  handleMouseReleased(x, y, button) {
    this.releaseHandlers.forEach(fn => fn(x, y, button));
    this.isDragging = false;
    this.button = null;
  }
}

// Export for use in your main file
// window.MouseInputController = MouseInputController;
