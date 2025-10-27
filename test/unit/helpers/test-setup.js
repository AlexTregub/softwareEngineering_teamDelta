// Minimal runtime environment for unit tests (no mocking, real lightweight implementations)

// Simple ButtonStyles
global.ButtonStyles = {
  SUCCESS: { backgroundColor: '#00FF00', color: '#000' },
  INFO: { backgroundColor: '#00AAFF', color: '#000' },
  DANGER: { backgroundColor: '#FF0000', color: '#000' },
  DEFAULT: { backgroundColor: '#CCCCCC', color: '#000' },
  PURPLE: { backgroundColor: '#9932CC', color: '#FFF' }
};

// Minimal DraggablePanel implementation (keeps button arrays in memory)
class DraggablePanel {
  constructor(config) {
    this.config = config;
    this.id = config.id;
    this.title = config.title;
    this.position = config.position || { x: 0, y: 0 };
    this.size = config.size || { width: 100, height: 100 };
    this.buttons = (config.buttons && config.buttons.items) ? config.buttons.items.slice() : [];
    this.state = { visible: true };
    this._dragActive = false;
    this._scale = 1.0;
  }

  isPointInBounds(x, y) {
    const { x: px, y: py } = this.position;
    const { width, height } = this.size;
    return x >= px && x <= px + width && y >= py && y <= py + height;
  }

  render() {
    // No-op for tests
    return true;
  }

  // Additional helpers used by DraggablePanelManager
  isVisible() { return !!this.state.visible; }
  setVisible(v) { this.state.visible = !!v; }
  toggleVisibility() { this.state.visible = !this.state.visible; }
  isDragActive() { return !!this._dragActive; }
  setDragActive(v) { this._dragActive = !!v; }
  getPosition() { return this.position; }
  setScale(s) { this._scale = s; }
}

global.DraggablePanel = DraggablePanel;

// Minimal RenderManager and layers
global.RenderManager = {
  layers: { UI_GAME: 'UI_GAME' },
  _drawables: {},
  addDrawableToLayer(layer, fn) {
    this._drawables[layer] = this._drawables[layer] || [];
    this._drawables[layer].push(fn);
  },
  addInteractiveDrawable(layer, obj) {
    this._drawables[layer] = this._drawables[layer] || [];
    this._drawables[layer].push(obj);
  },
  clear() {
    this._drawables = {};
  }
};

// Minimal global managers and helpers
global.g_gameStateManager = {
  saveGame() { this._saved = true; },
  loadGame() { this._loaded = true; }
};

// Verbose logging helper used by manager
global.logVerbose = function() { /* no-op for tests */ };

// Also provide a global logVerbose for RenderManager registration path
global.logVerbose = function(msg) { /* no-op */ };

// Optionally suppress console output during tests unless TEST_VERBOSE=1
if (!process.env.TEST_VERBOSE || process.env.TEST_VERBOSE === '0') {
  const noop = () => {};
  console.log = noop;
  console.info = noop;
  console.warn = noop;
  console.debug = noop;
}

global.executeCommand = (cmd) => {
  // naive command interpreter for spawn and select
  if (typeof cmd === 'string' && cmd.startsWith('spawn')) {
    // spawn N ant player/enemy
    const parts = cmd.split(' ');
    const count = parseInt(parts[1], 10) || 1;
    const type = parts[3] || 'player';
    global.ants = global.ants || [];
    for (let i = 0; i < count; i++) {
      global.ants.push({ id: 'ant-' + (global.ants.length + 1), faction: type, health: 100, isSelected: false });
    }
    return true;
  }
  if (cmd === 'select all') {
    global.ants = global.ants || [];
    global.ants.forEach(a => a.isSelected = true);
    return true;
  }
  if (cmd === 'select none') {
    global.ants = global.ants || [];
    global.ants.forEach(a => a.isSelected = false);
    return true;
  }
  return false;
};

// Minimal ant array
global.ants = [];

// Minimal helpers that code might use
global.g_gatherDebugRenderer = { toggle() {}, toggleAllLines() {} };

// Expose setup as module export for Node tests
module.exports = { DraggablePanel, RenderManager };
