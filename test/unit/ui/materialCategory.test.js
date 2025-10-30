/**
 * Unit Tests for MaterialCategory
 * 
 * Tests the expandable/collapsible category component for organizing materials.
 * TDD Phase: RED (tests written FIRST, expected to fail)
 * 
 * Test Coverage:
 * - Initialization (4 tests)
 * - Expand/Collapse (4 tests)
 * - Rendering (4 tests)
 * - Click Handling (3 tests)
 * 
 * Total: 15 tests
 */

const { expect } = require('chai');
const sinon = require('sinon');
const MaterialCategory = require('../../../Classes/ui/MaterialCategory');

describe('MaterialCategory', function() {
  let sandbox;
  
  beforeEach(function() {
    sandbox = sinon.createSandbox();
    
    // Mock p5.js globals
    global.push = sandbox.stub();
    global.pop = sandbox.stub();
    global.fill = sandbox.stub();
    global.noFill = sandbox.stub();
    global.stroke = sandbox.stub();
    global.noStroke = sandbox.stub();
    global.strokeWeight = sandbox.stub();
    global.rect = sandbox.stub();
    global.text = sandbox.stub();
    global.textAlign = sandbox.stub();
    global.textSize = sandbox.stub();
    global.LEFT = 'LEFT';
    global.CENTER = 'CENTER';
    global.TOP = 'TOP';
    
    // Sync with window for JSDOM
    if (typeof window !== 'undefined') {
      window.push = global.push;
      window.pop = global.pop;
      window.fill = global.fill;
      window.noFill = global.noFill;
      window.stroke = global.stroke;
      window.noStroke = global.noStroke;
      window.strokeWeight = global.strokeWeight;
      window.rect = global.rect;
      window.text = global.text;
      window.textAlign = global.textAlign;
      window.textSize = global.textSize;
      window.LEFT = global.LEFT;
      window.CENTER = global.CENTER;
      window.TOP = global.TOP;
    }
  });
  
  afterEach(function() {
    sandbox.restore();
  });
  
  // ===========================
  // Initialization Tests (4)
  // ===========================
  
  describe('Initialization', function() {
    it('should initialize with id, name, and materials array', function() {
      const category = new MaterialCategory('ground', 'Ground', ['dirt', 'sand']);
      
      expect(category).to.exist;
      expect(category.id).to.equal('ground');
      expect(category.name).to.equal('Ground');
      expect(category.getMaterials()).to.deep.equal(['dirt', 'sand']);
    });
    
    it('should default to collapsed state (isExpanded = false)', function() {
      const category = new MaterialCategory('stone', 'Stone', ['stone']);
      
      expect(category.isExpanded()).to.be.false;
    });
    
    it('should respect defaultExpanded option', function() {
      const category = new MaterialCategory('vegetation', 'Vegetation', ['grass', 'moss'], {
        defaultExpanded: true
      });
      
      expect(category.isExpanded()).to.be.true;
    });
    
    it('should initialize with empty materials array without errors', function() {
      const category = new MaterialCategory('empty', 'Empty', []);
      
      expect(category).to.exist;
      expect(category.getMaterials()).to.deep.equal([]);
    });
  });
  
  // ===========================
  // Expand/Collapse Tests (4)
  // ===========================
  
  describe('Expand/Collapse', function() {
    it('should expand when expand() called', function() {
      const category = new MaterialCategory('ground', 'Ground', ['dirt']);
      
      expect(category.isExpanded()).to.be.false;
      
      category.expand();
      
      expect(category.isExpanded()).to.be.true;
    });
    
    it('should collapse when collapse() called', function() {
      const category = new MaterialCategory('ground', 'Ground', ['dirt'], {
        defaultExpanded: true
      });
      
      expect(category.isExpanded()).to.be.true;
      
      category.collapse();
      
      expect(category.isExpanded()).to.be.false;
    });
    
    it('should toggle state when toggle() called', function() {
      const category = new MaterialCategory('ground', 'Ground', ['dirt']);
      
      expect(category.isExpanded()).to.be.false;
      
      category.toggle();
      expect(category.isExpanded()).to.be.true;
      
      category.toggle();
      expect(category.isExpanded()).to.be.false;
    });
    
    it('should trigger onToggle callback when state changes', function() {
      const onToggleStub = sandbox.stub();
      const category = new MaterialCategory('ground', 'Ground', ['dirt'], {
        onToggle: onToggleStub
      });
      
      category.toggle();
      
      expect(onToggleStub.calledOnce).to.be.true;
      expect(onToggleStub.calledWith('ground', true)).to.be.true;
    });
  });
  
  // ===========================
  // Rendering Tests (4)
  // ===========================
  
  describe('Rendering', function() {
    it('should draw header with category name', function() {
      const category = new MaterialCategory('ground', 'Ground', ['dirt', 'sand']);
      
      category.render(10, 20, 200);
      
      expect(global.text.called).to.be.true;
      
      // Find call that draws category name
      const textCalls = global.text.getCalls();
      const nameCall = textCalls.find(call => call.args[0] === 'Ground');
      expect(nameCall).to.exist;
    });
    
    it('should draw expand/collapse indicator (▶ when collapsed, ▼ when expanded)', function() {
      const category = new MaterialCategory('ground', 'Ground', ['dirt']);
      
      // Test collapsed indicator
      category.render(10, 20, 200);
      let textCalls = global.text.getCalls();
      let indicatorCall = textCalls.find(call => call.args[0] === '▶');
      expect(indicatorCall).to.exist;
      
      // Reset and test expanded indicator
      global.text.resetHistory();
      category.expand();
      category.render(10, 20, 200);
      textCalls = global.text.getCalls();
      indicatorCall = textCalls.find(call => call.args[0] === '▼');
      expect(indicatorCall).to.exist;
    });
    
    it('should draw materials grid when expanded', function() {
      const category = new MaterialCategory('ground', 'Ground', ['dirt', 'sand', 'mud']);
      
      category.expand();
      category.render(10, 20, 200);
      
      // Should draw rectangles for material swatches
      expect(global.rect.callCount).to.be.at.least(3); // 3 materials
    });
    
    it('should skip materials grid when collapsed', function() {
      const category = new MaterialCategory('ground', 'Ground', ['dirt', 'sand', 'mud']);
      
      // Collapsed by default
      const initialRectCalls = global.rect.callCount;
      category.render(10, 20, 200);
      const finalRectCalls = global.rect.callCount;
      
      // Should only draw header rectangle, not material swatches
      expect(finalRectCalls - initialRectCalls).to.equal(1); // Just header
    });
  });
  
  // ===========================
  // Height Calculation Tests (2)
  // ===========================
  
  describe('Height Calculation', function() {
    it('should return header height when collapsed', function() {
      const category = new MaterialCategory('ground', 'Ground', ['dirt', 'sand']);
      
      const height = category.getHeight();
      
      expect(height).to.equal(40); // Header height
    });
    
    it('should return header + grid height when expanded', function() {
      const category = new MaterialCategory('ground', 'Ground', ['dirt', 'sand', 'mud', 'clay']);
      
      category.expand();
      const height = category.getHeight();
      
      // Header (40px) + 2 rows of materials (40px each + 5px spacing)
      expect(height).to.be.greaterThan(40);
    });
  });
  
  // ===========================
  // Click Handling Tests (3)
  // ===========================
  
  describe('Click Handling', function() {
    it('should toggle expand/collapse when header clicked', function() {
      const category = new MaterialCategory('ground', 'Ground', ['dirt']);
      
      expect(category.isExpanded()).to.be.false;
      
      // Click on header (y within 0-40)
      const result = category.handleClick(50, 20, 10, 10);
      
      expect(category.isExpanded()).to.be.true;
    });
    
    it('should return clicked material when material swatch clicked (expanded)', function() {
      const category = new MaterialCategory('ground', 'Ground', ['dirt', 'sand']);
      
      category.expand();
      
      // Click on first material swatch (below header)
      const clickedMaterial = category.handleClick(30, 60, 10, 10);
      
      expect(clickedMaterial).to.be.oneOf(['dirt', 'sand']);
    });
    
    it('should return null when clicking outside category bounds', function() {
      const category = new MaterialCategory('ground', 'Ground', ['dirt']);
      
      category.expand();
      
      // Click far outside category
      const result = category.handleClick(500, 500, 10, 10);
      
      expect(result).to.be.null;
    });
  });
});
