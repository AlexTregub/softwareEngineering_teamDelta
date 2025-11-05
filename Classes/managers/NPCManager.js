let Character;

function NPCPreloader() {
  Character = loadImage('Images/Ants/gray_ant_whimsical.png');
}



class NPC extends Building{
    constructor(x, y) {
        super(x, y, 40, 40, Character, 'NPC', null);

        // --- Basic properties ---
        this._x = x;
        this._y = y;
        this._faction = 'neutral';
        this.isBoxHovered = false;
        this.dialogueRange = 100; // Distance within which NPCs will interact with ants
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
    nearbyAnts.forEach(ant => {
      if(ant.jobName == 'Queen'){
        const range = dist(this._x, this._y, ant.posX, ant.posY);
        if (range < this.dialogueRange) {

        }
      }}
    );
  }

  update(){
    super.update();
    this.initDialogues();
  }

  
  render() {
    if (!this.isActive) return;
    super.render();
    if (this.isBoxHovered) {
      this._renderBoxHover();
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
