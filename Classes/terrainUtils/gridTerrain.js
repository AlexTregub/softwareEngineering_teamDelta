///// TERRAIN is GRID of CHUNK is GRID of TILE 
///// TODO: Define functionality + update coordinate system
/*

eg: (chunks)
(-1,-1)(0,-1)(1,-1)
(-1,0) (0,0) (1,0)
(-1,1) (0,1) (1,0)

floor chunks to get (0,0) chunk offset towards TL
3-1/2 = @1
4-1/2 = @1
5-1/2 = @2
...

eg: (tiles//backing grid?) - -0.5 offsets configured by Chunk. (only for rendering)
(-8.5,-8.5).......... ___________________
...........(-0.5,-0.5)___________________
______________________(-0.5,-0.5)........
______________________...........(7.5,7.5)
*/

class gridTerrain {
    constructor(gridSizeX,gridSizeY,seed,chunkSize=CHUNK_SIZE,tileSize=TILE_SIZE) {
        this._gridSizeX = gridSizeX;
        this._gridSizeY = gridSizeY;
        
        this._centerChunkX = floor((this._gridSizeX-1)/2);
        this._centerChunkY = floor((this._gridSizeY-1)/2);
        
        this._gridSpanTL = [ // Chunk positions
            this._centerChunkX - this._gridSizeX,
            this._centerChunkY - this._gridSizeY
        ];

        this._chunkSize = chunkSize; // Chunk size (in tiles)
        this._tileSize = tileSize; // tile size (in pixels)
        this._seed = seed;
        
        // chunkArray considered public
        this.chunkArray = new Grid(this._gridSizeX,this._gridSizeY, 
            this._gridSpanTL,[
                this._gridSpanTL[0]*this._chunkSize,
                this._gridSpanTL[1]*this._chunkSize
            ]
        ); // objLoc used to store TL of backing canvas in GRID COORDINATES

        // Get span in Tiles
        this._gridTileSpan = this.chunkArray.getSpanRange();
        this._gridTileSpan[0] = this._gridTileSpan[0]*this._chunkSize;
        this._gridTileSpan[1] = this._gridTileSpan[1]*this._chunkSize;

        // Allocate chunks... (will allocate tiles...)
        let len = this.chunkArray.getSize()[0]*this.chunkArray.getSize()[1];
        for (let i = 0; i < len; ++i) {
            let chunkPosition = this.chunkArray.convArrToRelPos(this.chunkArray.convToSquare(i));
            this.chunkArray[i] = new Chunk(chunkPosition,
                [
                    chunkPosition[0]*this._chunkSize,
                    chunkPosition[1]*this._chunkSize
                ],
                this._chunkSize,
                this._tileSize
            );

            this.chunkArray[i].randomize(seed); // Randomize at creation, not necessarily working correctly
        }
    }
}