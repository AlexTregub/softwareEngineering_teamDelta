/**
 * Unit Tests - EntityPalette Search/Filter
 * Tests for search and filter functionality for custom entities
 */

const { expect } = require('chai');
const sinon = require('sinon');

describe('EntityPalette Search/Filter', function() {
  let sandbox;

  beforeEach(function() {
    sandbox = sinon.createSandbox();

    // Mock p5.js functions
    const mockP5 = {
      push: sandbox.stub(),
      pop: sandbox.stub(),
      fill: sandbox.stub(),
      noFill: sandbox.stub(),
      stroke: sandbox.stub(),
      noStroke: sandbox.stub(),
      strokeWeight: sandbox.stub(),
      rect: sandbox.stub(),
      ellipse: sandbox.stub(),
      arc: sandbox.stub(),
      text: sandbox.stub(),
      textAlign: sandbox.stub(),
      textSize: sandbox.stub(),
      line: sandbox.stub(),
      translate: sandbox.stub(),
      rotate: sandbox.stub(),
      image: sandbox.stub(),
      millis: sandbox.stub().returns(1000),
      HALF_PI: Math.PI / 2,
      TWO_PI: Math.PI * 2,
      CENTER: 'center',
      LEFT: 'left',
      RIGHT: 'right',
      TOP: 'top',
      BOTTOM: 'bottom',
      RADIUS: 'radius'
    };

    // Sync global and window
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
      show() { this.visible = true; }
      hide() { this.visible = false; }
      render() {}
      handleClick() {}
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
    
    // Clean up globals
    if (typeof window !== 'undefined') {
      delete window.localStorage;
      delete window.CategoryRadioButtons;
      delete window.ModalDialog;
      delete window.ToastNotification;
    }
  });

  describe('Search State Management', function() {
    it('should initialize with empty search query', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      expect(palette._searchQuery).to.equal('');
    });

    it('should have setSearchQuery method', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      expect(palette.setSearchQuery).to.be.a('function');
    });

    it('should update search query', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      palette.setSearchQuery('worker');
      
      expect(palette._searchQuery).to.equal('worker');
    });

    it('should trim search query', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      palette.setSearchQuery('  soldier  ');
      
      expect(palette._searchQuery).to.equal('soldier');
    });

    it('should convert search query to lowercase', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      palette.setSearchQuery('ELITE Soldier');
      
      expect(palette._searchQuery).to.equal('elite soldier');
    });

    it('should have clearSearch method', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      expect(palette.clearSearch).to.be.a('function');
    });

    it('should clear search query', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      palette.setSearchQuery('test');
      palette.clearSearch();
      
      expect(palette._searchQuery).to.equal('');
    });
  });

  describe('Search Filtering Logic', function() {
    it('should have filterTemplates method', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      expect(palette.filterTemplates).to.be.a('function');
    });

    it('should return all templates when search is empty', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      const templates = [
        { id: '1', customName: 'Worker Ant', baseTemplateId: 'ant_worker' },
        { id: '2', customName: 'Soldier Ant', baseTemplateId: 'ant_soldier' }
      ];
      
      const filtered = palette.filterTemplates(templates, '');
      
      expect(filtered).to.have.lengthOf(2);
    });

    it('should filter by custom name', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      const templates = [
        { id: '1', customName: 'Worker Ant', baseTemplateId: 'ant_worker' },
        { id: '2', customName: 'Soldier Ant', baseTemplateId: 'ant_soldier' },
        { id: '3', customName: 'Elite Worker', baseTemplateId: 'ant_worker' }
      ];
      
      const filtered = palette.filterTemplates(templates, 'worker');
      
      expect(filtered).to.have.lengthOf(2);
      expect(filtered[0].customName).to.include('Worker');
      expect(filtered[1].customName).to.include('Worker');
    });

    it('should filter by base template ID', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      const templates = [
        { id: '1', customName: 'Fast Worker', baseTemplateId: 'ant_worker' },
        { id: '2', customName: 'Strong Fighter', baseTemplateId: 'ant_soldier' },
        { id: '3', customName: 'Elite Worker', baseTemplateId: 'ant_worker' }
      ];
      
      const filtered = palette.filterTemplates(templates, 'soldier');
      
      expect(filtered).to.have.lengthOf(1);
      expect(filtered[0].baseTemplateId).to.equal('ant_soldier');
    });

    it('should be case-insensitive', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      const templates = [
        { id: '1', customName: 'Worker Ant', baseTemplateId: 'ant_worker' },
        { id: '2', customName: 'Soldier Ant', baseTemplateId: 'ant_soldier' }
      ];
      
      const filtered1 = palette.filterTemplates(templates, 'WORKER');
      const filtered2 = palette.filterTemplates(templates, 'worker');
      const filtered3 = palette.filterTemplates(templates, 'WoRkEr');
      
      expect(filtered1).to.have.lengthOf(1);
      expect(filtered2).to.have.lengthOf(1);
      expect(filtered3).to.have.lengthOf(1);
    });

    it('should return empty array when no matches', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      const templates = [
        { id: '1', customName: 'Worker Ant', baseTemplateId: 'ant_worker' },
        { id: '2', customName: 'Soldier Ant', baseTemplateId: 'ant_soldier' }
      ];
      
      const filtered = palette.filterTemplates(templates, 'queen');
      
      expect(filtered).to.have.lengthOf(0);
    });

    it('should handle partial matches', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      const templates = [
        { id: '1', customName: 'Worker Ant', baseTemplateId: 'ant_worker' },
        { id: '2', customName: 'Soldier Ant', baseTemplateId: 'ant_soldier' },
        { id: '3', customName: 'Elite Warrior', baseTemplateId: 'ant_soldier' }
      ];
      
      const filtered = palette.filterTemplates(templates, 'work');
      
      expect(filtered).to.have.lengthOf(1);
      expect(filtered[0].customName).to.equal('Worker Ant');
    });

    it('should filter entity groups', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      const templates = [
        { id: '1', customName: 'Defense Squad', isGroup: true, entities: [] },
        { id: '2', customName: 'Worker Group', isGroup: true, entities: [] },
        { id: '3', customName: 'Attack Formation', isGroup: true, entities: [] }
      ];
      
      const filtered = palette.filterTemplates(templates, 'squad');
      
      expect(filtered).to.have.lengthOf(1);
      expect(filtered[0].customName).to.equal('Defense Squad');
    });
  });

  describe('Search UI Integration', function() {
    it('should have renderSearchBox method', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      expect(palette.renderSearchBox).to.be.a('function');
    });

    it('should render search box in custom category', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      palette.setCategory('custom');
      palette.renderSearchBox(100, 100, 200);
      
      expect(global.rect.called).to.be.true;
    });

    it('should not render search box in other categories', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      global.rect.resetHistory();
      palette.setCategory('entities');
      palette.renderSearchBox(100, 100, 200);
      
      // Should not render (or render minimal elements)
      const rectCallCount = global.rect.callCount;
      expect(rectCallCount).to.be.lessThan(3); // Less than typical UI rendering
    });

    it('should display current search query', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      palette.setCategory('custom');
      palette.setSearchQuery('test query');
      palette.renderSearchBox(100, 100, 200);
      
      const textCalls = global.text.getCalls();
      const hasSearchQuery = textCalls.some(call => 
        call.args[0] && call.args[0].includes('test query')
      );
      
      expect(hasSearchQuery).to.be.true;
    });

    it('should display placeholder when empty', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      palette.setCategory('custom');
      palette.renderSearchBox(100, 100, 200);
      
      const textCalls = global.text.getCalls();
      const hasPlaceholder = textCalls.some(call => 
        call.args[0] && (
          call.args[0].toLowerCase().includes('search') ||
          call.args[0].toLowerCase().includes('filter')
        )
      );
      
      expect(hasPlaceholder).to.be.true;
    });

    it('should have handleSearchInput method', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      expect(palette.handleSearchInput).to.be.a('function');
    });

    it('should update search query on input', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      palette.handleSearchInput('new query');
      
      expect(palette._searchQuery).to.equal('new query');
    });
  });

  describe('Integration with getCurrentTemplates', function() {
    it('should filter custom templates when search active', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      // Add custom entities
      palette.addCustomEntity('Worker Ant', 'ant_worker', { faction: 'player' });
      palette.addCustomEntity('Soldier Ant', 'ant_soldier', { faction: 'player' });
      palette.addCustomEntity('Elite Worker', 'ant_worker', { faction: 'player' });
      
      palette.setCategory('custom');
      palette.setSearchQuery('soldier');
      
      const templates = palette.getCurrentTemplates();
      
      expect(templates).to.have.lengthOf(1);
      expect(templates[0].customName).to.equal('Soldier Ant');
    });

    it('should not filter non-custom categories', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      palette.setCategory('entities');
      palette.setSearchQuery('worker');
      
      const templates = palette.getCurrentTemplates();
      
      // Should return all entity templates (search doesn't apply)
      expect(templates.length).to.be.greaterThan(0);
    });

    it('should return all when search is empty', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      palette.addCustomEntity('Worker Ant', 'ant_worker', { faction: 'player' });
      palette.addCustomEntity('Soldier Ant', 'ant_soldier', { faction: 'player' });
      
      palette.setCategory('custom');
      palette.clearSearch();
      
      const templates = palette.getCurrentTemplates();
      
      expect(templates).to.have.lengthOf(2);
    });
  });

  describe('Search Results Display', function() {
    it('should display "No results" message when no matches', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      palette.addCustomEntity('Worker Ant', 'ant_worker', { faction: 'player' });
      palette.setCategory('custom');
      palette.setSearchQuery('nonexistent');
      
      const templates = palette.getCurrentTemplates();
      
      expect(templates).to.have.lengthOf(0);
    });

    it('should show result count', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      palette.addCustomEntity('Worker Ant', 'ant_worker', { faction: 'player' });
      palette.addCustomEntity('Soldier Ant', 'ant_soldier', { faction: 'player' });
      palette.addCustomEntity('Elite Worker', 'ant_worker', { faction: 'player' });
      
      palette.setCategory('custom');
      palette.setSearchQuery('worker');
      
      const templates = palette.getCurrentTemplates();
      
      expect(templates).to.have.lengthOf(2);
    });
  });

  describe('Clear Search Button', function() {
    it('should render clear button when search active', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      palette.setCategory('custom');
      palette.setSearchQuery('test');
      palette.renderSearchBox(100, 100, 200);
      
      // Check for clear button rendering (X icon or button)
      expect(global.text.called).to.be.true;
    });

    it('should have handleClearSearch method', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      expect(palette.handleClearSearch).to.be.a('function');
    });

    it('should clear search on button click', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      palette.setSearchQuery('test');
      palette.handleClearSearch();
      
      expect(palette._searchQuery).to.equal('');
    });
  });

  describe('Edge Cases', function() {
    it('should handle null templates array', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      const filtered = palette.filterTemplates(null, 'test');
      
      expect(filtered).to.be.an('array');
      expect(filtered).to.have.lengthOf(0);
    });

    it('should handle undefined search query', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      const templates = [
        { id: '1', customName: 'Worker', baseTemplateId: 'ant_worker' }
      ];
      
      const filtered = palette.filterTemplates(templates, undefined);
      
      expect(filtered).to.have.lengthOf(1);
    });

    it('should handle templates without customName', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      const templates = [
        { id: '1', baseTemplateId: 'ant_worker' },
        { id: '2', customName: 'Soldier', baseTemplateId: 'ant_soldier' }
      ];
      
      const filtered = palette.filterTemplates(templates, 'soldier');
      
      expect(filtered).to.have.lengthOf(1);
    });

    it('should handle special characters in search', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      const templates = [
        { id: '1', customName: 'Worker (Elite)', baseTemplateId: 'ant_worker' }
      ];
      
      const filtered = palette.filterTemplates(templates, '(elite)');
      
      expect(filtered).to.have.lengthOf(1);
    });

    it('should handle very long search queries', function() {
      const EntityPalette = require('../../../Classes/ui/EntityPalette');
      const palette = new EntityPalette();
      
      const longQuery = 'a'.repeat(100);
      palette.setSearchQuery(longQuery);
      
      expect(palette._searchQuery).to.have.lengthOf(100);
    });
  });
});
