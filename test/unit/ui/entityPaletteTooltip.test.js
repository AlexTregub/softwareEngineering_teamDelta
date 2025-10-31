/**
 * Unit Tests: EntityPalette Tooltip System
 * 
 * Tests tooltip functionality for showing entity details on hover:
 * - Tooltip state management (show/hide)
 * - Tooltip content generation
 * - Hover detection on list items
 * - Tooltip positioning (near cursor, avoid screen edges)
 * - Multi-line content for complex entities
 */

const { expect } = require('chai');
const sinon = require('sinon');

describe('EntityPalette Tooltip System', function() {
  let sandbox;
  let mockP5;

  beforeEach(function() {
    sandbox = sinon.createSandbox();
    
    // Mock p5.js functions
    mockP5 = {
      push: sandbox.stub(),
      pop: sandbox.stub(),
      fill: sandbox.stub(),
      noStroke: sandbox.stub(),
      stroke: sandbox.stub(),
      rect: sandbox.stub(),
      text: sandbox.stub(),
      textSize: sandbox.stub(),
      textAlign: sandbox.stub(),
      textWidth: sandbox.stub().returns(150),
      image: sandbox.stub(),
      createVector: sandbox.stub().callsFake((x, y) => ({ x, y })),
      loadImage: sandbox.stub().returns({}),
      color: sandbox.stub().callsFake((r, g, b, a) => ({ r, g, b, a })),
      strokeWeight: sandbox.stub(),
      LEFT: 'left',
      CENTER: 'center',
      RIGHT: 'right',
      TOP: 'top',
      CORNER: 'corner',
      width: 1920,
      height: 1080
    };

    // Assign to global
    Object.keys(mockP5).forEach(key => {
      global[key] = mockP5[key];
    });

    // Mock localStorage
    global.localStorage = {
      getItem: sandbox.stub().returns(null),
      setItem: sandbox.stub(),
      removeItem: sandbox.stub()
    };

    // Mock window for JSDOM
    if (typeof window !== 'undefined') {
      Object.assign(window, mockP5);
      window.localStorage = global.localStorage;
    }

    // Mock CategoryRadioButtons
    global.CategoryRadioButtons = class {
      constructor(callback) {
        this.callback = callback;
        this.height = 30;
        this.selected = 'entities';
      }
      render() {}
      handleClick() { return null; }
    };
    
    if (typeof window !== 'undefined') {
      window.CategoryRadioButtons = global.CategoryRadioButtons;
    }

    // Mock ModalDialog
    global.ModalDialog = class {
      constructor() {
        this.visible = false;
      }
      show() {}
      hide() {}
      render() {}
      handleClick() {}
      handleKeyPress() {}
      isVisible() { return this.visible; }
    };
    
    if (typeof window !== 'undefined') {
      window.ModalDialog = global.ModalDialog;
    }

    // Mock ToastNotification
    global.ToastNotification = class {
      constructor() {
        this.toasts = [];
      }
      show() {}
      update() {}
      render() {}
      handleClick() {}
    };
    
    if (typeof window !== 'undefined') {
      window.ToastNotification = global.ToastNotification;
    }
  });

  afterEach(function() {
    sandbox.restore();
    delete global.localStorage;
    delete global.CategoryRadioButtons;
    delete global.ModalDialog;
    delete global.ToastNotification;
    if (typeof window !== 'undefined') {
      delete window.localStorage;
      delete window.CategoryRadioButtons;
      delete window.ModalDialog;
      delete window.ToastNotification;
    }
  });

  describe('Tooltip State Management', function() {
    it('should initialize with no tooltip visible', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      expect(palette._tooltipVisible).to.be.false;
      expect(palette._tooltipContent).to.be.null;
    });

    it('should have showTooltip method', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      expect(palette.showTooltip).to.be.a('function');
    });

    it('should show tooltip with content and position', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      palette.showTooltip('Test content', 100, 200);
      
      expect(palette._tooltipVisible).to.be.true;
      expect(palette._tooltipContent).to.equal('Test content');
      // Tooltip is offset from cursor (mouseX + 15, mouseY + 15)
      expect(palette._tooltipX).to.equal(115);
      expect(palette._tooltipY).to.equal(215);
    });

    it('should have hideTooltip method', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      expect(palette.hideTooltip).to.be.a('function');
    });

    it('should hide tooltip and clear content', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      palette.showTooltip('Test', 100, 200);
      palette.hideTooltip();
      
      expect(palette._tooltipVisible).to.be.false;
      expect(palette._tooltipContent).to.be.null;
    });

    it('should update tooltip position when shown again', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      palette.showTooltip('Test', 100, 200);
      palette.showTooltip('Updated', 300, 400);
      
      // Tooltip is offset from cursor (mouseX + 15, mouseY + 15)
      expect(palette._tooltipX).to.equal(315);
      expect(palette._tooltipY).to.equal(415);
    });
  });

  describe('Tooltip Content Generation', function() {
    it('should have getTooltipContent method', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      expect(palette.getTooltipContent).to.be.a('function');
    });

    it('should generate tooltip for entity template', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      const template = {
        id: 'ant_worker',
        name: 'Worker Ant',
        type: 'Ant',
        properties: {
          faction: 'player',
          health: 100,
          movementSpeed: 30
        }
      };
      
      const content = palette.getTooltipContent(template);
      
      expect(content).to.be.a('string');
      expect(content).to.include('Worker Ant');
      expect(content).to.include('Ant');
    });

    it('should include properties in tooltip content', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      const template = {
        id: 'ant_soldier',
        name: 'Soldier Ant',
        type: 'Ant',
        properties: {
          faction: 'player',
          health: 150,
          movementSpeed: 35
        }
      };
      
      const content = palette.getTooltipContent(template);
      
      expect(content).to.include('Health: 150');
      expect(content).to.include('Movement Speed: 35');
    });

    it('should handle building templates', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      const template = {
        id: 'building_hill',
        name: 'Ant Hill',
        type: 'Building',
        properties: {
          buildingType: 'colony',
          capacity: 50
        }
      };
      
      const content = palette.getTooltipContent(template);
      
      expect(content).to.include('Ant Hill');
      expect(content).to.include('Building');
      expect(content).to.include('Capacity: 50');
    });

    it('should handle custom entities', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      const customEntity = {
        id: 'custom_123',
        customName: 'Elite Warrior',
        baseTemplateId: 'ant_soldier',
        isGroup: false,
        properties: {
          faction: 'player',
          health: 200,
          movementSpeed: 40
        }
      };
      
      const content = palette.getTooltipContent(customEntity);
      
      expect(content).to.include('Elite Warrior');
      expect(content).to.include('Custom');
    });

    it('should handle entity groups', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      const group = {
        id: 'custom_group_456',
        customName: 'Strike Squad',
        isGroup: true,
        entities: [
          { baseTemplateId: 'ant_soldier', position: { x: 0, y: 0 } },
          { baseTemplateId: 'ant_soldier', position: { x: 1, y: 0 } },
          { baseTemplateId: 'ant_worker', position: { x: 0, y: 1 } }
        ]
      };
      
      const content = palette.getTooltipContent(group);
      
      expect(content).to.include('Strike Squad');
      expect(content).to.include('Group');
      expect(content).to.include('3'); // Number of entities
    });

    it('should handle null template gracefully', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      const content = palette.getTooltipContent(null);
      
      expect(content).to.be.a('string');
      expect(content.length).to.be.greaterThan(0);
    });
  });

  describe('Hover Detection', function() {
    it('should have handleMouseMove method', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      expect(palette.handleMouseMove).to.be.a('function');
    });

    it('should detect hover over list item', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      const templates = palette.getCurrentTemplates();
      
      // Mouse over first item (panelX=10, panelY=40, itemHeight=80, padding=8)
      // First item Y range: 40 to 40+80 = 40 to 120
      const hoveredTemplate = palette.handleMouseMove(100, 70, 10, 10, 200);
      
      expect(hoveredTemplate).to.exist;
      expect(hoveredTemplate.id).to.equal(templates[0].id);
    });

    it('should return null when not hovering over any item', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      // Mouse outside panel bounds
      const hoveredTemplate = palette.handleMouseMove(500, 500, 10, 10, 200);
      
      expect(hoveredTemplate).to.be.null;
    });

    it('should detect hover over second item', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      const templates = palette.getCurrentTemplates();
      
      // Second item Y range: 40 + (80+8)*1 = 128 to 208
      const hoveredTemplate = palette.handleMouseMove(100, 150, 10, 10, 200);
      
      if (templates.length > 1) {
        expect(hoveredTemplate).to.exist;
        expect(hoveredTemplate.id).to.equal(templates[1].id);
      }
    });

    it('should update tooltip when hovering different items', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      const templates = palette.getCurrentTemplates();
      
      // Hover first item
      palette.handleMouseMove(100, 70, 10, 10, 200);
      const firstContent = palette._tooltipContent;
      
      // Hover second item
      if (templates.length > 1) {
        palette.handleMouseMove(100, 150, 10, 10, 200);
        const secondContent = palette._tooltipContent;
        
        expect(firstContent).to.not.equal(secondContent);
      }
    });

    it('should hide tooltip when mouse leaves panel', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      // Hover over item
      palette.handleMouseMove(100, 70, 10, 10, 200);
      expect(palette._tooltipVisible).to.be.true;
      
      // Move outside panel
      palette.handleMouseMove(500, 500, 10, 10, 200);
      expect(palette._tooltipVisible).to.be.false;
    });
  });

  describe('Tooltip Positioning', function() {
    it('should position tooltip near cursor', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      palette.showTooltip('Test', 300, 400);
      
      // Tooltip should be offset from cursor (not directly at cursor)
      expect(palette._tooltipX).to.be.greaterThan(300);
      expect(palette._tooltipY).to.be.greaterThan(400);
    });

    it('should avoid right screen edge', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      // Cursor near right edge
      palette.showTooltip('Test content with long text', 1850, 100);
      
      // Tooltip should not exceed screen width (1920)
      const tooltipWidth = 200; // Estimated
      expect(palette._tooltipX + tooltipWidth).to.be.at.most(global.width);
    });

    it('should avoid bottom screen edge', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      // Cursor near bottom edge
      palette.showTooltip('Test\nMulti-line\nContent', 100, 1050);
      
      // Tooltip should not exceed screen height (1080)
      const tooltipHeight = 100; // Estimated
      expect(palette._tooltipY + tooltipHeight).to.be.at.most(global.height);
    });

    it('should calculate tooltip dimensions based on content', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      const shortContent = 'Short';
      const longContent = 'This is a much longer tooltip content that should result in a wider tooltip';
      
      palette.showTooltip(shortContent, 100, 100);
      const shortWidth = palette._tooltipWidth;
      
      palette.showTooltip(longContent, 100, 100);
      const longWidth = palette._tooltipWidth;
      
      expect(longWidth).to.be.greaterThan(shortWidth);
    });
  });

  describe('Tooltip Rendering', function() {
    it('should render tooltip when visible', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      palette.showTooltip('Test tooltip', 100, 200);
      palette.render(10, 10, 200, 400);
      
      // Should call text() to render tooltip content
      const textCalls = mockP5.text.getCalls();
      const tooltipTextCall = textCalls.find(call => 
        call.args[0] && call.args[0].includes('Test tooltip')
      );
      
      expect(tooltipTextCall).to.exist;
    });

    it('should not render tooltip when hidden', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      palette.showTooltip('Test', 100, 200);
      palette.hideTooltip();
      
      mockP5.text.resetHistory();
      palette.render(10, 10, 200, 400);
      
      // Should not call text() for tooltip
      const textCalls = mockP5.text.getCalls();
      const tooltipTextCall = textCalls.find(call => 
        call.args[0] && call.args[0].includes('Test')
      );
      
      expect(tooltipTextCall).to.be.undefined;
    });

    it('should render tooltip background', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      palette.showTooltip('Test', 100, 200);
      
      mockP5.rect.resetHistory();
      palette.render(10, 10, 200, 400);
      
      // Should call rect() for tooltip background
      expect(mockP5.rect.called).to.be.true;
    });

    it('should render multi-line tooltip content', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      const multiLineContent = 'Line 1\nLine 2\nLine 3';
      palette.showTooltip(multiLineContent, 100, 200);
      palette.render(10, 10, 200, 400);
      
      // Should call text() multiple times for multi-line content
      const textCalls = mockP5.text.getCalls();
      const tooltipCalls = textCalls.filter(call => 
        call.args[0] && (call.args[0].includes('Line 1') || 
                         call.args[0].includes('Line 2') || 
                         call.args[0].includes('Line 3'))
      );
      
      expect(tooltipCalls.length).to.be.greaterThan(0);
    });
  });

  describe('Edge Cases', function() {
    it('should handle empty content', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      palette.showTooltip('', 100, 200);
      
      // Should still set visible flag
      expect(palette._tooltipVisible).to.be.true;
    });

    it('should handle very long content', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      const longContent = 'A'.repeat(500);
      palette.showTooltip(longContent, 100, 200);
      
      expect(palette._tooltipContent).to.equal(longContent);
    });

    it('should handle template without properties', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      const template = {
        id: 'test',
        name: 'Test Entity',
        type: 'Entity'
      };
      
      const content = palette.getTooltipContent(template);
      
      expect(content).to.be.a('string');
      expect(content.length).to.be.greaterThan(0);
    });

    it('should handle rapid hover changes', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      const templates = palette.getCurrentTemplates();
      
      // Rapid hover over multiple items
      for (let i = 0; i < 10; i++) {
        const y = 70 + (i * 88); // Item height + padding
        palette.handleMouseMove(100, y, 10, 10, 200);
      }
      
      // Should end with valid state
      expect(palette._tooltipVisible).to.be.a('boolean');
    });
  });
});
