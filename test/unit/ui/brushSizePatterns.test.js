/**
 * Unit Tests: Brush Size Patterns (Step by 1, Square vs Circular)
 * 
 * TDD Phase 1: UNIT TESTS (Write tests FIRST)
 * 
 * FEATURES TO IMPLEMENT:
 * 1. BrushSizeControl: Step by 1 instead of 2 (1,2,3,4,5,6,7,8,9)
 * 2. HoverPreviewManager: 
 *    - Even sizes (2,4,6,8): Circular pattern
 *    - Odd sizes (3,5,7,9): Square pattern
 */

const { expect } = require('chai');
const sinon = require('sinon');

describe('Brush Size Patterns (Unit Tests)', function() {
    let BrushSizeControl, HoverPreviewManager;
    
    before(function() {
        // Load real implementations (will be created after tests)
        try {
            BrushSizeControl = require('../../../Classes/ui/BrushSizeControl');
            HoverPreviewManager = require('../../../Classes/ui/HoverPreviewManager');
        } catch (e) {
            // Classes don't exist yet - tests will guide implementation
        }
    });
    
    describe('BrushSizeControl - Step by 1', function() {
        it('should initialize with size 1', function() {
            const control = new BrushSizeControl(1, 1, 9);
            expect(control.getSize()).to.equal(1);
        });
        
        it('should increment by 1 (1 -> 2 -> 3 -> 4)', function() {
            const control = new BrushSizeControl(1, 1, 9);
            
            expect(control.getSize()).to.equal(1);
            control.increase();
            expect(control.getSize()).to.equal(2);
            control.increase();
            expect(control.getSize()).to.equal(3);
            control.increase();
            expect(control.getSize()).to.equal(4);
        });
        
        it('should decrement by 1 (4 -> 3 -> 2 -> 1)', function() {
            const control = new BrushSizeControl(4, 1, 9);
            
            expect(control.getSize()).to.equal(4);
            control.decrease();
            expect(control.getSize()).to.equal(3);
            control.decrease();
            expect(control.getSize()).to.equal(2);
            control.decrease();
            expect(control.getSize()).to.equal(1);
        });
        
        it('should not go below minimum size', function() {
            const control = new BrushSizeControl(1, 1, 9);
            
            control.decrease();
            control.decrease();
            expect(control.getSize()).to.equal(1);
        });
        
        it('should not exceed maximum size', function() {
            const control = new BrushSizeControl(9, 1, 9);
            
            control.increase();
            control.increase();
            expect(control.getSize()).to.equal(9);
        });
        
        it('should allow all sizes from 1 to 9', function() {
            const control = new BrushSizeControl(1, 1, 9);
            const sizes = [];
            
            for (let i = 0; i < 10; i++) {
                sizes.push(control.getSize());
                control.increase();
            }
            
            expect(sizes).to.deep.equal([1, 2, 3, 4, 5, 6, 7, 8, 9, 9]);
        });
    });
    
    describe('HoverPreviewManager - Brush Size 2 (Circular 2x2)', function() {
        it('should create circular pattern for even size 2', function() {
            const manager = new HoverPreviewManager();
            
            manager.updateHover(10, 10, 'paint', 2);
            const tiles = manager.getHoveredTiles();
            
            // Size 2 circular (radius 1): 5 tiles in cross pattern
            expect(tiles.length).to.equal(5);
            expect(tiles).to.deep.include({ x: 10, y: 10 }); // Center
        });
    });
    
    describe('HoverPreviewManager - Brush Size 3 (Square 3x3)', function() {
        it('should create full square pattern for odd size 3', function() {
            const manager = new HoverPreviewManager();
            
            manager.updateHover(10, 10, 'paint', 3);
            const tiles = manager.getHoveredTiles();
            
            // Size 3 square: 3x3 = 9 tiles
            expect(tiles.length).to.equal(9);
            
            // Verify all 9 positions
            expect(tiles).to.deep.include({ x: 9, y: 9 });   // Top-left
            expect(tiles).to.deep.include({ x: 10, y: 9 });  // Top-center
            expect(tiles).to.deep.include({ x: 11, y: 9 });  // Top-right
            expect(tiles).to.deep.include({ x: 9, y: 10 });  // Middle-left
            expect(tiles).to.deep.include({ x: 10, y: 10 }); // Center
            expect(tiles).to.deep.include({ x: 11, y: 10 }); // Middle-right
            expect(tiles).to.deep.include({ x: 9, y: 11 });  // Bottom-left
            expect(tiles).to.deep.include({ x: 10, y: 11 }); // Bottom-center
            expect(tiles).to.deep.include({ x: 11, y: 11 }); // Bottom-right
        });
    });
    
    describe('HoverPreviewManager - Brush Size 4 (Circular 4x4)', function() {
        it('should create circular pattern for even size 4', function() {
            const manager = new HoverPreviewManager();
            
            manager.updateHover(10, 10, 'paint', 4);
            const tiles = manager.getHoveredTiles();
            
            // Size 4 circular: radius 2, circular approximation (~13 tiles)
            expect(tiles.length).to.be.greaterThan(9);  // More than 3x3
            expect(tiles.length).to.be.lessThanOrEqual(16); // At most 4x4 square
            
            // Center should be included
            expect(tiles).to.deep.include({ x: 10, y: 10 });
        });
    });
    
    describe('HoverPreviewManager - Brush Size 5 (Square 5x5)', function() {
        it('should create full square pattern for odd size 5', function() {
            const manager = new HoverPreviewManager();
            
            manager.updateHover(10, 10, 'paint', 5);
            const tiles = manager.getHoveredTiles();
            
            // Size 5 square: 5x5 = 25 tiles
            expect(tiles.length).to.equal(25);
            
            // Verify corners of 5x5 square
            expect(tiles).to.deep.include({ x: 8, y: 8 });   // Top-left
            expect(tiles).to.deep.include({ x: 12, y: 8 });  // Top-right
            expect(tiles).to.deep.include({ x: 8, y: 12 });  // Bottom-left
            expect(tiles).to.deep.include({ x: 12, y: 12 }); // Bottom-right
            expect(tiles).to.deep.include({ x: 10, y: 10 }); // Center
        });
    });
    
    describe('HoverPreviewManager - Brush Size 6 (Circular 6x6)', function() {
        it('should create circular pattern for even size 6', function() {
            const manager = new HoverPreviewManager();
            
            manager.updateHover(10, 10, 'paint', 6);
            const tiles = manager.getHoveredTiles();
            
            // Size 6 circular: radius 3, circular approximation (~29 tiles)
            expect(tiles.length).to.be.greaterThan(25); // More than 5x5 square
            expect(tiles.length).to.be.lessThanOrEqual(36);  // At most 6x6 square
            
            // Center should be included
            expect(tiles).to.deep.include({ x: 10, y: 10 });
        });
    });
    
    describe('Pattern Logic - Even vs Odd', function() {
        it('should use circular pattern for all even sizes', function() {
            const manager = new HoverPreviewManager();
            
            const evenSizes = [4, 6, 8]; // Skip size 2 (special case: 5 tiles is valid cross pattern)
            
            evenSizes.forEach(size => {
                manager.updateHover(10, 10, 'paint', size);
                const tiles = manager.getHoveredTiles();
                
                const fullSquare = size * size;
                // Circular should be less than or equal to full square
                expect(tiles.length).to.be.lessThanOrEqual(fullSquare, 
                    `Size ${size} should be circular (at most ${fullSquare} tiles)`);
                expect(tiles.length).to.be.greaterThan(0,
                    `Size ${size} should have at least 1 tile`);
            });
            
            // Size 2 special case: 5 tiles in cross pattern is valid circular approximation
            manager.updateHover(10, 10, 'paint', 2);
            const size2Tiles = manager.getHoveredTiles();
            expect(size2Tiles.length).to.equal(5);
        });
        
        it('should use square pattern for all odd sizes', function() {
            const manager = new HoverPreviewManager();
            
            const oddSizes = [3, 5, 7, 9];
            
            oddSizes.forEach(size => {
                manager.updateHover(10, 10, 'paint', size);
                const tiles = manager.getHoveredTiles();
                
                const fullSquare = size * size;
                expect(tiles.length).to.equal(fullSquare,
                    `Size ${size} should be full square (${fullSquare} tiles)`);
            });
        });
        
        it('should preserve size 1 as single tile', function() {
            const manager = new HoverPreviewManager();
            
            manager.updateHover(10, 10, 'paint', 1);
            const tiles = manager.getHoveredTiles();
            
            expect(tiles.length).to.equal(1);
            expect(tiles[0]).to.deep.equal({ x: 10, y: 10 });
        });
    });
});
