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
    it('should accept sizes 1-9', function() {
      const module = new BrushSizeMenuModule({
        label: 'Brush Size',
        x: 0,
        y: 0
      });
      
      for (let size = 1; size <= 9; size++) {
        module.setSize(size);
        expect(module.getSize()).to.equal(size);
      }
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
    
    it('should clamp size above 9 to 9', function() {
      const module = new BrushSizeMenuModule({
        label: 'Brush Size',
        x: 0,
        y: 0
      });
      
      module.setSize(10);
      expect(module.getSize()).to.equal(9);
      
      module.setSize(50);
      expect(module.getSize()).to.equal(9);
    });
  });
  
  describe('Rendering', function() {
    it('should render size options in dropdown', function() {
      const module = new BrushSizeMenuModule({
        label: 'Brush Size',
        x: 100,
        y: 50
      });
      
      // Open dropdown
      module.setOpen(true);
      
      // Render should be called
      module.render();
      
      // Verify text() was called for size options
      expect(global.text.called).to.be.true;
    });
    
    it('should highlight current brush size', function() {
      const module = new BrushSizeMenuModule({
        label: 'Brush Size',
        x: 100,
        y: 50,
        initialSize: 5
      });
      
      module.setOpen(true);
      module.render();
      
      // Should render with indication of current size (5)
      // This will be visually verified via E2E tests
      expect(module.getSize()).to.equal(5);
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
    it('should handle click on size option', function() {
      const onSizeChange = sinon.spy();
      
      const module = new BrushSizeMenuModule({
        label: 'Brush Size',
        x: 100,
        y: 50,
        onSizeChange: onSizeChange
      });
      
      module.setOpen(true);
      
      // Simulate click on size option 4
      // Click position would be at dropdown Y + (option index * option height)
      const clickResult = module.handleClick(110, 80); // Approximate position of size 4
      
      expect(clickResult).to.be.true; // Click was consumed
      expect(onSizeChange.called).to.be.true;
    });
  });
});
