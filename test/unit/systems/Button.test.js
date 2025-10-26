/**
 * Unit Tests for Button Class
 * Tests UI button creation, interaction, and rendering
 */

const { expect } = require('chai');

// Mock p5.js dependencies
global.push = () => {};
global.pop = () => {};
global.imageMode = () => {};
global.rectMode = () => {};
global.textAlign = () => {};
global.CENTER = 'CENTER';
global.WORD = 'WORD';
global.translate = () => {};
global.scale = () => {};
global.tint = () => {};
global.noTint = () => {};
global.fill = () => {};
global.stroke = () => {};
global.strokeWeight = () => {};
global.noStroke = () => {};
global.rect = () => {};
global.image = () => {};
global.text = () => {};
global.textFont = () => {};
global.textSize = () => {};
global.textWrap = () => {};
global.textWidth = (str) => str.length * 8; // Mock text width
global.color = (...args) => args.join(',');
global.sin = Math.sin;
global.frameCount = 0;

// Load CollisionBox2D first (dependency)
const CollisionBox2D = require('../../../Classes/systems/CollisionBox2D');
global.CollisionBox2D = CollisionBox2D;

// Load Button class
const Button = require('../../../Classes/systems/Button');
const { ButtonStyles, createMenuButton } = Button;

describe('Button Class', function() {
  
  describe('Constructor', function() {
    
    it('should create button with position and size', function() {
      const btn = new Button(100, 200, 150, 40, 'Click Me');
      
      expect(btn.x).to.equal(100);
      expect(btn.y).to.equal(200);
      expect(btn.width).to.equal(150);
      expect(btn.height).to.equal(40);
    });
    
    it('should set caption text', function() {
      const btn = new Button(0, 0, 100, 50, 'Test Caption');
      
      expect(btn.caption).to.equal('Test Caption');
    });
    
    it('should create CollisionBox2D for bounds', function() {
      const btn = new Button(10, 20, 100, 50, 'Test');
      
      expect(btn.bounds).to.be.instanceOf(CollisionBox2D);
      expect(btn.bounds.x).to.equal(10);
      expect(btn.bounds.y).to.equal(20);
    });
    
    it('should use default colors', function() {
      const btn = new Button(0, 0, 100, 50, 'Test');
      
      expect(btn.backgroundColor).to.equal('#4CAF50');
      expect(btn.hoverColor).to.equal('#45a049');
      expect(btn.textColor).to.equal('white');
      expect(btn.borderColor).to.equal('#333');
    });
    
    it('should apply custom colors from options', function() {
      const btn = new Button(0, 0, 100, 50, 'Test', {
        backgroundColor: '#FF0000',
        hoverColor: '#CC0000',
        textColor: 'black',
        borderColor: '#000000'
      });
      
      expect(btn.backgroundColor).to.equal('#FF0000');
      expect(btn.hoverColor).to.equal('#CC0000');
      expect(btn.textColor).to.equal('black');
      expect(btn.borderColor).to.equal('#000000');
    });
    
    it('should set default styling options', function() {
      const btn = new Button(0, 0, 100, 50, 'Test');
      
      expect(btn.borderWidth).to.equal(2);
      expect(btn.cornerRadius).to.equal(5);
      expect(btn.fontFamily).to.equal('Arial');
      expect(btn.fontSize).to.equal(16);
    });
    
    it('should apply custom styling options', function() {
      const btn = new Button(0, 0, 100, 50, 'Test', {
        borderWidth: 3,
        cornerRadius: 10,
        fontFamily: 'Helvetica',
        fontSize: 20
      });
      
      expect(btn.borderWidth).to.equal(3);
      expect(btn.cornerRadius).to.equal(10);
      expect(btn.fontFamily).to.equal('Helvetica');
      expect(btn.fontSize).to.equal(20);
    });
    
    it('should initialize scale properties', function() {
      const btn = new Button(0, 0, 100, 50, 'Test');
      
      expect(btn.scale).to.equal(1);
      expect(btn.targetScale).to.equal(1);
      expect(btn.scaleSpeed).to.equal(0.1);
    });
    
    it('should set click handler if provided', function() {
      const handler = () => console.log('clicked');
      const btn = new Button(0, 0, 100, 50, 'Test', { onClick: handler });
      
      expect(btn.onClick).to.equal(handler);
    });
    
    it('should be enabled by default', function() {
      const btn = new Button(0, 0, 100, 50, 'Test');
      
      expect(btn.enabled).to.be.true;
    });
    
    it('should respect enabled option', function() {
      const btn = new Button(0, 0, 100, 50, 'Test', { enabled: false });
      
      expect(btn.enabled).to.be.false;
    });
    
    it('should initialize state flags', function() {
      const btn = new Button(0, 0, 100, 50, 'Test');
      
      expect(btn.isHovered).to.be.false;
      expect(btn.isPressed).to.be.false;
      expect(btn.wasClicked).to.be.false;
    });
    
    it('should support image option', function() {
      const mockImage = { _mockImage: true };
      const btn = new Button(0, 0, 100, 50, 'Test', { image: mockImage });
      
      expect(btn.img).to.equal(mockImage);
    });
  });
  
  describe('Getter Properties', function() {
    
    it('should return x from bounds', function() {
      const btn = new Button(150, 200, 100, 50, 'Test');
      expect(btn.x).to.equal(150);
    });
    
    it('should return y from bounds', function() {
      const btn = new Button(150, 200, 100, 50, 'Test');
      expect(btn.y).to.equal(200);
    });
    
    it('should return width from bounds', function() {
      const btn = new Button(0, 0, 120, 60, 'Test');
      expect(btn.width).to.equal(120);
    });
    
    it('should return height from bounds', function() {
      const btn = new Button(0, 0, 120, 60, 'Test');
      expect(btn.height).to.equal(60);
    });
  });
  
  describe('isMouseOver()', function() {
    
    it('should return true when mouse is over button', function() {
      const btn = new Button(100, 100, 100, 50, 'Test');
      
      expect(btn.isMouseOver(150, 125)).to.be.true;
    });
    
    it('should return false when mouse is outside button', function() {
      const btn = new Button(100, 100, 100, 50, 'Test');
      
      expect(btn.isMouseOver(50, 50)).to.be.false;
      expect(btn.isMouseOver(250, 200)).to.be.false;
    });
    
    it('should check boundaries correctly', function() {
      const btn = new Button(100, 100, 100, 50, 'Test');
      
      expect(btn.isMouseOver(100, 100)).to.be.true; // Top-left corner
      expect(btn.isMouseOver(200, 150)).to.be.true; // Bottom-right corner
      expect(btn.isMouseOver(99, 125)).to.be.false; // Just outside left
      expect(btn.isMouseOver(201, 125)).to.be.false; // Just outside right
    });
  });
  
  describe('update()', function() {
    
    it('should detect hover state', function() {
      const btn = new Button(100, 100, 100, 50, 'Test');
      
      btn.update(150, 125, false);
      
      expect(btn.isHovered).to.be.true;
    });
    
    it('should detect when mouse leaves', function() {
      const btn = new Button(100, 100, 100, 50, 'Test');
      
      btn.update(150, 125, false);
      expect(btn.isHovered).to.be.true;
      
      btn.update(50, 50, false);
      expect(btn.isHovered).to.be.false;
    });
    
    it('should detect mouse press on button', function() {
      const btn = new Button(100, 100, 100, 50, 'Test');
      
      btn.update(150, 125, true);
      
      expect(btn.isPressed).to.be.true;
    });
    
    it('should call onClick handler on release', function() {
      let clicked = false;
      const btn = new Button(100, 100, 100, 50, 'Test', {
        onClick: () => { clicked = true; }
      });
      
      // Press
      btn.update(150, 125, true);
      expect(clicked).to.be.false;
      
      // Release while still hovering
      btn.update(150, 125, false);
      expect(clicked).to.be.true;
    });
    
    it('should set wasClicked flag on successful click', function() {
      const btn = new Button(100, 100, 100, 50, 'Test');
      
      btn.update(150, 125, true); // Press
      btn.update(150, 125, false); // Release
      
      expect(btn.wasClicked).to.be.true;
    });
    
    it('should not trigger onClick if released outside button', function() {
      let clicked = false;
      const btn = new Button(100, 100, 100, 50, 'Test', {
        onClick: () => { clicked = true; }
      });
      
      btn.update(150, 125, true); // Press inside
      btn.update(50, 50, false); // Release outside
      
      expect(clicked).to.be.false;
    });
    
    it('should not respond when disabled', function() {
      const btn = new Button(100, 100, 100, 50, 'Test', { enabled: false });
      
      btn.update(150, 125, true);
      
      expect(btn.isHovered).to.be.false;
      expect(btn.isPressed).to.be.false;
    });
    
    it('should return true when consuming mouse event', function() {
      const btn = new Button(100, 100, 100, 50, 'Test');
      
      const consumed = btn.update(150, 125, true);
      
      expect(consumed).to.be.true;
    });
    
    it('should return false when not consuming event', function() {
      const btn = new Button(100, 100, 100, 50, 'Test');
      
      const consumed = btn.update(50, 50, false);
      
      expect(consumed).to.be.false;
    });
  });
  
  describe('Setter Methods', function() {
    
    describe('setBackgroundColor()', function() {
      it('should update background color', function() {
        const btn = new Button(0, 0, 100, 50, 'Test');
        
        btn.setBackgroundColor('#FF0000');
        
        expect(btn.backgroundColor).to.equal('#FF0000');
      });
    });
    
    describe('setHoverColor()', function() {
      it('should update hover color', function() {
        const btn = new Button(0, 0, 100, 50, 'Test');
        
        btn.setHoverColor('#00FF00');
        
        expect(btn.hoverColor).to.equal('#00FF00');
      });
    });
    
    describe('setTextColor()', function() {
      it('should update text color', function() {
        const btn = new Button(0, 0, 100, 50, 'Test');
        
        btn.setTextColor('black');
        
        expect(btn.textColor).to.equal('black');
      });
    });
    
    describe('setCaption()', function() {
      it('should update caption text', function() {
        const btn = new Button(0, 0, 100, 50, 'Old Text');
        
        btn.setCaption('New Text');
        
        expect(btn.caption).to.equal('New Text');
      });
    });
    
    describe('setText()', function() {
      it('should update caption text (alias)', function() {
        const btn = new Button(0, 0, 100, 50, 'Old Text');
        
        btn.setText('New Text');
        
        expect(btn.caption).to.equal('New Text');
      });
    });
    
    describe('setPosition()', function() {
      it('should update button position', function() {
        const btn = new Button(0, 0, 100, 50, 'Test');
        
        btn.setPosition(200, 300);
        
        expect(btn.x).to.equal(200);
        expect(btn.y).to.equal(300);
      });
    });
    
    describe('setSize()', function() {
      it('should update button size', function() {
        const btn = new Button(0, 0, 100, 50, 'Test');
        
        btn.setSize(150, 75);
        
        expect(btn.width).to.equal(150);
        expect(btn.height).to.equal(75);
      });
    });
    
    describe('setEnabled()', function() {
      it('should enable button', function() {
        const btn = new Button(0, 0, 100, 50, 'Test', { enabled: false });
        
        btn.setEnabled(true);
        
        expect(btn.enabled).to.be.true;
      });
      
      it('should disable button', function() {
        const btn = new Button(0, 0, 100, 50, 'Test');
        
        btn.setEnabled(false);
        
        expect(btn.enabled).to.be.false;
      });
      
      it('should clear hover/press state when disabled', function() {
        const btn = new Button(100, 100, 100, 50, 'Test');
        
        btn.update(150, 125, true); // Hover and press
        expect(btn.isHovered).to.be.true;
        expect(btn.isPressed).to.be.true;
        
        btn.setEnabled(false);
        
        expect(btn.isHovered).to.be.false;
        expect(btn.isPressed).to.be.false;
      });
    });
    
    describe('setOnClick()', function() {
      it('should set click handler', function() {
        const btn = new Button(0, 0, 100, 50, 'Test');
        const handler = () => console.log('new handler');
        
        btn.setOnClick(handler);
        
        expect(btn.onClick).to.equal(handler);
      });
    });
  });
  
  describe('wasClickedThisFrame()', function() {
    
    it('should return true if clicked this frame', function() {
      const btn = new Button(100, 100, 100, 50, 'Test');
      
      btn.update(150, 125, true);
      btn.update(150, 125, false);
      
      expect(btn.wasClickedThisFrame()).to.be.true;
    });
    
    it('should return false if not clicked', function() {
      const btn = new Button(100, 100, 100, 50, 'Test');
      
      expect(btn.wasClickedThisFrame()).to.be.false;
    });
    
    it('should reset flag after check', function() {
      const btn = new Button(100, 100, 100, 50, 'Test');
      
      btn.update(150, 125, true);
      btn.update(150, 125, false);
      
      expect(btn.wasClickedThisFrame()).to.be.true;
      expect(btn.wasClickedThisFrame()).to.be.false; // Second call returns false
    });
  });
  
  describe('getBounds()', function() {
    
    it('should return bounds object', function() {
      const btn = new Button(10, 20, 100, 50, 'Test');
      
      const bounds = btn.getBounds();
      
      expect(bounds).to.deep.equal({
        x: 10,
        y: 20,
        width: 100,
        height: 50
      });
    });
  });
  
  describe('getDebugInfo()', function() {
    
    it('should return debug information', function() {
      const btn = new Button(10, 20, 100, 50, 'Test');
      
      const info = btn.getDebugInfo();
      
      expect(info.position).to.deep.equal({ x: 10, y: 20 });
      expect(info.size).to.deep.equal({ width: 100, height: 50 });
      expect(info.caption).to.equal('Test');
      expect(info.enabled).to.be.true;
      expect(info.colors).to.exist;
    });
  });
  
  describe('Text Wrapping', function() {
    
    describe('wrapTextToFit()', function() {
      
      it('should wrap text to fit width', function() {
        const btn = new Button(0, 0, 100, 50, 'Test');
        
        const wrapped = btn.wrapTextToFit('This is a long text', 50, 12);
        
        expect(wrapped).to.be.a('string');
        expect(wrapped).to.include('\n'); // Should have line breaks
      });
      
      it('should not wrap short text', function() {
        const btn = new Button(0, 0, 100, 50, 'Test');
        
        const wrapped = btn.wrapTextToFit('Short', 200, 12);
        
        expect(wrapped).to.equal('Short');
        expect(wrapped).to.not.include('\n');
      });
    });
    
    describe('calculateWrappedTextHeight()', function() {
      
      it('should calculate height for wrapped text', function() {
        const btn = new Button(0, 0, 100, 50, 'Test');
        
        const height = btn.calculateWrappedTextHeight('Short text', 100, 16);
        
        expect(height).to.be.a('number');
        expect(height).to.be.greaterThan(0);
      });
    });
  });
  
  describe('darkenColor()', function() {
    
    it('should darken hex color', function() {
      const btn = new Button(0, 0, 100, 50, 'Test');
      
      const darkened = btn.darkenColor('#FFFFFF', 0.5);
      
      expect(darkened).to.be.a('string');
      expect(darkened).to.match(/^#[0-9a-f]{6}$/);
    });
    
    it('should return original if not hex', function() {
      const btn = new Button(0, 0, 100, 50, 'Test');
      
      const result = btn.darkenColor('rgb(255, 0, 0)', 0.5);
      
      expect(result).to.equal('rgb(255, 0, 0)');
    });
  });
});

describe('ButtonStyles', function() {
  
  it('should define TOOLBAR style', function() {
    expect(ButtonStyles.TOOLBAR).to.exist;
    expect(ButtonStyles.TOOLBAR.backgroundColor).to.exist;
  });
  
  it('should define MAIN_MENU style', function() {
    expect(ButtonStyles.MAIN_MENU).to.exist;
  });
  
  it('should define DEFAULT style', function() {
    expect(ButtonStyles.DEFAULT).to.exist;
  });
  
  it('should define SUCCESS style', function() {
    expect(ButtonStyles.SUCCESS).to.exist;
  });
});

describe('createMenuButton()', function() {
  
  it('should create button with default style', function() {
    const btn = createMenuButton(0, 0, 100, 50, 'Test');
    
    expect(btn).to.be.instanceOf(Button);
    expect(btn.caption).to.equal('Test');
  });
  
  it('should apply style by name', function() {
    const btn = createMenuButton(0, 0, 100, 50, 'Test', 'success');
    
    expect(btn.backgroundColor).to.equal(ButtonStyles.SUCCESS.backgroundColor);
  });
  
  it('should set click handler', function() {
    const handler = () => console.log('clicked');
    const btn = createMenuButton(0, 0, 100, 50, 'Test', 'default', handler);
    
    expect(btn.onClick).to.equal(handler);
  });
  
  it('should create action method for backwards compatibility', function() {
    const btn = createMenuButton(0, 0, 100, 50, 'Test');
    
    expect(btn.action).to.be.a('function');
  });
});
