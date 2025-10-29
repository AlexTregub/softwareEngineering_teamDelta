/**
 * Unit tests for FileMenuBar View menu functionality
 * 
 * TDD: Write tests FIRST for view toggle feature
 * 
 * Requirements:
 * - View menu with toggle items for each UI element
 * - Toggling visibility prevents rendering (not minimization)
 * - All UI elements have visibility state
 */

const { expect } = require('chai');
const sinon = require('sinon');
const fs = require('fs');
const vm = require('vm');
const path = require('path');

describe('FileMenuBar - View Menu', function() {
    let FileMenuBar;
    let menuBar;
    let mockLevelEditor;

    beforeEach(function() {
        // Mock canvas dimensions
        global.g_canvasX = 1920;
        global.g_canvasY = 1080;
        global.window = { width: 1920, height: 1080 };

        // Load FileMenuBar class
        const fileMenuBarPath = path.join(__dirname, '../../../Classes/ui/FileMenuBar.js');
        const fileMenuBarCode = fs.readFileSync(fileMenuBarPath, 'utf8');
        const context = { module: { exports: {} }, window: global.window, ...global };
        vm.runInContext(fileMenuBarCode, vm.createContext(context));
        FileMenuBar = context.module.exports;

        // Mock LevelEditor with all UI elements
        mockLevelEditor = {
            gridOverlay: { visible: true },
            minimap: { visible: true },
            draggablePanels: {
                panels: {
                    materials: { isVisible: () => true, toggleVisibility: sinon.stub() },
                    tools: { isVisible: () => true, toggleVisibility: sinon.stub() },
                    brush: { isVisible: () => true, toggleVisibility: sinon.stub() },
                    events: { isVisible: () => true, toggleVisibility: sinon.stub() },
                    properties: { isVisible: () => true, toggleVisibility: sinon.stub() }
                }
            },
            notifications: { visible: true },
            fileMenuBar: null, // Will be set after creation
            showGrid: true,
            showMinimap: true
        };

        menuBar = new FileMenuBar();
        menuBar.setLevelEditor(mockLevelEditor);
        mockLevelEditor.fileMenuBar = menuBar;
    });

    afterEach(function() {
        sinon.restore();
        delete global.g_canvasX;
        delete global.g_canvasY;
        delete global.window;
    });

    describe('View menu structure', function() {
        it('should have View menu in menuItems', function() {
            const viewMenu = menuBar.menuItems.find(m => m.label === 'View');
            expect(viewMenu).to.exist;
        });

        it('should have Grid Overlay toggle item', function() {
            const viewMenu = menuBar.menuItems.find(m => m.label === 'View');
            const gridItem = viewMenu.items.find(i => i.label === 'Grid Overlay');
            expect(gridItem).to.exist;
            expect(gridItem.checkable).to.be.true;
        });

        it('should have Minimap toggle item', function() {
            const viewMenu = menuBar.menuItems.find(m => m.label === 'View');
            const minimapItem = viewMenu.items.find(i => i.label === 'Minimap');
            expect(minimapItem).to.exist;
            expect(minimapItem.checkable).to.be.true;
        });

        it('should have Materials Panel toggle item', function() {
            const viewMenu = menuBar.menuItems.find(m => m.label === 'View');
            const materialsItem = viewMenu.items.find(i => i.label === 'Materials Panel');
            expect(materialsItem).to.exist;
            expect(materialsItem.checkable).to.be.true;
        });

        it('should have Tools Panel toggle item', function() {
            const viewMenu = menuBar.menuItems.find(m => m.label === 'View');
            const toolsItem = viewMenu.items.find(i => i.label === 'Tools Panel');
            expect(toolsItem).to.exist;
            expect(toolsItem.checkable).to.be.true;
        });

        it('should have Brush Panel toggle item', function() {
            const viewMenu = menuBar.menuItems.find(m => m.label === 'View');
            const brushItem = viewMenu.items.find(i => i.label === 'Brush Panel');
            expect(brushItem).to.exist;
            expect(brushItem.checkable).to.be.true;
        });

        it('should have Events Panel toggle item', function() {
            const viewMenu = menuBar.menuItems.find(m => m.label === 'View');
            const eventsItem = viewMenu.items.find(i => i.label === 'Events Panel');
            expect(eventsItem).to.exist;
            expect(eventsItem.checkable).to.be.true;
        });

        it('should have Properties Panel toggle item', function() {
            const viewMenu = menuBar.menuItems.find(m => m.label === 'View');
            const propertiesItem = viewMenu.items.find(i => i.label === 'Properties Panel');
            expect(propertiesItem).to.exist;
            expect(propertiesItem.checkable).to.be.true;
        });

        it('should have Notifications toggle item', function() {
            const viewMenu = menuBar.menuItems.find(m => m.label === 'View');
            const notificationsItem = viewMenu.items.find(i => i.label === 'Notifications');
            expect(notificationsItem).to.exist;
            expect(notificationsItem.checkable).to.be.true;
        });

        it('should NOT have Menu Bar toggle item', function() {
            const viewMenu = menuBar.menuItems.find(m => m.label === 'View');
            const menuBarItem = viewMenu.items.find(i => i.label === 'Menu Bar');
            expect(menuBarItem).to.not.exist;
        });
    });

    describe('View toggle state management', function() {
        it('should initialize all view items as checked (visible)', function() {
            const viewMenu = menuBar.menuItems.find(m => m.label === 'View');
            
            viewMenu.items.forEach(item => {
                if (item.checkable) {
                    expect(item.checked).to.be.true;
                }
            });
        });

        it('should toggle Grid Overlay visibility', function() {
            const viewMenu = menuBar.menuItems.find(m => m.label === 'View');
            const gridItem = viewMenu.items.find(i => i.label === 'Grid Overlay');
            
            // Toggle off
            gridItem.action();
            expect(gridItem.checked).to.be.false;
            expect(mockLevelEditor.showGrid).to.be.false;
            
            // Toggle on
            gridItem.action();
            expect(gridItem.checked).to.be.true;
            expect(mockLevelEditor.showGrid).to.be.true;
        });

        it('should toggle Minimap visibility', function() {
            const viewMenu = menuBar.menuItems.find(m => m.label === 'View');
            const minimapItem = viewMenu.items.find(i => i.label === 'Minimap');
            
            // Toggle off
            minimapItem.action();
            expect(minimapItem.checked).to.be.false;
            expect(mockLevelEditor.showMinimap).to.be.false;
            
            // Toggle on
            minimapItem.action();
            expect(minimapItem.checked).to.be.true;
            expect(mockLevelEditor.showMinimap).to.be.true;
        });

        it('should toggle Materials Panel visibility', function() {
            const viewMenu = menuBar.menuItems.find(m => m.label === 'View');
            const materialsItem = viewMenu.items.find(i => i.label === 'Materials Panel');
            
            // Toggle (should call panel.toggleVisibility)
            materialsItem.action();
            expect(mockLevelEditor.draggablePanels.panels.materials.toggleVisibility.calledOnce).to.be.true;
        });

        it('should toggle Tools Panel visibility', function() {
            const viewMenu = menuBar.menuItems.find(m => m.label === 'View');
            const toolsItem = viewMenu.items.find(i => i.label === 'Tools Panel');
            
            toolsItem.action();
            expect(mockLevelEditor.draggablePanels.panels.tools.toggleVisibility.calledOnce).to.be.true;
        });

        it('should toggle Brush Panel visibility', function() {
            const viewMenu = menuBar.menuItems.find(m => m.label === 'View');
            const brushItem = viewMenu.items.find(i => i.label === 'Brush Panel');
            
            brushItem.action();
            expect(mockLevelEditor.draggablePanels.panels.brush.toggleVisibility.calledOnce).to.be.true;
        });

        it('should toggle Events Panel visibility', function() {
            const viewMenu = menuBar.menuItems.find(m => m.label === 'View');
            const eventsItem = viewMenu.items.find(i => i.label === 'Events Panel');
            
            eventsItem.action();
            expect(mockLevelEditor.draggablePanels.panels.events.toggleVisibility.calledOnce).to.be.true;
        });

        it('should toggle Properties Panel visibility', function() {
            const viewMenu = menuBar.menuItems.find(m => m.label === 'View');
            const propertiesItem = viewMenu.items.find(i => i.label === 'Properties Panel');
            
            propertiesItem.action();
            expect(mockLevelEditor.draggablePanels.panels.properties.toggleVisibility.calledOnce).to.be.true;
        });

        it('should toggle Notifications visibility', function() {
            const viewMenu = menuBar.menuItems.find(m => m.label === 'View');
            const notificationsItem = viewMenu.items.find(i => i.label === 'Notifications');
            
            // Toggle off
            notificationsItem.action();
            expect(notificationsItem.checked).to.be.false;
            expect(mockLevelEditor.notifications.visible).to.be.false;
            
            // Toggle on
            notificationsItem.action();
            expect(notificationsItem.checked).to.be.true;
            expect(mockLevelEditor.notifications.visible).to.be.true;
        });
    });

    describe('View state persistence', function() {
        it('should maintain state when menu is opened and closed', function() {
            const viewMenu = menuBar.menuItems.find(m => m.label === 'View');
            const gridItem = viewMenu.items.find(i => i.label === 'Grid Overlay');
            
            // Toggle off
            gridItem.action();
            expect(gridItem.checked).to.be.false;
            
            // Simulate menu close/open
            menuBar.openMenuName = 'View';
            menuBar.openMenuName = null;
            menuBar.openMenuName = 'View';
            
            // State should persist
            expect(gridItem.checked).to.be.false;
        });
    });
});
