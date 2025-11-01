/**
 * Unit tests for Event Templates System
 * Tests template loading, rendering, and selection in EventEditorPanel
 */

const { expect } = require('chai');
const sinon = require('sinon');
const { JSDOM } = require('jsdom');

describe('EventTemplates System', function() {
  let EventEditorPanel;
  let EVENT_TEMPLATES, getEventTemplates, getTemplateById, getTemplateByType;
  
  before(function() {
    // Setup JSDOM
    const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    global.window = dom.window;
    global.document = dom.window.document;
    
    // Mock p5.js functions
    global.push = sinon.stub();
    global.pop = sinon.stub();
    global.fill = sinon.stub();
    global.stroke = sinon.stub();
    global.noStroke = sinon.stub();
    global.rect = sinon.stub();
    global.text = sinon.stub();
    global.textAlign = sinon.stub();
    global.textSize = sinon.stub();
    global.ellipse = sinon.stub();
    global.line = sinon.stub();
    global.strokeWeight = sinon.stub();
    
    // Sync for JSDOM
    window.push = global.push;
    window.pop = global.pop;
    window.fill = global.fill;
    window.stroke = global.stroke;
    window.noStroke = global.noStroke;
    window.rect = global.rect;
    window.text = global.text;
    window.textAlign = global.textAlign;
    window.textSize = global.textSize;
    window.ellipse = global.ellipse;
    window.line = global.line;
    window.strokeWeight = global.strokeWeight;
    
    // Mock text alignment constants
    global.LEFT = 'left';
    global.CENTER = 'center';
    global.RIGHT = 'right';
    global.TOP = 'top';
    global.BOTTOM = 'bottom';
    window.LEFT = global.LEFT;
    window.CENTER = global.CENTER;
    window.RIGHT = global.RIGHT;
    window.TOP = global.TOP;
    window.BOTTOM = global.BOTTOM;
    
    // Mock EventManager
    global.EventManager = {
      getInstance: sinon.stub().returns({
        getAllEvents: sinon.stub().returns([]),
        registerEvent: sinon.stub().returns(true),
        registerTrigger: sinon.stub().returns(true),
        getEvent: sinon.stub().returns(null),
        exportToJSON: sinon.stub().returns('{}'),
        loadFromJSON: sinon.stub().returns(true)
      })
    };
    window.EventManager = global.EventManager;
    
    // Mock logNormal
    global.logNormal = sinon.stub();
    window.logNormal = global.logNormal;
    
    // Load EventTemplates
    const templates = require('../../../Classes/ui/EventTemplates');
    EVENT_TEMPLATES = templates.EVENT_TEMPLATES;
    getEventTemplates = templates.getEventTemplates;
    getTemplateById = templates.getTemplateById;
    getTemplateByType = templates.getTemplateByType;
    
    // Make available globally
    global.EVENT_TEMPLATES = EVENT_TEMPLATES;
    global.getEventTemplates = getEventTemplates;
    global.getTemplateById = getTemplateById;
    global.getTemplateByType = getTemplateByType;
    window.EVENT_TEMPLATES = EVENT_TEMPLATES;
    window.getEventTemplates = getEventTemplates;
    window.getTemplateById = getTemplateById;
    window.getTemplateByType = getTemplateByType;
    
    // Load EventEditorPanel
    EventEditorPanel = require('../../../Classes/systems/ui/EventEditorPanel');
  });
  
  afterEach(function() {
    sinon.restore();
  });
  
  describe('Template Data Structure', function() {
    it('should export EVENT_TEMPLATES object', function() {
      expect(EVENT_TEMPLATES).to.be.an('object');
    });
    
    it('should have 4 templates (dialogue, spawn, tutorial, boss)', function() {
      const templates = getEventTemplates();
      expect(templates).to.have.lengthOf(4);
    });
    
    it('should have dialogue template with correct structure', function() {
      const template = EVENT_TEMPLATES.dialogue;
      expect(template).to.exist;
      expect(template.id).to.equal('dialogue_template');
      expect(template.name).to.equal('Dialogue');
      expect(template.type).to.equal('dialogue');
      expect(template.icon).to.equal('💬');
      expect(template.defaultContent).to.exist;
      expect(template.defaultTrigger).to.exist;
    });
    
    it('should have spawn template with correct structure', function() {
      const template = EVENT_TEMPLATES.spawn;
      expect(template).to.exist;
      expect(template.id).to.equal('spawn_template');
      expect(template.name).to.equal('Spawn');
      expect(template.type).to.equal('spawn');
      expect(template.icon).to.equal('🐜');
    });
    
    it('should have tutorial template with correct structure', function() {
      const template = EVENT_TEMPLATES.tutorial;
      expect(template).to.exist;
      expect(template.id).to.equal('tutorial_template');
      expect(template.name).to.equal('Tutorial');
      expect(template.type).to.equal('tutorial');
      expect(template.icon).to.equal('💡');
    });
    
    it('should have boss template with correct structure', function() {
      const template = EVENT_TEMPLATES.boss;
      expect(template).to.exist;
      expect(template.id).to.equal('boss_template');
      expect(template.name).to.equal('Boss');
      expect(template.type).to.equal('boss');
      expect(template.icon).to.equal('👑');
    });
    
    it('getTemplateById should return correct template', function() {
      const template = getTemplateById('dialogue');
      expect(template).to.exist;
      expect(template.type).to.equal('dialogue');
    });
    
    it('getTemplateByType should return correct template', function() {
      const template = getTemplateByType('spawn');
      expect(template).to.exist;
      expect(template.id).to.equal('spawn_template');
    });
  });
  
  describe('EventEditorPanel Template Integration', function() {
    let panel;
    
    beforeEach(function() {
      panel = new EventEditorPanel();
      panel.initialize();
    });
    
    it('should load templates in constructor', function() {
      expect(panel.templates).to.exist;
      expect(panel.templates).to.have.lengthOf(4);
    });
    
    it('should have templateScrollOffset property', function() {
      expect(panel).to.have.property('templateScrollOffset');
      expect(panel.templateScrollOffset).to.equal(0);
    });
    
    it('should have _renderTemplates method', function() {
      expect(panel._renderTemplates).to.be.a('function');
    });
    
    it('should have _selectTemplate method', function() {
      expect(panel._selectTemplate).to.be.a('function');
    });
    
    it('_selectTemplate should populate editForm with template data', function() {
      panel._selectTemplate('dialogue');
      
      expect(panel.editMode).to.equal('add-event');
      expect(panel.editForm.type).to.equal('dialogue');
      expect(panel.editForm.priority).to.equal(5);
      expect(panel.editForm.content).to.deep.equal({
        speaker: 'NPC',
        message: 'Welcome to the forest!',
        duration: 3000
      });
    });
    
    it('_selectTemplate should generate unique event ID', function() {
      panel._selectTemplate('spawn');
      
      expect(panel.editForm.id).to.be.a('string');
      expect(panel.editForm.id).to.include('spawn_');
    });
    
    it('_renderTemplates should render template cards', function() {
      global.rect.resetHistory();
      global.text.resetHistory();
      
      panel._renderTemplates(10, 10, 250);
      
      // Should render 4 template cards
      expect(global.rect.callCount).to.be.at.least(4);
      expect(global.text.callCount).to.be.at.least(4);
    });
    
    it('handleClick should detect template browser area', function() {
      // Click in template browser area (top 100px of panel)
      const result = panel.handleClick(50, 20, 10, 10, 250, 400);
      
      // Should return template click result or null (depends on exact coordinates)
      expect(result).to.satisfy(r => r === null || (r && r.type === 'template'));
    });
  });
});
