/**
 * Integration Tests: Filename Display
 * Tests interaction between LevelEditor filename display and save/export operations
 */

const { expect } = require('chai');
const sinon = require('sinon');
const { setupUITestEnvironment } = require('../../helpers/uiTestHelpers');

describe('Filename Display - Integration Tests', function() {
  let sandbox;
  let editor;
  let renderSpy;
  
  beforeEach(function() {
    sandbox = sinon.createSandbox();
    setupUITestEnvironment(sandbox);
    
    // Mock canvas text rendering
    global.textSize = sandbox.spy();
    global.textAlign = sandbox.spy();
    global.fill = sandbox.spy();
    global.rect = sandbox.spy();
    global.text = sandbox.spy();
    
    window.textSize = global.textSize;
    window.textAlign = global.textAlign;
    window.fill = global.fill;
    window.rect = global.rect;
    window.text = global.text;
    
    // Load LevelEditor
    const LevelEditor = require('../../../Classes/systems/ui/LevelEditor');
    
    editor = new LevelEditor();
    renderSpy = sandbox.spy(editor, 'renderFilenameDisplay');
  });
  
  afterEach(function() {
    sandbox.restore();
  });
  
  describe('Display After Save Operation', function() {
    it('should update display when filename changes via save', function() {
      editor.setFilename('NewMap');
      
      editor.renderFilenameDisplay();
      
      expect(global.text.called).to.be.true;
      const textCall = global.text.getCalls().find(call => 
        call.args[0] && call.args[0].includes('NewMap')
      );
      expect(textCall).to.exist;
    });
    
    it('should show "Untitled" for new terrain', function() {
      editor.setFilename('Untitled');
      
      editor.renderFilenameDisplay();
      
      const textCall = global.text.getCalls().find(call => 
        call.args[0] && call.args[0].includes('Untitled')
      );
      expect(textCall).to.exist;
    });
  });
  
  describe('Display Positioning', function() {
    it('should render at top-center of canvas', function() {
      global.width = 800;
      editor.renderFilenameDisplay();
      
      // Text should be rendered with CENTER alignment
      expect(global.textAlign.calledWith(global.CENTER)).to.be.true;
      
      // Text should be at canvas width / 2
      const textCall = global.text.lastCall;
      if (textCall) {
        expect(textCall.args[1]).to.equal(400); // width/2
      }
    });
  });
  
  describe('Filename Extension Handling', function() {
    it('should not display .json extension', function() {
      editor.setFilename('map.json');
      
      editor.renderFilenameDisplay();
      
      // Check that text doesn't include .json
      const textCall = global.text.getCalls().find(call => 
        call.args[0] && call.args[0].includes('map') && !call.args[0].includes('.json')
      );
      expect(textCall).to.exist;
    });
    
    it('should handle .JSON extension (case insensitive)', function() {
      editor.setFilename('MAP.JSON');
      
      expect(editor.getFilename()).to.equal('MAP');
      
      editor.renderFilenameDisplay();
      
      const textCall = global.text.getCalls().find(call => 
        call.args[0] && call.args[0].includes('MAP') && !call.args[0].includes('.JSON')
      );
      expect(textCall).to.exist;
    });
  });
  
  describe('Display Persistence', function() {
    it('should persist across multiple renders', function() {
      editor.setFilename('TestMap');
      
      editor.renderFilenameDisplay();
      editor.renderFilenameDisplay();
      editor.renderFilenameDisplay();
      
      expect(global.text.callCount).to.be.at.least(3);
    });
    
    it('should maintain filename during zoom/pan', function() {
      editor.setFilename('MyLevel');
      const filename = editor.getFilename();
      
      // Simulate camera changes
      global.translate = sandbox.spy();
      global.scale = sandbox.spy();
      
      editor.renderFilenameDisplay();
      
      expect(editor.getFilename()).to.equal(filename);
    });
  });
  
  describe('Edge Cases', function() {
    it('should handle very long filenames', function() {
      const longName = 'a'.repeat(100);
      editor.setFilename(longName);
      
      expect(() => editor.renderFilenameDisplay()).to.not.throw();
    });
    
    it('should handle special characters in filename', function() {
      editor.setFilename('map-v2_final');
      
      expect(() => editor.renderFilenameDisplay()).to.not.throw();
      expect(editor.getFilename()).to.equal('map-v2_final');
    });
    
    it('should handle empty filename', function() {
      editor.setFilename('');
      
      expect(() => editor.renderFilenameDisplay()).to.not.throw();
    });
    
    it('should handle filename with multiple .json extensions', function() {
      editor.setFilename('map.json.json');
      
      // Should only strip the last .json
      expect(editor.getFilename()).to.equal('map.json');
    });
  });
  
  describe('Styling Consistency', function() {
    it('should use consistent text size', function() {
      editor.renderFilenameDisplay();
      
      expect(global.textSize.called).to.be.true;
      expect(global.textSize.firstCall.args[0]).to.equal(16);
    });
    
    it('should use semi-transparent background', function() {
      editor.renderFilenameDisplay();
      
      // Should call fill for background with alpha
      expect(global.fill.called).to.be.true;
    });
  });
});
