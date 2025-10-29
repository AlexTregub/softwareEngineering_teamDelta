/**
 * Unit Tests for FireballSystem
 * Tests fireball projectile mechanics and damage
 */

const { expect } = require('chai');

// Mock p5.js and game globals
global.millis = () => Date.now();
global.performance = global.performance || { now: () => Date.now() };
global.push = () => {};
global.pop = () => {};
global.fill = () => {};
global.stroke = () => {};
global.strokeWeight = () => {};
global.noStroke = () => {};
global.noFill = () => {};
global.ellipse = () => {};
global.line = () => {};
global.Math = Math;
global.width = 800;
global.height = 600;
global.ants = [];

// Load FireballSystem
const { Fireball, FireballManager, initializeFireballSystem } = require('../../../Classes/systems/combat/FireballSystem');

describe('Fireball', function() {
  
  let fireball;
  
  beforeEach(function() {
    fireball = new Fireball(100, 100, 200, 200, 25);
  });
  
  describe('Constructor', function() {
    
    it('should create fireball with start and target positions', function() {
      expect(fireball.x).to.equal(100);
      expect(fireball.y).to.equal(100);
      expect(fireball.targetX).to.equal(200);
      expect(fireball.targetY).to.equal(200);
    });
    
    it('should set damage value', function() {
      expect(fireball.damage).to.equal(25);
    });
    
    it('should calculate velocity toward target', function() {
      expect(fireball.velocityX).to.be.a('number');
      expect(fireball.velocityY).to.be.a('number');
    });
    
    it('should initialize as active', function() {
      expect(fireball.isActive).to.be.true;
      expect(fireball.hasExploded).to.be.false;
    });
    
    it('should initialize visual properties', function() {
      expect(fireball.size).to.equal(12);
      expect(fireball.color).to.be.an('array');
      expect(fireball.trail).to.be.an('array');
    });
  });
  
  describe('update()', function() {
    
    it('should move fireball toward target', function() {
      const startX = fireball.x;
      const startY = fireball.y;
      
      fireball.update(1/60);
      
      expect(fireball.x).to.not.equal(startX);
      expect(fireball.y).to.not.equal(startY);
    });
    
    it('should add positions to trail', function() {
      expect(fireball.trail.length).to.equal(0);
      
      fireball.update(1/60);
      
      expect(fireball.trail.length).to.be.greaterThan(0);
    });
    
    it('should limit trail length', function() {
      for (let i = 0; i < 20; i++) {
        fireball.update(1/60);
      }
      
      expect(fireball.trail.length).to.be.at.most(fireball.maxTrailLength);
    });
    
    it('should explode when reaching target', function() {
      // Create fireball very close to target
      const closeFB = new Fireball(195, 195, 200, 200);
      
      closeFB.update(1/60);
      
      expect(closeFB.hasExploded).to.be.true;
      expect(closeFB.isActive).to.be.false;
    });
    
    it('should explode when off screen', function() {
      const offscreenFB = new Fireball(-100, -100, -200, -200);
      
      offscreenFB.update(1/60);
      
      expect(offscreenFB.hasExploded).to.be.true;
    });
    
    it('should not update when inactive', function() {
      fireball.isActive = false;
      const x = fireball.x;
      
      fireball.update(1/60);
      
      expect(fireball.x).to.equal(x);
    });
    
    it('should handle invalid deltaTime', function() {
      expect(() => {
        fireball.update(-1);
        fireball.update(0);
        fireball.update(Infinity);
        fireball.update(NaN);
      }).to.not.throw();
    });
  });
  
  describe('isOffScreen()', function() {
    
    it('should detect off-screen positions', function() {
      fireball.x = -100;
      expect(fireball.isOffScreen()).to.be.true;
      
      fireball.x = 1000;
      expect(fireball.isOffScreen()).to.be.true;
      
      fireball.x = 100;
      fireball.y = -100;
      expect(fireball.isOffScreen()).to.be.true;
      
      fireball.y = 1000;
      expect(fireball.isOffScreen()).to.be.true;
    });
    
    it('should detect on-screen positions', function() {
      fireball.x = 400;
      fireball.y = 300;
      
      expect(fireball.isOffScreen()).to.be.false;
    });
  });
  
  describe('checkAntCollisions()', function() {
    
    it('should handle no ants array', function() {
      global.ants = undefined;
      
      expect(() => fireball.checkAntCollisions()).to.not.throw();
    });
    
    it('should detect collision with ant', function() {
      const mockAnt = {
        isActive: true,
        health: 100,
        getPosition: () => ({ x: fireball.x, y: fireball.y }),
        takeDamage: function(dmg) { this.health -= dmg; }
      };
      
      global.ants = [mockAnt];
      
      fireball.checkAntCollisions();
      
      expect(fireball.hasExploded).to.be.true;
    });
    
    it('should skip inactive ants', function() {
      const mockAnt = {
        isActive: false,
        health: 100,
        getPosition: () => ({ x: fireball.x, y: fireball.y })
      };
      
      global.ants = [mockAnt];
      
      fireball.checkAntCollisions();
      
      expect(fireball.hasExploded).to.be.false;
    });
    
    it('should skip dead ants', function() {
      const mockAnt = {
        isActive: true,
        health: 0,
        getPosition: () => ({ x: fireball.x, y: fireball.y })
      };
      
      global.ants = [mockAnt];
      
      fireball.checkAntCollisions();
      
      expect(fireball.hasExploded).to.be.false;
    });
  });
  
  describe('hitAnt()', function() {
    
    it('should deal damage to ant', function() {
      const mockAnt = {
        health: 100,
        _maxHealth: 100,
        takeDamage: function(dmg) { this.health -= dmg; }
      };
      
      fireball.hitAnt(mockAnt);
      
      expect(mockAnt.health).to.equal(75); // 100 - 25
      expect(fireball.hasExploded).to.be.true;
    });
    
    it('should handle missing takeDamage method', function() {
      const mockAnt = {
        health: 100
      };
      
      expect(() => fireball.hitAnt(mockAnt)).to.not.throw();
    });
  });
  
  describe('explode()', function() {
    
    it('should mark fireball as exploded', function() {
      fireball.explode();
      
      expect(fireball.hasExploded).to.be.true;
      expect(fireball.isActive).to.be.false;
    });
  });
  
  describe('render()', function() {
    
    it('should render when active', function() {
      expect(() => fireball.render()).to.not.throw();
    });
    
    it('should not render when inactive', function() {
      fireball.isActive = false;
      
      expect(() => fireball.render()).to.not.throw();
    });
  });
  
  describe('getDebugInfo()', function() {
    
    it('should return debug information', function() {
      const info = fireball.getDebugInfo();
      
      expect(info).to.have.property('position');
      expect(info).to.have.property('target');
      expect(info).to.have.property('velocity');
      expect(info).to.have.property('damage');
      expect(info).to.have.property('isActive');
    });
  });
});

describe('FireballManager', function() {
  
  let manager;
  
  beforeEach(function() {
    manager = new FireballManager();
  });
  
  describe('Constructor', function() {
    
    it('should create manager with empty fireball list', function() {
      expect(manager.fireballs).to.be.an('array');
      expect(manager.fireballs.length).to.equal(0);
    });
    
    it('should initialize time tracking', function() {
      expect(manager.lastUpdateTime).to.be.null;
    });
  });
  
  describe('createFireball()', function() {
    
    it('should create and store fireball', function() {
      const fb = manager.createFireball(100, 100, 200, 200, 30);
      
      expect(fb).to.be.instanceOf(Fireball);
      expect(manager.fireballs.length).to.equal(1);
    });
    
    it('should use specified damage', function() {
      const fb = manager.createFireball(0, 0, 100, 100, 50);
      
      expect(fb.damage).to.equal(50);
    });
    
    it('should use default damage when not specified', function() {
      const fb = manager.createFireball(0, 0, 100, 100);
      
      expect(fb.damage).to.equal(25);
    });
  });
  
  describe('update()', function() {
    
    it('should update all active fireballs', function() {
      manager.createFireball(100, 100, 200, 200);
      manager.createFireball(150, 150, 250, 250);
      
      expect(() => manager.update()).to.not.throw();
    });
    
    it('should remove inactive fireballs', function() {
      const fb = manager.createFireball(195, 195, 200, 200);
      expect(manager.fireballs.length).to.equal(1);
      
      manager.update();
      
      expect(manager.fireballs.length).to.equal(0);
    });
    
    it('should calculate deltaTime', function() {
      manager.createFireball(100, 100, 200, 200);
      
      manager.update();
      
      expect(manager.lastUpdateTime).to.be.a('number');
    });
    
    it('should handle errors gracefully', function() {
      // Create fireball with error flag
      const fb = manager.createFireball(100, 100, 200, 200);
      fb.hasError = true;
      fb.isActive = false;
      
      expect(() => manager.update()).to.not.throw();
    });
  });
  
  describe('render()', function() {
    
    it('should render all fireballs', function() {
      manager.createFireball(100, 100, 200, 200);
      manager.createFireball(150, 150, 250, 250);
      
      expect(() => manager.render()).to.not.throw();
    });
    
    it('should handle empty fireball list', function() {
      expect(() => manager.render()).to.not.throw();
    });
  });
  
  describe('clear()', function() {
    
    it('should remove all fireballs', function() {
      manager.createFireball(100, 100, 200, 200);
      manager.createFireball(150, 150, 250, 250);
      
      manager.clear();
      
      expect(manager.fireballs.length).to.equal(0);
    });
  });
  
  describe('getActiveCount()', function() {
    
    it('should count active fireballs', function() {
      manager.createFireball(100, 100, 200, 200);
      manager.createFireball(150, 150, 250, 250);
      
      expect(manager.getActiveCount()).to.equal(2);
    });
    
    it('should not count inactive fireballs', function() {
      const fb = manager.createFireball(100, 100, 200, 200);
      fb.isActive = false;
      
      expect(manager.getActiveCount()).to.equal(0);
    });
  });
});

describe('initializeFireballSystem()', function() {
  
  it('should initialize and return manager', function() {
    const manager = initializeFireballSystem();
    
    expect(manager).to.be.instanceOf(FireballManager);
  });
  
  it('should create global instance', function() {
    const mockWindow = {};
    global.window = mockWindow;
    
    delete require.cache[require.resolve('../../../Classes/systems/combat/FireballSystem')];
    const { initializeFireballSystem } = require('../../../Classes/systems/combat/FireballSystem');
    
    const manager = initializeFireballSystem();
    
    expect(mockWindow.g_fireballManager).to.equal(manager);
    
    delete global.window;
  });
});
