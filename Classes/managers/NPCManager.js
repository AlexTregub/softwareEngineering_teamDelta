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
    "Can you collect 8 of those sticks for me?",
    "Use the WASD keys to move around and find them.",
    "Once you have them, come back and talk to me again.",
  ],
  antony2: [
    "Yknow, I really hate to be that guy...",
    "But that isn't 8 sticks...",
    "It's okay, I get it, the education system is broken and all that.",
    "Now go...8 sticks...that's one more than 7 if you were wondering...",
    "You do know what 7 is right?"
  ],
  antony3: [
    "This is a horrible rage bait"
  ],
  antony4: [
    "Look at you, eight whole sticks",
    "I was worried about you for a second there",
    "Now gimme one second",
    // ... wait like 1.5 seconds ... he pulls out a bomb
    "Yep, still got it.",
    "What? No, I didn't make this out of sticks...",
    "I just wanted to see if you could follow instructions.",
    "It's 2025, I got this thing off Antsy.",
    // ... lights fuse ...
    "Is it a bad time to tell you I had the key",
    // ... bomb blows up and flashes white, once it clears, enemies are in the room ->
  ],
  antony5: [
    "Uhhhhhh",
    "Do combat (idk what the controls are yet)",
  ],
};

let Character;

function NPCPreloader() {
  Character = loadImage('Images/Ants/gray_ant_whimsical.png');
}


 
class NPC extends Building{
  constructor(x, y) {
    super(x, y, 40, 40, Character, 'NPC', null);
    this._x = x;
    this._y = y;
    this._faction = 'player';
    this.isBoxHovered = false;
    this.dialogueRange = 100;

    this.isPlayerNearby = false;
    this.dialogueActive = false;
    this.name = "Antony"; // gonna change it later for multiple NPC names, this is just a placeholder
    this.dialogueStage = 0;   // which dialogue we're on for each NPC
    this.dialogueLines = [];  // current vector of lines
    this.dialogueIndex = 0;   // which line we're on
    this.questAmount = 8;          // required amount of items to collect
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
    const nearbyAnts = this.getAnts(this.faction);
    this.isPlayerNearby = false; // reset each frame

    nearbyAnts.forEach(ant => {
      if (ant.jobName === 'Queen') {
        const range = dist(this._x, this._y, ant.posX, ant.posY);
        if (range < this.dialogueRange) {
          this.isPlayerNearby = true;
        }
      }
    });
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
    // Pick dialogue set based on stage
    if (this.name === "Antony") {
      switch (this.dialogueStage) {
        case 0:
          this.dialogueLines = NPCDialogues.antony1;
          // EXAMPLE OF HOW TO START A QUEST
          window.QuestManager.startQuest("antony_sticks", {
            name: "Get Some Sticks",
            description: "Collect 8 sticks for Antony.",
            objective: { type: "collect", item: "stick", amount: 8 },
          });
          this.questAssigned = true;
          break;
        case 1:
          this.dialogueLines = NPCDialogues.antony2;
          break;
        case 2:
          this.questAssigned = true;
          // Check if player has 8 sticks
          const collected = getResourceCount(stick); // total of all resources
          console.log(`${this.name}: Player has collected ${collected} sticks.`);
          if (collected >= this.questAmount) {
            this.dialogueLines = ["Good job! You collected all 8 sticks!"];
          } else {
            this.dialogueLines = NPCDialogues.antony3;
            this.dontContTree = true;
          }
          break;
      }
    }

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
      const collected = getResourceCount();
  
      if (!this.dontContTree) {
        this.dialogueStage++;
        console.log(`${this.name} dialogue stage incremented to ${this.dialogueStage}`);
      } else {
        console.log(`${this.name} dialogue stage NOT incremented, dontContTree is true`);
      }
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
      // position slightly below NPC (like a subtitle)
      text(`[E] Talk to ${this.name}`, this._x + 35, this._y + 70);
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