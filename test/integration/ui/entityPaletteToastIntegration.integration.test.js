/**
 * ToastNotification Integration with EntityPalette - Integration Tests
 * 
 * Testing toast notifications shown after CRUD operations:
 * - Show success toast after adding custom entity
 * - Show success toast after renaming entity
 * - Show success toast after deleting entity
 * - Show error toast when validation fails
 * - Multiple operations show multiple toasts
 */

const { expect } = require('chai');
const { setupTestEnvironment, cleanupTestEnvironment } = require('../../helpers/mvcTestHelpers');
const sinon = require('sinon');

setupTestEnvironment({ rendering: true });

describe('EntityPalette Toast Integration', function() {

  afterEach(function() {
    cleanupTestEnvironment();
  });
  let clock;
  let EntityPalette, ToastNotification;

  beforeEach(function() {
    clock = sinon.useFakeTimers();
    
    // Mock p5.js functions
    global.createVector = sinon.stub().callsFake((x, y) => ({ x, y }));
    global.push = sinon.stub();
    global.pop = sinon.stub();
    global.fill = sinon.stub();
    global.noStroke = sinon.stub();
    global.stroke = sinon.stub();
    global.rect = sinon.stub();
    global.text = sinon.stub();
    global.textSize = sinon.stub();
    global.textAlign = sinon.stub();
    global.color = sinon.stub().callsFake((r, g, b, a) => ({ r, g, b, a }));
    global.image = sinon.stub();
    global.width = 1920;
    global.height = 1080;
    global.LEFT = 'left';
    global.CENTER = 'center';
    global.RIGHT = 'right';
    global.CORNER = 'corner';
    global.strokeWeight = sinon.stub();
    
    // Mock localStorage
    global.localStorage = {
      getItem: sinon.stub().returns(null),
      setItem: sinon.stub(),
      removeItem: sinon.stub()
    };
    
    // Sync window object for JSDOM
    if (typeof window !== 'undefined') {
      window.createVector = global.createVector;
      window.push = global.push;
      window.pop = global.pop;
      window.fill = global.fill;
      window.noStroke = global.noStroke;
      window.stroke = global.stroke;
      window.rect = global.rect;
      window.text = global.text;
      window.textSize = global.textSize;
      window.textAlign = global.textAlign;
      window.color = global.color;
      window.image = global.image;
      window.width = global.width;
      window.height = global.height;
      window.LEFT = global.LEFT;
      window.CENTER = global.CENTER;
      window.RIGHT = global.RIGHT;
      window.CORNER = global.CORNER;
      window.strokeWeight = global.strokeWeight;
      window.localStorage = global.localStorage;
    }
    
    // Load ToastNotification and make it global
    ToastNotification = require('../../../Classes/ui/levelEditor/toastNotifications/ToastNotification');
    global.ToastNotification = ToastNotification;
    if (typeof window !== 'undefined') {
      window.ToastNotification = ToastNotification;
    }
    
    // Load EntityPalette
    EntityPalette = require('../../../Classes/ui/painter/entity/EntityPalette');
    
    // Mock ModalDialog
    global.ModalDialog = class {
      constructor() {
        this.visible = false;
      }
      show() {}
      hide() {}
      render() {}
      handleClick() {}
      handleKeyPress() {}
    };
    if (typeof window !== 'undefined') {
      window.ModalDialog = global.ModalDialog;
    }
  });

  afterEach(function() {
    clock.restore();
    cleanupTestEnvironment();
    delete global.localStorage;
    delete global.ModalDialog;
    if (typeof window !== 'undefined') {
      delete window.localStorage;
      delete window.ModalDialog;
    }
  });

  describe('Toast Initialization', function() {
    it('should initialize toast system in EntityPalette', function() {
      const palette = new EntityPalette();
      
      expect(palette._toast).to.exist;
      expect(palette._toast).to.be.instanceOf(ToastNotification);
    });

    it('should have getToast() method', function() {
      const palette = new EntityPalette();
      
      const toast = palette.getToast();
      
      expect(toast).to.exist;
      expect(toast).to.equal(palette._toast);
    });
  });

  describe('Add Entity Toasts', function() {
    it('should show success toast after adding entity', function() {
      const palette = new EntityPalette();
      const toastSpy = sinon.spy(palette._toast, 'show');
      
      palette.addCustomEntity('Elite Worker', 'ant_worker', { faction: 'player' });
      
      expect(toastSpy.called).to.be.true;
      expect(toastSpy.firstCall.args[0]).to.include('Elite Worker');
      expect(toastSpy.firstCall.args[1]).to.equal('success');
    });

    it('should show error toast when adding duplicate name', function() {
      const palette = new EntityPalette();
      const toastSpy = sinon.spy(palette._toast, 'show');
      
      palette.addCustomEntity('Worker', 'ant_worker', {});
      toastSpy.resetHistory();
      
      const result = palette.addCustomEntity('Worker', 'ant_soldier', {}); // Duplicate
      
      expect(result).to.be.null;
      expect(toastSpy.called).to.be.true;
      expect(toastSpy.firstCall.args[0]).to.include('already exists');
      expect(toastSpy.firstCall.args[1]).to.equal('error');
    });

    it('should show error toast when adding empty name', function() {
      const palette = new EntityPalette();
      const toastSpy = sinon.spy(palette._toast, 'show');
      
      const result = palette.addCustomEntity('', 'ant_worker', {});
      
      expect(result).to.be.null;
      expect(toastSpy.called).to.be.true;
      expect(toastSpy.firstCall.args[0]).to.include('cannot be empty');
      expect(toastSpy.firstCall.args[1]).to.equal('error');
    });
  });

  describe('Rename Entity Toasts', function() {
    it('should show success toast after renaming entity', function() {
      const palette = new EntityPalette();
      const entity = palette.addCustomEntity('Worker', 'ant_worker', {});
      
      const toastSpy = sinon.spy(palette._toast, 'show');
      
      palette.renameCustomEntity(entity.id, 'Elite Worker');
      
      expect(toastSpy.called).to.be.true;
      expect(toastSpy.firstCall.args[0]).to.include('renamed');
      expect(toastSpy.firstCall.args[1]).to.equal('success');
    });

    it('should show error toast when renaming to duplicate name', function() {
      const palette = new EntityPalette();
      palette.addCustomEntity('Worker 1', 'ant_worker', {});
      const entity2 = palette.addCustomEntity('Worker 2', 'ant_soldier', {});
      
      const toastSpy = sinon.spy(palette._toast, 'show');
      
      const result = palette.renameCustomEntity(entity2.id, 'Worker 1'); // Duplicate
      
      expect(result).to.be.false;
      expect(toastSpy.called).to.be.true;
      expect(toastSpy.firstCall.args[0]).to.include('already exists');
      expect(toastSpy.firstCall.args[1]).to.equal('error');
    });

    it('should show error toast when renaming to empty string', function() {
      const palette = new EntityPalette();
      const entity = palette.addCustomEntity('Worker', 'ant_worker', {});
      
      const toastSpy = sinon.spy(palette._toast, 'show');
      
      const result = palette.renameCustomEntity(entity.id, '');
      
      expect(result).to.be.false;
      expect(toastSpy.called).to.be.true;
      expect(toastSpy.firstCall.args[0]).to.include('cannot be empty');
      expect(toastSpy.firstCall.args[1]).to.equal('error');
    });
  });

  describe('Delete Entity Toasts', function() {
    it('should show success toast after deleting entity', function() {
      const palette = new EntityPalette();
      const entity = palette.addCustomEntity('Worker', 'ant_worker', {});
      
      const toastSpy = sinon.spy(palette._toast, 'show');
      
      palette.deleteCustomEntity(entity.id);
      
      expect(toastSpy.called).to.be.true;
      expect(toastSpy.firstCall.args[0]).to.include('deleted');
      expect(toastSpy.firstCall.args[1]).to.equal('success');
    });

    it('should show info toast when deleting non-existent entity', function() {
      const palette = new EntityPalette();
      const toastSpy = sinon.spy(palette._toast, 'show');
      
      const result = palette.deleteCustomEntity('non_existent_id');
      
      expect(result).to.be.false;
      expect(toastSpy.called).to.be.true;
      expect(toastSpy.firstCall.args[1]).to.equal('error');
    });
  });

  describe('Multiple Operations', function() {
    it('should show multiple toasts for multiple operations', function() {
      const palette = new EntityPalette();
      const toastSpy = sinon.spy(palette._toast, 'show');
      
      palette.addCustomEntity('Worker 1', 'ant_worker', {});
      palette.addCustomEntity('Worker 2', 'ant_soldier', {});
      palette.addCustomEntity('Worker 3', 'ant_queen', {});
      
      expect(toastSpy.callCount).to.equal(3);
      expect(palette._toast.toasts.length).to.be.at.most(3);
    });

    it('should auto-dismiss old toasts', function() {
      const palette = new EntityPalette();
      
      palette.addCustomEntity('Worker 1', 'ant_worker', {});
      expect(palette._toast.toasts.length).to.equal(1);
      
      clock.tick(3000); // Wait for default timeout
      palette._toast.update();
      
      expect(palette._toast.toasts.length).to.equal(0);
    });

    it('should stack toasts vertically', function() {
      const palette = new EntityPalette();
      
      palette.addCustomEntity('Worker 1', 'ant_worker', {});
      palette.addCustomEntity('Worker 2', 'ant_soldier', {});
      
      // Render to calculate Y positions
      palette._toast.render();
      
      expect(palette._toast.toasts.length).to.equal(2);
      expect(palette._toast.toasts[0].y).to.not.equal(palette._toast.toasts[1].y);
    });
  });

  describe('Toast Rendering', function() {
    it('should call toast.render() in EntityPalette.render()', function() {
      const palette = new EntityPalette();
      const renderSpy = sinon.spy(palette._toast, 'render');
      
      palette.addCustomEntity('Worker', 'ant_worker', {});
      palette.render();
      
      expect(renderSpy.called).to.be.true;
    });

    it('should call toast.update() in EntityPalette.render()', function() {
      const palette = new EntityPalette();
      const updateSpy = sinon.spy(palette._toast, 'update');
      
      palette.addCustomEntity('Worker', 'ant_worker', {});
      palette.render();
      
      expect(updateSpy.called).to.be.true;
    });
  });

  describe('Click Handling', function() {
    it('should forward clicks to toast.handleClick()', function() {
      const palette = new EntityPalette();
      const clickSpy = sinon.spy(palette._toast, 'handleClick');
      
      palette.addCustomEntity('Worker', 'ant_worker', {});
      palette.handleClick(1800, 40);
      
      expect(clickSpy.called).to.be.true;
      expect(clickSpy.firstCall.args[0]).to.equal(1800);
      expect(clickSpy.firstCall.args[1]).to.equal(40);
    });

    it('should dismiss toast when clicked', function() {
      const palette = new EntityPalette();
      
      palette.addCustomEntity('Worker', 'ant_worker', {});
      expect(palette._toast.toasts.length).to.equal(1);
      
      const toast = palette._toast.toasts[0];
      toast.x = 1670;
      toast.y = 20;
      
      palette.handleClick(1800, 40);
      
      expect(palette._toast.toasts.length).to.equal(0);
    });
  });

  describe('Toast Messages', function() {
    it('should include entity name in success messages', function() {
      const palette = new EntityPalette();
      const toastSpy = sinon.spy(palette._toast, 'show');
      
      palette.addCustomEntity('Elite Warrior', 'ant_soldier', {});
      
      expect(toastSpy.firstCall.args[0]).to.include('Elite Warrior');
    });

    it('should have clear, user-friendly messages', function() {
      const palette = new EntityPalette();
      const toastSpy = sinon.spy(palette._toast, 'show');
      
      palette.addCustomEntity('Worker', 'ant_worker', {});
      toastSpy.resetHistory();
      
      palette.addCustomEntity('Worker', 'ant_soldier', {});
      
      const errorMessage = toastSpy.firstCall.args[0];
      expect(errorMessage).to.be.a('string');
      expect(errorMessage.length).to.be.greaterThan(10); // Not just "Error"
    });
  });
});
