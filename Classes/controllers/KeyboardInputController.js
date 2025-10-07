// KeyboardInputController.js - Simple, modern keyboard input controller
// Usage:
//   const keyboard = new KeyboardInputController();
//   keyboard.onKeyPress((keyCode, key) => { ... });
//   keyboard.onKeyRelease((keyCode, key) => { ... });
//   keyboard.onKeyType((key) => { ... });
//   // In your p5.js handlers:
//   function keyPressed()  { keyboard.handleKeyPressed(keyCode, key); }
//   function keyReleased() { keyboard.handleKeyReleased(keyCode, key); }
//   function keyTyped()    { keyboard.handleKeyTyped(key); }

class KeyboardInputController {
  constructor() {
    this.keyPressHandlers = [];
    this.keyReleaseHandlers = [];
    this.keyTypeHandlers = [];
    this.pressedKeys = new Set();
  }

  onKeyPress(fn) {
    if (typeof fn === 'function') this.keyPressHandlers.push(fn);
  }
  onKeyRelease(fn) {
    if (typeof fn === 'function') this.keyReleaseHandlers.push(fn);
  }
  onKeyType(fn) {
    if (typeof fn === 'function') this.keyTypeHandlers.push(fn);
  }

  handleKeyPressed(keyCode, key) {
    this.pressedKeys.add(keyCode);
    this.keyPressHandlers.forEach(fn => fn(keyCode, key));
  }

  handleKeyReleased(keyCode, key) {
    this.pressedKeys.delete(keyCode);
    this.keyReleaseHandlers.forEach(fn => fn(keyCode, key));
  }

  handleKeyTyped(key) {
    this.keyTypeHandlers.forEach(fn => fn(key));
  }

  isKeyDown(keyCode) {
    return this.pressedKeys.has(keyCode);
  }
}

// Export for use in your main file
// window.KeyboardInputController = KeyboardInputController;