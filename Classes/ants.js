// Static Vars.
let antToSpawn = 0;
let ant_Index = 0;
let antSize;
let ants = [];
let antImg1;
let antbg;
let hasDeLozier = false;
let selectedAnt = null;

// Call this during preload
function Ants_Preloader(){
  antSize = createVector(20,20)
  antbg = [60,100,60]
  antImg1 = loadImage("Images/Ants/gray_ant.png")
  gregImg = loadImage("Images/Ants/greg.jpg")
}


// ANT UTILITY

// Spawns a set number of ants
function Ants_Spawn(numToSpawn) {
  for (let i = 0; i < numToSpawn; i++){
    sizeR = random(0,15)

    // Create a new ant and assign it a species
    ants[i] = new AntWrapper(
      new ant((random(0,500)), (random(0,500)), antSize.x + sizeR, antSize.y + sizeR, 30, 0), assignSpecies()
    );
    ants[i].update()
  }
}

// updates and rerenders all ants
function Ants_Update(){ for (let i = 0; i < ant_Index; i++) { ants[i].update() }}

function Ant_Click_Control() {
  selectedAnt = null; // Reset selection
  for (let i = 0; i < ant_Index; i++) {
    ants[i].antObject.isSelected = false;
  }
  for (let i = 0; i < ant_Index; i++) {
    if (ants[i].antObject.isMouseOver(mouseX, mouseY)) {
      ants[i].antObject.isSelected = true;
      selectedAnt = ants[i].antObject;
      break;
    }
  }
}

// CLASSES
class ant {
  constructor(posX=0, posY=0, sizex=50, sizey=50, movementSpeed=1, rotation=0, img=antImg1) {
    const initialPos = createVector(posX, posY);
    this._stats = new stats(
      initialPos,
      {x: sizex, y: sizey},
      movementSpeed,
      initialPos.copy()
    );
    this._sprite = new Sprite2D(img, initialPos, createVector(sizex, sizey), rotation);
    this._skitterTimer = random(30,200);
    this._antIndex = ant_Index++;
    this._isMoving = false;
    this._timeUntilSkitter = this._skitterTimer;
    this._path = null;
    this._isSelected = false;
  }

  // Getters and setters
  get stats() { return this._stats; }
  set stats(value) { this._stats = value; }

  get sprite() { return this._sprite; }
  set sprite(value) { this._sprite = value; }

  get antIndex() { return this._antIndex; }
  set antIndex(value) { this._antIndex = value; }

  get isMoving() { return this._isMoving; }
  set isMoving(value) { this._isMoving = value; }

  get timeUntilSkitter() { return this._timeUntilSkitter; }
  set timeUntilSkitter(value) { this._timeUntilSkitter = value; }

  get skitterTimer() { return this._skitterTimer; }
  set skitterTimer(value) { this._skitterTimer = value; }

  get path() { return this._path; }
  set path(value) { this._path = value; }

  get isSelected() { return this._isSelected; }
  set isSelected(value) { this._isSelected = value; }

  // Sprite2D helpers
  setSpriteImage(img) { this._sprite.setImage(img); }
  setSpritePosition(pos) { this._sprite.setPosition(pos); }
  setSpriteSize(size) { this._sprite.setSize(size); }
  setSpriteRotation(rotation) { this._sprite.setRotation(rotation); }

  // Rendering
  render() {
    noSmooth(); // Disable smoothing for crisp pixel art
    this._sprite.render();
    smooth();   // Re-enable smoothing for other drawings

    if (this._isMoving) {
      const pos = this._sprite.pos;
      const size = this._sprite.size;
      const pendingPos = this._stats.pendingPos.statValue;
      stroke(255);
      strokeWeight(2);
      line(
        pos.x + size.x / 2, pos.y + size.y / 2,
        pendingPos.x + size.x / 2, pendingPos.y + size.y / 2
      );
    }
  }

  highlight() {
    const pos = this._sprite.pos;
    const size = this._sprite.size;
    if (this.isMouseOver(mouseX, mouseY) || this._isSelected) {
      push();
      noFill();
      stroke(this._isSelected ? color(0, 0, 255) : color(255, 255, 0));
      strokeWeight(2);
      rect(pos.x, pos.y, size.x, size.y);
      pop();
    }
  }

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

  setPath(path) { this._path = path; }

  // Skitter logic
  setTimeUntilSkitter(value){ this._timeUntilSkitter = value; }
  rndTimeUntilSkitter(){ this._timeUntilSkitter = this._skitterTimer; }
  getTimeUntilSkitter(){ return this._timeUntilSkitter; }

  // Position and size
  set posX(value) { 
    this._stats.position.statValue.x = value;
    this._sprite.pos.x = value;
  }
  get posX() { return this._stats.position.statValue.x; }

  set posY(value) { 
    this._stats.position.statValue.y = value;
    this._sprite.pos.y = value;
  }
  get posY() { return this._stats.position.statValue.y; }

  get center() { 
    const pos = this._stats.position.statValue;
    const size = this._stats.size.statValue;
    return createVector(pos.x + (size.x / 2), pos.y + (size.y / 2));
  }

  set sizeX(value){ this._stats.size.statValue.x = value; }
  get sizeX(){ return this._stats.size.statValue.x; }

  set sizeY(value){ this._stats.size.statValue.y = value; }
  get sizeY(){ return this._stats.size.statValue.y; }

  // Movement speed
  set movementSpeed(value){ this._stats.movementSpeed.statValue = value; }
  get movementSpeed(){ return this._stats.movementSpeed.statValue; }

  // Rotation
  set rotation(value){
    this._sprite.rotation = value;
    while (this._sprite.rotation > 360){
      this._sprite.rotation -= 360;
    }
    while (this._sprite.rotation < -360){
      this._sprite.rotation += 360;
    }
  }
  get rotation(){ return this._sprite.rotation; }

  // Move logic
  moveToLocation(X, Y) {
    this._stats.pendingPos.statValue.x = X;
    this._stats.pendingPos.statValue.y = Y;
    this._isMoving = true;
  }

  ResolveMoment() {
    if (this._isMoving) {
      const current = createVector(this.posX, this.posY);
      const target = createVector(
        this._stats.pendingPos.statValue.x,
        this._stats.pendingPos.statValue.y
      );

      const direction = p5.Vector.sub(target, current);
      const distance = direction.mag();

      if (distance > 1) {
        direction.normalize();
        const speedPerMs = this.movementSpeed / 1000;
        const step = Math.min(speedPerMs * deltaTime, distance);
        current.x += direction.x * step;
        current.y += direction.y * step;
        this.posX = current.x;
        this.posY = current.y;
        this._sprite.setPosition(current);
      } else {
        this.posX = target.x;
        this.posY = target.y;
        this._isMoving = false;
        this._sprite.setPosition(target);
      }

      this.render();
    }
  }

  update(){
    if (!this._isMoving) { this._timeUntilSkitter -= 1; }
    if (this._timeUntilSkitter < 0){
      this.rndTimeUntilSkitter();
      this._isMoving = true;
      this.moveToLocation(this.posX + random(-5,5), this.posY + random(-5,5));
    }
    this.ResolveMoment();
    this.render();
    this.highlight();
  }

  moveFarAfterRandomTime() {
    if (!this._isMoving) {
      if (typeof this._farMoveTimer === "undefined") {
        this._farMoveTimer = Math.floor(random(120, 300));
      }
      this._farMoveTimer--;

      if (this._farMoveTimer <= 0) {
        const dx = random(-200, 200);
        const dy = random(-200, 200);
        this.moveToLocation(this.posX + dx, this.posY + dy);
        this._farMoveTimer = undefined;
      }
    }
  }
}

function moveSelectedAntToTile(mx, my, tileSize) {
  if (selectedAnt) {
    // Calculate tile coordinates
    const tileX = Math.floor(mx / tileSize);
    const tileY = Math.floor(my / tileSize);
    // Calculate pixel position for the top-left of the tile
    const targetX = tileX * tileSize;
    const targetY = tileY * tileSize;
    selectedAnt.moveToLocation(targetX, targetY);
    selectedAnt.isSelected = false; // Deselect the ant
    selectedAnt = null;             // Clear the selection
  }
}