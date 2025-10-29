/**
 * Unit tests for SaveDialog render method
 * 
 * TDD: Write tests FIRST before implementing render()
 */

const { expect } = require('chai');
const sinon = require('sinon');
const fs = require('fs');
const vm = require('vm');
const path = require('path');

describe('SaveDialog - render() method', function() {
    let SaveDialog;
    let dialog;
    let mockP5;

    beforeEach(function() {
        // Mock p5.js drawing functions
        mockP5 = {
            push: sinon.stub(),
            pop: sinon.stub(),
            fill: sinon.stub(),
            stroke: sinon.stub(),
            noStroke: sinon.stub(),
            rect: sinon.stub(),
            text: sinon.stub(),
            textAlign: sinon.stub(),
            textSize: sinon.stub(),
            CENTER: 'center',
            LEFT: 'left',
            RIGHT: 'right',
            TOP: 'top',
            BOTTOM: 'bottom'
        };

        // Set up global context with p5 functions
        global.push = mockP5.push;
        global.pop = mockP5.pop;
        global.fill = mockP5.fill;
        global.stroke = mockP5.stroke;
        global.noStroke = mockP5.noStroke;
        global.rect = mockP5.rect;
        global.text = mockP5.text;
        global.textAlign = mockP5.textAlign;
        global.textSize = mockP5.textSize;
        global.CENTER = mockP5.CENTER;
        global.LEFT = mockP5.LEFT;
        global.RIGHT = mockP5.RIGHT;
        global.TOP = mockP5.TOP;
        global.BOTTOM = mockP5.BOTTOM;

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
        delete global.CENTER;
        delete global.LEFT;
        delete global.RIGHT;
        delete global.TOP;
        delete global.BOTTOM;
        delete global.g_canvasX;
        delete global.g_canvasY;
    });

    describe('render() existence', function() {
        it('should have a render method', function() {
            expect(dialog).to.have.property('render');
            expect(dialog.render).to.be.a('function');
        });
    });

    describe('render() when not visible', function() {
        it('should not render anything when dialog is not visible', function() {
            dialog.hide();
            dialog.render();
            
            // Should not call any drawing functions
            expect(mockP5.push.called).to.be.false;
            expect(mockP5.rect.called).to.be.false;
        });
    });

    describe('render() when visible', function() {
        beforeEach(function() {
            dialog.show();
        });

        it('should call push/pop to save canvas state', function() {
            dialog.render();
            
            expect(mockP5.push.calledOnce).to.be.true;
            expect(mockP5.pop.calledOnce).to.be.true;
        });

        it('should draw background overlay', function() {
            dialog.render();
            
            // Should draw semi-transparent overlay
            expect(mockP5.fill.called).to.be.true;
            expect(mockP5.rect.called).to.be.true;
        });

        it('should draw dialog box', function() {
            dialog.render();
            
            // Should draw multiple rectangles (overlay + dialog box)
            expect(mockP5.rect.callCount).to.be.at.least(2);
        });

        it('should render title text', function() {
            dialog.render();
            
            // Should render text (title + labels)
            expect(mockP5.text.called).to.be.true;
        });

        it('should set text alignment', function() {
            dialog.render();
            
            expect(mockP5.textAlign.called).to.be.true;
        });

        it('should set text size', function() {
            dialog.render();
            
            expect(mockP5.textSize.called).to.be.true;
        });
    });

    describe('render() content', function() {
        beforeEach(function() {
            dialog.show();
            dialog.setFilename('test_terrain');
        });

        it('should display current filename', function() {
            dialog.render();
            
            // Check if text was called with filename
            const textCalls = mockP5.text.getCalls();
            const hasFilename = textCalls.some(call => 
                call.args.some(arg => typeof arg === 'string' && arg.includes('test_terrain'))
            );
            expect(hasFilename).to.be.true;
        });

        it('should display save button', function() {
            dialog.render();
            
            // Check if text was called with "Save" or similar
            const textCalls = mockP5.text.getCalls();
            const hasSaveButton = textCalls.some(call => 
                call.args.some(arg => typeof arg === 'string' && /save/i.test(arg))
            );
            expect(hasSaveButton).to.be.true;
        });

        it('should display cancel button', function() {
            dialog.render();
            
            // Check if text was called with "Cancel" or similar
            const textCalls = mockP5.text.getCalls();
            const hasCancelButton = textCalls.some(call => 
                call.args.some(arg => typeof arg === 'string' && /cancel/i.test(arg))
            );
            expect(hasCancelButton).to.be.true;
        });
    });

    describe('render() positioning', function() {
        it('should center dialog on screen', function() {
            dialog.show();
            dialog.render();
            
            // Dialog should be drawn near center of canvas
            const rectCalls = mockP5.rect.getCalls();
            
            // Find the dialog box (overlay is fullscreen, dialog box is smaller)
            const dialogBoxCalls = rectCalls.filter(call => {
                const [x, y, w, h] = call.args;
                // Dialog box should have specific dimensions (500x300 for SaveDialog)
                return w === 500 && h === 300;
            });
            
            expect(dialogBoxCalls.length).to.be.at.least(1);
            const [x, y, w, h] = dialogBoxCalls[0].args;
            
            // Dialog should be centered: x = (canvasWidth - dialogWidth) / 2
            const expectedX = (g_canvasX - w) / 2;
            const expectedY = (g_canvasY - h) / 2;
            
            expect(x).to.equal(expectedX);
            expect(y).to.equal(expectedY);
        });
    });
});
