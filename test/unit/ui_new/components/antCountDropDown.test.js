/**
 * Unit Tests for AntCountDropDown
 * TDD: Tests written FIRST before implementation
 * 
 * Purpose: Display ant counts for PLAYER FACTION ONLY
 */

const { expect } = require('chai');
const sinon = require('sinon');

describe('AntCountDropDown', function() {
    let AntCountDropDown;
    let dropDown;
    let mockP5;
    let mockEventBus;
    let DropDownMenu;
    let sandbox;
    
    beforeEach(function() {
        sandbox = sinon.createSandbox();
        
        // Mock p5 instance
        mockP5 = {
            width: 800,
            height: 600
        };
        
        // Mock EventBus
        mockEventBus = {
            on: sandbox.stub(),
            off: sandbox.stub(),
            emit: sandbox.stub(),
            once: sandbox.stub()
        };
        
        global.eventBus = mockEventBus;
        
        // Mock DropDownMenu class
        DropDownMenu = class MockDropDownMenu {
            constructor(p5, options) {
                this.p5 = p5;
                this.options = options;
                this.informationLines = new Map();
                this.titleLine = {
                    caption: options.titleLine?.caption || 'Menu',
                    setCaption: sandbox.stub(),
                    destroy: sandbox.stub()
                };
                this.arrowComponent = {
                    destroy: sandbox.stub()
                };
                this.addInformationLine = sandbox.stub().callsFake((opts) => {
                    const line = {
                        id: 'line-' + Date.now() + Math.random(),
                        caption: opts.caption,
                        setCaption: sandbox.stub()
                    };
                    this.informationLines.set(line.id, line);
                    return line;
                });
                this.removeInformationLine = sandbox.stub();
                this.render = sandbox.stub();
                this.update = sandbox.stub();
                this.destroy = sandbox.stub();
            }
        };
        
        global.DropDownMenu = DropDownMenu;
        
        // Clear require cache for AntCountDropDown to pick up mock
        delete require.cache[require.resolve('../../../../Classes/ui_new/components/antCountDropDown')];
        
        // Load module
        AntCountDropDown = require('../../../../Classes/ui_new/components/antCountDropDown');
    });
    
    afterEach(function() {
        if (dropDown) {
            dropDown.destroy();
            dropDown = null;
        }
        sandbox.restore();
        delete global.eventBus;
        delete global.DropDownMenu;
        delete require.cache[require.resolve('../../../../Classes/ui_new/components/antCountDropDown')];
    });
    
    describe('Constructor', function() {
        it('should create with default options', function() {
            dropDown = new AntCountDropDown(mockP5);
            
            expect(dropDown.p5).to.equal(mockP5);
            expect(dropDown.faction).to.equal('player');
        });
        
        it('should only support player faction', function() {
            dropDown = new AntCountDropDown(mockP5, { faction: 'player' });
            
            expect(dropDown.faction).to.equal('player');
        });
        
        it('should create DropDownMenu instance', function() {
            dropDown = new AntCountDropDown(mockP5);
            
            expect(dropDown.menu).to.exist;
            expect(dropDown.menu).to.be.instanceOf(DropDownMenu);
        });
        
        it('should set title to "Player Ants"', function() {
            dropDown = new AntCountDropDown(mockP5);
            
            expect(dropDown.menu.titleLine.caption).to.equal('Player Ants');
        });
    });
    
    describe('EventBus Integration', function() {
        beforeEach(function() {
            dropDown = new AntCountDropDown(mockP5);
        });
        
        it('should listen for ENTITY_REGISTERED events', function() {
            expect(mockEventBus.on.calledWith('ENTITY_REGISTERED')).to.be.true;
        });
        
        it('should listen for ENTITY_UNREGISTERED events', function() {
            expect(mockEventBus.on.calledWith('ENTITY_UNREGISTERED')).to.be.true;
        });
        
        it('should query EntityManager on initialization', function() {
            expect(mockEventBus.emit.calledWith('QUERY_ANT_DETAILS')).to.be.true;
        });
    });
    
    describe('Ant Count Updates', function() {
        beforeEach(function() {
            dropDown = new AntCountDropDown(mockP5);
            dropDown.menu.informationLines = new Map();
        });
        
        it('should update counts when receiving ANT_DETAILS_RESPONSE', function() {
            const listener = mockEventBus.on.getCalls()
                .find(call => call.args[0] === 'ANT_DETAILS_RESPONSE');
            
            expect(listener).to.exist;
            
            const callback = listener.args[1];
            callback({
                total: 15,
                breakdown: {
                    Worker: 8,
                    Scout: 4,
                    Soldier: 3
                }
            });
            
            expect(dropDown.antCounts.total).to.equal(15);
            expect(dropDown.antCounts.Worker).to.equal(8);
        });
        
        it('should only count player faction ants', function() {
            const entityRegisteredListener = mockEventBus.on.getCalls()
                .find(call => call.args[0] === 'ENTITY_REGISTERED');
            
            const callback = entityRegisteredListener.args[1];
            
            // Player ant
            callback({
                type: 'ant',
                faction: 'player',
                metadata: { jobName: 'Worker' }
            });
            
            expect(dropDown.antCounts.Worker).to.equal(1);
            
            // Enemy ant (should be ignored)
            callback({
                type: 'ant',
                faction: 'enemy',
                metadata: { jobName: 'Worker' }
            });
            
            expect(dropDown.antCounts.Worker).to.equal(1); // Still 1, not 2
        });
        
        it('should ignore non-ant entities', function() {
            const entityRegisteredListener = mockEventBus.on.getCalls()
                .find(call => call.args[0] === 'ENTITY_REGISTERED');
            
            const callback = entityRegisteredListener.args[1];
            
            callback({
                type: 'resource',
                faction: 'player',
                metadata: {}
            });
            
            expect(dropDown.antCounts.total).to.equal(0);
        });
    });
    
    describe('Display Lines', function() {
        beforeEach(function() {
            dropDown = new AntCountDropDown(mockP5);
            dropDown.menu.addInformationLine = sandbox.stub();
        });
        
        it('should create line for each ant job type', function() {
            dropDown._updateDisplay({
                Worker: 5,
                Scout: 3,
                Soldier: 2
            });
            
            expect(dropDown.menu.addInformationLine.callCount).to.equal(3);
        });
        
        it('should format line text correctly', function() {
            dropDown._updateDisplay({
                Worker: 5
            });
            
            const call = dropDown.menu.addInformationLine.firstCall;
            expect(call.args[0].caption).to.include('Worker');
            expect(call.args[0].caption).to.include('5');
        });
        
        it('should remove lines for zero counts', function() {
            dropDown.menu.removeInformationLine = sandbox.stub();
            dropDown.displayLines.set('Worker', 'worker-line-id');
            
            dropDown._updateDisplay({
                Scout: 3
            });
            
            expect(dropDown.menu.removeInformationLine.calledWith('worker-line-id')).to.be.true;
        });
    });
    
    describe('Rendering', function() {
        beforeEach(function() {
            dropDown = new AntCountDropDown(mockP5);
        });
        
        it('should delegate rendering to DropDownMenu', function() {
            dropDown.render();
            
            expect(dropDown.menu.render.calledOnce).to.be.true;
        });
        
        it('should call update before render', function() {
            dropDown.render();
            
            expect(dropDown.menu.update.calledBefore(dropDown.menu.render)).to.be.true;
        });
    });
    
    describe('Cleanup', function() {
        beforeEach(function() {
            dropDown = new AntCountDropDown(mockP5);
        });
        
        it('should remove EventBus listeners', function() {
            dropDown.destroy();
            
            expect(mockEventBus.off.calledWith('ENTITY_REGISTERED')).to.be.true;
            expect(mockEventBus.off.calledWith('ENTITY_UNREGISTERED')).to.be.true;
            expect(mockEventBus.off.calledWith('ANT_DETAILS_RESPONSE')).to.be.true;
        });
        
        it('should destroy menu', function() {
            dropDown.destroy();
            
            expect(dropDown.menu.destroy.calledOnce).to.be.true;
        });
    });
});
