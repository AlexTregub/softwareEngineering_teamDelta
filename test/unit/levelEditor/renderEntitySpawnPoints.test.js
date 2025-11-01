/**
 * Unit Tests: LevelEditor Render Entity Spawn Points
 * 
 * Tests visual feedback for placed entity spawn points
 * Following TDD: Write tests FIRST, then implement
 */

const { expect } = require('chai');
const sinon = require('sinon');
const { JSDOM } = require('jsdom');

describe('LevelEditor - Render Entity Spawn Points', function() {
  let LevelEditor;
  let levelEditor;
  let mockTerrain;
  let mockEntityPalette;
  let mockCanvas;
  
  before(function() {
    // Setup JSDOM
    const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    global.window = dom.window;
    global.document = dom.window.document;
    
    // Mock TILE_SIZE constant
    global.TILE_SIZE = 32;
    window.TILE_SIZE = 32;
    
    // Mock p5.js globals
    global.createVector = sinon.stub().callsFake((x, y) => ({ x, y, set: function(a, b) { this.x = a; this.y = b; } }));
    window.createVector = global.createVector;
    
    // Mock p5.js drawing functions
    global.push = sinon.stub();
    global.pop = sinon.stub();
    global.fill = sinon.stub();
    global.noStroke = sinon.stub();
    global.stroke = sinon.stub();
    global.strokeWeight = sinon.stub();
    global.rect = sinon.stub();
    global.ellipse = sinon.stub();
    global.image = sinon.stub();
    global.imageMode = sinon.stub();
    global.tint = sinon.stub();
    global.noTint = sinon.stub();
    global.CORNER = 'CORNER';
    global.CENTER = 'CENTER';
    
    window.push = global.push;
    window.pop = global.pop;
    window.fill = global.fill;
    window.noStroke = global.noStroke;
    window.stroke = global.stroke;
    window.strokeWeight = global.strokeWeight;
    window.rect = global.rect;
    window.ellipse = global.ellipse;
    window.image = global.image;
    window.imageMode = global.imageMode;
    window.tint = global.tint;
    window.noTint = global.noTint;
    window.CORNER = global.CORNER;
    window.CENTER = global.CENTER;
    
    // Load actual LevelEditor class
    LevelEditor = require('../../../Classes/systems/ui/LevelEditor.js');
    
    // Sync to window
    global.LevelEditor = LevelEditor;
    window.LevelEditor = LevelEditor;
  });
  
  beforeEach(function() {
    // Reset all stubs
    sinon.resetHistory();
    
    // Mock terrain
    mockTerrain = {
      exportToJSON: sinon.stub().returns({ tiles: [] }),
      tileSize: 32
    };
    
    // Mock EntityPalette with image cache
    mockEntityPalette = {
      _findTemplateById: sinon.stub().returns({
        id: 'ant_worker',
        type: 'Ant',
        image: 'ant_worker.png',
        properties: { faction: 'player' }
      }),
      _imageCache: new Map()
    };
    
    // Mock image
    mockCanvas = {
      width: 32,
      height: 32
    };
    mockEntityPalette._imageCache.set('ant_worker.png', mockCanvas);
    
    // Create LevelEditor instance
    levelEditor = new LevelEditor();
    levelEditor.terrain = mockTerrain;
    levelEditor.entityPalette = mockEntityPalette;
    levelEditor.active = true;
  });
  
  afterEach(function() {
    sinon.restore();
  });
  
  describe('renderEntitySpawnPoints() - Visual feedback', function() {
    
    it('should not render when no entities placed', function() {
      levelEditor.renderEntitySpawnPoints();
      
      // Should not call drawing functions
      expect(global.push.called).to.be.false;
      expect(global.image.called).to.be.false;
    });
    
    it('should render sprite at spawn location', function() {
      // Place an entity
      levelEditor._placeSingleEntity(10, 15, 'ant_worker', {});
      
      levelEditor.renderEntitySpawnPoints();
      
      // Should call drawing functions
      expect(global.push.calledOnce).to.be.true;
      expect(global.pop.calledOnce).to.be.true;
      
      // Should render image at world coordinates
      const expectedX = 10 * 32; // gridX * TILE_SIZE = 320
      const expectedY = 15 * 32; // gridY * TILE_SIZE = 480
      
      expect(global.image.calledWith(mockCanvas, expectedX, expectedY, 32, 32)).to.be.true;
    });
    
    it('should render multiple spawn points', function() {
      // Place multiple entities
      levelEditor._placeSingleEntity(0, 0, 'ant_worker', {});
      levelEditor._placeSingleEntity(5, 5, 'ant_worker', {});
      levelEditor._placeSingleEntity(10, 10, 'ant_worker', {});
      
      levelEditor.renderEntitySpawnPoints();
      
      // Should render 3 images
      expect(global.image.callCount).to.equal(3);
    });
    
    it('should apply transparency (alpha < 255)', function() {
      levelEditor._placeSingleEntity(10, 15, 'ant_worker', {});
      
      levelEditor.renderEntitySpawnPoints();
      
      // Should apply tint for transparency
      const tintCalls = global.tint.getCalls();
      expect(tintCalls.length).to.be.greaterThan(0);
      
      // Check if alpha value is less than 255 (semi-transparent)
      const lastTintCall = tintCalls[tintCalls.length - 1];
      if (lastTintCall.args.length === 4) {
        const alpha = lastTintCall.args[3];
        expect(alpha).to.be.lessThan(255);
      }
    });
    
    it('should use correct image mode (CORNER)', function() {
      levelEditor._placeSingleEntity(10, 15, 'ant_worker', {});
      
      levelEditor.renderEntitySpawnPoints();
      
      expect(global.imageMode.calledWith('CORNER')).to.be.true;
    });
    
    it('should convert grid coords to world coords', function() {
      levelEditor._placeSingleEntity(5, 7, 'ant_worker', {});
      
      levelEditor.renderEntitySpawnPoints();
      
      // Grid (5, 7) → World (160, 224)
      const expectedX = 5 * 32;
      const expectedY = 7 * 32;
      
      expect(global.image.calledWith(mockCanvas, expectedX, expectedY, 32, 32)).to.be.true;
    });
    
    it('should handle entities without images (fallback rect)', function() {
      // Mock template without image
      mockEntityPalette._findTemplateById.returns({
        id: 'ant_worker',
        type: 'Ant',
        properties: { faction: 'player' }
        // No image property
      });
      
      levelEditor._placeSingleEntity(10, 15, 'ant_worker', {});
      
      levelEditor.renderEntitySpawnPoints();
      
      // Should render fallback rect
      expect(global.rect.called).to.be.true;
    });
    
    it('should render in correct order (oldest to newest)', function() {
      levelEditor._placeSingleEntity(0, 0, 'ant_worker', { name: 'First' });
      levelEditor._placeSingleEntity(5, 5, 'ant_worker', { name: 'Second' });
      levelEditor._placeSingleEntity(10, 10, 'ant_worker', { name: 'Third' });
      
      levelEditor.renderEntitySpawnPoints();
      
      // Should render in order: (0,0), (5,5), (10,10)
      const imageCalls = global.image.getCalls();
      expect(imageCalls[0].args[1]).to.equal(0);   // First X
      expect(imageCalls[1].args[1]).to.equal(160); // Second X (5*32)
      expect(imageCalls[2].args[1]).to.equal(320); // Third X (10*32)
    });
  });
  
  describe('Integration with render loop', function() {
    
    it('should be callable from render() method', function() {
      // Place entity
      levelEditor._placeSingleEntity(10, 15, 'ant_worker', {});
      
      // renderEntitySpawnPoints should exist as a method
      expect(levelEditor.renderEntitySpawnPoints).to.be.a('function');
      
      // Should not throw when called
      expect(() => levelEditor.renderEntitySpawnPoints()).to.not.throw();
    });
    
    it('should respect Level Editor active state', function() {
      levelEditor._placeSingleEntity(10, 15, 'ant_worker', {});
      levelEditor.active = false;
      
      levelEditor.renderEntitySpawnPoints();
      
      // Should not render when inactive
      expect(global.image.called).to.be.false;
    });
  });
  
  describe('Edge cases', function() {
    
    it('should handle entity at grid origin (0, 0)', function() {
      levelEditor._placeSingleEntity(0, 0, 'ant_worker', {});
      
      levelEditor.renderEntitySpawnPoints();
      
      expect(global.image.calledWith(mockCanvas, 0, 0, 32, 32)).to.be.true;
    });
    
    it('should handle large grid coordinates', function() {
      levelEditor._placeSingleEntity(1000, 2000, 'ant_worker', {});
      
      levelEditor.renderEntitySpawnPoints();
      
      const expectedX = 1000 * 32;
      const expectedY = 2000 * 32;
      expect(global.image.calledWith(mockCanvas, expectedX, expectedY, 32, 32)).to.be.true;
    });
    
    it('should handle missing image cache gracefully', function() {
      mockEntityPalette._imageCache.clear();
      
      levelEditor._placeSingleEntity(10, 15, 'ant_worker', {});
      
      // Should not throw
      expect(() => levelEditor.renderEntitySpawnPoints()).to.not.throw();
      
      // Should render fallback rect
      expect(global.rect.called).to.be.true;
    });
  });
});
