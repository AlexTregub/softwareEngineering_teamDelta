/**
 * Integration tests for AntSelectionBar
 */

const { expect } = require('chai');
const { JSDOM } = require('jsdom');

describe('AntSelectionBar Integration Tests', function() {
  let dom, window, document, p5Mock, AntSelectionBar, bar;

  beforeEach(function() {
    // Load the class FIRST (before JSDOM creates window)
    delete require.cache[require.resolve('../../../Classes/ui_new/components/AntSelectionBar.js')];
    AntSelectionBar = require('../../../Classes/ui_new/components/AntSelectionBar.js');
    
    // Create JSDOM environment
    dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    window = dom.window;
    document = window.document;
    global.window = window;
    global.document = document;

    // Mock UICoordinateConverter
    global.UICoordinateConverter = class {
      constructor() {}
      normalizedToScreen(x, y) {
        return { x: 400, y: 500 };
      }
    };

    // Mock p5 instance
    p5Mock = {
      loadImage: function(path, success, error) {
        // Simulate async image load
        setTimeout(() => {
          if (success) {
            success({ width: 32, height: 32, loaded: true });
          }
        }, 0);
      },
      mouseX: 0,
      mouseY: 0,
      push: () => {},
      pop: () => {},
      fill: () => {},
      stroke: () => {},
      strokeWeight: () => {},
      noStroke: () => {},
      rect: () => {},
      ellipse: () => {},
      image: () => {},
      imageMode: () => {},
      noSmooth: () => {},
      textAlign: () => {},
      textSize: () => {},
      textStyle: () => {},
      text: () => {},
      CENTER: 'center',
      LEFT: 'left',
      BOTTOM: 'bottom',
      BOLD: 'bold',
      NORMAL: 'normal'
    };
  });

  afterEach(function() {
    delete global.window;
    delete global.document;
    delete global.UICoordinateConverter;
  });

  describe('Button Creation', function() {
    it('should create 6 buttons with correct job types', function() {
      bar = new AntSelectionBar(p5Mock, {});
      
      expect(bar.buttons).to.have.lengthOf(6);
      
      const expectedJobTypes = ['queen', 'builder', 'scout', 'farmer', 'warrior', 'spitter'];
      bar.buttons.forEach((btn, i) => {
        expect(btn.jobType).to.equal(expectedJobTypes[i], `Button ${i} should have jobType ${expectedJobTypes[i]}`);
      });
    });

    it('should create buttons with correct job names', function() {
      bar = new AntSelectionBar(p5Mock, {});
      
      const expectedJobNames = ['Queen', 'Builder', 'Scout', 'Farmer', 'Warrior', 'Spitter'];
      bar.buttons.forEach((btn, i) => {
        expect(btn.jobName).to.equal(expectedJobNames[i], `Button ${i} should have jobName ${expectedJobNames[i]}`);
      });
    });

    it('should create buttons with correct keybinds', function() {
      bar = new AntSelectionBar(p5Mock, {});
      
      const expectedKeybinds = ['Q', 'W', 'E', 'R', 'T', 'U'];
      bar.buttons.forEach((btn, i) => {
        expect(btn.keybind).to.equal(expectedKeybinds[i], `Button ${i} should have keybind ${expectedKeybinds[i]}`);
      });
    });

    it('should mark Queen button as isQueen', function() {
      bar = new AntSelectionBar(p5Mock, {});
      
      expect(bar.buttons[0].isQueen).to.be.true;
      bar.buttons.slice(1).forEach((btn, i) => {
        expect(btn.isQueen).to.be.false;
      });
    });

    it('should create Queen button larger than others', function() {
      bar = new AntSelectionBar(p5Mock, {});
      
      expect(bar.buttons[0].width).to.equal(100);
      expect(bar.buttons[0].height).to.equal(60);
      
      bar.buttons.slice(1).forEach((btn, i) => {
        expect(btn.width).to.equal(80, `Button ${i+1} width should be 80`);
        expect(btn.height).to.equal(50, `Button ${i+1} height should be 50`);
      });
    });

    it('should position buttons horizontally with proper spacing', function() {
      bar = new AntSelectionBar(p5Mock, {});
      
      // First button (Queen) should start at x + padding
      const expectedStartX = bar.x + bar.padding;
      expect(bar.buttons[0].x).to.equal(expectedStartX);
      
      // Each subsequent button should be positioned after previous button + spacing
      let expectedX = expectedStartX + bar.buttons[0].width + bar.buttonSpacing;
      for (let i = 1; i < bar.buttons.length; i++) {
        expect(bar.buttons[i].x).to.equal(expectedX, `Button ${i} x position`);
        expectedX += bar.buttons[i].width + bar.buttonSpacing;
      }
    });
  });

  describe('Job Types Configuration', function() {
    it('should have correct jobTypes array structure', function() {
      bar = new AntSelectionBar(p5Mock, {});
      
      expect(bar.jobTypes).to.be.an('array').with.lengthOf(6);
      
      const expected = [
        { name: 'Queen', value: 'queen', keybind: 'Q', isQueen: true },
        { name: 'Builder', value: 'builder', keybind: 'W' },
        { name: 'Scout', value: 'scout', keybind: 'E' },
        { name: 'Farmer', value: 'farmer', keybind: 'R' },
        { name: 'Warrior', value: 'warrior', keybind: 'T' },
        { name: 'Spitter', value: 'spitter', keybind: 'U' }
      ];
      
      expected.forEach((exp, i) => {
        expect(bar.jobTypes[i].name).to.equal(exp.name);
        expect(bar.jobTypes[i].value).to.equal(exp.value);
        expect(bar.jobTypes[i].keybind).to.equal(exp.keybind);
        if (exp.isQueen) {
          expect(bar.jobTypes[i].isQueen).to.be.true;
        }
      });
    });
  });

  describe('Button Click Detection', function() {
    beforeEach(function() {
      bar = new AntSelectionBar(p5Mock, {});
    });

    it('should detect click on first button (Queen)', function() {
      const button = bar.buttons[0];
      const centerX = button.x + button.width / 2;
      const centerY = button.y + button.height / 2;
      
      const isInside = bar._isPointInButton(centerX, centerY, button);
      expect(isInside).to.be.true;
    });

    it('should detect click on all buttons', function() {
      bar.buttons.forEach((button, i) => {
        const centerX = button.x + button.width / 2;
        const centerY = button.y + button.height / 2;
        
        const isInside = bar._isPointInButton(centerX, centerY, button);
        expect(isInside).to.be.true;
      });
    });

    it('should not detect click outside buttons', function() {
      const outsideX = bar.x - 10;
      const outsideY = bar.y - 10;
      
      bar.buttons.forEach((button, i) => {
        const isInside = bar._isPointInButton(outsideX, outsideY, button);
        expect(isInside).to.be.false;
      });
    });
  });

  describe('Sprite Loading', function() {
    it('should have sprite paths for all job types', function() {
      bar = new AntSelectionBar(p5Mock, {});
      
      const expectedPaths = {
        'Builder': 'Images/Ants/gray_ant_builder.png',
        'Scout': 'Images/Ants/gray_ant_scout.png',
        'Farmer': 'Images/Ants/gray_ant_farmer.png',
        'Warrior': 'Images/Ants/gray_ant_soldier.png',
        'Spitter': 'Images/Ants/gray_ant_spitter.png',
        'Queen': 'Images/Ants/gray_ant_queen.png'
      };
      
      Object.keys(expectedPaths).forEach(key => {
        expect(bar.spritePaths[key]).to.equal(expectedPaths[key]);
      });
    });

    it('should initialize empty sprites object', function() {
      bar = new AntSelectionBar(p5Mock, {});
      expect(bar.sprites).to.be.an('object');
    });
  });
});
