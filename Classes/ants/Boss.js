
class Boss extends QueenAnt {
    constructor(entityName,entityFaction,entitySizeX,entitySizeY,tileType=['grass']) {
        let queenBase = new spawnQueen();

        let a = g_activeMap.sampleTiles(tileType,10000); // 

        let tilex = a[0][0]; // Picks initial random position
        let tiley = a[0][1]; // ...

        for (let pos in a) { // pos is an index in a
        // let pos = a[pos]

        let temp = a[pos]
        // console.log(temp)
        if (temp[0] < 30 & temp[0] > -30 & temp[1] < 30 & temp[1] > -30) { // Bounds close to center
            tilex = temp[0]
            tiley = temp[1] // tile positions (grid) 

            // console.log("DONE DID IT ")
            break
        }
        }

        let convPos = g_activeMap.renderConversion.convPosToCanvas([tilex,tiley])

        queenBase.setPosition(convPos[0],convPos[1])

        console.log("TARGETBOSSENTITY",queenBase,convPos,Buildings[0])

        super(queenBase,convPos);


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
    constructor(type = "Spider", faction = "enemy", x = 50, y = 50) {
        super(type, faction, x, y);
    }
}