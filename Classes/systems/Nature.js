class GlobalTime{
    constructor(){
        this.inGameSeconds = 0;
        this.inGameDays = 1;
        this.weatherSeconds = 0;
        this.transitionAlpha = 0;
        this.timeOfDay = "day";
        this.transitioning = false;
        this.weather = false;
        this.lastFrameTime = performance.now();
        this._accumulator = 0;
        console.log(`Global Time System Initialized`);
    }

    update(){  
        const now = performance.now();
        const deltaTime = (now - this.lastFrameTime) / 1000; // seconds
        this.lastFrameTime = now;
        this.internalTimer(deltaTime); //Runs internal timer

        if(this.transitioning){
            const fadeSpeed = 255 / 60; // alpha change per second
            if(this.timeOfDay === "sunset" && this.transitionAlpha < 255){
                this.transitionAlpha += fadeSpeed * deltaTime;
            }
            if(this.timeOfDay === "sunrise" && this.transitionAlpha > 0){
                this.transitionAlpha -= fadeSpeed * deltaTime;
            }
            this.transitionAlpha = Math.min(255, Math.max(0, this.transitionAlpha));
        }
    }

    internalTimer(deltaTime){
        this._accumulator = (this._accumulator || 0) + deltaTime;
        if (this._accumulator >= 1) { //Every second
            this._accumulator = 0;
            this.incrementTime(); //Increments internal timer
            if(this.weather){
                this.weatherSeconds += 1; //Increments weather timer (so that weather can end after certain time)
            }
        }
    }
    incrementTime(){
        this.inGameSeconds += 1; //Increments seconds
        this.weatherChance = Math.random();
        if(this.weatherChance < 0.01){ //1% chance of weather change every second
            if(this.weather === true){
                this.weather = false;
                this.weatherSeconds = 0;
                console.log(`Weather ended`);
            }
            else{
                console.log(`Weather Change approaching`);
                this.weather = true;
            }
        }
        if(this.transitioning){ //Transitions last one minue
            if(this.inGameSeconds >= 60){
                this.transition(this.timeOfDay); //Add function to add darkening/lightening effects
            }
        }
        else{
            if(this.inGameSeconds >= 240){ //Day/Night last 4 minutes (10 minutes per day (probably shorten by half)
                this.transition(this.timeOfDay);
            }
        }
        if(this.weatherSeconds >= 120){ //Weather automatically ends after 2 minutes
            this.weather = false;
            this.weatherSeconds = 0;
            console.log(`Weather ended`);
        }
        //console.log(`Day: ${this.inGameDays} Seconds: ${this.inGameSeconds} Time: ${this.timeOfDay}`); //Testing
    }
    transition(currentTime){
        switch(currentTime){
        case "day":
            this.timeOfDay = "sunset";
            this.transitioning = true; //Changes time of day at thresholds
            this.transitionAlpha = 0;
            break;
        case "sunset":
            this.timeOfDay = "night";
            this.transitioning = false;
            this.transitionAlpha = 255;
            break;
        case "night":
            this.timeOfDay = "sunrise";
            this.transitioning = true;
            this.transitionAlpha = 255;
            break;
        case "sunrise":
            this.timeOfDay = "day";
            this.transitioning = false;
            this.transitionAlpha = 0;
            this.runNewDay();
            break;
        }
        this.inGameSeconds = 0; //Resets timer
        this.runTimeBasedEvents(this.timeOfDay);
    }
    runTimeBasedEvents(time){ //Will run events like boss fights and enemy waves
        switch(time){
            case "night":
                //Spawn enemy ant wave
                break;
        }
    }
    runNewDay(){
        this.inGameDays += 1; //Increments day counter
        this.inGameSeconds = 0;
    }
}

/*
function draw() {

  // Update time logic
  globalTime.update();

  // Sky background
  background(100, 200, 255);

  // Overlay filter based on time of day
  noStroke();
  let a = globalTime.transitionAlpha;
  if (globalTime.timeOfDay === "sunset") {
    fill(0, 0, 50, a*0.7); // orange overlay
  } else if (globalTime.timeOfDay === "night") {
    fill(0, 0, 50, 180); // dark blue night
  } else if (globalTime.timeOfDay === "sunrise") {
    fill(255, 180, 80, a * 0.6); // warm sunrise tone
  } else {
    noFill();
  }
*/