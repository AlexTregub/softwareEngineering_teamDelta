/**
 * Unit Tests for LightningAimBrush
 * Tests lightning strike aiming tool with range limitation
 */

const { expect } = require('chai');

// Mock p5.js and globals
global.mouseX = 100;
global.mouseY = 100;
global.TILE_SIZE = 32;
global.push = () => {};
global.pop = () => {};
global.fill = () => {};
global.stroke = () => {};
global.strokeWeight = () => {};
global.noStroke = () => {};
global.noFill = () => {};
global.ellipse = () => {};
global.line = () => {};
global.text = () => {};
global.textAlign = () => {};
global.textSize = () => {};
global.CENTER = 'center';
global.LEFT = 'left';
global.TOP = 'top';

// Mock queen
const mockQueen = {
  x: 300,
  y: 300,
  getPosition: function() {
    return { x: this.x, y: this.y };
  }
};

global.getQueen = () => mockQueen;

// Mock lightning manager
let strikeRequests = [];
global.g_lightningManager = {
  requestStrike: function(position) {
    strikeRequests.push(position);
    return true;
  }
};

// Mock tile interaction manager
global.g_tileInteractionManager = {
  tileSize: 32
};

// Load BrushBase first (dependency)
require('../../../Classes/systems/tools/BrushBase');

// Load LightningAimBrush
const LightningAimBrush = require('../../../Classes/systems/tools/LightningAimBrush');

describe('LightningAimBrush', function() {
  
  let brush;
  
  beforeEach(function() {
    brush = new LightningAimBrush();
    strikeRequests = [];
    mockQueen.x = 300;
    mockQueen.y = 300;
  });
  
  describe('Constructor', function() {
    
    it('should create brush with default settings', function() {
      expect(brush.isActive).to.be.false;
      expect(brush.tileRange).to.equal(7);
      expect(brush.brushSize).to.equal(16);
    });
    
    it('should initialize cursor position', function() {
      expect(brush.cursor).to.be.an('object');
      expect(brush.cursor.x).to.be.a('number');
      expect(brush.cursor.y).to.be.a('number');
    });
    
    it('should calculate range in pixels', function() {
      expect(brush.rangePx).to.equal(brush.tileRange * 32);
    });
    
    it('should initialize cooldown settings', function() {
      expect(brush.spawnCooldown).to.equal(200);
      expect(brush.lastSpawnTime).to.equal(0);
    });
    
    it('should initialize mouse tracking', function() {
      expect(brush.isMousePressed).to.be.false;
    });
    
    it('should initialize pulse animation', function() {
      expect(brush.pulse).to.equal(0);
      expect(brush.pulseSpeed).to.be.greaterThan(0);
    });
  });
  
  describe('toggle()', function() {
    
    it('should toggle active state', function() {
      expect(brush.isActive).to.be.false;
      
      brush.toggle();
      expect(brush.isActive).to.be.true;
      
      brush.toggle();
      expect(brush.isActive).to.be.false;
    });
    
    it('should return new active state', function() {
      const result = brush.toggle();
      expect(result).to.be.true;
    });
  });
  
  describe('activate()', function() {
    
    it('should activate brush', function() {
      brush.activate();
      
      expect(brush.isActive).to.be.true;
    });
  });
  
  describe('deactivate()', function() {
    
    it('should deactivate brush', function() {
      brush.isActive = true;
      
      brush.deactivate();
      
      expect(brush.isActive).to.be.false;
    });
  });
  
  describe('update()', function() {
    
    it('should not update when inactive', function() {
      brush.isActive = false;
      const oldCursorX = brush.cursor.x;
      
      global.mouseX = 500;
      brush.update();
      
      // Should not update cursor when inactive
      expect(brush.cursor.x).to.equal(oldCursorX);
    });
    
    it('should update cursor position when active', function() {
      brush.isActive = true;
      global.mouseX = 200;
      global.mouseY = 250;
      
      brush.update();
      
      expect(brush.cursor.x).to.equal(200);
      expect(brush.cursor.y).to.equal(250);
    });
    
    it('should update pulse animation', function() {
      brush.isActive = true;
      const oldPulse = brush.pulse;
      
      brush.update();
      
      expect(brush.pulse).to.be.greaterThan(oldPulse);
    });
    
    it('should wrap pulse animation at 2π', function() {
      brush.isActive = true;
      brush.pulse = Math.PI * 2 + 0.1;
      
      brush.update();
      
      expect(brush.pulse).to.be.lessThan(Math.PI * 2);
    });
    
    it('should attempt strike when mouse held', function() {
      brush.isActive = true;
      brush.isMousePressed = true;
      brush.lastSpawnTime = 0;
      brush.cursor.x = 310;
      brush.cursor.y = 310;
      
      brush.update();
      
      expect(strikeRequests.length).to.be.greaterThan(0);
    });
  });
  
  describe('render()', function() {
    
    it('should not render when inactive', function() {
      brush.isActive = false;
      
      expect(() => brush.render()).to.not.throw();
    });
    
    it('should render when active', function() {
      brush.isActive = true;
      
      expect(() => brush.render()).to.not.throw();
    });
  });
  
  describe('onMousePressed()', function() {
    
    it('should return false when inactive', function() {
      brush.isActive = false;
      
      const result = brush.onMousePressed(100, 100, 'LEFT');
      
      expect(result).to.be.false;
    });
    
    it('should deactivate on RIGHT click', function() {
      brush.isActive = true;
      
      const result = brush.onMousePressed(100, 100, 'RIGHT');
      
      expect(result).to.be.true;
      expect(brush.isActive).to.be.false;
    });
    
    it('should start strike on LEFT click', function() {
      brush.isActive = true;
      brush.lastSpawnTime = 0;
      
      const result = brush.onMousePressed(310, 310, 'LEFT');
      
      expect(result).to.be.true;
      expect(brush.isMousePressed).to.be.true;
      expect(strikeRequests.length).to.be.greaterThan(0);
    });
    
    it('should ignore other mouse buttons', function() {
      brush.isActive = true;
      
      const result = brush.onMousePressed(100, 100, 'CENTER');
      
      expect(result).to.be.false;
    });
  });
  
  describe('onMouseReleased()', function() {
    
    it('should return false when inactive', function() {
      brush.isActive = false;
      
      const result = brush.onMouseReleased(100, 100, 'LEFT');
      
      expect(result).to.be.false;
    });
    
    it('should stop continuous striking on LEFT release', function() {
      brush.isActive = true;
      brush.isMousePressed = true;
      
      const result = brush.onMouseReleased(100, 100, 'LEFT');
      
      expect(result).to.be.true;
      expect(brush.isMousePressed).to.be.false;
    });
    
    it('should ignore other mouse buttons', function() {
      brush.isActive = true;
      
      const result = brush.onMouseReleased(100, 100, 'RIGHT');
      
      expect(result).to.be.false;
    });
  });
  
  describe('tryStrikeAt()', function() {
    
    it('should respect cooldown', function() {
      brush.lastSpawnTime = Date.now();
      
      const result = brush.tryStrikeAt(310, 310);
      
      expect(result).to.be.false;
      expect(strikeRequests.length).to.equal(0);
    });
    
    it('should strike within range', function() {
      brush.lastSpawnTime = 0;
      
      // Position within 7 tiles (224px) of queen at (300, 300)
      const result = brush.tryStrikeAt(310, 310);
      
      expect(result).to.be.true;
      expect(strikeRequests.length).to.equal(1);
    });
    
    it('should not strike outside range', function() {
      brush.lastSpawnTime = 0;
      
      // Position far from queen
      const result = brush.tryStrikeAt(1000, 1000);
      
      expect(result).to.be.false;
    });
    
    it('should update last spawn time on success', function() {
      brush.lastSpawnTime = 0;
      
      brush.tryStrikeAt(310, 310);
      
      expect(brush.lastSpawnTime).to.be.greaterThan(0);
    });
    
    it('should pass correct position to lightning manager', function() {
      brush.lastSpawnTime = 0;
      
      brush.tryStrikeAt(350, 360);
      
      expect(strikeRequests.length).to.equal(1);
      expect(strikeRequests[0].x).to.equal(350);
      expect(strikeRequests[0].y).to.equal(360);
    });
    
    it('should handle missing queen gracefully', function() {
      const oldGetQueen = global.getQueen;
      global.getQueen = () => null;
      
      brush.lastSpawnTime = 0;
      
      const result = brush.tryStrikeAt(100, 100);
      
      expect(result).to.be.false;
      
      global.getQueen = oldGetQueen;
    });
    
    it('should handle queen without getPosition method', function() {
      const oldGetQueen = global.getQueen;
      global.getQueen = () => ({ x: 300, y: 300 }); // No getPosition method
      
      brush.lastSpawnTime = 0;
      
      const result = brush.tryStrikeAt(310, 310);
      
      expect(result).to.be.true;
      
      global.getQueen = oldGetQueen;
    });
    
    it('should handle missing lightning manager gracefully', function() {
      const oldManager = global.g_lightningManager;
      global.g_lightningManager = undefined;
      
      brush.lastSpawnTime = 0;
      
      const result = brush.tryStrikeAt(310, 310);
      
      expect(result).to.be.false;
      
      global.g_lightningManager = oldManager;
    });
    
    it('should handle lightning manager with no requestStrike method', function() {
      const oldManager = global.g_lightningManager;
      global.g_lightningManager = {};
      
      brush.lastSpawnTime = 0;
      
      const result = brush.tryStrikeAt(310, 310);
      
      expect(result).to.be.false;
      
      global.g_lightningManager = oldManager;
    });
    
    it('should handle failed strike request', function() {
      global.g_lightningManager.requestStrike = () => false;
      
      brush.lastSpawnTime = 0;
      
      const result = brush.tryStrikeAt(310, 310);
      
      expect(result).to.be.false;
    });
  });
  
  describe('Range Validation', function() {
    
    it('should allow strike at exactly max range', function() {
      brush.lastSpawnTime = 0;
      
      // Position at exactly 7 tiles (224px) from queen
      const x = mockQueen.x + brush.rangePx;
      const y = mockQueen.y;
      
      const result = brush.tryStrikeAt(x, y);
      
      expect(result).to.be.true;
    });
    
    it('should reject strike just beyond max range', function() {
      brush.lastSpawnTime = 0;
      
      // Position just beyond 7 tiles
      const x = mockQueen.x + brush.rangePx + 1;
      const y = mockQueen.y;
      
      const result = brush.tryStrikeAt(x, y);
      
      expect(result).to.be.false;
    });
    
    it('should calculate diagonal range correctly', function() {
      brush.lastSpawnTime = 0;
      
      // Position at diagonal within range
      const offset = brush.rangePx / Math.sqrt(2);
      const x = mockQueen.x + offset;
      const y = mockQueen.y + offset;
      
      const result = brush.tryStrikeAt(x, y);
      
      expect(result).to.be.true;
    });
  });
});

describe('LightningAimBrush Integration', function() {
  
  it('should initialize global instance', function() {
    const mockWindow = { g_lightningAimBrush: null };
    global.window = mockWindow;
    
    delete require.cache[require.resolve('../../../Classes/systems/tools/LightningAimBrush')];
    const { initializeLightningAimBrush } = require('../../../Classes/systems/tools/LightningAimBrush');
    
    const brush = initializeLightningAimBrush();
    
    expect(mockWindow.g_lightningAimBrush).to.exist;
    expect(mockWindow.g_lightningAimBrush).to.equal(brush);
    
    delete global.window;
  });
});
