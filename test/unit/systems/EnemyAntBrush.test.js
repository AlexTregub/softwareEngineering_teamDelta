/**
 * Unit Tests for EnemyAntBrush
 * Tests enemy ant spawning/painting tool
 */

const { expect } = require('chai');

// Mock p5.js and globals
global.mouseX = 100;
global.mouseY = 100;
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

// Mock ants array
global.ants = [];

// Mock AntUtilities
global.AntUtilities = {
  spawnAnt: function(x, y, job, faction) {
    const ant = {
      x, y, job, faction,
      setPosition: function(newX, newY) {
        this.x = newX;
        this.y = newY;
      }
    };
    global.ants.push(ant);
    return ant;
  }
};

// Load BrushBase first (dependency)
require('../../../Classes/systems/tools/BrushBase');

// Load EnemyAntBrush
const { EnemyAntBrush } = require('../../../Classes/systems/tools/EnemyAntBrush');

describe('EnemyAntBrush', function() {
  
  let brush;
  
  beforeEach(function() {
    brush = new EnemyAntBrush();
    global.ants = [];
  });
  
  describe('Constructor', function() {
    
    it('should create brush with default settings', function() {
      expect(brush.isActive).to.be.false;
      expect(brush.brushSize).to.equal(30);
      expect(brush.spawnCooldown).to.equal(50);
    });
    
    it('should initialize brush colors', function() {
      expect(brush.brushColor).to.be.an('array');
      expect(brush.brushColor).to.have.lengthOf(4); // RGBA
      
      // Orange color for enemy
      expect(brush.brushColor[0]).to.equal(255);
      expect(brush.brushColor[1]).to.equal(69);
      expect(brush.brushColor[2]).to.equal(0);
    });
    
    it('should initialize mouse tracking', function() {
      expect(brush.isMousePressed).to.be.false;
      expect(brush.lastSpawnTime).to.equal(0);
    });
    
    it('should initialize pulse animation', function() {
      expect(brush.pulseAnimation).to.equal(0);
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
      const oldPulse = brush.pulseAnimation;
      
      brush.update();
      
      expect(brush.pulseAnimation).to.equal(oldPulse);
    });
    
    it('should update pulse animation when active', function() {
      brush.isActive = true;
      const oldPulse = brush.pulseAnimation;
      
      brush.update();
      
      expect(brush.pulseAnimation).to.be.greaterThan(oldPulse);
    });
    
    it('should wrap pulse animation at 2π', function() {
      brush.isActive = true;
      brush.pulseAnimation = Math.PI * 2 + 0.1;
      
      brush.update();
      
      expect(brush.pulseAnimation).to.be.lessThan(Math.PI * 2);
    });
    
    it('should handle continuous painting when mouse pressed', function() {
      brush.isActive = true;
      brush.isMousePressed = true;
      brush.lastSpawnTime = 0;
      
      global.mouseX = 150;
      global.mouseY = 200;
      
      brush.update();
      
      // Should spawn ant
      expect(global.ants.length).to.be.greaterThan(0);
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
    
    it('should start continuous painting on LEFT click', function() {
      brush.isActive = true;
      brush.lastSpawnTime = 0;
      
      const result = brush.onMousePressed(100, 100, 'LEFT');
      
      expect(result).to.be.true;
      expect(brush.isMousePressed).to.be.true;
      expect(global.ants.length).to.be.greaterThan(0);
    });
    
    it('should ignore other mouse buttons', function() {
      brush.isActive = true;
      
      const result = brush.onMousePressed(100, 100, 'RIGHT');
      
      expect(result).to.be.false;
      expect(brush.isMousePressed).to.be.false;
    });
  });
  
  describe('onMouseReleased()', function() {
    
    it('should return false when inactive', function() {
      brush.isActive = false;
      
      const result = brush.onMouseReleased(100, 100, 'LEFT');
      
      expect(result).to.be.false;
    });
    
    it('should stop continuous painting on LEFT release', function() {
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
  
  describe('trySpawnAnt()', function() {
    
    it('should spawn ant at location', function() {
      brush.lastSpawnTime = 0;
      
      const result = brush.trySpawnAnt(100, 100);
      
      expect(result).to.be.true;
      expect(global.ants.length).to.equal(1);
    });
    
    it('should respect cooldown', function() {
      brush.lastSpawnTime = Date.now();
      
      const result = brush.trySpawnAnt(100, 100);
      
      expect(result).to.be.false;
      expect(global.ants.length).to.equal(0);
    });
    
    it('should spawn enemy faction ants', function() {
      brush.lastSpawnTime = 0;
      
      brush.trySpawnAnt(100, 100);
      
      const ant = global.ants[0];
      expect(ant.faction).to.equal('enemy');
    });
    
    it('should spawn warrior ants', function() {
      brush.lastSpawnTime = 0;
      
      brush.trySpawnAnt(100, 100);
      
      const ant = global.ants[0];
      expect(ant.job).to.equal('Warrior');
    });
    
    it('should add randomness to spawn position', function() {
      brush.lastSpawnTime = 0;
      
      brush.trySpawnAnt(100, 100);
      
      const ant = global.ants[0];
      // Position should be near 100, but with some offset
      expect(Math.abs(ant.x - 100)).to.be.lessThan(brush.brushSize);
      expect(Math.abs(ant.y - 100)).to.be.lessThan(brush.brushSize);
    });
    
    it('should update last spawn time on success', function() {
      brush.lastSpawnTime = 0;
      
      brush.trySpawnAnt(100, 100);
      
      expect(brush.lastSpawnTime).to.be.greaterThan(0);
    });
    
    it('should handle missing AntUtilities gracefully', function() {
      const oldUtilities = global.AntUtilities;
      global.AntUtilities = undefined;
      
      brush.lastSpawnTime = 0;
      
      expect(() => {
        brush.trySpawnAnt(100, 100);
      }).to.not.throw();
      
      global.AntUtilities = oldUtilities;
    });
    
    it('should fallback to command system if AntUtilities fails', function() {
      global.AntUtilities = {
        spawnAnt: () => null // Simulate failure
      };
      
      global.executeCommand = (cmd) => {
        if (cmd.includes('spawn')) {
          global.ants.push({ x: 100, y: 100, job: 'Warrior', faction: 'enemy' });
        }
      };
      
      brush.lastSpawnTime = 0;
      const result = brush.trySpawnAnt(100, 100);
      
      expect(result).to.be.true;
      expect(global.ants.length).to.equal(1);
      
      delete global.executeCommand;
    });
  });
  
  describe('setBrushSize()', function() {
    
    it('should set brush size', function() {
      brush.setBrushSize(50);
      
      expect(brush.brushSize).to.equal(50);
    });
    
    it('should clamp to minimum of 10', function() {
      brush.setBrushSize(5);
      
      expect(brush.brushSize).to.equal(10);
    });
    
    it('should clamp to maximum of 100', function() {
      brush.setBrushSize(150);
      
      expect(brush.brushSize).to.equal(100);
    });
  });
  
  describe('getDebugInfo()', function() {
    
    it('should return debug information', function() {
      const info = brush.getDebugInfo();
      
      expect(info).to.have.property('isActive');
      expect(info).to.have.property('brushSize');
      expect(info).to.have.property('spawnCooldown');
      expect(info).to.have.property('isMousePressed');
      expect(info).to.have.property('lastSpawnTime');
    });
    
    it('should reflect current state', function() {
      brush.isActive = true;
      brush.brushSize = 50;
      brush.isMousePressed = true;
      
      const info = brush.getDebugInfo();
      
      expect(info.isActive).to.be.true;
      expect(info.brushSize).to.equal(50);
      expect(info.isMousePressed).to.be.true;
    });
  });
});

describe('EnemyAntBrush Integration', function() {
  
  it('should initialize global instance', function() {
    const mockWindow = {};
    global.window = mockWindow;
    
    delete require.cache[require.resolve('../../../Classes/systems/tools/EnemyAntBrush')];
    const { initializeEnemyAntBrush } = require('../../../Classes/systems/tools/EnemyAntBrush');
    
    const brush = initializeEnemyAntBrush();
    
    expect(mockWindow.g_enemyAntBrush).to.exist;
    expect(mockWindow.g_enemyAntBrush).to.equal(brush);
    
    delete global.window;
  });
});
