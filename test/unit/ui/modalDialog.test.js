/**
 * Unit Tests: ModalDialog Component
 * 
 * Tests modal dialog functionality for:
 * - Show/hide modal
 * - Render title, message, input field
 * - Button detection and callbacks
 * - Keyboard input (Enter, Esc)
 * - Input validation
 * 
 * Modal used for:
 * - Add new custom entity (input + validation)
 * - Rename entity (input + validation)
 * - Delete confirmation (warning message)
 */

const { expect } = require('chai');
const sinon = require('sinon');

// Setup global window object for JSDOM compatibility
if (typeof window === 'undefined') {
  global.window = {};
}

// Mock p5.js functions
global.push = sinon.stub();
global.pop = sinon.stub();
global.fill = sinon.stub();
global.noStroke = sinon.stub();
global.stroke = sinon.stub();
global.rect = sinon.stub();
global.text = sinon.stub();
global.textAlign = sinon.stub();
global.textSize = sinon.stub();
global.textWidth = sinon.stub().returns(100);
global.LEFT = 'left';
global.RIGHT = 'right';
global.CENTER = 'center';
global.TOP = 'top';

// Sync to window
window.push = global.push;
window.pop = global.pop;
window.fill = global.fill;
window.noStroke = global.noStroke;
window.stroke = global.stroke;
window.rect = global.rect;
window.text = global.text;
window.textAlign = global.textAlign;
window.textSize = global.textSize;
window.textWidth = global.textWidth;
window.LEFT = global.LEFT;
window.RIGHT = global.RIGHT;
window.CENTER = global.CENTER;
window.TOP = global.TOP;

// Load ModalDialog class (will fail initially - TDD Red)
let ModalDialog;
try {
  ModalDialog = require('../../../Classes/ui/ModalDialog.js');
} catch (e) {
  // Expected to fail initially (TDD Red phase)
  ModalDialog = null;
}

describe('ModalDialog Component', function() {
  let modal;
  
  beforeEach(function() {
    if (!ModalDialog) {
      this.skip(); // Skip tests if class doesn't exist yet
    }
    modal = new ModalDialog();
  });
  
  afterEach(function() {
    sinon.restore();
  });
  
  describe('Initialization', function() {
    it('should initialize in hidden state', function() {
      expect(modal.isVisible()).to.be.false;
    });
    
    it('should initialize with empty title', function() {
      expect(modal.title).to.equal('');
    });
    
    it('should initialize with empty message', function() {
      expect(modal.message).to.equal('');
    });
    
    it('should initialize with no input field', function() {
      expect(modal.hasInput).to.be.false;
    });
    
    it('should initialize with empty buttons array', function() {
      expect(modal.buttons).to.be.an('array').that.is.empty;
    });
  });
  
  describe('Show/Hide Modal', function() {
    it('should show modal with title and message', function() {
      modal.show({
        title: 'Test Title',
        message: 'Test message'
      });
      
      expect(modal.isVisible()).to.be.true;
      expect(modal.title).to.equal('Test Title');
      expect(modal.message).to.equal('Test message');
    });
    
    it('should hide modal', function() {
      modal.show({ title: 'Test', message: 'Test' });
      modal.hide();
      
      expect(modal.isVisible()).to.be.false;
    });
    
    it('should show modal with input field', function() {
      modal.show({
        title: 'Enter Name',
        message: 'Please enter a name',
        hasInput: true,
        inputPlaceholder: 'Enter name here',
        inputValue: 'Default'
      });
      
      expect(modal.hasInput).to.be.true;
      expect(modal.inputPlaceholder).to.equal('Enter name here');
      expect(modal.inputValue).to.equal('Default');
    });
    
    it('should show modal with buttons', function() {
      const onConfirm = sinon.spy();
      const onCancel = sinon.spy();
      
      modal.show({
        title: 'Confirm',
        message: 'Are you sure?',
        buttons: [
          { label: 'Cancel', callback: onCancel, type: 'secondary' },
          { label: 'Confirm', callback: onConfirm, type: 'primary' }
        ]
      });
      
      expect(modal.buttons).to.have.lengthOf(2);
      expect(modal.buttons[0].label).to.equal('Cancel');
      expect(modal.buttons[1].label).to.equal('Confirm');
    });
  });
  
  describe('Button Detection', function() {
    it('should detect button click and execute callback', function() {
      const callback = sinon.spy();
      
      modal.show({
        title: 'Test',
        message: 'Test',
        buttons: [
          { label: 'OK', callback, type: 'primary' }
        ]
      });
      
      // Modal centered at canvas center, button at bottom
      // Canvas assumed 800x600, modal 400x300
      // Modal at (200, 150), button at y = 150 + 300 - 60 = 390
      // Button center: (400, 410)
      const result = modal.handleClick(400, 410);
      
      expect(result).to.be.true;
      expect(callback.calledOnce).to.be.true;
    });
    
    it('should return false when clicking outside buttons', function() {
      const callback = sinon.spy();
      
      modal.show({
        title: 'Test',
        message: 'Test',
        buttons: [
          { label: 'OK', callback, type: 'primary' }
        ]
      });
      
      // Click outside modal area
      const result = modal.handleClick(100, 100);
      
      expect(result).to.be.false;
      expect(callback.called).to.be.false;
    });
    
    it('should detect clicks on multiple buttons', function() {
      const onConfirm = sinon.spy();
      const onCancel = sinon.spy();
      
      modal.show({
        title: 'Test',
        message: 'Test',
        buttons: [
          { label: 'Cancel', callback: onCancel, type: 'secondary' },
          { label: 'Confirm', callback: onConfirm, type: 'primary' }
        ]
      });
      
      // Click cancel button (left side)
      // Two buttons: spacing=10, width=(400-30)/2=185 each
      // Cancel button: x=210 to 395, center at 302
      modal.handleClick(302, 410);
      expect(onCancel.calledOnce).to.be.true;
      expect(onConfirm.called).to.be.false;
      
      // Reset and show modal again (first click hides modal)
      onCancel.resetHistory();
      modal.show({
        title: 'Test',
        message: 'Test',
        buttons: [
          { label: 'Cancel', callback: onCancel, type: 'secondary' },
          { label: 'Confirm', callback: onConfirm, type: 'primary' }
        ]
      });
      
      // Click confirm button (right side)
      // Confirm button: x=405 to 590, center at 497
      modal.handleClick(497, 410);
      expect(onConfirm.calledOnce).to.be.true;
    });
  });
  
  describe('Keyboard Input', function() {
    it('should handle Enter key to confirm', function() {
      const callback = sinon.spy();
      
      modal.show({
        title: 'Test',
        message: 'Test',
        hasInput: true,
        buttons: [
          { label: 'OK', callback, type: 'primary' }
        ]
      });
      
      const result = modal.handleKeyPress('Enter');
      
      expect(result).to.be.true;
      expect(callback.calledOnce).to.be.true;
    });
    
    it('should handle Escape key to cancel', function() {
      const onConfirm = sinon.spy();
      const onCancel = sinon.spy();
      
      modal.show({
        title: 'Test',
        message: 'Test',
        buttons: [
          { label: 'Cancel', callback: onCancel, type: 'secondary' },
          { label: 'OK', callback: onConfirm, type: 'primary' }
        ]
      });
      
      const result = modal.handleKeyPress('Escape');
      
      expect(result).to.be.true;
      expect(onCancel.calledOnce).to.be.true;
      expect(onConfirm.called).to.be.false;
    });
    
    it('should update input value on text input', function() {
      modal.show({
        title: 'Test',
        message: 'Test',
        hasInput: true,
        inputValue: ''
      });
      
      modal.handleTextInput('Test');
      expect(modal.inputValue).to.equal('Test');
      
      modal.handleTextInput('ing');
      expect(modal.inputValue).to.equal('Testing');
    });
    
    it('should handle backspace to delete characters', function() {
      modal.show({
        title: 'Test',
        message: 'Test',
        hasInput: true,
        inputValue: 'Hello'
      });
      
      modal.handleKeyPress('Backspace');
      expect(modal.inputValue).to.equal('Hell');
      
      modal.handleKeyPress('Backspace');
      expect(modal.inputValue).to.equal('Hel');
    });
  });
  
  describe('Input Validation', function() {
    it('should validate empty input when required', function() {
      modal.show({
        title: 'Test',
        message: 'Test',
        hasInput: true,
        inputValue: '',
        validateInput: (value) => value.trim().length > 0
      });
      
      const isValid = modal.validateInput();
      expect(isValid).to.be.false;
    });
    
    it('should validate input with custom validator', function() {
      modal.show({
        title: 'Test',
        message: 'Test',
        hasInput: true,
        inputValue: 'Test Name',
        validateInput: (value) => value.length >= 3
      });
      
      const isValid = modal.validateInput();
      expect(isValid).to.be.true;
    });
    
    it('should prevent confirmation with invalid input', function() {
      const callback = sinon.spy();
      
      modal.show({
        title: 'Test',
        message: 'Test',
        hasInput: true,
        inputValue: '',
        validateInput: (value) => value.trim().length > 0,
        buttons: [
          { label: 'OK', callback, type: 'primary' }
        ]
      });
      
      // Try to confirm with empty input
      modal.handleKeyPress('Enter');
      
      expect(callback.called).to.be.false; // Should not call callback
      expect(modal.isVisible()).to.be.true; // Should remain visible
    });
    
    it('should show validation error message', function() {
      modal.show({
        title: 'Test',
        message: 'Test',
        hasInput: true,
        inputValue: '',
        validateInput: (value) => value.trim().length > 0,
        validationError: 'Name cannot be empty'
      });
      
      modal.validateInput();
      
      expect(modal.errorMessage).to.equal('Name cannot be empty');
    });
  });
  
  describe('Rendering', function() {
    it('should not render when hidden', function() {
      modal.hide();
      
      global.rect.resetHistory();
      modal.render();
      
      // Should not draw any rectangles
      expect(global.rect.called).to.be.false;
    });
    
    it('should render overlay when visible', function() {
      modal.show({ title: 'Test', message: 'Test' });
      
      global.rect.resetHistory();
      modal.render();
      
      // Should draw at least overlay and modal box
      expect(global.rect.callCount).to.be.at.least(2);
    });
    
    it('should render title and message', function() {
      modal.show({ title: 'Test Title', message: 'Test Message' });
      
      global.text.resetHistory();
      modal.render();
      
      // Should draw title and message
      expect(global.text.called).to.be.true;
      expect(global.text.calledWith('Test Title')).to.be.true;
      expect(global.text.calledWith('Test Message')).to.be.true;
    });
  });
});
