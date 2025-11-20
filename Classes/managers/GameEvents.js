class AbstractEvent{
    _init(){throw new Error();}

    isFinished(){throw new Error();}
    
    update(){throw new Error();}
}

class BossEvent extends AbstractEvent {
    constructor(){
        super();
        this.boss = null;
        this.finished = false;
    }

    _init(){
        let player  = getQueen();
        if(!player){return;}
        // let posX = Math.floor(random(0,player.posX));
        // let posY = Math.floor(random(0,player.posY));
        this.boss = new Spider("Spider","waveEnemy");
        this.boss.moveToLocation(player.posX,player.posY)
    }

    isFinished(){
        return this.finished;
    }

    update(){
        if(ants.filter(ant => ant.faction == "waveEnemy").length == 0){
            this.finished = true;
        }
    }

}

class Swarm extends AbstractEvent {
    constructor(radius = 1000,amountOfAnts = 10){
        super();
        this.raidus = radius;
        this.amountOfAnts = amountOfAnts;
        this.finished = false;
    }

    _init(){
        let player = getQueen();        
        if(!player){return;}
        let degree = (x/this.amountOfAnts) * 2 * 3.14
        let px = player.posX + this.raidus * cos(degree);
        let py = player.posY + this.raidus * sin(degree);
        let list = antsSpawn(this.amountOfAnts,'waveEnemy',px,py);
        list.forEach(ant=>{
            if(ant.faction != 'waveEnemy'){return;}
            ant.moveToLocation(player.posX,player.posY)
            ant.getController('combat')._detectionRadius = this.raidus + 100;
        })
        console.log(`A swarm of ${this.amountOfAnts} enemies is approaching from the shadows!`);
    }

    isFinished(){
        return this.finished;
    }
    
    update(){
        if(ants.filter(ant => ant.faction == 'waveEnemy').length == 0){
            this.finished = true;
        }
    }
}
        

class AntHive extends AbstractEvent {
    constructor(radius = 1000,amountOfBuilding = 20){
        super();
        this.raidus = radius;
        this.amountOfBuilding = amountOfBuilding;
        this.finished = false;
    }

    _init(){
        let player;
        for(let x = 0; x < this.amountOfBuilding; ++x){
            player  = getQueen();
            if(!player){return;}
            let degree = (x/this.amountOfBuilding) * 2 * 3.14
            let px = player.posX + this.raidus * cos(degree);
            let py = player.posY + this.raidus * sin(degree);

            let pos = g_activeMap.sampleTiles("stone_1",1)[0]


            // let building = createBuilding('AntCone', px, py, 'waveEnemy');

            let building = createBuilding('AntCone', pos[0], pos[1], 'waveEnemy');
            building.upgradeBuilding();
            building._spawnEnabled = true;
            Buildings.push(building);
        }
    }

    isFinished(){
        return this.finished;
    }
    
    update(){
        if(Buildings.filter(building => building._faction == 'waveEnemy').length == 0){
            this.finished = true;
        }
    }
}

class Raid extends AbstractEvent {
    constructor(radius = 1000,amountOfAnts = 10){
        super();
        this.raidus = radius;
        this.amountOfAnts = amountOfAnts;
        this.finished = false;
    }

    _init(){
        let wave = new AntHive(this.raidus,this.amountOfAnts);
        let boss = new BossEvent();
        wave._init();
        boss._init();
    }

    isFinished(){
        return this.finished;
    }
    
    update(){
        if(ants.filter(ant => ant._faction == 'waveEnemy').length == 0){
            this.finished = true;
        }
    }
}



class EventFactory {
    constructor(){
        this.eventRegistery = {
            'Boss' : BossEvent,
            'Raid' : Raid,
            "AntHive": AntHive,
            "Swarm": Swarm
        }
    }

    create(type = null){
        let eventType = this.eventRegistery[type];
        if(!eventType){return new Error("Invalid Event Type" ,type)};
        return new eventType();
    }

    chosenRandom(){
        let keys = Object.keys(this.eventRegistery)
        let choice = keys[Math.floor(random() * keys.length)];
        return this.create(choice)
    }
}

class GameEventManager{
    constructor(){
        this.factory = new EventFactory();
        this.activeEvent = null;
    }

    startEvent(type = null){
        this.activeEvent = type? this.factory.create(type): this.factory.chosenRandom();
        console.log('startEvent:', this.activeEvent);
        this.activeEvent._init();
    }

    update(){
        if(!this.activeEvent){return}
        this.activeEvent.update();
        if(this.activeEvent.isFinished()){
            this.activeEvent = null;
        }
    }
}
