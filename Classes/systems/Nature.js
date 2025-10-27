let timeOfDay = "day";

class GlobalTime{
    constructor(){
        this.inGameSeconds = 0;
        this.inGameDays = 0;
    }

    update(){  
        const now = performance.now();
        const deltaTime = (now - this.lastFrameTime) / 1000; // seconds
        this.lastFrameTime = now;
            this.internalTimer(deltaTime);
    }

    functioninternalTimer(deltaTime){
        this._accumulator = (this._accumulator || 0) + deltaTime;
        if (this._accumulator >= 1) { // every second
            this._accumulator = 0;
            this.incrementTime();
        }
    }
    incrementTime(){
        this.inGameSeconds += 1;
        if(transitioning){
            if(this.inGameSeconds >= 300){
                this.transition(timeOfDay);
            }
        }
        else{
            if(this.inGameSeconds >= 300){
                this.transition(timeOfDay);
            }
        }
    }
    transition(currentTime){
        switch(currentTime){
        case "day":
            timeOfDay = "sunset";
            transitioning = true;
        case "sunset":
            timeOfDay = "night";
        case "night":
            timeOfDay = "sunrise";
            transitioning = true;
        case "sunrise":
            timeOfDay = "day";
            this.runNewDay();
        }
        runTimeBasedEvents(timeOfDay);
    }
    runTimeBasedEvents(time){
        switch(time){
            case "night":
                //Spawn enemy ant wave
        }
    }
    runNewDay(){
        this.inGameDays += 1;
        this.inGameSeconds = 0;
    }
}