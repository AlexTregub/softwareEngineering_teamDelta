///// TERRAIN is GRID of CHUNK is GRID of TILE 
///// TODO: Define functionality + update coordinate system

//// Position utilities
function posAdd(a,b) { // = a + b
    return [
        a[0] + b[0],
        a[1] + b[1]
    ];
}

function posSub(a,b) { // = a - b (pairwise)
    return [
        a[0]-b[0],
        a[1]-b[1]
    ];
}

function posNeg(a) {// = -a
    return [
        -a[0],
        -a[1]
    ];
}

function posMul(a,c) { // = a*c (Scalar)
    return [
        a[0]*c,
        a[1]*c
    ];
}


//// CHUNKED-TERRAIN
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

OLD SYSTEM (easier to implement, silly to think about)
eg: (tiles//backing grid?) - -0.5 offsets configured by Chunk. (only for rendering)
(-8.5,-8.5).......... ___________________
...........(-0.5,-0.5)___________________
______________________(-0.5,-0.5)........
______________________...........(7.5,7.5)

POTENTIAL:
eg: (tiles//backing grid?) - -0.5 offsets configured by Chunk. (only for rendering)
(-8.5,8.5).......... ___________________
...........(-0.5,0.5)___________________
______________________(-0.5,0.5)........
______________________...........(7.5,-7.5)
*/

// NOTE: OPTIMIZATIONS HAVE BEEN MADE TO DIRECT RENDERING AND CACHED RENDERING SIMULTANEOUSLY, BEWARE THE BUGS

// Currently fixed-size terrain.
class gridTerrain {
    constructor(gridSizeX,gridSizeY,g_seed,chunkSize=CHUNK_SIZE,tileSize=TILE_SIZE,canvasSize=[g_canvasX,g_canvasY]) {
        this._gridSizeX = gridSizeX;
        this._gridSizeY = gridSizeY;
        this._gridChunkCount = this._gridSizeX * this._gridSizeY;
        
        this._centerChunkX = floor((this._gridSizeX-1)/2);
        this._centerChunkY = floor((this._gridSizeY-1)/2);
        
        this._gridSpanTL = [ // Chunk positions, assigned for proper y-axis
            -this._centerChunkX,
            this._gridSizeY-this._centerChunkY
        ];

        this._chunkSize = chunkSize; // Chunk size (in tiles)
        this._tileSize = tileSize; // tile size (in pixels)
        this._seed = g_seed;
        
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
        // let len = this.chunkArray.getSize()[0]*this.chunkArray.getSize()[1];
        for (let i = 0; i < this._gridChunkCount; ++i) {
            let chunkPosition = this.chunkArray.convArrToRelPos(this.chunkArray.convToSquare(i));
            
            this.chunkArray.rawArray[i] = new Chunk(chunkPosition,
                [
                    chunkPosition[0]*this._chunkSize,
                    chunkPosition[1]*this._chunkSize
                ],
                this._chunkSize,
                this._tileSize
            );

            this.chunkArray.rawArray[i].randomize(g_seed); // Randomize at creation, not necessarily working correctly
        }

        this._canvasSize = canvasSize;

        // Get info (extracting from generated grid for consistency):
        this._tileSpan = [
            this.chunkArray.rawArray[0].tileData.getSpanRange()[0],
            this.chunkArray.rawArray[this._gridChunkCount - 1].tileData.getSpanRange()[1]
        ];

        this._tileSpanRange = [
            this._tileSpan[1][0] - this._tileSpan[0][0],
            // this._tileSpan[1][1] - this._tileSpan[0][1]
            this._tileSpan[0][1] - this._tileSpan[1][1] // Updated order for flipped y-axis
        ]

        // Canvas conversions handler
        this.renderConversion = new camRenderConverter([0,0],this._canvasSize,this._tileSize);
        
        // Terrain caching system for performance
        this._terrainCache = null;              // p5.Graphics off-screen buffer
        this._cacheValid = false;               // Dirty flag for cache invalidation
        this._cacheViewport = null;             // Cached viewport state for invalidation
        this._lastCameraPosition = [0, 0];     // Track camera movement
    }

    //// Functionality
    randomize(g_seed=this._seed) {
        noiseSeed(g_seed);

        for (let i = 0; i < this._gridSizeX*this._gridSizeY; ++i) {
            this.chunkArray.rawArray[i].randomize(this._tileSpanRange);
        }
        
        // Invalidate cache when terrain data changes
        this.invalidateCache();
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

    //// Utils
    convRelToAccess(pos) { // Converts grid position -> chunk (TL indexed) + relative (0,0 indexed), 2d format.
        // let chunkX = pos[0]%this._chunkSize == 0 ? pos[0]/this._chunkSize : floor(pos[0]/this._chunkSize)-1;
        let chunkX = pos[0]%this._chunkSize == 0 ? pos[0]/this._chunkSize : floor(pos[0]/this._chunkSize); // Not even I know why this works
        let chunkY = pos[1]%this._chunkSize == 0 ? pos[1]/this._chunkSize : floor(pos[1]/this._chunkSize)+1;

        let relX = pos[0] - chunkX*this._chunkSize;
        let relY = chunkY*this._chunkSize - pos[1];

        return [
            [chunkX,chunkY],
            [relX,relY]
        ]
    }

    convArrToAccess(pos) { // Converts legacy array position -> chunk (0,0 indexed) + relative, 2d format.
        // Assumes position is from (0,0) with old format.
        let chunkX = floor(pos[0]/this._chunkSize); // 2 -> 0.* -> chunk at 0,y
        let chunkY = floor(pos[1]/this._chunkSize);
        
        let relX = pos[0] - chunkX*this._chunkSize; // Will not round, allow for float positions
        let relY = pos[1] - chunkY*this._chunkSize;

        return [
            [chunkX,chunkY],
            [relX,relY]
        ]
    }

    //// Access - similar to grid functions
    // Assumes indexed from (0,0)
    getArrPos(pos) {
        let access = this.convArrToAccess(pos);
        let chunkRawAccess = this.chunkArray.convToFlat(access[0]);

        return this.chunkArray.rawArray[chunkRawAccess].getArrPos(access[1]);
    }

    setArrPos(pos,obj) {
        let access = this.convArrToAccess(pos);
        let chunkRawAccess = this.chunkArray.convToFlat(access[0]);

        return this.chunkArray.rawArray[chunkRawAccess].setArrPos(access[1],obj);
    }

    // Assumes indexed from TL position (_tileSpan[0])
    get(relPos) {
        let access = this.convRelToAccess(relPos);
        let chunkRawAccess = this.chunkArray.convToFlat(this.chunkArray.convRelToArrPos(access[0]));

        // CONVERSIONS HAVE FAILED?
        // console.log(access)
        // console.log(this.chunkArray.convRelToArrPos(access[0]))
        // console.log(chunkRawAccess)
        return this.chunkArray.rawArray[chunkRawAccess].getArrPos(access[1]);
    }

    set(relPos,obj) {
        let access = this.convRelToAccess(relPos);
        let chunkRawAccess = this.chunkArray.convToFlat(this.chunkArray.convRelToArrPos(access[0]));

        return this.chunkArray.rawArray[chunkRawAccess].setArrPos(access[1],obj);
    }


    //// Rendering (+ pipeline)
    render() {
        // Use caching system for performance optimization
        if (!this._shouldUseCache()) {
            console.log('GridTerrain: Caching disabled, using direct rendering');
            // this.renderConversion.forceTileUpdate();  // Improves performance, leaves inconsistent framerate.
            this.renderDirect();
            return;
        }

        // Show current canvas dimensions for debugging
        const currentCanvasWidth = typeof g_canvasX !== 'undefined' ? g_canvasX : this._canvasSize[0];
        const currentCanvasHeight = typeof g_canvasY !== 'undefined' ? g_canvasY : this._canvasSize[1];
        
        // Check if cache needs regeneration
        if (!this._cacheValid || this._viewportChanged() || !this._terrainCache) {
            if (typeof globalThis.logNormal === 'function') {
              globalThis.logNormal(`GridTerrain: Cache needs regeneration - Canvas: ${currentCanvasWidth}x${currentCanvasHeight}, valid: ${this._cacheValid}, viewportChanged: ${this._viewportChanged()}, exists: ${!!this._terrainCache}`);
            } else {
              console.log(`GridTerrain: Cache needs regeneration - Canvas: ${currentCanvasWidth}x${currentCanvasHeight}, valid: ${this._cacheValid}, viewportChanged: ${this._viewportChanged()}, exists: ${!!this._terrainCache}`);
            }
            this._generateTerrainCache();
        }

        // If cache generation failed, fall back to direct rendering
        if (!this._cacheValid || !this._terrainCache) {
            console.warn('GridTerrain: Cache invalid, falling back to direct rendering');
            this.renderDirect();
            return;
        }

        // Draw the cached terrain
        this._drawCachedTerrain();
    }

    /**
     * Generate terrain cache by rendering all terrain to an off-screen buffer
     * This is expensive but only happens when terrain or viewport changes
     * @private
     */
    _generateTerrainCache() {
        try {
            if (typeof globalThis.logNormal === 'function') {
              globalThis.logNormal('GridTerrain: Generating terrain cache...');
            } else {
              console.log('GridTerrain: Generating terrain cache...');
            }
            
            // Use current canvas dimensions (g_canvasX, g_canvasY) instead of stored _canvasSize
            const currentCanvasWidth = typeof g_canvasX !== 'undefined' ? g_canvasX : this._canvasSize[0];
            const currentCanvasHeight = typeof g_canvasY !== 'undefined' ? g_canvasY : this._canvasSize[1];
            
            // Calculate the actual terrain size needed
            const totalTilesX = this._gridSizeX * this._chunkSize;
            const totalTilesY = this._gridSizeY * this._chunkSize;
            const terrainWidth = totalTilesX * this._tileSize;
            const terrainHeight = totalTilesY * this._tileSize;
            
            if (typeof globalThis.logVerbose === 'function') {
              globalThis.logVerbose(`GridTerrain: Cache dimensions - Current Canvas: ${currentCanvasWidth}x${currentCanvasHeight}, Terrain: ${terrainWidth}x${terrainHeight}`);
            } else {
              console.log(`GridTerrain: Cache dimensions - Current Canvas: ${currentCanvasWidth}x${currentCanvasHeight}, Terrain: ${terrainWidth}x${terrainHeight}`);
            }
            
            // Safely create off-screen graphics buffer - use current canvas size for viewport-based caching
            if (this._terrainCache) {
                this._terrainCache.remove(); // Clean up previous cache
            }
            
            // Create cache buffer same size as current canvas for viewport-based rendering
            const cacheWidth = currentCanvasWidth;
            const cacheHeight = currentCanvasHeight;
            
            this._terrainCache = createGraphics(cacheWidth, cacheHeight);
            
            if (!this._terrainCache) {
                console.warn('GridTerrain: Failed to create graphics buffer, falling back to direct rendering');
                this._cacheValid = false;
                return;
            }
            
            // Initialize the cache buffer with transparent background
            this._terrainCache.clear();
            
            // Create a render converter that matches the main rendering system
            // Use the same camera position and CURRENT canvas size for proper alignment
            this._cacheRenderConverter = new camRenderConverter(
                [...this.renderConversion._camPosition],  // Same camera position
                [cacheWidth, cacheHeight],               // Current canvas size
                this._tileSize                          // Same tile size
            );
            
            // Render all terrain chunks to cache using safer method
            this._renderChunksToCache();
            
            // Mark cache as valid and store current viewport
            this._cacheValid = true;
            this._cacheViewport = {
                camPosition: [...this.renderConversion._camPosition],
                canvasSize: [cacheWidth, cacheHeight],   // Store current canvas size
                cacheSize: [cacheWidth, cacheHeight]
            };
            this._lastCameraPosition = [...this.renderConversion._camPosition];
            
            if (typeof globalThis.logNormal === 'function') {
              globalThis.logNormal('GridTerrain: Terrain cache generated successfully');
            } else {
              console.log('GridTerrain: Terrain cache generated successfully');
            }
            
        } catch (error) {
            console.error('GridTerrain: Error generating terrain cache:', error);
            this._cacheValid = false;
            this._terrainCache = null;
        }
    }

    /**
     * Render all chunks to the cache buffer using a safer approach
     * @private
     */
    _renderChunksToCache(converter=this.renderConversion) {
        // Set drawing context to the cache buffer
        this._terrainCache.push();
        
        // Render all terrain chunks directly using p5.Graphics methods
        // for (let i = 0; i < this._gridSizeX * this._gridSizeY; ++i) {
        //     // let chunkPos = this.chunkArray.convArrToRelPos(this.chunkArray.convToSquare(i));

        //     for (let j = 0; j < this._chunkSize * this._chunkSize; ++j) {
        //         // const tile = this.chunkArray.rawArray[i].tileData.rawArray[j];
        //         this._renderTileToCache(this.chunkArray.rawArray[i].tileData.rawArray[j]);
        //     }
        // }

        // Only render SOME chunks, should reduce cache's size -> better framerate.
        let viewSpan = converter.getViewSpan();
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

        // Copied from renderDirect().
        for (let y = chunkSpan[1][1]; y <= chunkSpan[0][1]; ++y) {
            for (let x = chunkSpan[0][0]; x <= chunkSpan[1][0]; ++x) { // Potentially works with < , not necessarily correct.
                // this.chunkArray.rawArray[this.chunkArray.convToFlat(this.chunkArray.convRelToArrPos([x,y]))].render(converter);
                
                let chunkAccessPos = this.chunkArray.convToFlat(this.chunkArray.convRelToArrPos([x,y]));
                let accessLen = this._chunkSize*this._chunkSize;

                for (let i = 0; i < accessLen; ++i) { // Potentially inefficient, using for caching only.
                    this._renderTileToCache(this.chunkArray.rawArray[chunkAccessPos].tileData.rawArray[i])
                }
            }
        }
        
        this._terrainCache.pop();
    }

    /**
     * Render a single tile to the cache buffer using the original tile rendering system
     * @param {Object} tile - The tile object to render
     * @private
     */
    _renderTileToCache(tile,converter=this.renderConversion) {
        if (!tile || !this._terrainCache) return;
        
        try {
            // Get tile position from tile object
            const tilePos = [tile._x, tile._y];
            
            // Convert world position to cache buffer coordinates using cache render converter
            const cachePos = this._cacheRenderConverter.convPosToCanvas(tilePos);
            // const cachePos = converter.convPosToCanvas(tilePos); // Using shared render converter?
            
            // Use tile's material to render correctly
            const material = tile._materialSet || 'grass';
            
            if (typeof TERRAIN_MATERIALS_RANGED !== 'undefined' && TERRAIN_MATERIALS_RANGED[material]) {
                // CLEAN APPROACH: Use context-aware renderer (no global overrides!)
                if (typeof renderMaterialToContext === 'function') {
                    // Use the new context-aware renderer that respects existing material definitions
                    renderMaterialToContext(material, cachePos[0], cachePos[1], this._tileSize, this._terrainCache);
                } else {
                    // Fallback: Direct cache rendering if context renderer not available
                    this._renderMaterialDirectToCache(material, cachePos[0], cachePos[1], this._tileSize);
                }
            } else {
                // Fallback: draw a default colored tile
                this._terrainCache.fill(100, 150, 100); // Default grass color
                // this._terrainCache.fill(255, 0, 0); // Default grass color
                this._terrainCache.noStroke();
                this._terrainCache.rect(cachePos[0], cachePos[1], this._tileSize, this._tileSize);
            }
            
        } catch (error) {
            console.warn('GridTerrain: Error rendering tile to cache:', error, tile);
            
            // Emergency fallback
            if (this._terrainCache) {
                this._terrainCache.fill(100, 150, 100);
                this._terrainCache.noStroke();
                this._terrainCache.rect(0, 0, this._tileSize, this._tileSize);
            }
        }
    }

    /**
     * Check if the viewport has changed since last cache generation
     * @returns {boolean} True if viewport changed
     * @private
     */
    _viewportChanged() {
        if (!this._cacheViewport) return true;
        
        // Check camera position
        const currentCamPos = this.renderConversion._camPosition;
        if (currentCamPos[0] !== this._cacheViewport.camPosition[0] || 
            currentCamPos[1] !== this._cacheViewport.camPosition[1]) {
            return true;
        }
        
        // Check current canvas size (use live g_canvasX, g_canvasY values)
        const currentCanvasWidth = typeof g_canvasX !== 'undefined' ? g_canvasX : this._canvasSize[0];
        const currentCanvasHeight = typeof g_canvasY !== 'undefined' ? g_canvasY : this._canvasSize[1];
        if (currentCanvasWidth !== this._cacheViewport.canvasSize[0] || 
            currentCanvasHeight !== this._cacheViewport.canvasSize[1]) {
            console.log(`GridTerrain: Canvas size changed from ${this._cacheViewport.canvasSize[0]}x${this._cacheViewport.canvasSize[1]} to ${currentCanvasWidth}x${currentCanvasHeight}`);
            return true;
        }
        
        return false;
    }

    /**
     * Force cache invalidation (call when terrain data changes)
     * @public
     */
    invalidateCache() {
        this._cacheValid = false;
        if (typeof globalThis.logNormal === 'function') {
          globalThis.logNormal('GridTerrain: Cache invalidated manually');
        } else {
          console.log('GridTerrain: Cache invalidated manually');
        }
    }

    /**
     * Update camera position for viewport change detection
     * @param {Array} newPosition - [x, y] camera position
     * @public
     */
    setCameraPosition(newPosition) {
        this.renderConversion._camPosition = [...newPosition];
        // Cache will be invalidated automatically on next render if position changed
    }

    /**
     * Draw the cached terrain to the main canvas
     * @private
     */
    _drawCachedTerrain() {
        if (!this._terrainCache || !this._cacheValid) return;
        
        try {
            // Draw the cached terrain buffer directly to the main canvas
            // Since the cache is rendered with the same coordinate system,
            // we can draw it at (0,0) and it will align correctly
            image(this._terrainCache, g_canvasX/2, g_canvasY/2); 
            
        } catch (error) {
            console.error('GridTerrain: Error drawing cached terrain:', error);
            // Fall back to direct rendering
            this.renderDirect();
        }
    }

    /**
     * Check if caching should be used (can be disabled for debugging)
     * @returns {boolean} True if caching should be used
     * @private
     */
    _shouldUseCache() {
        // Allow runtime disabling of cache for debugging
        if (window && window.DISABLE_TERRAIN_CACHE) {
            return false;
        }
        return true;
    }

    /**
     * Get current cache statistics for debugging
     * @returns {Object} Cache statistics
     * @public
     */
    getCacheStats() {
        const currentCanvasWidth = typeof g_canvasX !== 'undefined' ? g_canvasX : this._canvasSize[0];
        const currentCanvasHeight = typeof g_canvasY !== 'undefined' ? g_canvasY : this._canvasSize[1];
        
        return {
            cacheValid: this._cacheValid,
            cacheExists: this._terrainCache !== null,
            cachingEnabled: this._shouldUseCache(),
            lastCameraPosition: [...this._lastCameraPosition],
            currentCameraPosition: [...this.renderConversion._camPosition],
            storedCanvasSize: [...this._canvasSize],
            currentCanvasSize: [currentCanvasWidth, currentCanvasHeight],
            cacheViewport: this._cacheViewport,
            viewportChanged: this._viewportChanged()
        };
    }

    /**
     * Original render method for fallback or debugging
     * @public
     */
    renderDirect(converter=this.renderConversion) {
        let chunksRendered = 0;

        let viewSpan = converter.getViewSpan();
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

        // for (let i = 0; i < this._gridSizeX*this._gridSizeY; ++i) {
        //     // Cull rendering of un-viewable chunks
        //     let chunkLoc = this.chunkArray.convArrToRelPos(this.chunkArray.convToSquare(i));
        //     if (chunkLoc[0] < chunkSpan[0][0] || chunkLoc[0] > chunkSpan[1][0] || chunkLoc[1] > chunkSpan[0][1] || chunkLoc[1] < chunkSpan[1][1]) {
        //         // console.log("Chunk "+i+'/'+chunkLoc+" skipped.");
        //         chunksSkipped += 1;
        //         continue;
        //     }

        //     for (let j = 0; j < this._chunkSize*this._chunkSize; ++j) {
        //         this.chunkArray.rawArray[i].tileData.rawArray[j].render2(converter); // Avoids copies
        //     }
        // }
        
        // Only access chunks which need to be rendered, reduce array access at cost of position conversions
        // Verify indices, seem ok.
        for (let y = chunkSpan[1][1]; y <= chunkSpan[0][1]; ++y) {
            for (let x = chunkSpan[0][0]; x <= chunkSpan[1][0]; ++x) { // Potentially works with < , not necessarily correct.
                this.chunkArray.rawArray[this.chunkArray.convToFlat(this.chunkArray.convRelToArrPos([x,y]))].render(converter);
                ++chunksRendered;
            }
        }

        // console.log("Skipped "+chunksSkipped+" chunks in frame (of "+this._gridSizeX*this._gridSizeY+')');
        console.log("Rendered "+chunksRendered+" chunks in frame of "+this._gridChunkCount +". Current fps: "+frameRate());
    
    }
};

// Global functions to control and monitor terrain cache from console
function checkTerrainCacheStatus() {
    if (typeof g_map2 !== 'undefined' && g_map2 && typeof g_map2.getCacheStats === 'function') {
        const stats = g_map2.getCacheStats();
        console.log('Terrain Cache Status:', stats);
        return stats;
    } else {
        console.log('Terrain cache not available');
        return null;
    }
}

function enableTerrainCache() {
    window.DISABLE_TERRAIN_CACHE = false;
    if (g_map2) {
        g_map2.invalidateCache();
        console.log('Terrain cache enabled');
    }
}

function disableTerrainCache() {
    window.DISABLE_TERRAIN_CACHE = true;
    console.log('Terrain cache disabled');
}

function forceTerrainCacheRegeneration() {
    if (g_map2) {
        g_map2.invalidateCache();
        console.log('Terrain cache regeneration forced');
    }
}



//// Camera + Position based coordinate system:
class camRenderConverter {
    constructor(posPair,canvasSizePair,tileSize=TILE_SIZE) { // ONLY NEED CAMERA POSITION + CANVAS SIZE
        this._camPosition = posPair; // CAMERA CENTER, BY GRID COORDINATE
        this._canvasSize = canvasSizePair; // CAMERA VIEW SIZE
        
        this._canvasCenter = [
            this._canvasSize[0]/2,
            this._canvasSize[1]/2
        ]; // Canvas center in pixels.
        this._canvasSizePair = canvasSizePair;

        this._tileSize = tileSize;

        let tileOffsets = [ // Offsets without rounding (unknown if _camPosition will be rounded)
            // (this._canvasCenter[0]%TILE_SIZE != 0) ? floor(this._canvasCenter[0]/TILE_SIZE)+1 : this._canvasCenter[0]/TILE_SIZE,
            // (this._canvasCenter[1]%TILE_SIZE != 0) ? floor(this._canvasCenter[1]/TILE_SIZE)+1 : this._canvasCenter[1]/TILE_SIZE
            this._canvasCenter[0]/this._tileSize,
            this._canvasCenter[1]/this._tileSize
        ];
        this._viewSpan = [
            [ // TL (-x,+y)
                this._camPosition[0]-tileOffsets[0],
                this._camPosition[1]+tileOffsets[1]
            ],
            [ // BR (+x,-y)
                this._camPosition[0]+tileOffsets[0],
                this._camPosition[1]-tileOffsets[1]
            ]
        ];

        this._updateId = 0; // Incrementing this will trigger updates in tiles, MUST BE DONE
        // this._updateId = random()
    }

    //// State modifier
    setCenterPos(pos) {
        ++this._updateId;

        this._camPosition = pos;
    }

    setCanvasSize(sizePair) {
        ++this._updateId;

        this._canvasSize = sizePair;
        this._canvasCenter = [
            this._canvasSize[0]/2,
            this._canvasSize[1]/2
        ]; // Canvas center in pixels.

        let tileOffsets = [ // Offsets without rounding (unknown if _camPosition will be rounded)
            this._canvasCenter[0]/this._tileSize,
            this._canvasCenter[1]/this._tileSize
        ];
        this._viewSpan = [ // Calc view Span
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

    setTileSize(size) {
        ++this._updateId;

        this._tileSize = size;
    }

    forceTileUpdate() { // Use for custom rendering of map. If used for first time, will ALWAYS cause update, then, has low probability to fail.
        this._updateId = random(Number.MIN_SAFE_INTEGER,-1);
    }

    //// Util
    // ...

    // Calculate offset to align gridTerrain with canvas 0,0. Always works, will not move screen more than 1 tile.
    alignToCanvas() {
        ++this._updateId;
        let alignPos = this.convCanvasToPos([0,0]); // Fixed reference
        // console.log(alignPos);

        let alignOffsetX = floor(alignPos[0]) - alignPos[0];
        let alignOffsetY = floor(alignPos[1]) - alignPos[1];
        // console.log(alignOffsetX,alignOffsetY);

        this._camPosition = [alignOffsetX,alignOffsetY];
    }

    //// Conversions
    convPosToCanvas(input) {
        // 'Proper' conversion:
        // let first = this.posSub(input,this._camPosition); // Convert to center relative to cam position
        // let second = this.scalMul(first,this._tileSize); // Convert to pixel size, relative to (0,0) grid aka (0,0) canvas
        // let third = this.posAdd(second,this._canvasCenter); // Offset to (cen,cen);
        
        // (input[0] - this._camPosition[0])*this._tileSize + this._canvasCenter[0]
        // return third;

        // Handling inverted y:
        // let first = this.posSub(input,this._camPosition); // Convert to center relative to cam position
        // first[1]*=-1; // Invert rendering on y axis.
        // let second = this.scalMul(first,this._tileSize); // Convert to pixel size, relative to (0,0) grid aka (0,0) canvas
        // let third = this.posAdd(second,this._canvasCenter); // Offset to (cen,cen);
        
        // return third;

        return [
            (input[0] - this._camPosition[0])*this._tileSize + this._canvasCenter[0],
            -1*(input[1] - this._camPosition[1])*this._tileSize + this._canvasCenter[1]
        ];
    }

    convCanvasToPos(input) { // Invert pos->canvas calc
        // let thirdInv = this.posSub(input,this._canvasCenter);
        // let secondInv = this.scalMul(thirdInv,1/this._tileSize);
        // let firstInv = this.posAdd(secondInv,this._camPosition)
        // return firstInv;

        return [
            (input[0] - this._canvasCenter[0])/this._tileSize + this._camPosition[0],
            // (input[1] - this._canvasCenter[1])/this._tileSize + this._camPosition[1]
            (input[1] - this._canvasCenter[1])/-this._tileSize + this._camPosition[1]
        ];
    }

    // Get info:
    getViewSpan() {
        return this._viewSpan;
    }

    getUpdateId() {
        return this._updateId;
    }

    //// Get Span:
    // getPosSpan() {
    //     // Get canvas size/offsets.
    //     // let posOffsetFromCamX = floor(this._canvasCenter[0]/TILE_SIZE);
    //     // let posOffsetFromCamY = floor(this._canvasCenter[1]/TILE_SIZE);
    //     // if (this._canvasCenter[0]%TILE_SIZE != 0) {
    //     //     ++posOffsetFromCamX;
    //     // }
    //     // if (this._canvasCenter[1]%TILE_SIZE != 0) {
    //     //     ++posOffsetFromCamY;
    //     // }
    //     // Conditional assign: 
    //     // this._canvasCenter[0]%TILE_SIZE == 0 ? this._canvasCenter[0]/TILE_SIZE : floor(this._canvasCenter[0]/TILE_SIZE)+1

    //     // print(this._canvasCenter);
    //     // print(this._canvasSizePair);

    //     let posOffsetFromCamX = this._canvasCenter[0]%TILE_SIZE == 0 ? this._canvasCenter[0]/TILE_SIZE : floor(this._canvasCenter[0]/TILE_SIZE)+1
    //     let posOffsetFromCamY = this._canvasCenter[1]%TILE_SIZE == 0 ? this._canvasCenter[1]/TILE_SIZE : floor(this._canvasCenter[1]/TILE_SIZE)+1

    //     return [ // Return TL, BR pos
    //         [ // TL, -x,+y
    //             this._camPosition[0]-posOffsetFromCamX,
    //             this._camPosition[1]+posOffsetFromCamY
    //         ],
    //         [ // BR, +x,-y
    //             this._camPosition[0]+posOffsetFromCamX,
    //             this._camPosition[1]-posOffsetFromCamY
    //         ]
    //     ]
    // }
}