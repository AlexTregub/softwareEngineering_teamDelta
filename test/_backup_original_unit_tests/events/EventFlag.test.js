/**
 * Unit Tests: EventFlag Class
 * TDD Phase 2A: Write tests FIRST before implementation
 * 
 * Tests visual flag entity with trigger zones for Level Editor
 */

const { expect } = require('chai');
const sinon = require('sinon');

describe('EventFlag', function() {
  let EventFlag;
  
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
    global.CORNER = 'corner';
    global.textAlign = sinon.stub();
    global.textSize = sinon.stub();
    global.text = sinon.stub();
    
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
      window.CORNER = global.CORNER;
      window.textAlign = global.textAlign;
      window.textSize = global.textSize;
      window.text = global.text;
    }
    
    // Load EventFlag class (will fail initially)
    try {
      EventFlag = require('../../../Classes/events/EventFlag');
    } catch (e) {
      // Class doesn't exist yet - expected for TDD
      EventFlag = null;
    }
  });
  
  afterEach(function() {
    sinon.restore();
  });
  
  describe('Constructor', function() {
    it('should initialize with position and circle shape by default', function() {
      if (!EventFlag) this.skip();
      
      const flag = new EventFlag({
        x: 100,
        y: 200,
        radius: 50,
        eventId: 'test-event-1'
      });
      
      expect(flag.x).to.equal(100);
      expect(flag.y).to.equal(200);
      expect(flag.radius).to.equal(50);
      expect(flag.eventId).to.equal('test-event-1');
      expect(flag.shape).to.equal('circle');
    });
    
    it('should initialize with rectangle shape when specified', function() {
      if (!EventFlag) this.skip();
      
      const flag = new EventFlag({
        x: 100,
        y: 200,
        width: 80,
        height: 60,
        shape: 'rectangle',
        eventId: 'test-event-2'
      });
      
      expect(flag.x).to.equal(100);
      expect(flag.y).to.equal(200);
      expect(flag.width).to.equal(80);
      expect(flag.height).to.equal(60);
      expect(flag.shape).to.equal('rectangle');
    });
    
    it('should generate unique ID if not provided', function() {
      if (!EventFlag) this.skip();
      
      const flag1 = new EventFlag({ x: 0, y: 0, radius: 10, eventId: 'evt-1' });
      const flag2 = new EventFlag({ x: 0, y: 0, radius: 10, eventId: 'evt-1' });
      
      expect(flag1.id).to.exist;
      expect(flag2.id).to.exist;
      expect(flag1.id).to.not.equal(flag2.id);
    });
    
    it('should use provided ID if given', function() {
      if (!EventFlag) this.skip();
      
      const flag = new EventFlag({
        id: 'custom-flag-id',
        x: 0,
        y: 0,
        radius: 10,
        eventId: 'evt-1'
      });
      
      expect(flag.id).to.equal('custom-flag-id');
    });
    
    it('should set default color if not provided', function() {
      if (!EventFlag) this.skip();
      
      const flag = new EventFlag({
        x: 0,
        y: 0,
        radius: 10,
        eventId: 'evt-1'
      });
      
      expect(flag.color).to.exist;
    });
    
    it('should accept custom color', function() {
      if (!EventFlag) this.skip();
      
      const customColor = { r: 255, g: 0, b: 0, a: 128 };
      const flag = new EventFlag({
        x: 0,
        y: 0,
        radius: 10,
        eventId: 'evt-1',
        color: customColor
      });
      
      expect(flag.color).to.equal(customColor);
    });
    
    it('should default to repeatable trigger', function() {
      if (!EventFlag) this.skip();
      
      const flag = new EventFlag({
        x: 0,
        y: 0,
        radius: 10,
        eventId: 'evt-1'
      });
      
      expect(flag.oneTime).to.be.false;
    });
    
    it('should support one-time trigger flag', function() {
      if (!EventFlag) this.skip();
      
      const flag = new EventFlag({
        x: 0,
        y: 0,
        radius: 10,
        eventId: 'evt-1',
        oneTime: true
      });
      
      expect(flag.oneTime).to.be.true;
    });
  });
  
  describe('Validation', function() {
    it('should throw error if eventId is missing', function() {
      if (!EventFlag) this.skip();
      
      expect(() => {
        new EventFlag({ x: 0, y: 0, radius: 10 });
      }).to.throw(/eventId/);
    });
    
    it('should throw error if position is missing', function() {
      if (!EventFlag) this.skip();
      
      expect(() => {
        new EventFlag({ radius: 10, eventId: 'evt-1' });
      }).to.throw(/position|x|y/i);
    });
    
    it('should throw error if circle has no radius', function() {
      if (!EventFlag) this.skip();
      
      expect(() => {
        new EventFlag({ x: 0, y: 0, shape: 'circle', eventId: 'evt-1' });
      }).to.throw(/radius/);
    });
    
    it('should throw error if rectangle has no width or height', function() {
      if (!EventFlag) this.skip();
      
      expect(() => {
        new EventFlag({ x: 0, y: 0, shape: 'rectangle', eventId: 'evt-1' });
      }).to.throw(/width|height/i);
    });
    
    it('should handle negative radius by using absolute value', function() {
      if (!EventFlag) this.skip();
      
      const flag = new EventFlag({
        x: 0,
        y: 0,
        radius: -50,
        eventId: 'evt-1'
      });
      
      expect(flag.radius).to.equal(50);
    });
  });
  
  describe('containsPoint()', function() {
    it('should detect point inside circle trigger zone', function() {
      if (!EventFlag) this.skip();
      
      const flag = new EventFlag({
        x: 100,
        y: 100,
        radius: 50,
        eventId: 'evt-1'
      });
      
      // Point at center
      expect(flag.containsPoint(100, 100)).to.be.true;
      
      // Point near edge (inside)
      expect(flag.containsPoint(140, 100)).to.be.true;
      
      // Point on edge (use <= for inclusive)
      expect(flag.containsPoint(150, 100)).to.be.true;
    });
    
    it('should detect point outside circle trigger zone', function() {
      if (!EventFlag) this.skip();
      
      const flag = new EventFlag({
        x: 100,
        y: 100,
        radius: 50,
        eventId: 'evt-1'
      });
      
      // Point outside
      expect(flag.containsPoint(200, 200)).to.be.false;
      expect(flag.containsPoint(151, 100)).to.be.false;
    });
    
    it('should detect point inside rectangle trigger zone', function() {
      if (!EventFlag) this.skip();
      
      const flag = new EventFlag({
        x: 100,
        y: 100,
        width: 80,
        height: 60,
        shape: 'rectangle',
        eventId: 'evt-1'
      });
      
      // Center point (rectangle centered at x, y)
      expect(flag.containsPoint(100, 100)).to.be.true;
      
      // Point near edge (inside)
      expect(flag.containsPoint(130, 120)).to.be.true;
    });
    
    it('should detect point outside rectangle trigger zone', function() {
      if (!EventFlag) this.skip();
      
      const flag = new EventFlag({
        x: 100,
        y: 100,
        width: 80,
        height: 60,
        shape: 'rectangle',
        eventId: 'evt-1'
      });
      
      // Point outside
      expect(flag.containsPoint(200, 200)).to.be.false;
      expect(flag.containsPoint(50, 50)).to.be.false;
    });
  });
  
  describe('render()', function() {
    it('should render circle flag when editorMode is true', function() {
      if (!EventFlag) this.skip();
      
      const flag = new EventFlag({
        x: 100,
        y: 100,
        radius: 50,
        eventId: 'evt-1'
      });
      
      global.circle.resetHistory();
      
      flag.render(true);
      
      expect(global.circle.calledOnce).to.be.true;
    });
    
    it('should render rectangle flag when editorMode is true', function() {
      if (!EventFlag) this.skip();
      
      const flag = new EventFlag({
        x: 100,
        y: 100,
        width: 80,
        height: 60,
        shape: 'rectangle',
        eventId: 'evt-1'
      });
      
      global.rect.resetHistory();
      
      flag.render(true);
      
      expect(global.rect.calledOnce).to.be.true;
    });
    
    it('should NOT render when editorMode is false', function() {
      if (!EventFlag) this.skip();
      
      const flag = new EventFlag({
        x: 100,
        y: 100,
        radius: 50,
        eventId: 'evt-1'
      });
      
      global.circle.resetHistory();
      global.rect.resetHistory();
      
      flag.render(false);
      
      expect(global.circle.called).to.be.false;
      expect(global.rect.called).to.be.false;
    });
    
    it('should use push/pop for style isolation', function() {
      if (!EventFlag) this.skip();
      
      const flag = new EventFlag({
        x: 100,
        y: 100,
        radius: 50,
        eventId: 'evt-1'
      });
      
      global.push.resetHistory();
      global.pop.resetHistory();
      
      flag.render(true);
      
      expect(global.push.calledOnce).to.be.true;
      expect(global.pop.calledOnce).to.be.true;
    });
  });
  
  describe('exportToJSON()', function() {
    it('should export circle flag to JSON', function() {
      if (!EventFlag) this.skip();
      
      const flag = new EventFlag({
        id: 'flag-1',
        x: 100,
        y: 200,
        radius: 50,
        eventId: 'evt-1',
        oneTime: true
      });
      
      const json = flag.exportToJSON();
      
      expect(json.id).to.equal('flag-1');
      expect(json.x).to.equal(100);
      expect(json.y).to.equal(200);
      expect(json.radius).to.equal(50);
      expect(json.shape).to.equal('circle');
      expect(json.eventId).to.equal('evt-1');
      expect(json.oneTime).to.be.true;
    });
    
    it('should export rectangle flag to JSON', function() {
      if (!EventFlag) this.skip();
      
      const flag = new EventFlag({
        id: 'flag-2',
        x: 100,
        y: 200,
        width: 80,
        height: 60,
        shape: 'rectangle',
        eventId: 'evt-2'
      });
      
      const json = flag.exportToJSON();
      
      expect(json.id).to.equal('flag-2');
      expect(json.width).to.equal(80);
      expect(json.height).to.equal(60);
      expect(json.shape).to.equal('rectangle');
    });
    
    it('should include color in export', function() {
      if (!EventFlag) this.skip();
      
      const customColor = { r: 255, g: 0, b: 0, a: 128 };
      const flag = new EventFlag({
        x: 0,
        y: 0,
        radius: 10,
        eventId: 'evt-1',
        color: customColor
      });
      
      const json = flag.exportToJSON();
      
      expect(json.color).to.deep.equal(customColor);
    });
  });
  
  describe('importFromJSON()', function() {
    it('should create EventFlag from JSON data', function() {
      if (!EventFlag) this.skip();
      
      const data = {
        id: 'flag-1',
        x: 100,
        y: 200,
        radius: 50,
        shape: 'circle',
        eventId: 'evt-1',
        oneTime: true,
        color: { r: 255, g: 0, b: 0, a: 128 }
      };
      
      const flag = EventFlag.importFromJSON(data);
      
      expect(flag.id).to.equal('flag-1');
      expect(flag.x).to.equal(100);
      expect(flag.y).to.equal(200);
      expect(flag.radius).to.equal(50);
      expect(flag.eventId).to.equal('evt-1');
      expect(flag.oneTime).to.be.true;
    });
    
    it('should handle rectangle import', function() {
      if (!EventFlag) this.skip();
      
      const data = {
        id: 'flag-2',
        x: 100,
        y: 200,
        width: 80,
        height: 60,
        shape: 'rectangle',
        eventId: 'evt-2'
      };
      
      const flag = EventFlag.importFromJSON(data);
      
      expect(flag.shape).to.equal('rectangle');
      expect(flag.width).to.equal(80);
      expect(flag.height).to.equal(60);
    });
  });
  
  describe('Edge Cases', function() {
    it('should handle zero radius', function() {
      if (!EventFlag) this.skip();
      
      const flag = new EventFlag({
        x: 0,
        y: 0,
        radius: 0,
        eventId: 'evt-1'
      });
      
      expect(flag.radius).to.equal(0);
      expect(flag.containsPoint(0, 0)).to.be.true;
      expect(flag.containsPoint(1, 1)).to.be.false;
    });
    
    it('should handle very large coordinates', function() {
      if (!EventFlag) this.skip();
      
      const flag = new EventFlag({
        x: 100000,
        y: 100000,
        radius: 50,
        eventId: 'evt-1'
      });
      
      expect(flag.x).to.equal(100000);
      expect(flag.containsPoint(100000, 100000)).to.be.true;
    });
  });
});
