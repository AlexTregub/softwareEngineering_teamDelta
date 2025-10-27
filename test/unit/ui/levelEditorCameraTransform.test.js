/**
 * Unit Tests: Level Editor Camera Transform Application
 * 
 * Tests that camera transforms are correctly applied to rendering.
 * This catches the bug where getCameraPosition() was called but doesn't exist.
 */

const { expect } = require('chai');
const sinon = require('sinon');

describe('Level Editor Camera Transform Application', function() {
  let sandbox;
  
  beforeEach(function() {
    sandbox = sinon.createSandbox();
    
    // Mock p5.js globals
    global.push = sandbox.stub();
    global.pop = sandbox.stub();
    global.translate = sandbox.stub();
    global.scale = sandbox.stub();
    global.g_canvasX = 800;
    global.g_canvasY = 600;
    
    // Sync window
    if (typeof window !== 'undefined') {
      window.push = global.push;
      window.pop = global.pop;
      window.translate = global.translate;
      window.scale = global.scale;
      window.g_canvasX = global.g_canvasX;
      window.g_canvasY = global.g_canvasY;
    }
  });
  
  afterEach(function() {
    sandbox.restore();
  });
  
  describe('applyCameraTransform()', function() {
    it('should read cameraX and cameraY properties (not getCameraPosition)', function() {
      // This test catches the bug where we called getCameraPosition() which doesn't exist
      const mockCamera = {
        cameraX: 100,
        cameraY: 50,
        cameraZoom: 1.5,
        getZoom: function() { return this.cameraZoom; }
        // NOTE: No getCameraPosition() method - must use properties directly
      };
      
      const LevelEditor = require('../../../Classes/systems/ui/LevelEditor.js');
      const editor = new LevelEditor();
      editor.editorCamera = mockCamera;
      editor.active = true;
      
      // Act: Apply camera transform
      editor.applyCameraTransform();
      
      // Assert: translate should have been called with -cameraX, -cameraY
      // The last translate call applies the camera offset
      const translateCalls = global.translate.getCalls();
      const lastCall = translateCalls[translateCalls.length - 1];
      
      expect(lastCall.args).to.deep.equal([-100, -50]);
    });
    
    it('should apply zoom transform', function() {
      const mockCamera = {
        cameraX: 0,
        cameraY: 0,
        cameraZoom: 2,
        getZoom: function() { return this.cameraZoom; }
      };
      
      const LevelEditor = require('../../../Classes/systems/ui/LevelEditor.js');
      const editor = new LevelEditor();
      editor.editorCamera = mockCamera;
      editor.active = true;
      
      editor.applyCameraTransform();
      
      // Should call scale with zoom value
      expect(global.scale.calledWith(2)).to.be.true;
    });
    
    it('should handle camera with no getZoom method', function() {
      const mockCamera = {
        cameraX: 0,
        cameraY: 0,
        cameraZoom: 1.5
        // No getZoom method
      };
      
      const LevelEditor = require('../../../Classes/systems/ui/LevelEditor.js');
      const editor = new LevelEditor();
      editor.editorCamera = mockCamera;
      editor.active = true;
      
      // Should not throw error
      expect(() => editor.applyCameraTransform()).to.not.throw();
      
      // Should use cameraZoom property
      expect(global.scale.calledWith(1.5)).to.be.true;
    });
  });
  
  describe('restoreCameraTransform()', function() {
    it('should call pop() to restore transform', function() {
      const mockCamera = {
        cameraX: 0,
        cameraY: 0,
        cameraZoom: 1,
        getZoom: function() { return this.cameraZoom; }
      };
      
      const LevelEditor = require('../../../Classes/systems/ui/LevelEditor.js');
      const editor = new LevelEditor();
      editor.editorCamera = mockCamera;
      editor.active = true;
      
      editor.restoreCameraTransform();
      
      expect(global.pop.calledOnce).to.be.true;
    });
  });
});
