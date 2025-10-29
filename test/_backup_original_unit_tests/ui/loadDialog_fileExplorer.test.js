/**
 * Unit tests for LoadDialog file explorer integration
 * 
 * TDD: Write tests FIRST for native file dialog integration
 */

const { expect } = require('chai');
const sinon = require('sinon');
const fs = require('fs');
const vm = require('vm');
const path = require('path');

describe('LoadDialog - File Explorer Integration', function() {
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

            expect(global.document.createElement.calledWith('input')).to.be.true;

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

        it('should register change event listener', function() {
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

            expect(mockInput.addEventListener.calledWith('change', sinon.match.func)).to.be.true;

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

    describe('loadFromNativeDialog() method', function() {
        it('should have loadFromNativeDialog method', function() {
            expect(dialog).to.have.property('loadFromNativeDialog');
            expect(dialog.loadFromNativeDialog).to.be.a('function');
        });

        it('should call onLoad callback when file is selected', function(done) {
            dialog.onLoad = (data) => {
                expect(data).to.exist;
                done();
            };

            // Mock Blob for creating test file
            global.Blob = class {
                constructor(content, options) {
                    this.content = content;
                    this.type = options?.type || '';
                }
            };

            const mockFile = new Blob(['{"test": "data"}'], { type: 'application/json' });
            mockFile.name = 'test.json';

            global.FileReader = class {
                readAsText(file) {
                    setTimeout(() => {
                        this.result = '{"test": "data"}';
                        this.onload({ target: this });
                    }, 10);
                }
            };

            dialog.loadFromNativeDialog(mockFile);

            delete global.FileReader;
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
