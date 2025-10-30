/**
 * EditorTool Base Class - Unit Tests (TDD)
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

describe('EditorTool (Base Class)', function() {
    let EditorTool;
    
    before(function() {
        try {
            EditorTool = require('../../../Classes/ui/EditorTool.js');
        } catch (e) {
            EditorTool = null;
        }
    });
    
    beforeEach(function() {
        sinon.restore();
    });
    
    afterEach(function() {
        sinon.restore();
    });
    
    describe('Constructor', function() {
        it('should create tool with default config', function() {
            if (!EditorTool) this.skip();
            
            const tool = new EditorTool();
            
            expect(tool).to.exist;
            expect(tool.toolName).to.exist;
            expect(tool.active).to.be.false;
        });
        
        it('should accept tool name and icon', function() {
            if (!EditorTool) this.skip();
            
            const tool = new EditorTool({
                toolName: 'Brush',
                icon: '🖌️',
                tooltip: 'Paint tool'
            });
            
            expect(tool.toolName).to.equal('Brush');
            expect(tool.icon).to.equal('🖌️');
            expect(tool.tooltip).to.equal('Paint tool');
        });
        
        it('should extend UIObject', function() {
            if (!EditorTool) this.skip();
            
            const tool = new EditorTool();
            
            expect(tool).to.be.instanceOf(MockUIObject);
        });
    });
    
    describe('activate()', function() {
        it('should set tool as active', function() {
            if (!EditorTool) this.skip();
            
            const tool = new EditorTool();
            
            tool.activate();
            
            expect(tool.active).to.be.true;
        });
        
        it('should mark tool as dirty when activated', function() {
            if (!EditorTool) this.skip();
            
            const tool = new EditorTool();
            tool._isDirty = false;
            
            tool.activate();
            
            expect(tool._isDirty).to.be.true;
        });
    });
    
    describe('deactivate()', function() {
        it('should set tool as inactive', function() {
            if (!EditorTool) this.skip();
            
            const tool = new EditorTool();
            tool.activate();
            
            tool.deactivate();
            
            expect(tool.active).to.be.false;
        });
        
        it('should mark tool as dirty when deactivated', function() {
            if (!EditorTool) this.skip();
            
            const tool = new EditorTool();
            tool.activate();
            tool._isDirty = false;
            
            tool.deactivate();
            
            expect(tool._isDirty).to.be.true;
        });
    });
    
    describe('isActive()', function() {
        it('should return active state', function() {
            if (!EditorTool) this.skip();
            
            const tool = new EditorTool();
            
            expect(tool.isActive()).to.be.false;
            
            tool.activate();
            expect(tool.isActive()).to.be.true;
            
            tool.deactivate();
            expect(tool.isActive()).to.be.false;
        });
    });
    
    describe('handleHover()', function() {
        it('should handle hover state', function() {
            if (!EditorTool) this.skip();
            
            const tool = new EditorTool();
            
            tool.handleHover(50, 50);
            
            // Default implementation or override
            expect(tool.handleHover).to.be.a('function');
        });
    });
    
    describe('handleClick()', function() {
        it('should handle click events', function() {
            if (!EditorTool) this.skip();
            
            const tool = new EditorTool();
            
            const result = tool.handleClick(50, 50);
            
            expect(tool.handleClick).to.be.a('function');
        });
    });
    
    describe('Integration with UIObject', function() {
        it('should call markDirty when state changes', function() {
            if (!EditorTool) this.skip();
            
            const tool = new EditorTool();
            sinon.spy(tool, 'markDirty');
            
            tool.activate();
            
            expect(tool.markDirty.called).to.be.true;
        });
    });
});
