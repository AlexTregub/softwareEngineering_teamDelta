/**
 * Unit Tests for PlayerResourceInventoryBar Component
 * 
 * Tests a subclass of ResourceInventoryBar that tracks player faction resources
 * (Stone, Sticks, Leaves) and listens to ENTITY_REGISTERED signals.
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

// Mock EventBus
class MockEventBus {
    constructor() {
        this.listeners = {};
    }
    on(event, listener) {
        if (!this.listeners[event]) this.listeners[event] = [];
        this.listeners[event].push(listener);
    }
    off(event, listener) {
        if (!this.listeners[event]) return;
        this.listeners[event] = this.listeners[event].filter(l => l !== listener);
    }
    emit(event, data) {
        if (!this.listeners[event]) return;
        this.listeners[event].forEach(listener => listener(data));
    }
}

// Setup mock eventBus
const mockEventBus = new MockEventBus();
global.eventBus = mockEventBus;
global.window.eventBus = mockEventBus;

// Import components
const ResourceInventoryBar = require('../../../../Classes/ui_new/components/resourceInventoryBar.js');
let PlayerResourceInventoryBar;

try {
    PlayerResourceInventoryBar = require('../../../../Classes/ui_new/components/playerResourceInventoryBar.js');
} catch (e) {
    // Component doesn't exist yet (TDD - tests first)
    PlayerResourceInventoryBar = class PlayerResourceInventoryBar extends ResourceInventoryBar {
        constructor(options = {}) {
            super(options);
            this.playerFaction = 'player';
        }
        _setupResourceLines() {}
        _setupEventListeners() {}
        handleEntityRegistered() {}
        destroy() { super.destroy(); }
    };
}

describe('PlayerResourceInventoryBar', function() {
    let inventoryBar;
    let mockStoneSprite, mockStickSprite, mockLeafSprite;

    beforeEach(function() {
        // Reset eventBus
        mockEventBus.listeners = {};
        
        // Create mock sprites
        mockStoneSprite = p5.loadImage('path/to/stone.png');
        mockStickSprite = p5.loadImage('path/to/stick.png');
        mockLeafSprite = p5.loadImage('path/to/leaf.png');
        
        inventoryBar = new PlayerResourceInventoryBar();
    });

    afterEach(function() {
        if (inventoryBar && typeof inventoryBar.destroy === 'function') {
            inventoryBar.destroy();
        }
    });

    describe('Construction and Inheritance', function() {
        it('should create an instance of PlayerResourceInventoryBar', function() {
            expect(inventoryBar).to.exist;
            expect(inventoryBar).to.be.an.instanceof(PlayerResourceInventoryBar);
        });

        it('should inherit from ResourceInventoryBar', function() {
            expect(inventoryBar).to.be.an.instanceof(ResourceInventoryBar);
        });

        it('should have player faction set to "player"', function() {
            expect(inventoryBar.playerFaction).to.equal('player');
        });

        it('should allow custom player faction', function() {
            const customBar = new PlayerResourceInventoryBar({ playerFaction: 'team1' });
            expect(customBar.playerFaction).to.equal('team1');
        });
    });

    describe('Resource Lines Initialization', function() {
        it('should initialize with 3 resource types: stone, stick, leaf', function() {
            expect(inventoryBar.getResourceCount()).to.equal(3);
        });

        it('should have a stone resource line', function() {
            const stoneResource = inventoryBar.getResource('stone');
            expect(stoneResource).to.exist;
        });

        it('should have a stick resource line', function() {
            const stickResource = inventoryBar.getResource('stick');
            expect(stickResource).to.exist;
        });

        it('should have a leaf resource line', function() {
            const leafResource = inventoryBar.getResource('leaf');
            expect(leafResource).to.exist;
        });

        it('should initialize all resources with quantity 0', function() {
            const stone = inventoryBar.getResource('stone');
            const stick = inventoryBar.getResource('stick');
            const leaf = inventoryBar.getResource('leaf');
            
            expect(stone.caption).to.equal('0');
            expect(stick.caption).to.equal('0');
            expect(leaf.caption).to.equal('0');
        });

        it('should use provided sprites if available', function() {
            const customBar = new PlayerResourceInventoryBar({
                sprites: {
                    stone: mockStoneSprite,
                    stick: mockStickSprite,
                    leaf: mockLeafSprite
                }
            });
            
            expect(customBar.getResource('stone').sprite).to.equal(mockStoneSprite);
            expect(customBar.getResource('stick').sprite).to.equal(mockStickSprite);
            expect(customBar.getResource('leaf').sprite).to.equal(mockLeafSprite);
        });
    });

    describe('Event Bus Integration', function() {
        it('should register ENTITY_REGISTERED event listener on construction', function() {
            const listeners = mockEventBus.listeners['ENTITY_REGISTERED'];
            expect(listeners).to.exist;
            expect(listeners.length).to.be.at.least(1);
        });

        it('should handle ENTITY_REGISTERED signal', function() {
            const handleSpy = sinon.spy(inventoryBar, 'handleEntityRegistered');
            
            mockEventBus.emit('ENTITY_REGISTERED', {
                type: 'resource',
                faction: 'player',
                metadata: { resourceType: 'stone' }
            });
            
            expect(handleSpy.called).to.be.true;
        });

        it('should increment stone count when player stone resource is registered', function() {
            mockEventBus.emit('ENTITY_REGISTERED', {
                type: 'resource',
                faction: 'player',
                metadata: { resourceType: 'stone' }
            });
            
            const stoneResource = inventoryBar.getResource('stone');
            expect(stoneResource.caption).to.equal('1');
        });

        it('should increment stick count when player stick resource is registered', function() {
            mockEventBus.emit('ENTITY_REGISTERED', {
                type: 'resource',
                faction: 'player',
                metadata: { resourceType: 'stick' }
            });
            
            const stickResource = inventoryBar.getResource('stick');
            expect(stickResource.caption).to.equal('1');
        });

        it('should increment leaf count when player leaf resource is registered', function() {
            mockEventBus.emit('ENTITY_REGISTERED', {
                type: 'resource',
                faction: 'player',
                metadata: { resourceType: 'greenLeaf' }
            });
            
            const leafResource = inventoryBar.getResource('leaf');
            expect(leafResource.caption).to.equal('1');
        });

        it('should NOT increment count for non-player faction resources', function() {
            mockEventBus.emit('ENTITY_REGISTERED', {
                type: 'resource',
                faction: 'enemy',
                metadata: { resourceType: 'stone' }
            });
            
            const stoneResource = inventoryBar.getResource('stone');
            expect(stoneResource.caption).to.equal('0');
        });

        it('should NOT increment count for neutral faction resources', function() {
            mockEventBus.emit('ENTITY_REGISTERED', {
                type: 'resource',
                faction: 'neutral',
                metadata: { resourceType: 'stick' }
            });
            
            const stickResource = inventoryBar.getResource('stick');
            expect(stickResource.caption).to.equal('0');
        });

        it('should handle multiple resources of same type', function() {
            mockEventBus.emit('ENTITY_REGISTERED', {
                type: 'resource',
                faction: 'player',
                metadata: { resourceType: 'stone' }
            });
            mockEventBus.emit('ENTITY_REGISTERED', {
                type: 'resource',
                faction: 'player',
                metadata: { resourceType: 'stone' }
            });
            mockEventBus.emit('ENTITY_REGISTERED', {
                type: 'resource',
                faction: 'player',
                metadata: { resourceType: 'stone' }
            });
            
            const stoneResource = inventoryBar.getResource('stone');
            expect(stoneResource.caption).to.equal('3');
        });

        it('should handle mixed resource types', function() {
            mockEventBus.emit('ENTITY_REGISTERED', {
                type: 'resource',
                faction: 'player',
                metadata: { resourceType: 'stone' }
            });
            mockEventBus.emit('ENTITY_REGISTERED', {
                type: 'resource',
                faction: 'player',
                metadata: { resourceType: 'stick' }
            });
            mockEventBus.emit('ENTITY_REGISTERED', {
                type: 'resource',
                faction: 'player',
                metadata: { resourceType: 'greenLeaf' }
            });
            
            expect(inventoryBar.getResource('stone').caption).to.equal('1');
            expect(inventoryBar.getResource('stick').caption).to.equal('1');
            expect(inventoryBar.getResource('leaf').caption).to.equal('1');
        });

        it('should map mapleLeaf to leaf resource', function() {
            mockEventBus.emit('ENTITY_REGISTERED', {
                type: 'resource',
                faction: 'player',
                metadata: { resourceType: 'mapleLeaf' }
            });
            
            const leafResource = inventoryBar.getResource('leaf');
            expect(leafResource.caption).to.equal('1');
        });

        it('should ignore non-resource entity types', function() {
            mockEventBus.emit('ENTITY_REGISTERED', {
                type: 'ant',
                faction: 'player',
                metadata: { jobName: 'Scout' }
            });
            
            expect(inventoryBar.getResource('stone').caption).to.equal('0');
            expect(inventoryBar.getResource('stick').caption).to.equal('0');
            expect(inventoryBar.getResource('leaf').caption).to.equal('0');
        });

        it('should ignore resources with unknown resourceType', function() {
            mockEventBus.emit('ENTITY_REGISTERED', {
                type: 'resource',
                faction: 'player',
                metadata: { resourceType: 'diamond' }
            });
            
            // Counts should remain 0
            expect(inventoryBar.getResource('stone').caption).to.equal('0');
            expect(inventoryBar.getResource('stick').caption).to.equal('0');
            expect(inventoryBar.getResource('leaf').caption).to.equal('0');
        });

        it('should handle missing metadata gracefully', function() {
            mockEventBus.emit('ENTITY_REGISTERED', {
                type: 'resource',
                faction: 'player'
                // No metadata
            });
            
            // Should not throw error
            expect(inventoryBar.getResource('stone').caption).to.equal('0');
        });
    });

    describe('Faction Change Handling', function() {
        it('should listen for ENTITY_FACTION_CHANGED event', function() {
            const listeners = mockEventBus.listeners['ENTITY_FACTION_CHANGED'];
            expect(listeners).to.exist;
        });

        it('should increment count when resource changes TO player faction', function() {
            mockEventBus.emit('ENTITY_FACTION_CHANGED', {
                type: 'resource',
                id: 'resource_123',
                oldFaction: 'neutral',
                newFaction: 'player',
                metadata: { resourceType: 'stone' }
            });
            
            const stoneResource = inventoryBar.getResource('stone');
            expect(stoneResource.caption).to.equal('1');
        });

        it('should decrement count when resource changes FROM player faction', function() {
            // First add a resource
            mockEventBus.emit('ENTITY_REGISTERED', {
                type: 'resource',
                faction: 'player',
                metadata: { resourceType: 'stone' }
            });
            expect(inventoryBar.getResource('stone').caption).to.equal('1');
            
            // Then change it away from player
            mockEventBus.emit('ENTITY_FACTION_CHANGED', {
                type: 'resource',
                id: 'resource_123',
                oldFaction: 'player',
                newFaction: 'enemy',
                metadata: { resourceType: 'stone' }
            });
            
            const stoneResource = inventoryBar.getResource('stone');
            expect(stoneResource.caption).to.equal('0');
        });

        it('should NOT change count for non-player faction changes', function() {
            mockEventBus.emit('ENTITY_FACTION_CHANGED', {
                type: 'resource',
                id: 'resource_123',
                oldFaction: 'neutral',
                newFaction: 'enemy',
                metadata: { resourceType: 'stone' }
            });
            
            const stoneResource = inventoryBar.getResource('stone');
            expect(stoneResource.caption).to.equal('0');
        });

        it('should handle multiple faction changes correctly', function() {
            // Add 3 player stones
            mockEventBus.emit('ENTITY_REGISTERED', {
                type: 'resource',
                faction: 'player',
                metadata: { resourceType: 'stone' }
            });
            mockEventBus.emit('ENTITY_REGISTERED', {
                type: 'resource',
                faction: 'player',
                metadata: { resourceType: 'stone' }
            });
            mockEventBus.emit('ENTITY_REGISTERED', {
                type: 'resource',
                faction: 'player',
                metadata: { resourceType: 'stone' }
            });
            expect(inventoryBar.getResource('stone').caption).to.equal('3');
            
            // One changes to enemy
            mockEventBus.emit('ENTITY_FACTION_CHANGED', {
                type: 'resource',
                oldFaction: 'player',
                newFaction: 'enemy',
                metadata: { resourceType: 'stone' }
            });
            expect(inventoryBar.getResource('stone').caption).to.equal('2');
            
            // Another changes to enemy
            mockEventBus.emit('ENTITY_FACTION_CHANGED', {
                type: 'resource',
                oldFaction: 'player',
                newFaction: 'enemy',
                metadata: { resourceType: 'stone' }
            });
            expect(inventoryBar.getResource('stone').caption).to.equal('1');
        });
    });

    describe('Resource Removal Handling', function() {
        it('should listen for ENTITY_REMOVED event', function() {
            const listeners = mockEventBus.listeners['ENTITY_REMOVED'];
            expect(listeners).to.exist;
        });

        it('should decrement count when player resource is removed', function() {
            // Add resources
            mockEventBus.emit('ENTITY_REGISTERED', {
                type: 'resource',
                faction: 'player',
                metadata: { resourceType: 'stone' }
            });
            mockEventBus.emit('ENTITY_REGISTERED', {
                type: 'resource',
                faction: 'player',
                metadata: { resourceType: 'stone' }
            });
            expect(inventoryBar.getResource('stone').caption).to.equal('2');
            
            // Remove one
            mockEventBus.emit('ENTITY_REMOVED', {
                type: 'resource',
                faction: 'player',
                metadata: { resourceType: 'stone' }
            });
            
            const stoneResource = inventoryBar.getResource('stone');
            expect(stoneResource.caption).to.equal('1');
        });

        it('should NOT decrement below 0', function() {
            expect(inventoryBar.getResource('stone').caption).to.equal('0');
            
            mockEventBus.emit('ENTITY_REMOVED', {
                type: 'resource',
                faction: 'player',
                metadata: { resourceType: 'stone' }
            });
            
            const stoneResource = inventoryBar.getResource('stone');
            expect(stoneResource.caption).to.equal('0');
        });

        it('should NOT decrement for non-player faction removals', function() {
            mockEventBus.emit('ENTITY_REGISTERED', {
                type: 'resource',
                faction: 'player',
                metadata: { resourceType: 'stone' }
            });
            expect(inventoryBar.getResource('stone').caption).to.equal('1');
            
            mockEventBus.emit('ENTITY_REMOVED', {
                type: 'resource',
                faction: 'enemy',
                metadata: { resourceType: 'stone' }
            });
            
            expect(inventoryBar.getResource('stone').caption).to.equal('1');
        });
    });

    describe('Cleanup', function() {
        it('should unregister event listeners on destroy', function() {
            const initialListenerCount = mockEventBus.listeners['ENTITY_REGISTERED']?.length || 0;
            inventoryBar.destroy();
            const finalListenerCount = mockEventBus.listeners['ENTITY_REGISTERED']?.length || 0;
            expect(finalListenerCount).to.be.lessThan(initialListenerCount);
        });

        it('should call parent destroy method', function() {
            const destroySpy = sinon.spy(ResourceInventoryBar.prototype, 'destroy');
            inventoryBar.destroy();
            expect(destroySpy.called).to.be.true;
            destroySpy.restore();
        });
    });

    describe('Edge Cases', function() {
        it('should handle rapid successive events', function() {
            for (let i = 0; i < 100; i++) {
                mockEventBus.emit('ENTITY_REGISTERED', {
                    type: 'resource',
                    faction: 'player',
                    metadata: { resourceType: 'stone' }
                });
            }
            
            const stoneResource = inventoryBar.getResource('stone');
            expect(stoneResource.caption).to.equal('100');
        });

        it('should handle events before bar is fully initialized', function() {
            // Emit event during construction
            const newBar = new PlayerResourceInventoryBar();
            mockEventBus.emit('ENTITY_REGISTERED', {
                type: 'resource',
                faction: 'player',
                metadata: { resourceType: 'stone' }
            });
            
            expect(newBar.getResource('stone')).to.exist;
        });

        it('should work with custom player factions', function() {
            const customBar = new PlayerResourceInventoryBar({ playerFaction: 'team1' });
            
            mockEventBus.emit('ENTITY_REGISTERED', {
                type: 'resource',
                faction: 'team1',
                metadata: { resourceType: 'stone' }
            });
            
            expect(customBar.getResource('stone').caption).to.equal('1');
            
            mockEventBus.emit('ENTITY_REGISTERED', {
                type: 'resource',
                faction: 'player',
                metadata: { resourceType: 'stone' }
            });
            
            // Should still be 1 (not incremented for 'player' faction)
            expect(customBar.getResource('stone').caption).to.equal('1');
        });
    });
});
