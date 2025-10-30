/**
 * CategoryRadioButtons Unit Tests
 * Tests for radio button category selector UI component
 */

const { expect } = require('chai');
const sinon = require('sinon');

describe('CategoryRadioButtons', function() {
  let CategoryRadioButtons;
  let mockP5;
  
  before(function() {
    // Mock p5.js drawing functions
    mockP5 = {
      push: sinon.stub(),
      pop: sinon.stub(),
      fill: sinon.stub(),
      rect: sinon.stub(),
      textAlign: sinon.stub(),
      textSize: sinon.stub(),
      text: sinon.stub(),
      CENTER: 'CENTER'
    };
    
    global.push = mockP5.push;
    global.pop = mockP5.pop;
    global.fill = mockP5.fill;
    global.rect = mockP5.rect;
    global.textAlign = mockP5.textAlign;
    global.textSize = mockP5.textSize;
    global.text = mockP5.text;
    global.CENTER = mockP5.CENTER;
    
    // Load CategoryRadioButtons
    const CategoryRadioButtonsModule = require('../../../Classes/ui/CategoryRadioButtons');
    CategoryRadioButtons = CategoryRadioButtonsModule.CategoryRadioButtons || CategoryRadioButtonsModule;
  });
  
  afterEach(function() {
    sinon.resetHistory();
  });
  
  after(function() {
    sinon.restore();
  });
  
  describe('Constructor', function() {
    it('should render 3 radio buttons (Entities, Buildings, Resources)', function() {
      const buttons = new CategoryRadioButtons();
      expect(buttons.categories).to.be.an('array');
      expect(buttons.categories.length).to.equal(3);
    });
    
    it('should have correct category ids', function() {
      const buttons = new CategoryRadioButtons();
      const ids = buttons.categories.map(cat => cat.id);
      
      expect(ids).to.include('entities');
      expect(ids).to.include('buildings');
      expect(ids).to.include('resources');
    });
    
    it('should have icons for each category', function() {
      const buttons = new CategoryRadioButtons();
      
      buttons.categories.forEach(cat => {
        expect(cat).to.have.property('icon');
        expect(cat.icon).to.be.a('string');
      });
    });
    
    it('should initialize with entities selected', function() {
      const buttons = new CategoryRadioButtons();
      expect(buttons.selected).to.equal('entities');
    });
    
    it('should accept onChange callback', function() {
      const callback = sinon.stub();
      const buttons = new CategoryRadioButtons(callback);
      expect(buttons.onChangeCallback).to.equal(callback);
    });
    
    it('should have default height', function() {
      const buttons = new CategoryRadioButtons();
      expect(buttons.height).to.be.a('number');
      expect(buttons.height).to.be.greaterThan(0);
    });
  });
  
  describe('Selection', function() {
    it('should highlight selected category', function() {
      const buttons = new CategoryRadioButtons();
      buttons.select('buildings');
      expect(buttons.selected).to.equal('buildings');
    });
    
    it('should track current selection', function() {
      const buttons = new CategoryRadioButtons();
      expect(buttons.getSelected()).to.equal('entities');
      
      buttons.select('resources');
      expect(buttons.getSelected()).to.equal('resources');
    });
    
    it('should change selection when different category selected', function() {
      const buttons = new CategoryRadioButtons();
      buttons.select('buildings');
      expect(buttons.selected).to.equal('buildings');
      
      buttons.select('resources');
      expect(buttons.selected).to.equal('resources');
    });
  });
  
  describe('Callbacks', function() {
    it('should trigger callback on selection change', function() {
      const callback = sinon.stub();
      const buttons = new CategoryRadioButtons(callback);
      
      buttons.select('buildings');
      
      expect(callback.calledOnce).to.be.true;
      expect(callback.calledWith('buildings')).to.be.true;
    });
    
    it('should not trigger callback if no callback provided', function() {
      const buttons = new CategoryRadioButtons();
      expect(() => buttons.select('resources')).to.not.throw();
    });
    
    it('should trigger callback multiple times', function() {
      const callback = sinon.stub();
      const buttons = new CategoryRadioButtons(callback);
      
      buttons.select('buildings');
      buttons.select('resources');
      buttons.select('entities');
      
      expect(callback.callCount).to.equal(3);
    });
  });
  
  describe('Rendering', function() {
    it('should call push/pop for isolation', function() {
      const buttons = new CategoryRadioButtons();
      buttons.render(0, 0, 300);
      
      expect(mockP5.push.called).to.be.true;
      expect(mockP5.pop.called).to.be.true;
    });
    
    it('should render all three categories', function() {
      const buttons = new CategoryRadioButtons();
      mockP5.rect.resetHistory();
      
      buttons.render(0, 0, 300);
      
      // Should draw 3 rectangles (one per category)
      expect(mockP5.rect.callCount).to.be.greaterThanOrEqual(3);
    });
    
    it('should render text labels', function() {
      const buttons = new CategoryRadioButtons();
      mockP5.text.resetHistory();
      
      buttons.render(0, 0, 300);
      
      // Should draw text for each category
      expect(mockP5.text.callCount).to.be.greaterThanOrEqual(3);
    });
    
    it('should use different colors for selected vs unselected', function() {
      const buttons = new CategoryRadioButtons();
      mockP5.fill.resetHistory();
      
      buttons.select('buildings');
      buttons.render(0, 0, 300);
      
      // Should call fill with different colors
      expect(mockP5.fill.callCount).to.be.greaterThan(3);
    });
  });
  
  describe('Click Handling', function() {
    it('should detect click on first button', function() {
      const buttons = new CategoryRadioButtons();
      const buttonWidth = 300 / 3;
      
      const clicked = buttons.handleClick(buttonWidth / 2, 20, 0, 0, 300);
      
      expect(clicked).to.not.be.null;
      expect(clicked.id).to.equal('entities');
    });
    
    it('should detect click on second button', function() {
      const buttons = new CategoryRadioButtons();
      const buttonWidth = 300 / 3;
      
      const clicked = buttons.handleClick(buttonWidth * 1.5, 20, 0, 0, 300);
      
      expect(clicked).to.not.be.null;
      expect(clicked.id).to.equal('buildings');
    });
    
    it('should detect click on third button', function() {
      const buttons = new CategoryRadioButtons();
      const buttonWidth = 300 / 3;
      
      const clicked = buttons.handleClick(buttonWidth * 2.5, 20, 0, 0, 300);
      
      expect(clicked).to.not.be.null;
      expect(clicked.id).to.equal('resources');
    });
    
    it('should return null for click outside buttons', function() {
      const buttons = new CategoryRadioButtons();
      
      const clicked = buttons.handleClick(500, 20, 0, 0, 300);
      expect(clicked).to.be.null;
    });
    
    it('should return null for click above buttons', function() {
      const buttons = new CategoryRadioButtons();
      
      const clicked = buttons.handleClick(150, -10, 0, 0, 300);
      expect(clicked).to.be.null;
    });
    
    it('should return null for click below buttons', function() {
      const buttons = new CategoryRadioButtons();
      
      const clicked = buttons.handleClick(150, 100, 0, 0, 300);
      expect(clicked).to.be.null;
    });
    
    it('should update selection when button clicked', function() {
      const buttons = new CategoryRadioButtons();
      const buttonWidth = 300 / 3;
      
      buttons.handleClick(buttonWidth * 1.5, 20, 0, 0, 300);
      expect(buttons.getSelected()).to.equal('buildings');
    });
  });
  
  describe('Icon Display', function() {
    it('should display ant icon for Entities', function() {
      const buttons = new CategoryRadioButtons();
      const entitiesCategory = buttons.categories.find(cat => cat.id === 'entities');
      
      expect(entitiesCategory.icon).to.equal('🐜');
    });
    
    it('should display house icon for Buildings', function() {
      const buttons = new CategoryRadioButtons();
      const buildingsCategory = buttons.categories.find(cat => cat.id === 'buildings');
      
      expect(buildingsCategory.icon).to.equal('🏠');
    });
    
    it('should display tree icon for Resources', function() {
      const buttons = new CategoryRadioButtons();
      const resourcesCategory = buttons.categories.find(cat => cat.id === 'resources');
      
      expect(resourcesCategory.icon).to.equal('🌳');
    });
  });
  
  describe('Edge Cases', function() {
    it('should handle selecting same category twice', function() {
      const callback = sinon.stub();
      const buttons = new CategoryRadioButtons(callback);
      
      buttons.select('buildings');
      buttons.select('buildings');
      
      expect(callback.callCount).to.equal(2);
      expect(buttons.getSelected()).to.equal('buildings');
    });
    
    it('should handle invalid category gracefully', function() {
      const buttons = new CategoryRadioButtons();
      
      expect(() => buttons.select('invalid')).to.not.throw();
      // Selection should update even if invalid
      expect(buttons.selected).to.equal('invalid');
    });
  });
});
