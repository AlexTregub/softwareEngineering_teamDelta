/**
 * Unit Tests for DialogueCreationPanel
 * 
 * TDD Red Phase: Write tests FIRST for dialogue creation UI component
 * Tests cover: construction, rendering, interaction, scrolling, text editing, data export
 */

const { expect } = require('chai');
const sinon = require('sinon');

// Mock p5.js globals
global.createVector = sinon.stub().callsFake((x, y) => ({ x, y }));
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
global.p5Line = sinon.stub(); // Renamed to avoid conflict with Array.line
global.textWidth = sinon.stub().returns(50);
global.circle = sinon.stub();
global.CENTER = 'center';
global.LEFT = 'left';
global.RIGHT = 'right';
global.TOP = 'top';
global.BOTTOM = 'bottom';
global.deltaTime = 16; // ~60fps

// Mock drawing context for clipping
global.drawingContext = {
  save: sinon.stub(),
  restore: sinon.stub(),
  beginPath: sinon.stub(),
  rect: sinon.stub(),
  clip: sinon.stub()
};

// Sync to window for JSDOM
if (typeof window !== 'undefined') {
  window.createVector = global.createVector;
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
  window.line = global.p5Line; // Use renamed version
  window.textWidth = global.textWidth;
  window.circle = global.circle;
  window.CENTER = global.CENTER;
  window.LEFT = global.LEFT;
  window.RIGHT = global.RIGHT;
  window.TOP = global.TOP;
  window.BOTTOM = global.BOTTOM;
  window.deltaTime = global.deltaTime;
  window.drawingContext = global.drawingContext;
}

// Load the component (will fail initially - TDD Red)
const DialogueCreationPanel = require('../../../Classes/ui/DialogueCreationPanel');

describe('DialogueCreationPanel - Unit Tests', function() {
  let panel;
  let mockEventData;
  let mockEventManager;

  beforeEach(function() {
    // Reset all stubs
    sinon.resetHistory();

    // Create mock event data and manager
    mockEventData = {
      id: 'event_dialogue_test',
      type: 'dialogue',
      content: {}
    };

    mockEventManager = {
      registerEvent: sinon.stub().returns(true)
    };

    // Create panel instance
    panel = new DialogueCreationPanel(100, 50, 700, 650, mockEventData, mockEventManager);
  });

  afterEach(function() {
    sinon.restore();
  });

  // ==================== Constructor Tests ====================
  describe('Constructor', function() {
    it('should initialize with correct position and dimensions', function() {
      expect(panel.x).to.equal(100);
      expect(panel.y).to.equal(50);
      expect(panel.width).to.equal(700);
      expect(panel.height).to.equal(650);
    });

    it('should initialize with empty dialogueLines array', function() {
      expect(panel.dialogueLines).to.be.an('array');
      expect(panel.dialogueLines).to.have.lengthOf(0);
    });

    it('should initialize with default settings', function() {
      expect(panel.defaultScrollSpeed).to.equal(50);
      expect(panel.defaultTextEffect).to.equal('typewriter');
    });

    it('should initialize with no expanded line', function() {
      expect(panel.expandedLineIndex).to.be.null;
      expect(panel.isEditingText).to.be.false;
      expect(panel.editBuffer).to.equal('');
    });

    it('should initialize scroll state at zero', function() {
      expect(panel.scrollOffset).to.equal(0);
      expect(panel.maxScrollOffset).to.equal(0);
      expect(panel.scrollbarDragging).to.be.false;
    });

    it('should store event data and manager references', function() {
      expect(panel.eventData).to.equal(mockEventData);
      expect(panel.eventManager).to.equal(mockEventManager);
    });

    it('should initialize with "Dialogue Creation" title', function() {
      expect(panel.title).to.equal('Dialogue Creation');
    });

    it('should be visible by default', function() {
      expect(panel.isVisible).to.be.true;
    });
  });

  // ==================== Rendering Tests ====================
  describe('Rendering', function() {
    it('should not render if isVisible is false', function() {
      panel.isVisible = false;
      panel.render();
      expect(global.rect.called).to.be.false;
    });

    it('should render panel background with correct position', function() {
      panel.render();
      expect(global.rect.calledWith(100, 50, 700, 650, 5)).to.be.true;
    });

    it('should render title bar', function() {
      panel.render();
      // Check for title text rendering
      expect(global.text.calledWith('Dialogue Creation')).to.be.true;
    });

    it('should render default controls section', function() {
      panel.render();
      // Check for "Default Scroll Speed:" label
      expect(global.text.calledWith(sinon.match(/Default.*Speed/i))).to.be.true;
      // Check for "Default Effect:" label
      expect(global.text.calledWith(sinon.match(/Default.*Effect/i))).to.be.true;
    });

    it('should render add/remove buttons at bottom', function() {
      panel.render();
      // Check for button text (+ Char / − Char)
      expect(global.text.calledWith(sinon.match(/\+ Char/))).to.be.true;
      expect(global.text.calledWith(sinon.match(/− Char/))).to.be.true;
    });

    it('should render save button with correct text', function() {
      panel.render();
      expect(global.text.calledWith(sinon.match(/Save.*Dialogue/i))).to.be.true;
    });

    it('should store button bounds after rendering', function() {
      panel.render();
      expect(panel.addButton1Bounds).to.exist;
      expect(panel.removeButton1Bounds).to.exist;
      expect(panel.addButton2Bounds).to.exist;
      expect(panel.removeButton2Bounds).to.exist;
      expect(panel.saveButtonBounds).to.exist;
    });
  });

  // ==================== Dialogue Line Rendering Tests ====================
  describe('Dialogue Line Rendering', function() {
    beforeEach(function() {
      panel.dialogueLines = [
        { character: 1, text: "Hello there!", effect: "typewriter", scrollSpeed: 50 },
        { character: 2, text: "I'm doing great!", effect: "fade", scrollSpeed: 60 }
      ];
    });

    it('should render dialogue lines in sequential order', function() {
      panel.render();
      // Lines should be stored in lineBounds array
      expect(panel.lineBounds).to.be.an('array');
      expect(panel.lineBounds.length).to.be.at.least(2);
    });

    it('should render collapsed line with 40px height', function() {
      panel.expandedLineIndex = null; // Ensure collapsed
      panel.render();
      // Check lineBounds for collapsed height
      const firstLineBounds = panel.lineBounds[0];
      expect(firstLineBounds.height).to.equal(40);
    });

    it('should render expanded line with 100px height', function() {
      panel.expandedLineIndex = 0; // Expand first line
      panel.render();
      // Check lineBounds for expanded height
      const firstLineBounds = panel.lineBounds[0];
      expect(firstLineBounds.height).to.equal(100);
    });

    it('should render character label on dialogue line', function() {
      panel.render();
      expect(global.text.calledWith(sinon.match(/Character 1/i))).to.be.true;
      expect(global.text.calledWith(sinon.match(/Character 2/i))).to.be.true;
    });

    it('should render effect indicator on collapsed line', function() {
      panel.expandedLineIndex = null;
      panel.render();
      // Effect indicators: ⌨ (typewriter), ✨ (fade), ⚡ (instant)
      // Just check text was called (emoji rendering)
      expect(global.text.called).to.be.true;
    });

    it('should render per-line effect controls on expanded line', function() {
      panel.expandedLineIndex = 0;
      panel.render();
      // Check for per-line effect buttons stored in lineBounds
      expect(panel.lineBounds[0].effectButtons).to.exist;
      expect(panel.lineBounds[0].effectButtons).to.have.lengthOf(3); // typewriter, fade, instant
    });

    it('should render per-line speed slider on expanded line', function() {
      panel.expandedLineIndex = 0;
      panel.render();
      // Check for speed slider bounds
      expect(panel.lineBounds[0].speedSlider).to.exist;
    });

    it('should show cursor when editing text', function() {
      panel.expandedLineIndex = 0;
      panel.isEditingText = true;
      panel.cursorVisible = true;
      panel.render();
      // Check for stroke/strokeWeight calls (cursor rendering setup)
      expect(global.stroke.called).to.be.true;
      expect(global.strokeWeight.called).to.be.true;
    });
  });

  // ==================== Scrollbar Rendering Tests ====================
  describe('Scrollbar Rendering', function() {
    it('should not render scrollbar if content fits viewport', function() {
      panel.dialogueLines = [
        { character: 1, text: "Hello", effect: "typewriter", scrollSpeed: 50 }
      ];
      panel.render();
      // maxScrollOffset should be 0, no scrollbar needed
      expect(panel.maxScrollOffset).to.equal(0);
    });

    it('should render scrollbar if content overflows viewport', function() {
      // Add many lines to overflow
      for (let i = 0; i < 20; i++) {
        panel.dialogueLines.push({
          character: (i % 2) + 1,
          text: `Line ${i}`,
          effect: "typewriter",
          scrollSpeed: 50
        });
      }
      panel.render();
      // maxScrollOffset should be > 0
      expect(panel.maxScrollOffset).to.be.greaterThan(0);
      expect(panel.scrollbarBounds).to.exist;
      expect(panel.scrollbarThumbBounds).to.exist;
    });
  });

  // ==================== Add/Remove Line Tests ====================
  describe('Adding Lines', function() {
    it('should add character 1 line to END of dialogueLines', function() {
      panel.addLine(1);
      expect(panel.dialogueLines).to.have.lengthOf(1);
      expect(panel.dialogueLines[0].character).to.equal(1);
    });

    it('should add character 2 line to END of dialogueLines', function() {
      panel.addLine(2);
      expect(panel.dialogueLines).to.have.lengthOf(1);
      expect(panel.dialogueLines[0].character).to.equal(2);
    });

    it('should maintain sequential order when adding multiple lines', function() {
      panel.addLine(1);
      panel.addLine(1);
      panel.addLine(2);
      expect(panel.dialogueLines).to.have.lengthOf(3);
      expect(panel.dialogueLines[0].character).to.equal(1);
      expect(panel.dialogueLines[1].character).to.equal(1);
      expect(panel.dialogueLines[2].character).to.equal(2);
    });

    it('should add line with default settings', function() {
      panel.defaultScrollSpeed = 70;
      panel.defaultTextEffect = 'fade';
      panel.addLine(1);
      expect(panel.dialogueLines[0].scrollSpeed).to.equal(70);
      expect(panel.dialogueLines[0].effect).to.equal('fade');
    });

    it('should add line with sample text', function() {
      panel.addLine(1);
      expect(panel.dialogueLines[0].text).to.be.a('string');
      expect(panel.dialogueLines[0].text.length).to.be.greaterThan(0);
    });
  });

  describe('Removing Lines', function() {
    beforeEach(function() {
      panel.dialogueLines = [
        { character: 1, text: "Line 1", effect: "typewriter", scrollSpeed: 50 },
        { character: 1, text: "Line 2", effect: "typewriter", scrollSpeed: 50 },
        { character: 2, text: "Line 3", effect: "fade", scrollSpeed: 60 },
        { character: 2, text: "Line 4", effect: "fade", scrollSpeed: 60 }
      ];
    });

    it('should remove last character 1 line', function() {
      panel.removeLastLine(1);
      expect(panel.dialogueLines).to.have.lengthOf(3);
      // Last Char1 line (index 1) should be removed
      expect(panel.dialogueLines[1].character).to.equal(2); // Now Char2 at index 1
    });

    it('should remove last character 2 line', function() {
      panel.removeLastLine(2);
      expect(panel.dialogueLines).to.have.lengthOf(3);
      // Last line (index 3) should be removed
      expect(panel.dialogueLines.length).to.equal(3);
    });

    it('should do nothing if no lines for character', function() {
      panel.dialogueLines = [
        { character: 1, text: "Line 1", effect: "typewriter", scrollSpeed: 50 }
      ];
      panel.removeLastLine(2); // No Char2 lines
      expect(panel.dialogueLines).to.have.lengthOf(1);
    });

    it('should clear expanded index if removed line was expanded', function() {
      panel.expandedLineIndex = 1;
      panel.removeLastLine(1); // Removes line at index 1
      expect(panel.expandedLineIndex).to.be.null;
    });

    it('should adjust expanded index if after removed line', function() {
      panel.expandedLineIndex = 3;
      panel.removeLastLine(1); // Removes line at index 1 (before expanded)
      expect(panel.expandedLineIndex).to.equal(2); // Adjusted down
    });
  });

  // ==================== Line Expansion Tests ====================
  describe('Line Expansion', function() {
    beforeEach(function() {
      panel.dialogueLines = [
        { character: 1, text: "Hello", effect: "typewriter", scrollSpeed: 50 },
        { character: 2, text: "Hi there", effect: "fade", scrollSpeed: 60 }
      ];
    });

    it('should expand line when clicked', function() {
      panel.expandLine(0);
      expect(panel.expandedLineIndex).to.equal(0);
      expect(panel.isEditingText).to.be.true;
    });

    it('should load text into editBuffer when expanding', function() {
      panel.expandLine(0);
      expect(panel.editBuffer).to.equal("Hello");
    });

    it('should toggle edit mode when clicking same line', function() {
      panel.expandedLineIndex = 0;
      panel.isEditingText = true;
      panel.expandLine(0); // Click again
      expect(panel.isEditingText).to.be.false;
    });

    it('should switch to different line when clicking another', function() {
      panel.expandedLineIndex = 0;
      panel.expandLine(1); // Click different line
      expect(panel.expandedLineIndex).to.equal(1);
      expect(panel.editBuffer).to.equal("Hi there");
    });
  });

  // ==================== Text Editing Tests ====================
  describe('Text Editing', function() {
    beforeEach(function() {
      panel.dialogueLines = [
        { character: 1, text: "Hello", effect: "typewriter", scrollSpeed: 50 }
      ];
      panel.expandedLineIndex = 0;
      panel.isEditingText = true;
      panel.editBuffer = "Hello";
    });

    it('should add printable characters to editBuffer', function() {
      panel.handleKeyPress('!');
      expect(panel.editBuffer).to.equal("Hello!");
    });

    it('should remove last character on Backspace', function() {
      panel.handleKeyPress('Backspace');
      expect(panel.editBuffer).to.equal("Hell");
    });

    it('should save text on Enter', function() {
      panel.editBuffer = "Hello there!";
      panel.handleKeyPress('Enter');
      expect(panel.dialogueLines[0].text).to.equal("Hello there!");
      expect(panel.isEditingText).to.be.false;
      expect(panel.expandedLineIndex).to.be.null;
    });

    it('should cancel editing on Escape', function() {
      panel.editBuffer = "Modified text";
      panel.handleKeyPress('Escape');
      expect(panel.dialogueLines[0].text).to.equal("Hello"); // Unchanged
      expect(panel.isEditingText).to.be.false;
      expect(panel.expandedLineIndex).to.be.null;
    });

    it('should not process keys if not editing', function() {
      panel.isEditingText = false;
      const originalBuffer = panel.editBuffer;
      panel.handleKeyPress('a');
      expect(panel.editBuffer).to.equal(originalBuffer);
    });
  });

  // ==================== Click Detection Tests ====================
  describe('Click Detection', function() {
    it('should return false if click outside panel bounds', function() {
      const result = panel.handleClick(0, 0); // Outside panel at (100, 50)
      expect(result).to.be.false;
    });

    it('should detect add button 1 click', function() {
      panel.render(); // Generate bounds
      const btn = panel.addButton1Bounds;
      const result = panel.handleClick(btn.x + 10, btn.y + 10);
      expect(result).to.be.true;
      expect(panel.dialogueLines.length).to.be.greaterThan(0);
    });

    it('should detect add button 2 click', function() {
      panel.render();
      const btn = panel.addButton2Bounds;
      const result = panel.handleClick(btn.x + 10, btn.y + 10);
      expect(result).to.be.true;
      expect(panel.dialogueLines.length).to.be.greaterThan(0);
    });

    it('should detect remove button click', function() {
      panel.dialogueLines = [
        { character: 1, text: "Test", effect: "typewriter", scrollSpeed: 50 }
      ];
      panel.render();
      const btn = panel.removeButton1Bounds;
      panel.handleClick(btn.x + 10, btn.y + 10);
      expect(panel.dialogueLines).to.have.lengthOf(0);
    });

    it('should detect save button click', function() {
      panel.render();
      const btn = panel.saveButtonBounds;
      const result = panel.handleClick(btn.x + 10, btn.y + 10);
      expect(result).to.be.true;
      // Verify saveDialogue was called via console.log check
      expect(panel.eventData.content).to.exist;
    });

    it('should detect dialogue line click', function() {
      panel.dialogueLines = [
        { character: 1, text: "Test", effect: "typewriter", scrollSpeed: 50 }
      ];
      panel.render();
      const lineBounds = panel.lineBounds[0];
      panel.handleClick(lineBounds.x + 10, lineBounds.y + 10);
      expect(panel.expandedLineIndex).to.equal(0);
    });

    it('should detect scrollbar track click', function() {
      // Add many lines to enable scrollbar
      for (let i = 0; i < 30; i++) {
        panel.dialogueLines.push({
          character: 1,
          text: `Line ${i} with some longer text to ensure overflow`,
          effect: "typewriter",
          scrollSpeed: 50
        });
      }
      panel.scrollOffset = 0; // Reset to start
      panel.render();
      
      // Verify scrollbar exists
      expect(panel.maxScrollOffset).to.be.greaterThan(0);
      expect(panel.scrollbarBounds).to.exist;
      
      // Click near bottom of scrollbar track
      const clickY = panel.scrollbarBounds.y + panel.scrollbarBounds.height - 50;
      panel.handleClick(panel.scrollbarBounds.x + 5, clickY);
      
      // Scroll should change (clicked far down the track)
      expect(panel.scrollOffset).to.be.greaterThan(0);
    });

    it('should detect default speed slider click', function() {
      panel.render();
      const slider = panel.scrollSpeedSliderBounds;
      const initialSpeed = panel.defaultScrollSpeed;
      panel.handleClick(slider.x + 100, slider.y + 5);
      expect(panel.defaultScrollSpeed).to.not.equal(initialSpeed);
    });

    it('should detect default effect button click', function() {
      panel.render();
      const effectBtn = panel.defaultEffectButtonBounds[1]; // 'fade' button
      panel.handleClick(effectBtn.x + 10, effectBtn.y + 10);
      expect(panel.defaultTextEffect).to.equal('fade');
    });
  });

  // ==================== Scroll Handling Tests ====================
  describe('Scroll Handling', function() {
    beforeEach(function() {
      // Add many lines to enable scrolling
      for (let i = 0; i < 20; i++) {
        panel.dialogueLines.push({
          character: (i % 2) + 1,
          text: `Line ${i}`,
          effect: "typewriter",
          scrollSpeed: 50
        });
      }
      panel.render(); // Calculate maxScrollOffset
    });

    it('should scroll content on mouse wheel', function() {
      const initialOffset = panel.scrollOffset;
      panel.handleMouseWheel(5); // Scroll down
      expect(panel.scrollOffset).to.be.greaterThan(initialOffset);
    });

    it('should constrain scroll offset to maxScrollOffset', function() {
      panel.handleMouseWheel(10000); // Large scroll
      expect(panel.scrollOffset).to.equal(panel.maxScrollOffset);
    });

    it('should constrain scroll offset to zero', function() {
      panel.scrollOffset = 100;
      panel.handleMouseWheel(-10000); // Large scroll up
      expect(panel.scrollOffset).to.equal(0);
    });

    it('should start scrollbar dragging on thumb click', function() {
      panel.render();
      if (panel.scrollbarThumbBounds) {
        panel.handleClick(
          panel.scrollbarThumbBounds.x + 5,
          panel.scrollbarThumbBounds.y + 10
        );
        expect(panel.scrollbarDragging).to.be.true;
      }
    });

    it('should update scroll on mouse drag', function() {
      panel.scrollbarDragging = true;
      panel.scrollbarDragOffset = 0;
      panel.render(); // Ensure bounds exist
      if (panel.scrollbarBounds) {
        const initialOffset = panel.scrollOffset;
        panel.handleMouseDrag(
          panel.scrollbarBounds.x + 5,
          panel.scrollbarBounds.y + 100
        );
        expect(panel.scrollOffset).to.not.equal(initialOffset);
      }
    });

    it('should stop dragging on mouse release', function() {
      panel.scrollbarDragging = true;
      panel.handleMouseRelease();
      expect(panel.scrollbarDragging).to.be.false;
    });
  });

  // ==================== Per-Line Effect Control Tests ====================
  describe('Per-Line Effect Controls', function() {
    beforeEach(function() {
      panel.dialogueLines = [
        { character: 1, text: "Test", effect: "typewriter", scrollSpeed: 50 }
      ];
      panel.expandedLineIndex = 0;
      panel.render();
    });

    it('should change line effect when effect button clicked', function() {
      const effectBtn = panel.lineBounds[0].effectButtons[1]; // 'fade' button
      panel.handleClick(effectBtn.x + 5, effectBtn.y + 5);
      expect(panel.dialogueLines[0].effect).to.equal('fade');
    });

    it('should change line speed when speed slider clicked', function() {
      const slider = panel.lineBounds[0].speedSlider;
      const initialSpeed = panel.dialogueLines[0].scrollSpeed;
      panel.handleClick(slider.x + 40, slider.y + 5);
      expect(panel.dialogueLines[0].scrollSpeed).to.not.equal(initialSpeed);
    });

    it('should only modify the specific line, not others', function() {
      panel.dialogueLines.push({
        character: 2,
        text: "Test 2",
        effect: "typewriter",
        scrollSpeed: 50
      });
      panel.render();
      
      const effectBtn = panel.lineBounds[0].effectButtons[1]; // Line 0, 'fade' button
      panel.handleClick(effectBtn.x + 5, effectBtn.y + 5);
      
      expect(panel.dialogueLines[0].effect).to.equal('fade');
      expect(panel.dialogueLines[1].effect).to.equal('typewriter'); // Unchanged
    });
  });

  // ==================== Data Export Tests ====================
  describe('Data Export', function() {
    beforeEach(function() {
      panel.dialogueLines = [
        { character: 1, text: "Hello!", effect: "typewriter", scrollSpeed: 50 },
        { character: 2, text: "Hi there!", effect: "fade", scrollSpeed: 60 },
        { character: 1, text: "How are you?", effect: "instant", scrollSpeed: 80 }
      ];
    });

    it('should export dialogueLines array', function() {
      const data = panel.saveDialogue();
      expect(data.dialogueLines).to.be.an('array');
      expect(data.dialogueLines).to.have.lengthOf(3);
    });

    it('should export metadata with line counts', function() {
      const data = panel.saveDialogue();
      expect(data.metadata).to.exist;
      expect(data.metadata.totalLines).to.equal(3);
      expect(data.metadata.character1Count).to.equal(2);
      expect(data.metadata.character2Count).to.equal(1);
    });

    it('should export lines with all properties', function() {
      const data = panel.saveDialogue();
      const line = data.dialogueLines[0];
      expect(line.character).to.exist;
      expect(line.text).to.exist;
      expect(line.effect).to.exist;
      expect(line.scrollSpeed).to.exist;
    });

    it('should maintain sequential order in export', function() {
      const data = panel.saveDialogue();
      expect(data.dialogueLines[0].character).to.equal(1);
      expect(data.dialogueLines[1].character).to.equal(2);
      expect(data.dialogueLines[2].character).to.equal(1);
    });
  });
});
