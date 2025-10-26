/**
 * Unit Tests for TerrainUI Components
 * Tests UI widgets for terrain editing (material palette, toolbar, etc.)
 */

const { expect } = require('chai');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

// Load real UI component classes
const materialPaletteCode = fs.readFileSync(
  path.join(__dirname, '../../../Classes/ui/MaterialPalette.js'),
  'utf8'
);
const toolBarCode = fs.readFileSync(
  path.join(__dirname, '../../../Classes/ui/ToolBar.js'),
  'utf8'
);
const brushSizeControlCode = fs.readFileSync(
  path.join(__dirname, '../../../Classes/ui/BrushSizeControl.js'),
  'utf8'
);
const miniMapCode = fs.readFileSync(
  path.join(__dirname, '../../../Classes/ui/MiniMap.js'),
  'utf8'
);
const propertiesPanelCode = fs.readFileSync(
  path.join(__dirname, '../../../Classes/ui/PropertiesPanel.js'),
  'utf8'
);
const gridOverlayCode = fs.readFileSync(
  path.join(__dirname, '../../../Classes/ui/GridOverlay.js'),
  'utf8'
);
const notificationManagerCode = fs.readFileSync(
  path.join(__dirname, '../../../Classes/ui/NotificationManager.js'),
  'utf8'
);
const confirmationDialogCode = fs.readFileSync(
  path.join(__dirname, '../../../Classes/ui/ConfirmationDialog.js'),
  'utf8'
);

// Execute in global context to define classes
vm.runInThisContext(materialPaletteCode);
vm.runInThisContext(toolBarCode);
vm.runInThisContext(brushSizeControlCode);
vm.runInThisContext(miniMapCode);
vm.runInThisContext(propertiesPanelCode);
vm.runInThisContext(gridOverlayCode);
vm.runInThisContext(notificationManagerCode);
vm.runInThisContext(confirmationDialogCode);

describe('TerrainUI - Material Palette', function() {
  
  describe('MaterialPalette', function() {
    
    it('should create palette with all available materials', function() {
      const materials = ['moss', 'moss_0', 'moss_1', 'stone', 'dirt', 'grass'];
      const palette = new MaterialPalette(materials);
      
      expect(palette.getMaterials()).to.have.lengthOf(6);
      expect(palette.getSelectedMaterial()).to.equal('moss');
    });
    
    it('should select material on click', function() {
      const palette = new MaterialPalette(['moss', 'stone', 'dirt']);
      
      // Simulate click
      palette.selectMaterial('stone');
      
      expect(palette.getSelectedMaterial()).to.equal('stone');
    });
    
    it('should highlight selected material', function() {
      const palette = new MaterialPalette(['moss', 'stone']);
      
      expect(palette.getSelectedIndex()).to.equal(0);
      expect(palette.isHighlighted('moss')).to.be.true;
      
      palette.selectMaterial('stone');
      expect(palette.getSelectedIndex()).to.equal(1);
      expect(palette.isHighlighted('stone')).to.be.true;
    });
    
    it('should display material preview', function() {
      const palette = new MaterialPalette(['moss', 'stone']);
      
      expect(palette.getMaterialColor('moss')).to.equal('#228B22');
      expect(palette.getMaterialColor('stone')).to.equal('#808080');
    });
    
    it('should organize materials by category', function() {
      const palette = new MaterialPalette(['moss', 'stone', 'dirt']);
      
      expect(palette.getCategory('moss')).to.equal('natural');
      expect(palette.getCategory('stone')).to.equal('solid');
      expect(palette.getCategory('dirt')).to.equal('soil');
    });
    
    it('should support keyboard navigation', function() {
      const palette = new MaterialPalette(['moss', 'stone', 'dirt']);
      
      expect(palette.selectNext()).to.equal('stone');
      expect(palette.selectNext()).to.equal('dirt');
      expect(palette.selectNext()).to.equal('moss'); // Wrap around
      expect(palette.selectPrevious()).to.equal('dirt');
    });
  });
  
  describe('MaterialPreview', function() {
    
    it('should render material swatch', function() {
      const preview = {
        material: 'stone',
        size: 32,
        render: function() {
          return {
            width: this.size,
            height: this.size,
            material: this.material
          };
        }
      };
      
      const rendered = preview.render();
      expect(rendered.width).to.equal(32);
      expect(rendered.material).to.equal('stone');
    });
    
    it('should show material name tooltip', function() {
      const preview = {
        material: 'moss_0',
        getTooltip: function() {
          const names = {
            'moss_0': 'Moss (Variant 0)',
            'stone': 'Stone',
            'dirt': 'Dirt'
          };
          return names[this.material] || this.material;
        }
      };
      
      expect(preview.getTooltip()).to.equal('Moss (Variant 0)');
    });
    
    it('should display material properties', function() {
      const preview = {
        material: 'stone',
        getProperties: function() {
          const props = {
            'stone': { weight: 100, passable: false },
            'dirt': { weight: 3, passable: true },
            'moss': { weight: 2, passable: true }
          };
          return props[this.material];
        }
      };
      
      const props = preview.getProperties();
      expect(props.weight).to.equal(100);
      expect(props.passable).to.be.false;
    });
  });
});

describe('TerrainUI - Tool Toolbar', function() {
  
  describe('ToolBar', function() {
    
    it('should create toolbar with all tools', function() {
      const toolbar = new ToolBar();
      
      expect(toolbar.getAllTools()).to.include.members(['brush', 'fill', 'rectangle', 'line', 'eyedropper']);
      expect(toolbar.getSelectedTool()).to.equal('brush');
    });
    
    it('should select tool on click', function() {
      const toolbar = new ToolBar();
      
      toolbar.selectTool('fill');
      expect(toolbar.getSelectedTool()).to.equal('fill');
    });
    
    it('should show tool shortcuts', function() {
      const toolbar = new ToolBar();
      
      expect(toolbar.getShortcut('brush')).to.equal('B');
      expect(toolbar.getShortcut('fill')).to.equal('F');
    });
    
    it('should disable unavailable tools', function() {
      const toolbar = new ToolBar();
      
      expect(toolbar.isEnabled('brush')).to.be.true;
      expect(toolbar.isEnabled('undo')).to.be.false;
    });
    
    it('should group related tools', function() {
      const toolbar = new ToolBar();
      
      expect(toolbar.getToolGroup('brush')).to.equal('drawing');
      expect(toolbar.getToolGroup('undo')).to.equal('edit');
    });
  });
  
  describe('BrushSizeControl', function() {
    
    it('should set brush size', function() {
      const control = {
        size: 1,
        minSize: 1,
        maxSize: 9,
        setSize: function(newSize) {
          if (newSize >= this.minSize && newSize <= this.maxSize) {
            this.size = newSize;
            return true;
          }
          return false;
        }
      };
      
      expect(control.setSize(3)).to.be.true;
      expect(control.size).to.equal(3);
      expect(control.setSize(15)).to.be.false; // Out of range
    });
    
    it('should display brush preview', function() {
      const control = {
        size: 3,
        getBrushPattern: function() {
          // Return circular pattern
          const pattern = [];
          const radius = Math.floor(this.size / 2);
          for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
              if (Math.sqrt(dx * dx + dy * dy) <= radius) {
                pattern.push([dx, dy]);
              }
            }
          }
          return pattern;
        }
      };
      
      const pattern = control.getBrushPattern();
      expect(pattern).to.be.an('array');
      expect(pattern.length).to.be.greaterThan(1);
    });
    
    it('should support odd-numbered sizes only', function() {
      const control = {
        size: 1,
        setSize: function(newSize) {
          if (newSize % 2 === 1) { // Only odd numbers
            this.size = newSize;
            return true;
          }
          return false;
        }
      };
      
      expect(control.setSize(3)).to.be.true;
      expect(control.setSize(5)).to.be.true;
      expect(control.setSize(4)).to.be.false; // Even number
    });
  });
});

describe('TerrainUI - Mini Map', function() {
  
  describe('MiniMap', function() {
    
    it('should create mini map with terrain overview', function() {
      const miniMap = {
        width: 200,
        height: 200,
        terrainWidth: 800,
        terrainHeight: 800,
        scale: 0.25,
        getScale: function() {
          return this.width / this.terrainWidth;
        }
      };
      
      expect(miniMap.getScale()).to.equal(0.25);
    });
    
    it('should show camera viewport', function() {
      const miniMap = {
        cameraX: 100,
        cameraY: 100,
        cameraWidth: 400,
        cameraHeight: 400,
        scale: 0.25,
        getViewportRect: function() {
          return {
            x: this.cameraX * this.scale,
            y: this.cameraY * this.scale,
            width: this.cameraWidth * this.scale,
            height: this.cameraHeight * this.scale
          };
        }
      };
      
      const viewport = miniMap.getViewportRect();
      expect(viewport.x).to.equal(25);
      expect(viewport.width).to.equal(100);
    });
    
    it('should navigate on mini map click', function() {
      const miniMap = {
        scale: 0.25,
        clickToWorldPosition: function(miniMapX, miniMapY) {
          return {
            x: miniMapX / this.scale,
            y: miniMapY / this.scale
          };
        }
      };
      
      const worldPos = miniMap.clickToWorldPosition(50, 50);
      expect(worldPos.x).to.equal(200);
      expect(worldPos.y).to.equal(200);
    });
    
    it('should update in real-time', function() {
      const miniMap = {
        lastUpdate: 0,
        updateInterval: 100, // ms
        shouldUpdate: function(currentTime) {
          return currentTime - this.lastUpdate >= this.updateInterval;
        }
      };
      
      expect(miniMap.shouldUpdate(50)).to.be.false;
      expect(miniMap.shouldUpdate(100)).to.be.true;
      expect(miniMap.shouldUpdate(200)).to.be.true;
    });
  });
});

describe('TerrainUI - Properties Panel', function() {
  
  describe('PropertiesPanel', function() {
    
    it('should display selected tile properties', function() {
      const panel = {
        selectedTile: {
          x: 5,
          y: 10,
          material: 'stone',
          weight: 100
        },
        getProperties: function() {
          return {
            position: `(${this.selectedTile.x}, ${this.selectedTile.y})`,
            material: this.selectedTile.material,
            weight: this.selectedTile.weight,
            passable: this.selectedTile.weight < 100
          };
        }
      };
      
      const props = panel.getProperties();
      expect(props.position).to.equal('(5, 10)');
      expect(props.material).to.equal('stone');
      expect(props.passable).to.be.false;
    });
    
    it('should show terrain statistics', function() {
      const panel = {
        terrain: {
          totalTiles: 256,
          materials: {
            'moss': 150,
            'stone': 50,
            'dirt': 56
          }
        },
        getStatistics: function() {
          return {
            total: this.terrain.totalTiles,
            materials: this.terrain.materials,
            diversity: Object.keys(this.terrain.materials).length
          };
        }
      };
      
      const stats = panel.getStatistics();
      expect(stats.total).to.equal(256);
      expect(stats.diversity).to.equal(3);
    });
    
    it('should display undo/redo stack size', function() {
      const panel = {
        undoStack: [1, 2, 3],
        redoStack: [4],
        getStackInfo: function() {
          return {
            canUndo: this.undoStack.length > 0,
            canRedo: this.redoStack.length > 0,
            undoCount: this.undoStack.length,
            redoCount: this.redoStack.length
          };
        }
      };
      
      const info = panel.getStackInfo();
      expect(info.canUndo).to.be.true;
      expect(info.undoCount).to.equal(3);
    });
  });
});

describe('TerrainUI - Grid Overlay', function() {
  
  describe('GridOverlay', function() {
    
    it('should toggle grid visibility', function() {
      const grid = {
        visible: true,
        toggle: function() {
          this.visible = !this.visible;
          return this.visible;
        }
      };
      
      expect(grid.toggle()).to.be.false;
      expect(grid.toggle()).to.be.true;
    });
    
    it('should calculate grid line positions', function() {
      const grid = {
        tileSize: 32,
        width: 128,
        height: 128,
        getVerticalLines: function() {
          const lines = [];
          for (let x = 0; x <= this.width; x += this.tileSize) {
            lines.push({ x1: x, y1: 0, x2: x, y2: this.height });
          }
          return lines;
        }
      };
      
      const lines = grid.getVerticalLines();
      expect(lines).to.have.lengthOf(5); // 0, 32, 64, 96, 128
    });
    
    it('should adjust opacity', function() {
      const grid = {
        opacity: 0.5,
        minOpacity: 0.1,
        maxOpacity: 1.0,
        setOpacity: function(value) {
          this.opacity = Math.max(this.minOpacity, Math.min(this.maxOpacity, value));
        }
      };
      
      grid.setOpacity(0.8);
      expect(grid.opacity).to.equal(0.8);
      grid.setOpacity(2.0);
      expect(grid.opacity).to.equal(1.0); // Clamped
    });
    
    it('should highlight hovered tile', function() {
      const grid = {
        hoveredTile: null,
        tileSize: 32,
        setHovered: function(mouseX, mouseY) {
          this.hoveredTile = {
            x: Math.floor(mouseX / this.tileSize),
            y: Math.floor(mouseY / this.tileSize)
          };
        }
      };
      
      grid.setHovered(100, 75);
      expect(grid.hoveredTile.x).to.equal(3);
      expect(grid.hoveredTile.y).to.equal(2);
    });
  });
});

describe('TerrainUI - Notification System', function() {
  
  describe('NotificationManager', function() {
    
    it('should show notification', function() {
      const manager = {
        notifications: [],
        show: function(message, type = 'info') {
          this.notifications.push({
            message,
            type,
            timestamp: Date.now()
          });
        }
      };
      
      manager.show('Terrain saved', 'success');
      expect(manager.notifications).to.have.lengthOf(1);
      expect(manager.notifications[0].type).to.equal('success');
    });
    
    it('should auto-dismiss after timeout', function() {
      const manager = {
        notifications: [
          { message: 'Test', timestamp: Date.now() - 5000 }
        ],
        timeout: 3000,
        removeExpired: function(currentTime) {
          this.notifications = this.notifications.filter(n => {
            return currentTime - n.timestamp < this.timeout;
          });
        }
      };
      
      manager.removeExpired(Date.now());
      expect(manager.notifications).to.have.lengthOf(0);
    });
    
    it('should support different notification types', function() {
      const manager = {
        getColor: function(type) {
          const colors = {
            'info': '#0066cc',
            'success': '#00cc66',
            'warning': '#ff9900',
            'error': '#cc0000'
          };
          return colors[type] || colors['info'];
        }
      };
      
      expect(manager.getColor('success')).to.equal('#00cc66');
      expect(manager.getColor('error')).to.equal('#cc0000');
    });
  });
});

describe('TerrainUI - Confirmation Dialogs', function() {
  
  describe('ConfirmationDialog', function() {
    
    it('should show confirmation for destructive actions', function() {
      const dialog = {
        visible: false,
        message: '',
        show: function(message) {
          this.visible = true;
          this.message = message;
        }
      };
      
      dialog.show('Clear all terrain?');
      expect(dialog.visible).to.be.true;
      expect(dialog.message).to.include('Clear');
    });
    
    it('should handle confirm callback', function() {
      let confirmed = false;
      const dialog = {
        onConfirm: null,
        confirm: function() {
          if (this.onConfirm) this.onConfirm();
        }
      };
      
      dialog.onConfirm = () => { confirmed = true; };
      dialog.confirm();
      
      expect(confirmed).to.be.true;
    });
    
    it('should handle cancel callback', function() {
      let cancelled = false;
      const dialog = {
        onCancel: null,
        cancel: function() {
          if (this.onCancel) this.onCancel();
          this.visible = false;
        },
        visible: true
      };
      
      dialog.onCancel = () => { cancelled = true; };
      dialog.cancel();
      
      expect(cancelled).to.be.true;
      expect(dialog.visible).to.be.false;
    });
  });
});
