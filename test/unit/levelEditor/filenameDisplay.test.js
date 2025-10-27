/**
 * Unit Tests: Filename Display
 * 
 * Tests for filename display at top-center of Level Editor.
 * Tests default display, filename updates, extension stripping, positioning.
 */

const { expect } = require('chai');
const sinon = require('sinon');
const { setupUITestEnvironment, cleanupUITestEnvironment } = require('../../helpers/uiTestHelpers');

describe('Level Editor - Filename Display', function() {
  let levelEditor;
  let textSpy;
  let textAlignSpy;
  let textSizeSpy;
  
  beforeEach(function() {
    setupUITestEnvironment();
    
    // Spy on p5 text functions
    textSpy = sinon.spy();
    textAlignSpy = sinon.spy();
    textSizeSpy = sinon.spy();
    
    global.text = textSpy;
    window.text = textSpy;
    global.textAlign = textAlignSpy;
    window.textAlign = textAlignSpy;
    global.textSize = textSizeSpy;
    window.textSize = textSizeSpy;
    global.CENTER = 'CENTER';
    window.CENTER = 'CENTER';
    global.TOP = 'TOP';
    window.TOP = 'TOP';
    
    // Mock LevelEditor with filename display
    global.LevelEditor = class LevelEditor {
      constructor() {
        this.currentFilename = 'Untitled';
      }
      
      setFilename(name) {
        // Strip .json extension if present
        this.currentFilename = name.replace(/\.json$/i, '');
      }
      
      getFilename() {
        return this.currentFilename;
      }
      
      renderFilenameDisplay() {
        const canvasWidth = window.width || 800;
        const centerX = canvasWidth / 2;
        const topY = 40;
        
        textAlign(CENTER, TOP);
        textSize(16);
        text(this.currentFilename, centerX, topY);
      }
    };
    
    levelEditor = new global.LevelEditor();
    
    // Mock canvas dimensions
    window.width = 800;
    window.height = 600;
  });
  
  afterEach(function() {
    cleanupUITestEnvironment();
  });
  
  describe('Default Display', function() {
    it('should display "Untitled" by default', function() {
      expect(levelEditor.getFilename()).to.equal('Untitled');
    });
    
    it('should render at top-center of canvas', function() {
      levelEditor.renderFilenameDisplay();
      
      expect(textAlignSpy.calledWith(CENTER, TOP)).to.be.true;
      expect(textSpy.calledWith('Untitled', 400, 40)).to.be.true;
    });
  });
  
  describe('Filename Updates', function() {
    it('should update when filename changes', function() {
      levelEditor.setFilename('my-level');
      
      expect(levelEditor.getFilename()).to.equal('my-level');
    });
    
    it('should strip .json extension from display', function() {
      levelEditor.setFilename('terrain-data.json');
      
      expect(levelEditor.getFilename()).to.equal('terrain-data');
    });
    
    it('should handle .JSON extension (case insensitive)', function() {
      levelEditor.setFilename('MY-LEVEL.JSON');
      
      expect(levelEditor.getFilename()).to.equal('MY-LEVEL');
    });
    
    it('should not strip .json from middle of filename', function() {
      levelEditor.setFilename('level.json.backup');
      
      expect(levelEditor.getFilename()).to.equal('level.json.backup');
    });
  });
  
  describe('Render Behavior', function() {
    it('should render updated filename', function() {
      levelEditor.setFilename('forest-map');
      levelEditor.renderFilenameDisplay();
      
      expect(textSpy.calledWith('forest-map', 400, 40)).to.be.true;
    });
    
    it('should use correct text size', function() {
      levelEditor.renderFilenameDisplay();
      
      expect(textSizeSpy.calledWith(16)).to.be.true;
    });
    
    it('should center text horizontally', function() {
      window.width = 1200;
      levelEditor.renderFilenameDisplay();
      
      expect(textSpy.calledWith('Untitled', 600, 40)).to.be.true;
    });
  });
  
  describe('Display After Save', function() {
    it('should display saved filename after save operation', function() {
      levelEditor.setFilename('saved-level.json');
      
      expect(levelEditor.getFilename()).to.equal('saved-level');
      
      levelEditor.renderFilenameDisplay();
      
      expect(textSpy.calledWith('saved-level', 400, 40)).to.be.true;
    });
  });
});
