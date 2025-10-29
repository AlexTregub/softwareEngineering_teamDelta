/**
 * Unit Tests for Grid Class
 * Tests the Grid data structure used for terrain management
 */

const { expect } = require('chai');

// Mock p5.js global functions
global.floor = Math.floor;
global.print = () => {}; // Silent print for tests
global.NONE = null;

// Load the Grid class
const gridCode = require('fs').readFileSync(
  require('path').join(__dirname, '../../../Classes/terrainUtils/grid.js'),
  'utf8'
);
eval(gridCode);

describe('Grid Class', function() {
  
  describe('Constructor', function() {
    
    it('should create a grid with correct dimensions', function() {
      const grid = new Grid(5, 10);
      const size = grid.getSize();
      
      expect(size[0]).to.equal(5);
      expect(size[1]).to.equal(10);
    });
    
    it('should initialize all cells to NONE', function() {
      const grid = new Grid(3, 3);
      
      for (let i = 0; i < 9; i++) {
        expect(grid.rawArray[i]).to.equal(NONE);
      }
    });
    
    it('should set up span when provided', function() {
      const grid = new Grid(5, 5, [10, 20]);
      const spanRange = grid.getSpanRange();
      
      expect(spanRange[0][0]).to.equal(10); // TopLeft X
      expect(spanRange[0][1]).to.equal(20); // TopLeft Y
      expect(spanRange[1][0]).to.equal(15); // BottomRight X (10 + 5)
      expect(spanRange[1][1]).to.equal(15); // BottomRight Y (20 - 5)
    });
    
    it('should disable span when not provided', function() {
      const grid = new Grid(5, 5);
      expect(grid._spanEnabled).to.be.false;
    });
    
    it('should set object location when provided', function() {
      const grid = new Grid(5, 5, NONE, [100, 200]);
      const objPos = grid.getObjPos();
      
      expect(objPos[0]).to.equal(100);
      expect(objPos[1]).to.equal(200);
    });
    
    it('should assign unique grid IDs', function() {
      const grid1 = new Grid(3, 3);
      const grid2 = new Grid(3, 3);
      
      expect(grid1.getGridId()).to.not.equal(grid2.getGridId());
    });
  });
  
  describe('Coordinate Conversion', function() {
    
    describe('convToFlat() and convToSquare()', function() {
      it('should convert 2D coordinates to flat array index', function() {
        const grid = new Grid(5, 5);
        
        expect(grid.convToFlat([0, 0])).to.equal(0);
        expect(grid.convToFlat([4, 0])).to.equal(4);
        expect(grid.convToFlat([0, 1])).to.equal(5);
        expect(grid.convToFlat([2, 3])).to.equal(17); // 3*5 + 2
      });
      
      it('should convert flat index to 2D coordinates', function() {
        const grid = new Grid(5, 5);
        
        expect(grid.convToSquare(0)).to.deep.equal([0, 0]);
        expect(grid.convToSquare(4)).to.deep.equal([4, 0]);
        expect(grid.convToSquare(5)).to.deep.equal([0, 1]);
        expect(grid.convToSquare(17)).to.deep.equal([2, 3]);
      });
      
      it('should be inverse operations', function() {
        const grid = new Grid(8, 8);
        
        for (let i = 0; i < 64; i++) {
          const square = grid.convToSquare(i);
          const flat = grid.convToFlat(square);
          expect(flat).to.equal(i);
        }
      });
    });
    
    describe('convRelToArrPos() and convArrToRelPos()', function() {
      it('should convert relative span position to array position', function() {
        const grid = new Grid(5, 5, [10, 20]);
        
        const arrPos = grid.convRelToArrPos([10, 20]);
        expect(arrPos).to.deep.equal([0, 0]);
        
        const arrPos2 = grid.convRelToArrPos([12, 18]);
        expect(arrPos2).to.deep.equal([2, 2]);
      });
      
      it('should convert array position to relative span position', function() {
        const grid = new Grid(5, 5, [10, 20]);
        
        const relPos = grid.convArrToRelPos([0, 0]);
        expect(relPos).to.deep.equal([10, 20]);
        
        const relPos2 = grid.convArrToRelPos([2, 2]);
        expect(relPos2).to.deep.equal([12, 18]);
      });
      
      it('should be inverse operations', function() {
        const grid = new Grid(8, 8, [5, 10]);
        
        for (let y = 0; y < 8; y++) {
          for (let x = 0; x < 8; x++) {
            const arrPos = [x, y];
            const relPos = grid.convArrToRelPos(arrPos);
            const backPos = grid.convRelToArrPos(relPos);
            
            expect(backPos).to.deep.equal(arrPos);
          }
        }
      });
    });
  });
  
  describe('Data Access', function() {
    
    describe('getArrPos() and setArrPos()', function() {
      it('should get and set values at array positions', function() {
        const grid = new Grid(5, 5);
        
        grid.setArrPos([2, 3], 'test_value');
        const value = grid.getArrPos([2, 3]);
        
        expect(value).to.equal('test_value');
      });
      
      it('should handle different data types', function() {
        const grid = new Grid(3, 3);
        
        grid.setArrPos([0, 0], 42);
        grid.setArrPos([1, 1], 'string');
        grid.setArrPos([2, 2], { key: 'value' });
        
        expect(grid.getArrPos([0, 0])).to.equal(42);
        expect(grid.getArrPos([1, 1])).to.equal('string');
        expect(grid.getArrPos([2, 2])).to.deep.equal({ key: 'value' });
      });
    });
    
    describe('get() and set() with span', function() {
      it('should get and set values using span coordinates', function() {
        const grid = new Grid(5, 5, [10, 20]);
        
        grid.set([12, 18], 'span_value');
        const value = grid.get([12, 18]);
        
        expect(value).to.equal('span_value');
      });
      
      it('should work correctly at span boundaries', function() {
        const grid = new Grid(5, 5, [10, 20]);
        
        // Top-left corner
        grid.set([10, 20], 'TL');
        expect(grid.get([10, 20])).to.equal('TL');
        
        // Bottom-right corner (span is [10,20] to [15,15])
        grid.set([14, 16], 'BR');
        expect(grid.get([14, 16])).to.equal('BR');
      });
    });
  });
  
  describe('Bulk Data Operations', function() {
    
    describe('getRangeData()', function() {
      it('should get data range from grid', function() {
        const grid = new Grid(5, 5);
        
        // Fill with sequential values
        for (let i = 0; i < 25; i++) {
          grid.rawArray[i] = i;
        }
        
        const range = grid.getRangeData([1, 1], [3, 2]);
        // Should get: [6, 7, 8, 11, 12, 13]
        expect(range).to.deep.equal([6, 7, 8, 11, 12, 13]);
      });
      
      it('should handle single cell range', function() {
        const grid = new Grid(5, 5);
        grid.setArrPos([2, 2], 'single');
        
        const range = grid.getRangeData([2, 2], [2, 2]);
        expect(range).to.deep.equal(['single']);
      });
    });
    
    describe('getRangeNeighborhoodData()', function() {
      it('should get neighborhood around a point', function() {
        const grid = new Grid(5, 5);
        
        for (let i = 0; i < 25; i++) {
          grid.rawArray[i] = i;
        }
        
        // Get 1-radius neighborhood around center (2,2)
        const neighborhood = grid.getRangeNeighborhoodData([2, 2], 1);
        
        // Should get 3x3 area: indices 6,7,8,11,12,13,16,17,18
        expect(neighborhood).to.have.lengthOf(9);
        expect(neighborhood).to.deep.equal([6, 7, 8, 11, 12, 13, 16, 17, 18]);
      });
      
      it('should handle boundary cases (clamp to grid edges)', function() {
        const grid = new Grid(5, 5);
        
        for (let i = 0; i < 25; i++) {
          grid.rawArray[i] = i;
        }
        
        // Corner case - top-left with radius 1
        const neighborhood = grid.getRangeNeighborhoodData([0, 0], 1);
        
        // Should get 2x2 area (clamped): indices 0,1,5,6
        expect(neighborhood).to.deep.equal([0, 1, 5, 6]);
      });
    });
  });
  
  describe('Grid Modification', function() {
    
    describe('resize()', function() {
      it('should resize grid without preserving data', function() {
        const grid = new Grid(3, 3);
        grid.resize([5, 5]);
        
        const size = grid.getSize();
        expect(size).to.deep.equal([5, 5]);
        expect(grid.rawArray).to.have.lengthOf(25);
      });
      
      it('should resize and preserve data at new position', function() {
        const grid = new Grid(3, 3);
        
        // Fill with test data
        for (let i = 0; i < 9; i++) {
          grid.rawArray[i] = i;
        }
        
        // Resize to 5x5, place old data at position [1, 1]
        grid.resize([5, 5], [1, 1]);
        
        // Old data should be at offset position
        // Original [0,0] (value 0) should now be at [1,1] in new grid
        expect(grid.getArrPos([1, 1])).to.equal(0);
        expect(grid.getArrPos([2, 1])).to.equal(1);
        expect(grid.getArrPos([3, 1])).to.equal(2);
      });
      
      it('should update span when resizing with data preservation', function() {
        const grid = new Grid(3, 3, [10, 20]);
        grid.resize([5, 5], [1, 1]);
        
        const spanRange = grid.getSpanRange();
        
        // Span should be adjusted based on old data position offset
        expect(spanRange[0][0]).to.equal(9);  // 10 - 1
        expect(spanRange[0][1]).to.equal(19); // 20 - 1
        expect(spanRange[1][0]).to.equal(14); // 9 + 5
        expect(spanRange[1][1]).to.equal(14); // 19 - 5
      });
    });
    
    describe('clear()', function() {
      it('should clear all data and reset to empty state', function() {
        const grid = new Grid(5, 5, [10, 20], [100, 200]);
        
        // Add some data
        grid.setArrPos([0, 0], 'test');
        
        grid.clear();
        
        expect(grid.getSize()).to.deep.equal([0, 0]);
        expect(grid.rawArray).to.have.lengthOf(0);
        expect(grid._spanEnabled).to.be.false;
        expect(grid.getObjPos()).to.deep.equal([0, 0]);
      });
    });
  });
  
  describe('Utility Methods', function() {
    
    describe('toString()', function() {
      it('should return string representation of grid', function() {
        const grid = new Grid(3, 2);
        grid.rawArray = [1, 2, 3, 4, 5, 6];
        
        const str = grid.toString();
        
        expect(str).to.be.a('string');
        expect(str).to.include('1');
        expect(str).to.include('2');
        expect(str).to.include(';'); // Row separator
      });
    });
    
    describe('infoStr()', function() {
      it('should return debug information string', function() {
        const grid = new Grid(5, 10, [10, 20], [100, 200]);
        
        const info = grid.infoStr();
        
        expect(info).to.be.a('string');
        expect(info).to.include('Grid#');
        expect(info).to.include('5');
        expect(info).to.include('10');
      });
    });
    
    describe('setObjPos() and getObjPos()', function() {
      it('should set and get object position', function() {
        const grid = new Grid(5, 5);
        
        grid.setObjPos([42, 84]);
        const pos = grid.getObjPos();
        
        expect(pos).to.deep.equal([42, 84]);
      });
    });
  });
  
  describe('Edge Cases', function() {
    
    it('should handle 1x1 grid', function() {
      const grid = new Grid(1, 1);
      
      grid.setArrPos([0, 0], 'single');
      expect(grid.getArrPos([0, 0])).to.equal('single');
    });
    
    it('should handle large grids', function() {
      const grid = new Grid(100, 100);
      
      expect(grid.rawArray).to.have.lengthOf(10000);
      expect(grid.getSize()).to.deep.equal([100, 100]);
    });
    
    it('should handle rectangular grids', function() {
      const grid = new Grid(10, 5);
      
      grid.setArrPos([9, 4], 'corner');
      expect(grid.getArrPos([9, 4])).to.equal('corner');
      
      const flat = grid.convToFlat([9, 4]);
      expect(flat).to.equal(49); // (4 * 10) + 9
    });
  });
  
  describe('convertToGrid() utility function', function() {
    
    it('should convert array to Grid object', function() {
      const data = [1, 2, 3, 4, 5, 6];
      const grid = convertToGrid(data, 3, 2);
      
      expect(grid).to.be.instanceOf(Grid);
      expect(grid.getSize()).to.deep.equal([3, 2]);
      expect(grid.rawArray).to.deep.equal(data);
    });
    
    it('should preserve data order', function() {
      const data = ['a', 'b', 'c', 'd'];
      const grid = convertToGrid(data, 2, 2);
      
      expect(grid.getArrPos([0, 0])).to.equal('a');
      expect(grid.getArrPos([1, 0])).to.equal('b');
      expect(grid.getArrPos([0, 1])).to.equal('c');
      expect(grid.getArrPos([1, 1])).to.equal('d');
    });
  });
});
