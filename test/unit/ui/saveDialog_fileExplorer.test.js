/**
 * Unit tests for SaveDialog file explorer integration
 * 
 * TDD: Write tests FIRST for native file dialog integration
 */

const { expect } = require('chai');
const sinon = require('sinon');
const fs = require('fs');
const vm = require('vm');
const path = require('path');

describe('SaveDialog - File Explorer Integration', function() {
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
    });

    afterEach(function() {
        sinon.restore();
        delete global.g_canvasX;
        delete global.g_canvasY;
    });

    describe('openNativeFileDialog() method', function() {
        it('should have openNativeFileDialog method', function() {
            expect(dialog).to.have.property('openNativeFileDialog');
            expect(dialog.openNativeFileDialog).to.be.a('function');
        });

        it('should create hidden file input element', function() {
            // Mock document
            global.document = {
                createElement: sinon.stub().returns({
                    setAttribute: sinon.stub(),
                    click: sinon.stub(),
                    addEventListener: sinon.stub()
                }),
                body: {
                    appendChild: sinon.stub(),
                    removeChild: sinon.stub()
                }
            };

            dialog.openNativeFileDialog();

            expect(global.document.createElement.calledWith('input')).to.be.true;

            delete global.document;
        });

        it('should set input type to file', function() {
            const mockInput = {
                setAttribute: sinon.stub(),
                click: sinon.stub(),
                addEventListener: sinon.stub()
            };

            global.document = {
                createElement: sinon.stub().returns(mockInput),
                body: {
                    appendChild: sinon.stub(),
                    removeChild: sinon.stub()
                }
            };

            dialog.openNativeFileDialog();

            expect(mockInput.setAttribute.calledWith('type', 'file')).to.be.true;

            delete global.document;
        });

        it('should set accept attribute for JSON files', function() {
            const mockInput = {
                setAttribute: sinon.stub(),
                click: sinon.stub(),
                addEventListener: sinon.stub()
            };

            global.document = {
                createElement: sinon.stub().returns(mockInput),
                body: {
                    appendChild: sinon.stub(),
                    removeChild: sinon.stub()
                }
            };

            dialog.openNativeFileDialog();

            expect(mockInput.setAttribute.calledWith('accept', '.json')).to.be.true;

            delete global.document;
        });

        it('should trigger click on input element', function() {
            const mockInput = {
                setAttribute: sinon.stub(),
                click: sinon.stub(),
                addEventListener: sinon.stub()
            };

            global.document = {
                createElement: sinon.stub().returns(mockInput),
                body: {
                    appendChild: sinon.stub(),
                    removeChild: sinon.stub()
                }
            };

            dialog.openNativeFileDialog();

            expect(mockInput.click.calledOnce).to.be.true;

            delete global.document;
        });
    });

    describe('saveWithNativeDialog() method', function() {
        it('should have saveWithNativeDialog method', function() {
            expect(dialog).to.have.property('saveWithNativeDialog');
            expect(dialog.saveWithNativeDialog).to.be.a('function');
        });

        it('should create download link for file', function() {
            const mockAnchor = {
                setAttribute: sinon.stub(),
                click: sinon.stub(),
                style: {}
            };

            global.document = {
                createElement: sinon.stub().returns(mockAnchor),
                body: {
                    appendChild: sinon.stub(),
                    removeChild: sinon.stub()
                }
            };

            global.URL = {
                createObjectURL: sinon.stub().returns('blob:mock-url'),
                revokeObjectURL: sinon.stub()
            };

            global.Blob = class MockBlob {
                constructor(data, options) {
                    this.data = data;
                    this.options = options;
                }
            };

            const data = { test: 'data' };
            dialog.saveWithNativeDialog(data, 'test.json');

            expect(global.document.createElement.calledWith('a')).to.be.true;
            expect(mockAnchor.click.calledOnce).to.be.true;

            delete global.document;
            delete global.URL;
            delete global.Blob;
        });

        it('should use provided filename', function() {
            const mockAnchor = {
                setAttribute: sinon.stub(),
                click: sinon.stub(),
                style: {}
            };

            global.document = {
                createElement: sinon.stub().returns(mockAnchor),
                body: {
                    appendChild: sinon.stub(),
                    removeChild: sinon.stub()
                }
            };

            global.URL = {
                createObjectURL: sinon.stub().returns('blob:mock-url'),
                revokeObjectURL: sinon.stub()
            };

            global.Blob = class MockBlob {};

            dialog.saveWithNativeDialog({ test: 'data' }, 'my_terrain.json');

            expect(mockAnchor.setAttribute.calledWith('download', 'my_terrain.json')).to.be.true;

            delete global.document;
            delete global.URL;
            delete global.Blob;
        });

        it('should create blob with JSON data', function() {
            const mockAnchor = {
                setAttribute: sinon.stub(),
                click: sinon.stub(),
                style: {}
            };

            global.document = {
                createElement: sinon.stub().returns(mockAnchor),
                body: {
                    appendChild: sinon.stub(),
                    removeChild: sinon.stub()
                }
            };

            global.URL = {
                createObjectURL: sinon.stub().returns('blob:mock-url'),
                revokeObjectURL: sinon.stub()
            };

            const blobData = [];
            global.Blob = class MockBlob {
                constructor(data, options) {
                    blobData.push({ data, options });
                }
            };

            const testData = { terrain: 'test' };
            dialog.saveWithNativeDialog(testData, 'test.json');

            expect(blobData.length).to.equal(1);
            expect(blobData[0].options.type).to.equal('application/json');

            delete global.document;
            delete global.URL;
            delete global.Blob;
        });
    });

    describe('useNativeDialogs property', function() {
        it('should have useNativeDialogs property', function() {
            expect(dialog).to.have.property('useNativeDialogs');
        });

        it('should default to false for backward compatibility', function() {
            expect(dialog.useNativeDialogs).to.be.false;
        });

        it('should allow setting useNativeDialogs to true', function() {
            dialog.useNativeDialogs = true;
            expect(dialog.useNativeDialogs).to.be.true;
        });
    });
});
