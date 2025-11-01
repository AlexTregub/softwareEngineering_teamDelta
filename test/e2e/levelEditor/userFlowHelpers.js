/**
 * Reusable E2E Test Helpers for Level Editor User Flows
 * 
 * CRITICAL: These functions follow REAL USER WORKFLOWS with actual mouse clicks
 * and system API calls (handleClick, etc.), NOT direct API manipulation.
 * 
 * Use these helpers to build consistent, realistic E2E tests that prove
 * functionality works through the actual UI, not just programmatically.
 */

const { sleep } = require('../puppeteer_helper');
const cameraHelper = require('../camera_helper');

/**
 * Start Level Editor and ensure it's ready
 * @param {Page} page - Puppeteer page
 * @returns {Promise<Object>} { started: boolean }
 */
async function startLevelEditor(page) {
  const result = await cameraHelper.ensureLevelEditorStarted(page);
  if (!result.started) {
    throw new Error('Failed to start Level Editor');
  }
  await sleep(500);
  return result;
}

/**
 * Click a toolbar tool button
 * @param {Page} page - Puppeteer page
 * @param {string} toolName - Tool name ('eraser', 'brush', 'entity_painter', etc.)
 * @returns {Promise<Object>} { clicked: boolean, selectedTool: string }
 */
async function clickToolbarTool(page, toolName) {
  const toolPos = await page.evaluate((tool) => {
    const toolbar = window.levelEditor?.toolbar;
    if (!toolbar) return { found: false, error: 'No toolbar' };
    
    // Get all tools (returns array of tool names)
    const tools = toolbar.getAllTools ? toolbar.getAllTools() : [];
    
    // Find index of tool
    const toolIndex = tools.findIndex(t => t === tool);
    
    if (toolIndex < 0) {
      return {
        found: false,
        error: `Tool '${tool}' not in tools`,
        toolsList: tools
      };
    }
    
    // Toolbar layout: VERTICAL stacking of buttons
    const toolbarX = 10;
    const toolbarY = 30;
    const buttonSize = 35;
    const spacing = 5;
    
    // Calculate click position (center of button)
    const clickX = toolbarX + spacing + (buttonSize / 2);
    const clickY = toolbarY + spacing + (toolIndex * (buttonSize + spacing)) + (buttonSize / 2);
    
    return {
      found: true,
      clickX: clickX,
      clickY: clickY,
      toolIndex: toolIndex,
      toolsList: tools
    };
  }, toolName);
  
  if (!toolPos.found) {
    throw new Error(`Tool '${toolName}' not found: ${toolPos.error}`);
  }
  
  // Call toolbar.handleClick() to select tool (real user flow)
  const clickResult = await page.evaluate(({ clickX, clickY, tool }) => {
    const toolbar = window.levelEditor?.toolbar;
    const toolbarX = 10;
    const toolbarY = 30;
    
    let result = null;
    if (toolbar && toolbar.handleClick) {
      result = toolbar.handleClick(clickX, clickY, toolbarX, toolbarY);
    }
    
    if (typeof window.redraw === 'function') {
      window.redraw(); window.redraw(); window.redraw();
    }
    
    return {
      handled: result,
      selectedTool: toolbar ? toolbar.selectedTool : null
    };
  }, { clickX: toolPos.clickX, clickY: toolPos.clickY, tool: toolName });
  
  await sleep(300);
  
  return {
    clicked: clickResult.handled === toolName,
    selectedTool: clickResult.selectedTool
  };
}

/**
 * Click entity_painter tool to open entity palette
 * @param {Page} page - Puppeteer page
 * @returns {Promise<Object>} { opened: boolean }
 */
async function openEntityPalette(page) {
  const toolbarPos = await page.evaluate(() => {
    const toolbar = window.levelEditor?.toolbar;
    if (!toolbar) return { found: false };
    
    // entity_painter tool has onClick handler
    const tool = toolbar.tools.find(t => t.id === 'entity_painter' || t.name === 'entity_painter');
    if (!tool) return { found: false };
    
    // Calculate button position
    const toolbarX = 10;
    const toolbarY = 30;
    const buttonSize = 40;
    const buttonSpacing = 5;
    
    const toolIndex = toolbar.tools.findIndex(t => t.id === 'entity_painter' || t.name === 'entity_painter');
    
    // Horizontal layout for toolbar with tools
    const clickX = toolbarX + (toolIndex * (buttonSize + buttonSpacing)) + (buttonSize / 2);
    const clickY = toolbarY + (buttonSize / 2);
    
    return {
      found: true,
      clickX: clickX,
      clickY: clickY
    };
  });
  
  if (!toolbarPos.found) {
    throw new Error('entity_painter tool not found');
  }
  
  await page.mouse.click(toolbarPos.clickX, toolbarPos.clickY);
  await sleep(1000);
  
  return { opened: true };
}

/**
 * Click a template in the entity palette
 * @param {Page} page - Puppeteer page
 * @param {number} templateIndex - Template index (0 = first template)
 * @returns {Promise<Object>} { selected: boolean, templateId: string, templateName: string }
 */
async function clickEntityTemplate(page, templateIndex = 0) {
  const templateResult = await page.evaluate((index) => {
    const panelManager = window.draggablePanelManager;
    if (!panelManager) {
      return { found: false, error: 'No draggablePanelManager' };
    }
    
    const entityPanel = panelManager.getPanel('level-editor-entity-palette');
    if (!entityPanel) {
      const available = Array.from(panelManager.panels.keys());
      return { found: false, error: 'Panel not in draggablePanelManager', available };
    }
    
    if (!entityPanel.state.visible) {
      return { found: false, error: 'Panel not visible' };
    }
    
    // Get panel position and dimensions
    const panelX = entityPanel.state.position.x;
    const panelY = entityPanel.state.position.y;
    const titleBarHeight = entityPanel.config?.style?.titleBarHeight || 25;
    const padding = entityPanel.config?.style?.padding || 10;
    const categoryButtonHeight = 30; // CategoryRadioButtons height
    const itemHeight = 80; // Template item height
    
    // Calculate click position in specified template
    // Click below category buttons + padding + into template at index
    const templateClickX = panelX + padding + 40;
    const templateClickY = panelY + titleBarHeight + categoryButtonHeight + padding + (index * itemHeight) + 40;
    
    return {
      found: true,
      clickX: templateClickX,
      clickY: templateClickY,
      panelX: panelX,
      panelY: panelY,
      titleBarHeight: titleBarHeight,
      categoryButtonHeight: categoryButtonHeight
    };
  }, templateIndex);
  
  if (!templateResult.found) {
    throw new Error(`Entity template not accessible: ${templateResult.error}`);
  }
  
  await page.mouse.click(templateResult.clickX, templateResult.clickY);
  await sleep(500);
  
  // Verify template selected
  const selectedTemplate = await page.evaluate(() => {
    const levelEditor = window.levelEditor;
    if (!levelEditor) return { success: false, error: 'No levelEditor' };
    if (!levelEditor.entityPalette) return { success: false, error: 'No entityPalette' };
    
    const selectedId = levelEditor.entityPalette.getSelectedTemplateId();
    const templates = levelEditor.entityPalette.getCurrentTemplates();
    const selectedTemplate = levelEditor.entityPalette.getSelectedTemplate();
    
    return {
      success: selectedId !== null,
      templateId: selectedId,
      templateName: selectedTemplate ? selectedTemplate.name : 'none',
      templatesCount: templates ? templates.length : 0
    };
  });
  
  if (!selectedTemplate.success) {
    throw new Error('Template not selected after click');
  }
  
  return {
    selected: true,
    templateId: selectedTemplate.templateId,
    templateName: selectedTemplate.templateName
  };
}

/**
 * Place an entity on the canvas at grid coordinates
 * @param {Page} page - Puppeteer page
 * @param {number} gridX - Grid X coordinate
 * @param {number} gridY - Grid Y coordinate
 * @returns {Promise<Object>} { placed: boolean, gridX: number, gridY: number }
 */
async function placeEntityAtGrid(page, gridX, gridY) {
  const TILE_SIZE = 32;
  const placeWorldX = gridX * TILE_SIZE + (TILE_SIZE / 2);
  const placeWorldY = gridY * TILE_SIZE + (TILE_SIZE / 2);
  
  // Convert to screen coordinates
  const placeScreenPos = await page.evaluate(({ wx, wy }) => {
    if (window.cameraManager) {
      return window.cameraManager.worldToScreen(wx, wy);
    }
    return { x: wx, y: wy };
  }, { wx: placeWorldX, wy: placeWorldY });
  
  // Call LevelEditor.handleClick() to place entity (real user flow)
  await page.evaluate(({ screenX, screenY }) => {
    if (window.levelEditor && window.levelEditor.handleClick) {
      window.levelEditor.handleClick(screenX, screenY);
    }
    if (typeof window.redraw === 'function') {
      window.redraw(); window.redraw(); window.redraw();
    }
  }, { screenX: placeScreenPos.x, screenY: placeScreenPos.y });
  
  await sleep(500);
  
  // Verify entity placed
  const entityPlaced = await page.evaluate(({ gx, gy }) => {
    const spawnData = window.levelEditor?._entitySpawnData || [];
    const entityAtPosition = spawnData.find(e => e.gridX === gx && e.gridY === gy);
    
    return {
      totalEntities: spawnData.length,
      entityAtPosition: entityAtPosition !== undefined,
      entityDetails: entityAtPosition || null
    };
  }, { gx: gridX, gy: gridY });
  
  if (!entityPlaced.entityAtPosition) {
    throw new Error(`Entity was not placed at grid(${gridX}, ${gridY})`);
  }
  
  return {
    placed: true,
    gridX: gridX,
    gridY: gridY,
    entityDetails: entityPlaced.entityDetails
  };
}

/**
 * Click a tool mode toggle button
 * @param {Page} page - Puppeteer page
 * @param {string} mode - Mode name ('ALL', 'TERRAIN', 'ENTITY', 'EVENTS')
 * @returns {Promise<Object>} { selected: boolean, mode: string }
 */
async function clickToolModeToggle(page, mode) {
  const modePos = await page.evaluate((modeName) => {
    const toggle = window.levelEditor?.fileMenuBar?.toolModeToggle;
    if (!toggle) {
      return { found: false, error: 'No toolModeToggle' };
    }
    
    const modes = toggle.modes || [];
    const modeIndex = modes.indexOf(modeName);
    
    if (modeIndex < 0) {
      return { found: false, error: `Mode '${modeName}' not found`, availableModes: modes };
    }
    
    // Calculate button position (modes are horizontal)
    const toggleX = toggle.x;
    const toggleY = toggle.y;
    const buttonWidth = toggle.buttonWidth || 80;
    const buttonSpacing = toggle.buttonSpacing || 8;
    
    // Calculate click position (center of button)
    const buttonX = toggleX + (modeIndex * (buttonWidth + buttonSpacing));
    const clickX = buttonX + (buttonWidth / 2);
    const clickY = toggleY + 14; // Half of button height (28)
    
    return {
      found: true,
      clickX: clickX,
      clickY: clickY,
      modes: modes,
      currentMode: toggle.currentMode
    };
  }, mode);
  
  if (!modePos.found) {
    throw new Error(`Mode '${mode}' not found: ${modePos.error}`);
  }
  
  await page.mouse.click(modePos.clickX, modePos.clickY);
  await sleep(500);
  
  await page.evaluate(() => {
    if (typeof window.redraw === 'function') {
      window.redraw(); window.redraw(); window.redraw();
    }
  });
  await sleep(300);
  
  // Verify mode selected
  const modeSelected = await page.evaluate(() => {
    const toggle = window.levelEditor?.fileMenuBar?.toolModeToggle;
    return {
      toggleMode: toggle ? toggle.currentMode : null
    };
  });
  
  if (modeSelected.toggleMode !== mode) {
    throw new Error(`Mode '${mode}' not selected (current: ${modeSelected.toggleMode})`);
  }
  
  return {
    selected: true,
    mode: modeSelected.toggleMode
  };
}

/**
 * Erase entity at grid coordinates using eraser tool
 * @param {Page} page - Puppeteer page
 * @param {number} gridX - Grid X coordinate
 * @param {number} gridY - Grid Y coordinate
 * @returns {Promise<Object>} { erased: boolean, gridX: number, gridY: number }
 */
async function eraseEntityAtGrid(page, gridX, gridY) {
  const TILE_SIZE = 32;
  const eraseWorldX = gridX * TILE_SIZE + (TILE_SIZE / 2);
  const eraseWorldY = gridY * TILE_SIZE + (TILE_SIZE / 2);
  
  // Convert to screen coordinates
  const eraseScreenPos = await page.evaluate(({ wx, wy }) => {
    if (window.cameraManager) {
      return window.cameraManager.worldToScreen(wx, wy);
    }
    return { x: wx, y: wy };
  }, { wx: eraseWorldX, wy: eraseWorldY });
  
  // Call LevelEditor.handleClick() to erase entity (real user flow)
  await page.evaluate(({ screenX, screenY }) => {
    if (window.levelEditor && window.levelEditor.handleClick) {
      window.levelEditor.handleClick(screenX, screenY);
    }
    if (typeof window.redraw === 'function') {
      window.redraw(); window.redraw(); window.redraw();
    }
  }, { screenX: eraseScreenPos.x, screenY: eraseScreenPos.y });
  
  await sleep(500);
  
  // Verify entity erased
  const entityErased = await page.evaluate(({ gx, gy }) => {
    const spawnData = window.levelEditor?._entitySpawnData || [];
    const entityAtPosition = spawnData.find(e => e.gridX === gx && e.gridY === gy);
    
    return {
      totalEntities: spawnData.length,
      entityAtPosition: entityAtPosition !== undefined
    };
  }, { gx: gridX, gy: gridY });
  
  if (entityErased.entityAtPosition) {
    throw new Error(`Entity was not erased at grid(${gridX}, ${gridY})`);
  }
  
  return {
    erased: true,
    gridX: gridX,
    gridY: gridY
  };
}

/**
 * Verify entity exists at grid coordinates in level data
 * @param {Page} page - Puppeteer page
 * @param {number} gridX - Grid X coordinate
 * @param {number} gridY - Grid Y coordinate
 * @returns {Promise<Object>} { exists: boolean, entityDetails: Object|null }
 */
async function verifyEntityAtGrid(page, gridX, gridY) {
  const result = await page.evaluate(({ gx, gy }) => {
    const spawnData = window.levelEditor?._entitySpawnData || [];
    const entityAtPosition = spawnData.find(e => e.gridX === gx && e.gridY === gy);
    
    return {
      exists: entityAtPosition !== undefined,
      entityDetails: entityAtPosition || null,
      totalEntities: spawnData.length
    };
  }, { gx: gridX, gy: gridY });
  
  return result;
}

/**
 * Verify entity does NOT exist at grid coordinates in level data
 * @param {Page} page - Puppeteer page
 * @param {number} gridX - Grid X coordinate
 * @param {number} gridY - Grid Y coordinate
 * @returns {Promise<Object>} { erased: boolean }
 */
async function verifyEntityErasedAtGrid(page, gridX, gridY) {
  const result = await verifyEntityAtGrid(page, gridX, gridY);
  
  if (result.exists) {
    throw new Error(`Entity still exists at grid(${gridX}, ${gridY})`);
  }
  
  return { erased: true };
}

// ============================================================================
// ADDITIONAL HELPERS - Extracted from E2E tests
// ============================================================================

/**
 * Ensure game started (bypassing main menu)
 * @param {Page} page - Puppeteer page
 * @returns {Promise<Object>} { started: boolean, diagnostics: Object }
 */
async function ensureGameStarted(page) {
  const result = await cameraHelper.ensureGameStarted(page);
  if (!result.started) {
    throw new Error(`Game failed to start: ${result.reason || 'Unknown reason'}`);
  }
  await sleep(500);
  return result;
}

/**
 * Switch to Level Editor game state
 * @param {Page} page - Puppeteer page
 * @returns {Promise<void>}
 */
async function switchToLevelEditor(page) {
  await page.evaluate(() => {
    if (window.GameState && window.GameState.setState) {
      window.GameState.setState('LEVEL_EDITOR');
    } else {
      window.gameState = 'LEVEL_EDITOR';
    }
  });
  await sleep(1000);
}

/**
 * Get toolbar information and state
 * @param {Page} page - Puppeteer page
 * @returns {Promise<Object>} { toolsCount, toolNames, activeTool, etc. }
 */
async function getToolbarInfo(page) {
  const result = await page.evaluate(() => {
    if (!window.levelEditor || !window.levelEditor.toolbar) {
      return { error: 'Toolbar not found' };
    }
    
    const toolbar = window.levelEditor.toolbar;
    const allTools = toolbar.getAllTools ? toolbar.getAllTools() : [];
    
    return {
      toolsCount: allTools.length,
      toolNames: allTools,
      activeTool: toolbar.activeTool,
      activeMode: toolbar.activeMode,
      hasHandleClick: typeof toolbar.handleClick === 'function',
      isArray: Array.isArray(toolbar.tools)
    };
  });
  
  return result;
}

/**
 * Get active tool and mode
 * @param {Page} page - Puppeteer page
 * @returns {Promise<Object>} { tool: string|null, mode: string|null }
 */
async function getActiveToolMode(page) {
  const result = await page.evaluate(() => {
    const toolbar = window.levelEditor?.toolbar;
    const menuBar = window.levelEditor?.fileMenuBar;
    const toggle = menuBar?.toolModeToggle;
    
    if (!toolbar) return { tool: null, mode: null };
    
    return {
      tool: toolbar.selectedTool || toolbar.activeTool || null,
      mode: toggle?.currentMode || toolbar.activeMode || null
    };
  });
  
  return result;
}

/**
 * Set tool mode directly (for setup, not user flow)
 * @param {Page} page - Puppeteer page
 * @param {string} mode - Mode name (TERRAIN, ENTITY, ALL, etc.)
 * @returns {Promise<void>}
 */
async function setToolMode(page, mode) {
  await page.evaluate((m) => {
    if (window.levelEditor && window.levelEditor.toolbar) {
      window.levelEditor.toolbar.setToolMode(m);
    }
  }, mode);
  
  await forceRedraw(page);
  await sleep(300);
}

/**
 * Select toolbar tool (via API, not mouse click)
 * @param {Page} page - Puppeteer page
 * @param {string} toolName - Tool name
 * @returns {Promise<void>}
 */
async function selectTool(page, toolName) {
  await page.evaluate((tool) => {
    if (window.levelEditor && window.levelEditor.toolbar) {
      window.levelEditor.toolbar.selectTool(tool);
    }
  }, toolName);
  
  await forceRedraw(page);
  await sleep(300);
}

/**
 * Deselect current tool
 * @param {Page} page - Puppeteer page
 * @returns {Promise<void>}
 */
async function deselectTool(page) {
  await page.evaluate(() => {
    if (window.levelEditor && window.levelEditor.toolbar) {
      window.levelEditor.toolbar.activeTool = null;
      window.levelEditor.toolbar.activeMode = null;
    }
  });
  
  await forceRedraw(page);
  await sleep(300);
}

// ============================================================================
// MATERIAL & PAINTING HELPERS
// ============================================================================

/**
 * Select material from palette
 * @param {Page} page - Puppeteer page
 * @param {string} materialName - Material name ('moss', 'stone', 'dirt', 'grass')
 * @returns {Promise<Object>} { success: boolean, selectedMaterial: string }
 */
async function selectMaterial(page, materialName) {
  const result = await page.evaluate((mat) => {
    const palette = window.levelEditor?.palette;
    if (!palette) return { success: false, error: 'Palette not found' };
    
    palette.selectMaterial(mat);
    const selected = palette.getSelectedMaterial();
    
    return {
      success: selected === mat,
      selectedMaterial: selected,
      isMaterialName: typeof selected === 'string' && !selected.startsWith('#')
    };
  }, materialName);
  
  return result;
}

/**
 * Paint tile at world coordinates
 * @param {Page} page - Puppeteer page
 * @param {number} worldX - World X coordinate
 * @param {number} worldY - World Y coordinate
 * @returns {Promise<void>}
 */
async function paintTile(page, worldX, worldY) {
  await page.evaluate((x, y) => {
    const editor = window.levelEditor?.editor;
    if (editor && editor.paintTile) {
      editor.paintTile(x, y);
    }
  }, worldX, worldY);
  
  await sleep(200);
}

/**
 * Verify terrain material at world coordinates
 * @param {Page} page - Puppeteer page
 * @param {number} worldX - World X coordinate
 * @param {number} worldY - World Y coordinate
 * @param {string} expectedMaterial - Expected material name
 * @returns {Promise<Object>} { matches: boolean, actual: string, expected: string }
 */
async function verifyTerrainMaterial(page, worldX, worldY, expectedMaterial) {
  const result = await page.evaluate((x, y, expected) => {
    const terrain = window.levelEditor?.terrain;
    if (!terrain || !terrain.getArrPos) {
      return { error: 'Terrain not available' };
    }
    
    const gridX = Math.floor(x / 32);
    const gridY = Math.floor(y / 32);
    
    const tile = terrain.getArrPos([gridX, gridY]);
    if (!tile) {
      return { error: `No tile at [${gridX}, ${gridY}]` };
    }
    
    const actual = tile.getMaterial ? tile.getMaterial() : 'unknown';
    
    return {
      matches: actual === expected,
      actual,
      expected,
      isColorCode: /^#[0-9A-F]{6}$/i.test(actual)
    };
  }, worldX, worldY, expectedMaterial);
  
  if (result.error) {
    throw new Error(result.error);
  }
  
  return result;
}

// ============================================================================
// PANEL HELPERS
// ============================================================================

/**
 * Open panel by ID
 * @param {Page} page - Puppeteer page
 * @param {string} panelId - Panel ID
 * @returns {Promise<Object>} { opened: boolean, visible: boolean }
 */
async function openPanel(page, panelId) {
  const result = await page.evaluate((id) => {
    if (!window.draggablePanelManager) {
      return { opened: false, error: 'Panel manager not found' };
    }
    
    const panel = window.draggablePanelManager.getPanel(id);
    if (!panel) {
      return { opened: false, error: `Panel '${id}' not found` };
    }
    
    panel.show();
    
    return {
      opened: true,
      visible: panel.state.visible
    };
  }, panelId);
  
  await forceRedraw(page);
  await sleep(300);
  
  return result;
}

/**
 * Close panel by ID
 * @param {Page} page - Puppeteer page
 * @param {string} panelId - Panel ID
 * @returns {Promise<Object>} { closed: boolean }
 */
async function closePanel(page, panelId) {
  const result = await page.evaluate((id) => {
    if (!window.draggablePanelManager) {
      return { closed: false, error: 'Panel manager not found' };
    }
    
    const panel = window.draggablePanelManager.getPanel(id);
    if (!panel) {
      return { closed: false, error: `Panel '${id}' not found` };
    }
    
    panel.hide();
    
    return {
      closed: true,
      visible: panel.state.visible
    };
  }, panelId);
  
  await forceRedraw(page);
  await sleep(300);
  
  return result;
}

/**
 * Minimize/restore panel
 * @param {Page} page - Puppeteer page
 * @param {string} panelId - Panel ID
 * @returns {Promise<Object>} { minimized: boolean }
 */
async function minimizePanel(page, panelId) {
  const result = await page.evaluate((id) => {
    if (!window.draggablePanelManager) {
      return { error: 'Panel manager not found' };
    }
    
    const panel = window.draggablePanelManager.getPanel(id);
    if (!panel) {
      return { error: `Panel '${id}' not found` };
    }
    
    panel.toggleMinimized();
    
    return {
      minimized: panel.state.minimized,
      titleBarHeight: panel.calculateTitleBarHeight()
    };
  }, panelId);
  
  await forceRedraw(page);
  await sleep(300);
  
  return result;
}

/**
 * Get panel state
 * @param {Page} page - Puppeteer page
 * @param {string} panelId - Panel ID
 * @returns {Promise<Object>} Panel state
 */
async function getPanelState(page, panelId) {
  const result = await page.evaluate((id) => {
    if (!window.draggablePanelManager) {
      return { error: 'Panel manager not found' };
    }
    
    const panel = window.draggablePanelManager.getPanel(id);
    if (!panel) {
      return { error: `Panel '${id}' not found` };
    }
    
    return {
      visible: panel.state.visible,
      minimized: panel.state.minimized,
      position: panel.state.position,
      size: panel.config.size
    };
  }, panelId);
  
  return result;
}

// ============================================================================
// CAMERA HELPERS
// ============================================================================

/**
 * Set camera position
 * @param {Page} page - Puppeteer page
 * @param {number} x - Camera X position
 * @param {number} y - Camera Y position
 * @returns {Promise<void>}
 */
async function setCameraPosition(page, x, y) {
  await page.evaluate((cx, cy) => {
    if (window.cameraManager) {
      window.cameraManager.setPosition(cx, cy);
    }
  }, x, y);
  
  await forceRedraw(page);
  await sleep(200);
}

/**
 * Zoom camera
 * @param {Page} page - Puppeteer page
 * @param {number} zoomLevel - Zoom level (1.0 = 100%)
 * @returns {Promise<void>}
 */
async function zoomCamera(page, zoomLevel) {
  await page.evaluate((zoom) => {
    if (window.cameraManager) {
      window.cameraManager.setZoom(zoom);
    }
  }, zoomLevel);
  
  await forceRedraw(page);
  await sleep(200);
}

/**
 * Pan camera by delta
 * @param {Page} page - Puppeteer page
 * @param {number} deltaX - Delta X
 * @param {number} deltaY - Delta Y
 * @returns {Promise<void>}
 */
async function panCamera(page, deltaX, deltaY) {
  await page.evaluate((dx, dy) => {
    if (window.cameraManager) {
      const currentPos = window.cameraManager.getPosition();
      window.cameraManager.setPosition(currentPos.x + dx, currentPos.y + dy);
    }
  }, deltaX, deltaY);
  
  await forceRedraw(page);
  await sleep(200);
}

// ============================================================================
// UTILITY HELPERS
// ============================================================================

/**
 * Force redraw (calls redraw() multiple times for layer rendering)
 * @param {Page} page - Puppeteer page
 * @returns {Promise<void>}
 */
async function forceRedraw(page) {
  await page.evaluate(() => {
    if (typeof window.redraw === 'function') {
      window.redraw();
      window.redraw();
      window.redraw();
    }
  });
}

/**
 * Force panel rendering for current game state
 * @param {Page} page - Puppeteer page
 * @param {string} gameState - Game state ('PLAYING', 'LEVEL_EDITOR', etc.)
 * @returns {Promise<void>}
 */
async function forceRenderPanels(page, gameState) {
  await page.evaluate((state) => {
    window.gameState = state;
    
    if (window.draggablePanelManager) {
      if (window.draggablePanelManager.gameState !== undefined) {
        window.draggablePanelManager.gameState = state;
      }
      if (typeof window.draggablePanelManager.renderPanels === 'function') {
        window.draggablePanelManager.renderPanels(state);
      }
      if (window.draggablePanelManager.render) {
        window.draggablePanelManager.render();
      }
    }
    
    if (typeof window.redraw === 'function') {
      window.redraw();
      window.redraw();
      window.redraw();
    }
  }, gameState);
  
  await sleep(500);
}

/**
 * Take screenshot with consistent naming
 * @param {Page} page - Puppeteer page
 * @param {string} category - Category ('levelEditor', 'ui', 'camera', etc.)
 * @param {string} name - Screenshot name
 * @param {boolean} success - Success state
 * @returns {Promise<void>}
 */
async function takeScreenshot(page, category, name, success = true) {
  const { saveScreenshot } = require('../puppeteer_helper');
  await saveScreenshot(page, `${category}/${name}`, success);
}

/**
 * Wait for condition with timeout
 * @param {Page} page - Puppeteer page
 * @param {Function} conditionFn - Function that returns boolean
 * @param {number} timeout - Timeout in ms (default: 5000)
 * @param {number} interval - Check interval in ms (default: 100)
 * @returns {Promise<boolean>} True if condition met, false if timeout
 */
async function waitForCondition(page, conditionFn, timeout = 5000, interval = 100) {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    const result = await page.evaluate(conditionFn);
    if (result) return true;
    await sleep(interval);
  }
  
  return false;
}

/**
 * Get level JSON data
 * @param {Page} page - Puppeteer page
 * @returns {Promise<Object>} Level data
 */
async function getLevelData(page) {
  const result = await page.evaluate(() => {
    if (!window.levelEditor) {
      return { error: 'Level editor not found' };
    }
    
    return {
      entitySpawnData: window.levelEditor._entitySpawnData || [],
      terrainData: window.levelEditor.terrain ? 'exists' : 'missing'
    };
  });
  
  return result;
}

// ============================================================================
// GHERKIN-STYLE ALIASES (Behavior-Driven Test Style)
// ============================================================================

/**
 * Gherkin-style test helpers for behavior-driven testing
 * 
 * Usage:
 *   await given.levelEditorIsOpen(page);
 *   await when.userClicksToolbarTool(page, 'paint');
 *   await and.userSelectsMaterial(page, 'moss');
 *   await then.materialShouldBe(page, 100, 100, 'moss');
 */
const given = {
  levelEditorIsOpen: startLevelEditor,
  gameIsStarted: ensureGameStarted,
  toolIsSelected: selectTool,
  materialIsSelected: selectMaterial,
  cameraIsAt: setCameraPosition,
  panelIsOpen: openPanel,
  panelIsClosed: closePanel
};

const when = {
  userClicksToolbarTool: clickToolbarTool,
  userSelectsTool: selectTool,
  userDeselectsTool: deselectTool,
  userClicksToolMode: clickToolModeToggle,
  userSelectsMaterial: selectMaterial,
  userPaintsAtPosition: paintTile,
  userPlacesEntityAtGrid: placeEntityAtGrid,
  userErasesEntityAtGrid: eraseEntityAtGrid,
  userOpensEntityPalette: openEntityPalette,
  userClicksEntityTemplate: clickEntityTemplate,
  userOpensPanel: openPanel,
  userClosesPanel: closePanel,
  userMinimizesPanel: minimizePanel,
  userZoomsCamera: zoomCamera,
  userPansCamera: panCamera
};

const then = {
  entityShouldExistAtGrid: verifyEntityAtGrid,
  entityShouldNotExistAtGrid: verifyEntityErasedAtGrid,
  materialShouldBe: verifyTerrainMaterial,
  toolShouldBe: async (page, expectedTool) => {
    const state = await getActiveToolMode(page);
    if (state.tool !== expectedTool) {
      throw new Error(`Expected tool '${expectedTool}', got '${state.tool}'`);
    }
    return { matches: true };
  },
  modeShouldBe: async (page, expectedMode) => {
    const state = await getActiveToolMode(page);
    if (state.mode !== expectedMode) {
      throw new Error(`Expected mode '${expectedMode}', got '${state.mode}'`);
    }
    return { matches: true };
  },
  panelShouldBeVisible: async (page, panelId) => {
    const state = await getPanelState(page, panelId);
    if (!state.visible) {
      throw new Error(`Panel '${panelId}' should be visible but is hidden`);
    }
    return { visible: true };
  },
  panelShouldBeMinimized: async (page, panelId) => {
    const state = await getPanelState(page, panelId);
    if (!state.minimized) {
      throw new Error(`Panel '${panelId}' should be minimized but is not`);
    }
    return { minimized: true };
  }
};

const and = when; // Alias for readability

module.exports = {
  // Original helpers
  startLevelEditor,
  clickToolbarTool,
  openEntityPalette,
  clickEntityTemplate,
  placeEntityAtGrid,
  clickToolModeToggle,
  eraseEntityAtGrid,
  verifyEntityAtGrid,
  verifyEntityErasedAtGrid,
  
  // Initialization
  ensureGameStarted,
  switchToLevelEditor,
  
  // Toolbar
  getToolbarInfo,
  getActiveToolMode,
  selectTool,
  deselectTool,
  setToolMode,
  
  // Materials & Painting
  selectMaterial,
  paintTile,
  verifyTerrainMaterial,
  
  // Panels
  openPanel,
  closePanel,
  minimizePanel,
  getPanelState,
  
  // Camera
  setCameraPosition,
  zoomCamera,
  panCamera,
  
  // Utilities
  forceRedraw,
  forceRenderPanels,
  takeScreenshot,
  waitForCondition,
  getLevelData,
  
  // Gherkin-style aliases
  given,
  when,
  then,
  and
};
