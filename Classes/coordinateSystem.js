////// COORDINATES
// Defining why we use this: 
// - Initially will be configured by Terrain, grabable by other objects
// -- Need to consider: real terrain size vs. canvas; 
// -- Potential movement of reference: Terrain unmoved, but camera is 
// -- We need some conversion between Terrain-coords, and pixel coords
// ...

// Backing formula(s)
/*
initially we have: canvas(0-N,0-N), gridCount(0-M,0-M), tileSize, pX,pY on Canvas
need: x,y on grid.

x = pX/tS ; y = pY/tS; // (0,0) top left

x = (pX - (cX/2))/tS; y = (pY - (cY/2))/tS; // (0,0) dead center
-> Which tile? Use round() func. ie. [-0.5-0.5] = center tile. if ODD.
-> Which tile? Use floor() func. if EVEN.
aka:
pX = x*tS + (cX/2) ; pY = y*tS + (cY/2)

Cannot use arbitrary center. In odd, is in middle of existing tile, in even, is in 'ghost tile' - in intersection of border

Define center tile: 
    floor(gCX/2)*tS - (tS/2), ... => cX,cY 

Working formula: (Based on (0,0) position on BACKING CANVAS)
x = (pX - [floor(gCX/2)*tS - tS/2])/tS ; y = ...
pX = (x*tS) + [floor(gCX/2)*tS - tS/2]; pY = ...

View canvas formula?:
x = (pX + cOX - [floor(gCX/2)*tS - tS/2])/tS
pX = (x*tS) + [floor(gCX/2)*tS - tS/2] - cOX; pY = ...
*/

class CoordinateSystem {
    constructor(gridCountX,gridCountY,canvasSpanX,canvasSpanY,tileSize,canvasOffsetX,canvasOffsetY) {
        this._tS = tileSize;

        this._gCX = gridCountX;
        this._gCY = gridCountY;

        this._cX = canvasSpanX;
        this._cY = canvasSpanY;

        this._cOX = canvasOffsetX;
        this._cOY = canvasOffsetY;
    }

    //// Util
    roundToTilePos(posPair) {
        // Fix -0 
        posPair[0] = round(posPair[0]);
        if (posPair[0] == -0) { posPair[0] = 0; }
        posPair[1] = round(posPair[1]);
        if (posPair[1] == -0) { posPair[1] = 0; }

        return posPair;
    }



    //// Backing Canvas Conversions (reference equations, useful for converting positions off of pixel grid to coords)
    convBackingCanvasToPos(posPair) { // From backing canvas pixels -> grid position (defines grid)
        return [
            (posPair[0] - ( floor(this._gCX/2)*this._tS - this._tS/2 ))/this._tS , // = x
            (posPair[1] - ( floor(this._gCY/2)*this._tS - this._tS/2 ))/this._tS , // = y
        ];
    }

    convPosToBackingCanvas(posPair) { // From grid position -> backing canvas pixels
        return [
            posPair[0]*this._tS + ( floor(this._gCX/2)*this._tS - this._tS/2 ) , // = pBX
            posPair[1]*this._tS + ( floor(this._gCY/2)*this._tS - this._tS/2 ) , // = pBY
        ]
    }



    //// Viewing Canvas Conversions
    setViewCornerBC(posPair) { // Sets corner of viewing canvas from 
        this._cOX = posPair[0];
        this._cOY = posPair[1];
    }

    convCanvasToPos(posPair) { // Converting from viewing canvas -> grid position
        return this.convBackingCanvasToPos([posPair[0]+this._cOX,posPair[1]+this._cOY]); // Adds viewing offset to get Backing Canvas position 
    }

    convPosToCanvas(posPair) { // Converting from grid position to viewing canvas, does not check if out of bounds
        let backingCanvasPixels = this.convPosToBackingCanvas(posPair);
        return [backingCanvasPixels[0] - this._cOX, backingCanvasPixels[1] - this._cOY]; // Removes offset from backing canvas to get viewing canvas position
    }


    // convCanvasToPos(posPair) { // [pX,pY]
    //     return [
    //         (posPair[0] + this._cOX - ((floor(this._gCX/2)*this._tS - this._tS/2)))/this._tS,
    //         (posPair[1] + this._cOY - ((floor(this._gCY/2)*this._tS - this._tS/2)))/this._tS
    //     ];
    // }

    // convPosToCanvas(posPair) { // [x,y]
    //     return [
    //         (posPair[0]*this._tS) + ((floor(this._gCX/2)*this._tS - this._tS/2)) - this._cOX,
    //         (posPair[1]*this._tS) + ((floor(this._gCY/2)*this._tS - this._tS/2)) - this._cOY
    //     ];
    // }

    // convCanvasToTile(posPair) { // Rounds position... pX,pY -> X',Y'
    //     return this.roundPos(this.convCanvasToPos(posPair));
    // }   
}