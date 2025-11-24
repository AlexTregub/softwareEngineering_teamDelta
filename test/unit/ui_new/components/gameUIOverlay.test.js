/**
 * Unit Tests for GameUIOverlay
 * TDD: Tests written FIRST before implementation
 */

const { expect } = require('chai');
const sinon = require('sinon');

describe('GameUIOverlay', function() {
    let GameUIOverlay;
    let overlay;
    let mockP5;
    let sandbox;
    
    beforeEach(function() {
        sandbox = sinon.createSandbox();
        
        // Mock p5 instance
        mockP5 = {
            width: 800,
            height: 600,
            push: sandbox.stub(),
            pop: sandbox.stub(),
            fill: sandbox.stub(),
            rect: sandbox.stub(),
            text: sandbox.stub()
        };
        
        // Mock global p5 functions
        global.push = mockP5.push;
        global.pop = mockP5.pop;
        global.fill = mockP5.fill;
        global.rect = mockP5.rect;
        global.text = mockP5.text;
        
        // Load module
        delete require.cache[require.resolve('../../../../Classes/ui_new/components/gameUIOverlay')];
        GameUIOverlay = require('../../../../Classes/ui_new/components/gameUIOverlay');
    });
    
    afterEach(function() {
        if (overlay) {
            overlay.destroy();
            overlay = null;
        }
        sandbox.restore();
        delete global.push;
        delete global.pop;
        delete global.fill;
        delete global.rect;
        delete global.text;
    });
    
    describe('Constructor', function() {
        it('should create overlay with default options', function() {
            overlay = new GameUIOverlay(mockP5);
            
            expect(overlay.p5).to.equal(mockP5);
            expect(overlay.components).to.be.a('map');
            expect(overlay.components.size).to.equal(0);
        });
        
        it('should initialize with visible state', function() {
            overlay = new GameUIOverlay(mockP5);
            
            expect(overlay.isVisible).to.be.true;
        });
    });
    
    describe('Component Management', function() {
        beforeEach(function() {
            overlay = new GameUIOverlay(mockP5);
        });
        
        it('should add component', function() {
            const mockComponent = {
                id: 'test-component',
                render: sandbox.stub()
            };
            
            overlay.addComponent('test', mockComponent);
            
            expect(overlay.components.has('test')).to.be.true;
            expect(overlay.components.get('test')).to.equal(mockComponent);
        });
        
        it('should get component by id', function() {
            const mockComponent = {
                id: 'test-component',
                render: sandbox.stub()
            };
            
            overlay.addComponent('test', mockComponent);
            
            const retrieved = overlay.getComponent('test');
            expect(retrieved).to.equal(mockComponent);
        });
        
        it('should remove component', function() {
            const mockComponent = {
                id: 'test-component',
                render: sandbox.stub(),
                destroy: sandbox.stub()
            };
            
            overlay.addComponent('test', mockComponent);
            overlay.removeComponent('test');
            
            expect(overlay.components.has('test')).to.be.false;
            expect(mockComponent.destroy.calledOnce).to.be.true;
        });
        
        it('should return null for non-existent component', function() {
            const retrieved = overlay.getComponent('nonexistent');
            
            expect(retrieved).to.be.null;
        });
    });
    
    describe('Visibility', function() {
        beforeEach(function() {
            overlay = new GameUIOverlay(mockP5);
        });
        
        it('should show overlay', function() {
            overlay.hide();
            overlay.show();
            
            expect(overlay.isVisible).to.be.true;
        });
        
        it('should hide overlay', function() {
            overlay.show();
            overlay.hide();
            
            expect(overlay.isVisible).to.be.false;
        });
        
        it('should toggle visibility', function() {
            const initialState = overlay.isVisible;
            overlay.toggle();
            
            expect(overlay.isVisible).to.equal(!initialState);
        });
    });
    
    describe('Rendering', function() {
        beforeEach(function() {
            overlay = new GameUIOverlay(mockP5);
        });
        
        it('should not render when hidden', function() {
            const mockComponent = {
                id: 'test',
                render: sandbox.stub()
            };
            
            overlay.addComponent('test', mockComponent);
            overlay.hide();
            overlay.render();
            
            expect(mockComponent.render.called).to.be.false;
        });
        
        it('should render all components when visible', function() {
            const component1 = { id: 'c1', render: sandbox.stub() };
            const component2 = { id: 'c2', render: sandbox.stub() };
            
            overlay.addComponent('c1', component1);
            overlay.addComponent('c2', component2);
            overlay.show();
            overlay.render();
            
            expect(component1.render.calledOnce).to.be.true;
            expect(component2.render.calledOnce).to.be.true;
        });
        
        it('should call update on components with update method', function() {
            const component = {
                id: 'test',
                render: sandbox.stub(),
                update: sandbox.stub()
            };
            
            overlay.addComponent('test', component);
            overlay.render();
            
            expect(component.update.calledOnce).to.be.true;
        });
    });
    
    describe('Cleanup', function() {
        it('should destroy all components', function() {
            overlay = new GameUIOverlay(mockP5);
            
            const component1 = { id: 'c1', render: sandbox.stub(), destroy: sandbox.stub() };
            const component2 = { id: 'c2', render: sandbox.stub(), destroy: sandbox.stub() };
            
            overlay.addComponent('c1', component1);
            overlay.addComponent('c2', component2);
            overlay.destroy();
            
            expect(component1.destroy.calledOnce).to.be.true;
            expect(component2.destroy.calledOnce).to.be.true;
            expect(overlay.components.size).to.equal(0);
        });
    });
});
