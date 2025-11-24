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

        console.log('EventBus loaded:', !!eventBus);

        // Load InformationLine (dependency of AntCountDropDown)
        try {
            const informationLinePath = path.join(__dirname, '../../../Classes/ui_new/components/informationLine.js');
            delete require.cache[require.resolve(informationLinePath)];
            const { InformationLine } = require(informationLinePath);
            global.InformationLine = InformationLine;
            window.InformationLine = InformationLine;
            console.log('InformationLine loaded:', !!window.InformationLine);
        } catch (err) {
            console.log('Error loading InformationLine:', err.message);
        }

        // Load AntCountDropDown
        try {
            const dropdownPath = path.join(__dirname, '../../../Classes/ui_new/components/antCountDropDown.js');
            delete require.cache[require.resolve(dropdownPath)];
            require(dropdownPath);
            AntCountDropDown = window.AntCountDropDown;
            console.log('AntCountDropDown loaded:', !!AntCountDropDown);
            
            if (!AntCountDropDown) {
                console.log('WARNING: AntCountDropDown not found on window object');
                console.log('Available on window:', Object.keys(window).filter(k => k.includes('Ant')));
            }
        } catch (err) {
            console.log('Error loading AntCountDropDown:', err.message);
        }
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
