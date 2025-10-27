/**
 * Unit Tests: Level Editor Terrain Highlight with Camera
 * 
 * Tests that terrain highlighting uses screenToWorld to stay aligned with camera.
 * This ensures the highlight preview stays under the cursor when camera pans/zooms.
 */

const { expect } = require('chai');
const sinon = require('sinon');

describe('Level Editor Terrain Highlight (Camera Integration)', function() {
  let sandbox;
  
  beforeEach(function() {
    sandbox = sinon.createSandbox();
    
    // Mock p5.js globals
    global.mouseX = 400;
    global.mouseY = 300;
    global.TILE_SIZE = 32;
    global.g_canvasX = 800;
    global.g_canvasY = 600;
    
    // Sync window
    if (typeof window !== 'undefined') {
      window.mouseX = global.mouseX;
      window.mouseY = global.mouseY;
      window.TILE_SIZE = global.TILE_SIZE;
      window.g_canvasX = global.g_canvasX;
      window.g_canvasY = global.g_canvasY;
    }
  });
  
  afterEach(function() {
    sandbox.restore();
  });
  
  describe('getHighlightedTileCoords()', function() {
    it('should use screenToWorld to convert mouse position when camera is panned', function() {
      const mockCamera = {
        cameraX: 100,
        cameraY: 50,
        cameraZoom: 1,
        getZoom: function() { return this.cameraZoom; },
        screenToWorld: sandbox.stub().returns({ x: 500, y: 350 })
      };
      
      const LevelEditor = require('../../../Classes/systems/ui/LevelEditor.js');
      const editor = new LevelEditor();
      editor.editorCamera = mockCamera;
      editor.active = true;
      
      // Act: Get highlighted tile
      const coords = editor.getHighlightedTileCoords();
      
      // Assert: Should have called screenToWorld with mouse position
      expect(mockCamera.screenToWorld.calledOnce).to.be.true;
      expect(mockCamera.screenToWorld.calledWith(global.mouseX, global.mouseY)).to.be.true;
    });
    
    it('should convert world coordinates to grid coordinates', function() {
      const mockCamera = {
        cameraX: 0,
        cameraY: 0,
        cameraZoom: 1,
        getZoom: function() { return this.cameraZoom; },
        screenToWorld: sandbox.stub().returns({ x: 320, y: 160 })
      };
      
      const LevelEditor = require('../../../Classes/systems/ui/LevelEditor.js');
      const editor = new LevelEditor();
      editor.editorCamera = mockCamera;
      editor.active = true;
      
      // Act: Get highlighted tile
      const coords = editor.getHighlightedTileCoords();
      
      // Assert: Should convert to grid coords (worldPos / TILE_SIZE)
      // x: 320 / 32 = 10, y: 160 / 32 = 5
      expect(coords).to.deep.equal({ gridX: 10, gridY: 5 });
    });
    
    it('should handle zoomed camera correctly', function() {
      const mockCamera = {
        cameraX: 0,
        cameraY: 0,
        cameraZoom: 2,
        getZoom: function() { return this.cameraZoom; },
        screenToWorld: sandbox.stub().returns({ x: 640, y: 320 })
      };
      
      const LevelEditor = require('../../../Classes/systems/ui/LevelEditor.js');
      const editor = new LevelEditor();
      editor.editorCamera = mockCamera;
      editor.active = true;
      
      // Act: Get highlighted tile (with zoom)
      const coords = editor.getHighlightedTileCoords();
      
      // Assert: screenToWorld should handle zoom internally
      expect(mockCamera.screenToWorld.calledOnce).to.be.true;
      
      // Grid coords from world position: 640/32 = 20, 320/32 = 10
      expect(coords).to.deep.equal({ gridX: 20, gridY: 10 });
    });
    
    it('should handle negative camera offsets', function() {
      const mockCamera = {
        cameraX: -200,
        cameraY: -100,
        cameraZoom: 1,
        getZoom: function() { return this.cameraZoom; },
        screenToWorld: sandbox.stub().returns({ x: 600, y: 400 })
      };
      
      const LevelEditor = require('../../../Classes/systems/ui/LevelEditor.js');
      const editor = new LevelEditor();
      editor.editorCamera = mockCamera;
      editor.active = true;
      
      // Act: Get highlighted tile with negative camera offset
      const coords = editor.getHighlightedTileCoords();
      
      // Assert: Should use screenToWorld (it handles offset)
      expect(mockCamera.screenToWorld.calledWith(global.mouseX, global.mouseY)).to.be.true;
      
      // Grid coords: 600/32 = 18.75 → 18, 400/32 = 12.5 → 12
      expect(coords.gridX).to.equal(18);
      expect(coords.gridY).to.equal(12);
    });
  });
  
  describe('renderTerrainHighlight()', function() {
    it('should get tile coords using getHighlightedTileCoords()', function() {
      const mockCamera = {
        cameraX: 0,
        cameraY: 0,
        cameraZoom: 1,
        getZoom: function() { return this.cameraZoom; },
        screenToWorld: sandbox.stub().returns({ x: 160, y: 96 })
      };
      
      // Mock p5.js rendering
      global.push = sandbox.stub();
      global.pop = sandbox.stub();
      global.fill = sandbox.stub();
      global.noStroke = sandbox.stub();
      global.rect = sandbox.stub();
      
      if (typeof window !== 'undefined') {
        window.push = global.push;
        window.pop = global.pop;
        window.fill = global.fill;
        window.noStroke = global.noStroke;
        window.rect = global.rect;
      }
      
      const LevelEditor = require('../../../Classes/systems/ui/LevelEditor.js');
      const editor = new LevelEditor();
      editor.editorCamera = mockCamera;
      editor.active = true;
      editor.currentTool = 'paint';
      editor.selectedMaterial = 1; // Some material
      
      // Act: Render highlight
      editor.renderTerrainHighlight();
      
      // Assert: Should have called screenToWorld
      expect(mockCamera.screenToWorld.called).to.be.true;
      
      // Should render at grid position * TILE_SIZE
      // worldPos 160,96 → grid 5,3 → render at 160,96
      const rectCalls = global.rect.getCalls();
      expect(rectCalls.length).to.be.greaterThan(0);
      
      // First arg should be gridX * TILE_SIZE, second should be gridY * TILE_SIZE
      const firstCall = rectCalls[0];
      expect(firstCall.args[0]).to.equal(160); // 5 * 32
      expect(firstCall.args[1]).to.equal(96);  // 3 * 32
    });
  });
});
