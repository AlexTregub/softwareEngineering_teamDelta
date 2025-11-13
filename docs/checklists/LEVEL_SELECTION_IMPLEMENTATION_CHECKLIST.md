# Level Selection Implementation Checklist

**Goal**: Create a simple level selection menu that loads levels from LocalStorage and JSON files

**Branch**: DW_LevelSelection  
**Date Started**: 2025-11-13

---

## Phase 1: Fix Terrain Visual Bug (CRITICAL FIRST)

**Priority**: Must fix before level selection will work properly

### 1.1 Fix TerrainImporter Material Validation
- [ ] Open `Classes/terrainUtils/TerrainImporter.js`
- [ ] Find `_importFull()` method
- [ ] Add material validation check
  ```javascript
  const validMaterials = Object.keys(TERRAIN_MATERIALS_RANGED);
  let material = data.tiles[index];
  
  if (!validMaterials.includes(material)) {
    console.warn(`Invalid material '${material}' at [${x},${y}], using 'grass'`);
    material = 'grass';
  }
  ```
- [ ] Add coordinate cache reset
  ```javascript
  tile._coordSysUpdateId = -1;
  tile._coordSysPos = NONE;
  ```
- [ ] Force cache invalidation at end of method
  ```javascript
  terrain.invalidateCache();
  ```
- [ ] Test: Load `src/levels/tutorialCave_Start.json` and verify visuals update

### 1.2 Add Image Loading Verification
- [ ] Create `verifyTerrainImages()` function in `sketch.js` or `tiles.js`
  ```javascript
  function verifyTerrainImages() {
    const required = ['GRASS_IMAGE', 'DIRT_IMAGE', 'STONE_IMAGE', 'MOSS_IMAGE', 'WATER'];
    for (const img of required) {
      if (!window[img]) {
        console.error(`Missing terrain image: ${img}`);
        return false;
      }
    }
    return true;
  }
  ```
- [ ] Call before any level loading
- [ ] Test: Verify images loaded after `preload()` completes

### 1.3 Add Forced Redraw After Level Load
- [ ] Locate level loading function (create if doesn't exist)
- [ ] Add forced redraws after import:
  ```javascript
  for (let i = 0; i < 3; i++) {
    if (typeof window.redraw === 'function') {
      window.redraw();
    }
  }
  ```
- [ ] Test: Load level and verify screen updates

---

## Phase 2: Create Level Loading Functions

### 2.1 Create `loadLevelFromData()` Function
- [ ] Create new file: `Classes/systems/LevelLoader.js` OR add to `sketch.js`
- [ ] Implement function:
  ```javascript
  function loadLevelFromData(levelData, levelId = 'loaded_level') {
    // 1. Verify images loaded
    if (!verifyTerrainImages()) {
      console.error("Cannot load level: terrain images not ready");
      return false;
    }
    
    // 2. Extract metadata
    const { gridSizeX, gridSizeY, chunkSize, tileSize, seed } = levelData.metadata;
    
    // 3. Create new map
    const map = new gridTerrain(
      gridSizeX, gridSizeY, seed || 12345,
      chunkSize, tileSize,
      [windowWidth, windowHeight]
    );
    
    // 4. Import terrain data
    const importer = new TerrainImporter(map);
    const success = importer.importFromJSON(levelData);
    
    if (!success) {
      console.error("Failed to import terrain data");
      return false;
    }
    
    // 5. Register with MapManager
    mapManager.registerMap(levelId, map, true);
    
    // 6. Force cache rebuild and redraw
    map.invalidateCache();
    for (let i = 0; i < 3; i++) {
      if (typeof window.redraw === 'function') window.redraw();
    }
    
    console.log(`Level '${levelId}' loaded successfully`);
    return true;
  }
  ```
- [ ] Add to `index.html` if in separate file
- [ ] Test: Call manually in console with test data

### 2.2 Create `loadLevelFromFile()` Function
- [ ] Implement function:
  ```javascript
  async function loadLevelFromFile(filePath) {
    try {
      const response = await fetch(filePath);
      if (!response.ok) {
        throw new Error(`Failed to load ${filePath}`);
      }
      
      const levelData = await response.json();
      const levelId = filePath.split('/').pop().replace('.json', '');
      
      return loadLevelFromData(levelData, levelId);
    } catch (error) {
      console.error("Failed to load level from file:", error);
      return false;
    }
  }
  ```
- [ ] Test: Load `src/levels/tutorialCave_Start.json`

### 2.3 Create `loadLevelFromLocalStorage()` Function
- [ ] Implement function:
  ```javascript
  function loadLevelFromLocalStorage(levelName) {
    const storage = new LocalStorageManager('terrain_');
    const levelData = storage.load(levelName);
    
    if (!levelData) {
      console.error(`Level '${levelName}' not found in LocalStorage`);
      return false;
    }
    
    return loadLevelFromData(levelData, levelName);
  }
  ```
- [ ] Test: Save a level, then load it back

---

## Phase 3: Create Simple Level Selection Menu

### 3.1 Create SimpleLevelSelectionMenu Class
- [ ] Create file: `Classes/ui/SimpleLevelSelectionMenu.js`
- [ ] Implement class structure:
  ```javascript
  class SimpleLevelSelectionMenu {
    constructor() {
      this.storage = new LocalStorageManager('terrain_');
      this.levels = [];
      this.selectedIndex = 0;
      this.visible = false;
      
      // UI layout
      this.x = windowWidth / 2 - 300;
      this.y = 100;
      this.width = 600;
      this.itemHeight = 50;
    }
  }
  ```
- [ ] Add to `index.html` before `sketch.js`:
  ```html
  <script src="Classes/ui/SimpleLevelSelectionMenu.js"></script>
  ```

### 3.2 Implement Level List Loading
- [ ] Add `loadLevelList()` method:
  ```javascript
  loadLevelList() {
    this.levels = [];
    
    // Add built-in levels from src/levels/ folder
    this.levels.push({
      name: 'Tutorial Cave',
      source: 'file',
      path: 'src/levels/tutorialCave_Start.json',
      date: 'Built-in'
    });
    
    // Add saved levels from LocalStorage
    const savedLevels = this.storage.list();
    savedLevels.forEach(level => {
      this.levels.push({
        name: level.name,
        source: 'storage',
        date: new Date(level.date).toLocaleDateString(),
        size: Math.round(level.size / 1024) + ' KB'
      });
    });
    
    console.log(`Loaded ${this.levels.length} levels`);
  }
  ```
- [ ] Call in constructor: `this.loadLevelList();`

### 3.3 Implement Level Selection
- [ ] Add selection methods:
  ```javascript
  selectLevel(index) {
    if (index >= 0 && index < this.levels.length) {
      this.selectedIndex = index;
    }
  }
  
  selectNext() {
    this.selectedIndex = (this.selectedIndex + 1) % this.levels.length;
  }
  
  selectPrevious() {
    this.selectedIndex = (this.selectedIndex - 1 + this.levels.length) % this.levels.length;
  }
  ```

### 3.4 Implement Level Loading
- [ ] Add `startSelectedLevel()` method:
  ```javascript
  startSelectedLevel() {
    const level = this.levels[this.selectedIndex];
    
    if (!level) {
      console.error("No level selected");
      return false;
    }
    
    console.log(`Starting level: ${level.name}`);
    
    let success = false;
    
    if (level.source === 'file') {
      // Load from file (async)
      loadLevelFromFile(level.path).then(result => {
        if (result) {
          this.hide();
          // Transition to gameplay
          if (typeof GameState !== 'undefined') {
            GameState.setState('PLAYING');
          }
        }
      });
    } else {
      // Load from LocalStorage (sync)
      success = loadLevelFromLocalStorage(level.name);
      
      if (success) {
        this.hide();
        // Transition to gameplay
        if (typeof GameState !== 'undefined') {
          GameState.setState('PLAYING');
        }
      }
    }
    
    return success;
  }
  ```

### 3.5 Implement Rendering
- [ ] Add `render()` method:
  ```javascript
  render() {
    if (!this.visible) return;
    
    push();
    
    // Background overlay
    fill(0, 0, 0, 200);
    rect(0, 0, windowWidth, windowHeight);
    
    // Menu background
    fill(50, 50, 50);
    stroke(200, 200, 200);
    strokeWeight(2);
    rect(this.x, this.y, this.width, this.y + (this.levels.length * this.itemHeight) + 100);
    
    // Title
    fill(255);
    textAlign(CENTER);
    textSize(32);
    text('Select Level', this.x + this.width / 2, this.y + 40);
    
    // Level list
    textAlign(LEFT);
    textSize(20);
    
    this.levels.forEach((level, i) => {
      const itemY = this.y + 80 + (i * this.itemHeight);
      const isSelected = (i === this.selectedIndex);
      
      // Selection highlight
      if (isSelected) {
        fill(100, 150, 255, 100);
        rect(this.x + 10, itemY - 5, this.width - 20, this.itemHeight - 10);
      }
      
      // Level name
      fill(isSelected ? 255 : 200);
      text(level.name, this.x + 30, itemY + 20);
      
      // Level info (date/size)
      fill(150);
      textSize(14);
      text(level.date || 'Unknown', this.x + 400, itemY + 20);
      if (level.size) {
        text(level.size, this.x + 500, itemY + 20);
      }
      textSize(20);
    });
    
    // Instructions
    fill(200);
    textAlign(CENTER);
    textSize(16);
    const instructY = this.y + 80 + (this.levels.length * this.itemHeight) + 30;
    text('↑/↓: Select  |  ENTER: Start  |  ESC: Cancel', this.x + this.width / 2, instructY);
    
    pop();
  }
  ```

### 3.6 Implement Input Handling
- [ ] Add `handleClick()` method:
  ```javascript
  handleClick(mouseX, mouseY) {
    if (!this.visible) return false;
    
    // Check if click is on a level item
    this.levels.forEach((level, i) => {
      const itemY = this.y + 80 + (i * this.itemHeight);
      
      if (mouseX >= this.x && mouseX <= this.x + this.width &&
          mouseY >= itemY && mouseY <= itemY + this.itemHeight) {
        this.selectLevel(i);
        this.startSelectedLevel();
      }
    });
    
    return true; // Consume click
  }
  ```
- [ ] Add `handleKeyPress()` method:
  ```javascript
  handleKeyPress(key, keyCode) {
    if (!this.visible) return false;
    
    if (keyCode === UP_ARROW) {
      this.selectPrevious();
      return true;
    }
    
    if (keyCode === DOWN_ARROW) {
      this.selectNext();
      return true;
    }
    
    if (keyCode === ENTER || keyCode === RETURN) {
      this.startSelectedLevel();
      return true;
    }
    
    if (keyCode === ESCAPE) {
      this.hide();
      return true;
    }
    
    return false;
  }
  ```

### 3.7 Add Show/Hide Methods
- [ ] Add visibility methods:
  ```javascript
  show() {
    this.visible = true;
    this.loadLevelList(); // Refresh list
    this.selectedIndex = 0;
  }
  
  hide() {
    this.visible = false;
  }
  
  isVisible() {
    return this.visible;
  }
  ```

### 3.8 Export for Browser/Node
- [ ] Add at end of file:
  ```javascript
  // Export for browser
  if (typeof window !== 'undefined') {
    window.SimpleLevelSelectionMenu = SimpleLevelSelectionMenu;
  }
  
  // Export for Node.js tests
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = SimpleLevelSelectionMenu;
  }
  ```

---

## Phase 4: Integrate with Main Menu

### 4.1 Create Global Instance
- [ ] In `sketch.js` setup() function, add:
  ```javascript
  // Level selection menu
  if (typeof SimpleLevelSelectionMenu !== 'undefined') {
    window.levelSelectionMenu = new SimpleLevelSelectionMenu();
  }
  ```

### 4.2 Add to Main Menu
- [ ] Find main menu button creation (likely in `sketch.js` or menu file)
- [ ] Add "Load Level" button that calls:
  ```javascript
  function showLevelSelection() {
    if (window.levelSelectionMenu) {
      window.levelSelectionMenu.show();
    }
  }
  ```
- [ ] OR add to existing menu system

### 4.3 Integrate Rendering
- [ ] In `sketch.js` draw() function, add rendering:
  ```javascript
  // Level selection menu (render on top)
  if (window.levelSelectionMenu && window.levelSelectionMenu.isVisible()) {
    window.levelSelectionMenu.render();
  }
  ```
- [ ] OR register with RenderLayerManager:
  ```javascript
  if (window.levelSelectionMenu) {
    RenderManager.addDrawableToLayer(RenderManager.layers.UI_MENU, () => {
      if (window.levelSelectionMenu.isVisible()) {
        window.levelSelectionMenu.render();
      }
    });
  }
  ```

### 4.4 Integrate Input Handling
- [ ] In `sketch.js` mousePressed(), add:
  ```javascript
  if (window.levelSelectionMenu && window.levelSelectionMenu.isVisible()) {
    const consumed = window.levelSelectionMenu.handleClick(mouseX, mouseY);
    if (consumed) return; // Don't pass to other systems
  }
  ```
- [ ] In `sketch.js` keyPressed(), add:
  ```javascript
  if (window.levelSelectionMenu && window.levelSelectionMenu.isVisible()) {
    const consumed = window.levelSelectionMenu.handleKeyPress(key, keyCode);
    if (consumed) return; // Don't pass to other systems
  }
  ```

---

## Phase 5: Testing

### 5.1 Test Level Loading from File
- [ ] Start game
- [ ] Open level selection menu
- [ ] Select "Tutorial Cave" (built-in)
- [ ] Press ENTER
- [ ] Verify terrain loads correctly with cave tiles visible
- [ ] Check console for errors

### 5.2 Test Level Loading from LocalStorage
- [ ] Open Level Editor
- [ ] Create/modify a test level
- [ ] Save level (should go to LocalStorage)
- [ ] Return to main menu
- [ ] Open level selection menu
- [ ] Verify saved level appears in list
- [ ] Select saved level
- [ ] Press ENTER
- [ ] Verify terrain loads correctly
- [ ] Check console for errors

### 5.3 Test Navigation
- [ ] Open level selection menu
- [ ] Press UP/DOWN arrows
- [ ] Verify selection highlight moves
- [ ] Press ESC
- [ ] Verify menu closes
- [ ] Reopen menu
- [ ] Click on different level with mouse
- [ ] Verify selection changes
- [ ] Double-click level
- [ ] Verify level loads

### 5.4 Test Error Cases
- [ ] Try loading before preload() completes (should fail gracefully)
- [ ] Try loading invalid JSON (should fallback to grass)
- [ ] Try loading with missing terrain images (should show error)
- [ ] Delete level from LocalStorage while menu open
- [ ] Refresh list - verify level removed

---

## Phase 6: Polish & Documentation

### 6.1 Add Loading Indicator
- [ ] Add loading state to SimpleLevelSelectionMenu
- [ ] Show "Loading..." text while async level loads
- [ ] Hide after load completes or fails

### 6.2 Add Error Messages
- [ ] Show error dialog if level fails to load
- [ ] Add retry button
- [ ] Log detailed error to console

### 6.3 Add Level Preview (Optional - Simple)
- [ ] Add text preview showing level metadata:
  - Grid size (e.g., "50x50 tiles")
  - Material count (e.g., "15 grass, 20 stone, 10 dirt")
  - Export date
- [ ] Display when level selected
- [ ] NO thumbnails (keep it simple)

### 6.4 Update Documentation
- [ ] Update `docs/TERRAIN_LEVEL_SYSTEM_QUICK_REF.md` with usage examples
- [ ] Add screenshots to `docs/` folder
- [ ] Update `CHANGELOG.md` with new feature
- [ ] Mark this checklist as COMPLETE

---

## Troubleshooting

### If terrain visuals don't update after loading:
1. Check console for material validation warnings
2. Verify `terrain.invalidateCache()` was called
3. Verify `window.redraw()` was called 3 times
4. Check if terrain images loaded (call `verifyTerrainImages()`)
5. Inspect tile materials in console: `g_activeMap.getArrPos([0,0]).getMaterial()`

### If level selection menu doesn't appear:
1. Check `window.levelSelectionMenu` exists in console
2. Check `levelSelectionMenu.isVisible()` returns true
3. Verify rendering code is in draw() loop
4. Check z-index/layer rendering order

### If LocalStorage levels don't appear:
1. Check browser LocalStorage in DevTools (F12 → Application → Local Storage)
2. Look for keys starting with `terrain_`
3. Verify `LocalStorageManager` is instantiated correctly
4. Check `storage.list()` returns data

---

## Completion Criteria

**Level selection is DONE when:**
- [ ] Can open level selection menu from main menu
- [ ] Can see list of built-in + saved levels
- [ ] Can navigate with arrow keys and mouse
- [ ] Can load built-in level (Tutorial Cave) and see correct visuals
- [ ] Can save level in editor and see it appear in selection menu
- [ ] Can load saved level and see correct visuals
- [ ] Can close menu with ESC
- [ ] No console errors during normal operation
- [ ] All Phase 5 tests pass

---

**END OF CHECKLIST**
