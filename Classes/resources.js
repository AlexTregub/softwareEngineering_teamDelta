// Resource Globals
let resources = [];
let resourceIndex = 0;
let stickImg;
let leafImg;

// Proload Images
function resourcesPreloader() {
    stickImg = loadImage("Images/Resources/stick.png") // placeholder image right now
    leafImg = loadImage("Images/Resources/leaf.webp")  // placeholder image right now
}

// Spawn Resources
function resourcesSpawn(numToSpawn) {
    for (let i = 0; i < numToSpawn; i++) {
        let resourceType = random(['stick', 'leaf']); // Randomly choose a resource
        let img;
        let size = createVector(0,0);

        // Set the specifics for the randomly chosen resource
        if (resourceType === 'stick') {
            img = stickImg;
            size.set(30, 30)
        } else if (resourceType === 'leaf') {
            img = leafImg;
            size.set(30, 30);
        }
        
        // Create and add the new resource to the array
        let newResource = new Resource(random(0, 500), random(0, 500), size.x, size.y, resourceType, img);
        resources.push(newResource);
    }
}

// Update all resources
function resourcesUpdate() {
    for (let i = 0; i < resources.length; i++) {
        if (resources[i] && typeof resources[i].update === "function") {
            resources[i].update();
        }
    }
}

//
// RESOURCE CLASS
//
class Resource extends Entity {
    constructor(pos, size, type = 'stick', img = stickImg) {
        if (!isVector2D(pos)) IncorrectParamPassed(createVector(0,0),pos); pos = createVector(0,0)
        if (!isVector2D(size)) IncorrectParamPassed(createVector(0,0),size); size = createVector(0,0)

        const initialPos = pos;
        const initialSize = size;
        this._sprite = new Sprite2D(img, initialPos, initialSize, 0);
        
        this._resourceIndex = resourceIndex++;
        this._type = type;

        this._isCarried = false; // Is an ant carrying this?
        this._carrier = null;    // Which ant is carrying it?
    }

    // Getters/Setters
    get posX() { return this._sprite.pos.x; }
    set posX(value) { this._sprite.pos.x = value; }

    get posY() { return this._sprite.pos.y; }
    set posY(value) { this._sprite.pos.y = value; }
    
    get sizeX() { return this._sprite.size.x; }
    set sizeX(value) { this._sprite.size.x = value; }

    get sizeY() { return this._sprite.size.y; }
    set sizeY(value) { this._sprite.size.y = value; }
    
    get type() { return this._type; }
    get isCarried() { return this._isCarried; }
    get carrier() { return this._carrier; }


    // Rendering & Highlight
    render() {
        this._sprite.render(); // Delegate rendering to the sprite
    }

    highlight() {
        if (!this._isCarried && this.isMouseOver(mouseX, mouseY)) {
        const pos = this._sprite.pos;
        const size = this._sprite.size;
        push();
        noFill();
        stroke(color(255, 255, 255)); // White for hover
        strokeWeight(2);
        rect(pos.x, pos.y, size.x, size.y);
        pop();
        }
    }
    
    // Mouse Hovering Detection
    isMouseOver(mx, my) {
        const pos = this._sprite.pos;
        const size = this._sprite.size;
        return (
        mx >= pos.x &&
        mx <= pos.x + size.x &&
        my >= pos.y &&
        my <= pos.y + size.y
        );
    }

    // Interaction Methods
    pickUp(antObject) {
        if (!this._isCarried) {
        this._isCarried = true;
        this._carrier = antObject;
        }
    }

    drop() {
        this._isCarried = false;
        this._carrier = null;
    }

    // Update loop
    update() {
        // If carried, the resource's position should follow its carrier.
        if (this._isCarried && this._carrier) {
        this.posX = this._carrier.posX;
        this.posY = this._carrier.posY;
        }
        
        this.render();
        this.highlight();
    }

}