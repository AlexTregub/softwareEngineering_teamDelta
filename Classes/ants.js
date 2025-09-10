// Static Vars.
let antToSpawn = 0;
let ant_Index = 0;
let antSize;
let ants = [];
let antImg1;
let antDebug = false;
let antbg;

// Call this during preload
function Ants_Preloader(){
  antSize = createVector(20,20)
  antbg = [60,100,60]
  antImg1 = loadImage("Images/Ant_tn.png")
}

// ANT UTILITY

// Spawns a set number of ants
function Ants_Spawn(numToSpawn) {
  for (let i = 0; i < numToSpawn; i++){
    sizeR = random(0,15)
    ants[i] = new ant((random(0,500)),(random(0,500)),antSize.x+ sizeR,antSize.y + sizeR,30,0)
    ants[i].update()
  }
}

// updates and rerenders all ants
function Ants_Update(){
  for (let i = 0; i < ant_Index; i++) {
    ants[i].update()
  }
}

// TEST, moves all ants a bit in passed direction
function Ants_moveAsGroup(movement) {
  if (antDebug){
    let x_ = 10
    let y_ = 10

    push()
    fill (antbg)
    noStroke()
    rect(x_,y_-10,50,15)
    pop()

    for (let i = 0; i < ant_Index; i++) {
      switch(ants[i].AntMove){
        case "RIGHT":
          text("RIGHT",x_,y_)
          ants[i].moveToLocation(ants[i].GetPosX() + movement, ants[i].GetPosY())
          break;
        case "LEFT":
          text("LEFT",x_,y_)
          ants[i].moveToLocation(ants[i].GetPosX() - movement, ants[i].GetPosY())
          break;
        case "UP":
          text("UP",x_,y_)
          ants[i].moveToLocation(ants[i].GetPosX(), ants[i].GetPosY() - movement)
          break;
        case "DOWN":
          text("DOWN",x_,y_)
          ants[i].moveToLocation(ants[i].GetPosX(), ants[i].GetPosY() + movement)
          break;
        default:
          text("DEFAULT",x_,y_)
      }
      ants[i].setAntMove()
    }
  }
}

function Ant_Click_Control(){
  ants[antToSpawn].moveToLocation(mouseX,mouseY)
  antToSpawn += 1
  if (antToSpawn >= ant_Index)
  {
    antToSpawn = 0
  }
}

// CLASSES
class ant{
  posX
  posY
  sizeX
  sizeY

  // the location the ant will move to
  pendingPosX
  pendingPosY

  // the image url the ant will use **Currently not in use**
  //img

  // Key for ant dict. which is currently an array.
  antIndex

  // the speed that the ant will move in pixels every frame
  // until pos matches PendingPos
  movementSpeed

  // the roation of the sprite, -360 <= x <= 360
  rotation

  // if isMoving, the ant will move to pendingPos and draw a line to
  // it's pending spot
  isMoving

  // The ant will randomly move every few seconds. for fun.
  timeUntilSkitter
  skitterTimer

  // Stores the last direction this ant moved. TESTING
  AntMove

  constructor(posX,posY,sizex,sizey,speed,rotation){
    this.SetPosX(posX)
    this.SetPosY(posY)
    this.SetSizeX(sizex)
    this.SetSizeY(sizey)
    //this.SetImg(imageURL)
    this.SetMovementSpeed(speed)
    this.SetRotation(rotation)
    this.skitterTimer = random(30,200)
    this.antIndex = ant_Index
    ant_Index += 1
    this.isMoving = false
    this.timeUntilSkitter = this.skitterTimer
    this.pendingPosX = this.GetPosX()
    this.pendingPosY = this.GetPosY()
    this.AntMove = "RIGHT"
    if (antDebug) print("ANT %f CREATED", this.antIndex)
  }

  isMouseOver(mx, my) {
    return (
      mx >= this.posX &&
      mx <= this.posX + this.sizeX &&
      my >= this.posY &&
      my <= this.posY + this.sizeY
    );
  }
  highlight(){
    if(this.isMouseOver(mouseX, mouseY)){
      push();
      noFill();
      stroke(255,255,0);
      strokeWeight(2);
      rect(this.posX, this.posY, this.sizeX, this.sizeY);
      pop();
    }
  }
  makePath(){
    
  }
  setAntMove() {
    switch (this.AntMove) {
    case "RIGHT":
      this.AntMove = "DOWN"
      break;
    case "LEFT":
      this.AntMove = "UP"
      break;
    case "UP":
      this.AntMove = "RIGHT"
      break;
    case "DOWN":
      this.AntMove = "LEFT"
      break;
    default:
      text("DEFAULT",x_,y_)
    }
  }

  //GETTER, SETTERS, RANDOMS
  setTimeUntilSkitter(value){
    this.timeUntilSkitter = value
  }
  rndTimeUntilSkitter(){
    this.timeUntilSkitter = this.skitterTimer
  }
  getTimeUntilSkitter(){
    return this.timeUntilSkitter
  }

  // Sets and returns top left point relative to sprite
  SetPosX(value){
    this.posX = value
    if (antDebug) print("ANT POS X:%f",this.posX)
  }
  SetPosY(value){
    this.posY = value
    if (antDebug) print("ANT POS Y:%f",this.posY)
  }
  GetPosX(){
    return this.posX 
  }
  GetPosY(){
    return this.posY 
  }

  // Gets the mid point relative to sprite
  // Use this if you need an effect to be centered on the sprite
  GetCenter(){
    return createVector(this.posX + (this.sizeX / 2),
                        this.posY + (this.sizeY / 2))
  }

  SetSizeX(value){
    this.sizeX = value
    if (antDebug) print("ANT SIZE X:%f",this.sizeX)
  }
  SetSizeY(value){
    this.sizeY = value
    if (antDebug) print("ANT SIZE Y:%f",this.sizeY)
  }
  GetSizeX(){
    return this.sizeX
  }
  GetSizeY(){
    return this.sizeY
  }

  // Sets/Gets the image of the sprite to rendered to screen
  SetImg(value){
    this.img = value
  }
  GetImg(){
    return this.img
  }

  // Sets the image of the sprite to rendered to screen
  SetMovementSpeed(value){
    this.movementSpeed  = value
    if (antDebug) print("ANT MOVEMENT SPEED:%f",this.movementSpeed)
  }

  SetRotation(value){
    this.rotation  = value
    while (this.rotation > 360){
      this.rotation -= 360
    }
    while (this.rotation < -360){
      this.rotation += 360
    }
    if (antDebug) print("ANT ROTATION:%f",this.rotation)
  }
  moveToLocation(X,Y){
    this.pendingPosX = X
    this.pendingPosY = Y
    this.isMoving = true
  }

  getAngle(x1,x2,y1,y2){
    return atan2(x1-x2,y1-y2)
  }

  // if isMoving is true, the ant will calculate a vector to a given pos
  // The ant will draw a ellipse over it's old sprite,
  // then will jump to that location and render itself.
  // PLANS --------------------------------------------
  // Ants jumping to the location they want to go is not the desired behavior
  // the code needs to have the ant move the amount dictated by movement speed
  // and know the movement is resolved, stop moving and resume skittering.
  ResolveMoment()
  {
    while (this.isMoving == true)
      {
      this.SetRotation = this.getAngle(this.posX,this.pendingPosX,this.posY,this.pendingPosY)
      let origin = createVector(this.posX,this.posY)
      let newPos = createVector(this.pendingPosX,this.pendingPosY)
      newPos.lerp(origin,newPos,0.1)
      this.fillOldImage()

      this.posX = newPos.x
      this.posY = newPos.y
      this.render()

      this.isMoving = false
      //print(`Ant %f is at X:${this.posX} Y:${this.posY}`, this.antIndex)

    }
  }

  debug_resolveMovement() {
    let debugYPos = 50
    let numOfTextLines = 4
    function incrementDebug(value){
      debugYPos += value
      return debugYPos
    }

    if (antDebug) {
      push()
      fill (antbg)
      noStroke()
      rect(40,40,250,(10*numOfTextLines)+5)
      pop()
      text(`Pos X:${this.posX}`,50,debugYPos)
      text(`Pos Y:${this.posY}`,50,incrementDebug(10))
      text(`Pending Pos X:${this.pendingPosX}`,50,incrementDebug(10))
      text(`Pending Pos Y:${this.pendingPosY}`,50,incrementDebug(10))
    }
  }

  // the following probably should be split out into a parent class, 
  // inheritance is questionable in p5.js so build a wrapper, return the class, and build on that.

  // draws sprite to the screen 
  render(){
    push();
    image(antImg1,this.posX,this.posY,this.sizeX,this.sizeY)
    pop();
  }

    // Log the error.
  handleError(event_) {
    console.error('Oops!', event_);
  }

  // Display the image.
  handleImage(img) {
    imageMode(CENTER);
    //image(img, this.posX, this.posY, this.sizeX, this.sizeY);
    
    describe('Little black ant');
  }

  // Fills in the space the ant just was. This is to avoid overlapping 
  // ant sprites, think windows XP dragging crashing windows
  fillOldImage() {
    if (antDebug) {
      push();
      fill(antbg);
      ellipseMode(RADIUS);
      noStroke();
      ellipse(this.GetCenter().x,this.GetCenter().y,this.GetSizeX()-7);
      pop();
    }
  }

  //resolves actions updated each frame. By definition, the is framerate dependent, which is typically bad.
  update(){
    if (this.isMoving == false) {
      this.timeUntilSkitter -= 1
    }
    if (this.timeUntilSkitter < 0){
      this.rndTimeUntilSkitter()
      this.isMoving = true
      this.moveToLocation(this.posX + random(-5,5),this.posY + random(-5,5))
    }

    this.ResolveMoment()
    this.render()

    this.highlight()
  }
}
