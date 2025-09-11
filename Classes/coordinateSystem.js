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

Working formula: (Based on (0,0) position)
x = (pX - [floor(gCX/2)*tS - tS/2])/tS ; y = ...
pX = (x*tS) + [floor(gCX/2)*tS - tS/2]
*/

class CoordinateSystem {
    constructor(gridCountX,gridCountY,canvasSpanX,canvasSpanY,tileSize) {
        this._tS = tileSize;

        this._gCX = gridCountX;
        this._gCY = gridCountY;

        this._cX = canvasSpanX;
        this._cY = canvasSpanY;
    }

    convCanvasToPos(posPair) { // [pX,pY]
        return [
            (posPair[0] - ((floor(this._gCX/2)*this._tS - this._tS/2)))/this._tS,
            (posPair[1] - ((floor(this._gCY/2)*this._tS - this._tS/2)))/this._tS
        ];
    }

    convPosToCanvas(posPair) { // [x,y]
        return [
            (posPair[0]*this._tS) + ((floor(this._gCX/2)*this._tS - this._tS/2)),
            (posPair[1]*this._tS) + ((floor(this._gCY/2)*this._tS - this._tS/2))
        ];
    }

    convCanvasToTile(posPair) { // Rounds position... pX,pY -> X',Y'
        return this.roundPos(this.convCanvasToPos(posPair));
    }

    roundPos(posPair) {
        // Fix -0 
        posPair[0] = round(posPair[0]);
        if (posPair[0] == -0) { posPair[0] = 0; }
        posPair[1] = round(posPair[1]);
        if (posPair[1] == -0) { posPair[1] = 0; }

        return posPair;
    }
}