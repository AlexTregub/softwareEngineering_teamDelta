// Grid changed.
///// Grid - initial design following idea
///// NONE constant is now defined outside. 
///// Treat _ as private, else as public.
let GRID_ID = 0;
let DISABLE_GRID_ACCESS_CHECKS = false; // Will control access checks. Improves performance if disabled, losing debuging capabilities...

//// GRID UTILS:
function convertToGrid(data,sizeX,sizeY) { // Convert raw array into grid format.
    let temp = new Grid(sizeX,sizeY);
    
    // Copy data:
    for (let i = 0; i < sizeX*sizeY; ++i) {
        temp.rawArray[i] = data[i];
    }

    return temp;
} // tested


//// GRID:
class Grid {
    constructor(sizeX,sizeY,spanTopLeft=NONE,objLoc=[0,0]) { // Only Size needed
        // Array size config
        this._sizeX = sizeX;
        this._sizeY = sizeY;
        this._sizeArr = this._sizeX*this._sizeY;

        this.rawArray = []; // Treat as public.
        for (let i = 0; i < this._sizeArr; ++i) {
            this.rawArray.push(NONE); // Push objects to fill arr.
        }

        this._spanEnabled = (spanTopLeft == NONE) ? false : true; // Conditional statements are valid
        this._spanTopLeft = spanTopLeft; // spanTopleft = (x,y), 
        this._spanBotRight = [spanTopLeft[0]+this._sizeX, spanTopLeft[1]+this._sizeY]; // Automatically set spanBotRight  
        
        this._objLoc = objLoc; // (x,y) GRID object location, not necs.

        this._gridId = GRID_ID++; // DEBUG ID, 0 INDEXED.
    } // tested

    //// Util - NO OOB CHECKS
    convToFlat(pos) { // Convert [x,y] to flat array index
        return pos[1]*this._sizeX + pos[0]; 
    } // tested

    convToSquare(z) { // Convert flat array index to [x,y]
        return [
            z%this._sizeX,
            floor(z/this._sizeX)
        ];
    } // tested

    convRelToArrPos(pos) { // Convert relative span position to array position 
        return [
            pos[0] - this._spanTopLeft[0],
            pos[1] - this._spanTopLeft[1]
        ];
    } // tested

    convArrToRelPos(pos) { // Convert array position to relative span position 
        return [
            this._spanTopLeft[0] + pos[0],
            this._spanTopLeft[1] + pos[1]
        ];
    } // tested


    //// Bulk data access:
    // USE RAW ARRAY POSITIONS. Inclusive range.
    getRangeData(tlArrayPos,brArrayPos) { // NO CHECKS, DO NOT TORTURE KITTENS AND PASS OOB VALUES
        let collect = [];

        for (let j = tlArrayPos[1]; j <= brArrayPos[1]; ++j) {
            for (let i = tlArrayPos[0]; i <= brArrayPos[0]; ++i) {
                collect.push(this.rawArray[this.convToFlat([i,j])]);
            }
        }

        return collect;
    } // tested

    getRangeNeighborhoodData(arrayPos,radius) { // Gets neighborhood around points.
        return this.getRangeNeighborhoodGrid(arrayPos,radius).rawArray;
    } // tested

    getRangeGrid(tlArrayPos,brArrayPos) { // NO CHECKS, DO NOT TORTURE KITTENS
        return convertToGrid(
            this.getRangeData(tlArrayPos,brArrayPos),
            (brArrayPos[0]-tlArrayPos[0])+1,
            (brArrayPos[1]-tlArrayPos[1])+1 // Fixed size calc.
        );
    } // tested

    // Calculates Bounds...
    getRangeNeighborhoodGrid(arrayPos,radius) {
        // Copy of size info from getRangeNeighborhoodGrid
        // Necessary checks+formation... Primary function expected to be used...
        let tlPos = []; let brPos = [];
        tlPos[0] = arrayPos[0] - radius > 0 ? arrayPos[0] - radius : 0;
        tlPos[1] = arrayPos[1] - radius > 0 ? arrayPos[1] - radius : 0;

        brPos[0] = arrayPos[0] + radius < this._sizeX ? arrayPos[0] + radius : this._sizeX-1;
        brPos[1] = arrayPos[1] + radius < this._sizeY ? arrayPos[1] + radius : this._sizeY-1;
        
        return this.getRangeGrid(tlPos,brPos);
    } // tested


    //// Access data (unrestricted, allows errors/out of bounds for perf., refactor once usage known)
    // Allowing out of bounds, logging when.
    getArrPos(pos) { // Get value at array-relative position - POTENTIALLY RETURNS REFERENCE
        if (DISABLE_GRID_ACCESS_CHECKS) { // BYPASS CHECKS
            return this.rawArray[this.convToFlat(pos)];
        }


        if (pos[0] >= this._sizeX || pos[0] < 0 || pos[1] >= this._sizeY || pos[1] < 0 ) { // Correct...
            print("In "+this.infoStr()+" get access OutOfBounds. raw array pos ("+pos+')');
        }

        let val = this.rawArray[this.convToFlat(pos)];
        if (val == NONE) {
            print("In "+this.infoStr()+" got NONE value (UNINITIALIZED CELL). raw array pos ("+pos+')');
        }
        if (val == undefined) {
            print("In "+this.infoStr()+" read past array. raw array pos ("+pos+')');
        }
        return val;
    } // tested + setOnObject from get.

    setArrPos(pos,obj) { // Set value at array-relative position
        // if (pos[0] >= this._sizeX || pos[1] >= this._sizeY) {
        if (DISABLE_GRID_ACCESS_CHECKS) {
            this.rawArray[this.convToFlat(pos)] = obj;
            return;
        }


        if (pos[0] >= this._sizeX || pos[0] < 0 || pos[1] >= this._sizeY || pos[1] < 0) {
            print("In "+this.infoStr()+" set access OutOfBounds. raw array pos ("+pos+')');
        }
        this.rawArray[this.convToFlat(pos)] = obj;
    } // tested

    // Depending on usage, improve perf via direct calls
    get(relPos) { // Gets value based on SPAN positions, no OOB check, how could this go wrong...
        // NEED: spanTopLeft.x<=relPos.x<spanBotRight.x && ...
        // Aka error if: relPos[0]<spanTopLeft[0] || relPos[0]>=spanBotRight[0] || ...
        if (DISABLE_GRID_ACCESS_CHECKS) {
            return this.rawArray[
                this.convToFlat( 
                    this.convRelToArrPos(relPos)
                )
            ];
        }

        
        if (!this._spanEnabled) {
            print("In "+this.infoStr()+" attempting get access when span is not defined. span pos ("+relPos+"), raw array pos ("+this.convRelToArrPos(relPos)+')');
            return NONE; // FORCE ERROR AT POINT
        }
        if (relPos[0]<this._spanTopLeft[0] || relPos[0]>=this._spanBotRight[0] || relPos[1]<this._spanTopLeft[1] || relPos[1]>=this._spanBotRight[1]) {
            print("In "+this.infoStr()+" get access OutOfBounds. span pos ("+relPos+"), raw array pos ("+this.convRelToArrPos(relPos)+')');
        }
        
        let val = this.rawArray[
            this.convToFlat( 
                this.convRelToArrPos(relPos)
            )
        ];
        if (val == NONE) {
            print("In "+this.infoStr()+" got NONE value. span pos ("+relPos+"), raw array pos ("+this.convRelToArrPos(relPos)+')');
        }
        if (val == undefined) {
            print("In "+this.infoStr()+" read past array. raw array pos ("+relPos+')');
        }

        return val;
    } // tested

    set(relPos,obj) { // Sets value based on SPAN position, no OOB check.
        if (DISABLE_GRID_ACCESS_CHECKS) {
            this.rawArray[
                this.convToFlat(
                    this.convRelToArrPos(relPos)
                )
            ] = obj;
            return;
        }
        
        
        if (!this._spanEnabled) {
            print("In "+this.infoStr()+" attempting get access when span is not defined. span pos ("+relPos+"), raw array pos ("+this.convRelToArrPos(relPos)+')');
        }
        if (relPos[0]<this._spanTopLeft[0] || relPos[0]>=this._spanBotRight[0] || relPos[1]<this._spanTopLeft[1] || relPos[1]>=this._spanBotRight[1]) {
            print("In "+this.infoStr()+" set access OutOfBounds. span pos ("+relPos+"), raw array pos ("+this.convRelToArrPos(relPos)+')');
        }
        
        this.rawArray[
            this.convToFlat(
                this.convRelToArrPos(relPos)
            )
        ] = obj;
    } // tested



    //// DEBUG:
    print() {
        let line = "";
        for (let i = 0; i < this._sizeArr; ++i) {
            line += (this.rawArray[i] + ',');

            if (i % this._sizeX == this._sizeX-1) {
                print(line);
                line = "";
                continue;
            }
        }
    } // tested

    toString() {
        let line = "";
        for (let i = 0; i < this._sizeArr; ++i) {
            line += (this.rawArray[i] + ',');

            if (i % this._sizeX == this._sizeX-1) {
                // print(line);
                line += ";\n";
                continue;
            }
        }

        return line;
    } // tested

    infoStr() {
        return "Grid#"+this._gridId+"_[size:("+this._sizeX+','+this._sizeY+"),span:"+this._spanEnabled+",(("+this._spanTopLeft+"),("+this._spanBotRight+")),loc:"+this._objLoc+']';
    } // tested



    //// Modification/info of struct
    // Grid size
    getSize() {
        return [this._sizeX,this._sizeY];
    } // tested
    
    // RESIZE // setSize
    // [x,y] ~ new size, and [x,y] of the placement of the old array position (assumes GROWING)
    // IF WE ARE MOVING DATA OUT OF BOUNDS OF NEW ARRAY, THIS MAY/WILL BREAK. IMPLEMENT WHEN NEEDED, OTHERWISE MANUALLY MOVE THINGS
    // 
    // FOUND BUG: IF DATA MOVED OOB, RESIZE MAY WRITE PAST KNOWN RANGE OF ARRAY. THIS IS TORTURING KITTENS. DO NOT RESIZE OOB.
    //
    resize(newSize, oldDataPos = NONE) { 
        if (oldDataPos != NONE) { // Run bounds check (ie. old grid fits)
            // HERE BOUNDARY CHECKS ARE INCLUSIVE???
            // Check top left in newSize:
            // (pos[0] >= this._sizeX || pos[0] < 0 || pos[1] >= this._sizeY || pos[1] < 0)
            if (oldDataPos[0] > newSize[0] || oldDataPos[0] < 0 || oldDataPos[1] > newSize[1] || oldDataPos[1] < 0) {
                print("In "+this.infoStr()+" resize old data top left position out of bounds. new size ("+newSize+"), topLeftPos ("+oldDataPos+')');
            }

            let botRight = [ oldDataPos[0]+this._sizeX, oldDataPos[1]+this._sizeY ];
            if (botRight[0] > newSize[0] || botRight[0] < 0 || botRight[1] > newSize[1] || botRight[1] < 0) {
                print("In "+this.infoStr()+" resize old data bottom right position out of bounds. new size ("+newSize+"), botRightPos ("+botRight+')');
            }
        }

        let oldArr;
        if (oldDataPos != NONE) {
            oldArr = this.rawArray; // Old array copy
        }

        // Setup New Array
        this.rawArray = NONE;
        this.rawArray = []; 
        for (let i = 0; i < newSize[0]*newSize[1]; ++i) {
            this.rawArray.push(NONE);
        }

        // If selected: copy over
        if (oldDataPos != NONE) { // Assuming we want to retain data:
            for (let j = 0; j < this._sizeArr; ++j) { // j is old array access
                let pos2dOld = this.convToSquare(j); // Gets OLD position
                let pos2dNew = [
                    oldDataPos[0] + pos2dOld[0],
                    oldDataPos[1] + pos2dOld[1]
                ]

                // Based off of convToFlat(...): pos[1]*this._sizeX + pos[0]
                let pos2dNewFlat = pos2dNew[1]*newSize[0] + pos2dNew[0]; // Does this work? who knows

                this.rawArray[pos2dNewFlat] = oldArr[j];
            }
        }

        // If moving old data, also update span if needed:
        if (oldDataPos != NONE && this._spanEnabled) {
            // Set top left, then update right
            this._spanTopLeft[0] = this._spanTopLeft[0] - oldDataPos[0];
            this._spanTopLeft[1] = this._spanTopLeft[1] - oldDataPos[1];

            this._spanBotRight = [this._spanTopLeft[0]+newSize[0], this._spanTopLeft[1]+newSize[1]];
        }

        // Update Size
        this._sizeX = newSize[0];
        this._sizeY = newSize[1];
        this._sizeArr = this._sizeX * this._sizeY;
    } // tested

    // Grid-span range - NOT INCLUSIVE
    getSpanRange() { // Returns pair of coordinates, one top left, one top right.
        return [this._spanTopLeft,this._spanBotRight];
    } // tested

    setSpanCorner(topLeftPos) {
        this._spanEnabled = true;
        this._spanTopLeft = topLeftPos;

        this._spanBotRight = [this._spanTopLeft[0]+this._sizeX, this._spanTopLeft[1]+this._sizeY]; // Automatically set spanBotRight 
    } // tested

    // Grid-object position
    getObjPos() {
        return this._objLoc;
    } //tested

    setObjPos(newPos) {
        this._objLoc = newPos;
    } // tested

    // Treat as read-only
    getGridId() {
        return this._gridId;
    } // tested

    // Empties data, reset to blank state.
    clear() {
        this.resize([0,0]); // Empty array
        
        this._spanEnabled = false; // Reset span state
        this._objLoc = [0,0]; // Reset object location
    } // tested
}



//// Test of "beautiful" code
function testGridUtil() {
    let size = [5,9];
    let testObj = new Grid(size[0],size[1],[0,0],[0,0]);

    for (let i = 0; i < size[0]*size[1]; ++i) {
        let sqr = testObj.convToSquare(i);
        let flat = testObj.convToFlat(sqr);
        print(i,sqr,flat);

        let arrPos = testObj.convArrToRelPos(sqr);
        let backPos = testObj.convRelToArrPos(arrPos);
        print(i,sqr,arrPos,backPos);

        if (sqr[0] != backPos[0] || sqr[1] != backPos[1]) {
            print("ERROR. MISMATCH. Arr->Rel / Rel->Arr Util fail.")
        }

        if (flat != i) {
            print("ERROR. MISMATCH. testGridUtil() fail.")
        }
    }
};

function testGridResizeAndConsequences() {
    let size = [5,10];
    let testObj = new Grid(size[0],size[1],[0,0],[0,0]);

    for (let i = 0; i < size[0]*size[1]; ++i) {
        testObj.rawArray[i] = i;
        if (i == size[0]*size[1]-1) {
            testObj.rawArray[i] = 0;
        }
    }
    testObj.print();

    testObj.resize([8,11],[3,0]);

    /*
    Returns:
    (initial array)
    10p5.min.js:60787 (10) 1,1,1,1,1, 

    (resized array, \0 used for unset values, no None object in p5js?)
    10p5.min.js:60787 (10)  , , ,1,1,1,1,1,
    p5.min.js:60787         , , , , , , , ,
    */

    testObj.print();

    // Following should warn.
    print("Example of resize OOB: (also shifting grid)")
    testObj.resize([8,11],[0,1]);
    testObj.print();

    // Access error tests:
    print(testObj.getArrPos([7,10]));
    print(testObj.getArrPos([8,11]));
    print(testObj.getArrPos([7,11])); // If returns NONE, proof resize writes OUT OF RANGE. 

    print("Success followed by fails");
    print(testObj.get([4,9])); // Bottom right corner - exists
    print(testObj.get([5,10]));
    print(testObj.get([4,10]))

    print(testObj.infoStr());

    //...
    testObj.clear();
    print(testObj.infoStr());
}

function testGridBulk() {
    let size = [10,10];
    let test = new Grid(size[0],size[1],[0,0]);

    for (let i = 0; i < size[0]*size[1]; ++i) {
        test.rawArray[i] = i;
    }


    let testPos = [4,4];
    for (let j = 0; j < size[0]; ++j) {
    }

    let test1 = test.convertToGrid(test.getRangeNeighborhoodData([1,1],1),3,3); // Size must be known
    print(test1);
    print(test1.infoStr())
}


///// I HATE FUNCTIONALITY TEST. BOOM EVERYTHING IS NOW RELATED TO FRUIT
// class testGridTile {
//     constructor() {
//         this._buh = 0;
//     }
// }

function TEST_GRID() { // 0 for fail, 1 for pass

    console.log("=============== TEST_GRID RUN:")
    let temp = DISABLE_GRID_ACCESS_CHECKS
    DISABLE_GRID_ACCESS_CHECKS = false

    let size = [8,12]
    let grid = new Grid(size[0],size[1]); // Min constructor

    let prevPos = [-1,0]
    let nextPos
    for (let i = 0; i < size[0]*size[1]; ++i) {
        nextPos = grid.convToSquare(i);

        if (prevPos[0] == nextPos[0] & prevPos[1] == nextPos[1]) {
            console.log("Failed simple increment. ConvToSquare is bad.")
            return 0
        }

        let testI = grid.convToFlat(nextPos);
        if (testI != i) {
            console.log("Failed simple reverse conversion. ConvToFlat is bad.")
            return 0
        }

        // Deep copy...
        // prevPos = list(nextPos)
        prevPos[0] = nextPos[0]
        prevPos[1] = nextPos[1]

        grid.setArrPos(nextPos,i) // Set vals, based on array position
        if (grid.rawArray[i] != i) {
            console.log("Failed set test. setArrPos is bad.")
            return 0
        }

        if (i != grid.getArrPos(nextPos)) {
            console.log("Failed get test. getArrPos is bad.")
            return 0
        }

        // Testing set by reference (direct)
        // grid.getArrPos(nextPos) = nextPos; // INCORRECT
        // let testSetByRef = grid.getArrPos(nextPos); // INCORRECT
        // testSetByRef = nextPos
        // const testSetByRef = grid.getArrPos(nextPos); // INCORRECT
        // testSetByRef = nextPos
        if (grid.rawArray[i] != nextPos) {
            console.log("Cannot simple set via get. Not critical, may break expected behavior.")
        }

        // SET BY REFERENCE IN GET WORKING. 
        grid.setArrPos(nextPos,nextPos);
        const testSetByRef = grid.getArrPos(nextPos);
        testSetByRef[1] = -1
        if (grid.rawArray[i] == prevPos) {
            console.log("Cannot modify list ref via get. getArrPos has gone partially bad. Will break optimizations.")
            return 0
        }

        // grid.setArrPos(prevPos,new testGridTile())
        // const testSetByRef1 = grid.get
    }

    console.log("Testing debug printing functions: From above test, 2nd val should be a -1. May be condensed.")
    grid.print()
    console.log("End print test.")
    console.log(grid.toString())
    console.log(grid.infoStr())

    let gotSize = grid.getSize();
    if (size[0] != gotSize[0] | size[1] != gotSize[1]) {
        console.log("Size mismatch. getSize has gone bad.")
        return 0
    }

    // Resize testing... (not extensive, as not necessarily called in product) - NOT TESTING DATA MOVE.
    for (let i = 0; i < size[0]*size[1]; ++i) { grid.rawArray[i]=i } // Reset to i's
    grid.resize([size[0]-1,size[1]-1]); // Shrink...

    if (size[0] == grid.getSize()[0] | size[1] == grid.getSize()[1]) {
        console.log("Resize shrink has failed. Grid still reports old size. resize has gone bad.")
        return 0
    }
    for (let i = 0; i < grid.getSize()[0]*grid.getSize()[1]; ++i) {
        if (grid.rawArray[i] != NONE) {
            console.log("Resized grid (without data move) contains data. resize has gone bad.")
            return 0
        }

        grid.rawArray[i]=i // Set after check.
    }

    grid.resize(size,[0,0]) // Grow...
    if (size[0] != grid.getSize()[0] | size[1] != grid.getSize()[1]) {
        console.log("Resoize grow has failed. Grid reports old size. resize has gone bad.")
        return 0
    }

    let i = 0
    for (; i < size[0]-2; ++i) {
        if (grid.rawArray[i] != i) {
            console.log("Resize data move has failed. resize has gone bad.")
            return 0 
        }
    }
    if (grid.rawArray[++i] != NONE) { // Check first row only...
        console.log("Resize data move has failed. resize has gone bad.")
        return 0 
    }
    console.log("Visual confirmation of resize data move: data starts TL, Right and Bottom NONES")
    grid.print()

    let test = new Grid(size[0],size[1],[0,0],[0,1])
    if (grid.getGridId() == test.getGridId() | grid.getGridId() < 0) {
        console.log("Grid ID system has deviated from expected behavior. constructor has gone bad.")
        return 0
    }

    if (test.getObjPos()[0] != 0 | test.getObjPos()[1] != 1) {
        console.log("Grid obj pos not stored correctly. getObjPos gone bad.")
        return 0
    }
    test.setObjPos(size)
    if (test.getObjPos()[0] != size[0] | test.getObjPos()[1] != size[1]) {
        console.log("setObjPos has gone bad.")
        return 0
    }

    let testSpanRange = test.getSpanRange()
    if (testSpanRange[1][0] != size[0] | testSpanRange[1][1] != size[1]) {
        console.log("Span range calculation gone wrong BR. constructor has gone bad.")
        return 0
    }
    if (testSpanRange[0][0] != 0 | testSpanRange[0][1] != 0) {
        console.log("Span range calculation gone wrong TL. constructor has gone bad.")
        return 0
    }

    test.setSpanCorner([-1,-1])
    testSpanRange = test.getSpanRange()
    if (testSpanRange[0][0] != -1 | testSpanRange[0][1] != -1) {
        console.log("Span range calculation gone wrong TL. setSpanCorner has gone bad.")
        return 0
    }
    if (testSpanRange[1][0] != size[0]-1 | testSpanRange[1][1] != size[1]-1) {
        console.log("Span range calculation gone wrong BR. setSpanCorner has gone bad.")
        return 0
    }

    // Testing span things
    for (let i = 0; i < size[0]*size[1]; ++i) {
        let arrPos = test.convToSquare(i);
        let relPos = test.convArrToRelPos(arrPos);

        if (relPos[0] != arrPos[0] - 1 | relPos[1] != arrPos[1] - 1) {
            console.log("Arr -> Rel conversion failed. convArrToRelPos gone bad.")
            return 0
        }

        if (arrPos[0] != test.convRelToArrPos(relPos)[0] | arrPos[1] != test.convRelToArrPos(relPos)[1]) {
            console.log("Rel -> Arr conversion failed. convRelToArrPos gone bad.")
            return 0
        }

        test.set(relPos,-1)
        if (test.getArrPos(arrPos) != -1) {
            console.log("Set with relPos has failed. set has gone bad.")
            return 0
        }

        test.setArrPos(arrPos,7)
        if (test.get(relPos) != 7) {
            console.log("Get with relPos has failed. get has gone bad.")
            return 0
        }
    }

    // test clear
    test.clear()
    if (test.getSize()[0] != 0 | test.getSize()[1] != 0) {
        console.log("Grid clear functionality failed. Resize unsuccessful. clear has gone bad.")
        return 0
    }
    if (test.rawArray.length != 0) {
        console.log("Grid array not empty after clear. clear has gone bad.")
        return 0
    }

    // Test bulk data access...
    size = [5,5]
    grid.resize(size);

    for (let i = 0; i < size[0]; ++i) {
        let range = grid.getRangeData([0,0],[i,i])
        let rangeGrid = grid.getRangeGrid([0,0],[i,i])

        if (range.length != ( (i+1)*(i+1) )) {
            console.log("Bulk access failed. getRangeData gone bad.")
            return 0
        }

        for (let j = 0; j < range.length; ++j) {
            if (range[j] != rangeGrid.rawArray[j]) { 
                // console.log(i,j)
                console.log("Bulk access failed. convertToGrid gone bad.")
                return 0
            }
        }
    }

    for (let j = 0; j < size[0]; ++j) {
        
        for (let i = 0; i < size[0]; ++i) {
            if (j <= i) {
                let range = grid.getRangeData([j,j],[i,i])
    
                if (range.length != ( (i+1-j)*(i+1-j) )) {
                    console.log(i,j,range.length,range)
                    console.log("Bulk access failed, nonzero TL. getRangeData gone bad.")
                    return 0
                }
            }
        }
    }
    
    for (let i = 0; i < size[0]; ++i) { // Get neighborhood from TLcorner+BRcorner
        let gridTl = grid.getRangeNeighborhoodGrid([0,0],i);
        let gridBr = grid.getRangeNeighborhoodGrid([4,4],i);

        if (gridTl.rawArray.length != ( (i+1)*(i+1) ) | gridBr.rawArray.length != gridTl.rawArray.length) {
            console.log("getRangeNeighborhoodGrid gone bad.")
            return 0
        }
    }

    for (let i = 0; i < 3; ++i) {
        let flat = grid.getRangeNeighborhoodData([2,2],i)

        if (flat.length != (2*i+1)*(2*i+1)) {
            console.log("getRangeNeighborhoodData /Grid underlying gone bad.")
            return 0
        }
    }



    DISABLE_GRID_ACCESS_CHECKS = temp
    console.log("TEST_GRID END ===============")
    return 1
}