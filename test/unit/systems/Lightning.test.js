/**
 * Unit Tests for LightningSystem
 * Tests lightning strike mechanics, knockback, and area damage
 */

const { expect } = require('chai');

// Mock p5.js and game globals
global.millis = () => Date.now();
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
global.ants = [];
global.getQueen = () => null;

// Mock Audio
global.Audio = class {
  constructor() {
    this.volume = 1;
    this.currentTime = 0;
  }
  play() {}
};

// Load LightningSystem
const { LightningManager, SootStain } = require('../../../Classes/systems/combat/LightningSystem');

describe('SootStain', function() {
  
  let stain;
  
  beforeEach(function() {
    stain = new SootStain(100, 100, 24, 5000);
  });
  
  describe('Constructor', function() {
    
    it('should create stain with position and radius', function() {
      expect(stain.x).to.equal(100);
      expect(stain.y).to.equal(100);
      expect(stain.radius).to.equal(24);
    });
    
    it('should set duration', function() {
      expect(stain.duration).to.equal(5000);
    });
    
    it('should initialize as active', function() {
      expect(stain.isActive).to.be.true;
      expect(stain.alpha).to.equal(1.0);
    });
    
    it('should use default radius', function() {
      const defaultStain = new SootStain(0, 0);
      expect(defaultStain.radius).to.equal(24);
    });
    
    it('should use default duration', function() {
      const defaultStain = new SootStain(0, 0);
      expect(defaultStain.duration).to.equal(8000);
    });
  });
  
  describe('update()', function() {
    
    it('should fade alpha over time', function() {
      const initialAlpha = stain.alpha;
      
      // Simulate time passing
      stain.created = millis() - 2500; // Half duration
      stain.update();
      
      expect(stain.alpha).to.be.lessThan(initialAlpha);
    });
    
    it('should deactivate after duration', function() {
      stain.created = millis() - 6000; // Past duration
      stain.update();
      
      expect(stain.isActive).to.be.false;
    });
  });
  
  describe('render()', function() {
    
    it('should render when active', function() {
      expect(() => stain.render()).to.not.throw();
    });
    
    it('should not render when inactive', function() {
      stain.isActive = false;
      expect(() => stain.render()).to.not.throw();
    });
  });
});

describe('LightningManager', function() {
  
  let manager;
  
  beforeEach(function() {
    manager = new LightningManager();
    global.ants = [];
  });
  
  describe('Constructor', function() {
    
    it('should create manager with empty lists', function() {
      expect(manager.sootStains).to.be.an('array');
      expect(manager.bolts).to.be.an('array');
      expect(manager.sootStains.length).to.equal(0);
      expect(manager.bolts.length).to.equal(0);
    });
    
    it('should initialize cooldown settings', function() {
      expect(manager.cooldown).to.equal(300);
      expect(manager.lastStrikeTime).to.equal(0);
    });
    
    it('should initialize knockback settings', function() {
      expect(manager.knockbackPx).to.be.a('number');
      expect(manager.knockbackDurationMs).to.equal(180);
    });
    
    it('should have knockback API methods', function() {
      expect(manager.setKnockbackPx).to.be.a('function');
      expect(manager.getKnockbackPx).to.be.a('function');
      expect(manager.setKnockbackDurationMs).to.be.a('function');
      expect(manager.getKnockbackDurationMs).to.be.a('function');
    });
    
    it('should initialize volume setting', function() {
      expect(manager.volume).to.equal(0.25);
    });
  });
  
  describe('Knockback API', function() {
    
    it('should get knockback magnitude', function() {
      const kb = manager.getKnockbackPx();
      expect(kb).to.be.a('number');
    });
    
    it('should set knockback magnitude', function() {
      const result = manager.setKnockbackPx(50);
      expect(result).to.equal(50);
      expect(manager.knockbackPx).to.equal(50);
    });
    
    it('should get knockback duration', function() {
      const duration = manager.getKnockbackDurationMs();
      expect(duration).to.equal(180);
    });
    
    it('should set knockback duration', function() {
      const result = manager.setKnockbackDurationMs(200);
      expect(result).to.equal(200);
      expect(manager.knockbackDurationMs).to.equal(200);
    });
    
    it('should handle invalid knockback values', function() {
      const original = manager.knockbackPx;
      manager.setKnockbackPx(null);
      expect(manager.knockbackPx).to.equal(original);
    });
  });
  
  describe('strikeAtAnt()', function() {
    
    it('should handle missing ant', function() {
      expect(() => manager.strikeAtAnt(null)).to.not.throw();
    });
    
    it('should deal damage to ant', function() {
      const mockAnt = {
        health: 100,
        takeDamage: function(dmg) { this.health -= dmg; },
        getPosition: () => ({ x: 100, y: 100 })
      };
      
      manager.strikeAtAnt(mockAnt, 50);
      
      expect(mockAnt.health).to.equal(50);
    });
    
    it('should skip player queen', function() {
      const mockQueen = {
        jobName: 'Queen',
        health: 100,
        takeDamage: function(dmg) { this.health -= dmg; },
        getPosition: () => ({ x: 100, y: 100 })
      };
      
      manager.strikeAtAnt(mockQueen, 50);
      
      expect(mockQueen.health).to.equal(100); // No damage
    });
    
    it('should create soot stain', function() {
      const mockAnt = {
        takeDamage: () => {},
        getPosition: () => ({ x: 100, y: 100 })
      };
      
      const beforeCount = manager.sootStains.length;
      manager.strikeAtAnt(mockAnt);
      
      expect(manager.sootStains.length).to.equal(beforeCount + 1);
    });
    
    it('should handle ant without takeDamage method', function() {
      const mockAnt = {
        getPosition: () => ({ x: 100, y: 100 })
      };
      
      expect(() => manager.strikeAtAnt(mockAnt)).to.not.throw();
    });
    
    it('should damage nearby ants (AoE)', function() {
      const targetAnt = {
        health: 100,
        isActive: true,
        takeDamage: function(dmg) { this.health -= dmg; },
        getPosition: () => ({ x: 100, y: 100 })
      };
      
      const nearbyAnt = {
        health: 100,
        isActive: true,
        takeDamage: function(dmg) { this.health -= dmg; },
        getPosition: () => ({ x: 120, y: 120 }) // Within AoE
      };
      
      global.ants = [targetAnt, nearbyAnt];
      
      manager.strikeAtAnt(targetAnt, 50, 3);
      
      expect(nearbyAnt.health).to.be.lessThan(100); // Took AoE damage
    });
    
    it('should not damage player queen in AoE', function() {
      const targetAnt = {
        health: 100,
        isActive: true,
        takeDamage: function(dmg) { this.health -= dmg; },
        getPosition: () => ({ x: 100, y: 100 })
      };
      
      const nearbyQueen = {
        jobName: 'Queen',
        health: 100,
        isActive: true,
        takeDamage: function(dmg) { this.health -= dmg; },
        getPosition: () => ({ x: 110, y: 110 })
      };
      
      global.ants = [targetAnt, nearbyQueen];
      
      manager.strikeAtAnt(targetAnt, 50, 3);
      
      expect(nearbyQueen.health).to.equal(100); // Queen undamaged
    });
  });
  
  describe('applyKnockback()', function() {
    
    it('should apply knockback to entity', function() {
      const entity = {
        x: 100,
        y: 100,
        getPosition: () => ({ x: 100, y: 100 }),
        setPosition: function(x, y) { this.x = x; this.y = y; }
      };
      
      const result = manager.applyKnockback(entity, 50, 50, 32);
      
      expect(result).to.be.true;
      expect(manager._activeKnockbacks.length).to.equal(1);
    });
    
    it('should handle entity without getPosition', function() {
      const entity = { x: 100, y: 100 };
      
      const result = manager.applyKnockback(entity, 50, 50);
      
      expect(result).to.be.false;
    });
    
    it('should use default magnitude when not specified', function() {
      const entity = {
        getPosition: () => ({ x: 100, y: 100 }),
        setPosition: () => {}
      };
      
      manager.applyKnockback(entity, 50, 50);
      
      expect(manager._activeKnockbacks.length).to.equal(1);
    });
    
    it('should remove existing knockback for same entity', function() {
      const entity = {
        getPosition: () => ({ x: 100, y: 100 }),
        setPosition: () => {}
      };
      
      manager.applyKnockback(entity, 50, 50);
      manager.applyKnockback(entity, 60, 60); // Apply again
      
      expect(manager._activeKnockbacks.length).to.equal(1);
    });
  });
  
  describe('requestStrike()', function() {
    
    it('should respect cooldown', function() {
      manager.lastStrikeTime = Date.now();
      
      const result = manager.requestStrike({ x: 100, y: 100 });
      
      expect(result).to.be.false;
    });
    
    it('should execute strike after cooldown', function() {
      manager.lastStrikeTime = Date.now() - 500; // Past cooldown
      
      const result = manager.requestStrike({ x: 100, y: 100 });
      
      expect(result).to.be.true;
    });
    
    it('should create bolt animation', function() {
      manager.lastStrikeTime = 0;
      
      manager.requestStrike({ x: 100, y: 100 });
      
      expect(manager.bolts.length).to.be.greaterThan(0);
    });
    
    it('should handle ant with getPosition', function() {
      const mockAnt = {
        getPosition: () => ({ x: 150, y: 150 })
      };
      
      manager.lastStrikeTime = 0;
      const result = manager.requestStrike(mockAnt);
      
      expect(result).to.be.true;
    });
  });
  
  describe('strikeAtPosition()', function() {
    
    it('should strike at specified coordinates', function() {
      expect(() => manager.strikeAtPosition(200, 300, 40, 5)).to.not.throw();
    });
    
    it('should create soot stain at position', function() {
      const beforeCount = manager.sootStains.length;
      
      manager.strikeAtPosition(200, 300);
      
      expect(manager.sootStains.length).to.equal(beforeCount + 1);
    });
    
    it('should damage ants in AoE radius', function() {
      const ant = {
        health: 100,
        isActive: true,
        takeDamage: function(dmg) { this.health -= dmg; },
        getPosition: () => ({ x: 210, y: 310 })
      };
      
      global.ants = [ant];
      
      manager.strikeAtPosition(200, 300, 50, 5);
      
      expect(ant.health).to.be.lessThan(100);
    });
    
    it('should skip ants outside AoE radius', function() {
      const ant = {
        health: 100,
        isActive: true,
        takeDamage: function(dmg) { this.health -= dmg; },
        getPosition: () => ({ x: 1000, y: 1000 }) // Far away
      };
      
      global.ants = [ant];
      
      manager.strikeAtPosition(200, 300, 50, 3);
      
      expect(ant.health).to.equal(100); // No damage
    });
  });
  
  describe('update()', function() {
    
    it('should update soot stains', function() {
      manager.sootStains.push(new SootStain(100, 100));
      
      expect(() => manager.update()).to.not.throw();
    });
    
    it('should remove inactive stains', function() {
      const stain = new SootStain(100, 100, 24, 1);
      stain.created = millis() - 100; // Past duration
      manager.sootStains.push(stain);
      
      manager.update();
      
      expect(manager.sootStains.length).to.equal(0);
    });
    
    it('should update bolts', function() {
      manager.bolts.push({
        x: 100,
        y: 100,
        created: millis(),
        duration: 220,
        executed: false
      });
      
      expect(() => manager.update()).to.not.throw();
    });
    
    it('should process active knockbacks', function() {
      const entity = {
        x: 100,
        y: 100,
        getPosition: () => ({ x: entity.x, y: entity.y }),
        setPosition: function(x, y) { this.x = x; this.y = y; }
      };
      
      manager.applyKnockback(entity, 50, 50);
      
      manager.update();
      
      // Entity should have moved
      expect(entity.x).to.not.equal(100);
    });
  });
  
  describe('render()', function() {
    
    it('should render bolts', function() {
      manager.bolts.push({
        x: 100,
        y: 100,
        created: millis(),
        duration: 220
      });
      
      expect(() => manager.render()).to.not.throw();
    });
    
    it('should render soot stains', function() {
      manager.sootStains.push(new SootStain(100, 100));
      
      expect(() => manager.render()).to.not.throw();
    });
  });
  
  describe('clear()', function() {
    
    it('should remove all soot stains', function() {
      manager.sootStains.push(new SootStain(100, 100));
      manager.sootStains.push(new SootStain(200, 200));
      
      manager.clear();
      
      expect(manager.sootStains.length).to.equal(0);
    });
  });
  
  describe('getActiveKnockbacks()', function() {
    
    it('should return active knockback info', function() {
      const entity = {
        getPosition: () => ({ x: 100, y: 100 }),
        setPosition: () => {}
      };
      
      manager.applyKnockback(entity, 50, 50);
      
      const knockbacks = manager.getActiveKnockbacks();
      
      expect(knockbacks).to.be.an('array');
      expect(knockbacks.length).to.equal(1);
      expect(knockbacks[0]).to.have.property('progress');
    });
  });
});

describe('Lightning System Integration', function() {
  
  it('should initialize global manager in browser', function() {
    const mockWindow = {};
    global.window = mockWindow;
    
    delete require.cache[require.resolve('../../../Classes/systems/combat/LightningSystem')];
    const { initializeLightningSystem } = require('../../../Classes/systems/combat/LightningSystem');
    
    const manager = initializeLightningSystem();
    
    expect(mockWindow.g_lightningManager).to.exist;
    expect(mockWindow.g_lightningManager).to.equal(manager);
    
    delete global.window;
  });
});
