/**
 * Overlay Base Class - Unit Tests (TDD)
 * 
 * Overlay extends UIObject, provides full-screen overlay functionality.
 */

const { expect } = require('chai');
const sinon = require('sinon');

// Mock UIObject
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

global.UIObject = MockUIObject;
if (typeof window !== 'undefined') {
    window.UIObject = MockUIObject;
}

describe('Overlay (Base Class)', function() {
    let Overlay;
    
    before(function() {
        try {
            Overlay = require('../../../Classes/ui/Overlay.js');
        } catch (e) {
            Overlay = null;
        }
    });
    
    beforeEach(function() {
        sinon.restore();
    });
    
    afterEach(function() {
        sinon.restore();
    });
    
    describe('Constructor', function() {
        it('should create overlay with default config', function() {
            if (!Overlay) this.skip();
            
            const overlay = new Overlay();
            
            expect(overlay).to.exist;
            expect(overlay.visible).to.be.true; // Overlays start visible
            expect(overlay.opacity).to.exist;
        });
        
        it('should accept custom opacity', function() {
            if (!Overlay) this.skip();
            
            const overlay = new Overlay({ opacity: 0.5 });
            
            expect(overlay.opacity).to.equal(0.5);
        });
        
        it('should extend UIObject', function() {
            if (!Overlay) this.skip();
            
            const overlay = new Overlay();
            
            expect(overlay).to.be.instanceOf(MockUIObject);
        });
    });
    
    describe('toggle()', function() {
        it('should toggle visibility on', function() {
            if (!Overlay) this.skip();
            
            const overlay = new Overlay();
            overlay.setVisible(false);
            
            const result = overlay.toggle();
            
            expect(overlay.visible).to.be.true;
            expect(result).to.be.true;
        });
        
        it('should toggle visibility off', function() {
            if (!Overlay) this.skip();
            
            const overlay = new Overlay();
            overlay.setVisible(true);
            
            const result = overlay.toggle();
            
            expect(overlay.visible).to.be.false;
            expect(result).to.be.false;
        });
        
        it('should return new visibility state', function() {
            if (!Overlay) this.skip();
            
            const overlay = new Overlay();
            overlay.setVisible(false);
            
            expect(overlay.toggle()).to.be.true;
            expect(overlay.toggle()).to.be.false;
        });
        
        it('should mark overlay as dirty when toggled', function() {
            if (!Overlay) this.skip();
            
            const overlay = new Overlay();
            overlay._isDirty = false;
            
            overlay.toggle();
            
            expect(overlay._isDirty).to.be.true;
        });
    });
    
    describe('setOpacity()', function() {
        it('should set opacity value', function() {
            if (!Overlay) this.skip();
            
            const overlay = new Overlay();
            
            overlay.setOpacity(0.7);
            
            expect(overlay.opacity).to.equal(0.7);
        });
        
        it('should clamp opacity to 0-1 range (min)', function() {
            if (!Overlay) this.skip();
            
            const overlay = new Overlay();
            
            overlay.setOpacity(-0.5);
            
            expect(overlay.opacity).to.equal(0);
        });
        
        it('should clamp opacity to 0-1 range (max)', function() {
            if (!Overlay) this.skip();
            
            const overlay = new Overlay();
            
            overlay.setOpacity(1.5);
            
            expect(overlay.opacity).to.equal(1);
        });
        
        it('should mark overlay as dirty when opacity changes', function() {
            if (!Overlay) this.skip();
            
            const overlay = new Overlay();
            overlay._isDirty = false;
            
            overlay.setOpacity(0.5);
            
            expect(overlay._isDirty).to.be.true;
        });
    });
    
    describe('getOpacity()', function() {
        it('should return current opacity', function() {
            if (!Overlay) this.skip();
            
            const overlay = new Overlay({ opacity: 0.8 });
            
            expect(overlay.getOpacity()).to.equal(0.8);
        });
    });
    
    describe('Integration with UIObject', function() {
        it('should respect visible state from UIObject', function() {
            if (!Overlay) this.skip();
            
            const overlay = new Overlay();
            
            overlay.setVisible(false);
            expect(overlay.isVisible()).to.be.false;
            
            overlay.setVisible(true);
            expect(overlay.isVisible()).to.be.true;
        });
        
        it('should call markDirty when state changes', function() {
            if (!Overlay) this.skip();
            
            const overlay = new Overlay();
            sinon.spy(overlay, 'markDirty');
            
            overlay.toggle();
            
            expect(overlay.markDirty.called).to.be.true;
        });
    });
});
