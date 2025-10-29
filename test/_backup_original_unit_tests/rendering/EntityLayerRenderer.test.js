const { expect } = require('chai');
const path = require('path');

describe('EntityLayerRenderer (EntityRenderer)', () => {
  let EntityRenderer;
  
  before(() => {
    // Mock p5.js globals
    global.push = () => {};
    global.pop = () => {};
    global.stroke = () => {};
    global.strokeWeight = () => {};
    global.noFill = () => {};
    global.rect = () => {};
    global.fill = () => {};
    global.textAlign = () => {};
    global.textSize = () => {};
    global.text = () => {};
    global.LEFT = 'left';
    global.TOP = 'top';
    global.performance = {
      now: () => Date.now()
    };
    
    // Mock game globals
    global.g_canvasX = 800;
    global.g_canvasY = 600;
    global.ants = [];
    global.antsUpdate = () => {};
    global.g_resourceList = { resources: [], updateAll: () => {} };
    global.Buildings = [];
    global.g_performanceMonitor = null;
    
    // Mock EntityAccessor
    global.EntityAccessor = {
      getPosition: (entity) => {
        return entity.sprite?.pos || { x: entity.posX || entity.x || 0, y: entity.posY || entity.y || 0 };
      },
      getSizeWH: (entity) => {
        return entity.sprite?.size || { width: entity.sizeX || entity.width || 20, height: entity.sizeY || entity.height || 20 };
      }
    };
    
    // Load the class
    const entityRendererPath = path.join(__dirname, '../../../Classes/rendering/EntityLayerRenderer.js');
    EntityRenderer = require(entityRendererPath);
  });
  
  afterEach(() => {
    // Reset globals
    global.ants = [];
    global.g_resourceList = { resources: [], updateAll: () => {} };
    global.Buildings = [];
    global.g_performanceMonitor = null;
    
    // Clean up instances
    if (typeof window !== 'undefined' && window.EntityRenderer) {
      delete window.EntityRenderer;
    }
    if (typeof global !== 'undefined' && global.EntityRenderer) {
      delete global.EntityRenderer;
    }
  });
  
  describe('Constructor', () => {
    it('should initialize render groups', () => {
      const renderer = new EntityRenderer();
      
      expect(renderer.renderGroups).to.exist;
      expect(renderer.renderGroups.BACKGROUND).to.be.an('array').that.is.empty;
      expect(renderer.renderGroups.RESOURCES).to.be.an('array').that.is.empty;
      expect(renderer.renderGroups.ANTS).to.be.an('array').that.is.empty;
      expect(renderer.renderGroups.EFFECTS).to.be.an('array').that.is.empty;
      expect(renderer.renderGroups.FOREGROUND).to.be.an('array').that.is.empty;
    });
    
    it('should initialize with default configuration', () => {
      const renderer = new EntityRenderer();
      
      expect(renderer.config).to.exist;
      expect(renderer.config.enableDepthSorting).to.be.true;
      expect(renderer.config.enableFrustumCulling).to.be.true;
      expect(renderer.config.enableBatching).to.be.true;
      expect(renderer.config.maxBatchSize).to.equal(100);
      expect(renderer.config.cullMargin).to.equal(50);
    });
    
    it('should initialize performance stats', () => {
      const renderer = new EntityRenderer();
      
      expect(renderer.stats).to.exist;
      expect(renderer.stats.totalEntities).to.equal(0);
      expect(renderer.stats.renderedEntities).to.equal(0);
      expect(renderer.stats.culledEntities).to.equal(0);
      expect(renderer.stats.renderTime).to.equal(0);
      expect(renderer.stats.lastFrameStats).to.deep.equal({});
    });
    
    it('should have exactly 5 render groups', () => {
      const renderer = new EntityRenderer();
      
      const groupNames = Object.keys(renderer.renderGroups);
      expect(groupNames).to.have.lengthOf(5);
    });
  });
  
  describe('Entity Collection', () => {
    it('should collect resources from global resource list', () => {
      const renderer = new EntityRenderer();
      global.g_resourceList.resources = [
        { x: 100, y: 100, width: 20, height: 20 },
        { x: 200, y: 200, width: 20, height: 20 }
      ];
      
      renderer.collectEntities('PLAYING');
      
      expect(renderer.renderGroups.RESOURCES).to.have.lengthOf(2);
      expect(renderer.stats.totalEntities).to.equal(2);
    });
    
    it('should collect ants from global ants array', () => {
      const renderer = new EntityRenderer();
      global.ants = [
        { x: 100, y: 100, width: 20, height: 20 },
        { x: 200, y: 200, width: 20, height: 20 },
        { x: 300, y: 300, width: 20, height: 20 }
      ];
      
      renderer.collectEntities('PLAYING');
      
      expect(renderer.renderGroups.ANTS).to.have.lengthOf(3);
      expect(renderer.stats.totalEntities).to.equal(3);
    });
    
    it('should collect buildings from global Buildings array', () => {
      const renderer = new EntityRenderer();
      global.Buildings = [
        { x: 150, y: 150, width: 50, height: 50 }
      ];
      
      renderer.collectEntities('PLAYING');
      
      expect(renderer.renderGroups.BACKGROUND).to.have.lengthOf(1);
      expect(renderer.stats.totalEntities).to.equal(1);
    });
    
    it('should skip null entities in ants array', () => {
      const renderer = new EntityRenderer();
      global.ants = [
        { x: 100, y: 100 },
        null,
        { x: 200, y: 200 },
        undefined
      ];
      
      renderer.collectEntities('PLAYING');
      
      expect(renderer.renderGroups.ANTS).to.have.lengthOf(2);
    });
    
    it('should call updateAll on resources in PLAYING state', () => {
      const renderer = new EntityRenderer();
      let updateCalled = false;
      global.g_resourceList = {
        resources: [{ x: 100, y: 100 }],
        updateAll: () => { updateCalled = true; }
      };
      
      renderer.collectEntities('PLAYING');
      
      expect(updateCalled).to.be.true;
    });
    
    it('should call antsUpdate in PLAYING state', () => {
      const renderer = new EntityRenderer();
      let updateCalled = false;
      global.antsUpdate = () => { updateCalled = true; };
      global.ants = [{ x: 100, y: 100 }];
      
      renderer.collectEntities('PLAYING');
      
      expect(updateCalled).to.be.true;
    });
    
    it('should call building update in PLAYING state', () => {
      const renderer = new EntityRenderer();
      let updateCalled = false;
      global.Buildings = [{
        x: 100,
        y: 100,
        update: () => { updateCalled = true; }
      }];
      
      renderer.collectEntities('PLAYING');
      
      expect(updateCalled).to.be.true;
    });
    
    it('should handle missing resource list gracefully', () => {
      const renderer = new EntityRenderer();
      global.g_resourceList = null;
      
      expect(() => renderer.collectEntities('PLAYING')).to.not.throw();
    });
    
    it('should clear render groups before collecting', () => {
      const renderer = new EntityRenderer();
      renderer.renderGroups.ANTS = [{ entity: 'old' }];
      global.ants = [{ x: 100, y: 100 }];
      
      renderer.collectEntities('PLAYING');
      
      expect(renderer.renderGroups.ANTS).to.have.lengthOf(1);
      expect(renderer.renderGroups.ANTS[0].entity).to.not.equal('old');
    });
  });
  
  describe('Frustum Culling', () => {
    it('should render entity within viewport', () => {
      const renderer = new EntityRenderer();
      const entity = { x: 400, y: 300, width: 20, height: 20 }; // Center of screen
      
      const result = renderer.shouldRenderEntity(entity);
      
      expect(result).to.be.true;
    });
    
    it('should cull entity outside viewport', () => {
      const renderer = new EntityRenderer();
      const entity = { x: 2000, y: 2000, width: 20, height: 20 }; // Way off screen
      
      const result = renderer.shouldRenderEntity(entity);
      
      expect(result).to.be.false;
    });
    
    it('should render entity partially in viewport', () => {
      const renderer = new EntityRenderer();
      const entity = { x: -10, y: -10, width: 50, height: 50 }; // Partially on screen
      
      const result = renderer.shouldRenderEntity(entity);
      
      expect(result).to.be.true;
    });
    
    it('should respect cull margin', () => {
      const renderer = new EntityRenderer();
      renderer.config.cullMargin = 100;
      const entity = { x: global.g_canvasX + 50, y: 300, width: 20, height: 20 }; // Just outside viewport but within margin
      
      const result = renderer.shouldRenderEntity(entity);
      
      expect(result).to.be.true;
    });
    
    it('should skip culling when disabled', () => {
      const renderer = new EntityRenderer();
      renderer.config.enableFrustumCulling = false;
      const entity = { x: 5000, y: 5000, width: 20, height: 20 };
      
      const result = renderer.shouldRenderEntity(entity);
      
      expect(result).to.be.true;
    });
    
    it('should not render inactive entities', () => {
      const renderer = new EntityRenderer();
      const entity = { x: 400, y: 300, width: 20, height: 20, isActive: false };
      
      const result = renderer.shouldRenderEntity(entity);
      
      expect(result).to.be.false;
    });
    
    it('should render when position cannot be determined', () => {
      const renderer = new EntityRenderer();
      global.EntityAccessor.getPosition = () => null;
      const entity = { x: 100, y: 100 };
      
      const result = renderer.shouldRenderEntity(entity);
      
      // Reset EntityAccessor
      global.EntityAccessor.getPosition = (entity) => {
        return { x: entity.x || 0, y: entity.y || 0 };
      };
      
      expect(result).to.be.true;
    });
  });
  
  describe('Depth Sorting', () => {
    it('should sort entities by Y position (depth)', () => {
      const renderer = new EntityRenderer();
      global.ants = [
        { x: 100, y: 300 }, // Higher Y = more depth
        { x: 100, y: 100 },
        { x: 100, y: 200 }
      ];
      
      renderer.collectEntities('PLAYING');
      renderer.sortEntitiesByDepth();
      
      expect(renderer.renderGroups.ANTS[0].depth).to.equal(100);
      expect(renderer.renderGroups.ANTS[1].depth).to.equal(200);
      expect(renderer.renderGroups.ANTS[2].depth).to.equal(300);
    });
    
    it('should sort all render groups', () => {
      const renderer = new EntityRenderer();
      global.ants = [
        { x: 100, y: 300 },
        { x: 100, y: 100 }
      ];
      global.g_resourceList.resources = [
        { x: 50, y: 250 },
        { x: 50, y: 50 }
      ];
      
      renderer.collectEntities('PLAYING');
      renderer.sortEntitiesByDepth();
      
      expect(renderer.renderGroups.ANTS[0].depth).to.be.lessThan(renderer.renderGroups.ANTS[1].depth);
      expect(renderer.renderGroups.RESOURCES[0].depth).to.be.lessThan(renderer.renderGroups.RESOURCES[1].depth);
    });
    
    it('should skip sorting when disabled', () => {
      const renderer = new EntityRenderer();
      renderer.config.enableDepthSorting = false;
      global.ants = [
        { x: 100, y: 300 },
        { x: 100, y: 100 }
      ];
      
      renderer.collectEntities('PLAYING');
      const beforeSort = [...renderer.renderGroups.ANTS];
      renderer.sortEntitiesByDepth();
      
      // Order should remain unchanged
      expect(renderer.renderGroups.ANTS[0]).to.equal(beforeSort[0]);
    });
    
    it('should handle entities with same depth', () => {
      const renderer = new EntityRenderer();
      global.ants = [
        { x: 100, y: 100 },
        { x: 200, y: 100 },
        { x: 300, y: 100 }
      ];
      
      renderer.collectEntities('PLAYING');
      
      expect(() => renderer.sortEntitiesByDepth()).to.not.throw();
    });
  });
  
  describe('Entity Position and Size', () => {
    it('should get entity position using EntityAccessor', () => {
      const renderer = new EntityRenderer();
      const entity = { x: 123, y: 456 };
      
      const pos = renderer.getEntityPosition(entity);
      
      expect(pos.x).to.equal(123);
      expect(pos.y).to.equal(456);
    });
    
    it('should get entity size using EntityAccessor', () => {
      const renderer = new EntityRenderer();
      const entity = { width: 30, height: 40 };
      
      const size = renderer.getEntitySize(entity);
      
      expect(size.width).to.equal(30);
      expect(size.height).to.equal(40);
    });
    
    it('should get entity depth from Y position', () => {
      const renderer = new EntityRenderer();
      const entity = { x: 100, y: 250 };
      
      const depth = renderer.getEntityDepth(entity);
      
      expect(depth).to.equal(250);
    });
    
    it('should use 0 depth if position unavailable', () => {
      const renderer = new EntityRenderer();
      const entity = {};
      
      const depth = renderer.getEntityDepth(entity);
      
      expect(depth).to.equal(0);
    });
  });
  
  describe('Render Group Management', () => {
    it('should clear all render groups', () => {
      const renderer = new EntityRenderer();
      renderer.renderGroups.ANTS = [{ entity: 'test' }];
      renderer.renderGroups.RESOURCES = [{ entity: 'test' }];
      
      renderer.clearRenderGroups();
      
      expect(renderer.renderGroups.ANTS).to.be.empty;
      expect(renderer.renderGroups.RESOURCES).to.be.empty;
    });
    
    it('should render standard group with render method', () => {
      const renderer = new EntityRenderer();
      let renderCalled = 0;
      const entityGroup = [
        { entity: { render: () => { renderCalled++; } } },
        { entity: { render: () => { renderCalled++; } } }
      ];
      
      renderer.renderEntityGroupStandard(entityGroup);
      
      expect(renderCalled).to.equal(2);
      expect(renderer.stats.renderedEntities).to.equal(2);
    });
    
    it('should skip entities without render method', () => {
      const renderer = new EntityRenderer();
      const entityGroup = [
        { entity: {} },
        { entity: { render: () => {} } }
      ];
      
      expect(() => renderer.renderEntityGroupStandard(entityGroup)).to.not.throw();
      expect(renderer.stats.renderedEntities).to.equal(1);
    });
    
    it('should handle render errors gracefully', () => {
      const renderer = new EntityRenderer();
      const entityGroup = [
        { entity: { render: () => { throw new Error('Render error'); } } },
        { entity: { render: () => {} } }
      ];
      
      const consoleWarn = console.warn;
      let warnCalled = false;
      console.warn = () => { warnCalled = true; };
      
      renderer.renderEntityGroupStandard(entityGroup);
      
      console.warn = consoleWarn;
      expect(warnCalled).to.be.true;
      expect(renderer.stats.renderedEntities).to.equal(1);
    });
    
    it('should use batched rendering for large groups', () => {
      const renderer = new EntityRenderer();
      renderer.config.maxBatchSize = 5;
      const largeGroup = Array(10).fill(null).map(() => ({ entity: { render: () => {} } }));
      
      renderer.renderGroup(largeGroup);
      
      expect(renderer.stats.renderedEntities).to.equal(10);
    });
    
    it('should use standard rendering for small groups', () => {
      const renderer = new EntityRenderer();
      renderer.config.maxBatchSize = 100;
      const smallGroup = [
        { entity: { render: () => {} } },
        { entity: { render: () => {} } }
      ];
      
      renderer.renderGroup(smallGroup);
      
      expect(renderer.stats.renderedEntities).to.equal(2);
    });
    
    it('should skip empty groups', () => {
      const renderer = new EntityRenderer();
      
      expect(() => renderer.renderGroup([])).to.not.throw();
      expect(renderer.stats.renderedEntities).to.equal(0);
    });
  });
  
  describe('Performance Monitoring Integration', () => {
    it('should track render phases with performance monitor', () => {
      const renderer = new EntityRenderer();
      let phasesStarted = [];
      let phasesEnded = 0;
      
      global.g_performanceMonitor = {
        startRenderPhase: (phase) => { phasesStarted.push(phase); },
        endRenderPhase: () => { phasesEnded++; },
        recordEntityStats: () => {},
        finalizeEntityPerformance: () => {}
      };
      
      renderer.renderAllLayers('PLAYING');
      
      expect(phasesStarted).to.include('preparation');
      expect(phasesStarted).to.include('culling');
      expect(phasesStarted).to.include('rendering');
      expect(phasesStarted).to.include('postProcessing');
      expect(phasesEnded).to.equal(4);
    });
    
    it('should record entity stats with performance monitor', () => {
      const renderer = new EntityRenderer();
      let statsRecorded = false;
      
      global.g_performanceMonitor = {
        startRenderPhase: () => {},
        endRenderPhase: () => {},
        recordEntityStats: (total, rendered, culled, breakdown) => {
          statsRecorded = true;
          expect(total).to.be.a('number');
          expect(rendered).to.be.a('number');
          expect(culled).to.be.a('number');
        },
        finalizeEntityPerformance: () => {}
      };
      
      renderer.renderAllLayers('PLAYING');
      
      expect(statsRecorded).to.be.true;
    });
    
    it('should finalize entity performance', () => {
      const renderer = new EntityRenderer();
      let finalizeCalled = false;
      
      global.g_performanceMonitor = {
        startRenderPhase: () => {},
        endRenderPhase: () => {},
        recordEntityStats: () => {},
        finalizeEntityPerformance: () => { finalizeCalled = true; }
      };
      
      renderer.renderAllLayers('PLAYING');
      
      expect(finalizeCalled).to.be.true;
    });
    
    it('should track entity render time', () => {
      const renderer = new EntityRenderer();
      let startCalled = false;
      let endCalled = false;
      
      global.g_performanceMonitor = {
        startRenderPhase: () => {},
        endRenderPhase: () => {},
        recordEntityStats: () => {},
        finalizeEntityPerformance: () => {},
        startEntityRender: () => { startCalled = true; },
        endEntityRender: () => { endCalled = true; }
      };
      
      global.ants = [{ x: 100, y: 100, render: () => {} }];
      
      renderer.collectEntities('PLAYING');
      renderer.renderEntityGroupStandard(renderer.renderGroups.ANTS);
      
      expect(startCalled).to.be.true;
      expect(endCalled).to.be.true;
    });
    
    it('should work without performance monitor', () => {
      const renderer = new EntityRenderer();
      global.g_performanceMonitor = null;
      
      expect(() => renderer.renderAllLayers('PLAYING')).to.not.throw();
    });
  });
  
  describe('Main Render Method', () => {
    it('should reset stats at start of render', () => {
      const renderer = new EntityRenderer();
      renderer.stats.totalEntities = 100;
      renderer.stats.renderedEntities = 50;
      renderer.stats.culledEntities = 50;
      
      renderer.renderAllLayers('PLAYING');
      
      expect(renderer.stats.totalEntities).to.equal(0);
      expect(renderer.stats.renderedEntities).to.equal(0);
      expect(renderer.stats.culledEntities).to.equal(0);
    });
    
    it('should track render time', () => {
      const renderer = new EntityRenderer();
      
      renderer.renderAllLayers('PLAYING');
      
      expect(renderer.stats.renderTime).to.be.a('number');
      expect(renderer.stats.renderTime).to.be.at.least(0);
    });
    
    it('should store last frame stats', () => {
      const renderer = new EntityRenderer();
      global.ants = [{ x: 100, y: 100, render: () => {} }];
      
      renderer.renderAllLayers('PLAYING');
      
      expect(renderer.stats.lastFrameStats).to.exist;
      expect(renderer.stats.lastFrameStats.totalEntities).to.be.a('number');
    });
    
    it('should render all groups in correct order', () => {
      const renderer = new EntityRenderer();
      const renderOrder = [];
      
      const originalRenderGroup = renderer.renderGroup.bind(renderer);
      renderer.renderGroup = function(group) {
        if (group === this.renderGroups.BACKGROUND) renderOrder.push('BACKGROUND');
        if (group === this.renderGroups.RESOURCES) renderOrder.push('RESOURCES');
        if (group === this.renderGroups.ANTS) renderOrder.push('ANTS');
        if (group === this.renderGroups.EFFECTS) renderOrder.push('EFFECTS');
        if (group === this.renderGroups.FOREGROUND) renderOrder.push('FOREGROUND');
        return originalRenderGroup(group);
      };
      
      renderer.renderAllLayers('PLAYING');
      
      expect(renderOrder).to.deep.equal(['BACKGROUND', 'RESOURCES', 'ANTS', 'EFFECTS', 'FOREGROUND']);
    });
    
    it('should sort entities when depth sorting enabled', () => {
      const renderer = new EntityRenderer();
      renderer.config.enableDepthSorting = true;
      global.ants = [
        { x: 100, y: 300, render: () => {} },
        { x: 100, y: 100, render: () => {} }
      ];
      
      renderer.renderAllLayers('PLAYING');
      
      expect(renderer.renderGroups.ANTS[0].depth).to.be.lessThan(renderer.renderGroups.ANTS[1].depth);
    });
  });
  
  describe('Performance Statistics', () => {
    it('should calculate cull efficiency', () => {
      const renderer = new EntityRenderer();
      renderer.stats.totalEntities = 100;
      renderer.stats.culledEntities = 30;
      
      const stats = renderer.getPerformanceStats();
      
      expect(stats.cullEfficiency).to.equal(30);
    });
    
    it('should calculate render efficiency', () => {
      const renderer = new EntityRenderer();
      renderer.stats.totalEntities = 100;
      renderer.stats.renderedEntities = 70;
      
      const stats = renderer.getPerformanceStats();
      
      expect(stats.renderEfficiency).to.equal(70);
    });
    
    it('should handle zero total entities', () => {
      const renderer = new EntityRenderer();
      renderer.stats.totalEntities = 0;
      
      const stats = renderer.getPerformanceStats();
      
      expect(stats.cullEfficiency).to.equal(0);
      expect(stats.renderEfficiency).to.equal(0);
    });
    
    it('should include all stats properties', () => {
      const renderer = new EntityRenderer();
      
      const stats = renderer.getPerformanceStats();
      
      expect(stats).to.have.property('totalEntities');
      expect(stats).to.have.property('renderedEntities');
      expect(stats).to.have.property('culledEntities');
      expect(stats).to.have.property('renderTime');
      expect(stats).to.have.property('cullEfficiency');
      expect(stats).to.have.property('renderEfficiency');
    });
  });
  
  describe('Configuration', () => {
    it('should update configuration', () => {
      const renderer = new EntityRenderer();
      
      renderer.updateConfig({
        enableDepthSorting: false,
        maxBatchSize: 200,
        cullMargin: 100
      });
      
      expect(renderer.config.enableDepthSorting).to.be.false;
      expect(renderer.config.maxBatchSize).to.equal(200);
      expect(renderer.config.cullMargin).to.equal(100);
    });
    
    it('should preserve unmodified config values', () => {
      const renderer = new EntityRenderer();
      
      renderer.updateConfig({ maxBatchSize: 150 });
      
      expect(renderer.config.enableDepthSorting).to.be.true; // Original value
      expect(renderer.config.maxBatchSize).to.equal(150); // Updated value
    });
  });
  
  describe('Entity Type Breakdown', () => {
    it('should get entity type breakdown', () => {
      const renderer = new EntityRenderer();
      global.ants = [{ x: 100, y: 100 }, { x: 200, y: 200 }];
      global.g_resourceList.resources = [{ x: 50, y: 50 }];
      
      renderer.collectEntities('PLAYING');
      const breakdown = renderer.getEntityTypeBreakdown();
      
      expect(breakdown.ant).to.equal(2);
      expect(breakdown.resource).to.equal(1);
    });
    
    it('should handle mixed entity types', () => {
      const renderer = new EntityRenderer();
      global.ants = [{ x: 100, y: 100 }];
      global.g_resourceList.resources = [{ x: 50, y: 50 }];
      global.Buildings = [{ x: 150, y: 150 }];
      
      renderer.collectEntities('PLAYING');
      const breakdown = renderer.getEntityTypeBreakdown();
      
      expect(breakdown.ant).to.equal(1);
      expect(breakdown.resource).to.equal(1);
      expect(breakdown.building).to.equal(1);
    });
    
    it('should return empty breakdown when no entities', () => {
      const renderer = new EntityRenderer();
      
      const breakdown = renderer.getEntityTypeBreakdown();
      
      expect(breakdown).to.be.an('object');
      expect(Object.keys(breakdown)).to.be.empty;
    });
  });
  
  describe('Edge Cases', () => {
    it('should handle null entities gracefully', () => {
      const renderer = new EntityRenderer();
      
      const result = renderer.shouldRenderEntity(null);
      
      expect(result).to.be.false;
    });
    
    it('should handle undefined entities gracefully', () => {
      const renderer = new EntityRenderer();
      
      const result = renderer.shouldRenderEntity(undefined);
      
      expect(result).to.be.false;
    });
    
    it('should handle entities without position', () => {
      const renderer = new EntityRenderer();
      const entity = { width: 20, height: 20 }; // No x or y
      
      expect(() => renderer.shouldRenderEntity(entity)).to.not.throw();
    });
    
    it('should handle entities without size', () => {
      const renderer = new EntityRenderer();
      const entity = { x: 100, y: 100 }; // No width or height
      
      expect(() => renderer.isEntityInViewport(entity)).to.not.throw();
    });
    
    it('should handle very large coordinates', () => {
      const renderer = new EntityRenderer();
      const entity = { x: 999999, y: 999999, width: 20, height: 20 };
      
      const result = renderer.shouldRenderEntity(entity);
      
      expect(result).to.be.false; // Should be culled
    });
    
    it('should handle negative coordinates', () => {
      const renderer = new EntityRenderer();
      const entity = { x: -100, y: -100, width: 50, height: 50 };
      
      const result = renderer.shouldRenderEntity(entity);
      
      expect(result).to.be.true; // Partially visible with margin
    });
    
    it('should handle zero-size entities', () => {
      const renderer = new EntityRenderer();
      const entity = { x: 100, y: 100, width: 0, height: 0 };
      
      expect(() => renderer.isEntityInViewport(entity)).to.not.throw();
    });
    
    it('should handle empty Buildings array', () => {
      const renderer = new EntityRenderer();
      global.Buildings = [];
      
      expect(() => renderer.collectEntities('PLAYING')).to.not.throw();
    });
    
    it('should handle undefined Buildings', () => {
      const renderer = new EntityRenderer();
      global.Buildings = undefined;
      
      expect(() => renderer.collectEntities('PLAYING')).to.not.throw();
    });
  });
  
  describe('Integration Scenarios', () => {
    it('should handle full render cycle with mixed entities', () => {
      const renderer = new EntityRenderer();
      global.ants = [
        { x: 100, y: 100, render: () => {} },
        { x: 200, y: 200, render: () => {} }
      ];
      global.g_resourceList.resources = [
        { x: 50, y: 50, render: () => {} }
      ];
      
      renderer.renderAllLayers('PLAYING');
      
      expect(renderer.stats.totalEntities).to.equal(3);
      expect(renderer.stats.renderedEntities).to.equal(3);
      expect(renderer.stats.renderTime).to.be.at.least(0); // >= 0, can be 0 for very fast renders
    });
    
    it('should cull off-screen entities correctly', () => {
      const renderer = new EntityRenderer();
      renderer.config.cullMargin = 10;
      global.ants = [
        { x: 400, y: 300, render: () => {} }, // On screen
        { x: 5000, y: 5000, render: () => {} }  // Off screen
      ];
      
      renderer.renderAllLayers('PLAYING');
      
      expect(renderer.stats.renderedEntities).to.equal(1);
      expect(renderer.stats.culledEntities).to.equal(1);
    });
    
    it('should maintain render order with depth sorting', () => {
      const renderer = new EntityRenderer();
      const renderOrder = [];
      
      global.ants = [
        { x: 100, y: 300, render: function() { renderOrder.push(this.y); } },
        { x: 100, y: 100, render: function() { renderOrder.push(this.y); } },
        { x: 100, y: 200, render: function() { renderOrder.push(this.y); } }
      ];
      
      renderer.renderAllLayers('PLAYING');
      
      expect(renderOrder).to.deep.equal([100, 200, 300]);
    });
    
    it('should handle entities appearing and disappearing', () => {
      const renderer = new EntityRenderer();
      
      // First frame
      global.ants = [{ x: 100, y: 100, render: () => {} }];
      renderer.renderAllLayers('PLAYING');
      expect(renderer.stats.totalEntities).to.equal(1);
      
      // Second frame - more entities
      global.ants = [
        { x: 100, y: 100, render: () => {} },
        { x: 200, y: 200, render: () => {} }
      ];
      renderer.renderAllLayers('PLAYING');
      expect(renderer.stats.totalEntities).to.equal(2);
      
      // Third frame - fewer entities
      global.ants = [];
      renderer.renderAllLayers('PLAYING');
      expect(renderer.stats.totalEntities).to.equal(0);
    });
  });
});
