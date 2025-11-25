class AbstractEvent{
    _init(){throw new Error();}

    isFinished(){throw new Error();}
    
    update(){throw new Error();}
}

class BossEvent extends AbstractEvent {
    constructor(){
        super();
        this.boss = [];
        this.finished = false;
    }

    _init(){
        let player  = getQueen();
        if(!player){return;}
        // let posX = Math.floor(random(0,player.posX));
        // let posY = Math.floor(random(0,player.posY));
        this.boss.push(new Spider("Spider","waveEnemy"));
        this.boss.push(new AntEater("AntEater","waveEnemy"));
        this.boss.forEach(b => b.moveToLocation(player.posX,player.posY));
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

    _init() {
        let player = getQueen();
        if (!player) return;

        for (let i = 0; i < this.amountOfAnts; i++) {
            let angle = (i / this.amountOfAnts) * Math.PI * 2;

            let x = player.posX + this.radius * Math.cos(angle);
            let y = player.posY + this.radius * Math.sin(angle);

            let spawned = antsSpawn(1, 'waveEnemy', x, y);
            if (!spawned || !spawned.length) continue;

            let ant = spawned[0];
            ant.moveToLocation(player.posX, player.posY);
        }
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
            building._isDead = false;
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
        this.children = [];
    }

    _init(){
        let wave = new AntHive(this.raidus,this.amountOfAnts);
        let boss = new BossEvent();
        wave._init();
        boss._init();
        this.children.push(wave,boss);
    }

    isFinished(){
        return this.finished;
    }
    
    update(){
        this.children.forEach(e => e.update());

        if(this.children.every(e => e.isFinished())){
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
        if(!eventType){throw new Error("Invalid Event Type" ,type)};
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
        this.activeEvent = [];
    }

    startEvent(type = null){
        let event = type? this.factory.create(type): this.factory.chosenRandom();
        this.activeEvent.push(event);
        console.log('startEvent:', event); 
        event._init(); 
    }    

    update(){
        if(this.activeEvent.length === 0){return}
        this.activeEvent.forEach(event => event.update());
        this.activeEvent = this.activeEvent.filter(event => !event.isFinished()); 
    }
}
