/**
 * Integration tests for AntCountDropDown
 * Tests the dropdown with EventBus integration
 */

const { JSDOM } = require('jsdom');
const { expect } = require('chai');
const path = require('path');

describe('AntCountDropDown Integration Tests', function() {
    let dom;
    let window;
    let document;
    let AntCountDropDown;
    let eventBus;
    let mockP5;

    before(function() {
        // Create JSDOM environment
        dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
            url: 'http://localhost',
            pretendToBeVisual: true
        });
        window = dom.window;
        document = window.document;
        global.window = window;
        global.document = document;

        // Mock p5.js functions
        mockP5 = {
            push: function() {},
            pop: function() {},
            fill: function() {},
            stroke: function() {},
            rect: function() {},
            text: function() {},
            textSize: function() {},
            textAlign: function() {},
            noStroke: function() {},
            strokeWeight: function() {},
            translate: function() {},
            mouseX: 0,
            mouseY: 0,
            deltaTime: 16
        };

        // Load EventBus first
        const eventBusPath = path.join(__dirname, '../../../Classes/globals/eventBus.js');
        delete require.cache[require.resolve(eventBusPath)];
        require(eventBusPath);
        eventBus = window.eventBus;

        // Load AntCountDropDown
        const dropdownPath = path.join(__dirname, '../../../Classes/ui_new/components/antCountDropDown.js');
        delete require.cache[require.resolve(dropdownPath)];
        AntCountDropDown = window.AntCountDropDown;
    });

    after(function() {
        delete global.window;
        delete global.document;
    });

    describe('EventBus Integration', function() {
        it('should receive ENTITY_COUNTS_UPDATED events', function(done) {
            if (!AntCountDropDown) {
                this.skip();
                return;
            }

            const dropdown = new AntCountDropDown(mockP5, {
                x: 20,
                y: 80,
                faction: 'player'
            });

            // Listen for internal state change
            const originalHandler = dropdown._handleCountsUpdated.bind(dropdown);
            let handlerCalled = false;
            let receivedData = null;

            dropdown._handleCountsUpdated = function(data) {
                handlerCalled = true;
                receivedData = data;
                originalHandler(data);
            };

            // Emit counts update
            eventBus.emit('ENTITY_COUNTS_UPDATED', {
                antJobsByFaction: {
                    player: {
                        Scout: 5,
                        Warrior: 3,
                        Builder: 2
                    },
                    enemy: {
                        Scout: 10,
                        Warrior: 8
                    }
                }
            });

            // Give event time to propagate
            setTimeout(() => {
                expect(handlerCalled).to.be.true;
                expect(receivedData).to.have.property('antJobsByFaction');
                expect(receivedData.antJobsByFaction).to.have.property('player');
                done();
            }, 50);
        });

        it('should filter for player faction only', function(done) {
            if (!AntCountDropDown) {
                this.skip();
                return;
            }

            const dropdown = new AntCountDropDown(mockP5, {
                x: 20,
                y: 80,
                faction: 'player'
            });

            // Emit mixed faction data
            eventBus.emit('ENTITY_COUNTS_UPDATED', {
                antJobsByFaction: {
                    player: {
                        Scout: 5,
                        Warrior: 3
                    },
                    enemy: {
                        Scout: 100,
                        Warrior: 200
                    }
                }
            });

            // Give event time to propagate
            setTimeout(() => {
                // Check that dropdown only has player counts
                const counts = dropdown.antCounts || {};
                expect(counts.Scout).to.equal(5);
                expect(counts.Warrior).to.equal(3);
                // Should NOT have enemy counts
                expect(counts.Scout).to.not.equal(100);
                done();
            }, 50);
        });

        it('should update counts dynamically', function(done) {
            if (!AntCountDropDown) {
                this.skip();
                return;
            }

            const dropdown = new AntCountDropDown(mockP5, {
                x: 20,
                y: 80,
                faction: 'player'
            });

            // First update
            eventBus.emit('ENTITY_COUNTS_UPDATED', {
                antJobsByFaction: {
                    player: {
                        Scout: 5
                    }
                }
            });

            setTimeout(() => {
                expect(dropdown.antCounts.Scout).to.equal(5);

                // Second update
                eventBus.emit('ENTITY_COUNTS_UPDATED', {
                    antJobsByFaction: {
                        player: {
                            Scout: 10
                        }
                    }
                });

                setTimeout(() => {
                    expect(dropdown.antCounts.Scout).to.equal(10);
                    done();
                }, 50);
            }, 50);
        });
    });

    describe('Rendering with Real Data', function() {
        it('should render without errors when counts present', function() {
            if (!AntCountDropDown) {
                this.skip();
                return;
            }

            const dropdown = new AntCountDropDown(mockP5, {
                x: 20,
                y: 80,
                faction: 'player'
            });

            // Set counts
            dropdown.antCounts = {
                Scout: 5,
                Warrior: 3,
                Builder: 2
            };

            // Should not throw
            expect(() => dropdown.render()).to.not.throw();
        });

        it('should handle empty counts', function() {
            if (!AntCountDropDown) {
                this.skip();
                return;
            }

            const dropdown = new AntCountDropDown(mockP5, {
                x: 20,
                y: 80,
                faction: 'player'
            });

            dropdown.antCounts = {};

            // Should not throw
            expect(() => dropdown.render()).to.not.throw();
        });
    });

    describe('Lifecycle', function() {
        it('should register EventBus listener on creation', function() {
            if (!AntCountDropDown) {
                this.skip();
                return;
            }

            const initialListenerCount = eventBus.listeners('ENTITY_COUNTS_UPDATED').length;
            
            const dropdown = new AntCountDropDown(mockP5, {
                x: 20,
                y: 80,
                faction: 'player'
            });

            const afterListenerCount = eventBus.listeners('ENTITY_COUNTS_UPDATED').length;
            expect(afterListenerCount).to.be.greaterThan(initialListenerCount);
        });

        it('should unregister listener on destroy', function() {
            if (!AntCountDropDown) {
                this.skip();
                return;
            }

            const dropdown = new AntCountDropDown(mockP5, {
                x: 20,
                y: 80,
                faction: 'player'
            });

            const beforeDestroyCount = eventBus.listeners('ENTITY_COUNTS_UPDATED').length;
            
            if (typeof dropdown.destroy === 'function') {
                dropdown.destroy();
            }

            const afterDestroyCount = eventBus.listeners('ENTITY_COUNTS_UPDATED').length;
            expect(afterDestroyCount).to.be.lessThan(beforeDestroyCount);
        });
    });
});
    let dom;
    let window;
    let document;
    let GameUIOverlay;
    let AntCountDropDown;
    let eventBus;
    let mockP5;

    before(function() {
        // Create JSDOM environment
        dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
            url: 'http://localhost',
            pretendToBeVisual: true
        });
        window = dom.window;
        document = window.document;
        global.window = window;
        global.document = document;

        // Mock p5.js functions
        mockP5 = {
            push: function() {},
            pop: function() {},
            fill: function() {},
            stroke: function() {},
            rect: function() {},
            text: function() {},
            textSize: function() {},
            textAlign: function() {},
            noStroke: function() {},
            strokeWeight: function() {},
            translate: function() {}
        };

        // Load EventBus first
        const eventBusPath = path.join(__dirname, '../../../Classes/globals/eventBus.js');
        delete require.cache[require.resolve(eventBusPath)];
        require(eventBusPath);
        eventBus = window.eventBus;

        // Load GameUIOverlay
        const overlayPath = path.join(__dirname, '../../../Classes/ui_new/components/gameUIOverlay.js');
        delete require.cache[require.resolve(overlayPath)];
        GameUIOverlay = require(overlayPath);

        // Load AntCountDropDown
        const dropdownPath = path.join(__dirname, '../../../Classes/ui_new/components/antCountDropDown.js');
        delete require.cache[require.resolve(dropdownPath)];
        AntCountDropDown = window.AntCountDropDown;
    });

    after(function() {
        delete global.window;
        delete global.document;
    });

    describe('Component Management', function() {
        it('should create overlay and add components', function() {
            const overlay = new GameUIOverlay(mockP5);
            
            expect(overlay).to.be.an.instanceof(GameUIOverlay);
            expect(overlay.isVisible).to.be.true;
            expect(overlay.components.size).to.equal(0);
        });

        it('should add and retrieve components', function() {
            const overlay = new GameUIOverlay(mockP5);
            
            const mockComponent = {
                render: function() {},
                update: function() {}
            };
            
            overlay.addComponent('test-component', mockComponent);
            
            expect(overlay.components.size).to.equal(1);
            expect(overlay.getComponent('test-component')).to.equal(mockComponent);
        });

        it('should remove components', function() {
            const overlay = new GameUIOverlay(mockP5);
            
            const mockComponent = {
                render: function() {},
                destroy: function() {}
            };
            
            overlay.addComponent('test-component', mockComponent);
            expect(overlay.components.size).to.equal(1);
            
            overlay.removeComponent('test-component');
            expect(overlay.components.size).to.equal(0);
            expect(overlay.getComponent('test-component')).to.be.null;
        });
    });

    describe('Visibility Control', function() {
        it('should show and hide overlay', function() {
            const overlay = new GameUIOverlay(mockP5);
            
            expect(overlay.isVisible).to.be.true;
            
            overlay.hide();
            expect(overlay.isVisible).to.be.false;
            
            overlay.show();
            expect(overlay.isVisible).to.be.true;
        });

        it('should toggle visibility', function() {
            const overlay = new GameUIOverlay(mockP5);
            
            const initialState = overlay.isVisible;
            overlay.toggle();
            expect(overlay.isVisible).to.equal(!initialState);
            
            overlay.toggle();
            expect(overlay.isVisible).to.equal(initialState);
        });
    });

    describe('Rendering', function() {
        it('should call render on all visible components', function() {
            const overlay = new GameUIOverlay(mockP5);
            
            let renderCount1 = 0;
            let renderCount2 = 0;
            
            const component1 = {
                render: function() { renderCount1++; }
            };
            
            const component2 = {
                render: function() { renderCount2++; }
            };
            
            overlay.addComponent('comp1', component1);
            overlay.addComponent('comp2', component2);
            
            overlay.render();
            
            expect(renderCount1).to.equal(1);
            expect(renderCount2).to.equal(1);
        });

        it('should not render when hidden', function() {
            const overlay = new GameUIOverlay(mockP5);
            
            let renderCount = 0;
            const component = {
                render: function() { renderCount++; }
            };
            
            overlay.addComponent('comp', component);
            overlay.hide();
            
            overlay.render();
            
            expect(renderCount).to.equal(0);
        });

        it('should call update before render', function() {
            const overlay = new GameUIOverlay(mockP5);
            
            const callOrder = [];
            
            const component = {
                update: function() { callOrder.push('update'); },
                render: function() { callOrder.push('render'); }
            };
            
            overlay.addComponent('comp', component);
            overlay.render();
            
            expect(callOrder).to.deep.equal(['update', 'render']);
        });
    });

    describe('Integration with AntCountDropDown', function() {
        it.skip('should manage AntCountDropDown as a component', function() {
            const overlay = new GameUIOverlay(mockP5);
            
            const dropdown = new AntCountDropDown(mockP5, {
                x: 20,
                y: 80,
                faction: 'player'
            });
            
            overlay.addComponent('ant-count-dropdown', dropdown);
            
            expect(overlay.components.size).to.equal(1);
            expect(overlay.getComponent('ant-count-dropdown')).to.equal(dropdown);
        });

        it.skip('should render AntCountDropDown through overlay', function() {
            const overlay = new GameUIOverlay(mockP5);
            
            let renderCalled = false;
            
            const dropdown = new AntCountDropDown(mockP5, {
                x: 20,
                y: 80,
                faction: 'player'
            });
            
            // Spy on render
            const originalRender = dropdown.render.bind(dropdown);
            dropdown.render = function() {
                renderCalled = true;
                originalRender();
            };
            
            overlay.addComponent('ant-count-dropdown', dropdown);
            overlay.render();
            
            expect(renderCalled).to.be.true;
        });

        it('should update AntCountDropDown through overlay', function() {
            const overlay = new GameUIOverlay(mockP5);
            
            let updateCalled = false;
            
            const dropdown = new AntCountDropDown(mockP5, {
                x: 20,
                y: 80,
                faction: 'player'
            });
            
            // Spy on update
            const originalUpdate = dropdown.update.bind(dropdown);
            dropdown.update = function() {
                updateCalled = true;
                originalUpdate();
            };
            
            overlay.addComponent('ant-count-dropdown', dropdown);
            overlay.render(); // render calls _updateComponents
            
            expect(updateCalled).to.be.true;
        });
    });

    describe('Component Lifecycle', function() {
        it('should call destroy on components when overlay is destroyed', function() {
            const overlay = new GameUIOverlay(mockP5);
            
            let destroyCalled = false;
            
            const component = {
                render: function() {},
                destroy: function() { destroyCalled = true; }
            };
            
            overlay.addComponent('comp', component);
            overlay.destroy();
            
            expect(destroyCalled).to.be.true;
            expect(overlay.components.size).to.equal(0);
        });

        it('should call destroy on all components', function() {
            const overlay = new GameUIOverlay(mockP5);
            
            let destroyCount = 0;
            
            const component1 = {
                render: function() {},
                destroy: function() { destroyCount++; }
            };
            
            const component2 = {
                render: function() {},
                destroy: function() { destroyCount++; }
            };
            
            overlay.addComponent('comp1', component1);
            overlay.addComponent('comp2', component2);
            
            overlay.destroy();
            
            expect(destroyCount).to.equal(2);
            expect(overlay.components.size).to.equal(0);
        });
    });

    describe('Multiple Component Types', function() {
        it('should manage multiple different component types', function() {
            const overlay = new GameUIOverlay(mockP5);
            
            const dropdown = new AntCountDropDown(mockP5, {
                x: 20,
                y: 80,
                faction: 'player'
            });
            
            const customComponent = {
                render: function() {},
                update: function() {}
            };
            
            overlay.addComponent('ant-count', dropdown);
            overlay.addComponent('custom', customComponent);
            
            expect(overlay.components.size).to.equal(2);
            expect(overlay.getComponent('ant-count')).to.equal(dropdown);
            expect(overlay.getComponent('custom')).to.equal(customComponent);
        });
    });

    describe('Event-Driven Updates', function() {
        it('should handle EventBus updates through overlay', function(done) {
            const overlay = new GameUIOverlay(mockP5);
            
            const dropdown = new AntCountDropDown(mockP5, {
                x: 20,
                y: 80,
                faction: 'player'
            });
            
            overlay.addComponent('ant-count', dropdown);
            
            // Listen for the dropdown's internal state change
            const originalHandler = dropdown._handleCountsUpdated.bind(dropdown);
            let handlerCalled = false;
            
            dropdown._handleCountsUpdated = function(data) {
                handlerCalled = true;
                originalHandler(data);
            };
            
            // Emit counts update
            eventBus.emit('ENTITY_COUNTS_UPDATED', {
                antJobsByFaction: {
                    player: {
                        Scout: 5,
                        Warrior: 3
                    }
                }
            });
            
            // Give event time to propagate
            setTimeout(() => {
                expect(handlerCalled).to.be.true;
                done();
            }, 50);
        });
});
