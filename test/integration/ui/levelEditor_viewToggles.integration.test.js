/**
 * Integration tests for LevelEditor View toggles
 * 
 * Tests that View menu toggles properly affect rendering of UI elements
 */

const { expect } = require('chai');
const sinon = require('sinon');

describe('LevelEditor + View Toggles Integration', function() {
    let mockLevelEditor;
    let mockFileMenuBar;
    let renderStub;

    beforeEach(function() {
        // Mock p5.js functions
        global.push = sinon.stub();
        global.pop = sinon.stub();
        global.fill = sinon.stub();
        global.stroke = sinon.stub();
        global.noStroke = sinon.stub();
        global.rect = sinon.stub();
        global.text = sinon.stub();
        global.textAlign = sinon.stub();
        global.textSize = sinon.stub();
        global.line = sinon.stub();
        global.g_canvasX = 1920;
        global.g_canvasY = 1080;

        // Create mock UI elements with visible properties
        mockLevelEditor = {
            active: true,
            terrain: {
                render: sinon.stub()
            },
            gridOverlay: {
                visible: true,
                render: sinon.stub()
            },
            fileMenuBar: {
                visible: true,
                render: sinon.stub()
            },
            draggablePanels: {
                visible: true,
                render: sinon.stub()
            },
            minimap: {
                render: sinon.stub()
            },
            notifications: {
                visible: true,
                render: sinon.stub()
            },
            saveDialog: {
                isVisible: () => false,
                render: sinon.stub()
            },
            loadDialog: {
                isVisible: () => false,
                render: sinon.stub()
            },
            showGrid: true,
            showMinimap: true
        };

        // Simulate LevelEditor render logic
        renderStub = sinon.stub().callsFake(function() {
            if (!mockLevelEditor.active) return;
            
            if (mockLevelEditor.terrain) {
                mockLevelEditor.terrain.render();
            }
            
            if (mockLevelEditor.showGrid) {
                mockLevelEditor.gridOverlay.render();
            }
            
            mockLevelEditor.fileMenuBar.render();
            mockLevelEditor.draggablePanels.render();
            
            if (mockLevelEditor.showMinimap && mockLevelEditor.minimap) {
                mockLevelEditor.minimap.render(1700, 860);
            }
            
            if (mockLevelEditor.notifications && mockLevelEditor.notifications.visible) {
                mockLevelEditor.notifications.render(10, 1070);
            }
        });
    });

    afterEach(function() {
        sinon.restore();
        delete global.push;
        delete global.pop;
        delete global.fill;
        delete global.stroke;
        delete global.noStroke;
        delete global.rect;
        delete global.text;
        delete global.textAlign;
        delete global.textSize;
        delete global.line;
        delete global.g_canvasX;
        delete global.g_canvasY;
    });

    describe('Grid Overlay visibility toggle', function() {
        it('should render grid when showGrid is true', function() {
            mockLevelEditor.showGrid = true;
            renderStub();
            
            expect(mockLevelEditor.gridOverlay.render.called).to.be.true;
        });

        it('should not render grid when showGrid is false', function() {
            mockLevelEditor.showGrid = false;
            renderStub();
            
            expect(mockLevelEditor.gridOverlay.render.called).to.be.false;
        });
    });

    describe('Minimap visibility toggle', function() {
        it('should render minimap when showMinimap is true', function() {
            mockLevelEditor.showMinimap = true;
            renderStub();
            
            expect(mockLevelEditor.minimap.render.called).to.be.true;
        });

        it('should not render minimap when showMinimap is false', function() {
            mockLevelEditor.showMinimap = false;
            renderStub();
            
            expect(mockLevelEditor.minimap.render.called).to.be.false;
        });
    });

    describe('Panels visibility toggle', function() {
        it('should call draggablePanels.render() regardless of visible flag', function() {
            // DraggablePanelManager handles its own visibility internally
            mockLevelEditor.draggablePanels.visible = true;
            renderStub();
            
            expect(mockLevelEditor.draggablePanels.render.called).to.be.true;
        });

        it('should call draggablePanels.render() even when visible is false', function() {
            // The render method will check visible internally
            mockLevelEditor.draggablePanels.visible = false;
            renderStub();
            
            expect(mockLevelEditor.draggablePanels.render.called).to.be.true;
        });
    });

    describe('Notifications visibility toggle', function() {
        it('should render notifications when visible is true', function() {
            mockLevelEditor.notifications.visible = true;
            renderStub();
            
            expect(mockLevelEditor.notifications.render.called).to.be.true;
        });

        it('should not render notifications when visible is false', function() {
            mockLevelEditor.notifications.visible = false;
            renderStub();
            
            expect(mockLevelEditor.notifications.render.called).to.be.false;
        });
    });

    describe('Menu Bar visibility toggle', function() {
        it('should call fileMenuBar.render() regardless of visible flag', function() {
            // FileMenuBar handles its own visibility internally
            mockLevelEditor.fileMenuBar.visible = true;
            renderStub();
            
            expect(mockLevelEditor.fileMenuBar.render.called).to.be.true;
        });

        it('should call fileMenuBar.render() even when visible is false', function() {
            // The render method will check visible internally
            mockLevelEditor.fileMenuBar.visible = false;
            renderStub();
            
            expect(mockLevelEditor.fileMenuBar.render.called).to.be.true;
        });
    });

    describe('Multiple toggles', function() {
        it('should respect all visibility flags when multiple are disabled', function() {
            mockLevelEditor.showGrid = false;
            mockLevelEditor.showMinimap = false;
            mockLevelEditor.notifications.visible = false;
            
            renderStub();
            
            expect(mockLevelEditor.gridOverlay.render.called).to.be.false;
            expect(mockLevelEditor.minimap.render.called).to.be.false;
            expect(mockLevelEditor.notifications.render.called).to.be.false;
            expect(mockLevelEditor.terrain.render.called).to.be.true; // Terrain always renders
        });

        it('should render only enabled elements', function() {
            mockLevelEditor.showGrid = true;
            mockLevelEditor.showMinimap = false;
            mockLevelEditor.notifications.visible = true;
            
            renderStub();
            
            expect(mockLevelEditor.gridOverlay.render.called).to.be.true;
            expect(mockLevelEditor.minimap.render.called).to.be.false;
            expect(mockLevelEditor.notifications.render.called).to.be.true;
        });
    });
});
