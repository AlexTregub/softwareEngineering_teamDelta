///// WILL CONTAIN ALL RESOURCES FOR HOLDING + HANDLING TILE MODIFIERS.

class frillsChunk {
    constructor(chunkPos,spanTLPos,size=CHUNK_SIZE,tileSize=TILE_SIZE) {
        this._chunkPos = chunkPos;
        this._spanTLPos = spanTLPos;
        this._size = size;
        this._tileSize = tileSize;
        
        this.tileData = new Grid(this._size,this._size,this._spanTLPos,this._chunkPos); // Public, can access through chunk.tileData.*

        // Prepare chunk
        let len = this._size*this._size;
        for (let i = 0; i < len; ++i) {
            this.tileData.rawArray[i] = [] // Will hold a list of 'FRILLS' per Tile. Will need to render all...
        }
    }

    updateFrills(externalTerrain=g_activeMap) {
        // ...
    }

    render(coordSys) { // Will render calculated frills
        let len = this.tileData.getSize()[0]*this.tileData.getSize()[1];
        
        for (let i = 0; i < len; ++i) {
            for (let j = 0; j < this.tileData.rawArray[i].length; ++j) {
                this.tileData.rawArray[i][j].render(coordSys)
            }
            // this.tileData.rawArray[i].render(coordSys);
        }
    }

    //////// Passed through Grid functions - TESTED EXTERNALLY
    toString() {
        return this.tileData.toString();
    }

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
}