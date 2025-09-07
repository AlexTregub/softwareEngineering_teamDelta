let antToSpawn = 0
let ant_Index = 0
let antSize
let antsToCreate = 5
let ants = []
let antImg1
let bg

/*
NOTES TO CONSIDER
PUSH() Starts a drawing group
Pop() Ends a drawing group
look into createFrameBuffer() to solve transparancy issues
Im having to draw a green rect to remove old sprites, NOT IDEAL.
I think createFrameBuffer() is a better approach, but ill need
to pretty much rewrite all of the rendering code.
*/

/*
Once transparency issues are resolved, merge with dev branch and 
get this working with the grid and map. 

Next major step will be getting the ants to move in a smooth way
*/


function preload(){
  antSize = createVector(30,35)
  bg = [60,100,60]
}

function setup() {
  createCanvas(windowWidth*5,windowHeight*5);
  setDefaultBackground()
  for (i=0; i<antsToCreate; i++){
    sizeR = random(0,5)
    ants[i] = new ant((random(0,500)),(random(0,500)),antSize.x+ sizeR,antSize.y + sizeR,30,0)
  }
  antImg1 = loadImage("/Images/Ant_tn.png")
  ants[0].show()
}

function setDefaultBackground(){
  background(bg);
}

function draw(){
  for (let i = 0; i < ant_Index; i++){
    ants[i].update()
  }
}


function test(){
  for (let i = 0; i < ant_Index; i++){
    ants[i] = antPosX[i]
    antPosX[i] = antPosX[i] + 5
  }
}

function mousePressed(){
  print("Mouse Pressed");
  ants[antToSpawn].moveToLocation(mouseX,mouseY)
  antToSpawn += 1
  if (antToSpawn >= ant_Index)
  {
    antToSpawn = 0
  }
}

class ant{
  posX
  posY
  sizeX
  sizeY
  antIndex

  // the location the ant will move to
  pendingPosX
  pendingPosY

  // the image url the ant will use
  //img
  
  // the image that will be drawn to the screen
  sprite

  // the speed that the ant will move in pixels every frame
  // until pos matches PendingPos
  movementSpeed

  // right now, this seems redundent
  direction

  // the roation of the sprite, -360 <= x <= 360
  rotation

  // if isMoving, the ant will move to pendingPos and draw a line to
  // it's pending spot
  isMoving

  // The ant will randomly move every few seconds. for fun.
  timeUntilSkitter

  // testing a framebuffer to see if I can properly draw and remove an image
  pg
  framebuffer

  constructor(posX,posY,sizex,sizey,speed,rotation){
    this.SetPosX(posX)
    this.SetPosY(posY)
    this.SetSizeX(sizex)
    this.SetSizeY(sizey)
    //this.SetImg(imageURL)
    this.SetMovementSpeed(speed)
    this.SetRotation(rotation)
    this.antIndex = ant_Index
    ant_Index += 1
    this.isMoving = false
    this.pg = createGraphics(this.sizeX,this.sizeY,WEBGL);
    let options = { width: this.sizeX, height: this.sizeY }
    this.framebuffer = this.pg.createFramebuffer(options);
    this.timeUntilSkitter = random(5,20)
    this.pendingPosX = this.GetPosX()
    this.pendingPosY = this.GetPosY()

     print("ANT %f CREATED", this.antIndex)
  }

  //GETTER, SETTERS, RANDOMS
  setTimeUntilSkitter(value){
    this.timeUntilSkitter = value
  }
  rndTimeUntilSkitter(){
    this.timeUntilSkitter = random(5,20)
  }
  getTimeUntilSkitter(){
    return this.timeUntilSkitter
  }

  // Sets and returns top left point relative to sprite
  SetPosX(value){
    this.posX = value
    print("ANT POS X:%f",this.posX)
  }
  SetPosY(value){
    this.posY = value
    print("ANT POS Y:%f",this.posY)
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
    print("ANT SIZE X:%f",this.sizeX)
  }
  SetSizeY(value){
    this.sizeY = value
    print("ANT SIZE Y:%f",this.sizeY)
  }
  GetSizeX(){
    return this.sizeX
  }
  GetSizeY(){
    return this.sizeY
  }


  SetImg(value){
    this.img = value
  }
  GetImg(){
    return this.img
  }


  SetSprite(){
    imageMode(CENTER);
    noStroke();
    image(img,this.posX,this.posY,this.sizeX,this.sizeY)
  }


  SetMovementSpeed(value){
    this.movementSpeed  = value
    print("ANT MOVEMENT SPEED:%f",this.movementSpeed)
  }


  SetDirection(value){
    this.direction  = value
  }


  SetRotation(value){
    this.rotation  = value
    while (this.rotation > 360){
      this.rotation -= 360
    }
    while (this.rotation < -360){
      this.rotation += 360
    }
    print("ANT ROTATION:%f",this.rotation)
  }

  moveToLocation(X,Y){
    this.pendingPosX = X
    this.pendingPosY = Y
    this.isMoving = true
  }

  getAngle(x1,x2,y1,y2){
    return atan2(x1-x2,y1-y2)
  }

  ResolveMoment()
  {
    while (this.isMoving == true)
      {
      // Need to get the angle, the magnitude, and find the value of how
      // far to move using movementspeed
      this.SetRotation = this.getAngle(this.posX,this.pendingPosX,this.posY,this.pendingPosY)
      let origin = createVector(this.posX,this.posY)
      let newPos = createVector(this.pendingPosX,this.pendingPosY)
      newPos.lerp(origin,newPos,0.1)
      this.fillOldImage()

      this.posX = newPos.x
      this.posY = newPos.y
      this.show()

      this.isMoving = false
      //print(`Ant %f is at X:${this.posX} Y:${this.posY}`, this.antIndex)

    }
  }

  show(){
    /*
    this.framebuffer.begin();
    this.pg.clear();
    this.pg.lights();
    this.pg.noStroke();
    this.pg.torus(5, 2.5)
    this.pg.image(antImg1,this.posX,this.posY,this.sizeX,this.sizeY)
    this.framebuffer.end();
    image(this.pg,0,0)
    */
    image(antImg1,this.posX,this.posY,this.sizeX,this.sizeY)
  }

    // Log the error.
  handleError(event_) {
    console.error('Oops!', event_);
  }

  // Display the image.
  handleImage(img) {
    imageMode(CENTER);
    //image(img, this.posX, this.posY, this.sizeX, this.sizeY);
    
    describe('ant');
  }

  // Fills in the space the ant just was. This is to avoid overlapping 
  // ant sprites, think windows XP dragging crashing windows
  fillOldImage() {
    fill(bg)
    ellipseMode(RADIUS)
    noStroke()
    ellipse(this.GetCenter().x,this.GetCenter().y,this.GetSizeX()-7)
  }

  update(){
    this.timeUntilSkitter -= 1
    if (this.timeUntilSkitter < 0){
      this.rndTimeUntilSkitter()
      this.isMoving = true
      this.moveToLocation(this.posX + random(-5,5),this.posY + random(-5,5))
    }

    this.ResolveMoment()
        
  }


    
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  setDefaultBackground();
}