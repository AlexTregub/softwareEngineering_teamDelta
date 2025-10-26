/**
 * BASELINE TESTS - All Draggable Panels
 * 
 * Purpose: Capture current panel behavior BEFORE implementing auto-sizing feature
 * NOT part of main test suite - run separately to detect regressions
 * 
 * Run with: npx mocha "test/baseline/panels/all_panels.baseline.test.js" --timeout 10000
 */

const { expect } = require('chai');
const sinon = require('sinon');

describe('BASELINE: All Draggable Panels', () => {
  let DraggablePanel;
  let DraggablePanelManager;
  let Button;
  let ButtonStyles;
  let manager;
  
  before(() => {
    // Mock p5.js functions
    global.push = sinon.stub();
    global.pop = sinon.stub();
    global.fill = sinon.stub();
    global.stroke = sinon.stub();
    global.strokeWeight = sinon.stub();
    global.noStroke = sinon.stub();
    global.rect = sinon.stub();
    global.textSize = sinon.stub();
    global.textAlign = sinon.stub();
    global.text = sinon.stub();
    global.textWidth = sinon.stub().returns(50);
    global.image = sinon.stub();
    global.LEFT = 'left';
    global.CENTER = 'center';
    global.TOP = 'top';
    global.BASELINE = 'alphabetic';

    // Mock devConsoleEnabled
    global.devConsoleEnabled = false;

    // Mock window
    global.window = {
      innerWidth: 1920,
      innerHeight: 1080
    };

    // Mock localStorage
    global.localStorage = {
      getItem: sinon.stub().returns(null),
      setItem: sinon.stub()
    };

    // Mock Button class
    Button = class {
      constructor(x, y, width, height, caption, style) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.caption = caption;
        this.style = style || {};
      }
      setPosition(x, y) {
        this.x = x;
        this.y = y;
      }
      update() { return false; }
      render() {}
      autoResize() {}
      autoResizeForText() { return false; }
    };
    global.Button = Button;

    // Mock ButtonStyles
    ButtonStyles = {
      DEFAULT: { backgroundColor: '#cccccc', color: '#000000' },
      SUCCESS: { backgroundColor: '#28a745', color: '#ffffff' },
      DANGER: { backgroundColor: '#dc3545', color: '#ffffff' },
      WARNING: { backgroundColor: '#ffc107', color: '#000000' },
      INFO: { backgroundColor: '#17a2b8', color: '#ffffff' },
      PURPLE: { backgroundColor: '#6f42c1', color: '#ffffff' }
    };
    global.ButtonStyles = ButtonStyles;

    // Load classes (DraggablePanel must be loaded first and set globally)
    DraggablePanel = require('../../../Classes/systems/ui/DraggablePanel.js');
    global.DraggablePanel = DraggablePanel; // Make available globally for DraggablePanelManager
    DraggablePanelManager = require('../../../Classes/systems/ui/DraggablePanelManager.js');
  });

  beforeEach(() => {
    // Create fresh manager instance
    manager = new DraggablePanelManager();
    manager.createDefaultPanels();
  });

  afterEach(() => {
    if (manager) {
      manager.panels.clear();
    }
  });

  describe('ant_spawn Panel', () => {
    let panel;

    beforeEach(() => {
      panel = manager.panels.get('ant_spawn');
    });

    it('should exist and be configured', () => {
      expect(panel).to.exist;
      expect(panel.config.id).to.equal('ant-Spawn-panel');
      expect(panel.config.title).to.equal('Ant Spawning');
    });

    it('should have correct initial dimensions', () => {
      expect(panel.config.size.width).to.equal(140);
      expect(panel.config.size.height).to.equal(259.8); // Actual current height
    });

    it('should have correct position', () => {
      expect(panel.state.position.x).to.equal(20);
      expect(panel.state.position.y).to.equal(80);
    });

    it('should have vertical layout', () => {
      expect(panel.config.buttons.layout).to.equal('vertical');
    });

    it('should have 8 buttons', () => {
      expect(panel.buttons.length).to.equal(8);
    });

    it('should have correct button spacing', () => {
      expect(panel.config.buttons.spacing).to.equal(3);
    });

    it('should have correct button dimensions', () => {
      expect(panel.config.buttons.buttonWidth).to.equal(120);
      expect(panel.config.buttons.buttonHeight).to.equal(24);
    });

    it('should maintain stable height over updates', () => {
      const initialHeight = panel.config.size.height;
      for (let i = 0; i < 10; i++) {
        panel.update();
      }
      expect(panel.config.size.height).to.equal(initialHeight);
    });
  });

  describe('resources Panel', () => {
    let panel;

    beforeEach(() => {
      panel = manager.panels.get('resources');
    });

    it('should exist and be configured', () => {
      expect(panel).to.exist;
      expect(panel.config.id).to.equal('resources-spawn-panel');
      expect(panel.config.title).to.equal('Resource Spawner');
    });

    it('should have correct initial dimensions', () => {
      expect(panel.config.size.width).to.equal(180);
      expect(panel.config.size.height).to.equal(66.8); // Actual current height
    });

    it('should have correct position', () => {
      expect(panel.state.position.x).to.equal(180);
      expect(panel.state.position.y).to.equal(80);
    });

    it('should have horizontal layout', () => {
      expect(panel.config.buttons.layout).to.equal('horizontal');
    });

    it('should have 1 button', () => {
      expect(panel.buttons.length).to.equal(1);
    });

    it('should maintain stable dimensions over updates', () => {
      const initialWidth = panel.config.size.width;
      const initialHeight = panel.config.size.height;
      for (let i = 0; i < 10; i++) {
        panel.update();
      }
      expect(panel.config.size.width).to.equal(initialWidth);
      expect(panel.config.size.height).to.equal(initialHeight);
    });
  });

  describe('stats Panel', () => {
    let panel;

    beforeEach(() => {
      panel = manager.panels.get('stats');
    });

    it('should exist and be configured', () => {
      expect(panel).to.exist;
      expect(panel.config.id).to.equal('stats-panel');
      expect(panel.config.title).to.equal('Game Statistics');
    });

    it('should have correct initial dimensions', () => {
      expect(panel.config.size.width).to.equal(200);
      expect(panel.config.size.height).to.be.closeTo(71.8, 0.5); // Actual runtime height (auto-resized)
    });

    it('should have correct position', () => {
      expect(panel.state.position.x).to.equal(380);
      expect(panel.state.position.y).to.equal(80);
    });

    it('should have horizontal layout', () => { // Actual layout
      expect(panel.config.buttons.layout).to.equal('horizontal');
    });

    it('should have correct number of buttons', () => {
      expect(panel.buttons.length).to.be.greaterThan(0);
    });
  });

  describe('health_controls Panel', () => {
    let panel;

    beforeEach(() => {
      panel = manager.panels.get('health_controls');
    });

    it('should exist and be configured', () => {
      expect(panel).to.exist;
      expect(panel.config.id).to.equal('health-controls-panel'); // Actual ID
      expect(panel.config.title).to.equal('Health Debug'); // Actual current title
    });

    it('should have correct initial dimensions', () => {
      expect(panel.config.size.width).to.equal(130); // Actual current width
      expect(panel.config.size.height).to.be.closeTo(321.8, 0.5); // Actual runtime height (auto-resized)
    });

    it('should have vertical layout', () => { // Actual current layout
      expect(panel.config.buttons.layout).to.equal('vertical');
    });

    it('should have correct number of buttons', () => {
      expect(panel.buttons.length).to.be.greaterThan(0);
    });
  });

  describe('debug Panel', () => {
    let panel;

    beforeEach(() => {
      panel = manager.panels.get('debug');
    });

    it('should exist and be configured', () => {
      expect(panel).to.exist;
      expect(panel.config.id).to.equal('debug-panel');
      expect(panel.config.title).to.equal('Debug Controls');
    });

    it('should have correct initial dimensions', () => {
      expect(panel.config.size.width).to.equal(160); // Actual current width
      expect(panel.config.size.height).to.be.closeTo(155.8, 0.5); // Actual runtime height (auto-resized)
    });

    it('should have vertical layout', () => { // Actual current layout
      expect(panel.config.buttons.layout).to.equal('vertical');
    });

    it('should have correct number of buttons', () => {
      expect(panel.buttons.length).to.be.greaterThan(0);
    });
  });

  describe('tasks Panel', () => {
    let panel;

    beforeEach(() => {
      panel = manager.panels.get('tasks');
    });

    it('should exist and be configured', () => {
      expect(panel).to.exist;
      expect(panel.config.id).to.equal('task-panel'); // Actual current ID
      expect(panel.config.title).to.equal('Task objectives'); // Actual current title
    });

    it('should have correct initial dimensions', () => {
      expect(panel.config.size.width).to.equal(160); // Actual current width
      expect(panel.config.size.height).to.be.closeTo(155.8, 0.5); // Actual runtime height (auto-resized)
    });

    it('should have vertical layout', () => { // Actual current layout
      expect(panel.config.buttons.layout).to.equal('vertical');
    });

    it('should have correct number of buttons', () => {
      expect(panel.buttons.length).to.be.greaterThan(0);
    });
  });

  describe('buildings Panel', () => {
    let panel;

    beforeEach(() => {
      panel = manager.panels.get('buildings');
    });

    it('should exist and be configured', () => {
      expect(panel).to.exist;
      expect(panel.config.id).to.equal('buildings-panel'); // Actual ID
      expect(panel.config.title).to.equal('Building Manager 🏗️'); // Actual current title
    });

    it('should have correct initial dimensions', () => {
      expect(panel.config.size.width).to.equal(200); // Actual current width
      expect(panel.config.size.height).to.be.closeTo(201.8, 0.5); // Actual runtime height (auto-resized)
    });

    it('should have vertical layout', () => {
      expect(panel.config.buttons.layout).to.equal('vertical');
    });

    it('should have correct number of buttons', () => {
      expect(panel.buttons.length).to.be.greaterThan(0);
    });
  });

  describe('cheats Panel', () => {
    let panel;

    beforeEach(() => {
      panel = manager.panels.get('cheats');
    });

    it('should exist and be configured', () => {
      expect(panel).to.exist;
      expect(panel.config.id).to.equal('cheats-panel'); // Actual ID
      expect(panel.config.title).to.equal('👑 Power Cheats'); // Actual current title
    });

    it('should have correct initial dimensions', () => {
      expect(panel.config.size.width).to.equal(180); // Actual current width
      expect(panel.config.size.height).to.be.closeTo(258.8, 0.5); // Actual runtime height (auto-resized)
    });

    it('should have vertical layout', () => { // Actual current layout
      expect(panel.config.buttons.layout).to.equal('vertical');
    });

    it('should have correct number of buttons', () => {
      expect(panel.buttons.length).to.be.greaterThan(0);
    });
  });

  describe('Panel Stability', () => {
    it('should not grow over 100 update cycles (all panels)', () => {
      const initialSizes = new Map();
      
      manager.panels.forEach((panel, id) => {
        initialSizes.set(id, {
          width: panel.config.size.width,
          height: panel.config.size.height
        });
      });

      // Simulate 100 update cycles
      for (let i = 0; i < 100; i++) {
        manager.panels.forEach(panel => panel.update());
      }

      // Verify no growth
      manager.panels.forEach((panel, id) => {
        const initial = initialSizes.get(id);
        expect(panel.config.size.width).to.equal(initial.width, `${id} width changed`);
        expect(panel.config.size.height).to.equal(initial.height, `${id} height changed`);
      });
    });

    it('should maintain button counts (all panels)', () => {
      const initialCounts = new Map();
      
      manager.panels.forEach((panel, id) => {
        initialCounts.set(id, panel.buttons.length);
      });

      // Update all panels
      for (let i = 0; i < 10; i++) {
        manager.panels.forEach(panel => panel.update());
      }

      // Verify button counts unchanged
      manager.panels.forEach((panel, id) => {
        expect(panel.buttons.length).to.equal(initialCounts.get(id), `${id} button count changed`);
      });
    });
  });

  describe('Panel Manager', () => {
    it('should have all 8 default panels', () => {
      expect(manager.panels.size).to.be.at.least(8);
      expect(manager.panels.has('ant_spawn')).to.be.true;
      expect(manager.panels.has('resources')).to.be.true;
      expect(manager.panels.has('stats')).to.be.true;
      expect(manager.panels.has('health_controls')).to.be.true;
      expect(manager.panels.has('debug')).to.be.true;
      expect(manager.panels.has('tasks')).to.be.true;
      expect(manager.panels.has('buildings')).to.be.true;
      expect(manager.panels.has('cheats')).to.be.true;
    });

    it('should allow panels to be dragged', () => {
      manager.panels.forEach(panel => {
        expect(panel.config.behavior.draggable).to.not.be.false;
      });
    });

    it('should allow panels to be minimized', () => {
      manager.panels.forEach(panel => {
        // Should have minimize functionality (actual method name is toggleMinimized)
        expect(typeof panel.toggleMinimized).to.equal('function');
      });
    });
  });
});
