const {expect} = require('chai');
const sinon = require('sinon');

describe('EventBus', () => {
    let eventBus;
    let spy1;
    let spy2;

    before(() => {
        eventBus = require('../../../Classes/globals/eventBus').default;
    });

    beforeEach(() => {
        spy1 = sinon.spy();
        spy2 = sinon.spy();
    });

    afterEach(() => {
        // Clear all listeners after each test
        eventBus.listeners = {};
    });

    it('should subscribe and emit events', () => {
        eventBus.on('test-event', spy1);
        eventBus.emit('test-event', { data: 123 });
        expect(spy1.calledOnce).to.be.true;
        expect(spy1.calledWith({ data: 123 })).to.be.true;
    });

    it('should unsubscribe from events', () => {
        eventBus.on('test-event', spy1);
        eventBus.off('test-event', spy1);
        eventBus.emit('test-event', { data: 123 });
        expect(spy1.notCalled).to.be.true;
    });

    it('should handle once subscriptions', () => {
        eventBus.once('test-once-event', spy1);
        eventBus.emit('test-once-event', { data: 456 });
        eventBus.emit('test-once-event', { data: 789 });
        expect(spy1.calledOnce).to.be.true;
        expect(spy1.calledWith({ data: 456 })).to.be.true;
    });

    it('should handle multiple listeners for the same event', () => {
        eventBus.on('multi-event', spy1);
        eventBus.on('multi-event', spy2);
        eventBus.emit('multi-event', { data: 'multi' });
        expect(spy1.calledOnce).to.be.true;
        expect(spy2.calledOnce).to.be.true;
    });

    it('should do nothing when emitting an event with no listeners', () => {
        expect(() => eventBus.emit('no-listeners-event', {})).to.not.throw();
    });

    it('should do nothing when unsubscribing from an event with no listeners', () => {
        expect(() => eventBus.off('no-listeners-event', () => {})).to.not.throw();
    });

    it('should not affect other listeners when unsubscribing one', () => {
        eventBus.on('test-event', spy1);
        eventBus.on('test-event', spy2);
        eventBus.off('test-event', spy1);
        eventBus.emit('test-event', { data: 'test' });
        expect(spy1.notCalled).to.be.true;
        expect(spy2.calledOnce).to.be.true;
    });

    it('should allow multiple subscriptions of the same listener', () => {
        eventBus.on('test-event', spy1);
        eventBus.on('test-event', spy1);
        eventBus.on('test-event', spy1);
        eventBus.emit('test-event', { data: 'test' });
        expect(spy1.calledThrice).to.be.true;
    });

    it ('should pass the correct data to listeners', () => {
        eventBus.on('data-event', spy1);
        const testData = { key: 'value' };
        eventBus.emit('data-event', testData);
        expect(spy1.calledWith(testData)).to.be.true;
    });

    it('should emit events with no data', () => {
        eventBus.on('no-data-event', spy1);
        eventBus.emit('no-data-event');
        expect(spy1.calledWith(undefined)).to.be.true;
    });

    it('should emit events with null data', () => {
        eventBus.on('null-data-event', spy1);
        eventBus.emit('null-data-event', null);
        expect(spy1.calledWith(null)).to.be.true;
    });

    it('should handle emitting events with object data', () => {
        eventBus.on('object-data-event', spy1);
        const objData = { a: 1, b: 2 };
        eventBus.emit('object-data-event', objData);
        expect(spy1.calledWith(objData)).to.be.true;
    });
});
/**
 * EventBus - A simple event bus implementation for communication between different parts of an application.
 * Provides methods to subscribe, unsubscribe, and emit events.
 */