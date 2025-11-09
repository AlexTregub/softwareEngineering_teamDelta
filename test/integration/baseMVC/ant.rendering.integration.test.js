/**
 * ant.rendering.integration.test.js
 * 
 * Integration tests for MVC ant rendering pipeline.
 * Tests the complete flow: EntityAccessor → EntityLayerRenderer → RenderLayerManager
 * 
 * Phase 5.7: Real Systems Integration Testing
 */

const { expect } = require('chai');
const sinon = require('sinon');

describe('Ant Rendering Integration Tests', function() {
  let AntModel, AntView, AntController, AntFactory;
  let EntityAccessor, sandbox;
  
  beforeEach(function() {
    sandbox = sinon.createSandbox();
    
    // Mock p5.js globals
    global.createVector = sandbox.stub().callsFake((x, y) => ({ x, y, add: function(v) { this.x += v.x; this.y += v.y; return this; } }));
    global.random = sandbox.stub().returns(0.5);
    global.push = sandbox.stub();
    global.pop = sandbox.stub();
    global.fill = sandbox.stub();
    global.stroke = sandbox.stub();
    global.strokeWeight = sandbox.stub();
    global.rect = sandbox.stub();
    global.ellipse = sandbox.stub();
    global.translate = sandbox.stub();
    global.rotate = sandbox.stub();
    global.image = sandbox.stub();
    global.tint = sandbox.stub();
    global.noTint = sandbox.stub();
    
    // Sync window and global
    if (typeof window !== 'undefined') {
      window.createVector = global.createVector;
      window.random = global.random;
    }
    
    // Load MVC classes
    AntModel = require('../../../Classes/baseMVC/models/AntModel');
    AntView = require('../../../Classes/baseMVC/views/AntView');
    AntController = require('../../../Classes/baseMVC/controllers/AntController');
    AntFactory = require('../../../Classes/baseMVC/factories/AntFactory');
    
    // Load EntityAccessor
    EntityAccessor = require('../../../Classes/rendering/EntityAccessor');
  });
  
  afterEach(function() {
    sandbox.restore();
  });
  
  describe('EntityAccessor with MVC Ants', function() {
    it('should extract position from MVC ant', function() {
      const ant = AntFactory.createAnt(100, 200);
      
      const position = EntityAccessor.getPosition(ant);
      
      expect(position).to.exist;
      expect(position.x).to.equal(100);
      expect(position.y).to.equal(200);
    });
    
    it('should extract size from MVC ant', function() {
      const ant = AntFactory.createAnt(100, 200, 32, 32);
      
      const size = EntityAccessor.getSize(ant);
      
      expect(size).to.exist;
      expect(size.x).to.be.a('number');
      expect(size.y).to.be.a('number');
    });
    
    it('should extract position from MVC queen', function() {
      const queen = AntFactory.createQueen(150, 250);
      
      const position = EntityAccessor.getPosition(queen);
      
      expect(position).to.exist;
      expect(position.x).to.equal(150);
      expect(position.y).to.equal(250);
    });
    
    it('should extract size from MVC queen', function() {
      const queen = AntFactory.createQueen(150, 250, 60, 60);
      
      const size = EntityAccessor.getSize(queen);
      
      expect(size).to.exist;
      expect(size.x).to.be.at.least(50); // Queens are larger
      expect(size.y).to.be.at.least(50);
    });
    
    it('should handle null/undefined entities gracefully', function() {
      const pos1 = EntityAccessor.getPosition(null);
      const pos2 = EntityAccessor.getPosition(undefined);
      const size1 = EntityAccessor.getSize(null);
      const size2 = EntityAccessor.getSize(undefined);
      
      expect(pos1).to.deep.equal({ x: 0, y: 0 });
      expect(pos2).to.deep.equal({ x: 0, y: 0 });
      expect(size1).to.deep.equal({ x: 20, y: 20 });
      expect(size2).to.deep.equal({ x: 20, y: 20 });
    });
    
    it('should prioritize MVC structure over legacy structure', function() {
      // Create an MVC ant
      const mvcAnt = AntFactory.createAnt(100, 200);
      
      // Add legacy properties that should be IGNORED
      mvcAnt.posX = 999;
      mvcAnt.posY = 999;
      mvcAnt.getPosition = () => ({ x: 888, y: 888 });
      
      // EntityAccessor should use model.getPosition() first
      const position = EntityAccessor.getPosition(mvcAnt);
      
      expect(position.x).to.equal(100); // From model, not legacy
      expect(position.y).to.equal(200);
    });
  });
  
  describe('Rendering Pipeline - MVC Ant Visibility', function() {
    it('should identify MVC ant as active and renderable', function() {
      const ant = AntFactory.createAnt(100, 200);
      
      // Check active state
      expect(ant.model.isActive()).to.be.true;
      
      // Verify position exists
      const pos = EntityAccessor.getPosition(ant);
      expect(pos).to.exist;
      expect(pos.x).to.equal(100);
      expect(pos.y).to.equal(200);
    });
    
    it('should identify MVC queen as active and renderable', function() {
      const queen = AntFactory.createQueen(150, 250);
      
      // Check active state
      expect(queen.model.isActive()).to.be.true;
      
      // Verify position exists
      const pos = EntityAccessor.getPosition(queen);
      expect(pos).to.exist;
      expect(pos.x).to.equal(150);
      expect(pos.y).to.equal(250);
    });
    
    it('should detect inactive MVC ant as non-renderable', function() {
      const ant = AntFactory.createAnt(100, 200);
      
      // Deactivate ant
      ant.model.setActive(false);
      
      expect(ant.model.isActive()).to.be.false;
    });
    
    it('should handle MVC ant with zero health (dead)', function() {
      const ant = AntFactory.createAnt(100, 200);
      
      // Kill the ant
      ant.controller.takeDamage(1000);
      
      // Should be inactive
      expect(ant.model.isActive()).to.be.false;
    });
  });
  
  describe('Rendering Pipeline - MVC Ant Render Method', function() {
    it('should call render on MVC ant controller', function() {
      const ant = AntFactory.createAnt(100, 200);
      const renderSpy = sandbox.spy(ant.controller, 'render');
      
      // Call render
      ant.controller.render();
      
      expect(renderSpy.calledOnce).to.be.true;
    });
    
    it('should call render on MVC queen controller', function() {
      const queen = AntFactory.createQueen(150, 250);
      const renderSpy = sandbox.spy(queen.controller, 'render');
      
      // Call render
      queen.controller.render();
      
      expect(renderSpy.calledOnce).to.be.true;
    });
    
    it('should delegate to view when rendering', function() {
      const ant = AntFactory.createAnt(100, 200);
      const viewRenderSpy = sandbox.spy(ant.view, 'render');
      
      // Call controller render
      ant.controller.render();
      
      // View.render should be called
      expect(viewRenderSpy.calledOnce).to.be.true;
    });
  });
  
  describe('Global ants[] Array Integration', function() {
    it('should store MVC ant in global ants array', function() {
      const mockAntsArray = [];
      const ant = AntFactory.createAnt(100, 200);
      
      // Simulate adding to global array
      mockAntsArray.push(ant);
      
      expect(mockAntsArray.length).to.equal(1);
      expect(mockAntsArray[0]).to.have.property('model');
      expect(mockAntsArray[0]).to.have.property('view');
      expect(mockAntsArray[0]).to.have.property('controller');
    });
    
    it('should iterate and render all MVC ants in array', function() {
      const mockAntsArray = [
        AntFactory.createAnt(100, 200),
        AntFactory.createAnt(200, 300),
        AntFactory.createQueen(300, 400)
      ];
      
      // Simulate antsRender() logic
      let renderedCount = 0;
      for (let i = 0; i < mockAntsArray.length; i++) {
        if (mockAntsArray[i] && mockAntsArray[i].model && mockAntsArray[i].model.isActive()) {
          mockAntsArray[i].controller.render();
          renderedCount++;
        }
      }
      
      expect(renderedCount).to.equal(3);
    });
    
    it('should extract position from all ants for culling', function() {
      const mockAntsArray = [
        AntFactory.createAnt(100, 200),
        AntFactory.createAnt(200, 300),
        AntFactory.createQueen(300, 400)
      ];
      
      // Extract positions using EntityAccessor
      const positions = mockAntsArray.map(ant => EntityAccessor.getPosition(ant));
      
      expect(positions).to.have.lengthOf(3);
      expect(positions[0]).to.deep.equal({ x: 100, y: 200 });
      expect(positions[1]).to.deep.equal({ x: 200, y: 300 });
      expect(positions[2]).to.deep.equal({ x: 300, y: 400 });
    });
  });
  
  describe('Rendering Pipeline - Size and Bounds', function() {
    it('should provide valid bounds for frustum culling', function() {
      const ant = AntFactory.createAnt(100, 200, 32, 32);
      
      const pos = EntityAccessor.getPosition(ant);
      const size = EntityAccessor.getSize(ant);
      
      // Verify we can calculate bounds
      const bounds = {
        left: pos.x,
        right: pos.x + size.x,
        top: pos.y,
        bottom: pos.y + size.y
      };
      
      expect(bounds.left).to.equal(100);
      expect(bounds.right).to.be.at.least(100);
      expect(bounds.top).to.equal(200);
      expect(bounds.bottom).to.be.at.least(200);
    });
    
    it('should provide larger bounds for queen', function() {
      const ant = AntFactory.createAnt(100, 200, 32, 32);
      const queen = AntFactory.createQueen(100, 200, 60, 60);
      
      const antSize = EntityAccessor.getSize(ant);
      const queenSize = EntityAccessor.getSize(queen);
      
      // Queen should be larger
      expect(queenSize.x).to.be.at.least(antSize.x);
      expect(queenSize.y).to.be.at.least(antSize.y);
    });
  });
  
  describe('Rendering Pipeline - Multiple Ants', function() {
    it('should handle mixed MVC ants and queens', function() {
      const entities = [
        AntFactory.createAnt(100, 100, { job: 'Worker', faction: 'player' }),
        AntFactory.createAnt(200, 200, { job: 'Warrior', faction: 'enemy' }),
        AntFactory.createQueen(300, 300, { faction: 'player' })
      ];
      
      // All should be extractable
      entities.forEach((entity, index) => {
        const pos = EntityAccessor.getPosition(entity);
        expect(pos).to.exist;
        expect(pos.x).to.be.a('number');
        expect(pos.y).to.be.a('number');
      });
    });
    
    it('should handle active and inactive ants in same array', function() {
      const ant1 = AntFactory.createAnt(100, 100);
      const ant2 = AntFactory.createAnt(200, 200);
      const ant3 = AntFactory.createAnt(300, 300);
      
      // Deactivate middle ant
      ant2.model.setActive(false);
      
      const entities = [ant1, ant2, ant3];
      const activeCount = entities.filter(e => e.model.isActive()).length;
      
      expect(activeCount).to.equal(2);
    });
  });
});
