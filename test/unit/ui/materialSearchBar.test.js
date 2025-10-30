/**
 * Unit Tests for MaterialSearchBar
 * 
 * Tests the search input component for filtering materials by name.
 * TDD Phase: RED (tests written FIRST, expected to fail)
 * 
 * Test Coverage:
 * - Initialization (3 tests)
 * - Input Handling (4 tests)
 * - Focus State (2 tests)
 * - Rendering (3 tests)
 * - Keyboard Handling (5 tests)
 * 
 * Total: 17 tests
 */

const { expect } = require('chai');
const sinon = require('sinon');
const MaterialSearchBar = require('../../../Classes/ui/MaterialSearchBar');

describe('MaterialSearchBar', function() {
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
    global.line = sandbox.stub();
    global.textWidth = sandbox.stub().returns(50);
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
  // Initialization Tests (3)
  // ===========================
  
  describe('Initialization', function() {
    it('should initialize with empty value', function() {
      const searchBar = new MaterialSearchBar();
      
      expect(searchBar).to.exist;
      expect(searchBar.getValue()).to.equal('');
    });
    
    it('should set placeholder from options', function() {
      const searchBar = new MaterialSearchBar({ placeholder: 'Search materials...' });
      
      expect(searchBar.placeholder).to.equal('Search materials...');
    });
    
    it('should set width from options', function() {
      const searchBar = new MaterialSearchBar({ width: 250 });
      
      expect(searchBar.width).to.equal(250);
    });
  });
  
  // ===========================
  // Input Handling Tests (4)
  // ===========================
  
  describe('Input Handling', function() {
    it('should return current text value with getValue()', function() {
      const searchBar = new MaterialSearchBar();
      
      searchBar.setValue('moss');
      
      expect(searchBar.getValue()).to.equal('moss');
    });
    
    it('should update internal value with setValue(text)', function() {
      const searchBar = new MaterialSearchBar();
      
      searchBar.setValue('stone');
      
      expect(searchBar.getValue()).to.equal('stone');
    });
    
    it('should reset value to empty string with clear()', function() {
      const searchBar = new MaterialSearchBar();
      
      searchBar.setValue('dirt');
      expect(searchBar.getValue()).to.equal('dirt');
      
      searchBar.clear();
      
      expect(searchBar.getValue()).to.equal('');
    });
    
    it('should update value character by character', function() {
      const searchBar = new MaterialSearchBar();
      
      searchBar.setValue('m');
      expect(searchBar.getValue()).to.equal('m');
      
      searchBar.setValue('mo');
      expect(searchBar.getValue()).to.equal('mo');
      
      searchBar.setValue('mos');
      expect(searchBar.getValue()).to.equal('mos');
    });
  });
  
  // ===========================
  // Focus State Tests (2)
  // ===========================
  
  describe('Focus State', function() {
    it('should set isFocused to true when focus() called', function() {
      const searchBar = new MaterialSearchBar();
      
      expect(searchBar.isFocused()).to.be.false;
      
      searchBar.focus();
      
      expect(searchBar.isFocused()).to.be.true;
    });
    
    it('should set isFocused to false when blur() called', function() {
      const searchBar = new MaterialSearchBar();
      
      searchBar.focus();
      expect(searchBar.isFocused()).to.be.true;
      
      searchBar.blur();
      
      expect(searchBar.isFocused()).to.be.false;
    });
  });
  
  // ===========================
  // Rendering Tests (3)
  // ===========================
  
  describe('Rendering', function() {
    it('should draw input box', function() {
      const searchBar = new MaterialSearchBar();
      
      searchBar.render(10, 10, 200, 30);
      
      expect(global.rect.called).to.be.true;
    });
    
    it('should draw placeholder when value is empty', function() {
      const searchBar = new MaterialSearchBar({ placeholder: 'Search...' });
      
      searchBar.render(10, 10, 200, 30);
      
      const textCalls = global.text.getCalls();
      const placeholderCall = textCalls.find(call => call.args[0] === 'Search...');
      expect(placeholderCall).to.exist;
    });
    
    it('should draw text value when not empty', function() {
      const searchBar = new MaterialSearchBar();
      
      searchBar.setValue('moss');
      searchBar.render(10, 10, 200, 30);
      
      const textCalls = global.text.getCalls();
      const valueCall = textCalls.find(call => call.args[0] === 'moss');
      expect(valueCall).to.exist;
    });
  });
  
  // ===========================
  // Keyboard Handling Tests (5)
  // ===========================
  
  describe('Keyboard Handling', function() {
    it('should append alphanumeric characters', function() {
      const searchBar = new MaterialSearchBar();
      
      searchBar.handleKeyPress('m', 77);
      expect(searchBar.getValue()).to.equal('m');
      
      searchBar.handleKeyPress('o', 79);
      expect(searchBar.getValue()).to.equal('mo');
      
      searchBar.handleKeyPress('s', 83);
      expect(searchBar.getValue()).to.equal('mos');
    });
    
    it('should handle backspace (delete last character)', function() {
      const searchBar = new MaterialSearchBar();
      
      searchBar.setValue('moss');
      searchBar.handleKeyPress('Backspace', 8);
      
      expect(searchBar.getValue()).to.equal('mos');
    });
    
    it('should ignore non-alphanumeric keys', function() {
      const searchBar = new MaterialSearchBar();
      
      searchBar.setValue('moss');
      searchBar.handleKeyPress('Shift', 16);
      
      expect(searchBar.getValue()).to.equal('moss'); // Unchanged
    });
    
    it('should trigger onSubmit callback when Enter pressed', function() {
      const onSubmitStub = sandbox.stub();
      const searchBar = new MaterialSearchBar({ onSubmit: onSubmitStub });
      
      searchBar.setValue('moss');
      searchBar.handleKeyPress('Enter', 13);
      
      expect(onSubmitStub.calledOnce).to.be.true;
      expect(onSubmitStub.calledWith('moss')).to.be.true;
    });
    
    it('should clear input and blur when Escape pressed', function() {
      const searchBar = new MaterialSearchBar();
      
      searchBar.setValue('moss');
      searchBar.focus();
      
      searchBar.handleKeyPress('Escape', 27);
      
      expect(searchBar.getValue()).to.equal('');
      expect(searchBar.isFocused()).to.be.false;
    });
  });
  
  // ===========================
  // Click Handling Tests (2)
  // ===========================
  
  describe('Click Handling', function() {
    it('should focus input when clicked inside bar', function() {
      const searchBar = new MaterialSearchBar();
      
      expect(searchBar.isFocused()).to.be.false;
      
      // Click inside search bar bounds (x: 10-210, y: 10-40)
      searchBar.handleClick(50, 20, 10, 10);
      
      expect(searchBar.isFocused()).to.be.true;
    });
    
    it('should clear input when clear button (X) clicked', function() {
      const searchBar = new MaterialSearchBar();
      
      searchBar.setValue('moss');
      
      // Click on clear button (right side of input)
      const cleared = searchBar.handleClick(200, 20, 10, 10); // Near right edge
      
      // Should clear value (implementation may vary)
      expect(cleared).to.be.true;
    });
  });
});
