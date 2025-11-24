// NPC Dialogue Scripts (global)
// ----------------------------
const NPCDialogues = {
  antony1: [
    "Pssst, hey... come here...",
    "They got you too, huh?",
    "Me? I stole this dope hat from a crying kid",
    "I guess that's enough to put you in the slammer now adays...",
    "But hey, the hat is cool, right?",
    "Hows about we break out of here",
    "Can you collect 4 of those sticks for me?",
    "Use the WASD keys to move around and find them.",
    "Once you find a resource, walk over it to collect it.",
    "Once you have them, come back and talk to me again.",
  ],
  antony2: [
    "Yknow, I really hate to be that guy...",
    "But that isn't 4 sticks...",
    "It's okay, I get it, the education system is broken and all that.",
    "Now go...4 sticks...that's one more than 3 if you were wondering...",
    "You do know what 7 is right?"
  ],
  antony3: [
    "This is a horrible rage bait"
  ],
  antony4: [
    "Look at you, 4 whole sticks",
    "I was worried about you for a second there",
    "Now gimme one second",
    // ... wait like 1.5 seconds ... he pulls out a bomb
    "Yep, still got it.",
    "What? No, I didn't need those sticks for anything...",
    "I just wanted to see if you could follow simple instructions.",
  ],
  antony5: [
    "Go over to that hive right there",
    "To interact with a hive, walk over to it and press 'E'",
  ],
  antony6: [
    "These hives have levels to them.",
    "The higher the level, the more ants you can produce!",
    "To upgrade a hive, interact with it and press '1'",
    "Upgrading gives you +5 max ants!",
    "Upgrading costs resources, so make sure you have enough before upgrading...",
    "But with more upgrades, comes more powers too",
    "so stay tuned for those..."
  ],
  antony7: [
    "Make sure you purchace ants often too!",
    "These ants will not only fight for you",
    "But they each have unique jobs that help your colony grow.",
    "Some ants gather resources, some ants build structures,",
    "and some ants defend your colony from invaders.",
    "The ants you command follow your queenly pharamones, so make sure to keep them safe!",
    "If they die, they're dead forever...",
    "Just like my dreams",
    "Or these developers if they don't finish this game soon...",
    "Now get over here for your first actual quest errand boy!"

  ],
  antony8: [
    "Remember When I was just talking about powers?",
    "Well, I happen to know where one of those power hives are...",
    "Just east of here, there's an enemy hive",
    "If we can take it over, we can steal their gem of lightning!",
    "I love stealing, so GO!",
    "Talk to me again if you don't know how to fight",
    "But don't ask me for weapons",
    "That's why I'm banned in iceland..."
  ],
  antony9: [
    "You really don't know how to fight?",
    "Okay...",
    "Depending on your ant's job, they all have different stats",
    "If you want your ants to fight with you",
    "Get close to enemies",
    "They devote their lives to protecting the queen after all",
    "So they will automatically attack nearby enemies",
    "Just make sure to keep an eye on their health bars",
    "Yknow, the whole death thing and all...",
  ],
};

let Character;

function NPCPreloader() {
  Character = loadImage('Images/Ants/gray_ant_whimsical.png');
}


 
class NPC extends Building{
  constructor(x, y) {
    let targetHive = Buildings[0] // Target position
    // console.log("TARGETHIVEPOSITION",targetHive,Buildings)
    console.log("TARGETHIVEPOSITION",Buildings[0]._x,Buildings[0]._y)

    let newX = Buildings[0]._x - 50
    let newY = Buildings[0]._y - 50
    
    // super(x, y, 40, 40, Character, 'NPC', null);
    super(newX, newY, 40, 40, Character, 'NPC', null);

    this._x = newX;
    this._y = newY;
    this._faction = 'neutral';
    this.isBoxHovered = false;
    this.dialogueRange = 100;

    this.isPlayerNearby = false;
    this.dialogueActive = false;
    this.name = "Antony"; // gonna change it later for multiple NPC names, this is just a placeholder
    this.dialogueStage = 0;   // which dialogue we're on for each NPC
    this.dialogueLines = [];  // current vector of lines
    this.dialogueIndex = 0;   // which line we're on
    this.questAmount = 4;          // required amount of items to collect
    this.questAssigned = false;
    this.dontContTree = false;
  }

    get _renderController() { return this.getController('render'); }
    get _healthController() { return this.getController('health'); }
    get _selectionController() { return this.getController('selection'); }

    statsBuff(){return;}
    upgradeBuilding() {return;}
    takeDamage() {return;}
    _renderBoxHover() {
    this._renderController.highlightBoxHover();
  }

  initDialogues() {
    const playerQueen = getQueen?.();

    this.isPlayerNearby = false;

    if (playerQueen) {
        const range = dist(this._x, this._y, playerQueen.posX, playerQueen.posY);
        if (range < this.dialogueRange) {
            this.isPlayerNearby = true;
        }
    }
}



  update() {
    super.update();
    this.initDialogues();
  
    const playerQueen = getQueen?.();
    if (playerQueen) {
      const range = dist(this._x, this._y, playerQueen.posX, playerQueen.posY);
  
      // Log distance if dialogue is active (helps debug)
      if (this.dialogueActive) {
        //console.log(`📏 ${this.name} — current distance: ${range.toFixed(2)}`);
      }
  
      // Close dialogue if player moves too far
      if (this.dialogueActive && range > this.dialogueRange) {
        this.dialogueActive = false;
        window.DIAManager.close();
        window.currentNPC = null;
        console.log(`👋 ${this.name}: Player moved too far (${range.toFixed(2)} > ${this.dialogueRange})`);
      }
    } else {
      console.warn("Couldn’t find playerQueen during NPC update.");
    }

    if (this.questAssigned) {
      const collected = getResourceCount("stick"); // from your ResourceManager globals
      if (collected >= this.questAmount && this.dialogueStage === 1) {
        // Player has completed quest — you can increment stage or switch dialogue
        this.dialogueStage = 2;
        console.log(`${collected} sticks`);
        console.log(`${this.name}: Quest complete! Ready for new dialogue.`);
      }
    }
  }

  
  startDialogue() {
    if (this.name !== "Antony") return;

    switch (this.dialogueStage) {
        case 0:
            this.dialogueLines = NPCDialogues.antony1;
            window.QuestManager.startQuest("antony_sticks", {
                name: "Get Some Sticks",
                description: "Collect 4 sticks for Antony.",
                objective: { type: "collect", item: "stick", amount: 4 },
            });
            this.questAssigned = true;
            break;

        case 1:
            this.dialogueLines = NPCDialogues.antony2;
            break;

        case 2:
            const collected = getResourceCount("stick");
            console.log(`${this.name}: Player has collected ${collected} sticks.`);
            if (collected >= this.questAmount) {
                this.dialogueLines = NPCDialogues.antony4;
                this.questAssigned = false;
            } else {
                this.dialogueLines = NPCDialogues.antony3;
                this.dontContTree = true;
            }
            break;

        case 3:
        case 4:
            this.dialogueLines = NPCDialogues.antony5;
            window.QuestManager.startQuest("antony_hive", {
                name: "Inspect the Hive",
                description: "Walk up to the hive and press E to interact with it.",
                objective: { type: "interact", target: "hive" },
            });
            this.questAssigned = true;

            // Teleport Antony **only after stage 4 is incremented**
            break;

        case 5:
            this.dialogueLines = NPCDialogues.antony6;
            break;

        case 6:
            this.dialogueLines = NPCDialogues.antony7;
              console.log(`${this.name} teleported to original local!`);
            break;

        case 7:
            this.dialogueLines = NPCDialogues.antony8;
            window.QuestManager.startQuest("antony_fight", {
                name: "Go east to the enemy hive",
                description: "Go east and take over the enemy hive.",
                objective: { type: "combat", item: "enemy", amount: 4 },
            });
            this.questAssigned = true;
            break;
        case 8:
            this.dialogueLines = NPCDialogues.antony9;
            break;
    }

    // Force dialogue for stages >= 4 even if player is far
    if (this.dialogueStage >= 4) this.isPlayerNearby = true;

    this.dialogueIndex = 0;
    this.dialogueActive = true;
    const dialogueBg = loadImage('Images/Assets/Menu/dialogue_bg.png');
    window.DIAManager.open(this.dialogueLines[0], dialogueBg, this._image, this.name);
    window.currentNPC = this;
  }



  advanceDialogue() {
    if (!this.dialogueActive) return;

    this.dialogueIndex++;

    if (this.dialogueIndex < this.dialogueLines.length) {
        window.DIAManager.open(
            this.dialogueLines[this.dialogueIndex],
            window.DIAManager.bgImage,
            this._image,
            this.name
        );
    } else {
        // Finished current dialogue sequence
        this.dialogueActive = false;
        window.currentNPC = null;
        if (window.DIAManager) window.DIAManager.close();

        // Only increment stage if dontContTree is false
        if (!this.dontContTree) {
            this.dialogueStage++;
            console.log(`${this.name} dialogue stage incremented to ${this.dialogueStage}`);
        } else {
            console.log(`${this.name} dialogue stage NOT incremented, dontContTree is true`);
        }

        // Shop available flag (if needed)
        this.shopAvailable = true;
    }
}



  render() {
    if (!this.isActive) return;
    super.render();

    if (this.isBoxHovered) this._renderBoxHover();

    // show prompt if close enough and not already talking
    if (this.isPlayerNearby && !this.dialogueActive) {
      push();
      textAlign(CENTER);
      textSize(16);
      fill(255);
      if (!terrariaFont) {
        console.warn("terrariaFont not loaded yet!");
      }
      textFont(terrariaFont);
      // position slightly below NPC (lAike a subtitle)

      // const hillPos = this.getPosition()
      // const posDict = {x: this._x, y: this._y}
      const renderPos = this._controllers.get("render").worldToScreenPosition({x: this._x, y: this._y})
      // console.log(renderPos)

      // text(`[E] Talk to ${this.name}`, this._x + 35, this._y + 70);
      // text(`[E] Talk to ${this.name}`, renderPos.x + 35, renderPos.y + 70);
      text(`[E] Talk to ${this.name}`, renderPos.x + 30, renderPos.y);
      pop();
    }
  }
}


function createNPC(x, y) {
    const npc = new NPC(x, y);
    npc.isActive = true;

  if (typeof window !== 'undefined') {
    window.NPCList = window.NPCList || [];
    if (!window.NPCList.includes(npc)) window.NPCList.push(npc);
  }
  if (typeof NPCList !== 'undefined' && !NPCList.includes(npc)) NPCList.push(npc);

  // add to selectables so selection systems can see it
  if (typeof selectables !== 'undefined' && Array.isArray(selectables)) {
    if (!selectables.includes(npc)) selectables.push(npc);
  }

  // update selection controller reference if needed
  if (typeof g_selectionBoxController !== 'undefined' && g_selectionBoxController) {
    if (g_selectionBoxController.entities) g_selectionBoxController.entities = selectables;
  }

  

  return npc;
}

if (typeof window !== 'undefined') {
  window.createNPC = createNPC;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    NPC,
    createNPC
  };
}

/*
function getResourceCount(type) {
  //Funtionality is to return specific resource count if given
  //If type is not given it returns all resource count
  window.resourceManager = window.resourceManager || window.ResourceManager;
  if (!window.resourceManager) {
    console.warn("ResourceManager not found.");
    return 0;
  }
  return window.resourceManager.getTotalResourceCount(type);
}
*/