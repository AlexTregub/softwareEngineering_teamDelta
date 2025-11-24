/*
 * pauseMenu.js
 * ------------
 * Pause menu overlay for the game.
 * - Top-right Pause button
 * - Overlay with Resume and Main Menu buttons
 * - Styled consistently with existing createMenuButton system
 */
(function(){
    const PauseMenu = {
      buttons: [],
      isActive: false,
      width: 150,
      height: 60,
      margin: 12,
      spacing: 8,
      pauseButton: null,
      images: {} // initialize image holder
    };

    // --- Preload button images ---
    function preloadPauseImages() {
        PauseMenu.images.pause = loadImage("Images/Assets/Menu/ant_pause.png");
        PauseMenu.images.resume = loadImage("Images/Assets/Menu/ant_resume.png");
        PauseMenu.images.mainMenu = loadImage("Images/Assets/Menu/ant_mm.png");
    }

    // Expose preload for sketch.js
    window.preloadPauseImages = preloadPauseImages;

    // --- Button Actions ---
    function resumeGame() {
        PauseMenu.isActive = false;
        if (typeof GameState !== 'undefined' && GameState.resumeGame) GameState.resumeGame();
    }

    function goToMainMenu() {
        PauseMenu.isActive = false;
        if (typeof GameState !== 'undefined' && GameState.goToMenu) GameState.goToMenu();
    }

    function togglePause() {
        PauseMenu.isActive = !PauseMenu.isActive;
        if (PauseMenu.isActive && typeof GameState !== 'undefined' && GameState.pauseGame) {
            GameState.pauseGame();
        }
    }

    // --- Build Pause Overlay Buttons ---
    function ensureButtons() {
        if (PauseMenu.buttons.length > 0) return;

        const cfg = [
            { key: "resume", label: "Resume", action: resumeGame },
            { key: "mainMenu", label: "Main Menu", action: goToMainMenu }
        ];

        PauseMenu.buttons = cfg.map(c => {
            const btn = createMenuButton(0, 0, PauseMenu.width, PauseMenu.height, c.label, 'default', c.action);
            btn.img = PauseMenu.images[c.key]; // assign image; createMenuButton handles hover
            return btn;
        });
    }

    // --- Layout Buttons ---
    function updateButtonPositions() {
        if (!PauseMenu.buttons || PauseMenu.buttons.length === 0) return;

        const baseX = (g_canvasX / 2) - (PauseMenu.width / 2);
        const baseY = (g_canvasY / 2) - ((PauseMenu.height * PauseMenu.buttons.length + PauseMenu.spacing * (PauseMenu.buttons.length - 1)) / 2);

        PauseMenu.buttons.forEach((btn, i) => {
            if (typeof btn.setPosition === 'function') btn.setPosition(baseX, baseY + i * (PauseMenu.height + PauseMenu.spacing));
            else if (btn.bounds && typeof btn.bounds.set === 'function') btn.bounds.set(baseX, baseY + i * (PauseMenu.height + PauseMenu.spacing));
        });
    }

    // --- Render Pause Menu ---
    function renderPauseMenuUI() {
        // Get current game state
        const currentGameState = (typeof window !== 'undefined' && window.GameState) 
            ? (typeof window.GameState.getState === 'function' ? window.GameState.getState() : null)
            : null;
        
        // Only render pause button when game state is PLAYING
        if (currentGameState === 'PLAYING') {
            // Top-right pause button
            // const pauseBtnX = g_canvasX - PauseMenu.width - PauseMenu.margin;
            //const pauseBtnY = PauseMenu.margin;
            
            // Top-left pause button
            const pauseBtnX = PauseMenu.margin;
            const pauseBtnY = PauseMenu.margin;

            if (!PauseMenu.pauseButton) {
                PauseMenu.pauseButton = createMenuButton(pauseBtnX, pauseBtnY, PauseMenu.width, PauseMenu.height, 'Pause', 'default', togglePause);
                PauseMenu.pauseButton.img = PauseMenu.images.pause;
            }

            PauseMenu.pauseButton.update(mouseX, mouseY, mouseIsPressed);
            PauseMenu.pauseButton.render(); // <--- handles hover & animation automatically
        }

        if (!PauseMenu.isActive) return;

        ensureButtons();
        updateButtonPositions();

        // Draw semi-transparent overlay
        push();
        noStroke();
        fill(0, 140);
        rect(0, 0, g_canvasX, g_canvasY);
        pop();

        // Render Resume / Main Menu buttons
        PauseMenu.buttons.forEach(btn => {
            btn.update(mouseX, mouseY, mouseIsPressed);
            btn.render(); // hover animations handled automatically
        });
    }

    // Expose global functions
    window.renderPauseMenuUI = renderPauseMenuUI;
    window.togglePauseMenu = togglePause;
})();

// Inline adapter registration for RenderLayerManager interactive API
try {
    if (typeof RenderManager !== 'undefined' && RenderManager && typeof RenderManager.addInteractiveDrawable === 'function') {
        const pauseAdapter = {
            id: 'pause-menu',
            hitTest: (pointer) => {
                try {
                    const x = pointer.screen.x;
                    const y = pointer.screen.y;
                    // Check pause button hit
                    if (PauseMenu.pauseButton && typeof PauseMenu.pauseButton.isMouseOver === 'function') {
                        if (PauseMenu.pauseButton.isMouseOver(x, y)) return true;
                    }
                    // If overlay active, check overlay buttons
                    if (PauseMenu.isActive && PauseMenu.buttons && PauseMenu.buttons.length) {
                        for (const btn of PauseMenu.buttons) {
                            if (btn && typeof btn.isMouseOver === 'function' && btn.isMouseOver(x, y)) return true;
                        }
                    }
                } catch (e) {}
                return false;
            },
            onPointerDown: (pointer) => {
                try {
                    const x = pointer.screen.x;
                    const y = pointer.screen.y;
                    // Delegate to pause button click/update
                    if (PauseMenu.pauseButton && typeof PauseMenu.pauseButton.update === 'function') {
                        PauseMenu.pauseButton.update(x, y, pointer.isPressed === true);
                        if (PauseMenu.pauseButton.isMouseOver && PauseMenu.pauseButton.isMouseOver(x, y) && pointer.isPressed) {
                            // Toggle pause immediately
                            if (typeof togglePause === 'function') togglePause();
                            return true;
                        }
                    }
                    // Delegate overlay buttons
                    if (PauseMenu.isActive && PauseMenu.buttons && PauseMenu.buttons.length) {
                        for (const btn of PauseMenu.buttons) {
                            if (btn && typeof btn.update === 'function') btn.update(x, y, pointer.isPressed === true);
                        }
                        return false;
                    }
                } catch (e) {}
                return false;
            },
            onPointerMove: (pointer) => {
                try {
                    const x = pointer.screen.x;
                    const y = pointer.screen.y;
                    if (PauseMenu.pauseButton && typeof PauseMenu.pauseButton.update === 'function') PauseMenu.pauseButton.update(x, y, pointer.isPressed === true);
                    if (PauseMenu.isActive && PauseMenu.buttons && PauseMenu.buttons.length) {
                        for (const btn of PauseMenu.buttons) {
                            if (btn && typeof btn.update === 'function') btn.update(x, y, pointer.isPressed === true);
                        }
                    }
                } catch (e) {}
                return false;
            },
            onPointerUp: (pointer) => {
                try {
                    const x = pointer.screen.x;
                    const y = pointer.screen.y;
                    // Let individual button handlers manage click completion
                } catch (e) {}
                return false;
            },
            update: (pointer) => {
                try {
                    // No-op per-frame; renderPauseMenuUI handles per-frame updates via RenderManager's render call
                } catch (e) {}
            },
            render: (gameState, pointer) => {
                try {
                    if (typeof renderPauseMenuUI === 'function') renderPauseMenuUI();
                } catch (e) {}
            }
        };

        RenderManager.addInteractiveDrawable(RenderManager.layers.UI_GAME, pauseAdapter);
    }
} catch (e) {
    console.warn('pauseMenu: failed to register RenderManager adapter', e);
}
