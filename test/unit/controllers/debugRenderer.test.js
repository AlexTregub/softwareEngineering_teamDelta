const { expect } = require('chai');

// Mock p5.js functions
global.push = () => {};
global.pop = () => {};
global.noStroke = () => {};
global.fill = () => {};
global.textAlign = () => {};
global.textSize = () => {};
global.text = () => {};
global.LEFT = 'LEFT';

// Load the module
const DebugRenderer = require('../../../Classes/controllers/DebugRenderer.js');

describe('DebugRenderer', function() {
  let mockEntity;
  
  beforeEach(function() {
    global.devConsoleEnabled = true;
    mockEntity = {
      posX: 100,
      posY: 200,
      _faction: 'player',
      getPosition: function() { return { x: this.posX, y: this.posY }; },
      getCurrentState: function() { return 'IDLE'; },
      getEffectiveMovementSpeed: function() { return 2.5; }
    };
  });
  
  describe('renderEntityDebug()', function() {
    it('should render debug info for entity', function() {
      expect(() => DebugRenderer.renderEntityDebug(mockEntity)).to.not.throw();
    });
    
    it('should not render when devConsoleEnabled is false', function() {
      global.devConsoleEnabled = false;
      let textCalled = false;
      global.text = () => { textCalled = true; };
      DebugRenderer.renderEntityDebug(mockEntity);
      expect(textCalled).to.be.false;
    });
    
    it('should handle entity without getPosition', function() {
      const entity = {
        posX: 50,
        posY: 75,
        getCurrentState: () => 'MOVING'
      };
      expect(() => DebugRenderer.renderEntityDebug(entity)).to.not.throw();
    });
    
    it('should handle entity with sprite position', function() {
      const entity = {
        _sprite: { pos: { x: 150, y: 250 } },
        getCurrentState: () => 'GATHERING'
      };
      expect(() => DebugRenderer.renderEntityDebug(entity)).to.not.throw();
    });
    
    it('should handle entity without getCurrentState', function() {
      const entity = {
        posX: 100,
        posY: 200,
        getPosition: () => ({ x: 100, y: 200 })
      };
      expect(() => DebugRenderer.renderEntityDebug(entity)).to.not.throw();
    });
    
    it('should display state information', function() {
      let displayedText = [];
      global.text = (txt) => displayedText.push(txt);
      DebugRenderer.renderEntityDebug(mockEntity);
      expect(displayedText.some(t => t.includes('State:'))).to.be.true;
    });
    
    it('should display faction information', function() {
      let displayedText = [];
      global.text = (txt) => displayedText.push(txt);
      DebugRenderer.renderEntityDebug(mockEntity);
      expect(displayedText.some(t => t.includes('Faction:'))).to.be.true;
    });
    
    it('should display speed information', function() {
      let displayedText = [];
      global.text = (txt) => displayedText.push(txt);
      DebugRenderer.renderEntityDebug(mockEntity);
      expect(displayedText.some(t => t.includes('Speed:'))).to.be.true;
    });
    
    it('should handle entity without faction', function() {
      delete mockEntity._faction;
      let displayedText = [];
      global.text = (txt) => displayedText.push(txt);
      DebugRenderer.renderEntityDebug(mockEntity);
      expect(displayedText.some(t => t.includes('unknown'))).to.be.true;
    });
    
    it('should handle entity without speed method', function() {
      delete mockEntity.getEffectiveMovementSpeed;
      expect(() => DebugRenderer.renderEntityDebug(mockEntity)).to.not.throw();
    });
    
    it('should format speed as number', function() {
      let displayedText = [];
      global.text = (txt) => displayedText.push(txt);
      DebugRenderer.renderEntityDebug(mockEntity);
      const speedText = displayedText.find(t => t.includes('Speed:'));
      expect(speedText).to.exist;
    });
  });
  
  describe('Error Handling', function() {
    it('should not throw on null entity', function() {
      expect(() => DebugRenderer.renderEntityDebug(null)).to.not.throw();
    });
    
    it('should not throw on undefined entity', function() {
      expect(() => DebugRenderer.renderEntityDebug(undefined)).to.not.throw();
    });
    
    it('should handle errors gracefully', function() {
      const badEntity = {
        getPosition: () => { throw new Error('Position error'); },
        getCurrentState: () => 'IDLE'
      };
      // Implementation has try-catch, so it won't throw
      expect(() => DebugRenderer.renderEntityDebug(badEntity)).to.not.throw();
    });
    
    it('should handle missing p5.js functions', function() {
      const savedPush = global.push;
      global.push = undefined;
      expect(() => DebugRenderer.renderEntityDebug(mockEntity)).to.not.throw();
      global.push = savedPush;
    });
    
    it('should handle text function throwing', function() {
      global.text = () => { throw new Error('Text error'); };
      // Implementation has try-catch, so it won't throw
      expect(() => DebugRenderer.renderEntityDebug(mockEntity)).to.not.throw();
    });
  });
  
  describe('Module Export', function() {
    it('should export DebugRenderer object', function() {
      expect(DebugRenderer).to.be.an('object');
      expect(DebugRenderer.renderEntityDebug).to.be.a('function');
    });
  });
  
  describe('Edge Cases', function() {
    it('should handle entity with all optional features', function() {
      const fullEntity = {
        posX: 100,
        posY: 200,
        _faction: 'enemy',
        faction: 'fallback',
        getPosition: () => ({ x: 100, y: 200 }),
        getCurrentState: () => 'ATTACKING',
        getEffectiveMovementSpeed: () => 3.7
      };
      expect(() => DebugRenderer.renderEntityDebug(fullEntity)).to.not.throw();
    });
    
    it('should handle entity with minimal features', function() {
      const minEntity = {
        posX: 0,
        posY: 0
      };
      expect(() => DebugRenderer.renderEntityDebug(minEntity)).to.not.throw();
    });
    
    it('should handle very large coordinates', function() {
      mockEntity.posX = 100000;
      mockEntity.posY = 200000;
      expect(() => DebugRenderer.renderEntityDebug(mockEntity)).to.not.throw();
    });
    
    it('should handle negative coordinates', function() {
      mockEntity.posX = -100;
      mockEntity.posY = -200;
      expect(() => DebugRenderer.renderEntityDebug(mockEntity)).to.not.throw();
    });
    
    it('should handle fractional speed values', function() {
      mockEntity.getEffectiveMovementSpeed = () => 2.567891;
      let displayedText = [];
      global.text = (txt) => displayedText.push(txt);
      DebugRenderer.renderEntityDebug(mockEntity);
      const speedText = displayedText.find(t => t.includes('Speed:'));
      expect(speedText).to.match(/\d+\.\d/);
    });
  });
});
