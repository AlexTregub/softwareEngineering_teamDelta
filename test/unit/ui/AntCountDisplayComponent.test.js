/**
 * Unit Tests for AntCountDisplayComponent
 * 
 * Tests the ant population display UI component
 */

const { expect } = require('chai');

// Mock p5.js functions
global.push = function() {};
global.pop = function() {};
global.fill = function() {};
global.stroke = function() {};
global.noStroke = function() {};
global.strokeWeight = function() {};
global.textAlign = function() {};
global.textSize = function() {};
global.text = function() {};
global.rect = function() {};
global.line = function() {};
global.image = function() {};
global.imageMode = function() {};
global.tint = function() {};
global.noTint = function() {};
global.circle = function() {};
global.LEFT = 'LEFT';
global.TOP = 'TOP';
global.CORNER = 'CORNER';

describe('AntCountDisplayComponent', function() {
  let AntCountDisplayComponent;
  let display;
  
  before(function() {
    // Load the component
    AntCountDisplayComponent = require('../../../Classes/ui/AntCountDisplayComponent.js');
  });
  
  beforeEach(function() {
    // Reset global ants array
    global.ants = [];
    global.JobImages = {
      Scout: { width: 32, height: 32 },
      Builder: { width: 32, height: 32 },
      Farmer: { width: 32, height: 32 },
      Warrior: { width: 32, height: 32 },
      Spitter: { width: 32, height: 32 },
      Queen: { width: 32, height: 32 }
    };
    
    // Create fresh display instance
    display = new AntCountDisplayComponent(20, 20);
  });
  
  afterEach(function() {
    if (display) {
      display.destroy();
      display = null;
    }
  });
  
  describe('Constructor', function() {
    it('should initialize with default values', function() {
      expect(display.x).to.equal(20);
      expect(display.y).to.equal(20);
      expect(display.currentAnts).to.equal(0);
      expect(display.maxAnts).to.equal(50);
      expect(display.isExpanded).to.be.false;
    });
    
    it('should initialize ant types array', function() {
      expect(display.antTypes).to.be.an('array');
      expect(display.antTypes).to.have.lengthOf(7);
      
      const typeNames = display.antTypes.map(t => t.type);
      expect(typeNames).to.include('Worker');
      expect(typeNames).to.include('Builder');
      expect(typeNames).to.include('Farmer');
      expect(typeNames).to.include('Scout');
      expect(typeNames).to.include('Soldier');
      expect(typeNames).to.include('Spitter');
      expect(typeNames).to.include('Queen');
    });
    
    it('should initialize with collapsed state', function() {
      expect(display.currentHeight).to.equal(display.panelHeight);
      expect(display.isExpanded).to.be.false;
    });
  });
  
  describe('Sprite Loading', function() {
    it('should load sprites from JobImages global', function() {
      // Sprites should be loaded during construction
      const builderType = display.antTypes.find(t => t.type === 'Builder');
      expect(builderType.icon).to.not.be.null;
    });
    
    it('should handle missing JobImages gracefully', function() {
      delete global.JobImages;
      const newDisplay = new AntCountDisplayComponent(0, 0);
      expect(newDisplay.antTypes[0].icon).to.be.null;
    });
  });
  
  describe('Ant Counting', function() {
    it('should count player ants correctly', function() {
      // Add player ants
      global.ants = [
        { _faction: 'player', JobName: 'Scout' },
        { _faction: 'player', JobName: 'Builder' },
        { _faction: 'player', JobName: 'Scout' }
      ];
      
      display.updateFromAntsArray();
      
      expect(display.currentAnts).to.equal(3);
      const scoutType = display.antTypes.find(t => t.type === 'Scout');
      const builderType = display.antTypes.find(t => t.type === 'Builder');
      expect(scoutType.count).to.equal(2);
      expect(builderType.count).to.equal(1);
    });
    
    it('should filter out enemy ants', function() {
      global.ants = [
        { _faction: 'player', JobName: 'Scout' },
        { _faction: 'enemy', JobName: 'Scout' },
        { _faction: 'player', JobName: 'Builder' }
      ];
      
      display.updateFromAntsArray();
      
      expect(display.currentAnts).to.equal(2); // Only player ants
    });
    
    it('should handle various faction property formats', function() {
      global.ants = [
        { _faction: 'player', JobName: 'Scout' },
        { faction: 'player', JobName: 'Builder' },
        { JobName: 'Farmer' } // No faction = default to player
      ];
      
      display.updateFromAntsArray();
      
      expect(display.currentAnts).to.equal(3);
    });
    
    it('should handle job name aliases', function() {
      global.ants = [
        { _faction: 'player', JobName: 'Warrior' }, // Should map to Soldier
        { _faction: 'player', JobName: 'Gatherer' } // Should map to Worker
      ];
      
      display.updateFromAntsArray();
      
      const soldierType = display.antTypes.find(t => t.type === 'Soldier');
      const workerType = display.antTypes.find(t => t.type === 'Worker');
      expect(soldierType.count).to.equal(1);
      expect(workerType.count).to.equal(1);
    });
    
    it('should handle various job name properties', function() {
      global.ants = [
        { _faction: 'player', JobName: 'Scout' },
        { _faction: 'player', jobName: 'Builder' },
        { _faction: 'player', _JobName: 'Farmer' },
        { _faction: 'player', job: { name: 'Queen' } }
      ];
      
      display.updateFromAntsArray();
      
      expect(display.currentAnts).to.equal(4);
      expect(display.antTypes.find(t => t.type === 'Scout').count).to.equal(1);
      expect(display.antTypes.find(t => t.type === 'Builder').count).to.equal(1);
      expect(display.antTypes.find(t => t.type === 'Farmer').count).to.equal(1);
      expect(display.antTypes.find(t => t.type === 'Queen').count).to.equal(1);
    });
    
    it('should default to Scout for unknown job types', function() {
      global.ants = [
        { _faction: 'player', JobName: 'UnknownJob' }
      ];
      
      display.updateFromAntsArray();
      
      const scoutType = display.antTypes.find(t => t.type === 'Scout');
      expect(scoutType.count).to.equal(1);
    });
    
    it('should handle empty ants array', function() {
      global.ants = [];
      
      display.updateFromAntsArray();
      
      expect(display.currentAnts).to.equal(0);
      display.antTypes.forEach(type => {
        expect(type.count).to.equal(0);
      });
    });
    
    it('should handle undefined ants array', function() {
      delete global.ants;
      
      display.updateFromAntsArray();
      
      expect(display.currentAnts).to.equal(0);
    });
  });
  
  describe('Expand/Collapse', function() {
    it('should toggle expanded state', function() {
      expect(display.isExpanded).to.be.false;
      
      display.toggleExpanded();
      expect(display.isExpanded).to.be.true;
      
      display.toggleExpanded();
      expect(display.isExpanded).to.be.false;
    });
    
    it('should set expanded state directly', function() {
      display.setExpanded(true);
      expect(display.isExpanded).to.be.true;
      
      display.setExpanded(false);
      expect(display.isExpanded).to.be.false;
    });
    
    it('should animate height toward target', function() {
      display.isExpanded = false;
      display.currentHeight = display.panelHeight;
      
      display.setExpanded(true);
      display.update(); // First frame
      
      // Height should be animating toward expandedHeight
      expect(display.currentHeight).to.be.above(display.panelHeight);
      expect(display.currentHeight).to.be.below(display.expandedHeight);
    });
  });
  
  describe('Mouse Interaction', function() {
    it('should detect mouse over panel', function() {
      // Inside panel
      expect(display.isMouseOver(50, 30)).to.be.true;
      
      // Outside panel
      expect(display.isMouseOver(250, 30)).to.be.false;
      expect(display.isMouseOver(50, 200)).to.be.false;
    });
    
    it('should handle click to toggle expand', function() {
      expect(display.isExpanded).to.be.false;
      
      const handled = display.handleClick(50, 30);
      
      expect(handled).to.be.true;
      expect(display.isExpanded).to.be.true;
    });
    
    it('should return false when click is outside panel', function() {
      const handled = display.handleClick(500, 500);
      
      expect(handled).to.be.false;
      expect(display.isExpanded).to.be.false;
    });
    
    it('should set hover state', function() {
      expect(display.isHovering).to.be.false;
      
      display.setHovered(true);
      expect(display.isHovering).to.be.true;
      
      display.setHovered(false);
      expect(display.isHovering).to.be.false;
    });
  });
  
  describe('Position Management', function() {
    it('should update position', function() {
      display.setPosition(100, 200);
      
      expect(display.x).to.equal(100);
      expect(display.y).to.equal(200);
    });
    
    it('should use new position for mouse detection', function() {
      display.setPosition(100, 200);
      
      expect(display.isMouseOver(150, 220)).to.be.true;
      expect(display.isMouseOver(50, 30)).to.be.false;
    });
  });
  
  describe('Manual Updates', function() {
    it('should allow manual total updates', function() {
      display.updateTotal(75, 100);
      
      expect(display.currentAnts).to.equal(75);
      expect(display.maxAnts).to.equal(100);
    });
    
    it('should allow manual type count updates', function() {
      display.updateTypeCount('Scout', 15);
      display.updateTypeCount('Builder', 8);
      
      const scoutType = display.antTypes.find(t => t.type === 'Scout');
      const builderType = display.antTypes.find(t => t.type === 'Builder');
      
      expect(scoutType.count).to.equal(15);
      expect(builderType.count).to.equal(8);
    });
    
    it('should ignore invalid type names', function() {
      display.updateTypeCount('InvalidType', 10);
      
      // Should not throw error, just ignore
      expect(true).to.be.true;
    });
  });
  
  describe('Update Loop', function() {
    it('should query ants array on update', function() {
      global.ants = [
        { _faction: 'player', JobName: 'Scout' },
        { _faction: 'player', JobName: 'Builder' }
      ];
      
      display.update();
      
      expect(display.currentAnts).to.equal(2);
    });
    
    it('should animate height on update', function() {
      display.setExpanded(true);
      display.currentHeight = display.panelHeight;
      
      display.update();
      
      expect(display.currentHeight).to.be.above(display.panelHeight);
    });
  });
  
  describe('Render', function() {
    it('should only render in PLAYING state', function() {
      // Mock render calls to track if rendering happens
      let renderCalled = false;
      const originalPush = global.push;
      global.push = function() { renderCalled = true; };
      
      display.render('MENU');
      expect(renderCalled).to.be.false;
      
      display.render('PLAYING');
      expect(renderCalled).to.be.true;
      
      global.push = originalPush;
    });
  });
  
  describe('Cleanup', function() {
    it('should cleanup references on destroy', function() {
      display.destroy();
      
      expect(display.sprites).to.be.null;
      expect(display.antSprite).to.be.null;
    });
  });
});
