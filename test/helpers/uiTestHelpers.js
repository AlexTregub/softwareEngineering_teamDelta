/**
 * UI Test Helpers
 * 
 * Shared mock setup for UI component tests that need p5.js and window globals.
 * Import this file in your test's beforeEach() to avoid repetitive mock setup.
 * 
 * Usage:
 * ```javascript
 * const { setupUITestEnvironment, cleanupUITestEnvironment } = require('../../helpers/uiTestHelpers');
 * 
 * beforeEach(function() {
 *   setupUITestEnvironment();
 * });
 * 
 * afterEach(function() {
 *   cleanupUITestEnvironment();
 * });
 * ```
 */

const sinon = require('sinon');

/**
 * Setup all required mocks for UI component testing
 * Call this in beforeEach() of UI tests
 */
function setupUITestEnvironment() {
  // Mock window object (needed for drag constraints and other browser APIs)
  global.window = {
    innerWidth: 1920,
    innerHeight: 1080
  };
  
  // Mock p5.js drawing functions
  global.createVector = sinon.stub().callsFake((x, y) => ({ x, y }));
  global.fill = sinon.stub();
  global.rect = sinon.stub();
  global.text = sinon.stub();
  global.textSize = sinon.stub();
  global.textAlign = sinon.stub();
  global.stroke = sinon.stub();
  global.strokeWeight = sinon.stub();
  global.noStroke = sinon.stub();
  global.push = sinon.stub();
  global.pop = sinon.stub();
  global.translate = sinon.stub();
  global.line = sinon.stub();
  global.noFill = sinon.stub();
  global.image = sinon.stub(); // For rendering terrain textures
  global.tint = sinon.stub(); // For image color tinting
  
  // Mock UI globals
  global.devConsoleEnabled = false;
  global.localStorage = {
    getItem: sinon.stub().returns(null),
    setItem: sinon.stub(),
    removeItem: sinon.stub()
  };
  
  // Mock p5.js text alignment constants
  global.LEFT = 'left';
  global.CENTER = 'center';
  global.RIGHT = 'right';
  global.TOP = 'top';
  global.BOTTOM = 'bottom';
  global.BASELINE = 'baseline';
  
  // Mock ButtonStyles
  global.ButtonStyles = {
    SUCCESS: { bg: [0, 255, 0], fg: [255, 255, 255] },
    DANGER: { bg: [255, 0, 0], fg: [255, 255, 255] },
    WARNING: { bg: [255, 255, 0], fg: [0, 0, 0] }
  };
  
  // Mock Button class
  global.Button = class Button {
    constructor(config) {
      this.x = config.x || 0;
      this.y = config.y || 0;
      this.width = config.width || 50;
      this.height = config.height || 20;
      this.label = config.label || '';
      this.onClick = config.onClick || (() => {});
    }
    
    render() {}
    
    setPosition(x, y) {
      this.x = x;
      this.y = y;
    }
    
    update(mouseX, mouseY, mousePressed) {
      const mouseOver = mouseX >= this.x && mouseX <= this.x + this.width &&
                       mouseY >= this.y && mouseY <= this.y + this.height;
      if (mouseOver && mousePressed) {
        this.onClick();
        return true;
      }
      return false;
    }
    
    isMouseOver(mx, my) {
      return mx >= this.x && mx <= this.x + this.width &&
             my >= this.y && my <= this.y + this.height;
    }
  };
  
  // Sync to window object for JSDOM compatibility
  if (typeof window !== 'undefined') {
    Object.assign(window, {
      createVector: global.createVector,
      fill: global.fill,
      rect: global.rect,
      text: global.text,
      textSize: global.textSize,
      textAlign: global.textAlign,
      stroke: global.stroke,
      strokeWeight: global.strokeWeight,
      noStroke: global.noStroke,
      push: global.push,
      pop: global.pop,
      translate: global.translate,
      line: global.line,
      noFill: global.noFill,
      image: global.image,
      tint: global.tint,
      devConsoleEnabled: global.devConsoleEnabled,
      localStorage: global.localStorage,
      LEFT: global.LEFT,
      CENTER: global.CENTER,
      RIGHT: global.RIGHT,
      TOP: global.TOP,
      BOTTOM: global.BOTTOM,
      BASELINE: global.BASELINE,
      ButtonStyles: global.ButtonStyles,
      Button: global.Button
    });
  }
  
  // Make p5.js functions globally available (for bare function calls in source code)
  if (typeof globalThis !== 'undefined') {
    globalThis.push = global.push;
    globalThis.pop = global.pop;
    globalThis.fill = global.fill;
    globalThis.rect = global.rect;
    globalThis.text = global.text;
    globalThis.textSize = global.textSize;
    globalThis.textAlign = global.textAlign;
    globalThis.stroke = global.stroke;
    globalThis.strokeWeight = global.strokeWeight;
    globalThis.noStroke = global.noStroke;
    globalThis.translate = global.translate;
    globalThis.line = global.line;
    globalThis.noFill = global.noFill;
    globalThis.image = global.image;
    globalThis.tint = global.tint;
  }
}

/**
 * Cleanup all mocks after test
 * Call this in afterEach() of UI tests
 */
function cleanupUITestEnvironment() {
  sinon.restore();
  
  // Clean up global.window if it was created
  if (global.window) {
    delete global.window;
  }
}

module.exports = {
  setupUITestEnvironment,
  cleanupUITestEnvironment
};
