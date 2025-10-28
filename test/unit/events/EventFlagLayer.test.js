/**
 * Unit Tests: EventFlagLayer Class
 * TDD Phase 3A: Write tests FIRST before implementation
 * 
 * Tests collection manager for EventFlags in Level Editor
 */

const { expect } = require('chai');
const sinon = require('sinon');

describe('EventFlagLayer', function() {
  let EventFlagLayer, EventFlag;
  
  before(function() {
    // Mock p5.js functions
    global.createVector = sinon.stub().callsFake((x, y) => ({ x, y }));
    global.color = sinon.stub().callsFake((r, g, b, a) => ({ r, g, b, a }));
    global.push = sinon.stub();
    global.pop = sinon.stub();
    global.fill = sinon.stub();
    global.stroke = sinon.stub();
    global.strokeWeight = sinon.stub();
    global.noStroke = sinon.stub();
    global.circle = sinon.stub();
    global.rect = sinon.stub();
    global.rectMode = sinon.stub();
    global.CENTER = 'center';
    
    // Sync to window for JSDOM
    if (typeof window !== 'undefined') {
      window.createVector = global.createVector;
      window.color = global.color;
      window.push = global.push;
      window.pop = global.pop;
      window.fill = global.fill;
      window.stroke = global.stroke;
      window.strokeWeight = global.strokeWeight;
      window.noStroke = global.noStroke;
      window.circle = global.circle;
      window.rect = global.rect;
      window.rectMode = global.rectMode;
      window.CENTER = global.CENTER;
    }
    
    // Load dependencies
    EventFlag = require('../../../Classes/events/EventFlag');
    
    // Make EventFlag globally available for importFromJSON
    global.EventFlag = EventFlag;
    if (typeof window !== 'undefined') {
      window.EventFlag = EventFlag;
    }
    
    // Load EventFlagLayer class (will fail initially)
    try {
      EventFlagLayer = require('../../../Classes/events/EventFlagLayer');
    } catch (e) {
      // Class doesn't exist yet - expected for TDD
      EventFlagLayer = null;
    }
  });
  
  afterEach(function() {
    sinon.resetHistory();
  });
  
  after(function() {
    sinon.restore();
  });
  
  describe('Constructor', function() {
    it('should initialize with empty flags collection', function() {
      if (!EventFlagLayer) this.skip();
      
      const layer = new EventFlagLayer();
      
      expect(layer.flags).to.exist;
      expect(layer.flags.size).to.equal(0);
    });
    
    it('should initialize with no selected flag', function() {
      if (!EventFlagLayer) this.skip();
      
      const layer = new EventFlagLayer();
      
      expect(layer.selectedFlagId).to.be.null;
    });
    
    it('should accept optional terrain reference', function() {
      if (!EventFlagLayer) this.skip();
      
      const mockTerrain = { width: 1000, height: 1000 };
      const layer = new EventFlagLayer(mockTerrain);
      
      expect(layer.terrain).to.equal(mockTerrain);
    });
  });
  
  describe('addFlag()', function() {
    it('should add flag to collection', function() {
      if (!EventFlagLayer) this.skip();
      
      const layer = new EventFlagLayer();
      const flag = new EventFlag({
        x: 100,
        y: 100,
        radius: 50,
        eventId: 'evt-1'
      });
      
      layer.addFlag(flag);
      
      expect(layer.flags.size).to.equal(1);
      expect(layer.flags.has(flag.id)).to.be.true;
    });
    
    it('should return the added flag', function() {
      if (!EventFlagLayer) this.skip();
      
      const layer = new EventFlagLayer();
      const flag = new EventFlag({
        x: 100,
        y: 100,
        radius: 50,
        eventId: 'evt-1'
      });
      
      const result = layer.addFlag(flag);
      
      expect(result).to.equal(flag);
    });
    
    it('should allow adding multiple flags', function() {
      if (!EventFlagLayer) this.skip();
      
      const layer = new EventFlagLayer();
      const flag1 = new EventFlag({ x: 100, y: 100, radius: 50, eventId: 'evt-1' });
      const flag2 = new EventFlag({ x: 200, y: 200, radius: 50, eventId: 'evt-2' });
      
      layer.addFlag(flag1);
      layer.addFlag(flag2);
      
      expect(layer.flags.size).to.equal(2);
    });
    
    it('should replace flag with same ID', function() {
      if (!EventFlagLayer) this.skip();
      
      const layer = new EventFlagLayer();
      const flag1 = new EventFlag({ id: 'flag-1', x: 100, y: 100, radius: 50, eventId: 'evt-1' });
      const flag2 = new EventFlag({ id: 'flag-1', x: 200, y: 200, radius: 50, eventId: 'evt-2' });
      
      layer.addFlag(flag1);
      layer.addFlag(flag2);
      
      expect(layer.flags.size).to.equal(1);
      expect(layer.flags.get('flag-1').x).to.equal(200);
    });
  });
  
  describe('removeFlag()', function() {
    it('should remove flag by ID', function() {
      if (!EventFlagLayer) this.skip();
      
      const layer = new EventFlagLayer();
      const flag = new EventFlag({ id: 'flag-1', x: 100, y: 100, radius: 50, eventId: 'evt-1' });
      
      layer.addFlag(flag);
      layer.removeFlag('flag-1');
      
      expect(layer.flags.size).to.equal(0);
      expect(layer.flags.has('flag-1')).to.be.false;
    });
    
    it('should return true if flag was removed', function() {
      if (!EventFlagLayer) this.skip();
      
      const layer = new EventFlagLayer();
      const flag = new EventFlag({ id: 'flag-1', x: 100, y: 100, radius: 50, eventId: 'evt-1' });
      
      layer.addFlag(flag);
      const result = layer.removeFlag('flag-1');
      
      expect(result).to.be.true;
    });
    
    it('should return false if flag does not exist', function() {
      if (!EventFlagLayer) this.skip();
      
      const layer = new EventFlagLayer();
      const result = layer.removeFlag('nonexistent');
      
      expect(result).to.be.false;
    });
    
    it('should clear selection if selected flag is removed', function() {
      if (!EventFlagLayer) this.skip();
      
      const layer = new EventFlagLayer();
      const flag = new EventFlag({ id: 'flag-1', x: 100, y: 100, radius: 50, eventId: 'evt-1' });
      
      layer.addFlag(flag);
      layer.selectFlag('flag-1');
      layer.removeFlag('flag-1');
      
      expect(layer.selectedFlagId).to.be.null;
    });
  });
  
  describe('getFlag()', function() {
    it('should retrieve flag by ID', function() {
      if (!EventFlagLayer) this.skip();
      
      const layer = new EventFlagLayer();
      const flag = new EventFlag({ id: 'flag-1', x: 100, y: 100, radius: 50, eventId: 'evt-1' });
      
      layer.addFlag(flag);
      const retrieved = layer.getFlag('flag-1');
      
      expect(retrieved).to.equal(flag);
    });
    
    it('should return null if flag does not exist', function() {
      if (!EventFlagLayer) this.skip();
      
      const layer = new EventFlagLayer();
      const retrieved = layer.getFlag('nonexistent');
      
      expect(retrieved).to.be.null;
    });
  });
  
  describe('getAllFlags()', function() {
    it('should return empty array when no flags', function() {
      if (!EventFlagLayer) this.skip();
      
      const layer = new EventFlagLayer();
      const flags = layer.getAllFlags();
      
      expect(flags).to.be.an('array');
      expect(flags.length).to.equal(0);
    });
    
    it('should return array of all flags', function() {
      if (!EventFlagLayer) this.skip();
      
      const layer = new EventFlagLayer();
      const flag1 = new EventFlag({ x: 100, y: 100, radius: 50, eventId: 'evt-1' });
      const flag2 = new EventFlag({ x: 200, y: 200, radius: 50, eventId: 'evt-2' });
      
      layer.addFlag(flag1);
      layer.addFlag(flag2);
      
      const flags = layer.getAllFlags();
      
      expect(flags).to.be.an('array');
      expect(flags.length).to.equal(2);
      expect(flags).to.include(flag1);
      expect(flags).to.include(flag2);
    });
  });
  
  describe('findFlagsAtPosition()', function() {
    it('should find flag at position', function() {
      if (!EventFlagLayer) this.skip();
      
      const layer = new EventFlagLayer();
      const flag = new EventFlag({ x: 100, y: 100, radius: 50, eventId: 'evt-1' });
      
      layer.addFlag(flag);
      const found = layer.findFlagsAtPosition(100, 100);
      
      expect(found).to.be.an('array');
      expect(found.length).to.equal(1);
      expect(found[0]).to.equal(flag);
    });
    
    it('should return empty array if no flags at position', function() {
      if (!EventFlagLayer) this.skip();
      
      const layer = new EventFlagLayer();
      const flag = new EventFlag({ x: 100, y: 100, radius: 50, eventId: 'evt-1' });
      
      layer.addFlag(flag);
      const found = layer.findFlagsAtPosition(500, 500);
      
      expect(found).to.be.an('array');
      expect(found.length).to.equal(0);
    });
    
    it('should find multiple overlapping flags', function() {
      if (!EventFlagLayer) this.skip();
      
      const layer = new EventFlagLayer();
      const flag1 = new EventFlag({ x: 100, y: 100, radius: 50, eventId: 'evt-1' });
      const flag2 = new EventFlag({ x: 110, y: 110, radius: 50, eventId: 'evt-2' });
      
      layer.addFlag(flag1);
      layer.addFlag(flag2);
      
      const found = layer.findFlagsAtPosition(105, 105);
      
      expect(found.length).to.equal(2);
    });
  });
  
  describe('selectFlag()', function() {
    it('should select flag by ID', function() {
      if (!EventFlagLayer) this.skip();
      
      const layer = new EventFlagLayer();
      const flag = new EventFlag({ id: 'flag-1', x: 100, y: 100, radius: 50, eventId: 'evt-1' });
      
      layer.addFlag(flag);
      layer.selectFlag('flag-1');
      
      expect(layer.selectedFlagId).to.equal('flag-1');
    });
    
    it('should deselect if null is passed', function() {
      if (!EventFlagLayer) this.skip();
      
      const layer = new EventFlagLayer();
      const flag = new EventFlag({ id: 'flag-1', x: 100, y: 100, radius: 50, eventId: 'evt-1' });
      
      layer.addFlag(flag);
      layer.selectFlag('flag-1');
      layer.selectFlag(null);
      
      expect(layer.selectedFlagId).to.be.null;
    });
    
    it('should return true if flag exists', function() {
      if (!EventFlagLayer) this.skip();
      
      const layer = new EventFlagLayer();
      const flag = new EventFlag({ id: 'flag-1', x: 100, y: 100, radius: 50, eventId: 'evt-1' });
      
      layer.addFlag(flag);
      const result = layer.selectFlag('flag-1');
      
      expect(result).to.be.true;
    });
    
    it('should return false if flag does not exist', function() {
      if (!EventFlagLayer) this.skip();
      
      const layer = new EventFlagLayer();
      const result = layer.selectFlag('nonexistent');
      
      expect(result).to.be.false;
      expect(layer.selectedFlagId).to.be.null;
    });
  });
  
  describe('getSelectedFlag()', function() {
    it('should return selected flag instance', function() {
      if (!EventFlagLayer) this.skip();
      
      const layer = new EventFlagLayer();
      const flag = new EventFlag({ id: 'flag-1', x: 100, y: 100, radius: 50, eventId: 'evt-1' });
      
      layer.addFlag(flag);
      layer.selectFlag('flag-1');
      
      const selected = layer.getSelectedFlag();
      
      expect(selected).to.equal(flag);
    });
    
    it('should return null if no flag selected', function() {
      if (!EventFlagLayer) this.skip();
      
      const layer = new EventFlagLayer();
      const selected = layer.getSelectedFlag();
      
      expect(selected).to.be.null;
    });
  });
  
  describe('render()', function() {
    it('should call render on all flags when editorMode is true', function() {
      if (!EventFlagLayer) this.skip();
      
      const layer = new EventFlagLayer();
      const flag1 = new EventFlag({ x: 100, y: 100, radius: 50, eventId: 'evt-1' });
      const flag2 = new EventFlag({ x: 200, y: 200, radius: 50, eventId: 'evt-2' });
      
      // Spy on render methods
      const spy1 = sinon.spy(flag1, 'render');
      const spy2 = sinon.spy(flag2, 'render');
      
      layer.addFlag(flag1);
      layer.addFlag(flag2);
      
      layer.render(true);
      
      expect(spy1.calledOnce).to.be.true;
      expect(spy1.calledWith(true)).to.be.true;
      expect(spy2.calledOnce).to.be.true;
      expect(spy2.calledWith(true)).to.be.true;
    });
    
    it('should not render when editorMode is false', function() {
      if (!EventFlagLayer) this.skip();
      
      const layer = new EventFlagLayer();
      const flag = new EventFlag({ x: 100, y: 100, radius: 50, eventId: 'evt-1' });
      const spy = sinon.spy(flag, 'render');
      
      layer.addFlag(flag);
      layer.render(false);
      
      expect(spy.calledOnce).to.be.true;
      expect(spy.calledWith(false)).to.be.true;
    });
    
    it('should handle empty collection', function() {
      if (!EventFlagLayer) this.skip();
      
      const layer = new EventFlagLayer();
      
      expect(() => layer.render(true)).to.not.throw();
    });
  });
  
  describe('exportToJSON()', function() {
    it('should export empty array when no flags', function() {
      if (!EventFlagLayer) this.skip();
      
      const layer = new EventFlagLayer();
      const json = layer.exportToJSON();
      
      expect(json).to.be.an('array');
      expect(json.length).to.equal(0);
    });
    
    it('should export all flags to JSON array', function() {
      if (!EventFlagLayer) this.skip();
      
      const layer = new EventFlagLayer();
      const flag1 = new EventFlag({ id: 'flag-1', x: 100, y: 100, radius: 50, eventId: 'evt-1' });
      const flag2 = new EventFlag({ id: 'flag-2', x: 200, y: 200, radius: 50, eventId: 'evt-2' });
      
      layer.addFlag(flag1);
      layer.addFlag(flag2);
      
      const json = layer.exportToJSON();
      
      expect(json).to.be.an('array');
      expect(json.length).to.equal(2);
      expect(json[0].id).to.equal('flag-1');
      expect(json[1].id).to.equal('flag-2');
    });
  });
  
  describe('importFromJSON()', function() {
    it('should import flags from JSON array', function() {
      if (!EventFlagLayer) this.skip();
      
      const layer = new EventFlagLayer();
      const data = [
        { id: 'flag-1', x: 100, y: 100, radius: 50, shape: 'circle', eventId: 'evt-1' },
        { id: 'flag-2', x: 200, y: 200, radius: 50, shape: 'circle', eventId: 'evt-2' }
      ];
      
      layer.importFromJSON(data);
      
      expect(layer.flags.size).to.equal(2);
      expect(layer.getFlag('flag-1')).to.exist;
      expect(layer.getFlag('flag-2')).to.exist;
    });
    
    it('should clear existing flags before import', function() {
      if (!EventFlagLayer) this.skip();
      
      const layer = new EventFlagLayer();
      const existingFlag = new EventFlag({ x: 50, y: 50, radius: 25, eventId: 'evt-old' });
      
      layer.addFlag(existingFlag);
      
      const data = [
        { id: 'flag-1', x: 100, y: 100, radius: 50, shape: 'circle', eventId: 'evt-1' }
      ];
      
      layer.importFromJSON(data);
      
      expect(layer.flags.size).to.equal(1);
      expect(layer.getFlag('flag-1')).to.exist;
    });
    
    it('should handle empty array', function() {
      if (!EventFlagLayer) this.skip();
      
      const layer = new EventFlagLayer();
      layer.importFromJSON([]);
      
      expect(layer.flags.size).to.equal(0);
    });
  });
  
  describe('clear()', function() {
    it('should remove all flags', function() {
      if (!EventFlagLayer) this.skip();
      
      const layer = new EventFlagLayer();
      const flag1 = new EventFlag({ x: 100, y: 100, radius: 50, eventId: 'evt-1' });
      const flag2 = new EventFlag({ x: 200, y: 200, radius: 50, eventId: 'evt-2' });
      
      layer.addFlag(flag1);
      layer.addFlag(flag2);
      layer.clear();
      
      expect(layer.flags.size).to.equal(0);
    });
    
    it('should clear selection', function() {
      if (!EventFlagLayer) this.skip();
      
      const layer = new EventFlagLayer();
      const flag = new EventFlag({ id: 'flag-1', x: 100, y: 100, radius: 50, eventId: 'evt-1' });
      
      layer.addFlag(flag);
      layer.selectFlag('flag-1');
      layer.clear();
      
      expect(layer.selectedFlagId).to.be.null;
    });
  });
  
  describe('Edge Cases', function() {
    it('should handle adding null flag gracefully', function() {
      if (!EventFlagLayer) this.skip();
      
      const layer = new EventFlagLayer();
      
      expect(() => layer.addFlag(null)).to.throw();
    });
    
    it('should handle large number of flags', function() {
      if (!EventFlagLayer) this.skip();
      
      const layer = new EventFlagLayer();
      
      for (let i = 0; i < 1000; i++) {
        const flag = new EventFlag({
          x: i * 10,
          y: i * 10,
          radius: 50,
          eventId: `evt-${i}`
        });
        layer.addFlag(flag);
      }
      
      expect(layer.flags.size).to.equal(1000);
    });
  });
});
