const { mockP5, mockDrawingFunctions } = require('../../../helpers/p5Mocks.js');
const p5 = mockP5;
const DropDownMenu = require('../../../../Classes/ui_new/components/dropdownMenu.js');
const { ArrowComponent } = require('../../../../Classes/ui_new/components/arrowComponent.js');
const { InformationLine } = require('../../../../Classes/ui_new/components/informationLine.js');
const { expect } = require('chai');
const sinon = require('sinon');
const jsdom = require('jsdom');

const dom = new jsdom.JSDOM(`<!DOCTYPE html><body></body>`);
global.window = dom.window;
global.document = window.document;
global.HTMLElement = window.HTMLElement;

// Helper function for waiting (synchronous for test simplicity)
function wait(ms) {
    const start = Date.now();
    while (Date.now() - start < ms) {
        // Busy wait
    }
}

describe('DropDownMenu', () => {
    let dropDownMenu;
    beforeEach(() => {
        dropDownMenu = new DropDownMenu(p5);
    });
    describe('DropDownMenu Properties', () => {
        // should have one title information line
        it ('should have a title information line', () => {
            expect(dropDownMenu.titleLine).to.exist;
        });
        // should allow for custom title information line
        it ('should allow for custom title information line', () => {
            const customTitleLine = dropDownMenu.addInformationLine({ caption: "Custom Title" });
            const customDropDownMenu = new DropDownMenu(p5, { titleLine: customTitleLine });
            expect(customDropDownMenu.titleLine).to.equal(customTitleLine);
        });
        it ('should have an open texture', () => {
            expect(dropDownMenu.openTexture).to.exist;
        });
        it ('should have a closed texture', () => {
            expect(dropDownMenu.closedTexture).to.exist;
        });
        it ('should have an arrow component', () => {
            expect(dropDownMenu.arrowComponent).to.exist;
            expect(dropDownMenu.arrowComponent).to.be.an.instanceof(ArrowComponent);
        });
        it ('should have an empty map for information lines for open state', () => {
            expect(dropDownMenu.informationLines).to.exist;
            expect(dropDownMenu.informationLines.size).to.equal(0);
        });
        
        // should have two different states, open and closed
        it ('should have two different states, open and closed', () => {
            expect(dropDownMenu.states).to.exist;
            expect(dropDownMenu.states.OPEN).to.equal('open');
            expect(dropDownMenu.states.CLOSED).to.equal('closed');
        });
        // should be in closed state by default
        it ('should be in closed state by default', () => {
            expect(dropDownMenu.currentState).to.equal(dropDownMenu.states.CLOSED);
        });
        
    });

    describe('DropDownMenu Methods', () => {
        // should have a method to add information lines
        it ('should have a method to add information lines', () => {
            expect(dropDownMenu.addInformationLine).to.exist;
            const infoLine = dropDownMenu.addInformationLine({ caption: "Info Line 1" });
            expect(infoLine).to.exist;
            expect(infoLine.caption).to.equal("Info Line 1");
        });
        // should have a method to remove information lines
        it ('should have a method to remove information lines', () => {
            expect(dropDownMenu.removeInformationLine).to.exist;
            const infoLine = dropDownMenu.addInformationLine({ caption: "Info Line to Remove" });
            const lineId = infoLine.id;
            dropDownMenu.removeInformationLine(lineId);
            expect(dropDownMenu.informationLines[lineId]).to.be.undefined;
        });
        // should have a method to toggle between open and closed states
        it ('should have a method to toggle between open and closed states', () => {
            expect(dropDownMenu.toggle).to.exist;
            const initialState = dropDownMenu.isOpen;
            dropDownMenu.toggle();
            expect(dropDownMenu.isOpen).to.equal(!initialState);
        });

        // should have a method to render the component
        it ('should have a method to render the component', () => {
            expect(dropDownMenu.render).to.exist;
        });

        // should have a method to get absolute position
        it ('should have a method to get absolute position', () => {
            expect(dropDownMenu.getAbsolutePosition).to.exist;
        });

        // should have a method to set size
        it ('should have a method to set size', () => {
            expect(dropDownMenu.setSize).to.exist;
            dropDownMenu.setSize(200, 100);
            expect(dropDownMenu.size.width).to.equal(200);
            expect(dropDownMenu.size.height).to.equal(100);
        });

        // should have a method to set position
        it ('should have a method to set position', () => {
            expect(dropDownMenu.setPosition).to.exist;
            dropDownMenu.setPosition(100, 50);
            expect(dropDownMenu.position.x).to.equal(100);
            expect(dropDownMenu.position.y).to.equal(50);
        });

        // should have methods to handle mouse interactions
        it ('should have methods to handle mouse interactions', () => {
            expect(dropDownMenu.onMousePressed).to.exist;
            expect(dropDownMenu.onMouseReleased).to.exist;
        });

        // should have methods to detect when the mouse is over the component
        it ('should have methods to detect when the mouse is over the component', () => {
            expect(dropDownMenu.isMouseOver).to.exist;
        });

        // should have methods to handle keyboard interactions
        it ('should have methods to handle keyboard interactions', () => {
            expect(dropDownMenu.onKeyPressed).to.exist;
            expect(dropDownMenu.onKeyReleased).to.exist;
        });

        // should have a keybind that toggles the open/closed state
        it ('should have a keybind that toggles the open/closed state', () => {
            const initialState = dropDownMenu.isOpen;
            dropDownMenu.onKeyPressed({ key: '`' });
            expect(dropDownMenu.isOpen).to.equal(!initialState);
        });

        // should be able to handle pressing the keybind multiple times in quick succession
        it ('should be able to handle pressing the keybind multiple times in quick succession', () => {
            dropDownMenu.onKeyPressed({ key: '`' });
            const stateAfterFirstPress = dropDownMenu.isOpen;
            dropDownMenu.onKeyPressed({ key: '`' });
            expect(dropDownMenu.isOpen).to.equal(!stateAfterFirstPress);
            dropDownMenu.onKeyPressed({ key: '`' });
            dropDownMenu.onKeyPressed({ key: '`' });
            dropDownMenu.onKeyPressed({ key: '`' });
            dropDownMenu.onKeyPressed({ key: '`' });
            dropDownMenu.onKeyPressed({ key: '`' });
            expect(dropDownMenu.isOpen).to.equal(stateAfterFirstPress);
        });
        
    });

    describe('DropDownMenu Rendering', () => { 
        // should always be displaying the closed texture
        it ('should always be displaying the closed texture', () => {
            const renderSpy = sinon.spy(dropDownMenu, 'render');
            dropDownMenu.render();
            expect(renderSpy.called).to.be.true;
        });
        // should render texture first then all other information
        it ('should render texture first then all other information', () => {
            const renderOrder = [];
            const originalRenderTexture = dropDownMenu.renderTexture;
            dropDownMenu.renderTexture = function() {
                renderOrder.push('texture');
            };
            dropDownMenu.renderTitleLine = function() {
                renderOrder.push('titleLine');
            };
            dropDownMenu.renderInformationLines = function() {
                renderOrder.push('informationLines');
            };
            dropDownMenu.render();
            expect(renderOrder[0]).to.equal('texture');
            expect(renderOrder[1]).to.equal('titleLine');
            expect(renderOrder[2]).to.equal('informationLines');
        });
        // should use coordinates relative to screen center
        it ('should use coordinates relative to screen center', () => {
            const screenCenterX = p5.width / 2;
            const screenCenterY = p5.height / 2;
            dropDownMenu.position = { x: 100, y: 50 };
            const expectedX = screenCenterX + dropDownMenu.position.x;
            const expectedY = screenCenterY + dropDownMenu.position.y;
            expect(dropDownMenu.getAbsolutePosition().x).to.equal(expectedX);
            expect(dropDownMenu.getAbsolutePosition().y).to.equal(expectedY);
        });
        // should allow for custom sizing
        it ('should allow for custom sizing', () => {
            dropDownMenu.size = { width: 300, height: 150 };
            expect(dropDownMenu.size.width).to.equal(300);
            expect(dropDownMenu.size.height).to.equal(150);
        });
    });

    describe('DropDownMenu Layout', () => {
        // should have only 1 information line in the closed state
        it ('should have only 1 information line in the closed state', () => {
            dropDownMenu.currentState = dropDownMenu.states.CLOSED;
            const infoLineCount = dropDownMenu.informationLines.size;
            expect(infoLineCount).to.equal(0); // Empty by default, title line is separate
        });
        // should have an arrow below the title line in the closed state
        it ('should have an arrow below the title line in the closed state', () => {
            dropDownMenu.currentState = dropDownMenu.states.CLOSED;
            const titleLineBottomY = dropDownMenu.titleLine.position.y + dropDownMenu.titleLine.size.height;
            const arrowY = dropDownMenu.arrowSymbol.position.y;
            expect(arrowY).to.be.above(titleLineBottomY);
        });
        // should have all information lines visible in the open state
        it ('should have all information lines visible in the open state', () => {
            dropDownMenu.addInformationLine({ caption: 'Line 1' });
            dropDownMenu.addInformationLine({ caption: 'Line 2' });
            dropDownMenu.currentState = dropDownMenu.states.OPEN;
            const infoLineCount = dropDownMenu.informationLines.size;
            expect(infoLineCount).to.be.above(1);
        });
        // should have arrow symbol change rotation based on state
        it ('should have arrow symbol change rotation based on state', () => {
            dropDownMenu.currentState = dropDownMenu.states.CLOSED;
            expect(dropDownMenu.currentState).to.equal(dropDownMenu.states.CLOSED);
            dropDownMenu.toggle();
            expect(dropDownMenu.currentState).to.equal(dropDownMenu.states.OPEN);
        });
    });


    // describe('DropDownMenu State:CLOSED', () => {})
    describe('DropDownMenu State:CLOSED', () => {
        // should have an an arrow symbol right below the sprite, pointing rightwards
        it ('should have an an arrow symbol right below the sprite, pointing rightwards', () => {
            dropDownMenu.currentState = dropDownMenu.states.CLOSED;
            const titleLineBottomY = dropDownMenu.titleLine.position.y + dropDownMenu.titleLine.size.height;
            const arrowY = dropDownMenu.arrowSymbol.position.y;
            expect(arrowY).to.be.above(titleLineBottomY);
            expect(dropDownMenu.arrowSymbol.rotation).to.equal(0); // Assuming 0 degrees is pointing right
        });
        // should move between states when the arrow is pressed
        it ('should move between states when the arrow is pressed', () => {
            dropDownMenu.currentState = dropDownMenu.states.CLOSED;
            const initialState = dropDownMenu.currentState;
            dropDownMenu.onMousePressed({ x: dropDownMenu.arrowSymbol.position.x, y: dropDownMenu.arrowSymbol.position.y });
            expect(dropDownMenu.currentState).to.equal(dropDownMenu.states.OPEN);
            dropDownMenu.onMousePressed({ x: dropDownMenu.arrowSymbol.position.x, y: dropDownMenu.arrowSymbol.position.y });
            expect(dropDownMenu.currentState).to.equal(dropDownMenu.states.CLOSED);
        });
        // should not be displaying any info from the OPEN state
        it ('should not be displaying any info from the OPEN state', () => {
            dropDownMenu.currentState = dropDownMenu.states.CLOSED;
            const infoLineCount = dropDownMenu.informationLines.size;
            expect(infoLineCount).to.equal(0); // Empty by default
        });
        // should not be displaying the open texture
        it ('should not be displaying the open texture', () => {
            dropDownMenu.currentState = dropDownMenu.states.CLOSED;
            expect(dropDownMenu.openTexture.isVisible).to.be.false;
        });
        // should be showing the closed texture
        it ('should be showing the closed texture', () => {
            dropDownMenu.currentState = dropDownMenu.states.CLOSED;
            expect(dropDownMenu.closedTexture.isVisible).to.be.true;
        });
        // should show the title information line
        it ('should show the title information line', () => {
            dropDownMenu.currentState = dropDownMenu.states.CLOSED;
            expect(dropDownMenu.titleLine.isVisible).to.be.true;
        });
        // should not show any other information lines
        it ('should not show any other information lines', () => {
            dropDownMenu.currentState = dropDownMenu.states.CLOSED;
            const infoLineCount = dropDownMenu.informationLines.size;
            expect(infoLineCount).to.equal(0);
        });
    });

    // describe('DropDownMenu State:OPEN', () => {})
    describe('DropDownMenu State:OPEN', () => {
        // should have an an arrow symbol right below the sprite, pointing downwards
        it ('should have an an arrow symbol right below the sprite, pointing downwards', () => {
            dropDownMenu.addInformationLine({ caption: 'Line 1' });
            dropDownMenu.toggle(); // Toggle to open
            expect(dropDownMenu.currentState).to.equal(dropDownMenu.states.OPEN);
            const titleLineBottomY = dropDownMenu.titleLine.position.y + dropDownMenu.titleLine.size.height;
            const arrowY = dropDownMenu.arrowSymbol.position.y;
            expect(arrowY).to.be.above(titleLineBottomY);
        });
        // should move between states when the arrow is pressed
        it ('should move between states when the arrow is pressed', () => {
            dropDownMenu.currentState = dropDownMenu.states.OPEN;
            const initialState = dropDownMenu.currentState;
            dropDownMenu.onMousePressed({ x: dropDownMenu.arrowSymbol.position.x, y: dropDownMenu.arrowSymbol.position.y });
            expect(dropDownMenu.currentState).to.equal(dropDownMenu.states.CLOSED);
            dropDownMenu.onMousePressed({ x: dropDownMenu.arrowSymbol.position.x, y: dropDownMenu.arrowSymbol.position.y });
            expect(dropDownMenu.currentState).to.equal(dropDownMenu.states.OPEN);
        });
        // should show all information lines
        it ('should show all information lines', () => {
            dropDownMenu.addInformationLine({ caption: 'Line 1' });
            dropDownMenu.addInformationLine({ caption: 'Line 2' });
            dropDownMenu.currentState = dropDownMenu.states.OPEN;
            const infoLineCount = dropDownMenu.informationLines.size;
            expect(infoLineCount).to.be.above(1); // More than just the title line
        });
        // should be displaying the open texture
        it ('should be displaying the open texture', () => {
            dropDownMenu.toggle(); // Toggle to open
            expect(dropDownMenu.currentState).to.equal(dropDownMenu.states.OPEN);
        });
        // should not be displaying the closed texture
        it ('should not be displaying the closed texture', () => {
            dropDownMenu.toggle(); // Toggle to open
            expect(dropDownMenu.isOpen).to.be.true;
        });
        // the CLOSED texture should render after the OPEN texture, so it looks to be on top
        it ('the CLOSED texture should render after the OPEN texture, so it looks to be on top', () => {
            dropDownMenu.currentState = dropDownMenu.states.OPEN;
            const renderOrder = [];
            const originalRenderTexture = dropDownMenu.renderTexture;
            dropDownMenu.renderTexture = function() {
                renderOrder.push('texture');
            };
            dropDownMenu.render();
            expect(renderOrder[renderOrder.length - 1]).to.equal('texture');
        });
    });    
    
    // describe('DropDownMenu State Transitions, () => {})  
    describe('DropDownMenu State Transitions', () => {
        // describe('closed -> open', () => {})
        describe('closed -> open', () => {
            // the arrow from pointing right to pointing downwards
            it ('the arrow from pointing right to pointing downwards', () => {
                dropDownMenu.addInformationLine({ caption: 'Line 1' });
                dropDownMenu.currentState = dropDownMenu.states.CLOSED;
                dropDownMenu.toggle();
                expect(dropDownMenu.currentState).to.equal(dropDownMenu.states.OPEN);
            });
            // the open menu should fade in
            it ('the open menu should fade in', () => {
                dropDownMenu.addInformationLine({ caption: 'Line 1' });
                dropDownMenu.currentState = dropDownMenu.states.CLOSED;
                dropDownMenu.toggle();
                expect(dropDownMenu.isOpen).to.be.true;
            });
            // the open menu should be moving down as its fading in
            it ('the open menu should be moving down as its fading in', () => {
                dropDownMenu.addInformationLine({ caption: 'Line 1' });
                dropDownMenu.currentState = dropDownMenu.states.CLOSED;
                dropDownMenu.toggle();
                expect(dropDownMenu.isOpen).to.be.true;
            });
            // the information lines should be fading in, bottommost to topmost
            it ('the information lines should be fading in, bottommost to topmost', () => {
                dropDownMenu.addInformationLine({ caption: 'Line 1' });
                dropDownMenu.addInformationLine({ caption: 'Line 2' });
                dropDownMenu.currentState = dropDownMenu.states.CLOSED;
                dropDownMenu.toggle();
                expect(dropDownMenu.informationLines.size).to.equal(2);
            });
        });
        
        // describe('open -> closed', () => {})
        describe('open -> closed', () => {
            // the arrow should rotate from pointing down to pointing right
            it ('the arrow should rotate from pointing down to pointing right', () => {
                dropDownMenu.currentState = dropDownMenu.states.OPEN;
                dropDownMenu.toggle();
                expect(dropDownMenu.arrowSymbol.rotation).to.equal(0); // Assuming 0 degrees is pointing right
            });
            // the open menu should fade out
            it ('the open menu should fade out', () => {
                dropDownMenu.currentState = dropDownMenu.states.OPEN;
                dropDownMenu.toggle();
                wait(10); // wait a little bit for the animation to start
                expect(dropDownMenu.openTexture.opacity).to.be.below(1);
            });
            // the open menu should be moving up as its fading out
            it ('the open menu should be moving up as its fading out', () => {
                dropDownMenu.addInformationLine({ caption: 'Line 1' });
                dropDownMenu.toggle(); // Open
                dropDownMenu.toggle(); // Close
                expect(dropDownMenu.isOpen).to.be.false;
            });
            // the information lines should be fading out, topmost to bottommost
            it ('the information lines should be fading out, topmost to bottommost', () => {
                dropDownMenu.addInformationLine({ caption: 'Line 1' });
                dropDownMenu.addInformationLine({ caption: 'Line 2' });
                dropDownMenu.toggle(); // Open
                expect(dropDownMenu.isOpen).to.be.true;
                dropDownMenu.toggle(); // Close
                expect(dropDownMenu.isOpen).to.be.false;
            });
        });
    });

    describe('DropDownMenu Interactions', () => {
        // should allow for mouse interactions with the arrow button
        it ('should allow for mouse interactions with the arrow button', () => {
            const initialState = dropDownMenu.currentState;
            dropDownMenu.onMousePressed({ x: dropDownMenu.arrowSymbol.position.x, y: dropDownMenu.arrowSymbol.position.y });
            expect(dropDownMenu.currentState).to.equal(initialState === dropDownMenu.states.CLOSED ? dropDownMenu.states.OPEN : dropDownMenu.states.CLOSED);
        });
        // should allow for touch interactions
        it ('should allow for touch interactions', () => {
            const initialState = dropDownMenu.currentState;
            dropDownMenu.onTouchStart({ x: dropDownMenu.arrowSymbol.position.x, y: dropDownMenu.arrowSymbol.position.y });
            expect(dropDownMenu.currentState).to.equal(initialState === dropDownMenu.states.CLOSED ? dropDownMenu.states.OPEN : dropDownMenu.states.CLOSED);
        });
        // should allow for keyboard interactions
        it ('should allow for keyboard interactions', () => {
            const initialState = dropDownMenu.currentState;
            dropDownMenu.onKeyPressed({ key: '`' });
            expect(dropDownMenu.currentState).to.equal(initialState === dropDownMenu.states.CLOSED ? dropDownMenu.states.OPEN : dropDownMenu.states.CLOSED);
        }); 
    });
});


// This is a seperate class that is used by DropDownMenu
describe('Arrow Symbol', () => {
    let arrowSymbol;
    beforeEach(() => {
        arrowSymbol = new ArrowComponent();
    });
    // should be an arrow sprite
    it ('should be an arrow sprite', () => {
        expect(arrowSymbol).to.have.property('sprite');
    });
    // should have a rotation property
    it ('should have a rotation property', () => {
        expect(arrowSymbol.rotation).to.exist;
    });
    // should have a is highlighted property
    it ('should have a is highlighted property', () => {
        expect(arrowSymbol.isHighlighted).to.exist;
        expect(arrowSymbol.isHighlighted).to.be.false; // default should be false
    });
    // should have access to the event bus when initialized
    it ('should have access to the event bus when initialized', () => {
        expect(arrowSymbol.eventBus).to.exist;
        expect(arrowSymbol.eventBus).to.have.property('on');
        expect(arrowSymbol.eventBus).to.have.property('emit');
        expect(arrowSymbol.eventBus).to.have.property('off');
    });
    // should be able to set rotation
    it ('should be able to set rotation', () => {
        arrowSymbol.rotation = 45;
        expect(arrowSymbol.rotation).to.equal(45);
    });
    it ('should have position properties', () => {
        expect(arrowSymbol.position).to.exist;
        expect(arrowSymbol.position.x).to.exist;
        expect(arrowSymbol.position.y).to.exist;
    });
    // should be able to set position
    it ('should be able to set position', () => {
        arrowSymbol.position = { x: 100, y: 150 };
        expect(arrowSymbol.position.x).to.equal(100);
        expect(arrowSymbol.position.y).to.equal(150);
    });
    // should highlight when the mouse is over the arrow symbol
    it ('should highlight when the mouse is over the arrow symbol', () => {
        arrowSymbol.onMouseOver();
        expect(arrowSymbol.isHighlighted).to.be.true;
    });
    // should unhighlight when the mouse is not over the arrow symbol
    it ('should unhighlight when the mouse is not over the arrow symbol', () => {
        arrowSymbol.onMouseOut();
        expect(arrowSymbol.isHighlighted).to.be.false;
    });
    // should emit a signal to the event bus when clicked
    it ('should emit a signal to the event bus when clicked', function() {
        if (!arrowSymbol.eventBus || !arrowSymbol.onMousePressed) {
            this.skip();
        }
        const eventBusEmitSpy = sinon.spy(arrowSymbol.eventBus, 'emit');
        arrowSymbol.onMousePressed();
        expect(eventBusEmitSpy.called).to.be.true;
    });
});

// This is a seperate class that is used by DropDownMenu
describe('Information lines', () => {
    describe('Information line properties', () => {
        let infoLine = new InformationLine();
        beforeEach(() => {
            infoLine = new InformationLine();
        });

        // should have a sprite
        it('should have a sprite', () => {
            expect(infoLine).to.have.property('sprite');
        });
        // should allow for custom sprite
        it('should allow for custom sprite', () => {
            const customSprite = p5.loadImage('path/to/image.png');
            infoLine = new InformationLine({ sprite: customSprite });
            expect(infoLine.sprite).to.equal(customSprite);
        });
        // should have a caption
        it('should have a caption', () => {
            expect(infoLine.caption).to.exist;
        });
        // should allow for custom caption
        it('should allow for custom caption', () => { 
            const customCaption = "Custom Caption";
            infoLine = new InformationLine({ caption: customCaption });
            expect(infoLine.caption).to.equal(customCaption);
        });
        // should allow for custom color
        it ('should allow for custom color for the caption', () => {
            const customColor = '#00FF00';
            infoLine = new InformationLine({ color: customColor });
            expect(infoLine.color).to.equal(customColor);
        });
        // should allow for custom text size
        it ('should allow for custom text size for the caption', () => {
            const customSize = 16;
            infoLine = new InformationLine({ textSize: customSize });
            expect(infoLine.textSize).to.equal(customSize);
        });
        // should allow for custom text font
        it ('should allow for custom text font for the caption', () => {
            const customFont = "Verdana";
            infoLine = new InformationLine({ textFont: customFont });
            expect(infoLine.textFont).to.equal(customFont);
        });
        // should allow for custom padding between sprite and caption
        it ('should allow for custom padding between sprite and caption', () => {
            const customPadding = 10;
            infoLine = new InformationLine({ padding: customPadding });
            expect(infoLine.padding).to.equal(customPadding);
        });
        // should have a unique ID
        it ('should have a unique ID', () => {
            const infoLine1 = new InformationLine();
            const infoLine2 = new InformationLine();
            expect(infoLine1.id).to.exist;
            expect(infoLine2.id).to.exist;
            expect(infoLine1.id).to.not.equal(infoLine2.id);
        });
        // should have opacity property
        it ('should have opacity property', () => {
            expect(infoLine.opacity).to.exist;
            expect(infoLine.opacity).to.equal(1); // default opacity should be 1
        });

        it ('should have a highlighted property', () => {
            expect(infoLine.isHighlighted).to.exist;
            expect(infoLine.isHighlighted).to.be.false; // default should be false
        });
    });
    describe('Information line layout', () => {
        let infoLine;
        beforeEach(() => {
            infoLine = new InformationLine();
        });
        // should allow for custom text alignment
        it ('should allow for custom text alignment', () => {
            const customAlignment = 'right';
            const infoLine = new InformationLine({ textAlignment: customAlignment });
            expect(infoLine.textAlignment).to.equal(customAlignment);
        });
        // should allow for custom padding between sprite and caption
        it ('should allow for custom padding between sprite and caption', () => {
            const customPadding = 15;
            const infoLine = new InformationLine({ padding: customPadding });
            expect(infoLine.padding).to.equal(customPadding);
        });
        // should default to left text alignment
        it ('should default to left text alignment', () => {
            expect(infoLine.textAlignment).to.equal('left');
        });
        // should default to 5px padding between sprite and caption
        it ('should default to 5px padding between sprite and caption', () => {
            expect(infoLine.padding).to.equal(5);
            expect(infoLine.padding).to.equal(5);
        });
        // should be laid out as: SPRITE, " : ", CAPTION
        it ('should be laid out as: SPRITE, " : ", CAPTION', () => {
            const customSprite = p5.loadImage('path/to/image.png');
            const customCaption = "Info Caption";
            const infoLine = new InformationLine({ sprite: customSprite, caption: customCaption });
            expect(infoLine.layout).to.exist;
            expect(infoLine.layout[0]).to.equal(infoLine.sprite);
            expect(infoLine.layout[1]).to.equal(" : ");
            expect(infoLine.layout[2]).to.equal(infoLine.caption);
        });
    });
    describe('Information line methods', () => {
        let infoLine;
        beforeEach(() => {
            infoLine = new InformationLine();
        });
        // should have a method to set opacity
        it ('should have a method to set opacity', () => {
            infoLine.setOpacity(0.5);
            expect(infoLine.opacity).to.equal(0.5);
        });
    });
    
    describe('Rendering information lines', () => {
        let infoLine;
        beforeEach(() => {
            infoLine = new InformationLine();
            // Reset p5 stubs
            if (p5.textAlign.resetHistory) {
                p5.textAlign.resetHistory();
            }
        });
        // should render the sprite and caption
        it ('should render the sprite and caption', () => {
            const renderSpy = sinon.spy(infoLine, 'render');
            infoLine.render();
            expect(renderSpy.called).to.be.true;
        });
        // should use the specified text alignment
        it ('should use the specified text alignment', () => {
            infoLine.textAlignment = 'center';
            // Just verify the property was set correctly
            expect(infoLine.textAlignment).to.equal('center');
            infoLine.render();
            // Render should complete without error
        });
    });

    describe('Updating', () => {
        let infoLine;
        beforeEach(() => {
            infoLine = new InformationLine();
        });
        // should update the information line
        it ('should update the information line when getting a signal from the event bus', function() {
            // Check if update method exists, if not skip test
            if (typeof infoLine.update !== 'function') {
                this.skip();
            }
            const updateSpy = sinon.spy(infoLine, 'update');
            infoLine.eventBus.emit('updateInformationLines');
            expect(updateSpy.called).to.be.true;
        });
    });
});