/**
 * Unit Tests: Level Editor Zoom Functionality
 * 
 * Tests that zoom works correctly with mouse wheel input.
 */

const { expect } = require('chai');
const sinon = require('sinon');

describe('Level Editor Zoom Functionality', function() {
  let sandbox;
  
  beforeEach(function() {
    sandbox = sinon.createSandbox();
    
    // Mock p5.js globals
    global.mouseX = 400;
    global.mouseY = 300;
    
    // Sync window
    if (typeof window !== 'undefined') {
      window.mouseX = global.mouseX;
      window.mouseY = global.mouseY;
    }
  });
  
  afterEach(function() {
    sandbox.restore();
  });
  
  describe('handleZoom()', function() {
    it('should have handleZoom method', function() {
      const LevelEditor = require('../../../Classes/systems/ui/LevelEditor.js');
      const editor = new LevelEditor();
      
      expect(editor.handleZoom).to.be.a('function');
    });
    
    it('should zoom IN when delta is negative (scroll up)', function() {
      const mockCamera = {
        cameraZoom: 1.0,
        getZoom: sinon.stub().returns(1.0),
        setZoom: sinon.stub()
      };
      
      const LevelEditor = require('../../../Classes/systems/ui/LevelEditor.js');
      const editor = new LevelEditor();
      editor.editorCamera = mockCamera;
      editor.active = true;
      
      // Act: Zoom in (negative delta = scroll up)
      editor.handleZoom(-1);
      
      // Assert: Should call setZoom with increased zoom (1.0 * 1.1 = 1.1)
      expect(mockCamera.setZoom.calledOnce).to.be.true;
      const newZoom = mockCamera.setZoom.firstCall.args[0];
      expect(newZoom).to.be.closeTo(1.1, 0.01);
      
      // Should pass mouse position for zoom centering
      expect(mockCamera.setZoom.calledWith(sinon.match.number, 400, 300)).to.be.true;
    });
    
    it('should zoom OUT when delta is positive (scroll down)', function() {
      const mockCamera = {
        cameraZoom: 2.0,
        getZoom: sinon.stub().returns(2.0),
        setZoom: sinon.stub()
      };
      
      const LevelEditor = require('../../../Classes/systems/ui/LevelEditor.js');
      const editor = new LevelEditor();
      editor.editorCamera = mockCamera;
      editor.active = true;
      
      // Act: Zoom out (positive delta = scroll down)
      editor.handleZoom(1);
      
      // Assert: Should call setZoom with decreased zoom (2.0 * 0.9 = 1.8)
      expect(mockCamera.setZoom.calledOnce).to.be.true;
      const newZoom = mockCamera.setZoom.firstCall.args[0];
      expect(newZoom).to.be.closeTo(1.8, 0.01);
    });
    
    it('should handle camera without getZoom method', function() {
      const mockCamera = {
        cameraZoom: 1.5,
        setZoom: sinon.stub()
        // No getZoom method
      };
      
      const LevelEditor = require('../../../Classes/systems/ui/LevelEditor.js');
      const editor = new LevelEditor();
      editor.editorCamera = mockCamera;
      editor.active = true;
      
      // Act: Should not throw error
      expect(() => editor.handleZoom(-1)).to.not.throw();
      
      // Should use default zoom of 1
      expect(mockCamera.setZoom.calledOnce).to.be.true;
      const newZoom = mockCamera.setZoom.firstCall.args[0];
      expect(newZoom).to.be.closeTo(1.1, 0.01); // 1.0 * 1.1
    });
    
    it('should handle camera without setZoom method', function() {
      const mockCamera = {
        cameraZoom: 1.0,
        getZoom: sinon.stub().returns(1.0)
        // No setZoom method
      };
      
      const LevelEditor = require('../../../Classes/systems/ui/LevelEditor.js');
      const editor = new LevelEditor();
      editor.editorCamera = mockCamera;
      editor.active = true;
      
      // Act: Should not throw error
      expect(() => editor.handleZoom(-1)).to.not.throw();
    });
    
    it('should do nothing if no camera', function() {
      const LevelEditor = require('../../../Classes/systems/ui/LevelEditor.js');
      const editor = new LevelEditor();
      editor.editorCamera = null;
      editor.active = true;
      
      // Act: Should not throw error
      expect(() => editor.handleZoom(-1)).to.not.throw();
    });
  });
  
  describe('CameraManager.setZoom() integration', function() {
    it('should verify CameraManager has setZoom method', function() {
      const CameraManager = require('../../../Classes/controllers/CameraManager.js');
      const camera = new CameraManager();
      
      expect(camera.setZoom).to.be.a('function');
    });
    
    it('should verify CameraManager.setZoom updates cameraZoom property', function() {
      const CameraManager = require('../../../Classes/controllers/CameraManager.js');
      const camera = new CameraManager();
      
      const initialZoom = camera.cameraZoom;
      
      // Act: Set zoom to 2.0
      camera.setZoom(2.0);
      
      // Assert: cameraZoom should be updated
      expect(camera.cameraZoom).to.equal(2.0);
    });
  });
});
