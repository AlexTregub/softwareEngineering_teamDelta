/**
 * Unit Tests: BrushSizeMenuModule
 * 
 * Tests for brush size menu module component that integrates with MenuBar.
 * Tests component initialization, size selection, rendering, and event emission.
 */

const { expect } = require('chai');
const sinon = require('sinon');
const { setupUITestEnvironment, cleanupUITestEnvironment } = require('../../../helpers/uiTestHelpers');

describe('BrushSizeMenuModule', function() {
  beforeEach(function() {
    setupUITestEnvironment();
    
    // Load the BrushSizeMenuModule class
    // This will fail initially since the class doesn't exist yet
    try {
      const BrushSizeMenuModule = require('../../../../Classes/ui/menuBar/BrushSizeMenuModule');
      global.BrushSizeMenuModule = BrushSizeMenuModule;
    } catch (e) {
      // Expected to fail - class doesn't exist yet
      global.BrushSizeMenuModule = undefined;
    }
  });
  
  afterEach(function() {
    cleanupUITestEnvironment();
  });
  
  describe('Initialization', function() {
    it('should initialize with default size of 1', function() {
      expect(global.BrushSizeMenuModule).to.not.be.undefined;
      
      const module = new BrushSizeMenuModule({
        label: 'Brush Size',
        x: 0,
        y: 0
      });
      
      expect(module.getSize()).to.equal(1);
    });
    
    it('should accept custom initial size within valid range', function() {
      const module = new BrushSizeMenuModule({
        label: 'Brush Size',
        x: 0,
        y: 0,
        initialSize: 5
      });
      
      expect(module.getSize()).to.equal(5);
    });
  });
  
  describe('Size Range Validation', function() {
    it('should accept sizes 1-99', function() {
      const module = new BrushSizeMenuModule({
        label: 'Brush Size',
        x: 0,
        y: 0
      });
      
      // Test boundary values
      module.setSize(1);
      expect(module.getSize()).to.equal(1);
      
      module.setSize(50);
      expect(module.getSize()).to.equal(50);
      
      module.setSize(99);
      expect(module.getSize()).to.equal(99);
    });
    
    it('should clamp size below 1 to 1', function() {
      const module = new BrushSizeMenuModule({
        label: 'Brush Size',
        x: 0,
        y: 0
      });
      
      module.setSize(0);
      expect(module.getSize()).to.equal(1);
      
      module.setSize(-5);
      expect(module.getSize()).to.equal(1);
    });
    
    it('should clamp size above 99 to 99', function() {
      const module = new BrushSizeMenuModule({
        label: 'Brush Size',
        x: 0,
        y: 0
      });
      
      module.setSize(100);
      expect(module.getSize()).to.equal(99);
      
      module.setSize(200);
      expect(module.getSize()).to.equal(99);
    });
  });
  
  describe('Rendering', function() {
    it('should render size display when visible', function() {
      const module = new BrushSizeMenuModule({
        label: 'Brush Size',
        x: 100,
        y: 50,
        initialSize: 5
      });
      
      // Make visible
      module.visible = true;
      
      // Render should be called
      module.render();
      
      // Verify text() was called for size display
      expect(global.text.called).to.be.true;
      expect(global.text.calledWith(5)).to.be.true;
    });
    
    it('should render +/- buttons', function() {
      const module = new BrushSizeMenuModule({
        label: 'Brush Size',
        x: 100,
        y: 50,
        initialSize: 5
      });
      
      module.visible = true;
      module.render();
      
      // Verify rect() was called for buttons (should be called at least twice)
      expect(global.rect.callCount).to.be.at.least(2);
      
      // Verify '+' and '-' text rendered
      expect(global.text.calledWith('-')).to.be.true;
      expect(global.text.calledWith('+')).to.be.true;
    });
  });
  
  describe('Event Emission', function() {
    it('should emit brushSizeChanged event on size selection', function() {
      const onSizeChange = sinon.spy();
      
      const module = new BrushSizeMenuModule({
        label: 'Brush Size',
        x: 100,
        y: 50,
        onSizeChange: onSizeChange
      });
      
      module.setSize(7);
      
      expect(onSizeChange.calledOnce).to.be.true;
      expect(onSizeChange.calledWith(7)).to.be.true;
    });
    
    it('should not emit event if size unchanged', function() {
      const onSizeChange = sinon.spy();
      
      const module = new BrushSizeMenuModule({
        label: 'Brush Size',
        x: 100,
        y: 50,
        initialSize: 3,
        onSizeChange: onSizeChange
      });
      
      onSizeChange.resetHistory();
      
      module.setSize(3); // Same size
      
      expect(onSizeChange.called).to.be.false;
    });
  });
  
  describe('Click Handling', function() {
    it('should handle click on increase button', function() {
      const onSizeChange = sinon.spy();
      
      const module = new BrushSizeMenuModule({
        label: 'Brush Size',
        x: 100,
        y: 50,
        initialSize: 5,
        onSizeChange: onSizeChange
      });
      
      module.visible = true;
      
      // Use increase method (button functionality)
      module.increase();
      
      expect(onSizeChange.called).to.be.true;
      expect(module.getSize()).to.equal(6);
    });
    
    it('should handle click on decrease button', function() {
      const onSizeChange = sinon.spy();
      
      const module = new BrushSizeMenuModule({
        label: 'Brush Size',
        x: 100,
        y: 50,
        initialSize: 5,
        onSizeChange: onSizeChange
      });
      
      module.visible = true;
      
      // Use decrease method (button functionality)
      module.decrease();
      
      expect(onSizeChange.called).to.be.true;
      expect(module.getSize()).to.equal(4);
    });
  });
});
