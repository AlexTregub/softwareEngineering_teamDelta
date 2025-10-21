/*
 * playedBeforeMenu.js
 * -------------------
 * "Have you played before?" confirmation screen.
 * Displays two buttons (Yes / No) using the same system as other menus.
 */

(function() {
    const PlayedBeforeMenu = {
      buttons: [],
      isActive: false,
      width: 200,
      height: 80,
      spacing: 50,
      images: {}
    };
  
    // --- Preload images ---
    function preloadPlayedBeforeImages() {
      PlayedBeforeMenu.images.yes = loadImage("Images/Assets/Menu/ant_yes.png");
      PlayedBeforeMenu.images.no = loadImage("Images/Assets/Menu/ant_no.png");
    }
  
    // Expose preload globally for sketch.js
    window.preloadPlayedBeforeImages = preloadPlayedBeforeImages;
  
    // --- Button Actions ---
    function onYes() {
      console.log("User selected YES - has played before");
      PlayedBeforeMenu.isActive = false;
      if (typeof GameState !== "undefined") {
        GameState.startFadeTransition("out");
        GameState.setState(GameState.STATES.MENU); // or wherever your main menu is
      }
    }
  
    function onNo() {
      console.log("User selected NO - new player");
      PlayedBeforeMenu.isActive = false;
      if (typeof GameState !== "undefined") {
        GameState.startFadeTransition("out");
        GameState.setState(GameState.STATES.OPTIONS); // or maybe tutorial screen
      }
    }
  
    // --- Build Buttons ---
    function ensureButtons() {
      if (PlayedBeforeMenu.buttons.length > 0) return;
  
      const cfg = [
        { key: "yes", label: "Yes", action: onYes },
        { key: "no", label: "No", action: onNo }
      ];
  
      PlayedBeforeMenu.buttons = cfg.map(c => {
        const btn = createMenuButton(0, 0, PlayedBeforeMenu.width, PlayedBeforeMenu.height, c.label, 'default', c.action);
        btn.img = PlayedBeforeMenu.images[c.key];
        return btn;
      });
    }
  
    // --- Layout Buttons ---
    function updateButtonPositions() {
      const baseX = (g_canvasX / 2) - (PlayedBeforeMenu.width / 2);
      const baseY = (g_canvasY / 2) - ((PlayedBeforeMenu.height * PlayedBeforeMenu.buttons.length + PlayedBeforeMenu.spacing * (PlayedBeforeMenu.buttons.length - 1)) / 2);
  
      PlayedBeforeMenu.buttons.forEach((btn, i) => {
        if (typeof btn.setPosition === 'function') btn.setPosition(baseX, baseY + i * (PlayedBeforeMenu.height + PlayedBeforeMenu.spacing));
        else if (btn.bounds && typeof btn.bounds.set === 'function') btn.bounds.set(baseX, baseY + i * (PlayedBeforeMenu.height + PlayedBeforeMenu.spacing));
      });
    }
  
    // --- Render Screen ---
    function renderPlayedBeforeUI() {
      if (!GameState.isPlayedB4()) return;
  
      PlayedBeforeMenu.isActive = true;
      ensureButtons();
      updateButtonPositions();
  
      // Overlay background
      push();
      noStroke();
      fill(0, 180);
      rect(0, 0, g_canvasX, g_canvasY);
      pop();
  
      // Question text
      push();
      textAlign(CENTER, CENTER);
      textSize(42);
      fill(255);
      text("Have you played before?", g_canvasX / 2, g_canvasY / 2 - 150);
      pop();
  
      // Buttons
      PlayedBeforeMenu.buttons.forEach(btn => {
        btn.update(mouseX, mouseY, mouseIsPressed);
        btn.render();
      });
    }
  
    // Expose global render
    window.renderPlayedBeforeUI = renderPlayedBeforeUI;
  })();
  