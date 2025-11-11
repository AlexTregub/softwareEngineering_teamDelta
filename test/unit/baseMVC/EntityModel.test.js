/**
 * EntityModel Unit Tests
 * Tests pure data storage and event system - NO business logic
 */

const { expect } = require('chai');
const sinon = require('sinon');

describe('EntityModel', function() {
  let EntityModel;
  let model;

  before(function() {
    // Mock p5.js createVector for JSDOM compatibility
    global.createVector = sinon.stub().callsFake((x, y) => ({ x, y }));
    global.performance = global.performance || { now: () => Date.now() };
  });

  beforeEach(function() {
    // Clear module cache to get fresh instance
    delete require.cache[require.resolve('../../../Classes/baseMVC/models/EntityModel.js')];
    EntityModel = require('../../../Classes/baseMVC/models/EntityModel.js');
    
    model = new EntityModel(100, 200, 32, 32, { 
      type: 'TestEntity',
      faction: 'player'
    });
  });

  afterEach(function() {
    sinon.restore();
  });

  describe('Constructor', function() {
    it('should create model with position', function() {
      expect(model.getPosition()).to.deep.equal({ x: 100, y: 200 });
    });

    it('should create model with size', function() {
      expect(model.getSize()).to.deep.equal({ x: 32, y: 32 });
    });

    it('should set type from options', function() {
      expect(model.getType()).to.equal('TestEntity');
    });

    it('should set faction from options', function() {
      expect(model.getFaction()).to.equal('player');
    });

    it('should generate unique ID', function() {
      const model2 = new EntityModel(0, 0, 32, 32);
      expect(model.getId()).to.not.equal(model2.getId());
    });

    it('should default to active', function() {
      expect(model.isActive()).to.be.true;
    });

    it('should initialize rotation to 0', function() {
      expect(model.getRotation()).to.equal(0);
    });
  });

  describe('Core Identity', function() {
    it('should get ID', function() {
      const id = model.getId();
      expect(id).to.be.a('string');
      expect(id.length).to.be.greaterThan(0);
    });

    it('should get type', function() {
      expect(model.getType()).to.equal('TestEntity');
    });

    it('should check active status', function() {
      expect(model.isActive()).to.be.true;
    });

    it('should set active status', function() {
      model.setActive(false);
      expect(model.isActive()).to.be.false;
    });
  });

  describe('Position Management', function() {
    it('should get position', function() {
      const pos = model.getPosition();
      expect(pos).to.deep.equal({ x: 100, y: 200 });
    });

    it('should set position', function() {
      model.setPosition(300, 400);
      expect(model.getPosition()).to.deep.equal({ x: 300, y: 400 });
    });

    it('should emit positionChanged event', function() {
      const callback = sinon.spy();
      model.on('positionChanged', callback);
      
      model.setPosition(500, 600);
      
      expect(callback.calledOnce).to.be.true;
      expect(callback.firstCall.args[0]).to.deep.include({
        x: 500,
        y: 600
      });
    });

    it('should handle negative positions', function() {
      model.setPosition(-50, -100);
      expect(model.getPosition()).to.deep.equal({ x: -50, y: -100 });
    });
  });

  describe('Size Management', function() {
    it('should get size', function() {
      const size = model.getSize();
      expect(size).to.deep.equal({ x: 32, y: 32 });
    });

    it('should set size', function() {
      model.setSize(64, 48);
      expect(model.getSize()).to.deep.equal({ x: 64, y: 48 });
    });

    it('should emit sizeChanged event', function() {
      const callback = sinon.spy();
      model.on('sizeChanged', callback);
      
      model.setSize(100, 120);
      
      expect(callback.calledOnce).to.be.true;
      expect(callback.firstCall.args[0]).to.deep.include({
        x: 100,
        y: 120
      });
    });
  });

  describe('Rotation Management', function() {
    it('should get rotation', function() {
      expect(model.getRotation()).to.equal(0);
    });

    it('should set rotation', function() {
      model.setRotation(45);
      expect(model.getRotation()).to.equal(45);
    });

    it('should emit rotationChanged event', function() {
      const callback = sinon.spy();
      model.on('rotationChanged', callback);
      
      model.setRotation(90);
      
      expect(callback.calledOnce).to.be.true;
      expect(callback.firstCall.args[0]).to.deep.include({
        rotation: 90
      });
    });

    it('should normalize rotation to 0-360', function() {
      model.setRotation(370);
      expect(model.getRotation()).to.equal(10);
      
      model.setRotation(-30);
      expect(model.getRotation()).to.equal(330);
    });
  });

  describe('Faction Management', function() {
    it('should get faction', function() {
      expect(model.getFaction()).to.equal('player');
    });

    it('should set faction', function() {
      model.setFaction('enemy');
      expect(model.getFaction()).to.equal('enemy');
    });

    it('should emit factionChanged event', function() {
      const callback = sinon.spy();
      model.on('factionChanged', callback);
      
      model.setFaction('neutral');
      
      expect(callback.calledOnce).to.be.true;
      expect(callback.firstCall.args[0]).to.deep.include({
        oldFaction: 'player',
        newFaction: 'neutral'
      });
    });

    it('should default faction to neutral', function() {
      const model2 = new EntityModel(0, 0, 32, 32);
      expect(model2.getFaction()).to.equal('neutral');
    });
  });

  describe('State Storage', function() {
    it('should store movement state', function() {
      model.setMoving(true);
      expect(model.isMoving()).to.be.true;
    });

    it('should store target position', function() {
      model.setTargetPosition(500, 600);
      expect(model.getTargetPosition()).to.deep.equal({ x: 500, y: 600 });
    });

    it('should store path', function() {
      const path = [{ x: 10, y: 20 }, { x: 30, y: 40 }];
      model.setPath(path);
      expect(model.getPath()).to.deep.equal(path);
    });

    it('should store selection state', function() {
      model.setSelected(true);
      expect(model.isSelected()).to.be.true;
    });

    it('should store hover state', function() {
      model.setHovered(true);
      expect(model.isHovered()).to.be.true;
    });

    it('should store box hover state', function() {
      model.setBoxHovered(true);
      expect(model.isBoxHovered()).to.be.true;
    });
  });

  describe('Event System', function() {
    it('should register event listener', function() {
      const callback = sinon.spy();
      model.on('testEvent', callback);
      
      model.emit('testEvent', { data: 'test' });
      
      expect(callback.calledOnce).to.be.true;
      expect(callback.firstCall.args[0]).to.deep.include({ data: 'test' });
    });

    it('should support multiple listeners', function() {
      const callback1 = sinon.spy();
      const callback2 = sinon.spy();
      
      model.on('testEvent', callback1);
      model.on('testEvent', callback2);
      
      model.emit('testEvent');
      
      expect(callback1.calledOnce).to.be.true;
      expect(callback2.calledOnce).to.be.true;
    });

    it('should remove event listener', function() {
      const callback = sinon.spy();
      model.on('testEvent', callback);
      model.off('testEvent', callback);
      
      model.emit('testEvent');
      
      expect(callback.called).to.be.false;
    });

    it('should handle missing event type', function() {
      expect(() => model.emit('nonexistent')).to.not.throw();
    });
  });

  describe('Data Validation', function() {
    it('should validate position as object with x,y', function() {
      expect(() => model.setPosition('invalid', 100)).to.throw();
      expect(() => model.setPosition(100, 'invalid')).to.throw();
    });

    it('should validate size as positive numbers', function() {
      expect(() => model.setSize(-10, 20)).to.throw();
      expect(() => model.setSize(20, -10)).to.throw();
    });

    it('should validate rotation as number', function() {
      expect(() => model.setRotation('invalid')).to.throw();
    });

    it('should validate faction as string', function() {
      expect(() => model.setFaction(123)).to.throw();
    });
  });

  describe('Getters/Setters', function() {
    it('should provide getter for all core properties', function() {
      expect(model.getId).to.be.a('function');
      expect(model.getType).to.be.a('function');
      expect(model.isActive).to.be.a('function');
      expect(model.getPosition).to.be.a('function');
      expect(model.getSize).to.be.a('function');
      expect(model.getRotation).to.be.a('function');
      expect(model.getFaction).to.be.a('function');
    });

    it('should provide setter for all mutable properties', function() {
      expect(model.setActive).to.be.a('function');
      expect(model.setPosition).to.be.a('function');
      expect(model.setSize).to.be.a('function');
      expect(model.setRotation).to.be.a('function');
      expect(model.setFaction).to.be.a('function');
    });

    it('should not allow direct ID modification', function() {
      const originalId = model.getId();
      // No setId() method should exist
      expect(model.setId).to.be.undefined;
      expect(model.getId()).to.equal(originalId);
    });

    it('should not allow direct type modification', function() {
      const originalType = model.getType();
      // No setType() method should exist
      expect(model.setType).to.be.undefined;
      expect(model.getType()).to.equal(originalType);
    });
  });

  describe('Image Path Storage', function() {
    it('should store image path', function() {
      model.setImagePath('Images/test.png');
      expect(model.getImagePath()).to.equal('Images/test.png');
    });

    it('should emit imagePathChanged event', function() {
      const callback = sinon.spy();
      model.on('imagePathChanged', callback);
      
      model.setImagePath('Images/new.png');
      
      expect(callback.calledOnce).to.be.true;
    });
  });

  describe('Opacity Storage', function() {
    it('should store opacity', function() {
      model.setOpacity(0.5);
      expect(model.getOpacity()).to.equal(0.5);
    });

    it('should default opacity to 1', function() {
      const model2 = new EntityModel(0, 0, 32, 32);
      expect(model2.getOpacity()).to.equal(1.0);
    });

    it('should clamp opacity between 0 and 1', function() {
      model.setOpacity(1.5);
      expect(model.getOpacity()).to.equal(1.0);
      
      model.setOpacity(-0.5);
      expect(model.getOpacity()).to.equal(0.0);
    });
  });

  describe('Flip State Management', function() {
    it('should default flipX to false', function() {
      expect(model.getFlipX()).to.be.false;
    });

    it('should default flipY to false', function() {
      expect(model.getFlipY()).to.be.false;
    });

    it('should set flipX', function() {
      model.setFlipX(true);
      expect(model.getFlipX()).to.be.true;
    });

    it('should set flipY', function() {
      model.setFlipY(true);
      expect(model.getFlipY()).to.be.true;
    });

    it('should emit flipXChanged event', function() {
      const callback = sinon.spy();
      model.on('flipXChanged', callback);
      
      model.setFlipX(true);
      
      expect(callback.calledOnce).to.be.true;
      expect(callback.firstCall.args[0]).to.deep.include({
        oldFlipX: false,
        newFlipX: true
      });
    });

    it('should emit flipYChanged event', function() {
      const callback = sinon.spy();
      model.on('flipYChanged', callback);
      
      model.setFlipY(true);
      
      expect(callback.calledOnce).to.be.true;
      expect(callback.firstCall.args[0]).to.deep.include({
        oldFlipY: false,
        newFlipY: true
      });
    });

    it('should validate flipX is boolean', function() {
      expect(() => model.setFlipX('true')).to.throw('FlipX must be a boolean');
    });

    it('should validate flipY is boolean', function() {
      expect(() => model.setFlipY('true')).to.throw('FlipY must be a boolean');
    });
  });
});
