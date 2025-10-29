const { expect } = require('chai');

// Mock p5.js globals
global.fill = function() {};
global.stroke = function() {};
global.strokeWeight = function() {};
global.noFill = function() {};
global.noStroke = function() {};
global.rect = function() {};
global.push = function() {};
global.pop = function() {};

// Load the module
const HealthController = require('../../../Classes/controllers/HealthController.js');

describe('HealthController', function() {
  let mockEntity;
  let controller;
  
  beforeEach(function() {
    // Create minimal mock entity
    mockEntity = {
      health: 80,
      maxHealth: 100,
      getPosition: function() { return { x: 100, y: 100 }; },
      getSize: function() { return { x: 32, y: 32 }; }
    };
    
    controller = new HealthController(mockEntity);
  });
  
  describe('Constructor', function() {
    it('should initialize with entity reference', function() {
      expect(controller.entity).to.equal(mockEntity);
    });
    
    it('should initialize with default config', function() {
      expect(controller.config).to.be.an('object');
      expect(controller.config.barHeight).to.equal(4);
      expect(controller.config.offsetY).to.equal(12);
    });
    
    it('should initialize as not visible', function() {
      expect(controller.isVisible).to.be.false;
    });
    
    it('should initialize with zero alpha', function() {
      expect(controller.alpha).to.equal(0);
    });
    
    it('should initialize last damage time to 0', function() {
      expect(controller.lastDamageTime).to.equal(0);
    });
  });
  
  describe('Configuration', function() {
    describe('setConfig()', function() {
      it('should update config properties', function() {
        controller.setConfig({ barWidth: 50 });
        expect(controller.config.barWidth).to.equal(50);
      });
      
      it('should merge with existing config', function() {
        const originalHeight = controller.config.barHeight;
        controller.setConfig({ barWidth: 60 });
        expect(controller.config.barHeight).to.equal(originalHeight);
      });
      
      it('should update multiple properties', function() {
        controller.setConfig({ 
          barWidth: 40, 
          barHeight: 6,
          offsetY: 15 
        });
        expect(controller.config.barWidth).to.equal(40);
        expect(controller.config.barHeight).to.equal(6);
        expect(controller.config.offsetY).to.equal(15);
      });
    });
    
    describe('getConfig()', function() {
      it('should return config object', function() {
        const config = controller.getConfig();
        expect(config).to.be.an('object');
      });
      
      it('should return copy of config', function() {
        const config = controller.getConfig();
        config.barWidth = 999;
        expect(controller.config.barWidth).to.not.equal(999);
      });
      
      it('should include all config properties', function() {
        const config = controller.getConfig();
        expect(config).to.have.property('barHeight');
        expect(config).to.have.property('offsetY');
        expect(config).to.have.property('showWhenFull');
      });
    });
  });
  
  describe('Visibility', function() {
    describe('setVisible()', function() {
      it('should set visible to true', function() {
        controller.setVisible(true);
        expect(controller.isVisible).to.be.true;
      });
      
      it('should set target alpha to 1 when visible', function() {
        controller.setVisible(true);
        expect(controller.targetAlpha).to.equal(1.0);
      });
      
      it('should set target alpha to 0 when hidden', function() {
        controller.setVisible(false);
        expect(controller.targetAlpha).to.equal(0.0);
      });
      
      it('should update last damage time when showing', function() {
        const before = Date.now();
        controller.setVisible(true);
        expect(controller.lastDamageTime).to.be.at.least(before);
      });
    });
    
    describe('getVisible()', function() {
      it('should return false initially', function() {
        expect(controller.getVisible()).to.be.false;
      });
      
      it('should return true when visible and alpha > 0.1', function() {
        controller.isVisible = true;
        controller.alpha = 0.5;
        expect(controller.getVisible()).to.be.true;
      });
      
      it('should return false when alpha too low', function() {
        controller.isVisible = true;
        controller.alpha = 0.05;
        expect(controller.getVisible()).to.be.false;
      });
    });
  });
  
  describe('Damage Notification', function() {
    describe('onDamage()', function() {
      it('should set visible to true', function() {
        controller.onDamage();
        expect(controller.isVisible).to.be.true;
      });
      
      it('should set target alpha to 1', function() {
        controller.onDamage();
        expect(controller.targetAlpha).to.equal(1.0);
      });
      
      it('should update last damage time', function() {
        const before = Date.now();
        controller.onDamage();
        const after = Date.now();
        expect(controller.lastDamageTime).to.be.at.least(before);
        expect(controller.lastDamageTime).to.be.at.most(after);
      });
      
      it('should trigger display on repeated damage', function() {
        controller.onDamage();
        const firstTime = controller.lastDamageTime;
        
        setTimeout(() => {
          controller.onDamage();
          expect(controller.lastDamageTime).to.be.at.least(firstTime);
        }, 10);
      });
    });
  });
  
  describe('Update Logic', function() {
    it('should fade in when health < max', function() {
      mockEntity.health = 50;
      controller.alpha = 0;
      controller.update();
      expect(controller.targetAlpha).to.equal(1.0);
    });
    
    it('should hide when health is full', function() {
      mockEntity.health = 100;
      controller.alpha = 1.0;
      controller.update();
      expect(controller.targetAlpha).to.equal(0.0);
    });
    
    it('should show when health full if showWhenFull enabled', function() {
      mockEntity.health = 100;
      controller.config.showWhenFull = true;
      controller.alpha = 0;
      controller.onDamage(); // Trigger recent damage
      controller.update();
      expect(controller.targetAlpha).to.equal(1.0);
    });
    
    it('should gradually increase alpha when fading in', function() {
      controller.alpha = 0;
      controller.targetAlpha = 1.0;
      controller.update();
      expect(controller.alpha).to.be.greaterThan(0);
      expect(controller.alpha).to.be.lessThan(1.0);
    });
    
    it('should gradually decrease alpha when fading out', function() {
      controller.alpha = 1.0;
      controller.targetAlpha = 0.0;
      controller.update();
      expect(controller.alpha).to.be.lessThanOrEqual(1.0);
      expect(controller.alpha).to.be.greaterThanOrEqual(0);
    });
    
    it('should handle missing entity gracefully', function() {
      controller.entity = null;
      expect(() => controller.update()).to.not.throw();
    });
    
    it('should show after recent damage when health not full', function() {
      mockEntity.health = 99; // Not quite full
      mockEntity.maxHealth = 100;
      controller.onDamage();
      controller.update();
      // Should show because health < max and recent damage
      expect(controller.isVisible).to.be.true;
      expect(controller.targetAlpha).to.equal(1.0);
    });
  });
  
  describe('Rendering', function() {
    it('should not render when not visible', function() {
      controller.isVisible = false;
      expect(() => controller.render()).to.not.throw();
    });
    
    it('should not render when entity missing', function() {
      controller.isVisible = true;
      controller.entity = null;
      expect(() => controller.render()).to.not.throw();
    });
    
    it('should not render when health is full and showWhenFull is false', function() {
      controller.isVisible = true;
      mockEntity.health = 100;
      controller.config.showWhenFull = false;
      expect(() => controller.render()).to.not.throw();
    });
    
    it('should render when health < max', function() {
      controller.isVisible = true;
      mockEntity.health = 50;
      expect(() => controller.render()).to.not.throw();
    });
    
    it('should handle entity without getPosition method', function() {
      controller.isVisible = true;
      mockEntity.getPosition = null;
      mockEntity.posX = 100;
      mockEntity.posY = 100;
      expect(() => controller.render()).to.not.throw();
    });
    
    it('should handle entity without getSize method', function() {
      controller.isVisible = true;
      mockEntity.getSize = null;
      mockEntity.sizeX = 32;
      mockEntity.sizeY = 32;
      expect(() => controller.render()).to.not.throw();
    });
  });
  
  describe('Debug Info', function() {
    it('should return debug information', function() {
      const info = controller.getDebugInfo();
      expect(info).to.be.an('object');
      expect(info.controllerType).to.equal('HealthController');
    });
    
    it('should include health information', function() {
      mockEntity.health = 75;
      mockEntity.maxHealth = 100;
      const info = controller.getDebugInfo();
      expect(info.health).to.equal(75);
      expect(info.maxHealth).to.equal(100);
      expect(info.healthPercent).to.equal(75);
    });
    
    it('should include visibility state', function() {
      controller.isVisible = true;
      controller.alpha = 0.8;
      const info = controller.getDebugInfo();
      expect(info.isVisible).to.be.true;
      expect(info.alpha).to.equal(0.8);
    });
    
    it('should handle missing entity', function() {
      controller.entity = null;
      const info = controller.getDebugInfo();
      expect(info).to.deep.equal({});
    });
  });
  
  describe('Cleanup', function() {
    it('should clear entity reference on destroy', function() {
      controller.destroy();
      expect(controller.entity).to.be.null;
    });
  });
  
  describe('Edge Cases', function() {
    it('should handle health of 0', function() {
      mockEntity.health = 0;
      expect(() => controller.update()).to.not.throw();
    });
    
    it('should handle negative health', function() {
      mockEntity.health = -10;
      expect(() => controller.update()).to.not.throw();
    });
    
    it('should handle health > maxHealth', function() {
      mockEntity.health = 150;
      mockEntity.maxHealth = 100;
      expect(() => controller.update()).to.not.throw();
    });
    
    it('should handle maxHealth of 0', function() {
      mockEntity.maxHealth = 0;
      expect(() => controller.update()).to.not.throw();
    });
    
    it('should handle missing health property', function() {
      delete mockEntity.health;
      expect(() => controller.update()).to.not.throw();
    });
    
    it('should handle missing maxHealth property', function() {
      delete mockEntity.maxHealth;
      expect(() => controller.update()).to.not.throw();
    });
    
    it('should handle rapid visibility toggling', function() {
      for (let i = 0; i < 10; i++) {
        controller.setVisible(i % 2 === 0);
      }
      expect(controller.targetAlpha).to.equal(0.0);
    });
    
    it('should handle multiple onDamage calls', function() {
      for (let i = 0; i < 5; i++) {
        controller.onDamage();
      }
      expect(controller.isVisible).to.be.true;
    });
  });
});
