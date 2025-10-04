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
    constructor(gridSizeX,gridSizeY,seed,chunkSize=CHUNK_SIZE,tileSize=TILE_SIZE,canvasSize=[CANVAS_X,CANVAS_Y]) {
        this._gridSizeX = gridSizeX;
        this._gridSizeY = gridSizeY;
        
        this._centerChunkX = floor((this._gridSizeX-1)/2);
        this._centerChunkY = floor((this._gridSizeY-1)/2);
        
        this._gridSpanTL = [ // Chunk positions
            // this._centerChunkX - this._gridSizeX,
            // this._centerChunkY - this._gridSizeY
            -this._centerChunkX,
            -this._centerChunkY
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
            // print(chunkPosition);
            // print(
            //     [
            //         chunkPosition[0]*this._chunkSize,
            //         chunkPosition[1]*this._chunkSize
            //     ]
            // );
            this.chunkArray.rawArray[i] = new Chunk(chunkPosition,
                [
                    chunkPosition[0]*this._chunkSize,
                    chunkPosition[1]*this._chunkSize
                ],
                this._chunkSize,
                this._tileSize
            );

            this.chunkArray.rawArray[i].randomize(seed); // Randomize at creation, not necessarily working correctly
        }

        this._canvasSize = canvasSize;

        // Get info (extracting from generated grid for consistency):
        this._tileSpan = [
            this.chunkArray.rawArray[0].tileData.getSpanRange()[0],
            this.chunkArray.rawArray[len - 1].tileData.getSpanRange()[1]
        ];

        this._tileSpanRange = [
            this._tileSpan[1][0] - this._tileSpan[0][0],
            this._tileSpan[1][1] - this._tileSpan[0][1]
        ]

        // Canvas conversions handler
        this.renderConversion = new camRenderConverter([0,0],this._canvasSize,this._tileSize);
    }

    printDebug() {
        print("gridTerrain debug:");
        print("Chunk span:",this._gridSizeX,',',this._gridSizeY,"; Center chunk:",this._centerChunkX,',',this._centerChunkY)
        print("Top left:",this._gridSpanTL);
        // print(tileSpan);

        print(this.chunkArray.getSize());
        print("Tile-size span");
        // print(this.chunkArray.rawArray[0].tileData.getSpanRange()[0]);
        // print(this.chunkArray.rawArray[this.chunkArray.getSize()[0]*this.chunkArray.getSize()[0] - 1].tileData.getSpanRange()[1]);
        print(this._tileSpan);
        print("Render center:",this.renderConversion.convPosToCanvas([0,0]));
    }

    render() {
        let viewSpan = this.renderConversion.getViewSpan();
        let chunkSpan = [
            [ // -x,+y TL
                (viewSpan[0][0]%this._chunkSize != 0) ? floor(viewSpan[0][0]/this._chunkSize)-1 : viewSpan[0][0]/this._chunkSize,
                (viewSpan[0][1]%this._chunkSize != 0) ? floor(viewSpan[0][1]/this._chunkSize)+1 : viewSpan[0][1]/this._chunkSize
            ],
            [ // +x,-y BR
                (viewSpan[1][0]%this._chunkSize != 0) ? floor(viewSpan[1][0]/this._chunkSize)+1 : viewSpan[1][0]/this._chunkSize,
                (viewSpan[1][1]%this._chunkSize != 0) ? floor(viewSpan[1][1]/this._chunkSize)-1 : viewSpan[1][1]/this._chunkSize
            ]
        ];

        for (let i = 0; i < this._gridSizeX*this._gridSizeY; ++i) {
            // Cull rendering of un-viewable chunks
            let chunkLoc = this.chunkArray.convArrToRelPos(this.chunkArray.convToSquare(i));
            if (chunkLoc[0] < chunkSpan[0][0] || chunkLoc[0] > chunkSpan[1][0] || chunkLoc[1] > chunkSpan[0][1] || chunkLoc[1] < chunkSpan[1][1]) {
                console.log("Chunk "+i+'/'+chunkLoc+" skipped.");
                continue;
            }

            for (let j = 0; j < this._chunkSize*this._chunkSize; ++j) {
                this.chunkArray.rawArray[i].tileData.rawArray[j].render2(this.renderConversion);
            }
        }
    }

    randomize(seed=this._seed) {
        noiseSeed(seed);

        for (let i = 0; i < this._gridSizeX*this._gridSizeY; ++i) {
            this.chunkArray.rawArray[i].randomize(this._tileSpanRange);
        }
    }
};



//// Camera + Position based coordinate system:
class camRenderConverter {
    constructor(posPair,canvasSizePair,tileSize=TILE_SIZE) { // ONLY NEED CAMERA POSITION + CANVAS SIZE
        this._camPosition = posPair; // CAMERA CENTER, BY GRID COORDINATE
        this._canvasSize = canvasSizePair; // CAMERA VIEW SIZE
        
        this._canvasCenter = [
            this._canvasSize[0]/2,
            this._canvasSize[1]/2
        ]; // Canvas center in pixels.

        this._tileSize = tileSize;
    }

    //// Util
    posAdd(a,b) { // = a + b
        return [
            a[0] + b[0],
            a[1] + b[1]
        ];
    }

    posSub(a,b) { // = a - b (pairwise)
        return [
            a[0]-b[0],
            a[1]-b[1]
        ];
    }

    posNeg(a) {// = -a
        return [
            -a[0],
            -a[1]
        ];
    }

    scalMul(a,c) { // = a*c
        return [
            a[0]*c,
            a[1]*c
        ];
    }

    //// Conversions
    convPosToCanvas(input) {
        let first = this.posSub(input,this._camPosition); // Convert to center relative to cam position
        let second = this.scalMul(first,this._tileSize); // Convert to pixel size, relative to (0,0) grid aka (0,0) canvas
        return this.posAdd(second,this._canvasCenter); // Offset to (cen,cen);
    }

    getViewSpan() {
        let tileOffsets = [ // Offsets without rounding (unknown if _camPosition will be rounded)
            // (this._canvasCenter[0]%TILE_SIZE != 0) ? floor(this._canvasCenter[0]/TILE_SIZE)+1 : this._canvasCenter[0]/TILE_SIZE,
            // (this._canvasCenter[1]%TILE_SIZE != 0) ? floor(this._canvasCenter[1]/TILE_SIZE)+1 : this._canvasCenter[1]/TILE_SIZE
            this._canvasCenter[0]/this._tileSize,
            this._canvasCenter[1]/this._tileSize
        ];

        return [
            [ // TL (-x,+y)
                this._camPosition[0]-tileOffsets[0],
                this._camPosition[1]+tileOffsets[1]
            ],
            [ // BR (+x,-y)
                this._camPosition[0]+tileOffsets[0],
                this._camPosition[1]-tileOffsets[1]
            ]
        ];
    }
}