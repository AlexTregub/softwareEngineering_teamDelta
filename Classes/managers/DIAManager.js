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
  
      // background box
      push();
      const boxH = 160;
      const boxY = height - boxH;
      if (this.bgImage) {
        image(this.bgImage, 0, boxY, width, boxH);
      } else {
        fill(0, 150);
        rect(0, boxY, width, boxH);
      }
  
      // portrait
      if (this.portrait) {
        image(this.portrait, 40, boxY + 20, 100, 100);
      }
  
      // text + name
      textAlign(LEFT, TOP);
      textSize(18);
      fill(255);
      const textX = this.portrait ? 160 : 40;
      text(`${this.name ? this.name + ': ' : ''}${this.displayedText}`, textX, boxY + 30, width - textX - 40);
      pop();
    }
  }
  
  // global instance
  if (typeof window !== 'undefined') {
    window.DIAManager = new DIAManager();
  }
  