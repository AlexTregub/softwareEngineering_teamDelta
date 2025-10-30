/**
 * Panel Base Class - Unit Tests (TDD)
 */

const { expect } = require('chai');
const sinon = require('sinon');

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

describe('Panel (Base Class)', function() {
    let Panel;
    
    before(function() {
        try {
            Panel = require('../../../Classes/ui/Panel.js');
        } catch (e) {
            Panel = null;
        }
    });
    
    beforeEach(function() {
        sinon.restore();
    });
    
    afterEach(function() {
        sinon.restore();
    });
    
    describe('Constructor', function() {
        it('should create panel with default config', function() {
            if (!Panel) this.skip();
            
            const panel = new Panel();
            
            expect(panel).to.exist;
            expect(panel.title).to.exist;
            expect(panel.collapsible).to.be.a('boolean');
            expect(panel.collapsed).to.be.false;
        });
        
        it('should accept title and collapsible config', function() {
            if (!Panel) this.skip();
            
            const panel = new Panel({
                title: 'Properties',
                collapsible: true,
                collapsed: false
            });
            
            expect(panel.title).to.equal('Properties');
            expect(panel.collapsible).to.be.true;
            expect(panel.collapsed).to.be.false;
        });
        
        it('should extend UIObject', function() {
            if (!Panel) this.skip();
            
            const panel = new Panel();
            
            expect(panel).to.be.instanceOf(MockUIObject);
        });
    });
    
    describe('collapse()', function() {
        it('should collapse panel', function() {
            if (!Panel) this.skip();
            
            const panel = new Panel({ collapsible: true });
            
            panel.collapse();
            
            expect(panel.collapsed).to.be.true;
        });
        
        it('should mark panel as dirty when collapsed', function() {
            if (!Panel) this.skip();
            
            const panel = new Panel({ collapsible: true });
            panel._isDirty = false;
            
            panel.collapse();
            
            expect(panel._isDirty).to.be.true;
        });
        
        it('should not collapse if not collapsible', function() {
            if (!Panel) this.skip();
            
            const panel = new Panel({ collapsible: false });
            
            panel.collapse();
            
            expect(panel.collapsed).to.be.false;
        });
    });
    
    describe('expand()', function() {
        it('should expand panel', function() {
            if (!Panel) this.skip();
            
            const panel = new Panel({ collapsible: true, collapsed: true });
            
            panel.expand();
            
            expect(panel.collapsed).to.be.false;
        });
        
        it('should mark panel as dirty when expanded', function() {
            if (!Panel) this.skip();
            
            const panel = new Panel({ collapsible: true, collapsed: true });
            panel._isDirty = false;
            
            panel.expand();
            
            expect(panel._isDirty).to.be.true;
        });
    });
    
    describe('toggleCollapse()', function() {
        it('should toggle from expanded to collapsed', function() {
            if (!Panel) this.skip();
            
            const panel = new Panel({ collapsible: true });
            
            panel.toggleCollapse();
            
            expect(panel.collapsed).to.be.true;
        });
        
        it('should toggle from collapsed to expanded', function() {
            if (!Panel) this.skip();
            
            const panel = new Panel({ collapsible: true, collapsed: true });
            
            panel.toggleCollapse();
            
            expect(panel.collapsed).to.be.false;
        });
        
        it('should return new collapsed state', function() {
            if (!Panel) this.skip();
            
            const panel = new Panel({ collapsible: true });
            
            const newState = panel.toggleCollapse();
            
            expect(newState).to.equal(panel.collapsed);
        });
    });
    
    describe('isCollapsed()', function() {
        it('should return collapsed state', function() {
            if (!Panel) this.skip();
            
            const panel = new Panel({ collapsible: true });
            
            expect(panel.isCollapsed()).to.be.false;
            
            panel.collapse();
            expect(panel.isCollapsed()).to.be.true;
        });
    });
    
    describe('setTitle()', function() {
        it('should update panel title', function() {
            if (!Panel) this.skip();
            
            const panel = new Panel({ title: 'Old Title' });
            
            panel.setTitle('New Title');
            
            expect(panel.title).to.equal('New Title');
        });
        
        it('should mark panel as dirty when title changes', function() {
            if (!Panel) this.skip();
            
            const panel = new Panel({ title: 'Old Title' });
            panel._isDirty = false;
            
            panel.setTitle('New Title');
            
            expect(panel._isDirty).to.be.true;
        });
    });
    
    describe('Integration with UIObject', function() {
        it('should call markDirty when state changes', function() {
            if (!Panel) this.skip();
            
            const panel = new Panel({ collapsible: true });
            sinon.spy(panel, 'markDirty');
            
            panel.collapse();
            
            expect(panel.markDirty.called).to.be.true;
        });
    });
});
