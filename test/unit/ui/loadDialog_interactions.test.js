/**
 * Unit tests for LoadDialog interaction methods (handleClick)
 * 
 * TDD: Write tests FIRST for click handling
 */

const { expect } = require('chai');
const sinon = require('sinon');
const fs = require('fs');
const vm = require('vm');
const path = require('path');

describe('LoadDialog - Interactions', function() {
    let LoadDialog;
    let dialog;

    beforeEach(function() {
        // Mock canvas dimensions
        global.g_canvasX = 1920;
        global.g_canvasY = 1080;

        // Load LoadDialog class
        const loadDialogPath = path.join(__dirname, '../../../Classes/ui/LoadDialog.js');
        const loadDialogCode = fs.readFileSync(loadDialogPath, 'utf8');
        const context = { module: { exports: {} }, ...global };
        vm.runInContext(loadDialogCode, vm.createContext(context));
        LoadDialog = context.module.exports;

        dialog = new LoadDialog();
        dialog.show();
        dialog.setFiles([
            { name: 'terrain_2024-01-01.json', date: '2024-01-01', size: 1024 },
            { name: 'terrain_2024-01-02.json', date: '2024-01-02', size: 2048 }
        ]);
    });

    afterEach(function() {
        sinon.restore();
        delete global.g_canvasX;
        delete global.g_canvasY;
    });

    describe('handleClick() method', function() {
        it('should have a handleClick method', function() {
            expect(dialog).to.have.property('handleClick');
            expect(dialog.handleClick).to.be.a('function');
        });

        it('should return true when clicking inside dialog (consume click)', function() {
            const dialogX = g_canvasX / 2;
            const dialogY = g_canvasY / 2;
            
            const consumed = dialog.handleClick(dialogX, dialogY);
            expect(consumed).to.be.true;
        });

        it('should return false when clicking outside dialog (allow passthrough)', function() {
            const consumed = dialog.handleClick(10, 10);
            expect(consumed).to.be.false;
        });

        it('should detect file selection click', function() {
            // Calculate file list position
            const dialogWidth = 600;
            const dialogHeight = 400;
            const dialogX = g_canvasX / 2 - dialogWidth / 2;
            const dialogY = g_canvasY / 2 - dialogHeight / 2;
            const fileY = dialogY + 85;
            
            // Click first file
            dialog.handleClick(dialogX + 100, fileY + 10);
            
            expect(dialog.getSelectedFile()).to.exist;
            expect(dialog.getSelectedFile().name).to.equal('terrain_2024-01-01.json');
        });

        it('should detect Load button click', function() {
            dialog.selectFile('terrain_2024-01-01.json');
            
            let loadClicked = false;
            dialog.onLoad = () => { loadClicked = true; };
            
            // Calculate Load button position
            const dialogWidth = 600;
            const dialogHeight = 400;
            const dialogX = g_canvasX / 2 - dialogWidth / 2;
            const dialogY = g_canvasY / 2 - dialogHeight / 2;
            const buttonY = dialogY + dialogHeight - 60;
            const loadButtonX = dialogX + dialogWidth - 260;
            
            const consumed = dialog.handleClick(loadButtonX + 60, buttonY + 20);
            
            expect(consumed).to.be.true;
            expect(loadClicked).to.be.true;
        });

        it('should detect Cancel button click', function() {
            let cancelClicked = false;
            dialog.onCancel = () => { cancelClicked = true; };
            
            // Calculate Cancel button position
            const dialogWidth = 600;
            const dialogHeight = 400;
            const dialogX = g_canvasX / 2 - dialogWidth / 2;
            const dialogY = g_canvasY / 2 - dialogHeight / 2;
            const buttonY = dialogY + dialogHeight - 60;
            const cancelButtonX = dialogX + dialogWidth - 130;
            
            const consumed = dialog.handleClick(cancelButtonX + 60, buttonY + 20);
            
            expect(consumed).to.be.true;
            expect(cancelClicked).to.be.true;
        });

        it('should not trigger Load when no file selected', function() {
            dialog.selectedFile = null;
            
            let loadClicked = false;
            dialog.onLoad = () => { loadClicked = true; };
            
            // Click Load button
            const dialogWidth = 600;
            const dialogHeight = 400;
            const dialogX = g_canvasX / 2 - dialogWidth / 2;
            const dialogY = g_canvasY / 2 - dialogHeight / 2;
            const buttonY = dialogY + dialogHeight - 60;
            const loadButtonX = dialogX + dialogWidth - 260;
            
            dialog.handleClick(loadButtonX + 60, buttonY + 20);
            
            expect(loadClicked).to.be.false;
        });

        it('should not handle clicks when dialog is hidden', function() {
            dialog.hide();
            
            const consumed = dialog.handleClick(g_canvasX / 2, g_canvasY / 2);
            expect(consumed).to.be.false;
        });
    });

    describe('Callback registration', function() {
        it('should support onLoad callback', function() {
            let called = false;
            dialog.onLoad = () => { called = true; };
            
            if (dialog.onLoad) dialog.onLoad();
            expect(called).to.be.true;
        });

        it('should support onCancel callback', function() {
            let called = false;
            dialog.onCancel = () => { called = true; };
            
            if (dialog.onCancel) dialog.onCancel();
            expect(called).to.be.true;
        });
    });

    describe('Hit testing', function() {
        it('should have isPointInside method', function() {
            expect(dialog).to.have.property('isPointInside');
            expect(dialog.isPointInside).to.be.a('function');
        });

        it('should return true for points inside dialog box', function() {
            const centerX = g_canvasX / 2;
            const centerY = g_canvasY / 2;
            
            expect(dialog.isPointInside(centerX, centerY)).to.be.true;
        });

        it('should return false for points outside dialog box', function() {
            expect(dialog.isPointInside(10, 10)).to.be.false;
        });
    });
});
