/**
 * Unit tests for SaveDialog interaction methods (handleClick, handleInput)
 * 
 * TDD: Write tests FIRST for click handling and text input
 */

const { expect } = require('chai');
const sinon = require('sinon');
const fs = require('fs');
const vm = require('vm');
const path = require('path');

describe('SaveDialog - Interactions', function() {
    let SaveDialog;
    let dialog;

    beforeEach(function() {
        // Mock canvas dimensions
        global.g_canvasX = 1920;
        global.g_canvasY = 1080;

        // Load SaveDialog class
        const saveDialogPath = path.join(__dirname, '../../../Classes/ui/SaveDialog.js');
        const saveDialogCode = fs.readFileSync(saveDialogPath, 'utf8');
        const context = { module: { exports: {} }, ...global };
        vm.runInContext(saveDialogCode, vm.createContext(context));
        SaveDialog = context.module.exports;

        dialog = new SaveDialog();
        dialog.show();
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
            // Click in center of dialog
            const dialogX = g_canvasX / 2;
            const dialogY = g_canvasY / 2;
            
            const consumed = dialog.handleClick(dialogX, dialogY);
            expect(consumed).to.be.true;
        });

        it('should return false when clicking outside dialog (allow passthrough)', function() {
            // Click far outside dialog
            const consumed = dialog.handleClick(10, 10);
            expect(consumed).to.be.false;
        });

        it('should detect Save button click', function() {
            let saveClicked = false;
            dialog.onSave = () => { saveClicked = true; };
            
            // Calculate Save button position (matches render() implementation)
            const dialogWidth = 500;
            const dialogHeight = 300;
            const dialogX = g_canvasX / 2 - dialogWidth / 2;
            const dialogY = g_canvasY / 2 - dialogHeight / 2;
            const buttonY = dialogY + dialogHeight - 60;
            const saveButtonX = dialogX + dialogWidth - 260;
            
            // Click center of Save button
            const consumed = dialog.handleClick(saveButtonX + 60, buttonY + 20);
            
            expect(consumed).to.be.true;
            expect(saveClicked).to.be.true;
        });

        it('should detect Cancel button click', function() {
            let cancelClicked = false;
            dialog.onCancel = () => { cancelClicked = true; };
            
            // Calculate Cancel button position
            const dialogWidth = 500;
            const dialogHeight = 300;
            const dialogX = g_canvasX / 2 - dialogWidth / 2;
            const dialogY = g_canvasY / 2 - dialogHeight / 2;
            const buttonY = dialogY + dialogHeight - 60;
            const cancelButtonX = dialogX + dialogWidth - 130;
            
            // Click center of Cancel button
            const consumed = dialog.handleClick(cancelButtonX + 60, buttonY + 20);
            
            expect(consumed).to.be.true;
            expect(cancelClicked).to.be.true;
        });

        it('should not handle clicks when dialog is hidden', function() {
            dialog.hide();
            
            const consumed = dialog.handleClick(g_canvasX / 2, g_canvasY / 2);
            expect(consumed).to.be.false;
        });
    });

    describe('handleKeyPress() method', function() {
        it('should have a handleKeyPress method', function() {
            expect(dialog).to.have.property('handleKeyPress');
            expect(dialog.handleKeyPress).to.be.a('function');
        });

        it('should add character to filename on alphanumeric key press', function() {
            dialog.setFilename('test');
            dialog.handleKeyPress('a');
            
            expect(dialog.getFilename()).to.equal('testa');
        });

        it('should handle backspace to delete character', function() {
            dialog.setFilename('test');
            dialog.handleKeyPress('Backspace');
            
            expect(dialog.getFilename()).to.equal('tes');
        });

        it('should handle Enter key to trigger save', function() {
            let saveTriggered = false;
            dialog.onSave = () => { saveTriggered = true; };
            
            dialog.handleKeyPress('Enter');
            
            expect(saveTriggered).to.be.true;
        });

        it('should handle Escape key to cancel', function() {
            let cancelTriggered = false;
            dialog.onCancel = () => { cancelTriggered = true; };
            
            dialog.handleKeyPress('Escape');
            
            expect(cancelTriggered).to.be.true;
        });

        it('should not handle keys when dialog is hidden', function() {
            dialog.setFilename('test');
            dialog.hide();
            
            dialog.handleKeyPress('a');
            
            expect(dialog.getFilename()).to.equal('test'); // Unchanged
        });
    });

    describe('Callback registration', function() {
        it('should support onSave callback', function() {
            let called = false;
            dialog.onSave = () => { called = true; };
            
            if (dialog.onSave) dialog.onSave();
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
