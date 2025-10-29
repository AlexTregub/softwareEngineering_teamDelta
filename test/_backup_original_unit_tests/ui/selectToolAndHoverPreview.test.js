/**
 * Unit Tests: Select Tool Rectangle Selection & Hover Preview
 * 
 * TDD Phase 1: UNIT TESTS (Write tests FIRST)
 * 
 * FEATURES TO IMPLEMENT:
 * 1. Select Tool: Click-drag rectangle, paint all tiles under it
 * 2. Hover Preview: Highlight tiles that will be affected by any tool
 * 
 * TEST STRUCTURE:
 * - SelectionManager: Handles rectangle selection state
 * - HoverPreviewManager: Calculates affected tiles for preview
 */

const { expect } = require('chai');
const sinon = require('sinon');
const SelectionManager = require('../../../Classes/ui/SelectionManager');
const HoverPreviewManager = require('../../../Classes/ui/HoverPreviewManager');

describe('Select Tool & Hover Preview (Unit Tests)', function() {
    
    describe('SelectionManager', function() {
        
        describe('Selection State', function() {
            it('should start with no selection', function() {
                const manager = new SelectionManager();
                
                expect(manager.hasSelection()).to.be.false;
                expect(manager.isSelecting).to.be.false;
            });
            
            it('should start selection at tile position', function() {
                const manager = new SelectionManager();
                
                manager.startSelection(5, 10);
                
                expect(manager.isSelecting).to.be.true;
                expect(manager.startTile).to.deep.equal({ x: 5, y: 10 });
                expect(manager.endTile).to.deep.equal({ x: 5, y: 10 });
            });
            
            it('should update selection end position', function() {
                const manager = new SelectionManager();
                
                manager.startSelection(5, 10);
                manager.updateSelection(8, 12);
                
                expect(manager.startTile).to.deep.equal({ x: 5, y: 10 });
                expect(manager.endTile).to.deep.equal({ x: 8, y: 12 });
            });
            
            it('should not update if not selecting', function() {
                const manager = new SelectionManager();
                
                manager.updateSelection(8, 12);
                
                expect(manager.hasSelection()).to.be.false;
            });
            
            it('should end selection and keep bounds', function() {
                const manager = new SelectionManager();
                
                manager.startSelection(5, 10);
                manager.updateSelection(8, 12);
                manager.endSelection();
                
                expect(manager.isSelecting).to.be.false;
                expect(manager.hasSelection()).to.be.true;
            });
            
            it('should clear selection completely', function() {
                const manager = new SelectionManager();
                
                manager.startSelection(5, 10);
                manager.updateSelection(8, 12);
                manager.clearSelection();
                
                expect(manager.hasSelection()).to.be.false;
                expect(manager.startTile).to.be.null;
                expect(manager.endTile).to.be.null;
            });
        });
        
        describe('Selection Bounds Calculation', function() {
            it('should calculate bounds for top-left to bottom-right drag', function() {
                const manager = new SelectionManager();
                
                manager.startSelection(5, 10);
                manager.updateSelection(8, 15);
                
                const bounds = manager.getSelectionBounds();
                expect(bounds).to.deep.equal({
                    minX: 5, maxX: 8,
                    minY: 10, maxY: 15
                });
            });
            
            it('should calculate bounds for bottom-right to top-left drag', function() {
                const manager = new SelectionManager();
                
                manager.startSelection(8, 15);
                manager.updateSelection(5, 10);
                
                const bounds = manager.getSelectionBounds();
                expect(bounds).to.deep.equal({
                    minX: 5, maxX: 8,
                    minY: 10, maxY: 15
                });
            });
            
            it('should return null bounds when no selection', function() {
                const manager = new SelectionManager();
                
                const bounds = manager.getSelectionBounds();
                expect(bounds).to.be.null;
            });
            
            it('should handle single tile selection', function() {
                const manager = new SelectionManager();
                
                manager.startSelection(5, 10);
                manager.endSelection();
                
                const bounds = manager.getSelectionBounds();
                expect(bounds).to.deep.equal({
                    minX: 5, maxX: 5,
                    minY: 10, maxY: 10
                });
            });
        });
        
        describe('Get Tiles in Selection', function() {
            it('should return all tiles in selection rectangle', function() {
                const manager = new SelectionManager();
                
                manager.startSelection(5, 10);
                manager.updateSelection(7, 12);
                
                const tiles = manager.getTilesInSelection();
                
                // 3 tiles wide x 3 tiles tall = 9 tiles
                expect(tiles.length).to.equal(9);
                expect(tiles).to.deep.include({ x: 5, y: 10 });
                expect(tiles).to.deep.include({ x: 7, y: 12 });
            });
            
            it('should return single tile for single point selection', function() {
                const manager = new SelectionManager();
                
                manager.startSelection(5, 10);
                
                const tiles = manager.getTilesInSelection();
                
                expect(tiles.length).to.equal(1);
                expect(tiles[0]).to.deep.equal({ x: 5, y: 10 });
            });
            
            it('should return empty array when no selection', function() {
                const manager = new SelectionManager();
                
                const tiles = manager.getTilesInSelection();
                
                expect(tiles).to.be.an('array').that.is.empty;
            });
        });
    });
    
    describe('HoverPreviewManager', function() {
        
        describe('Brush Size 1 (Single Tile)', function() {
            it('should highlight single tile for paint tool', function() {
                const manager = new HoverPreviewManager();
                
                manager.updateHover(5, 10, 'paint', 1);
                
                const tiles = manager.getHoveredTiles();
                expect(tiles.length).to.equal(1);
                expect(tiles[0]).to.deep.equal({ x: 5, y: 10 });
            });
            
            it('should highlight single tile for eyedropper', function() {
                const manager = new HoverPreviewManager();
                
                manager.updateHover(5, 10, 'eyedropper', 1);
                
                const tiles = manager.getHoveredTiles();
                expect(tiles.length).to.equal(1);
                expect(tiles[0]).to.deep.equal({ x: 5, y: 10 });
            });
        });
        
        describe('Brush Size 3 (3x3 Square)', function() {
            it('should highlight 9 tiles in square pattern', function() {
                const manager = new HoverPreviewManager();
                
                manager.updateHover(5, 10, 'paint', 3);
                
                const tiles = manager.getHoveredTiles();
                
                // Brush size 3 (ODD) = full 3x3 square = 9 tiles
                expect(tiles.length).to.equal(9);
                expect(tiles).to.deep.include({ x: 5, y: 10 });   // Center
                expect(tiles).to.deep.include({ x: 4, y: 10 });   // Left
                expect(tiles).to.deep.include({ x: 6, y: 10 });   // Right
                expect(tiles).to.deep.include({ x: 5, y: 9 });    // Above
                expect(tiles).to.deep.include({ x: 5, y: 11 });   // Below
            });
        });
        
        describe('Brush Size 5 (5x5 Square)', function() {
            it('should highlight square pattern of tiles', function() {
                const manager = new HoverPreviewManager();
                
                manager.updateHover(10, 10, 'paint', 5);
                
                const tiles = manager.getHoveredTiles();
                
                // Brush size 5 (ODD) = full 5x5 square = 25 tiles
                expect(tiles.length).to.equal(25);
                
                // Center should be included
                expect(tiles).to.deep.include({ x: 10, y: 10 });
            });
        });
        
        describe('Clear Hover', function() {
            it('should clear all hovered tiles', function() {
                const manager = new HoverPreviewManager();
                
                manager.updateHover(5, 10, 'paint', 3);
                expect(manager.getHoveredTiles().length).to.be.greaterThan(0);
                
                manager.clearHover();
                
                expect(manager.getHoveredTiles()).to.be.an('array').that.is.empty;
            });
        });
        
        describe('Tool-Specific Behavior', function() {
            it('should not highlight tiles for select tool', function() {
                const manager = new HoverPreviewManager();
                
                manager.updateHover(5, 10, 'select', 1);
                
                const tiles = manager.getHoveredTiles();
                expect(tiles).to.be.an('array').that.is.empty;
            });
        });
    });
});
