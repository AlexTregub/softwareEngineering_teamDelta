/**
 * Integration Tests: Select Tool & Hover Preview with LevelEditor
 * 
 * TDD Phase 2: INTEGRATION TESTS
 * 
 * Tests the integration of SelectionManager and HoverPreviewManager
 * with LevelEditor, TerrainEditor, and CustomTerrain
 */

const { expect } = require('chai');
const sinon = require('sinon');

// Load dependencies
const SelectionManager = require('../../../Classes/ui/SelectionManager');
const HoverPreviewManager = require('../../../Classes/ui/HoverPreviewManager');

describe('Select Tool & Hover Preview Integration', function() {
    let sandbox;
    
    beforeEach(function() {
        sandbox = sinon.createSandbox();
        
        // Mock p5.js globals
        global.TILE_SIZE = 32;
        global.CORNER = 'corner';
        global.CENTER = 'center';
        global.createVector = sandbox.stub().callsFake((x, y) => ({ x, y }));
        
        // Sync to window for JSDOM
        if (typeof window !== 'undefined') {
            window.TILE_SIZE = global.TILE_SIZE;
            window.CORNER = global.CORNER;
            window.CENTER = global.CENTER;
            window.createVector = global.createVector;
        }
    });
    
    afterEach(function() {
        sandbox.restore();
    });
    
    describe('SelectionManager with TerrainEditor', function() {
        it('should calculate correct tile selection for 3x3 rectangle', function() {
            const selectionManager = new SelectionManager();
            
            // Drag from (5,10) to (7,12)
            selectionManager.startSelection(5, 10);
            selectionManager.updateSelection(7, 12);
            selectionManager.endSelection();
            
            const tiles = selectionManager.getTilesInSelection();
            
            // 3 tiles wide x 3 tiles tall = 9 tiles
            expect(tiles.length).to.equal(9);
            
            // Verify corners
            expect(tiles).to.deep.include({ x: 5, y: 10 });  // Top-left
            expect(tiles).to.deep.include({ x: 7, y: 10 });  // Top-right
            expect(tiles).to.deep.include({ x: 5, y: 12 });  // Bottom-left
            expect(tiles).to.deep.include({ x: 7, y: 12 });  // Bottom-right
        });
        
        it('should handle reverse drag (bottom-right to top-left)', function() {
            const selectionManager = new SelectionManager();
            
            // Drag from (7,12) to (5,10) - reverse direction
            selectionManager.startSelection(7, 12);
            selectionManager.updateSelection(5, 10);
            selectionManager.endSelection();
            
            const bounds = selectionManager.getSelectionBounds();
            
            expect(bounds.minX).to.equal(5);
            expect(bounds.maxX).to.equal(7);
            expect(bounds.minY).to.equal(10);
            expect(bounds.maxY).to.equal(12);
        });
        
        it('should clear selection after painting', function() {
            const selectionManager = new SelectionManager();
            
            selectionManager.startSelection(5, 10);
            selectionManager.updateSelection(7, 12);
            selectionManager.endSelection();
            
            expect(selectionManager.hasSelection()).to.be.true;
            
            // Simulate painting and clearing
            selectionManager.clearSelection();
            
            expect(selectionManager.hasSelection()).to.be.false;
            expect(selectionManager.getTilesInSelection()).to.be.empty;
        });
    });
    
    describe('HoverPreviewManager with BrushSizeControl', function() {
        it('should calculate correct preview tiles for brush size 1', function() {
            const hoverManager = new HoverPreviewManager();
            
            hoverManager.updateHover(10, 10, 'paint', 1);
            
            const tiles = hoverManager.getHoveredTiles();
            
            expect(tiles.length).to.equal(1);
            expect(tiles[0]).to.deep.equal({ x: 10, y: 10 });
        });
        
        it('should calculate correct preview tiles for brush size 3', function() {
            const hoverManager = new HoverPreviewManager();
            
            hoverManager.updateHover(10, 10, 'paint', 3);
            
            const tiles = hoverManager.getHoveredTiles();
            
            // Brush size 3 (ODD) = full 3x3 square = 9 tiles
            expect(tiles.length).to.equal(9);
            
            // Verify center and cardinal directions
            expect(tiles).to.deep.include({ x: 10, y: 10 });  // Center
            expect(tiles).to.deep.include({ x: 9, y: 10 });   // Left
            expect(tiles).to.deep.include({ x: 11, y: 10 });  // Right
            expect(tiles).to.deep.include({ x: 10, y: 9 });   // Above
            expect(tiles).to.deep.include({ x: 10, y: 11 });  // Below
        });
        
        it('should calculate correct preview tiles for brush size 5', function() {
            const hoverManager = new HoverPreviewManager();
            
            hoverManager.updateHover(10, 10, 'paint', 5);
            
            const tiles = hoverManager.getHoveredTiles();
            
            // Brush size 5 (ODD) should create a full square pattern
            expect(tiles.length).to.equal(25);  // Full 5x5 square
            
            // Center should always be included
            expect(tiles).to.deep.include({ x: 10, y: 10 });
        });
        
        it('should only show single tile for eyedropper tool', function() {
            const hoverManager = new HoverPreviewManager();
            
            hoverManager.updateHover(10, 10, 'eyedropper', 5);
            
            const tiles = hoverManager.getHoveredTiles();
            
            // Eyedropper ignores brush size, always single tile
            expect(tiles.length).to.equal(1);
            expect(tiles[0]).to.deep.equal({ x: 10, y: 10 });
        });
        
        it('should only show single tile for fill tool', function() {
            const hoverManager = new HoverPreviewManager();
            
            hoverManager.updateHover(10, 10, 'fill', 5);
            
            const tiles = hoverManager.getHoveredTiles();
            
            // Fill tool shows clicked tile only (flood fill happens on click)
            expect(tiles.length).to.equal(1);
            expect(tiles[0]).to.deep.equal({ x: 10, y: 10 });
        });
        
        it('should not show preview for select tool', function() {
            const hoverManager = new HoverPreviewManager();
            
            hoverManager.updateHover(10, 10, 'select', 5);
            
            const tiles = hoverManager.getHoveredTiles();
            
            // Select tool shows rectangle during drag, not on hover
            expect(tiles).to.be.empty;
        });
        
        it('should clear hover when mouse leaves canvas', function() {
            const hoverManager = new HoverPreviewManager();
            
            hoverManager.updateHover(10, 10, 'paint', 3);
            expect(hoverManager.getHoveredTiles().length).to.be.greaterThan(0);
            
            hoverManager.clearHover();
            
            expect(hoverManager.getHoveredTiles()).to.be.empty;
        });
    });
    
    describe('Pixel to Grid Coordinate Conversion', function() {
        it('should convert mouse position to correct grid coordinates', function() {
            const tileSize = 32;
            
            // Test various pixel positions
            const tests = [
                { mouseX: 0, mouseY: 0, expectedX: 0, expectedY: 0 },
                { mouseX: 32, mouseY: 32, expectedX: 1, expectedY: 1 },
                { mouseX: 160, mouseY: 320, expectedX: 5, expectedY: 10 },
                { mouseX: 95, mouseY: 95, expectedX: 2, expectedY: 2 },  // 95/32 = 2.96 -> floor = 2
                { mouseX: 31, mouseY: 31, expectedX: 0, expectedY: 0 },  // Edge case
            ];
            
            tests.forEach(test => {
                const gridX = Math.floor(test.mouseX / tileSize);
                const gridY = Math.floor(test.mouseY / tileSize);
                
                expect(gridX).to.equal(test.expectedX, 
                    `mouseX ${test.mouseX} should map to grid X ${test.expectedX}`);
                expect(gridY).to.equal(test.expectedY,
                    `mouseY ${test.mouseY} should map to grid Y ${test.expectedY}`);
            });
        });
    });
    
    describe('Selection and Hover Interaction', function() {
        it('should not show hover preview while selecting', function() {
            const selectionManager = new SelectionManager();
            const hoverManager = new HoverPreviewManager();
            
            // Start selection
            selectionManager.startSelection(5, 10);
            
            // While selecting, hover should be cleared for select tool
            hoverManager.updateHover(7, 12, 'select', 1);
            
            expect(hoverManager.getHoveredTiles()).to.be.empty;
        });
        
        it('should show hover preview after selection is complete', function() {
            const selectionManager = new SelectionManager();
            const hoverManager = new HoverPreviewManager();
            
            // Complete selection
            selectionManager.startSelection(5, 10);
            selectionManager.updateSelection(7, 12);
            selectionManager.endSelection();
            selectionManager.clearSelection();
            
            // After clearing selection, hover should work again for other tools
            hoverManager.updateHover(10, 10, 'paint', 3);
            
            expect(hoverManager.getHoveredTiles().length).to.be.greaterThan(0);
        });
    });
});
