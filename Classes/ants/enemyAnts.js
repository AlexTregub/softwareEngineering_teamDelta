// --- Ant Globals ---
let eAntToSpawn = 0;
let eAnt_Index = 0;
let eAntSize;
let eAnts = [];
let eAntImg;
let eAntbg;

// --- Preload Images ---
function eAnts_Preloader() {
  eAntSize = createVector(20, 20);
  eAntbg = [120, 60, 60];
  eAntImg = loadImage("Images/Ants/enemyAnt.png");
}


// --- Spawn Ants ---
function eAnts_Spawn(numToSpawn) {
  for (let i = 0; i < numToSpawn; i++) {
    let sizeR = random(0, 15);
    let eBaseAnt = new ant(random(0, 500), random(0, 500), eAntSize.x + sizeR, eAntSize.y + sizeR, 30, 0);
    eAnts[i] = eBaseAnt
    eAnts[i].eUpdate();
  }
}

// --- Update All Ants ---
function eAnts_Update() {
  for (let i = 0; i < eAnt_Index; i++) {
    if (eAnts[i] && typeof eAnts[i].eUpdate === "function") {
      eAnts[i].eUpdate();
    }
  }
}

// --- Single Ant Selection/Movement ---
function eAnt_Click_Control() {
  // Move selected ant if one is already selected
  if (selectedeAnt) {
    selectedeAnt.moveToLocation(mouseX, mouseY);
    selectedeAnt.isSelected = false;
    selectedeAnt = null;
    return;
  }

  // Otherwise, select the ant under the mouse
  selectedeAnt = null;
  for (let i = 0; i < eAnt_Index; i++) {
    if (!eAnts[i]) continue;
    let antObj = eAnts[i].antObject ? eAnts[i].antObject : eAnts[i];
    antObj.isSelected = false;
  }
  for (let i = 0; i < eAnt_Index; i++) {
    if (!eAnts[i]) continue;
    let antObj = eAnts[i].antObject ? eAnts[i].antObject : eAnts[i];
    if (antObj.isMouseOver(mouseX, mouseY)) {
      antObj.isSelected = true;
      selectedeAnt = antObj;
      break;
    }
  }
}

// --- Ant Class ---
class eAnt {
  constructor(posX = 0, posY = 0, sizex = 50, sizey = 50, movementSpeed = 1, rotation = 0, img = eAntImg) {
    const initialPos = createVector(posX, posY);
    this._stats = new stats(
      initialPos,
      { x: sizex, y: sizey },
      movementSpeed,
      initialPos.copy()
    );
    this._sprite = new Sprite2D(img, initialPos, createVector(sizex, sizey), rotation);
    this._skitterTimer = random(30, 200);
    this._antIndex = eAnt_Index++;
    this._isMoving = false;
    this._timeUntilSkitter = this._skitterTimer;
    this._path = null;
    this._isSelected = false;
    this.isBoxHovered = false;
  }

  // --- Getters/Setters ---
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

  // --- Sprite2D Helpers ---
  setSpriteImage(img) { this._sprite.setImage(img); }
  setSpritePosition(pos) { this._sprite.setPosition(pos); }
  setSpriteSize(size) { this._sprite.setSize(size); }
  setSpriteRotation(rotation) { this._sprite.setRotation(rotation); }

  // --- Rendering ---
  render() {
    noSmooth();
    this._sprite.render();
    smooth();

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

  // --- Highlighting ---
  highlight() {
    const pos = this._sprite.pos;
    const size = this._sprite.size;
    if (this._isSelected) {
      push();
      noFill();
      stroke(color(0, 0, 255)); // Blue for selected
      strokeWeight(2);
      rect(pos.x, pos.y, size.x, size.y);
      pop();
    } else if (this.isMouseOver(mouseX, mouseY)) {
      push();
      noFill();
      stroke(color(255, 255, 0)); // Yellow for hover
      strokeWeight(2);
      rect(pos.x, pos.y, size.x, size.y);
      pop();
    } else if (this.isBoxHovered) {
      push();
      noFill();
      stroke(color(0, 255, 0));
      strokeWeight(2);
      rect(pos.x, pos.y, size.x, size.y);
      pop();
    }
  }

  // --- Mouse Over Detection ---
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

  // --- Skitter Logic ---
  setTimeUntilSkitter(value) { this._timeUntilSkitter = value; }
  rndTimeUntilSkitter() { this._timeUntilSkitter = this._skitterTimer; }
  getTimeUntilSkitter() { return this._timeUntilSkitter; }

  // --- Position and Size ---
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

  set sizeX(value) { this._stats.size.statValue.x = value; }
  get sizeX() { return this._stats.size.statValue.x; }
  set sizeY(value) { this._stats.size.statValue.y = value; }
  get sizeY() { return this._stats.size.statValue.y; }

  // --- Movement Speed ---
  set movementSpeed(value) { this._stats.movementSpeed.statValue = value; }
  get movementSpeed() { return this._stats.movementSpeed.statValue; }

  // --- Rotation ---
  set rotation(value) {
    this._sprite.rotation = value;
    while (this._sprite.rotation > 360) this._sprite.rotation -= 360;
    while (this._sprite.rotation < -360) this._sprite.rotation += 360;
  }
  get rotation() { return this._sprite.rotation; }

  // --- Move Logic ---
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

  eUpdate() {
    if (!this._isMoving) this._timeUntilSkitter -= 1;
    if (this._timeUntilSkitter < 0) {
      this.rndTimeUntilSkitter();
      this._isMoving = true;
      this.moveToLocation(this.posX + random(-25, 25), this.posY + random(-25, 25));
    }
    this.ResolveMoment();
    this.render();
    this.highlight();
  }

  // --- Static Utility Methods ---
  static moveGroupInCircle(antArray, x, y, radius = 40) {
    const angleStep = (2 * Math.PI) / antArray.length;
    for (let i = 0; i < antArray.length; i++) {
      const angle = i * angleStep;
      const offsetX = Math.cos(angle) * radius;
      const offsetY = Math.sin(angle) * radius;
      antArray[i].moveToLocation(x + offsetX, y + offsetY);
      antArray[i].isSelected = false;
    }
  }

  static selectAntUnderMouse(eAnts, mx, my) {
    let selected = null;
    for (let i = 0; i < eAnts.length; i++) {
      let antObj = eAnts[i].antObject ? eAnts[i].antObject : eAnts[i];
      antObj.isSelected = false;
    }
    for (let i = 0; i < eAnts.length; i++) {
      let antObj = eAnts[i].antObject ? eAnts[i].antObject : eAnts[i];
      if (antObj.isMouseOver(mx, my)) {
        antObj.isSelected = true;
        selected = antObj;
        break;
      }
    }
    return selected;
  }
}

// --- Move Selected Ant to Tile ---
function moveSelectedAntToTile(mx, my, tileSize) {
  if (selectedeAnt) {
    const tileX = Math.floor(mx / tileSize);
    const tileY = Math.floor(my / tileSize);
    const targetX = tileX * tileSize;
    const targetY = tileY * tileSize;
    selectedeAnt.moveToLocation(targetX, targetY);
    selectedeAnt.isSelected = false;
    selectedeAnt = null;
  }
}

