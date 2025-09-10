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
*/

class CoordinateSystem {
    constructor(gridCountX,gridCountY,canvasSpanX,canvasSpanY,tileSize) {
        this._tS = tileSize;

        this._gCX = gridCountX;
        this._gCY = gridCountY;

        this._cX = canvasSpanX;
        this._cY = canvasSpanY;
    }

    convCanvas(pX,pY) {
        return [
            (pX - (this._cX/2))/this._tS,
            (pY - (this._cY/2))/this._tS
        ];
    }

    convPos(x,y) {
        return [
            (x*this._tS) + (this._cX/2),
            (y*this._tS) + (this._cX/2)
        ];
    }
}