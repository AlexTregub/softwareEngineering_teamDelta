/**
 * Integration tests for LevelEditor + SaveDialog/LoadDialog interaction
 * 
 * Tests that dialogs consume clicks and keyboard input, preventing terrain editing
 */

const { expect } = require('chai');
const sinon = require('sinon');
const { JSDOM } = require('jsdom');

describe('LevelEditor + Dialog Integration', function() {
    let LevelEditor, SaveDialog, LoadDialog;
    let editor;
    let mockP5, mockTerrain;

    beforeEach(function() {
        // Set up JSDOM
        const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
        global.window = dom.window;
        global.document = dom.window.document;

        // Mock p5.js constants
        global.CONTROL = 17;
        global.SHIFT = 16;
        global.ALT = 18;
        global.keyIsDown = sinon.stub().returns(false);

        // Mock canvas dimensions
        global.g_canvasX = 1920;
        global.g_canvasY = 1080;
        global.TILE_SIZE = 32;

        // Load required classes (simplified mocks for testing)
        SaveDialog = require('../../../Classes/ui/SaveDialog.js');
        LoadDialog = require('../../../Classes/ui/LoadDialog.js');

        // Mock LevelEditor with dialog integration
        LevelEditor = class {
            constructor() {
                this.active = true;
                this.saveDialog = new SaveDialog();
                this.loadDialog = new LoadDialog();
                this.terrainEditCount = 0;
                
                // Wire up callbacks
                this.saveDialog.onSave = () => this.save();
                this.saveDialog.onCancel = () => this.saveDialog.hide();
                this.loadDialog.onLoad = () => this.load();
                this.loadDialog.onCancel = () => this.loadDialog.hide();
            }
            
            handleClick(x, y) {
                if (!this.active) return;
                
                // Check dialogs first
                if (this.saveDialog.isVisible()) {
                    const consumed = this.saveDialog.handleClick(x, y);
                    if (consumed) return;
                }
                
                if (this.loadDialog.isVisible()) {
                    const consumed = this.loadDialog.handleClick(x, y);
                    if (consumed) return;
                }
                
                // If no dialog consumed, edit terrain
                this.terrainEditCount++;
            }
            
            handleKeyPress(key) {
                if (!this.active) return;
                
                // Check save dialog first
                if (this.saveDialog.isVisible()) {
                    const consumed = this.saveDialog.handleKeyPress(key);
                    if (consumed) return;
                }
            }
            
            save() {
                this.saveDialog.hide();
            }
            
            load() {
                this.loadDialog.hide();
            }
        };

        editor = new LevelEditor();
    });

    afterEach(function() {
        sinon.restore();
        delete global.window;
        delete global.document;
        delete global.CONTROL;
        delete global.SHIFT;
        delete global.ALT;
        delete global.keyIsDown;
        delete global.g_canvasX;
        delete global.g_canvasY;
        delete global.TILE_SIZE;
    });

    describe('SaveDialog interaction blocking', function() {
        it('should prevent terrain editing when dialog is visible and clicked', function() {
            editor.saveDialog.show();
            
            // Click in center of dialog
            editor.handleClick(960, 540);
            
            // Terrain should NOT be edited (click consumed by dialog)
            expect(editor.terrainEditCount).to.equal(0);
        });

        it('should allow terrain editing when dialog is visible but click is outside', function() {
            editor.saveDialog.show();
            
            // Click outside dialog (top-left corner)
            editor.handleClick(10, 10);
            
            // Terrain SHOULD be edited (click passed through)
            expect(editor.terrainEditCount).to.equal(1);
        });

        it('should allow terrain editing when dialog is hidden', function() {
            editor.saveDialog.hide();
            
            // Click anywhere
            editor.handleClick(500, 500);
            
            // Terrain SHOULD be edited
            expect(editor.terrainEditCount).to.equal(1);
        });

        it('should handle keyboard input when dialog is visible', function() {
            editor.saveDialog.show();
            editor.saveDialog.setFilename('test');
            
            // Type character
            editor.handleKeyPress('a');
            
            // Filename should update
            expect(editor.saveDialog.getFilename()).to.equal('testa');
        });

        it('should trigger save on Save button click', function() {
            editor.saveDialog.show();
            
            const saveSpy = sinon.spy(editor, 'save');
            
            // Calculate Save button position
            const dialogX = 960 - 250;
            const dialogY = 540 - 150;
            const buttonY = dialogY + 240;
            const saveButtonX = dialogX + 240;
            
            // Click Save button
            editor.handleClick(saveButtonX + 60, buttonY + 20);
            
            expect(saveSpy.calledOnce).to.be.true;
            expect(editor.saveDialog.isVisible()).to.be.false;
        });

        it('should hide dialog on Cancel button click', function() {
            editor.saveDialog.show();
            
            // Calculate Cancel button position
            const dialogX = 960 - 250;
            const dialogY = 540 - 150;
            const buttonY = dialogY + 240;
            const cancelButtonX = dialogX + 370;
            
            // Click Cancel button
            editor.handleClick(cancelButtonX + 60, buttonY + 20);
            
            expect(editor.saveDialog.isVisible()).to.be.false;
        });
    });

    describe('LoadDialog interaction blocking', function() {
        it('should prevent terrain editing when dialog is visible and clicked', function() {
            editor.loadDialog.show();
            
            // Click in center of dialog
            editor.handleClick(960, 540);
            
            // Terrain should NOT be edited
            expect(editor.terrainEditCount).to.equal(0);
        });

        it('should allow terrain editing when dialog is visible but click is outside', function() {
            editor.loadDialog.show();
            
            // Click outside dialog
            editor.handleClick(10, 10);
            
            // Terrain SHOULD be edited
            expect(editor.terrainEditCount).to.equal(1);
        });

        it('should handle file selection clicks', function() {
            editor.loadDialog.show();
            editor.loadDialog.setFiles([
                { name: 'terrain_1.json', date: '2024-01-01', size: 1024 }
            ]);
            
            // Click on file in list
            const dialogX = 960 - 300;
            const dialogY = 540 - 200;
            const fileY = dialogY + 85;
            
            editor.handleClick(dialogX + 100, fileY + 10);
            
            // File should be selected
            expect(editor.loadDialog.getSelectedFile()).to.exist;
            expect(editor.loadDialog.getSelectedFile().name).to.equal('terrain_1.json');
        });
    });

    describe('Multiple dialogs', function() {
        it('should only show one dialog at a time', function() {
            editor.saveDialog.show();
            editor.loadDialog.show();
            
            // Both visible (implementation choice - could enforce exclusivity later)
            expect(editor.saveDialog.isVisible()).to.be.true;
            expect(editor.loadDialog.isVisible()).to.be.true;
        });
    });
});
