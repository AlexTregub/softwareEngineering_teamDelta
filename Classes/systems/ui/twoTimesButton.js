/*2x Button:
    Needs to increase game speed by 2x
    Needs to reset game speed when re-pressed
    Increase things like hunger, movement speed, time changes
    power cooldowns, interaction times?
*/
class SpeedUpButton{
    constructor(){
        this.speed = 1; //Use 0.5 and 2 for less code
    }

    changeGameSpeed(){
        if(this.speed === 1){
            this.speed = 2; //Double game speed if normal/slowed
            
            // Get all ants from spatial grid
            if (typeof spatialGridManager !== 'undefined' && spatialGridManager) {
                const allAnts = spatialGridManager.getEntitiesByType('Ant');
                for (const antMVC of allAnts) {
                    if (!antMVC || !antMVC.model) continue;
                    
                    const ant = antMVC.model;
                    ant.movementSpeed *= this.speed; //Changes movement speed
                    if (ant.brain && typeof ant.brain.changeIncrement === 'function') {
                        ant.brain.changeIncrement(this.speed); //Changes speed of hunger
                    }
                }
            }
            
            if (window.g_timeOfDayOverlay && window.g_timeOfDayOverlay.globalTime) {
                window.g_timeOfDayOverlay.globalTime.setTimeSpeed(this.speed); //Changes Day/Night Speed
            for (let i = 0; i < ants.length; i++) {
                this.ant = ants[i];
                this.ant.movementSpeed *= this.speed; //Changes movement speed
                this.ant.brain.changeIncrement(this.speed); //Changes speed of hunger
                window.g_timeOfDayOverlay.globalTime.setTimeSpeed(this.speed); //Changes Day/Night Speed (Change for return)
            }
        }
        else{
            this.speed = 1; //Go from double to 1x
            
            // Get all ants from spatial grid
            if (typeof spatialGridManager !== 'undefined' && spatialGridManager) {
                const allAnts = spatialGridManager.getEntitiesByType('Ant');
                for (const antMVC of allAnts) {
                    if (!antMVC || !antMVC.model) continue;
                    
                    const ant = antMVC.model;
                    ant.movementSpeed *= 0.5; //Changes movement speed
                    if (ant.brain && typeof ant.brain.changeIncrement === 'function') {
                        ant.brain.changeIncrement(0.5); //Changes speed of hunger
                    }
                }
            }
            
            if (window.g_timeOfDayOverlay && window.g_timeOfDayOverlay.globalTime) {
                window.g_timeOfDayOverlay.globalTime.setTimeSpeed(this.speed); //Changes Day/Night Speed
            for (let i = 0; i < ants.length; i++) {
                this.ant = ants[i];
                this.ant.movementSpeed *= 0.5; //Changes movement speed
                this.ant.brain.changeIncrement(0.5); //Changes speed of hunger
                window.g_timeOfDayOverlay.globalTime.setTimeSpeed(this.speed); //Changes Day/Night Speed (Change for return)
            }
        }
        console.log(`Changing game speed to ${this.speed}!`); 
        //Crap ton of updates
    }
        }}}