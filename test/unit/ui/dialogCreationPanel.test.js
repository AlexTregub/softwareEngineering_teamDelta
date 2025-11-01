/**
 * DialogCreationPanel - Unit Tests (TDD)
 * 
 * Tests for dialog creation UI component
 * Write tests FIRST, then implement component (Red → Green → Refactor)
 */

const { expect } = require('chai');
const sinon = require('sinon');

describe('DialogCreationPanel', function() {
  let panel;
  let mockEventManager;
  let mockEventData;
  
  beforeEach(function() {
    // Mock p5.js globals
    global.push = sinon.stub();
    global.pop = sinon.stub();
    global.fill = sinon.stub();
    global.stroke = sinon.stub();
    global.strokeWeight = sinon.stub();
    global.noStroke = sinon.stub();
    global.rect = sinon.stub();
    global.text = sinon.stub();
    global.textAlign = sinon.stub();
    global.textSize = sinon.stub();
    global.LEFT = 'LEFT';
    global.CENTER = 'CENTER';
    global.TOP = 'TOP';
    global.logNormal = sinon.stub();
    
    // Sync window object for JSDOM
    if (typeof window !== 'undefined') {
      window.push = global.push;
      window.pop = global.pop;
      window.fill = global.fill;
      window.stroke = global.stroke;
      window.strokeWeight = global.strokeWeight;
      window.noStroke = global.noStroke;
      window.rect = global.rect;
      window.text = global.text;
      window.textAlign = global.textAlign;
      window.textSize = global.textSize;
      window.LEFT = global.LEFT;
      window.CENTER = global.CENTER;
      window.TOP = global.TOP;
      window.logNormal = global.logNormal;
    }
    
    // Mock EventManager
    mockEventManager = {
      updateEvent: sinon.stub().returns(true)
    };
    
    // Mock event data
    mockEventData = {
      id: 'event_dialogue_001',
      type: 'dialogue',
      content: {}
    };
    
    // Load DialogCreationPanel class
    const DialogCreationPanel = require('../../../Classes/ui/DialogCreationPanel');
    
    // Create panel instance
    panel = new DialogCreationPanel(100, 100, 600, 500, mockEventData, mockEventManager);
  });
  
  afterEach(function() {
    sinon.restore();
  });
  
  describe('Constructor', function() {
    it('should initialize with position and dimensions', function() {
      expect(panel.x).to.equal(100);
      expect(panel.y).to.equal(100);
      expect(panel.width).to.equal(600);
      expect(panel.height).to.equal(500);
    });
    
    it('should store event data reference', function() {
      expect(panel.eventData).to.deep.equal(mockEventData);
    });
    
    it('should store EventManager reference', function() {
      expect(panel.eventManager).to.equal(mockEventManager);
    });
    
    it('should initialize character 1 lines as empty array', function() {
      expect(panel.character1Lines).to.be.an('array');
      expect(panel.character1Lines).to.have.lengthOf(0);
    });
    
    it('should initialize character 2 lines as empty array', function() {
      expect(panel.character2Lines).to.be.an('array');
      expect(panel.character2Lines).to.have.lengthOf(0);
    });
    
    it('should initialize with no selected line', function() {
      expect(panel.selectedCharacter).to.equal(null);
      expect(panel.selectedLineIndex).to.equal(null);
    });
    
    it('should initialize with default title', function() {
      expect(panel.title).to.equal('Dialog Creation');
    });
    
    it('should initialize as visible', function() {
      expect(panel.isVisible).to.equal(true);
    });
  });
  
  describe('Rendering', function() {
    it('should render title bar', function() {
      panel.render();
      
      // Check text() was called with title
      const textCalls = global.text.getCalls();
      const titleCall = textCalls.find(call => call.args[0] === 'Dialog Creation');
      expect(titleCall).to.exist;
    });
    
    it('should render Character 1 header', function() {
      panel.render();
      
      const textCalls = global.text.getCalls();
      const char1Call = textCalls.find(call => call.args[0] === 'Character 1');
      expect(char1Call).to.exist;
    });
    
    it('should render Character 2 header', function() {
      panel.render();
      
      const textCalls = global.text.getCalls();
      const char2Call = textCalls.find(call => call.args[0] === 'Character 2');
      expect(char2Call).to.exist;
    });
    
    it('should not render when isVisible is false', function() {
      panel.isVisible = false;
      panel.render();
      
      expect(global.push.called).to.be.false;
      expect(global.rect.called).to.be.false;
    });
    
    it('should render add buttons for both characters', function() {
      panel.render();
      
      expect(panel.addButton1Bounds).to.exist;
      expect(panel.addButton2Bounds).to.exist;
    });
    
    it('should render remove buttons for both characters', function() {
      panel.render();
      
      expect(panel.removeButton1Bounds).to.exist;
      expect(panel.removeButton2Bounds).to.exist;
    });
    
    it('should render dialogue lines for character 1', function() {
      panel.character1Lines = ['Hello', 'How are you?'];
      panel.render();
      
      const textCalls = global.text.getCalls();
      const line1Call = textCalls.find(call => call.args[0] === 'Hello');
      const line2Call = textCalls.find(call => call.args[0] === 'How are you?');
      expect(line1Call).to.exist;
      expect(line2Call).to.exist;
    });
    
    it('should render dialogue lines for character 2', function() {
      panel.character2Lines = ['I am fine', 'Thanks!'];
      panel.render();
      
      const textCalls = global.text.getCalls();
      const line1Call = textCalls.find(call => call.args[0] === 'I am fine');
      const line2Call = textCalls.find(call => call.args[0] === 'Thanks!');
      expect(line1Call).to.exist;
      expect(line2Call).to.exist;
    });
  });
  
  describe('Adding Lines', function() {
    it('should add line to character 1', function() {
      expect(panel.character1Lines).to.have.lengthOf(0);
      
      panel.addLine(1);
      
      expect(panel.character1Lines).to.have.lengthOf(1);
      expect(panel.character1Lines[0]).to.equal('');
    });
    
    it('should add line to character 2', function() {
      expect(panel.character2Lines).to.have.lengthOf(0);
      
      panel.addLine(2);
      
      expect(panel.character2Lines).to.have.lengthOf(1);
      expect(panel.character2Lines[0]).to.equal('');
    });
    
    it('should add multiple lines to character 1', function() {
      panel.addLine(1);
      panel.addLine(1);
      panel.addLine(1);
      
      expect(panel.character1Lines).to.have.lengthOf(3);
    });
    
    it('should add multiple lines to character 2', function() {
      panel.addLine(2);
      panel.addLine(2);
      
      expect(panel.character2Lines).to.have.lengthOf(2);
    });
  });
  
  describe('Removing Lines', function() {
    beforeEach(function() {
      panel.character1Lines = ['Line 1', 'Line 2', 'Line 3'];
      panel.character2Lines = ['Line A', 'Line B'];
    });
    
    it('should remove line from character 1 at index', function() {
      panel.removeLine(1, 1); // Remove "Line 2"
      
      expect(panel.character1Lines).to.have.lengthOf(2);
      expect(panel.character1Lines[0]).to.equal('Line 1');
      expect(panel.character1Lines[1]).to.equal('Line 3');
    });
    
    it('should remove line from character 2 at index', function() {
      panel.removeLine(2, 0); // Remove "Line A"
      
      expect(panel.character2Lines).to.have.lengthOf(1);
      expect(panel.character2Lines[0]).to.equal('Line B');
    });
    
    it('should handle removing from empty array gracefully', function() {
      panel.character1Lines = [];
      
      panel.removeLine(1, 0);
      
      expect(panel.character1Lines).to.have.lengthOf(0);
    });
    
    it('should handle invalid index gracefully', function() {
      const initialLength = panel.character1Lines.length;
      
      panel.removeLine(1, 999);
      
      expect(panel.character1Lines).to.have.lengthOf(initialLength);
    });
  });
  
  describe('Click Handling', function() {
    beforeEach(function() {
      panel.render(); // Calculate button bounds
    });
    
    it('should detect add button 1 click', function() {
      const bounds = panel.addButton1Bounds;
      const x = bounds.x + bounds.width / 2;
      const y = bounds.y + bounds.height / 2;
      
      const initialLength = panel.character1Lines.length;
      panel.handleClick(x, y);
      
      expect(panel.character1Lines.length).to.equal(initialLength + 1);
    });
    
    it('should detect add button 2 click', function() {
      const bounds = panel.addButton2Bounds;
      const x = bounds.x + bounds.width / 2;
      const y = bounds.y + bounds.height / 2;
      
      const initialLength = panel.character2Lines.length;
      panel.handleClick(x, y);
      
      expect(panel.character2Lines.length).to.equal(initialLength + 1);
    });
    
    it('should detect remove button 1 click', function() {
      panel.character1Lines = ['Line 1', 'Line 2'];
      panel.render(); // Recalculate bounds
      
      const bounds = panel.removeButton1Bounds;
      const x = bounds.x + bounds.width / 2;
      const y = bounds.y + bounds.height / 2;
      
      panel.handleClick(x, y);
      
      expect(panel.character1Lines).to.have.lengthOf(1);
    });
    
    it('should detect remove button 2 click', function() {
      panel.character2Lines = ['Line A', 'Line B'];
      panel.render(); // Recalculate bounds
      
      const bounds = panel.removeButton2Bounds;
      const x = bounds.x + bounds.width / 2;
      const y = bounds.y + bounds.height / 2;
      
      panel.handleClick(x, y);
      
      expect(panel.character2Lines).to.have.lengthOf(1);
    });
    
    it('should return false for clicks outside panel bounds', function() {
      const result = panel.handleClick(0, 0); // Far outside
      
      expect(result).to.be.false;
    });
  });
  
  describe('Data Export', function() {
    beforeEach(function() {
      panel.character1Lines = ['Hello', 'How are you?'];
      panel.character2Lines = ['I am fine', 'Thanks!'];
    });
    
    it('should export dialogue data structure', function() {
      const data = panel.getDialogueData();
      
      expect(data).to.have.property('lines');
      expect(data.lines).to.be.an('array');
    });
    
    it('should interleave character lines in export', function() {
      const data = panel.getDialogueData();
      
      expect(data.lines).to.have.lengthOf(4);
      expect(data.lines[0]).to.deep.equal({ character: 1, text: 'Hello' });
      expect(data.lines[1]).to.deep.equal({ character: 2, text: 'I am fine' });
      expect(data.lines[2]).to.deep.equal({ character: 1, text: 'How are you?' });
      expect(data.lines[3]).to.deep.equal({ character: 2, text: 'Thanks!' });
    });
    
    it('should handle empty lines gracefully', function() {
      panel.character1Lines = [];
      panel.character2Lines = [];
      
      const data = panel.getDialogueData();
      
      expect(data.lines).to.have.lengthOf(0);
    });
  });
  
  describe('Selection State', function() {
    beforeEach(function() {
      panel.character1Lines = ['Line 1', 'Line 2'];
      panel.character2Lines = ['Line A'];
    });
    
    it('should allow selecting character 1 line', function() {
      panel.selectLine(1, 0);
      
      expect(panel.selectedCharacter).to.equal(1);
      expect(panel.selectedLineIndex).to.equal(0);
    });
    
    it('should allow selecting character 2 line', function() {
      panel.selectLine(2, 0);
      
      expect(panel.selectedCharacter).to.equal(2);
      expect(panel.selectedLineIndex).to.equal(0);
    });
    
    it('should clear selection', function() {
      panel.selectLine(1, 0);
      panel.clearSelection();
      
      expect(panel.selectedCharacter).to.equal(null);
      expect(panel.selectedLineIndex).to.equal(null);
    });
  });
});
