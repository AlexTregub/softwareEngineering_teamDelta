/**
 * @fileoverview Unit Tests: EventManager JSON Export
 * 
 * Tests the exportToJSON() method added in Phase 2C.
 * Verifies that events and triggers are properly serialized to JSON.
 * 
 * Following TDD standards:
 * - Test isolated functionality
 * - Mock external dependencies
 * - Verify JSON structure and content
 */

const { expect } = require('chai');
const sinon = require('sinon');
const { JSDOM } = require('jsdom');

// Set up JSDOM
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.window = dom.window;
global.document = dom.window.document;

// Mock p5.js for JSDOM
global.createVector = sinon.stub().callsFake((x, y) => ({ x, y }));
window.createVector = global.createVector;

const EventManager = require('../../../Classes/managers/EventManager');

describe('EventManager - exportToJSON()', function() {
  let manager;
  
  beforeEach(function() {
    manager = new EventManager();
  });
  
  afterEach(function() {
    sinon.restore();
  });
  
  describe('Basic Export', function() {
    it('should export empty configuration', function() {
      const json = manager.exportToJSON();
      const parsed = JSON.parse(json);
      
      expect(parsed).to.be.an('object');
      expect(parsed.events).to.be.an('array').with.lengthOf(0);
      expect(parsed.triggers).to.be.an('array').with.lengthOf(0);
      expect(parsed.exportedAt).to.be.a('string');
    });
    
    it('should export single event', function() {
      manager.registerEvent({
        id: 'test-event',
        type: 'dialogue',
        priority: 5,
        content: { message: 'Test' }
      });
      
      const json = manager.exportToJSON();
      const parsed = JSON.parse(json);
      
      expect(parsed.events).to.have.lengthOf(1);
      expect(parsed.events[0].id).to.equal('test-event');
      expect(parsed.events[0].type).to.equal('dialogue');
      expect(parsed.events[0].priority).to.equal(5);
      expect(parsed.events[0].content).to.deep.equal({ message: 'Test' });
    });
    
    it('should export multiple events', function() {
      manager.registerEvent({
        id: 'event-1',
        type: 'dialogue',
        priority: 1,
        content: { message: 'First' }
      });
      
      manager.registerEvent({
        id: 'event-2',
        type: 'spawn',
        priority: 2,
        content: { entityType: 'ant' }
      });
      
      const json = manager.exportToJSON();
      const parsed = JSON.parse(json);
      
      expect(parsed.events).to.have.lengthOf(2);
      expect(parsed.events.map(e => e.id)).to.include.members(['event-1', 'event-2']);
    });
  });
  
  describe('Function Removal', function() {
    it('should remove onTrigger function', function() {
      manager.registerEvent({
        id: 'test-event',
        type: 'dialogue',
        onTrigger: () => { console.log('triggered'); }
      });
      
      const json = manager.exportToJSON();
      const parsed = JSON.parse(json);
      
      expect(parsed.events[0].onTrigger).to.be.undefined;
    });
    
    it('should remove onComplete function', function() {
      manager.registerEvent({
        id: 'test-event',
        type: 'dialogue',
        onComplete: () => { console.log('completed'); }
      });
      
      const json = manager.exportToJSON();
      const parsed = JSON.parse(json);
      
      expect(parsed.events[0].onComplete).to.be.undefined;
    });
    
    it('should remove onPause function', function() {
      manager.registerEvent({
        id: 'test-event',
        type: 'dialogue',
        onPause: () => { console.log('paused'); }
      });
      
      const json = manager.exportToJSON();
      const parsed = JSON.parse(json);
      
      expect(parsed.events[0].onPause).to.be.undefined;
    });
    
    it('should remove update function', function() {
      manager.registerEvent({
        id: 'test-event',
        type: 'dialogue',
        update: (deltaTime) => { console.log('updating'); }
      });
      
      const json = manager.exportToJSON();
      const parsed = JSON.parse(json);
      
      expect(parsed.events[0].update).to.be.undefined;
    });
  });
  
  describe('Active State Export', function() {
    it('should exclude active state by default', function() {
      manager.registerEvent({
        id: 'test-event',
        type: 'dialogue'
      });
      
      const json = manager.exportToJSON();
      const parsed = JSON.parse(json);
      
      expect(parsed.events[0].active).to.be.undefined;
      expect(parsed.events[0].paused).to.be.undefined;
    });
    
    it('should include active state when requested', function() {
      manager.registerEvent({
        id: 'test-event',
        type: 'dialogue'
      });
      
      // Trigger event to make it active
      manager.triggerEvent('test-event');
      
      const json = manager.exportToJSON(true);
      const parsed = JSON.parse(json);
      
      expect(parsed.events[0].active).to.be.a('boolean');
      expect(parsed.events[0].paused).to.be.a('boolean');
    });
  });
  
  describe('Trigger Export', function() {
    it('should export registered triggers', function() {
      manager.registerTrigger({
        type: 'time',
        eventId: 'test-event',
        delay: 5000
      });
      
      const json = manager.exportToJSON();
      const parsed = JSON.parse(json);
      
      expect(parsed.triggers).to.have.lengthOf(1);
      // ID is auto-generated, so check other properties
      expect(parsed.triggers[0].type).to.equal('time');
      expect(parsed.triggers[0].eventId).to.equal('test-event');
      expect(parsed.triggers[0].delay).to.equal(5000);
      expect(parsed.triggers[0].id).to.be.a('string'); // Should have an ID
    });
    
    it('should remove internal trigger state', function() {
      manager.registerTrigger({
        type: 'time',
        eventId: 'test-event',
        delay: 5000
      });
      
      const json = manager.exportToJSON();
      const parsed = JSON.parse(json);
      
      expect(parsed.triggers[0]._startTime).to.be.undefined;
      expect(parsed.triggers[0]._lastCheckTime).to.be.undefined;
    });
  });
  
  describe('Import/Export Roundtrip', function() {
    it('should preserve event data through export/import cycle', function() {
      // Create original event
      manager.registerEvent({
        id: 'roundtrip-event',
        type: 'dialogue',
        priority: 3,
        content: { message: 'Original message' }
      });
      
      // Export
      const json = manager.exportToJSON();
      
      // Create new manager and import
      const newManager = new EventManager();
      const success = newManager.loadFromJSON(json);
      
      expect(success).to.be.true;
      
      const imported = newManager.getEvent('roundtrip-event');
      expect(imported).to.exist;
      expect(imported.id).to.equal('roundtrip-event');
      expect(imported.type).to.equal('dialogue');
      expect(imported.priority).to.equal(3);
      expect(imported.content).to.deep.equal({ message: 'Original message' });
    });
    
    it('should preserve trigger data through export/import cycle', function() {
      manager.registerTrigger({
        type: 'flag',
        eventId: 'test-event',
        flagName: 'test_flag'
      });
      
      const json = manager.exportToJSON();
      
      const newManager = new EventManager();
      const success = newManager.loadFromJSON(json);
      
      expect(success).to.be.true;
      
      // Get the first trigger (ID was auto-generated)
      const triggers = Array.from(newManager.triggers.values());
      expect(triggers).to.have.lengthOf(1);
      
      const imported = triggers[0];
      expect(imported.type).to.equal('flag');
      expect(imported.eventId).to.equal('test-event');
      expect(imported.flagName).to.equal('test_flag');
    });
  });
  
  describe('JSON Structure', function() {
    it('should have correct top-level structure', function() {
      const json = manager.exportToJSON();
      const parsed = JSON.parse(json);
      
      expect(parsed).to.have.property('events');
      expect(parsed).to.have.property('triggers');
      expect(parsed).to.have.property('exportedAt');
    });
    
    it('should include ISO timestamp', function() {
      const json = manager.exportToJSON();
      const parsed = JSON.parse(json);
      
      expect(parsed.exportedAt).to.be.a('string');
      // Verify it's a valid ISO date string
      const date = new Date(parsed.exportedAt);
      expect(date.toISOString()).to.equal(parsed.exportedAt);
    });
    
    it('should format JSON with indentation', function() {
      manager.registerEvent({
        id: 'test-event',
        type: 'dialogue'
      });
      
      const json = manager.exportToJSON();
      
      // Should have newlines and indentation (not minified)
      expect(json).to.include('\n');
      expect(json).to.include('  '); // 2-space indent
    });
  });
});
