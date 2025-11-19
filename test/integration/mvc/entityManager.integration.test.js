/**
 * @fileoverview Integration tests for EntityManager with MVC ant system
 * Tests entity registration, querying, and selection
 */

const { JSDOM } = require('jsdom');
const { expect } = require('chai');
const path = require('path');
const fs = require('fs');

describe('EntityManager Integration Tests', function() {
  let dom;
  let window;
  let document;

  before(function() {
    // Create JSDOM environment
    const html = '<!DOCTYPE html><html><body><div id="canvas-container"></div></body></html>';
    dom = new JSDOM(html, {
      url: 'http://localhost',
      pretendToBeVisual: true,
      resources: 'usable'
    });

    window = dom.window;
    document = window.document;
    global.window = window;
    global.document = document;

    // Load EntityManager
    const entityManagerPath = path.resolve(__dirname, '../../../Classes/managers/EntityManager.js');
    const entityManagerCode = fs.readFileSync(entityManagerPath, 'utf8');
    eval(entityManagerCode);
  });

  after(function() {
    delete global.window;
    delete global.document;
  });

  describe('EntityManager instantiation', function() {
    it('should create a new EntityManager instance', function() {
      const manager = new window.EntityManager();
      expect(manager).to.exist;
      expect(manager).to.be.instanceOf(window.EntityManager);
    });

    it('should have getEntitiesByType method', function() {
      const manager = new window.EntityManager();
      expect(manager.getEntitiesByType).to.be.a('function');
    });

    it('should have getAllEntities method', function() {
      const manager = new window.EntityManager();
      expect(manager.getAllEntities).to.be.a('function');
    });

    it('should return empty array for getEntitiesByType when no entities', function() {
      const manager = new window.EntityManager();
      const ants = manager.getEntitiesByType('Ant');
      expect(ants).to.be.an('array');
      expect(ants).to.have.lengthOf(0);
    });
  });

  describe('Entity registration', function() {
    it('should register entity with _registerEntity', function() {
      const manager = new window.EntityManager();
      
      const mockEntity = {
        id: 'ant_001',
        type: 'Ant',
        faction: 'player'
      };

      manager._registerEntity(mockEntity);
      
      const entities = manager.getAllEntities();
      expect(entities).to.have.lengthOf(1);
      expect(entities[0].id).to.equal('ant_001');
    });

    it('should filter entities by type', function() {
      const manager = new window.EntityManager();
      
      manager._registerEntity({ id: 'ant_001', type: 'Ant' });
      manager._registerEntity({ id: 'ant_002', type: 'Ant' });
      manager._registerEntity({ id: 'resource_001', type: 'Resource' });

      const ants = manager.getEntitiesByType('Ant');
      expect(ants).to.have.lengthOf(2);
      
      const resources = manager.getEntitiesByType('Resource');
      expect(resources).to.have.lengthOf(1);
    });

    it('should handle case-sensitive type matching', function() {
      const manager = new window.EntityManager();
      
      manager._registerEntity({ id: 'ant_001', type: 'Ant' });

      const ants = manager.getEntitiesByType('Ant');
      expect(ants).to.have.lengthOf(1);
      
      const antsLower = manager.getEntitiesByType('ant');
      expect(antsLower).to.have.lengthOf(0);
    });
  });

  describe('EntityManager in window context', function() {
    it('should be accessible as window.EntityManager', function() {
      expect(window.EntityManager).to.exist;
      expect(window.EntityManager).to.be.a('function');
    });

    it('should create instance accessible as window.entityManager', function() {
      window.entityManager = new window.EntityManager();
      expect(window.entityManager).to.exist;
      expect(window.entityManager.getEntitiesByType).to.be.a('function');
    });

    it('should return correct type after registration', function() {
      window.entityManager = new window.EntityManager();
      
      const mockAnt = {
        id: 'test_ant_001',
        type: 'Ant',
        controller: {
          getController: () => null
        }
      };

      window.entityManager._registerEntity(mockAnt);
      
      const ants = window.entityManager.getEntitiesByType('Ant');
      expect(ants).to.be.an('array');
      expect(ants).to.have.lengthOf(1);
      expect(ants[0].type).to.equal('Ant');
    });
  });

  describe('MVC Ant integration', function() {
    it('should work with MVC ant structure', function() {
      const manager = new window.EntityManager();

      // Mock MVC ant
      const mockAnt = {
        id: 'ant_mvc_001',
        type: 'Ant',
        model: {
          getPosition: () => ({ x: 100, y: 200 }),
          selected: false
        },
        view: {
          render: () => {}
        },
        controller: {
          getController: (name) => {
            if (name === 'selection') {
              return {
                setSelected: (val) => { mockAnt.model.selected = val; },
                containsPoint: () => false
              };
            }
            return null;
          }
        }
      };

      manager._registerEntity(mockAnt);

      const ants = manager.getEntitiesByType('Ant');
      expect(ants).to.have.lengthOf(1);
      
      const ant = ants[0];
      expect(ant.controller).to.exist;
      expect(ant.controller.getController).to.be.a('function');
      
      const selection = ant.controller.getController('selection');
      expect(selection).to.exist;
      expect(selection.setSelected).to.be.a('function');
    });
  });
});
