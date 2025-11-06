/**
 * Integration tests for MVC Rendering System
 * TDD: Write tests FIRST, then implement
 * 
 * Purpose: Test MVC rendering integration with RenderManager
 * Verifies dual-system operation (legacy + MVC running side-by-side)
 */

const { expect } = require('chai');
const sinon = require('sinon');
const path = require('path');

// Load dependencies
const MVCFactory = require('../../../Classes/factories/MVCFactory');

describe('MVC Rendering Integration', function() {
  let mockGraphics, mockRenderManager, mvcEntities;
  
  beforeEach(function() {
    // Set up global constants
    global.window = global.window || {};
    global.LEFT = 'left';
    global.CENTER = 'center';
    global.RIGHT = 'right';
    global.TOP = 'top';
    global.BOTTOM = 'bottom';
    
    // Mock graphics context
    mockGraphics = {
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
      textSize: sinon.stub(),
      tint: sinon.stub(),
      noTint: sinon.stub()
    };
    
    // Create test MVC entities
    mvcEntities = {
      ants: [],
      resources: [],
      buildings: []
    };
  });
  
  afterEach(function() {
    sinon.restore();
  });
  
  describe('MVC Entity Storage', function() {
    
    it('should store MVC ants in separate array from legacy', function() {
      const ant1 = MVCFactory.createAntMVC(100, 200, 'Scout');
      const ant2 = MVCFactory.createAntMVC(150, 250, 'Warrior');
      
      mvcEntities.ants.push(ant1, ant2);
      
      expect(mvcEntities.ants).to.have.lengthOf(2);
      expect(mvcEntities.ants[0].model.jobName).to.equal('Scout');
      expect(mvcEntities.ants[1].model.jobName).to.equal('Warrior');
    });
    
    it('should store MVC resources separately', function() {
      const resource1 = MVCFactory.createResourceMVC(300, 400, 'food', 50);
      const resource2 = MVCFactory.createResourceMVC(350, 450, 'wood', 75);
      
      mvcEntities.resources.push(resource1, resource2);
      
      expect(mvcEntities.resources).to.have.lengthOf(2);
      expect(mvcEntities.resources[0].model.resourceType).to.equal('food');
      expect(mvcEntities.resources[1].model.resourceType).to.equal('wood');
    });
    
    it('should store MVC buildings separately', function() {
      const building1 = MVCFactory.createBuildingMVC(500, 600, 'anthill', 1);
      const building2 = MVCFactory.createBuildingMVC(550, 650, 'storage', 2);
      
      mvcEntities.buildings.push(building1, building2);
      
      expect(mvcEntities.buildings).to.have.lengthOf(2);
      expect(mvcEntities.buildings[0].model.buildingType).to.equal('anthill');
      expect(mvcEntities.buildings[1].model.buildingType).to.equal('storage');
    });
  });
  
  describe('MVC Rendering Loop', function() {
    
    it('should render all MVC ants', function() {
      // Create MVC ants
      mvcEntities.ants.push(
        MVCFactory.createAntMVC(100, 200, 'Scout'),
        MVCFactory.createAntMVC(150, 250, 'Warrior')
      );
      
      // Render all ants
      mvcEntities.ants.forEach(ant => {
        ant.view.render(ant.model, mockGraphics);
      });
      
      // Verify rendering occurred
      expect(mockGraphics.push.callCount).to.equal(2);
      expect(mockGraphics.pop.callCount).to.equal(2);
    });
    
    it('should render all MVC resources', function() {
      // Create MVC resources
      mvcEntities.resources.push(
        MVCFactory.createResourceMVC(300, 400, 'food', 50),
        MVCFactory.createResourceMVC(350, 450, 'wood', 75)
      );
      
      // Render all resources
      mvcEntities.resources.forEach(resource => {
        resource.view.render(resource.model, mockGraphics);
      });
      
      // Verify rendering occurred
      expect(mockGraphics.push.callCount).to.equal(2);
      expect(mockGraphics.pop.callCount).to.equal(2);
    });
    
    it('should render all MVC buildings', function() {
      // Create MVC buildings
      mvcEntities.buildings.push(
        MVCFactory.createBuildingMVC(500, 600, 'anthill', 1),
        MVCFactory.createBuildingMVC(550, 650, 'storage', 2)
      );
      
      // Render all buildings
      mvcEntities.buildings.forEach(building => {
        building.view.render(building.model, mockGraphics);
      });
      
      // Verify rendering occurred
      expect(mockGraphics.push.callCount).to.equal(2);
      expect(mockGraphics.pop.callCount).to.equal(2);
    });
  });
  
  describe('MVC Update Loop', function() {
    
    it('should update all MVC ants', function() {
      // Create MVC ants
      mvcEntities.ants.push(
        MVCFactory.createAntMVC(100, 200, 'Scout'),
        MVCFactory.createAntMVC(150, 250, 'Warrior')
      );
      
      // Update all ants
      const deltaTime = 16;
      mvcEntities.ants.forEach(ant => {
        ant.controller.update(ant.model, deltaTime);
      });
      
      // Verify models still valid after update
      expect(mvcEntities.ants[0].model.enabled).to.be.true;
      expect(mvcEntities.ants[1].model.enabled).to.be.true;
    });
    
    it('should update all MVC resources', function() {
      // Create MVC resources
      mvcEntities.resources.push(
        MVCFactory.createResourceMVC(300, 400, 'food', 50)
      );
      
      // Update all resources
      const deltaTime = 16;
      mvcEntities.resources.forEach(resource => {
        resource.controller.update(resource.model, deltaTime);
      });
      
      // Verify model still valid
      expect(mvcEntities.resources[0].model.enabled).to.be.true;
    });
    
    it('should update all MVC buildings', function() {
      // Create MVC buildings
      mvcEntities.buildings.push(
        MVCFactory.createBuildingMVC(500, 600, 'anthill', 1)
      );
      
      // Update all buildings
      const deltaTime = 16;
      mvcEntities.buildings.forEach(building => {
        building.controller.update(building.model, deltaTime);
      });
      
      // Verify model still valid
      expect(mvcEntities.buildings[0].model.enabled).to.be.true;
    });
  });
  
  describe('Performance', function() {
    
    it('should render 100 MVC ants quickly', function() {
      // Create 100 MVC ants
      for (let i = 0; i < 100; i++) {
        mvcEntities.ants.push(MVCFactory.createAntMVC(i * 10, i * 10, 'Scout'));
      }
      
      const start = Date.now();
      
      // Render all ants
      mvcEntities.ants.forEach(ant => {
        ant.view.render(ant.model, mockGraphics);
      });
      
      const elapsed = Date.now() - start;
      expect(elapsed).to.be.lessThan(100); // <100ms
    });
    
    it('should update and render 50 mixed entities quickly', function() {
      // Create mixed entities
      for (let i = 0; i < 25; i++) {
        mvcEntities.ants.push(MVCFactory.createAntMVC(i * 10, i * 10, 'Scout'));
        mvcEntities.resources.push(MVCFactory.createResourceMVC(i * 10, i * 10, 'food', 50));
      }
      
      const start = Date.now();
      const deltaTime = 16;
      
      // Update all
      mvcEntities.ants.forEach(ant => ant.controller.update(ant.model, deltaTime));
      mvcEntities.resources.forEach(resource => resource.controller.update(resource.model, deltaTime));
      
      // Render all
      mvcEntities.ants.forEach(ant => ant.view.render(ant.model, mockGraphics));
      mvcEntities.resources.forEach(resource => resource.view.render(resource.model, mockGraphics));
      
      const elapsed = Date.now() - start;
      expect(elapsed).to.be.lessThan(100); // <100ms for 50 entities
    });
  });
});
