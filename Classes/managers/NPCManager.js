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

    if (!this.isPlayerNearby && this.dialogueActive) {
      this.dialogueActive = false;
    }
  }

  
  startDialogue() {
    this.dialogueActive = true;
    const text = `${this.name}: Hey there, Queen! How’s the colony life treating ya?`;
  
    // optional portrait or bg
    const dialogueBg = loadImage('Images/UI/dialogue_bg.png');
    const portraitImg = this._image; // or a specific portrait file
  
    DIAManager.open(text, dialogueBg, portraitImg, this.name);
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

