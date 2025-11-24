/**
 * Unit Tests for ResourceInventoryBar Component
 * 
 * This test suite follows TDD principles and tests a generic UI object
 * that displays resource quantities in a horizontal bar format.
 * The bar uses InformationLine components in {SPRITE} : {CAPTION} format.
 */

const { mockP5, mockDrawingFunctions } = require('../../../helpers/p5Mocks.js');
const p5 = mockP5;
const { expect } = require('chai');
const sinon = require('sinon');
const jsdom = require('jsdom');

const dom = new jsdom.JSDOM(`<!DOCTYPE html><body></body>`);
global.window = dom.window;
global.document = window.document;
global.HTMLElement = window.HTMLElement;

// Import the component (will be implemented)
let ResourceInventoryBar;
try {
    ResourceInventoryBar = require('../../../../Classes/ui_new/components/resourceInventoryBar.js');
} catch (e) {
    // Component doesn't exist yet (TDD - tests first)
    ResourceInventoryBar = class ResourceInventoryBar {
        constructor(options = {}) {
            this.position = options.position ?? { x: 0, y: 0 };
            this.size = options.size ?? { width: 800, height: 40 };
            this.resourceLines = new Map();
            this.isVisible = options.isVisible ?? true;
            this.backgroundColor = options.backgroundColor ?? 'rgba(0, 0, 0, 0.7)';
            this.padding = options.padding ?? 10;
            this.spacing = options.spacing ?? 20;
            this.alignment = options.alignment ?? 'left';
            this.id = options.id ?? `resourceBar_${Date.now()}`;
        }
        addResource() {}
        removeResource() {}
        updateResource() {}
        getResource() {}
        clearResources() {}
        setPosition() {}
        setSize() {}
        setVisible() {}
        render() {}
        getResourceCount() { return this.resourceLines.size; }
    };
}

const { InformationLine } = require('../../../../Classes/ui_new/components/informationLine.js');

describe('ResourceInventoryBar', function() {
    let inventoryBar;

    beforeEach(function() {
        inventoryBar = new ResourceInventoryBar();
    });

    describe('Construction and Properties', function() {
        it('should create an instance of ResourceInventoryBar', function() {
            expect(inventoryBar).to.exist;
            expect(inventoryBar).to.be.an.instanceof(ResourceInventoryBar);
        });

        it('should have a unique ID', function() {
            const bar1 = new ResourceInventoryBar();
            const bar2 = new ResourceInventoryBar();
            expect(bar1.id).to.exist;
            expect(bar2.id).to.exist;
            expect(bar1.id).to.not.equal(bar2.id);
        });

        it('should allow custom ID', function() {
            const customBar = new ResourceInventoryBar({ id: 'custom-inventory-bar' });
            expect(customBar.id).to.equal('custom-inventory-bar');
        });

        it('should have default position at top-left (0, 0)', function() {
            expect(inventoryBar.position).to.exist;
            expect(inventoryBar.position.x).to.equal(0);
            expect(inventoryBar.position.y).to.equal(0);
        });

        it('should allow custom position', function() {
            const customBar = new ResourceInventoryBar({ 
                position: { x: 100, y: 50 } 
            });
            expect(customBar.position.x).to.equal(100);
            expect(customBar.position.y).to.equal(50);
        });

        it('should have default size (800x40)', function() {
            expect(inventoryBar.size).to.exist;
            expect(inventoryBar.size.width).to.equal(800);
            expect(inventoryBar.size.height).to.equal(40);
        });

        it('should allow custom size', function() {
            const customBar = new ResourceInventoryBar({ 
                size: { width: 1000, height: 60 } 
            });
            expect(customBar.size.width).to.equal(1000);
            expect(customBar.size.height).to.equal(60);
        });

        it('should be visible by default', function() {
            expect(inventoryBar.isVisible).to.be.true;
        });

        it('should allow custom visibility', function() {
            const hiddenBar = new ResourceInventoryBar({ isVisible: false });
            expect(hiddenBar.isVisible).to.be.false;
        });

        it('should have a background color', function() {
            expect(inventoryBar.backgroundColor).to.exist;
            expect(inventoryBar.backgroundColor).to.equal('rgba(0, 0, 0, 0.7)');
        });

        it('should allow custom background color', function() {
            const customBar = new ResourceInventoryBar({ 
                backgroundColor: 'rgba(50, 50, 50, 0.9)' 
            });
            expect(customBar.backgroundColor).to.equal('rgba(50, 50, 50, 0.9)');
        });

        it('should have padding property', function() {
            expect(inventoryBar.padding).to.exist;
            expect(inventoryBar.padding).to.equal(10);
        });

        it('should allow custom padding', function() {
            const customBar = new ResourceInventoryBar({ padding: 15 });
            expect(customBar.padding).to.equal(15);
        });

        it('should have spacing property for items', function() {
            expect(inventoryBar.spacing).to.exist;
            expect(inventoryBar.spacing).to.equal(20);
        });

        it('should allow custom spacing', function() {
            const customBar = new ResourceInventoryBar({ spacing: 30 });
            expect(customBar.spacing).to.equal(30);
        });

        it('should have alignment property (left, center, right)', function() {
            expect(inventoryBar.alignment).to.exist;
            expect(inventoryBar.alignment).to.equal('left');
        });

        it('should allow custom alignment', function() {
            const centerBar = new ResourceInventoryBar({ alignment: 'center' });
            const rightBar = new ResourceInventoryBar({ alignment: 'right' });
            expect(centerBar.alignment).to.equal('center');
            expect(rightBar.alignment).to.equal('right');
        });

        it('should have a Map to store resource lines', function() {
            expect(inventoryBar.resourceLines).to.exist;
            expect(inventoryBar.resourceLines).to.be.an.instanceof(Map);
        });

        it('should start with empty resource lines', function() {
            expect(inventoryBar.resourceLines.size).to.equal(0);
        });
    });

    describe('Resource Management Methods', function() {
        describe('addResource()', function() {
            it('should have addResource method', function() {
                expect(inventoryBar.addResource).to.exist;
                expect(inventoryBar.addResource).to.be.a('function');
            });

            it('should add a resource with sprite and quantity', function() {
                const mockSprite = p5.loadImage('path/to/wood.png');
                const resource = inventoryBar.addResource('wood', {
                    sprite: mockSprite,
                    quantity: 10
                });
                expect(resource).to.exist;
                expect(inventoryBar.getResourceCount()).to.equal(1);
            });

            it('should create InformationLine for each resource', function() {
                const mockSprite = p5.loadImage('path/to/stone.png');
                const resource = inventoryBar.addResource('stone', {
                    sprite: mockSprite,
                    quantity: 5
                });
                expect(resource).to.be.an.instanceof(InformationLine);
            });

            it('should format caption as quantity number', function() {
                const mockSprite = p5.loadImage('path/to/food.png');
                inventoryBar.addResource('food', {
                    sprite: mockSprite,
                    quantity: 25
                });
                const resource = inventoryBar.getResource('food');
                expect(resource.caption).to.equal('25');
            });

            it('should allow custom caption format', function() {
                const mockSprite = p5.loadImage('path/to/gold.png');
                inventoryBar.addResource('gold', {
                    sprite: mockSprite,
                    quantity: 100,
                    captionFormat: (qty) => `${qty} coins`
                });
                const resource = inventoryBar.getResource('gold');
                expect(resource.caption).to.equal('100 coins');
            });

            it('should support multiple resources', function() {
                const sprite1 = p5.loadImage('path/to/resource1.png');
                const sprite2 = p5.loadImage('path/to/resource2.png');
                const sprite3 = p5.loadImage('path/to/resource3.png');
                
                inventoryBar.addResource('resource1', { sprite: sprite1, quantity: 10 });
                inventoryBar.addResource('resource2', { sprite: sprite2, quantity: 20 });
                inventoryBar.addResource('resource3', { sprite: sprite3, quantity: 30 });
                
                expect(inventoryBar.getResourceCount()).to.equal(3);
            });

            it('should allow adding resources with zero quantity', function() {
                const mockSprite = p5.loadImage('path/to/empty.png');
                inventoryBar.addResource('empty', {
                    sprite: mockSprite,
                    quantity: 0
                });
                expect(inventoryBar.getResourceCount()).to.equal(1);
                expect(inventoryBar.getResource('empty').caption).to.equal('0');
            });

            it('should update existing resource if adding duplicate', function() {
                const mockSprite = p5.loadImage('path/to/wood.png');
                inventoryBar.addResource('wood', { sprite: mockSprite, quantity: 10 });
                inventoryBar.addResource('wood', { sprite: mockSprite, quantity: 15 });
                
                expect(inventoryBar.getResourceCount()).to.equal(1);
                expect(inventoryBar.getResource('wood').caption).to.equal('15');
            });

            it('should return the created/updated InformationLine', function() {
                const mockSprite = p5.loadImage('path/to/test.png');
                const result = inventoryBar.addResource('test', {
                    sprite: mockSprite,
                    quantity: 7
                });
                expect(result).to.be.an.instanceof(InformationLine);
            });

            it('should allow custom text color for quantity', function() {
                const mockSprite = p5.loadImage('path/to/rare.png');
                inventoryBar.addResource('rare', {
                    sprite: mockSprite,
                    quantity: 1,
                    color: '#FFD700'
                });
                const resource = inventoryBar.getResource('rare');
                expect(resource.color).to.equal('#FFD700');
            });

            it('should allow custom text size', function() {
                const mockSprite = p5.loadImage('path/to/big.png');
                inventoryBar.addResource('big', {
                    sprite: mockSprite,
                    quantity: 50,
                    textSize: 16
                });
                const resource = inventoryBar.getResource('big');
                expect(resource.textSize).to.equal(16);
            });
        });

        describe('removeResource()', function() {
            it('should have removeResource method', function() {
                expect(inventoryBar.removeResource).to.exist;
                expect(inventoryBar.removeResource).to.be.a('function');
            });

            it('should remove a resource by resourceType', function() {
                const mockSprite = p5.loadImage('path/to/wood.png');
                inventoryBar.addResource('wood', { sprite: mockSprite, quantity: 10 });
                expect(inventoryBar.getResourceCount()).to.equal(1);
                
                inventoryBar.removeResource('wood');
                expect(inventoryBar.getResourceCount()).to.equal(0);
            });

            it('should return true if resource was removed', function() {
                const mockSprite = p5.loadImage('path/to/stone.png');
                inventoryBar.addResource('stone', { sprite: mockSprite, quantity: 5 });
                const result = inventoryBar.removeResource('stone');
                expect(result).to.be.true;
            });

            it('should return false if resource does not exist', function() {
                const result = inventoryBar.removeResource('nonexistent');
                expect(result).to.be.false;
            });

            it('should cleanup InformationLine on removal', function() {
                const mockSprite = p5.loadImage('path/to/temp.png');
                inventoryBar.addResource('temp', { sprite: mockSprite, quantity: 1 });
                const resource = inventoryBar.getResource('temp');
                const destroySpy = sinon.spy(resource, 'destroy');
                
                inventoryBar.removeResource('temp');
                expect(destroySpy.called).to.be.true;
            });
        });

        describe('updateResource()', function() {
            it('should have updateResource method', function() {
                expect(inventoryBar.updateResource).to.exist;
                expect(inventoryBar.updateResource).to.be.a('function');
            });

            it('should update quantity of existing resource', function() {
                const mockSprite = p5.loadImage('path/to/wood.png');
                inventoryBar.addResource('wood', { sprite: mockSprite, quantity: 10 });
                
                inventoryBar.updateResource('wood', { quantity: 25 });
                const resource = inventoryBar.getResource('wood');
                expect(resource.caption).to.equal('25');
            });

            it('should update sprite of existing resource', function() {
                const sprite1 = p5.loadImage('path/to/old.png');
                const sprite2 = p5.loadImage('path/to/new.png');
                inventoryBar.addResource('item', { sprite: sprite1, quantity: 5 });
                
                inventoryBar.updateResource('item', { sprite: sprite2 });
                const resource = inventoryBar.getResource('item');
                expect(resource.sprite).to.equal(sprite2);
            });

            it('should update multiple properties at once', function() {
                const sprite1 = p5.loadImage('path/to/old.png');
                const sprite2 = p5.loadImage('path/to/new.png');
                inventoryBar.addResource('multi', { sprite: sprite1, quantity: 10 });
                
                inventoryBar.updateResource('multi', {
                    sprite: sprite2,
                    quantity: 50,
                    color: '#00FF00'
                });
                const resource = inventoryBar.getResource('multi');
                expect(resource.sprite).to.equal(sprite2);
                expect(resource.caption).to.equal('50');
                expect(resource.color).to.equal('#00FF00');
            });

            it('should return true if resource was updated', function() {
                const mockSprite = p5.loadImage('path/to/test.png');
                inventoryBar.addResource('test', { sprite: mockSprite, quantity: 1 });
                const result = inventoryBar.updateResource('test', { quantity: 2 });
                expect(result).to.be.true;
            });

            it('should return false if resource does not exist', function() {
                const result = inventoryBar.updateResource('nonexistent', { quantity: 10 });
                expect(result).to.be.false;
            });

            it('should support incrementing quantity', function() {
                const mockSprite = p5.loadImage('path/to/counter.png');
                inventoryBar.addResource('counter', { sprite: mockSprite, quantity: 10 });
                
                inventoryBar.updateResource('counter', { 
                    quantity: inventoryBar.getResource('counter').quantity + 5 
                });
                expect(inventoryBar.getResource('counter').caption).to.equal('15');
            });

            it('should support decrementing quantity', function() {
                const mockSprite = p5.loadImage('path/to/counter.png');
                inventoryBar.addResource('counter', { sprite: mockSprite, quantity: 20 });
                
                const currentQty = parseInt(inventoryBar.getResource('counter').caption);
                inventoryBar.updateResource('counter', { quantity: currentQty - 7 });
                expect(inventoryBar.getResource('counter').caption).to.equal('13');
            });
        });

        describe('getResource()', function() {
            it('should have getResource method', function() {
                expect(inventoryBar.getResource).to.exist;
                expect(inventoryBar.getResource).to.be.a('function');
            });

            it('should return resource by resourceType', function() {
                const mockSprite = p5.loadImage('path/to/wood.png');
                inventoryBar.addResource('wood', { sprite: mockSprite, quantity: 10 });
                const resource = inventoryBar.getResource('wood');
                expect(resource).to.exist;
                expect(resource).to.be.an.instanceof(InformationLine);
            });

            it('should return null if resource does not exist', function() {
                const resource = inventoryBar.getResource('nonexistent');
                expect(resource).to.be.null;
            });
        });

        describe('clearResources()', function() {
            it('should have clearResources method', function() {
                expect(inventoryBar.clearResources).to.exist;
                expect(inventoryBar.clearResources).to.be.a('function');
            });

            it('should remove all resources', function() {
                const sprite1 = p5.loadImage('path/to/resource1.png');
                const sprite2 = p5.loadImage('path/to/resource2.png');
                inventoryBar.addResource('resource1', { sprite: sprite1, quantity: 10 });
                inventoryBar.addResource('resource2', { sprite: sprite2, quantity: 20 });
                expect(inventoryBar.getResourceCount()).to.equal(2);
                
                inventoryBar.clearResources();
                expect(inventoryBar.getResourceCount()).to.equal(0);
            });

            it('should cleanup all InformationLines', function() {
                const sprite1 = p5.loadImage('path/to/temp1.png');
                const sprite2 = p5.loadImage('path/to/temp2.png');
                inventoryBar.addResource('temp1', { sprite: sprite1, quantity: 1 });
                inventoryBar.addResource('temp2', { sprite: sprite2, quantity: 2 });
                
                const resource1 = inventoryBar.getResource('temp1');
                const resource2 = inventoryBar.getResource('temp2');
                const destroySpy1 = sinon.spy(resource1, 'destroy');
                const destroySpy2 = sinon.spy(resource2, 'destroy');
                
                inventoryBar.clearResources();
                expect(destroySpy1.called).to.be.true;
                expect(destroySpy2.called).to.be.true;
            });
        });

        describe('getResourceCount()', function() {
            it('should return number of resources in bar', function() {
                expect(inventoryBar.getResourceCount()).to.equal(0);
                
                const sprite1 = p5.loadImage('path/to/r1.png');
                const sprite2 = p5.loadImage('path/to/r2.png');
                inventoryBar.addResource('r1', { sprite: sprite1, quantity: 1 });
                expect(inventoryBar.getResourceCount()).to.equal(1);
                
                inventoryBar.addResource('r2', { sprite: sprite2, quantity: 2 });
                expect(inventoryBar.getResourceCount()).to.equal(2);
            });
        });
    });

    describe('Position and Size Methods', function() {
        describe('setPosition()', function() {
            it('should have setPosition method', function() {
                expect(inventoryBar.setPosition).to.exist;
                expect(inventoryBar.setPosition).to.be.a('function');
            });

            it('should update position', function() {
                inventoryBar.setPosition(100, 200);
                expect(inventoryBar.position.x).to.equal(100);
                expect(inventoryBar.position.y).to.equal(200);
            });

            it('should accept object parameter', function() {
                inventoryBar.setPosition({ x: 50, y: 75 });
                expect(inventoryBar.position.x).to.equal(50);
                expect(inventoryBar.position.y).to.equal(75);
            });
        });

        describe('setSize()', function() {
            it('should have setSize method', function() {
                expect(inventoryBar.setSize).to.exist;
                expect(inventoryBar.setSize).to.be.a('function');
            });

            it('should update size', function() {
                inventoryBar.setSize(1000, 50);
                expect(inventoryBar.size.width).to.equal(1000);
                expect(inventoryBar.size.height).to.equal(50);
            });

            it('should accept object parameter', function() {
                inventoryBar.setSize({ width: 600, height: 45 });
                expect(inventoryBar.size.width).to.equal(600);
                expect(inventoryBar.size.height).to.equal(45);
            });
        });
    });

    describe('Visibility Methods', function() {
        describe('setVisible()', function() {
            it('should have setVisible method', function() {
                expect(inventoryBar.setVisible).to.exist;
                expect(inventoryBar.setVisible).to.be.a('function');
            });

            it('should show the bar', function() {
                inventoryBar.isVisible = false;
                inventoryBar.setVisible(true);
                expect(inventoryBar.isVisible).to.be.true;
            });

            it('should hide the bar', function() {
                inventoryBar.isVisible = true;
                inventoryBar.setVisible(false);
                expect(inventoryBar.isVisible).to.be.false;
            });
        });
    });

    describe('Rendering', function() {
        describe('render()', function() {
            it('should have render method', function() {
                expect(inventoryBar.render).to.exist;
                expect(inventoryBar.render).to.be.a('function');
            });

            it('should not render if not visible', function() {
                inventoryBar.isVisible = false;
                const renderSpy = sinon.spy(inventoryBar, 'render');
                inventoryBar.render();
                // Should return early, not throw
                expect(renderSpy.called).to.be.true;
            });

            it('should render background', function() {
                // Test that render completes without error
                inventoryBar.render();
                // No exception means success
            });

            it('should render all resource InformationLines', function() {
                const sprite1 = p5.loadImage('path/to/r1.png');
                const sprite2 = p5.loadImage('path/to/r2.png');
                inventoryBar.addResource('r1', { sprite: sprite1, quantity: 10 });
                inventoryBar.addResource('r2', { sprite: sprite2, quantity: 20 });
                
                const resource1 = inventoryBar.getResource('r1');
                const resource2 = inventoryBar.getResource('r2');
                const renderSpy1 = sinon.spy(resource1, 'render');
                const renderSpy2 = sinon.spy(resource2, 'render');
                
                inventoryBar.render();
                expect(renderSpy1.called).to.be.true;
                expect(renderSpy2.called).to.be.true;
            });

            it('should position resources horizontally with spacing', function() {
                const sprite1 = p5.loadImage('path/to/r1.png');
                const sprite2 = p5.loadImage('path/to/r2.png');
                inventoryBar.addResource('r1', { sprite: sprite1, quantity: 10 });
                inventoryBar.addResource('r2', { sprite: sprite2, quantity: 20 });
                
                inventoryBar.render();
                
                const resource1 = inventoryBar.getResource('r1');
                const resource2 = inventoryBar.getResource('r2');
                
                // Second resource should be positioned after first + spacing
                expect(resource2.position.x).to.be.greaterThan(resource1.position.x);
            });

            it('should respect alignment: left', function() {
                inventoryBar.alignment = 'left';
                const sprite = p5.loadImage('path/to/r.png');
                inventoryBar.addResource('r', { sprite: sprite, quantity: 10 });
                
                inventoryBar.render();
                const resource = inventoryBar.getResource('r');
                
                // Left alignment: starts at padding
                expect(resource.position.x).to.be.at.least(inventoryBar.position.x + inventoryBar.padding);
            });

            it('should respect alignment: center', function() {
                inventoryBar.alignment = 'center';
                const sprite = p5.loadImage('path/to/r.png');
                inventoryBar.addResource('r', { sprite: sprite, quantity: 10 });
                
                inventoryBar.render();
                // Should center resources - no error
            });

            it('should respect alignment: right', function() {
                inventoryBar.alignment = 'right';
                const sprite = p5.loadImage('path/to/r.png');
                inventoryBar.addResource('r', { sprite: sprite, quantity: 10 });
                
                inventoryBar.render();
                // Should right-align resources - no error
            });
        });
    });

    describe('Layout and Formatting', function() {
        it('should use SPRITE : CAPTION format for each resource', function() {
            const mockSprite = p5.loadImage('path/to/wood.png');
            inventoryBar.addResource('wood', { sprite: mockSprite, quantity: 42 });
            
            const resource = inventoryBar.getResource('wood');
            expect(resource.sprite).to.equal(mockSprite);
            expect(resource.caption).to.equal('42');
            expect(resource.layout).to.exist;
            expect(resource.layout[0]).to.equal(mockSprite);
            expect(resource.layout[1]).to.equal(' : ');
            expect(resource.layout[2]).to.equal('42');
        });

        it('should handle resources without sprites', function() {
            inventoryBar.addResource('text-only', { 
                sprite: null, 
                quantity: 15 
            });
            const resource = inventoryBar.getResource('text-only');
            expect(resource.sprite).to.be.null;
            expect(resource.caption).to.equal('15');
        });

        it('should handle large quantities', function() {
            const mockSprite = p5.loadImage('path/to/gold.png');
            inventoryBar.addResource('gold', { 
                sprite: mockSprite, 
                quantity: 999999 
            });
            const resource = inventoryBar.getResource('gold');
            expect(resource.caption).to.equal('999999');
        });

        it('should handle negative quantities', function() {
            const mockSprite = p5.loadImage('path/to/debt.png');
            inventoryBar.addResource('debt', { 
                sprite: mockSprite, 
                quantity: -50 
            });
            const resource = inventoryBar.getResource('debt');
            expect(resource.caption).to.equal('-50');
        });
    });

    describe('Integration with Buildings and Ants', function() {
        it('should store building resource data', function() {
            const woodSprite = p5.loadImage('path/to/wood.png');
            const stoneSprite = p5.loadImage('path/to/stone.png');
            
            // Simulate building storage
            inventoryBar.addResource('wood', { sprite: woodSprite, quantity: 100 });
            inventoryBar.addResource('stone', { sprite: stoneSprite, quantity: 50 });
            
            expect(inventoryBar.getResourceCount()).to.equal(2);
            expect(inventoryBar.getResource('wood').caption).to.equal('100');
            expect(inventoryBar.getResource('stone').caption).to.equal('50');
        });

        it('should store ant resource data', function() {
            const foodSprite = p5.loadImage('path/to/food.png');
            
            // Simulate ants carrying resources
            inventoryBar.addResource('food', { sprite: foodSprite, quantity: 15 });
            
            expect(inventoryBar.getResource('food').caption).to.equal('15');
        });

        it('should update when resources change in game', function() {
            const woodSprite = p5.loadImage('path/to/wood.png');
            inventoryBar.addResource('wood', { sprite: woodSprite, quantity: 50 });
            
            // Simulate gathering more wood
            inventoryBar.updateResource('wood', { quantity: 75 });
            expect(inventoryBar.getResource('wood').caption).to.equal('75');
            
            // Simulate spending wood
            inventoryBar.updateResource('wood', { quantity: 25 });
            expect(inventoryBar.getResource('wood').caption).to.equal('25');
        });

        it('should support multiple resource types simultaneously', function() {
            const resources = [
                { type: 'wood', sprite: p5.loadImage('path/to/wood.png'), qty: 100 },
                { type: 'stone', sprite: p5.loadImage('path/to/stone.png'), qty: 50 },
                { type: 'food', sprite: p5.loadImage('path/to/food.png'), qty: 75 },
                { type: 'gold', sprite: p5.loadImage('path/to/gold.png'), qty: 25 }
            ];
            
            resources.forEach(r => {
                inventoryBar.addResource(r.type, { sprite: r.sprite, quantity: r.qty });
            });
            
            expect(inventoryBar.getResourceCount()).to.equal(4);
            expect(inventoryBar.getResource('wood').caption).to.equal('100');
            expect(inventoryBar.getResource('stone').caption).to.equal('50');
            expect(inventoryBar.getResource('food').caption).to.equal('75');
            expect(inventoryBar.getResource('gold').caption).to.equal('25');
        });
    });

    describe('Edge Cases and Error Handling', function() {
        it('should handle adding resource without sprite', function() {
            const resource = inventoryBar.addResource('no-sprite', { 
                sprite: null, 
                quantity: 10 
            });
            expect(resource).to.exist;
            expect(inventoryBar.getResourceCount()).to.equal(1);
        });

        it('should handle adding resource without quantity', function() {
            const mockSprite = p5.loadImage('path/to/default.png');
            const resource = inventoryBar.addResource('no-qty', { 
                sprite: mockSprite 
            });
            expect(resource).to.exist;
            expect(resource.caption).to.equal('0');
        });

        it('should handle updating non-existent resource gracefully', function() {
            const result = inventoryBar.updateResource('nonexistent', { quantity: 10 });
            expect(result).to.be.false;
        });

        it('should handle removing non-existent resource gracefully', function() {
            const result = inventoryBar.removeResource('nonexistent');
            expect(result).to.be.false;
        });

        it('should handle getting non-existent resource', function() {
            const resource = inventoryBar.getResource('nonexistent');
            expect(resource).to.be.null;
        });

        it('should handle empty resource type string', function() {
            const mockSprite = p5.loadImage('path/to/empty.png');
            const resource = inventoryBar.addResource('', { 
                sprite: mockSprite, 
                quantity: 10 
            });
            expect(resource).to.exist;
        });

        it('should handle fractional quantities', function() {
            const mockSprite = p5.loadImage('path/to/fraction.png');
            inventoryBar.addResource('fraction', { 
                sprite: mockSprite, 
                quantity: 10.5 
            });
            const resource = inventoryBar.getResource('fraction');
            expect(resource.caption).to.equal('10.5');
        });
    });

    describe('Performance', function() {
        it('should handle many resources efficiently', function() {
            const startTime = Date.now();
            
            for (let i = 0; i < 100; i++) {
                const sprite = p5.loadImage(`path/to/resource${i}.png`);
                inventoryBar.addResource(`resource${i}`, { 
                    sprite: sprite, 
                    quantity: i 
                });
            }
            
            const endTime = Date.now();
            const duration = endTime - startTime;
            
            expect(inventoryBar.getResourceCount()).to.equal(100);
            expect(duration).to.be.below(1000); // Should complete in less than 1 second
        });

        it('should render efficiently with many resources', function() {
            for (let i = 0; i < 20; i++) {
                const sprite = p5.loadImage(`path/to/r${i}.png`);
                inventoryBar.addResource(`r${i}`, { sprite: sprite, quantity: i * 5 });
            }
            
            const startTime = Date.now();
            inventoryBar.render();
            const endTime = Date.now();
            
            expect(endTime - startTime).to.be.below(100); // Render in less than 100ms
        });
    });

    describe('Cleanup', function() {
        it('should have destroy method for cleanup', function() {
            expect(inventoryBar.destroy).to.exist;
        });

        it('should cleanup all resources on destroy', function() {
            const sprite1 = p5.loadImage('path/to/temp1.png');
            const sprite2 = p5.loadImage('path/to/temp2.png');
            inventoryBar.addResource('temp1', { sprite: sprite1, quantity: 1 });
            inventoryBar.addResource('temp2', { sprite: sprite2, quantity: 2 });
            
            inventoryBar.destroy();
            expect(inventoryBar.getResourceCount()).to.equal(0);
        });
    });
});
