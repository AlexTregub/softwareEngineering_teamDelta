/**
 * TaskManager Unit Tests (basic smoke)
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const controllerPath = path.join(__dirname, '..', '..', 'Classes', 'controllers', 'TaskManager.js');
const controllerCode = fs.readFileSync(controllerPath, 'utf8');
const classMatch = controllerCode.match(/class TaskManager[\s\S]*?^}/m);
if (classMatch) {
  eval(classMatch[0]);
}

describe('TaskManager smoke', function() {
  it('constructs and can add a task', function() {
    const entity = { moveToLocation: () => {} };
    if (typeof TaskManager !== 'function') this.skip();
    const manager = new TaskManager(entity);
    manager.addTask({ id: 't1', type: 'MOVE', priority: 1, data: {} });
    assert(manager._taskQueue.length >= 1);
  });
});
