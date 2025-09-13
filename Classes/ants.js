// Static Vars.
let antToSpawn = 0;
let ant_Index = 0;
let antSize;
let ants = [];
let antImg1;
let antbg;
let hasDeLozier = false;

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

function Ant_Click_Control(){ ants[antToSpawn].moveToLocation(mouseX,mouseY); antToSpawn += 1; if (antToSpawn >= ant_Index) { antToSpawn = 0 } }

// CLASSES
class ant{
  posX
  posY
  sizeX
  sizeY
  pendingPosX // the location the ant will move to
  pendingPosY // the location the ant will move to
  antIndex // Key for ant dict. which is currently an array.
  movementSpeed // the speed that the ant will move in pixels every frame until pos matches PendingPos
  rotation // the roation of the sprite, -360 <= x <= 360
  isMoving // if isMoving, the ant will move to pendingPos and draw a line to it's pending spot
  timeUntilSkitter // The ant will randomly move every few seconds. for fun.
  skitterTimer //SKITTER
  img
  AntMove // Stores the last direction this ant moved. TESTING
  path // Store path if it's being told to move

  constructor(posX=0,posY=0,sizex=50,sizey=50,speed=0,rotation=0){
    this.SetPosX(posX)
    this.SetPosY(posY)
    this.SetSizeX(sizex)
    this.SetSizeY(sizey)
    this.SetMovementSpeed(speed)
    this.SetRotation(rotation)
    this.skitterTimer = random(30,200)
    this.antIndex = ant_Index
    ant_Index += 1
    this.isMoving = false
    this.timeUntilSkitter = this.skitterTimer
    this.pendingPosX = this.GetPosX()
    this.pendingPosY = this.GetPosY()
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

  setPath(path) { 
    this.path = path;
    //Add stuff to move on path
  }

  setAntMove() {
    switch (this.AntMove) {
      case "RIGHT": this.AntMove = "DOWN"; break;
      case "LEFT": this.AntMove = "UP"; break;
      case "UP": this.AntMove = "RIGHT"; break;
      case "DOWN": this.AntMove = "LEFT";  break;
      default: text("DEFAULT",x_,y_) }
  }

  //GETTER, SETTERS, RANDOMS
  setTimeUntilSkitter(value){ this.timeUntilSkitter = value }
  rndTimeUntilSkitter(){ this.timeUntilSkitter = this.skitterTimer }
  getTimeUntilSkitter(){ return this.timeUntilSkitter }

  // Sets and returns top left point relative to sprite
  SetPosX(value){ this.posX = value }
  SetPosY(value){ this.posY = value }
  GetPosX(){ return this.posX }
  GetPosY(){ return this.posY  }

  // Gets the mid point relative to sprite
  // Use this if you need an effect to be centered on the sprite
  GetCenter(){ return createVector(this.posX + (this.sizeX / 2), this.posY + (this.sizeY / 2))  }

  SetSizeX(value){ this.sizeX = value }
  GetSizeX(){ return this.sizeX }

  SetSizeY(value){ this.sizeY = value }
  GetSizeY(){ return this.sizeY }

  SetImg(value){ this.Img = value }
  GetImg(){ return this.Img }

  // Sets the image of the sprite to rendered to screen
  SetMovementSpeed(value){ this.movementSpeed  = value }

  SetRotation(value){
    this.rotation  = value
    while (this.rotation > 360){
      this.rotation -= 360
    }
    while (this.rotation < -360){
      this.rotation += 360
    }
  }

  //Tries to return the tangant line for the path is currently moving too
  getAngle(x1,x2,y1,y2){ return atan2(x1-x2,y1-y2) }

  moveToLocation(X,Y){ this.pendingPosX = X; this.pendingPosY = Y;  this.isMoving = true }

  ResolveMoment()  {
    while (this.isMoving == true) {
      this.SetRotation = this.getAngle(this.posX,this.pendingPosX,this.posY,this.pendingPosY)
      let origin = createVector(this.posX,this.posY)
      let newPos = createVector(this.pendingPosX,this.pendingPosY)
      newPos.lerp(origin,newPos,0.1)

      this.posX = newPos.x
      this.posY = newPos.y
      this.render()

      this.isMoving = false
    }
  }

  // the following probably should be split out into a parent class, 
  // inheritance is questionable in p5.js so build a wrapper, return the class, and build on that.
  // draws sprite to the screen 
  render(){
    push();
    noSmooth(); // prevents pixels from becoming blurry when the image is upscaled 
    image(antImg1,this.posX,this.posY,this.sizeX,this.sizeY)
    smooth();
    pop();
  }

  //resolves actions updated each frame. By definition, the is framerate dependent, which is typically bad.
  update(){
    if (this.isMoving == false) { this.timeUntilSkitter -= 1 }
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

class AntWrapper{
  constructor(antObject, species){
    this.antObject = antObject; // The original instance of an ant
    this.species = species;     // The species of the ant
    this.collectAmount = this.setCollectAmm(); // Giving the collect amount
    this.damageAmount = this.setDamageAmm();   // Giving the damage amount
    //this.healthAmount = this.setHealthAmm();   // And the health

    //Doing the images here for now cuz I'm lazy
    if (species === "DeLozier") {
      this.antObject.SetImg(gregImg); // Set the image to greg.jpg
    }
  }

  update(){
    this.antObject.update();
    // FOR UI TESTING
    this.makeSpeciesTestUi();
  }

  makeSpeciesTestUi(){
    push();
    fill(225);
    textSize(12);
    textAlign(CENTER);
    text(this.species, this.antObject.GetCenter().x, this.antObject.GetCenter().y - 10);
    pop();
  }

  // Setting the collect amount for the species (maybe make random later with set min/max?)
  setCollectAmm(species) {
    switch (species) {
      case "Builder": return 25; 
      case "Scout": return 50;
      case "Farmer": return 40; 
      case "Warrior": return 15;
      case "DeLozier": return 1; 
      default: return 20; 
    }
  }
  // Doing the same with damage
  setDamageAmm(species) {
    switch (species) {
      case "Builder": return 15; 
      case "Scout": return 10;
      case "Farmer": return 20; 
      case "Warrior": return 50;
      case "DeLozier": return 100000; 
      default: return 20; 
    }
  }

  // Doing the same with health
  setDamageAmm(species) {
    switch (species) {
      case "Builder": return 100; 
      case "Scout": return 80;
      case "Farmer": return 100; 
      case "Warrior": return 120;
      case "DeLozier": return 100000; 
      default: return 100; 
    }
  }
}

// Assigns a random species to an ant
function assignSpecies() {
  const speciesList = ["Builder", "Scout", "Farmer", "Warrior"];
  // Add DeLozier to the species list only if it hasn't been created yet
  if (!hasDeLozier) { speciesList.push("DeLozier"); }
  const chosenSpecies = speciesList[Math.floor(random(0, speciesList.length))];

  // If DeLozier is chosen, set the flag to true
  if (chosenSpecies === "DeLozier") { hasDeLozier = true; }
  return chosenSpecies;
}