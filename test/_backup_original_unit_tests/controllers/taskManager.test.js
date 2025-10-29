const { expect } = require('chai');

const TaskManager = require('../../../Classes/controllers/TaskManager.js');

describe('TaskManager', function() {
  let mockEntity;
  let taskManager;
  
  beforeEach(function() {
    mockEntity = {
      moveToLocation: () => true,
      _stateMachine: { setPrimaryState: () => {}, isPrimaryState: () => false },
      _movementController: { getIsMoving: () => false, stop: () => {} }
    };
    taskManager = new TaskManager(mockEntity);
  });
  
  describe('Constructor', function() {
    it('should initialize with entity reference', function() {
      expect(taskManager._entity).to.equal(mockEntity);
    });
    
    it('should initialize empty task queue', function() {
      expect(taskManager._taskQueue).to.be.an('array').that.is.empty;
    });
    
    it('should initialize with no current task', function() {
      expect(taskManager._currentTask).to.be.null;
    });
    
    it('should initialize task priorities', function() {
      expect(taskManager.TASK_PRIORITIES.EMERGENCY).to.equal(0);
      expect(taskManager.TASK_PRIORITIES.HIGH).to.equal(1);
      expect(taskManager.TASK_PRIORITIES.NORMAL).to.equal(2);
      expect(taskManager.TASK_PRIORITIES.LOW).to.equal(3);
      expect(taskManager.TASK_PRIORITIES.IDLE).to.equal(4);
    });
    
    it('should initialize task defaults', function() {
      expect(taskManager.TASK_DEFAULTS.MOVE).to.exist;
      expect(taskManager.TASK_DEFAULTS.GATHER).to.exist;
      expect(taskManager.TASK_DEFAULTS.BUILD).to.exist;
    });
  });
  
  describe('addTask()', function() {
    it('should add task to queue', function() {
      const taskId = taskManager.addTask({ type: 'MOVE', x: 100, y: 200 });
      expect(taskId).to.be.a('string');
      expect(taskManager._taskQueue).to.have.lengthOf(1);
    });
    
    it('should return task ID', function() {
      const taskId = taskManager.addTask({ type: 'MOVE' });
      expect(taskId).to.match(/^task_/);
    });
    
    it('should apply default priority', function() {
      taskManager.addTask({ type: 'MOVE' });
      expect(taskManager._taskQueue[0].priority).to.equal(2);
    });
    
    it('should use custom priority if provided', function() {
      taskManager.addTask({ type: 'MOVE', priority: 0 });
      expect(taskManager._taskQueue[0].priority).to.equal(0);
    });
    
    it('should apply default timeout', function() {
      taskManager.addTask({ type: 'MOVE' });
      expect(taskManager._taskQueue[0].timeout).to.equal(5000);
    });
    
    it('should use custom timeout if provided', function() {
      taskManager.addTask({ type: 'MOVE', timeout: 10000 });
      expect(taskManager._taskQueue[0].timeout).to.equal(10000);
    });
    
    it('should return null for invalid task', function() {
      const taskId = taskManager.addTask(null);
      expect(taskId).to.be.null;
    });
    
    it('should return null for task without type', function() {
      const taskId = taskManager.addTask({ priority: 1 });
      expect(taskId).to.be.null;
    });
    
    it('should preserve task parameters', function() {
      taskManager.addTask({ type: 'MOVE', x: 100, y: 200 });
      expect(taskManager._taskQueue[0].x).to.equal(100);
      expect(taskManager._taskQueue[0].y).to.equal(200);
    });
  });
  
  describe('Task Queue Sorting', function() {
    it('should sort tasks by priority', function() {
      taskManager.addTask({ type: 'IDLE', priority: 4 });
      taskManager.addTask({ type: 'FLEE', priority: 0 });
      taskManager.addTask({ type: 'MOVE', priority: 2 });
      
      expect(taskManager._taskQueue[0].priority).to.equal(0);
      expect(taskManager._taskQueue[1].priority).to.equal(2);
      expect(taskManager._taskQueue[2].priority).to.equal(4);
    });
    
    it('should use FIFO for same priority', function() {
      const id1 = taskManager.addTask({ type: 'MOVE', priority: 2 });
      const id2 = taskManager.addTask({ type: 'GATHER', priority: 2 });
      
      expect(taskManager._taskQueue[0].id).to.equal(id1);
      expect(taskManager._taskQueue[1].id).to.equal(id2);
    });
  });
  
  describe('getCurrentTask()', function() {
    it('should return null initially', function() {
      expect(taskManager.getCurrentTask()).to.be.null;
    });
    
    it('should return current task', function() {
      taskManager._currentTask = { type: 'MOVE', id: 'test123' };
      expect(taskManager.getCurrentTask()).to.equal(taskManager._currentTask);
    });
  });
  
  describe('hasPendingTasks()', function() {
    it('should return false initially', function() {
      expect(taskManager.hasPendingTasks()).to.be.false;
    });
    
    it('should return true when queue has tasks', function() {
      taskManager.addTask({ type: 'MOVE' });
      expect(taskManager.hasPendingTasks()).to.be.true;
    });
    
    it('should return true when current task exists', function() {
      taskManager._currentTask = { type: 'MOVE' };
      expect(taskManager.hasPendingTasks()).to.be.true;
    });
  });
  
  describe('getQueueLength()', function() {
    it('should return 0 initially', function() {
      expect(taskManager.getQueueLength()).to.equal(0);
    });
    
    it('should return queue length', function() {
      taskManager.addTask({ type: 'MOVE' });
      taskManager.addTask({ type: 'GATHER' });
      expect(taskManager.getQueueLength()).to.equal(2);
    });
  });
  
  describe('clearAllTasks()', function() {
    it('should clear task queue', function() {
      taskManager.addTask({ type: 'MOVE' });
      taskManager.addTask({ type: 'GATHER' });
      taskManager.clearAllTasks();
      expect(taskManager._taskQueue).to.be.empty;
    });
    
    it('should clear current task', function() {
      taskManager._currentTask = { type: 'MOVE' };
      taskManager.clearAllTasks();
      expect(taskManager._currentTask).to.be.null;
    });
  });
  
  describe('cancelTask()', function() {
    it('should cancel task in queue', function() {
      const taskId = taskManager.addTask({ type: 'MOVE' });
      const result = taskManager.cancelTask(taskId);
      expect(result).to.be.true;
      expect(taskManager._taskQueue).to.be.empty;
    });
    
    it('should cancel current task', function() {
      const taskId = taskManager.addTask({ type: 'MOVE' });
      taskManager._currentTask = taskManager._taskQueue.shift();
      taskManager._currentTask.id = taskId;
      const result = taskManager.cancelTask(taskId);
      expect(result).to.be.true;
      expect(taskManager._currentTask).to.be.null;
    });
    
    it('should return false for non-existent task', function() {
      const result = taskManager.cancelTask('invalid_id');
      expect(result).to.be.false;
    });
  });
  
  describe('addEmergencyTask()', function() {
    it('should add task with emergency priority', function() {
      taskManager.addEmergencyTask({ type: 'FLEE' });
      expect(taskManager._taskQueue[0].priority).to.equal(0);
    });
    
    it('should interrupt lower priority current task', function() {
      taskManager.addTask({ type: 'MOVE', priority: 2 });
      taskManager._currentTask = taskManager._taskQueue.shift();
      taskManager.addEmergencyTask({ type: 'FLEE' });
      expect(taskManager._currentTask).to.be.null;
    });
  });
  
  describe('Convenience Methods', function() {
    describe('moveToTarget()', function() {
      it('should add MOVE task', function() {
        const taskId = taskManager.moveToTarget(100, 200);
        expect(taskId).to.be.a('string');
        expect(taskManager._taskQueue[0].type).to.equal('MOVE');
      });
      
      it('should include coordinates', function() {
        taskManager.moveToTarget(100, 200);
        expect(taskManager._taskQueue[0].x).to.equal(100);
        expect(taskManager._taskQueue[0].y).to.equal(200);
      });
      
      it('should use custom priority', function() {
        taskManager.moveToTarget(100, 200, 1);
        expect(taskManager._taskQueue[0].priority).to.equal(1);
      });
    });
    
    describe('startGathering()', function() {
      it('should add GATHER task', function() {
        const taskId = taskManager.startGathering();
        expect(taskId).to.be.a('string');
        expect(taskManager._taskQueue[0].type).to.equal('GATHER');
      });
      
      it('should include target if provided', function() {
        const target = { id: 'resource1' };
        taskManager.startGathering(target);
        expect(taskManager._taskQueue[0].target).to.equal(target);
      });
    });
    
    describe('startBuilding()', function() {
      it('should add BUILD task', function() {
        const buildTarget = { type: 'structure' };
        const taskId = taskManager.startBuilding(buildTarget);
        expect(taskId).to.be.a('string');
        expect(taskManager._taskQueue[0].type).to.equal('BUILD');
      });
      
      it('should include build target', function() {
        const buildTarget = { type: 'structure' };
        taskManager.startBuilding(buildTarget);
        expect(taskManager._taskQueue[0].target).to.equal(buildTarget);
      });
    });
    
    describe('followTarget()', function() {
      it('should add FOLLOW task', function() {
        const target = { id: 'entity1' };
        const taskId = taskManager.followTarget(target);
        expect(taskId).to.be.a('string');
        expect(taskManager._taskQueue[0].type).to.equal('FOLLOW');
      });
      
      it('should include follow target', function() {
        const target = { id: 'entity1' };
        taskManager.followTarget(target);
        expect(taskManager._taskQueue[0].target).to.equal(target);
      });
    });
    
    describe('attackTarget()', function() {
      it('should add ATTACK task', function() {
        const target = { id: 'enemy1' };
        const taskId = taskManager.attackTarget(target);
        expect(taskId).to.be.a('string');
        expect(taskManager._taskQueue[0].type).to.equal('ATTACK');
      });
      
      it('should use high priority', function() {
        const target = { id: 'enemy1' };
        taskManager.attackTarget(target);
        expect(taskManager._taskQueue[0].priority).to.equal(1);
      });
    });
    
    describe('fleeFrom()', function() {
      it('should add FLEE task', function() {
        const threat = { id: 'danger1' };
        const taskId = taskManager.fleeFrom(threat);
        expect(taskId).to.be.a('string');
        expect(taskManager._taskQueue[0].type).to.equal('FLEE');
      });
      
      it('should use emergency priority', function() {
        const threat = { id: 'danger1' };
        taskManager.fleeFrom(threat);
        expect(taskManager._taskQueue[0].priority).to.equal(0);
      });
    });
  });
  
  describe('update()', function() {
    it('should execute without errors', function() {
      expect(() => taskManager.update()).to.not.throw();
    });
    
    it('should start next task if no current task', function() {
      taskManager.addTask({ type: 'MOVE', x: 100, y: 200 });
      taskManager.update();
      expect(taskManager._currentTask).to.not.be.null;
    });
  });
  
  describe('getDebugInfo()', function() {
    it('should return debug information', function() {
      const info = taskManager.getDebugInfo();
      expect(info).to.be.an('object');
    });
    
    it('should include queue length', function() {
      const info = taskManager.getDebugInfo();
      expect(info).to.have.property('queueLength');
    });
    
    it('should include current task info', function() {
      const info = taskManager.getDebugInfo();
      expect(info).to.have.property('currentTask');
    });
  });
  
  describe('Edge Cases', function() {
    it('should handle adding multiple tasks', function() {
      for (let i = 0; i < 10; i++) {
        taskManager.addTask({ type: 'MOVE', x: i, y: i });
      }
      expect(taskManager._taskQueue).to.have.lengthOf(10);
    });
    
    it('should handle rapid task cancellation', function() {
      const id1 = taskManager.addTask({ type: 'MOVE' });
      const id2 = taskManager.addTask({ type: 'GATHER' });
      taskManager.cancelTask(id1);
      taskManager.cancelTask(id2);
      expect(taskManager._taskQueue).to.be.empty;
    });
    
    it('should handle clearing empty queue', function() {
      taskManager.clearAllTasks();
      expect(taskManager._taskQueue).to.be.empty;
    });
    
    it('should handle update with empty queue', function() {
      expect(() => taskManager.update()).to.not.throw();
    });
    
    it('should handle null entity methods', function() {
      delete mockEntity.moveToLocation;
      taskManager.addTask({ type: 'MOVE', x: 100, y: 200 });
      expect(() => taskManager.update()).to.not.throw();
    });
  });
});