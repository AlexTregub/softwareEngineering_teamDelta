
class Boss extends QueenAnt {
    constructor(entityName,entityFaction,entitySizeX,entitySizeY) {
        let queenBase = new spawnQueen();
        super(queenBase);


        this._type = entityName;
        this._faction = entityFaction;
        this.assignJob(entityName, JobImages[entityName]);
        this.setSize(entitySizeX, entitySizeY);


        ants.splice(ants.indexOf(queenBase), 1); 
        ants.push(this);


        this.currentTarget = null;
        this.currentTargetDistance = 0;
        this._gatherState = null;
        this._movementController._skitterRange = 100;
        this._attackCooldown = .25; // seconds
        this._attackRange = 40;

        // Stats
        this.defaultStats = this.job.stats;
        this.amountEaten = 0;
    }

    nearestAnt(){
        let nearest = null;
        let minDist = Infinity;
        for (let ant of ants) {
        if (ant._faction === this._faction || ant === this) {
            continue;
        }

        let d = dist(this.posX, this.posY, ant.posX, ant.posY);
        if (d < minDist) {
            minDist = d;
            nearest = ant;
        }
        }
        return [nearest,minDist];
    }

    _updateResourceManager(){}


    applyBuff(){
        let buff = {
            health: this.defaultStats.health * .01, // 1% of max health
            movementSpeed: this.defaultStats.movementSpeed * .01, // 1% of movement speed
            strength: this.defaultStats.strength * .01, // 1% of strength
            gatherSpeed: this.defaultStats.gatherSpeed,
        };
        this._applyJobStats(buff);

        if(this.amountEaten % 5 === 0){
            this.setSize(this.width * .01, this.height * .01);  // Increase size by 1%
        }
    }



    update() {
        super.update();
        if(this._stateMachine && !this._stateMachine.isInCombat()){
            console.log(this.getCurrentState());
        }else{
            this._performCombatAttack();
        }

    }
}

class Spider extends Boss{
    constructor() {
        super("Spider", "enemy", 50, 50);
    }
}