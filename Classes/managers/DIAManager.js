class DIAManager {
  constructor() {
    this.active = false;
    this.dialogueText = '';
    this.displayedText = '';
    this.charIndex = 0;
    this.lastCharTime = 0;
    this.charDelay = 40; // ms per letter
    this.bgImage = null;
    this.portrait = null;
    this.name = '';
  }

  open(dialogueText, bgImage = null, portrait = null, name = '') {
    this.dialogueText = dialogueText;
    this.displayedText = '';
    this.charIndex = 0;
    this.lastCharTime = millis();
    this.bgImage = bgImage;
    this.portrait = portrait;
    this.name = name;
    this.active = true;
  }

  close() {
    this.active = false;
  }

  update() {
    if (!this.active) return;

    // Typewriter effect
    if (this.charIndex < this.dialogueText.length) {
      const now = millis();
      if (now - this.lastCharTime > this.charDelay) {
        this.displayedText += this.dialogueText[this.charIndex];
        this.charIndex++;
        this.lastCharTime = now;
      }
    }
  }

  render() {
    if (!this.active) return;
  
    push();
    const boxW = 800;        // fixed width of dialogue box
    const boxH = 300;        // fixed height
    const boxX = ((width - boxW) / 2) + 400;  // center horizontally
    const boxY = height - boxH + 150;  // 20px from bottom
    const padding = 20;      // inner padding
  
    // Background
    if (this.bgImage) {
      image(this.bgImage, boxX, boxY, boxW, boxH);
    } else {
      fill(0, 180);
      rect(boxX, boxY, boxW, boxH, 10); // optional rounded corners
    }
  
    // Portrait
    const portraitSize = 100;
    let textStartX = boxX + padding;
    if (this.portrait) {
      const portraitY = boxY + (boxH - portraitSize) / 2;
      image(this.portrait, boxX + padding, portraitY, portraitSize, portraitSize);
      textStartX += portraitSize + padding; // move text right
    }
  
    // Text + name
    textAlign(LEFT, TOP);
    textSize(18);
    fill(255);
    textFont(terrariaFont || 'sans-serif');
    const textWidthAvailable = boxX + boxW - textStartX - padding;
    text(`${this.name ? this.name + ': ' : ''}${this.displayedText}`, textStartX, boxY + padding, textWidthAvailable, boxH - 2*padding);
  
    pop();
  }    
}

// global instance
if (typeof window !== 'undefined') {
  window.DIAManager = new DIAManager();
}
