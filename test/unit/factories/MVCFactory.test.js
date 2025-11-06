/**
 * Unit tests for MVCFactory
 * TDD: Write tests FIRST, then implement
 * 
 * Purpose: Factory functions for easy MVC entity creation
 * Returns {model, view, controller} triad for each entity type
 */

const { expect } = require('chai');
const sinon = require('sinon');

// Load dependencies
const MVCFactory = require('../../../Classes/factories/MVCFactory');
const AntModel = require('../../../Classes/mvc/models/AntModel');
const AntView = require('../../../Classes/mvc/views/AntView');
const AntController = require('../../../Classes/mvc/controllers/AntController');
const ResourceModel = require('../../../Classes/mvc/models/ResourceModel');
const ResourceView = require('../../../Classes/mvc/views/ResourceView');
const ResourceController = require('../../../Classes/mvc/controllers/ResourceController');
const BuildingModel = require('../../../Classes/mvc/models/BuildingModel');
const BuildingView = require('../../../Classes/mvc/views/BuildingView');
const BuildingController = require('../../../Classes/mvc/controllers/BuildingController');

describe('MVCFactory', function() {
  
  beforeEach(function() {
    // Set up globals for Node.js environment
    global.window = global.window || {};
    global.LEFT = 'left';
    global.CENTER = 'center';
    global.RIGHT = 'right';
    global.TOP = 'top';
    global.BOTTOM = 'bottom';
  });
  
  describe('createAntMVC', function() {
    
    it('should create complete ant MVC triad', function() {
      const result = MVCFactory.createAntMVC(100, 200, 'Scout');
      
      expect(result).to.be.an('object');
      expect(result.model).to.be.instanceOf(AntModel);
      expect(result.view).to.be.instanceOf(AntView);
      expect(result.controller).to.be.instanceOf(AntController);
    });
    
    it('should create ant model with correct properties', function() {
      const result = MVCFactory.createAntMVC(150, 250, 'Warrior', 'player');
      
      const pos = result.model.getPosition();
      expect(pos.x).to.equal(150);
      expect(pos.y).to.equal(250);
      expect(result.model.jobName).to.equal('Warrior');
      expect(result.model.faction).to.equal('player');
    });
    
    it('should use default faction if not provided', function() {
      const result = MVCFactory.createAntMVC(100, 200, 'Scout');
      
      expect(result.model.faction).to.equal('player');
    });
    
    it('should create functional ant system', function() {
      const result = MVCFactory.createAntMVC(100, 200, 'Scout');
      
      // Model should be enabled
      expect(result.model.enabled).to.be.true;
      
      // Controller should be able to update model
      result.controller.update(result.model, 16);
      
      // View should be able to render (no errors)
      const mockGraphics = {
        push: sinon.stub(),
        pop: sinon.stub(),
        fill: sinon.stub(),
        noStroke: sinon.stub(),
        stroke: sinon.stub(),
        strokeWeight: sinon.stub(),
        ellipse: sinon.stub(),
        rect: sinon.stub(),
        image: sinon.stub(),
        tint: sinon.stub(),
        noTint: sinon.stub()
      };
      
      result.view.render(result.model, mockGraphics);
      expect(mockGraphics.push.called).to.be.true;
      expect(mockGraphics.pop.called).to.be.true;
    });
  });
  
  describe('createResourceMVC', function() {
    
    it('should create complete resource MVC triad', function() {
      const result = MVCFactory.createResourceMVC(300, 400, 'food');
      
      expect(result).to.be.an('object');
      expect(result.model).to.be.instanceOf(ResourceModel);
      expect(result.view).to.be.instanceOf(ResourceView);
      expect(result.controller).to.be.instanceOf(ResourceController);
    });
    
    it('should create resource model with correct properties', function() {
      const result = MVCFactory.createResourceMVC(350, 450, 'wood', 100);
      
      const pos = result.model.getPosition();
      expect(pos.x).to.equal(350);
      expect(pos.y).to.equal(450);
      expect(result.model.resourceType).to.equal('wood');
      expect(result.model.amount).to.equal(100);
    });
    
    it('should use default amount if not provided', function() {
      const result = MVCFactory.createResourceMVC(300, 400, 'food');
      
      expect(result.model.amount).to.equal(50);
    });
    
    it('should create functional resource system', function() {
      const result = MVCFactory.createResourceMVC(300, 400, 'stone', 75);
      
      // Model should be enabled
      expect(result.model.enabled).to.be.true;
      
      // Controller should be able to update model
      result.controller.update(result.model, 16);
      
      // View should be able to render (no errors)
      const mockGraphics = {
        push: sinon.stub(),
        pop: sinon.stub(),
        fill: sinon.stub(),
        noStroke: sinon.stub(),
        stroke: sinon.stub(),
        strokeWeight: sinon.stub(),
        rect: sinon.stub(),
        ellipse: sinon.stub(),
        image: sinon.stub(),
        text: sinon.stub(),
        textAlign: sinon.stub(),
        textSize: sinon.stub()
      };
      
      result.view.render(result.model, mockGraphics);
      expect(mockGraphics.push.called).to.be.true;
      expect(mockGraphics.pop.called).to.be.true;
    });
  });
  
  describe('createBuildingMVC', function() {
    
    it('should create complete building MVC triad', function() {
      const result = MVCFactory.createBuildingMVC(500, 600, 'anthill');
      
      expect(result).to.be.an('object');
      expect(result.model).to.be.instanceOf(BuildingModel);
      expect(result.view).to.be.instanceOf(BuildingView);
      expect(result.controller).to.be.instanceOf(BuildingController);
    });
    
    it('should create building model with correct properties', function() {
      const result = MVCFactory.createBuildingMVC(550, 650, 'storage', 2);
      
      const pos = result.model.getPosition();
      expect(pos.x).to.equal(550);
      expect(pos.y).to.equal(650);
      expect(result.model.buildingType).to.equal('storage');
      expect(result.model.level).to.equal(2);
    });
    
    it('should use default level if not provided', function() {
      const result = MVCFactory.createBuildingMVC(500, 600, 'anthill');
      
      expect(result.model.level).to.equal(1);
    });
    
    it('should create functional building system', function() {
      const result = MVCFactory.createBuildingMVC(500, 600, 'anthill', 3);
      
      // Model should be enabled
      expect(result.model.enabled).to.be.true;
      
      // Controller should be able to update model
      result.controller.update(result.model, 16);
      
      // View should be able to render (no errors)
      const mockGraphics = {
        push: sinon.stub(),
        pop: sinon.stub(),
        fill: sinon.stub(),
        noStroke: sinon.stub(),
        stroke: sinon.stub(),
        strokeWeight: sinon.stub(),
        rect: sinon.stub(),
        ellipse: sinon.stub(),
        image: sinon.stub(),
        text: sinon.stub(),
        textAlign: sinon.stub(),
        textSize: sinon.stub()
      };
      
      result.view.render(result.model, mockGraphics);
      expect(mockGraphics.push.called).to.be.true;
      expect(mockGraphics.pop.called).to.be.true;
    });
  });
  
  describe('Performance', function() {
    
    it('should create 100 ant MVC triads quickly', function() {
      const start = Date.now();
      
      for (let i = 0; i < 100; i++) {
        MVCFactory.createAntMVC(i * 10, i * 10, 'Scout');
      }
      
      const elapsed = Date.now() - start;
      expect(elapsed).to.be.lessThan(100); // <100ms for 100 entities
    });
    
    it('should create mixed entity types quickly', function() {
      const start = Date.now();
      
      for (let i = 0; i < 50; i++) {
        MVCFactory.createAntMVC(i * 10, i * 10, 'Scout');
        MVCFactory.createResourceMVC(i * 10, i * 10, 'food');
        MVCFactory.createBuildingMVC(i * 10, i * 10, 'anthill');
      }
      
      const elapsed = Date.now() - start;
      expect(elapsed).to.be.lessThan(150); // <150ms for 150 entities
    });
  });
});
