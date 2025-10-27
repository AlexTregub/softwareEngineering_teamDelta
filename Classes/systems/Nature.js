class GlobalTime{
    constructor(){
        this.inGameSeconds = 230;
        this.inGameDays = 1;
        this.timeOfDay = "day";
        this.transitioning = false;
        this.lastFrameTime = performance.now();
        this._accumulator = 0;
        console.log(`Global Time System Initialized`);
    }

    update(){  
        const now = performance.now();
        const deltaTime = (now - this.lastFrameTime) / 1000; // seconds
        this.lastFrameTime = now;
        this.internalTimer(deltaTime);
    }

    internalTimer(deltaTime){
        this._accumulator = (this._accumulator || 0) + deltaTime;
        if (this._accumulator >= 1) { // every second
            this._accumulator = 0;
            this.incrementTime();
        }
    }
    incrementTime(){
        this.inGameSeconds += 1;
        if(this.transitioning){
            if(this.inGameSeconds >= 60){
                this.transition(this.timeOfDay);
            }
        }
        else{
            if(this.inGameSeconds >= 240){
                this.transition(this.timeOfDay);
            }
        }
        console.log(`Day: ${this.inGameDays} Seconds: ${this.inGameSeconds} Time: ${this.timeOfDay}`);
    }
    transition(currentTime){
        switch(currentTime){
        case "day":
            this.timeOfDay = "sunset";
            this.transitioning = true;
            break;
        case "sunset":
            this.timeOfDay = "night";
            transitioning = false;
            break;
        case "night":
            this.timeOfDay = "sunrise";
            this.transitioning = true;
            break;
        case "sunrise":
            this.timeOfDay = "day";
            this.transitioning = false;
            this.runNewDay();
            break;
        }
        this.inGameSeconds = 0;
        this.runTimeBasedEvents(this.timeOfDay);
    }
    runTimeBasedEvents(time){
        switch(time){
            case "night":
                //Spawn enemy ant wave
                break;
        }
    }
    runNewDay(){
        this.inGameDays += 1;
        this.inGameSeconds = 0;
    }
}