/**
 * SpawnGreenLeafButton
 * --------------------
 * Shows a button (anchored bottom-left) that spawns N greenLeaf Resource objects into the global
 * resources array. Call initSpawnGreenLeafButton() in setup(); call updateSpawnGreenLeafUI() and
 * drawSpawnGreenLeafUI() each frame (uiRender or debug UI loop).
 */
let spawnLeafUI = {
  button: null,
  prevMousePressed: false,
  tileSize: (typeof TILE_SIZE !== 'undefined' ? TILE_SIZE : 32),
  count: 10
};

function initSpawnGreenLeafButton() {
  // createMenuButton is used elsewhere; fallback to simple object if missing
  if (typeof createMenuButton === 'function') {
    spawnLeafUI.button = createMenuButton(10, 10, 160, 34, `Spawn ${spawnLeafUI.count} leaves`, 'default', () => {
      spawnGreenLeaves(spawnLeafUI.count);
    });
  } else {
    spawnLeafUI.button = {
      x: 10, y: 10, width: 160, height: 34,
      label: `Spawn ${spawnLeafUI.count} leaves`,
      setPosition(x, y) { this.x = x; this.y = y; },
      update(mx, my, pressed) { if (pressed && !spawnLeafUI.prevMousePressed && mx >= this.x && mx <= this.x+this.width && my >= this.y && my <= this.y+this.height) spawnGreenLeaves(spawnLeafUI.count); },
      render() { push(); fill(40); stroke(200); rect(this.x, this.y, this.width, this.height, 6); fill(255); noStroke(); textSize(14); textAlign(LEFT, CENTER); text(this.label, this.x+10, this.y+this.height/2); pop(); },
      isMouseOver(mx,my) { return mx >= this.x && mx <= this.x+this.width && my >= this.y && my <= this.y+this.height; }
    };
  }
  // expose for debug
  if (typeof window !== 'undefined') window.spawnLeafUI = spawnLeafUI;
}

function spawnGreenLeaves(n = 10) {
  if (typeof resources === 'undefined' || !Array.isArray(resources)) {
    return;
  }
  const img = (typeof leafImg !== 'undefined') ? leafImg : (typeof greenLeaf !== 'undefined' ? greenLeaf : null);
  for (let i = 0; i < n; i++) {
    const px = random(0, (typeof g_canvasX !== 'undefined' ? g_canvasX : width) - 20);
    const py = random(0, (typeof g_canvasY !== 'undefined' ? g_canvasY : height) - 20);
    const size = createVector(20, 20);
    const pos = createVector(px, py);
    try {
      const r = new Resource(pos, size, 'greenLeaf', img);
      resources.push(r);
    } catch (e) {
      // fallback to older Resource constructor signatures
      try { resources.push(new Resource(px, py, size.x, size.y, 'greenLeaf', img)); } catch (err) { console.warn("Spawn fallback failed:", err); }
    }
  }
}

function updateSpawnGreenLeafUI() {
  if (!spawnLeafUI.button) return;
  // show only while playing (optional): skip check to always show
  const bx = 10;
  const by = Math.max(10, height - 50);
  spawnLeafUI.button.setPosition(bx, by);
  spawnLeafUI.button.update(mouseX, mouseY, mouseIsPressed);
  spawnLeafUI.prevMousePressed = !!mouseIsPressed;
}

function drawSpawnGreenLeafUI() {
  if (!spawnLeafUI.button) return;
  spawnLeafUI.button.render();
}

// expose
if (typeof window !== 'undefined') {
  window.initSpawnGreenLeafButton = initSpawnGreenLeafButton;
  window.updateSpawnGreenLeafUI = updateSpawnGreenLeafUI;
  window.drawSpawnGreenLeafUI = drawSpawnGreenLeafUI;
  window.spawnGreenLeaves = spawnGreenLeaves;
}