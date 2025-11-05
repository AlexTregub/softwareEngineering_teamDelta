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
    constructor(gridSizeX,gridSizeY,g_seed,chunkSize=CHUNK_SIZE,tileSize=TILE_SIZE,canvasSize=[g_canvasX,g_canvasY],generationMode='perlin') {
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
        this._generationMode = generationMode; // Terrain generation algorithm
        
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

            // Apply terrain generation based on mode
            this.chunkArray.rawArray[i].applyGenerationMode(this._generationMode, chunkPosition, this._tileSpanRange, g_seed);
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

    /**
     * Public API
     * Allows the map to be centered to the canvas
     */
    setGridToCenter(){
        this.renderConversion.alignToCanvas()
    }

    /**
     * Calculate dynamic chunk buffer based on camera zoom level
     * More chunks are rendered when zoomed out for smoother scrolling
     * @private
     * @returns {number} Number of extra chunks to render in each direction
     */
    _calculateChunkBuffer() {
        // Get zoom level from CameraManager
        let zoomLevel = 1.0; // Default zoom if CameraManager not available
        
        // Try to get zoom from global CameraManager
        if (typeof cameraManager !== 'undefined' && cameraManager && typeof cameraManager.cameraZoom !== 'undefined') {
            zoomLevel = cameraManager.cameraZoom;
        }
        // Fallback: try to get zoom from global variables
        else if (typeof cameraZoom !== 'undefined') {
            zoomLevel = cameraZoom;
        }
        
        // Calculate buffer: more chunks when zoomed out (low zoom values)
        const baseBuffer = 3;
        const dynamicBuffer = Math.max(1, Math.floor(baseBuffer / Math.max(0.25, zoomLevel)));
        
        // Cap the buffer to reasonable limits for performance
        return Math.min(6, Math.max(1, dynamicBuffer));
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
        // logNormal(access)
        // logNormal(this.chunkArray.convRelToArrPos(access[0]))
        // logNormal(chunkRawAccess)
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
            logNormal('GridTerrain: Caching disabled, using direct rendering');
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
              logNormal(`GridTerrain: Cache needs regeneration - Canvas: ${currentCanvasWidth}x${currentCanvasHeight}, valid: ${this._cacheValid}, viewportChanged: ${this._viewportChanged()}, exists: ${!!this._terrainCache}`);
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
              logNormal('GridTerrain: Generating terrain cache...');
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
              logNormal(`GridTerrain: Cache dimensions - Current Canvas: ${currentCanvasWidth}x${currentCanvasHeight}, Terrain: ${terrainWidth}x${terrainHeight}`);
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
            
            // Create a render converter for cache rendering
            // CRITICAL: For p5.Graphics buffers, we need the buffer's CENTER to correspond
            // to the camera position, so we set canvas center to half the buffer size
            this._cacheRenderConverter = new camRenderConverter(
                [...this.renderConversion._camPosition],  // Same camera position
                [cacheWidth, cacheHeight],               // Current canvas size
                this._tileSize                          // Same tile size
            );
            
            // Keep the canvas center at buffer center for proper tile positioning
            // This makes tiles render centered around camera position in the buffer
            // (Don't override _canvasCenter - let it stay at [cacheWidth/2, cacheHeight/2])
            
            // Render all terrain chunks to cache using safer method
            // Pass the cache converter so it uses the correct viewport calculation
            this._renderChunksToCache(this._cacheRenderConverter);
            
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
              logNormal('GridTerrain: Terrain cache generated successfully');
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
        
        // Ensure proper image mode for tile rendering
        this._terrainCache.imageMode(CORNER);
        this._terrainCache.noSmooth(); // Match main canvas rendering
        
        // Render all terrain chunks directly using p5.Graphics methods
        // for (let i = 0; i < this._gridSizeX * this._gridSizeY; ++i) {
        //     // let chunkPos = this.chunkArray.convArrToRelPos(this.chunkArray.convToSquare(i));

        //     for (let j = 0; j < this._chunkSize * this._chunkSize; ++j) {
        //         // const tile = this.chunkArray.rawArray[i].tileData.rawArray[j];
        //         this._renderTileToCache(this.chunkArray.rawArray[i].tileData.rawArray[j]);
        //     }
        // }

        // Only render visible chunks plus a dynamic buffer based on zoom level
        let viewSpan = converter.getViewSpan();
        
        // Dynamic chunk buffer - render more chunks when zoomed out for smoother scrolling
        // Add +1 to ensure we cover edges when using imageMode(CENTER)
        const CHUNK_BUFFER = this._calculateChunkBuffer() + 1;
        
        // Use ceil for TL to ensure we capture partial chunks on the edges
        // Use floor for BR to ensure we capture partial chunks on the edges
        let chunkSpan = [
            [ // -x,+y TL - Expand outward by buffer amount with bounds checking
                Math.max(this._gridSpanTL[0], Math.floor(viewSpan[0][0]/this._chunkSize) - CHUNK_BUFFER),
                Math.min(this._gridSpanTL[1], Math.ceil(viewSpan[0][1]/this._chunkSize) + CHUNK_BUFFER)
            ],
            [ // +x,-y BR - Expand outward by buffer amount with bounds checking
                Math.min(this._gridSpanTL[0] + this._gridSizeX - 1, Math.ceil(viewSpan[1][0]/this._chunkSize) + CHUNK_BUFFER),
                Math.max(this._gridSpanTL[1] - this._gridSizeY + 1, Math.floor(viewSpan[1][1]/this._chunkSize) - CHUNK_BUFFER)
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
            
            // DEBUG: Log first few tile positions
            if (tile._x === 0 && tile._y === 0 && typeof globalThis.logVerbose === 'function') {
                globalThis.logVerbose(`Rendering tile at world [${tilePos}] to cache position [${cachePos}]`);
            }
            
            // Use tile's material to render correctly
            const material = tile._materialSet;
            
            if (typeof TERRAIN_MATERIALS_RANGED !== 'undefined' && TERRAIN_MATERIALS_RANGED[material]) {
                // CLEAN APPROACH: Use context-aware renderer (no global overrides!)
                if (typeof renderMaterialToContext === 'function') {
                    // Use the new context-aware renderer that respects existing material definitions
                    renderMaterialToContext(material, cachePos[0], cachePos[1], this._tileSize, this._terrainCache);
                }
            }            
        } catch (error) {
            console.warn('GridTerrain: Error rendering tile to cache:', error, tile);
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
        
        // Check current canvas size
        const currentCanvasWidth = this._canvasSize[0];
        const currentCanvasHeight = this._canvasSize[1];
        if (currentCanvasWidth !== this._cacheViewport.canvasSize[0] || 
            currentCanvasHeight !== this._cacheViewport.canvasSize[1]) {
            logVerbose(`GridTerrain: Canvas size changed from ${this._cacheViewport.canvasSize[0]}x${this._cacheViewport.canvasSize[1]} to ${currentCanvasWidth}x${currentCanvasHeight}`);
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
          logNormal('GridTerrain: Cache invalidated manually');
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
            // DEBUG: Log coordinate systems
            if (typeof globalThis.logVerbose === 'function') {
                globalThis.logVerbose(`Cache Draw - Main canvas center: [${this.renderConversion._canvasCenter}], Cache canvas center: [${this._cacheRenderConverter._canvasCenter}]`);
                globalThis.logVerbose(`Camera position: [${this.renderConversion._camPosition}]`);
                globalThis.logVerbose(`Cache buffer size: ${this._terrainCache.width}x${this._terrainCache.height}`);
            }
            
            // Draw cache using CORNER mode to match how tiles were rendered into cache
            // CRITICAL FIX: Using CENTER mode caused a 0.5-tile offset because the cache
            // content was rendered with CORNER mode. We must use CORNER for both.
            push();
            imageMode(CORNER);
            // Calculate top-left corner position for CORNER mode
            // (was centered, now need top-left corner)
            const cacheX = this.renderConversion._canvasCenter[0] - this._terrainCache.width / 2;
            const cacheY = this.renderConversion._canvasCenter[1] - this._terrainCache.height / 2;
            image(this._terrainCache, cacheX, cacheY); 
            pop();
            
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
        
        // Use same dynamic chunk buffer as cache rendering for consistency
        const CHUNK_BUFFER = this._calculateChunkBuffer();
        
        let chunkSpan = [
            [ // -x,+y TL - Expand outward by buffer amount with bounds checking
                Math.max(this._gridSpanTL[0], floor(viewSpan[0][0]/this._chunkSize) - CHUNK_BUFFER),
                Math.min(this._gridSpanTL[1], floor(viewSpan[0][1]/this._chunkSize) + CHUNK_BUFFER)
            ],
            [ // +x,-y BR - Expand outward by buffer amount with bounds checking
                Math.min(this._gridSpanTL[0] + this._gridSizeX - 1, floor(viewSpan[1][0]/this._chunkSize) + CHUNK_BUFFER),
                Math.max(this._gridSpanTL[1] - this._gridSizeY + 1, floor(viewSpan[1][1]/this._chunkSize) - CHUNK_BUFFER)
            ]
        ];

        // for (let i = 0; i < this._gridSizeX*this._gridSizeY; ++i) {
        //     // Cull rendering of un-viewable chunks
        //     let chunkLoc = this.chunkArray.convArrToRelPos(this.chunkArray.convToSquare(i));
        //     if (chunkLoc[0] < chunkSpan[0][0] || chunkLoc[0] > chunkSpan[1][0] || chunkLoc[1] > chunkSpan[0][1] || chunkLoc[1] < chunkSpan[1][1]) {
        //         // logNormal("Chunk "+i+'/'+chunkLoc+" skipped.");
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

        // logNormal("Skipped "+chunksSkipped+" chunks in frame (of "+this._gridSizeX*this._gridSizeY+')');
        logNormal("Rendered "+chunksRendered+" chunks in frame of "+this._gridChunkCount +". Current fps: "+frameRate());
    
    }

    randomize(g_seed=this._seed) {
        noiseSeed(g_seed);

        for (let i = 0; i < this._gridSizeX*this._gridSizeY; ++i) {
            this.chunkArray.rawArray[i].randomize(this._tileSpanRange);
        }
        
        // Invalidate cache when terrain data changes
        this.invalidateCache();
    }

    // What in the hellll happened here. CEIL MIGHT BE AMAZING THO...
    // AI temporary solution until we fix whatever is causing the
    // buggy behavior in our current chunkArray.get() or chunk.get() functions
    // This implemetation manually calculates everything
    // getTileAt(tileX, tileY) {

    //     // === PART 1: MANUALLY FIND THE CHUNK ===

    //     // Correctly calculate the chunk's X coordinate.
    //     const chunkX = Math.floor(tileX / this._chunkSize);
        
    //     // --- THIS IS THE FIX ---
    //     // The original `Math.floor` was wrong. `Math.ceil` is the correct
    //     // logic for this game's Y-down coordinate system.
    //     let chunkY = Math.ceil(tileY / this._chunkSize);
        
    //     // This part handles the "y=0" edge case, which belongs to chunk 0.
    //     if (tileY === 0) {
    //         chunkY = 0;
    //     }

    //     // Get the chunkArray's top-left world coordinate (its "span").
    //     const chunkGridTopLeft = this.chunkArray.getSpanRange()[0];

    //     // Manually calculate the chunk's 2D array index within the chunkArray grid.
    //     const chunkArrayX = chunkX - chunkGridTopLeft[0];
    //     const chunkArrayY = chunkGridTopLeft[1] - chunkY;

    //     // Manually "flatten" the 2D index to a 1D index for the rawArray.
    //     const chunkGridWidth = this.chunkArray.getSize()[0];
    //     const chunkFlatIndex = chunkArrayY * chunkGridWidth + chunkArrayX;
        
    //     // Safety check: ensure the calculated chunk index is valid.
    //     if (chunkArrayX < 0 || chunkArrayX >= chunkGridWidth ||
    //         chunkArrayY < 0 || chunkArrayY >= this.chunkArray.getSize()[1]) {
    //         return null; // The requested coordinate is outside the entire map.
    //     }

    //     // Get the chunk directly from the raw array.
    //     const chunk = this.chunkArray.rawArray[chunkFlatIndex];

    //     // === PART 2: MANUALLY FIND THE TILE WITHIN THE CHUNK ===

    //     if (chunk) {
    //         // Get the chunk's own top-left world coordinate.
    //         const tileGridTopLeft = chunk.getSpanRange()[0];

    //         // Manually calculate the tile's local 2D array index within the chunk.
    //         const tileArrayX = tileX - tileGridTopLeft[0];
    //         const tileArrayY = tileGridTopLeft[1] - tileY;

    //         // Manually "flatten" the 2D index for the tile's rawArray.
    //         const tileGridWidth = chunk.getSize()[0];
    //         const tileFlatIndex = tileArrayY * tileGridWidth + tileArrayX;

    //         // Safety check: ensure the calculated tile index is valid.
    //         if (tileArrayX >= 0 && tileArrayX < tileGridWidth &&
    //             tileArrayY >= 0 && tileArrayY < chunk.getSize()[1]) {
                
    //             // Get the tile directly from the chunk's raw array.
    //             return chunk.tileData.rawArray[tileFlatIndex];
    //         }
    //     }

    //     return null; // Chunk or tile not found.


    //     // original code that doesn't work rn because something
    //     // buggy happens when going through layers of the terrain
    //     // system (grid of chunk, to grid of tile, to actual tile)
    //     // with the current functions that are supposed to that
    //     /*
    //     // Calculate which chunk the tile belongs to.
    //     const chunkX = Math.floor(tileX / this._chunkSize);
    //     const chunkY = Math.floor(tileY / this._chunkSize);

    //     // Access the chunk from the chunkArray grid
    //     const chunk = this.chunkArray.get([chunkX, chunkY]);

    //     // If the chunk exists, get the tile from its internal grid.
    //     if (chunk) {
    //         const tile = chunk.get([tileX, tileY]);
    //         return tile;
    //     }

    //     // If the chunk doesn't exist, there is no tile
    //     return null;

    //     */
    // }
};

// Global functions to control and monitor terrain cache from console
function checkTerrainCacheStatus() {
    if (typeof g_activeMap !== 'undefined' && g_activeMap && typeof g_activeMap.getCacheStats === 'function') {
        const stats = g_activeMap.getCacheStats();
        logNormal('Terrain Cache Status:', stats);
        return stats;
    } else {
        logNormal('Terrain cache not available');
        return null;
    }
}

function enableTerrainCache() {
    window.DISABLE_TERRAIN_CACHE = false;
    if (g_activeMap) {
        g_activeMap.invalidateCache();
        logNormal('Terrain cache enabled');
    }
}

function disableTerrainCache() {
    window.DISABLE_TERRAIN_CACHE = true;
    logNormal('Terrain cache disabled');
}

function forceTerrainCacheRegeneration() {
    if (g_activeMap) {
        g_activeMap.invalidateCache();
        logNormal('Terrain cache regeneration forced');
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


    /**
     * Update canvas dimensions and recalculate viewport boundaries
     * 
     * This method handles window resize events by updating the canvas size
     * and recalculating how many tiles are visible in the new viewport.
     * 
     * @param {Array} sizePair - New canvas dimensions [width, height] in pixels
     * 
     * Key calculations:
     * 1. Updates canvas center point (used as viewport origin)
     * 2. Calculates tile offsets (how many tiles from center to edge)
     * 3. Recalculates view span boundaries in tile coordinates
     * 
     * The view span defines the visible rectangle:
     * - Top-Left: camera position minus tile offsets (expanded viewport)
     * - Bottom-Right: camera position plus tile offsets (expanded viewport)
     * 
     * Coordinate system: Mathematical (+Y up, -Y down) not screen coordinates
     */
    setCanvasSize(sizePair) {
        ++this._updateId; // Increment to trigger tile updates/re-renders

        // Store new canvas dimensions
        this._canvasSize = sizePair;
        //logNormal(this._canvasSize)
        // Calculate new canvas center point (viewport origin in pixels)
        this._canvasCenter = [
            this._canvasSize[0]/2,  // Center X in pixels
            this._canvasSize[1]/2   // Center Y in pixels
        ];

        //logNormal(this._canvasCenter)

        // Calculate how many tiles fit from center to edge of viewport
        let tileOffsets = [
            Math.ceil(this._canvasCenter[0]/this._tileSize),  // Tiles from center to horizontal edge
            Math.ceil(this._canvasCenter[1]/this._tileSize)   // Tiles from center to vertical edge
        ];
        this._viewSpan = [
            [ // TL (-x,+y)
                this._camPosition[0]-tileOffsets[0],
                this._camPosition[1]+tileOffsets[1]
            ],
            [ // Bottom-Right corner (+x,-y) 
                this._camPosition[0]+tileOffsets[0],  // Right boundary
                this._camPosition[1]-tileOffsets[1]   // Bottom boundary (-Y is down)
            ]
        ];
        /*
        logNormal("TOP:",this._viewSpan[0][1])
        logNormal("LEFT:",this._viewSpan[0][0])
        logNormal("RIGHT:",this._viewSpan[1][0])
        logNormal("BOTTOM:",this._viewSpan[1][1]) */
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
         logVerbose(alignPos);

        let alignOffsetX = floor(alignPos[0]) - alignPos[0];
        let alignOffsetY = floor(alignPos[1]) - alignPos[1];
        // logNormal(alignOffsetX,alignOffsetY);

        this._camPosition = [alignOffsetX,alignOffsetY];
    }

    //// Conversions
    /**
     * Convert world tile coordinates to canvas pixel coordinates
     * Systems affected by coordinate conversion:
     * - Sprite2d.render() - Entity sprite rendering (has +0.5 tile centering offset)
     * - RenderController.worldToScreenPosition() - Highlighting and UI elements
     * - SelectionBoxController._worldToScreen() - Selection box rendering
     * - EffectsLayerRenderer - Particle effects
     * - FireballSystem - Fireball projectile and trail rendering  
     * - LightningSystem - Lightning strike visual effects
     * - CoordinateConverter.worldToScreen() - Global coordinate utility
     * - Ant resource count text rendering
     * @param {Array<number>} input - [x, y] world tile coordinates
     * @returns {Array<number>} [x, y] canvas pixel coordinates (Y increases downward)
     */
    convPosToCanvas(input) {
        // Standard conversion without Y-axis inversion
        // Converts tile coordinates to canvas pixel coordinates
        // Uses standard p5.js coordinate system: Y increases downward
        
        return [
            (input[0] - this._camPosition[0])*this._tileSize + this._canvasCenter[0],
            (input[1] - this._camPosition[1])*this._tileSize + this._canvasCenter[1]
        ];
    }

    /**
     * Convert canvas pixel coordinates to world tile coordinates
     * 
     * Used primarily for:
     * - Mouse click position → world tile coordinate conversion
     * - SelectionController hover detection
     * - TileInteractionManager click handling
     * - Entity spawning at mouse position
     * - Pathfinding target selection
     * 
     * @param {Array<number>} input - [x, y] canvas pixel coordinates (e.g., mouseX, mouseY)
     * @returns {Array<number>} [x, y] world tile coordinates (Y increases upward)
     */
    convCanvasToPos(input) { // Inverse of pos->canvas calc
        // Standard conversion without Y-axis inversion
        // Converts canvas pixel coordinates to tile coordinates
        // Uses standard p5.js coordinate system: Y increases downward

        return [
            (input[0] - this._canvasCenter[0])/this._tileSize + this._camPosition[0],
            (input[1] - this._canvasCenter[1])/this._tileSize + this._camPosition[1]
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

function convPosToCanvas(input){
    if (typeof g_activeMap === "undefined") {return}
    return g_activeMap.renderConversion.convPosToCanvas(input)
}

function convCanvasToPos(input){
    if (typeof g_activeMap === "undefined") {return}
    return g_activeMap.renderConversion.convCanvasToPos(input)
}