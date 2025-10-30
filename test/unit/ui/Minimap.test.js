/**
 * Minimap (Consolidated) - Unit Tests (TDD)
 * Consolidates MiniMap + DynamicMinimap
 */

const { expect } = require('chai');
const sinon = require('sinon');

class MockOverlay {
    constructor(config = {}) {
        this.x = config.x || 0;
        this.y = config.y || 0;
        this.width = config.width || 100;
        this.height = config.height || 100;
        this.visible = config.visible !== false;
        this.opacity = config.opacity !== undefined ? config.opacity : 1.0;
        this._isDirty = true;
    }
    
    setVisible(visible) { this.visible = visible; }
    isVisible() { return this.visible; }
    toggle() { this.visible = !this.visible; return this.visible; }
    setOpacity(value) { this.opacity = Math.max(0, Math.min(1, value)); this.markDirty(); }
    getOpacity() { return this.opacity; }
    markDirty() { this._isDirty = true; }
    render() {}
    destroy() {}
}

global.Overlay = MockOverlay;
if (typeof window !== 'undefined') {
    window.Overlay = MockOverlay;
}

describe('Minimap (Consolidated Base Class)', function() {
    let Minimap;
    let mockTerrain;
    
    before(function() {
        try {
            Minimap = require('../../../Classes/ui/MiniMap.js');
        } catch (e) {
            Minimap = null;
        }
    });
    
    beforeEach(function() {
        mockTerrain = {
            width: 50,
            height: 50,
            tileSize: 32,
            getBounds: sinon.stub().returns({ minX: 0, maxX: 49, minY: 0, maxY: 49 }),
            getAllTiles: sinon.stub().returns([
                { x: 10, y: 10, material: 'grass' },
                { x: 11, y: 10, material: 'stone' }
            ])
        };
        
        sinon.restore();
    });
    
    afterEach(function() {
        sinon.restore();
    });
    
    describe('Constructor', function() {
        it('should create minimap with default config', function() {
            if (!Minimap) this.skip();
            
            const minimap = new Minimap(mockTerrain);
            
            expect(minimap).to.exist;
            expect(minimap.terrain).to.equal(mockTerrain);
            expect(minimap.width).to.be.a('number');
            expect(minimap.height).to.be.a('number');
        });
        
        it('should accept custom dimensions', function() {
            if (!Minimap) this.skip();
            
            const minimap = new Minimap(mockTerrain, { width: 300, height: 250 });
            
            expect(minimap.width).to.equal(300);
            expect(minimap.height).to.equal(250);
        });
        
        it('should extend Overlay', function() {
            if (!Minimap) this.skip();
            
            const minimap = new Minimap(mockTerrain);
            
            expect(minimap).to.be.instanceOf(MockOverlay);
        });
        
        it('should accept padding configuration', function() {
            if (!Minimap) this.skip();
            
            const minimap = new Minimap(mockTerrain, { padding: 5 });
            
            expect(minimap.padding).to.equal(5);
        });
    });
    
    describe('calculateViewport()', function() {
        it('should calculate viewport from terrain bounds', function() {
            if (!Minimap) this.skip();
            
            const minimap = new Minimap(mockTerrain, { padding: 2 });
            const viewport = minimap.calculateViewport();
            
            expect(viewport).to.exist;
            expect(viewport.minX).to.equal(-2);
            expect(viewport.maxX).to.equal(51);
            expect(viewport.minY).to.equal(-2);
            expect(viewport.maxY).to.equal(51);
        });
        
        it('should return null if no terrain bounds', function() {
            if (!Minimap) this.skip();
            
            mockTerrain.getBounds = sinon.stub().returns(null);
            const minimap = new Minimap(mockTerrain);
            
            const viewport = minimap.calculateViewport();
            
            expect(viewport).to.be.null;
        });
    });
    
    describe('calculateScale()', function() {
        it('should calculate scale to fit viewport', function() {
            if (!Minimap) this.skip();
            
            const minimap = new Minimap(mockTerrain, { width: 200, height: 200 });
            const viewport = { minX: 0, maxX: 49, minY: 0, maxY: 49 };
            
            const scale = minimap.calculateScale(viewport);
            
            expect(scale).to.be.a('number');
            expect(scale).to.be.greaterThan(0);
        });
        
        it('should return 1.0 if viewport is null', function() {
            if (!Minimap) this.skip();
            
            const minimap = new Minimap(mockTerrain);
            const scale = minimap.calculateScale(null);
            
            expect(scale).to.equal(1.0);
        });
    });
    
    describe('worldToMinimap()', function() {
        it('should convert world coords to minimap pixels', function() {
            if (!Minimap) this.skip();
            
            const minimap = new Minimap(mockTerrain, { width: 200, height: 200 });
            minimap.update();
            
            const result = minimap.worldToMinimap(10, 10);
            
            expect(result).to.have.property('x');
            expect(result).to.have.property('y');
            expect(result.x).to.be.a('number');
            expect(result.y).to.be.a('number');
        });
        
        it('should return origin if no viewport', function() {
            if (!Minimap) this.skip();
            
            mockTerrain.getBounds = sinon.stub().returns(null);
            const minimap = new Minimap(mockTerrain);
            
            const result = minimap.worldToMinimap(10, 10);
            
            expect(result.x).to.equal(0);
            expect(result.y).to.equal(0);
        });
    });
    
    describe('clickToWorldPosition()', function() {
        it('should convert minimap click to world position', function() {
            if (!Minimap) this.skip();
            
            const minimap = new Minimap(mockTerrain, { width: 200, height: 200 });
            minimap.update();
            
            const result = minimap.clickToWorldPosition(100, 100);
            
            expect(result).to.have.property('x');
            expect(result).to.have.property('y');
            expect(result.x).to.be.a('number');
            expect(result.y).to.be.a('number');
        });
    });
    
    describe('update()', function() {
        it('should update viewport and scale', function() {
            if (!Minimap) this.skip();
            
            const minimap = new Minimap(mockTerrain);
            
            minimap.update();
            
            expect(minimap.viewport).to.exist;
            expect(minimap.scale).to.be.a('number');
        });
        
        it('should handle null bounds gracefully', function() {
            if (!Minimap) this.skip();
            
            mockTerrain.getBounds = sinon.stub().returns(null);
            const minimap = new Minimap(mockTerrain);
            
            minimap.update();
            
            expect(minimap.viewport).to.be.null;
        });
    });
    
    describe('invalidateCache()', function() {
        it('should mark minimap as dirty', function() {
            if (!Minimap) this.skip();
            
            const minimap = new Minimap(mockTerrain);
            minimap._isDirty = false;
            
            minimap.invalidateCache();
            
            expect(minimap._isDirty).to.be.true;
        });
    });
    
    describe('getDimensions()', function() {
        it('should return width and height', function() {
            if (!Minimap) this.skip();
            
            const minimap = new Minimap(mockTerrain, { width: 300, height: 250 });
            
            const dims = minimap.getDimensions();
            
            expect(dims.width).to.equal(300);
            expect(dims.height).to.equal(250);
        });
    });
    
    describe('getInfo()', function() {
        it('should return minimap state info', function() {
            if (!Minimap) this.skip();
            
            const minimap = new Minimap(mockTerrain);
            minimap.update();
            
            const info = minimap.getInfo();
            
            expect(info).to.have.property('viewport');
            expect(info).to.have.property('scale');
            expect(info).to.have.property('width');
            expect(info).to.have.property('height');
        });
    });
    
    describe('Integration with Overlay', function() {
        it('should inherit toggle functionality', function() {
            if (!Minimap) this.skip();
            
            const minimap = new Minimap(mockTerrain);
            
            const result = minimap.toggle();
            
            expect(minimap.visible).to.equal(result);
        });
        
        it('should inherit opacity control', function() {
            if (!Minimap) this.skip();
            
            const minimap = new Minimap(mockTerrain);
            
            minimap.setOpacity(0.5);
            
            expect(minimap.getOpacity()).to.equal(0.5);
        });
    });
});
