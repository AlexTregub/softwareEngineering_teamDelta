class DIAManager {
  constructor() {
    this.active = false;
    this.dialogueText = '';
    this.displayedText = '';
    this.charIndex = 0;
    this.lastCharTime = 0;
    this.charDelay = 25; // ms per letter
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
    let textStartX = boxX + padding - 300;
    let textStartY = boxY + padding - 60;  
    let headStartX = boxX + padding - 250;
    let headStartY = boxY + padding - 90;  
    if (this.portrait) {
        const portraitY = boxY + (boxH - portraitSize) / 2;
        image(this.portrait, boxX + padding, portraitY, portraitSize, portraitSize);
        textStartX += portraitSize + padding;
    }
  
    // Text + name
    // --- Header (name) ---
    textAlign(LEFT, TOP);
    textFont(terrariaFont || 'sans-serif');
    textSize(28);
    textStyle(BOLD);
    fill(255);
    stroke(0);       // black outline
    strokeWeight(3);
    text(this.name, headStartX, headStartY);

    // --- Body (dialogue text) ---
    textSize(25);
    textStyle(NORMAL);
    const bodyY = textStartY + 40; // 40px below name
    const textWidthAvailable = boxX + boxW - textStartX - padding;
    text(`${this.displayedText}`, textStartX, bodyY, textWidthAvailable, boxH - (bodyY - boxY) - padding);

    pop();
    }
}

// global instance
if (typeof window !== 'undefined') {
  window.DIAManager = new DIAManager();
}
