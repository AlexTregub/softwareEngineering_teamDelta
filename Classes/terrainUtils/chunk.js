///// CHUNK of TERRAIN made of GRID of TILES
const CHUNK_SIZE=8; // size in Tiles

class Chunk {
    constructor(chunkPos,spanTLPos,size=CHUNK_SIZE,tileSize=TILE_SIZE) { // spanTLPos should be a known rounded value. We will automatically offset items as needed. 
        this._chunkPos = chunkPos;
        this._spanTLPos = spanTLPos;
        this._size = size;
        this._tileSize = tileSize;
        
        this.tileData = new Grid(this._size,this._size,this._spanTLPos,this._chunkPos); // Public, can access through chunk.tileData.*

        // Fill grid with Tile:
        let len = this._size*this._size;
        for (let i = 0; i < len; ++i) {
            let gridPos = this.tileData.convArrToRelPos(this.tileData.convToSquare(i)); // i -> square -> span
            this.tileData.rawArray[i] = new Tile(gridPos[0]-0.5,gridPos[1]-0.5,tileSize); // Now storing GRID-RENDER position TL render corner (offset), instead of PIXEL position. Raw access for efficiency
        }
    }

    //// Additional chunk functionality
    randomize(posOffset) {
        let width = this.tileData.getSize()[0]; // ASSUMED SQUARE
        let len = width*width;
        for (let i = 0; i < len; ++i) {
            let position = this.tileData.convArrToRelPos(this.tileData.convToSquare(i));
            // print(position);
            position = [
                position[0] + posOffset[0],
                position[1] + posOffset[1]
            ]
            this.tileData.rawArray[i].randomizePerlin(position); // Picks from random material
            // print(this.tileData.getSpanRange());
        }
    }

    render(coordSys) { // Render through coordinate system
        // let temp = coordSys;
        // coordSys.setViewCornerBC([0,0]);
        let len = this.tileData.getSize()[0]*this.tileData.getSize()[1];
        
        for (let i = 0; i < len; ++i) {
            this.tileData.rawArray[i].render2(coordSys);
        }
    }

    toString() {
        return this.tileData.toString();
    }

    //// Passed through Grid functions
    // Utils: No OOB checks
    convToFlat(pos) {
        return this.tileData.convToFlat(pos);
    }
    convToSquare(z) {
        return this.tileData.convToSquare(z);
    }
    convRelToArrPos(pos) {
        return this.tileData.convRelToArrPos(pos);
    }
    convArrToRelPos(pos) {
        return this.tileData.convArrToRelPos(pos);
    }

    // Bulk: Range functions do not have OOB checks, Neighborhood handles OOB automatically.
    getRangeData(tlArrayPos,brArrayPos) {
        return this.tileData.getRangeData(tlArrayPos,brArrayPos);
    }
    getRangeNeighborhoodData(arrayPos,radius) {
        return this.tileData.getRangeNeighborhoodData(arrayPos,radius);
    }
    getRangeGrid(tlArrayPos,brArrayPos) {
        return this.tileData.getRangeGrid(tlArrayPos,brArrayPos);
    }
    getRangeNeighborhoodGrid(arrayPos,radius) {
        return this.tileData.getRangeNeighborhoodGrid(arrayPos,radius);
    }

    // Access: OOB warning messages in console. Search for lines with "Grid#" (infoStr() returns)
    getArrPos(pos) {
        return this.tileData.getArrPos(pos);
    }
    setArrPos(pos,obj) {
        return this.tileData.setArrPos(pos,obj);
    }
    get(relPos) {
        return this.tileData.get(relPos);
    }
    set(relPos,obj) {
        return this.tileData.set(relPos,obj);
    }

    // Debug 
    print() {
        this.tileData.print();
    }
    infoStr() {
        return this.tileData.infoStr();
    }

    // Info of struct, modification restricted.
    getSize() {
        return this.tileData.getSize();
    }
    getSpanRange() {
        return this.tileData.getSpanRange();
    }
    getObjPos() {
        return this.tileData.getObjPos();
    }
    getGridId() {
        return this.tileData.getGridId();
    }

    // Reset, properties kept.
    clear() {
        this.tileData.clear();

        this.tileData = new Grid(this._size,this._size,this._spanTLPos,this._chunkPos); // Public, can access through chunk.tileData.*

        // Fill grid with Tile:
        let len = this._size*this._size;
        for (let i = 0; i < len; ++i) {
            let gridPos = this.tileData.convArrToRelPos(this.tileData.convToSquare(i)); // i -> square -> span
            this.tileData.rawArray[i] = new Tile(gridPos[0]-0.5,gridPos[1]-0.5,tileSize); // Now storing GRID-RENDER position TL render corner (offset), instead of PIXEL position. Raw access for efficiency
        }
    }
}