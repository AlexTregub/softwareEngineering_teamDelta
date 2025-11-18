/**
 * EntityModel Unit Tests
 * =====================
 * Tests for pure data model - no logic, only state storage
 */

const { expect } = require('chai');
const sinon = require('sinon');
const { setupMVCTest, loadMVCClasses } = require('../../helpers/mvcTestHelpers');

// Setup all MVC test mocks
setupMVCTest();

describe('EntityModel', function() {
  let model;

  beforeEach(function() {
    loadMVCClasses();
  });

  describe('Construction', function() {
    it('should create with default values', function() {
      model = new EntityModel();
      
      expect(model.id).to.exist;
      expect(model.type).to.equal('Entity');
      expect(model.isActive).to.be.true;
      expect(model.position).to.deep.equal({ x: 0, y: 0 });
      expect(model.size).to.deep.equal({ x: 32, y: 32 });
    });

    it('should create with custom position and size', function() {
      model = new EntityModel({ x: 100, y: 200, width: 64, height: 48 });
      
      expect(model.position).to.deep.equal({ x: 100, y: 200 });
      expect(model.size).to.deep.equal({ x: 64, y: 48 });
    });

    it('should create with custom type', function() {
      model = new EntityModel({ type: 'Ant' });
      
      expect(model.type).to.equal('Ant');
    });

    it('should generate unique IDs', function() {
      const model1 = new EntityModel();
      const model2 = new EntityModel();
      
      expect(model1.id).to.not.equal(model2.id);
    });
  });

  describe('Position Management', function() {
    beforeEach(function() {
      model = new EntityModel({ x: 50, y: 100 });
    });

    it('should get position', function() {
      const pos = model.getPosition();
      
      expect(pos).to.deep.equal({ x: 50, y: 100 });
    });

    it('should return a copy of position (not reference)', function() {
      const pos1 = model.getPosition();
      pos1.x = 999;
      const pos2 = model.getPosition();
      
      expect(pos2.x).to.equal(50);
    });

    it('should set position', function() {
      model.setPosition(200, 300);
      
      expect(model.position).to.deep.equal({ x: 200, y: 300 });
    });

    it('should get X coordinate', function() {
      expect(model.getX()).to.equal(50);
    });

    it('should get Y coordinate', function() {
      expect(model.getY()).to.equal(100);
    });
  });

  describe('Size Management', function() {
    beforeEach(function() {
      model = new EntityModel({ width: 64, height: 48 });
    });

    it('should get size', function() {
      const size = model.getSize();
      
      expect(size).to.deep.equal({ x: 64, y: 48 });
    });

    it('should return a copy of size (not reference)', function() {
      const size1 = model.getSize();
      size1.x = 999;
      const size2 = model.getSize();
      
      expect(size2.x).to.equal(64);
    });

    it('should set size', function() {
      model.setSize(128, 96);
      
      expect(model.size).to.deep.equal({ x: 128, y: 96 });
    });
  });

  describe('Visual Properties', function() {
    beforeEach(function() {
      model = new EntityModel();
    });

    it('should initialize with default visual properties', function() {
      expect(model.imagePath).to.be.null;
      expect(model.opacity).to.equal(255);
      expect(model.visible).to.be.true;
      expect(model.rotation).to.equal(0);
    });

    it('should set image path from options', function() {
      model = new EntityModel({ imagePath: 'test.png' });
      
      expect(model.imagePath).to.equal('test.png');
    });

    it('should set opacity', function() {
      model.setOpacity(128);
      
      expect(model.opacity).to.equal(128);
    });

    it('should get opacity', function() {
      model.opacity = 200;
      
      expect(model.getOpacity()).to.equal(200);
    });

    it('should set visibility', function() {
      model.setVisible(false);
      
      expect(model.visible).to.be.false;
    });

    it('should get visibility', function() {
      model.visible = false;
      
      expect(model.isVisible()).to.be.false;
    });

    it('should set rotation', function() {
      model.setRotation(45);
      
      expect(model.rotation).to.equal(45);
    });
  });

  describe('State Properties', function() {
    beforeEach(function() {
      model = new EntityModel();
    });

    it('should initialize with default state', function() {
      expect(model.faction).to.equal('neutral');
      expect(model.jobName).to.be.null;
      expect(model.movementSpeed).to.equal(1);
      expect(model.isActive).to.be.true;
    });

    it('should set faction from options', function() {
      model = new EntityModel({ faction: 'player' });
      
      expect(model.faction).to.equal('player');
    });

    it('should set movement speed from options', function() {
      model = new EntityModel({ movementSpeed: 2.5 });
      
      expect(model.movementSpeed).to.equal(2.5);
    });

    it('should set job name', function() {
      model.setJobName('Gather');
      
      expect(model.jobName).to.equal('Gather');
    });

    it('should get job name', function() {
      model.jobName = 'Scout';
      
      expect(model.getJobName()).to.equal('Scout');
    });

    it('should set active state', function() {
      model.setActive(false);
      
      expect(model.isActive).to.be.false;
    });
  });

  describe('Component References', function() {
    beforeEach(function() {
      model = new EntityModel();
    });

    it('should initialize with null component references', function() {
      expect(model.collisionBox).to.be.null;
      expect(model.sprite).to.be.null;
    });

    it('should allow setting collision box reference', function() {
      const mockCollisionBox = { type: 'CollisionBox' };
      model.collisionBox = mockCollisionBox;
      
      expect(model.collisionBox).to.equal(mockCollisionBox);
    });

    it('should allow setting sprite reference', function() {
      const mockSprite = { type: 'Sprite2D' };
      model.sprite = mockSprite;
      
      expect(model.sprite).to.equal(mockSprite);
    });
  });

  describe('Validation Data', function() {
    beforeEach(function() {
      model = new EntityModel({ 
        type: 'Ant', 
        faction: 'player',
        x: 100,
        y: 200 
      });
      model.jobName = 'Gather';
    });

    it('should return complete validation data', function() {
      const data = model.getValidationData();
      
      expect(data.id).to.equal(model.id);
      expect(data.type).to.equal('Ant');
      expect(data.faction).to.equal('player');
      expect(data.jobName).to.equal('Gather');
      expect(data.position).to.deep.equal({ x: 100, y: 200 });
      expect(data.isActive).to.be.true;
    });

    it('should include timestamp in validation data', function() {
      const data = model.getValidationData();
      
      expect(data.timestamp).to.exist;
      expect(new Date(data.timestamp)).to.be.instanceOf(Date);
    });
  });

  describe('Sprite2D Reference', function() {
    beforeEach(function() {
      model = new EntityModel();
    });

    it('should initialize sprite as null', function() {
      expect(model.sprite).to.be.null;
    });

    it('should allow setting sprite reference', function() {
      const mockSprite = { img: 'test', pos: { x: 0, y: 0 } };
      model.setSprite(mockSprite);
      
      expect(model.sprite).to.equal(mockSprite);
    });

    it('should allow getting sprite reference', function() {
      const mockSprite = { img: 'test', pos: { x: 0, y: 0 } };
      model.setSprite(mockSprite);
      
      expect(model.getSprite()).to.equal(mockSprite);
    });

    it('should store sprite as data only (not call methods)', function() {
      const mockSprite = { 
        img: 'test', 
        render: sinon.spy() 
      };
      model.setSprite(mockSprite);
      
      // Model should NOT call sprite methods
      expect(mockSprite.render.called).to.be.false;
    });
  });

  describe('Data Immutability', function() {
    beforeEach(function() {
      model = new EntityModel({ x: 50, y: 100, width: 32, height: 32 });
    });

    it('should not allow external mutation of position through getter', function() {
      const pos = model.getPosition();
      pos.x = 999;
      
      expect(model.position.x).to.equal(50);
    });

    it('should not allow external mutation of size through getter', function() {
      const size = model.getSize();
      size.x = 999;
      
      expect(model.size.x).to.equal(32);
    });
  });

  describe('NO Logic (Model Purity)', function() {
    beforeEach(function() {
      model = new EntityModel();
    });

    it('should NOT have render methods', function() {
      expect(model.render).to.be.undefined;
      expect(model.renderDebug).to.be.undefined;
    });

    it('should NOT have update methods', function() {
      expect(model.update).to.be.undefined;
    });

    it('should NOT have movement logic', function() {
      expect(model.moveToLocation).to.be.undefined;
      expect(model.moveToTile).to.be.undefined;
    });

    it('should NOT have interaction logic', function() {
      expect(model.onClick).to.be.undefined;
      expect(model.isMouseOver).to.be.undefined;
    });

    it('should NOT have controller initialization', function() {
      expect(model._initializeControllers).to.be.undefined;
    });
  });
});
