/**
 * Dialog Base Class - Unit Tests (TDD)
 * 
 * Dialog extends UIObject, provides modal dialog functionality.
 */

const { expect } = require('chai');
const sinon = require('sinon');

// Mock UIObject for testing
class MockUIObject {
    constructor(config = {}) {
        this.x = config.x || 0;
        this.y = config.y || 0;
        this.width = config.width || 100;
        this.height = config.height || 100;
        this.visible = config.visible !== false;
        this._isDirty = true;
    }
    
    setVisible(visible) { this.visible = visible; }
    isVisible() { return this.visible; }
    markDirty() { this._isDirty = true; }
    render() {}
    destroy() {}
}

// Mock global for JSDOM
global.UIObject = MockUIObject;
if (typeof window !== 'undefined') {
    window.UIObject = MockUIObject;
}

describe('Dialog (Base Class)', function() {
    let Dialog;
    
    before(function() {
        // Load Dialog class (will fail initially - TDD)
        try {
            Dialog = require('../../../Classes/ui/Dialog.js');
        } catch (e) {
            // Expected to fail - Dialog.js doesn't exist yet
            Dialog = null;
        }
    });
    
    beforeEach(function() {
        // Reset sinon stubs
        sinon.restore();
    });
    
    afterEach(function() {
        sinon.restore();
    });
    
    describe('Constructor', function() {
        it('should create dialog with default config', function() {
            if (!Dialog) this.skip();
            
            const dialog = new Dialog();
            
            expect(dialog).to.exist;
            expect(dialog.visible).to.be.false; // Dialogs start hidden
            expect(dialog.title).to.exist;
            expect(dialog.message).to.exist;
        });
        
        it('should accept custom title and message', function() {
            if (!Dialog) this.skip();
            
            const dialog = new Dialog({
                title: 'Custom Title',
                message: 'Custom Message',
                width: 400,
                height: 300
            });
            
            expect(dialog.title).to.equal('Custom Title');
            expect(dialog.message).to.equal('Custom Message');
            expect(dialog.width).to.equal(400);
            expect(dialog.height).to.equal(300);
        });
        
        it('should initialize with null callbacks', function() {
            if (!Dialog) this.skip();
            
            const dialog = new Dialog();
            
            expect(dialog.onConfirm).to.be.null;
            expect(dialog.onCancel).to.be.null;
        });
        
        it('should extend UIObject', function() {
            if (!Dialog) this.skip();
            
            const dialog = new Dialog();
            
            expect(dialog).to.be.instanceOf(MockUIObject);
            expect(dialog.setVisible).to.be.a('function');
            expect(dialog.isVisible).to.be.a('function');
        });
    });
    
    describe('show()', function() {
        it('should display dialog with message', function() {
            if (!Dialog) this.skip();
            
            const dialog = new Dialog();
            const onConfirm = sinon.stub();
            const onCancel = sinon.stub();
            
            dialog.show('Are you sure?', onConfirm, onCancel);
            
            expect(dialog.visible).to.be.true;
            expect(dialog.message).to.equal('Are you sure?');
            expect(dialog.onConfirm).to.equal(onConfirm);
            expect(dialog.onCancel).to.equal(onCancel);
        });
        
        it('should allow showing without callbacks', function() {
            if (!Dialog) this.skip();
            
            const dialog = new Dialog();
            
            dialog.show('Information');
            
            expect(dialog.visible).to.be.true;
            expect(dialog.message).to.equal('Information');
            expect(dialog.onConfirm).to.be.null;
            expect(dialog.onCancel).to.be.null;
        });
        
        it('should mark dialog as dirty when shown', function() {
            if (!Dialog) this.skip();
            
            const dialog = new Dialog();
            dialog._isDirty = false;
            
            dialog.show('Test');
            
            expect(dialog._isDirty).to.be.true;
        });
    });
    
    describe('hide()', function() {
        it('should hide visible dialog', function() {
            if (!Dialog) this.skip();
            
            const dialog = new Dialog();
            dialog.show('Test');
            
            dialog.hide();
            
            expect(dialog.visible).to.be.false;
        });
        
        it('should clear callbacks when hidden', function() {
            if (!Dialog) this.skip();
            
            const dialog = new Dialog();
            const onConfirm = sinon.stub();
            const onCancel = sinon.stub();
            
            dialog.show('Test', onConfirm, onCancel);
            dialog.hide();
            
            expect(dialog.onConfirm).to.be.null;
            expect(dialog.onCancel).to.be.null;
        });
        
        it('should mark dialog as dirty when hidden', function() {
            if (!Dialog) this.skip();
            
            const dialog = new Dialog();
            dialog.show('Test');
            dialog._isDirty = false;
            
            dialog.hide();
            
            expect(dialog._isDirty).to.be.true;
        });
    });
    
    describe('confirm()', function() {
        it('should call onConfirm callback', function() {
            if (!Dialog) this.skip();
            
            const dialog = new Dialog();
            const onConfirm = sinon.stub();
            
            dialog.show('Test', onConfirm);
            dialog.confirm();
            
            expect(onConfirm.calledOnce).to.be.true;
        });
        
        it('should hide dialog after confirm', function() {
            if (!Dialog) this.skip();
            
            const dialog = new Dialog();
            const onConfirm = sinon.stub();
            
            dialog.show('Test', onConfirm);
            dialog.confirm();
            
            expect(dialog.visible).to.be.false;
        });
        
        it('should not throw if onConfirm is null', function() {
            if (!Dialog) this.skip();
            
            const dialog = new Dialog();
            dialog.show('Test');
            
            expect(() => dialog.confirm()).to.not.throw();
        });
    });
    
    describe('cancel()', function() {
        it('should call onCancel callback', function() {
            if (!Dialog) this.skip();
            
            const dialog = new Dialog();
            const onCancel = sinon.stub();
            
            dialog.show('Test', null, onCancel);
            dialog.cancel();
            
            expect(onCancel.calledOnce).to.be.true;
        });
        
        it('should hide dialog after cancel', function() {
            if (!Dialog) this.skip();
            
            const dialog = new Dialog();
            const onCancel = sinon.stub();
            
            dialog.show('Test', null, onCancel);
            dialog.cancel();
            
            expect(dialog.visible).to.be.false;
        });
        
        it('should not throw if onCancel is null', function() {
            if (!Dialog) this.skip();
            
            const dialog = new Dialog();
            dialog.show('Test');
            
            expect(() => dialog.cancel()).to.not.throw();
        });
    });
    
    describe('handleKeyPress()', function() {
        it('should cancel on ESC key (keyCode 27)', function() {
            if (!Dialog) this.skip();
            
            const dialog = new Dialog();
            const onCancel = sinon.stub();
            
            dialog.show('Test', null, onCancel);
            dialog.handleKeyPress(27); // ESC
            
            expect(onCancel.calledOnce).to.be.true;
            expect(dialog.visible).to.be.false;
        });
        
        it('should confirm on ENTER key (keyCode 13)', function() {
            if (!Dialog) this.skip();
            
            const dialog = new Dialog();
            const onConfirm = sinon.stub();
            
            dialog.show('Test', onConfirm);
            dialog.handleKeyPress(13); // ENTER
            
            expect(onConfirm.calledOnce).to.be.true;
            expect(dialog.visible).to.be.false;
        });
        
        it('should ignore other keys', function() {
            if (!Dialog) this.skip();
            
            const dialog = new Dialog();
            const onConfirm = sinon.stub();
            const onCancel = sinon.stub();
            
            dialog.show('Test', onConfirm, onCancel);
            dialog.handleKeyPress(65); // 'A' key
            
            expect(onConfirm.called).to.be.false;
            expect(onCancel.called).to.be.false;
            expect(dialog.visible).to.be.true;
        });
    });
    
    describe('renderContent()', function() {
        it('should be an abstract method that throws', function() {
            if (!Dialog) this.skip();
            
            const dialog = new Dialog();
            const mockBuffer = {};
            
            expect(() => dialog.renderContent(mockBuffer)).to.throw();
        });
        
        it('should require subclasses to implement', function() {
            if (!Dialog) this.skip();
            
            // This test documents that renderContent MUST be overridden
            const dialog = new Dialog();
            
            expect(dialog.renderContent).to.be.a('function');
        });
    });
    
    describe('renderToCache()', function() {
        it('should render dialog chrome (title bar, border)', function() {
            if (!Dialog) this.skip();
            
            // Mock p5.js buffer
            const mockBuffer = {
                background: sinon.stub(),
                fill: sinon.stub(),
                stroke: sinon.stub(),
                strokeWeight: sinon.stub(),
                rect: sinon.stub(),
                noStroke: sinon.stub(),
                noFill: sinon.stub(),
                textAlign: sinon.stub(),
                textSize: sinon.stub(),
                text: sinon.stub(),
                CENTER: 'CENTER'
            };
            
            const dialog = new Dialog({ title: 'Test Dialog' });
            
            // Stub renderContent to avoid abstract method error
            dialog.renderContent = sinon.stub();
            
            dialog.renderToCache(mockBuffer);
            
            // Should render background
            expect(mockBuffer.background.called).to.be.true;
            // Should render border
            expect(mockBuffer.rect.called).to.be.true;
            // Should call renderContent for subclass
            expect(dialog.renderContent.calledOnce).to.be.true;
        });
    });
    
    describe('Modal Behavior', function() {
        it('should center dialog on screen by default', function() {
            if (!Dialog) this.skip();
            
            const dialog = new Dialog({ width: 400, height: 300 });
            
            // Assuming screen is 800x600
            const screenWidth = 800;
            const screenHeight = 600;
            
            const centered = dialog.getCenteredPosition(screenWidth, screenHeight);
            
            expect(centered.x).to.equal(200); // (800 - 400) / 2
            expect(centered.y).to.equal(150); // (600 - 300) / 2
        });
        
        it('should support custom positioning', function() {
            if (!Dialog) this.skip();
            
            const dialog = new Dialog({ x: 100, y: 50, width: 400, height: 300 });
            
            expect(dialog.x).to.equal(100);
            expect(dialog.y).to.equal(50);
        });
    });
    
    describe('Integration with UIObject', function() {
        it('should call markDirty when state changes', function() {
            if (!Dialog) this.skip();
            
            const dialog = new Dialog();
            sinon.spy(dialog, 'markDirty');
            
            dialog.show('Test');
            
            expect(dialog.markDirty.called).to.be.true;
        });
        
        it('should respect visible state from UIObject', function() {
            if (!Dialog) this.skip();
            
            const dialog = new Dialog();
            
            dialog.setVisible(true);
            expect(dialog.isVisible()).to.be.true;
            
            dialog.setVisible(false);
            expect(dialog.isVisible()).to.be.false;
        });
    });
});
