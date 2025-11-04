function getTaskRenderStyles() {
  let screenOffsetMutiplier = .0625
  const Styles = {
    L_LEFT_DEF: {
        name: "lowerLeft",
        textSize: 24,
        textColor: 'white',
        textAlign: [LEFT, BOTTOM],
        textFont: g_menuFont,
        textPos: {
          x:10,
          y:g_canvasY - (g_canvasY * screenOffsetMutiplier) -60
        },
        offsets: {
          x: 0,
          y: 25
        }
    }
  };
  return Styles
}

function checkTaskCompletion(taskID) {
  const lib = window.taskLibrary;
  if (!lib){ 
    console.warn('No TaskLibrary available'); 
    return; 
  }
  const task = lib.availableTasks.find(t => (t.ID === taskID) || (t.description && t.description.toLowerCase().includes('gather') && t.description.includes('10 wood')));
  if (!task){ 
    console.warn('Task T1 not found'); 
    return; 
  }           
  const satisfied = (typeof lib.isTaskResourcesSatisfied === 'function') ? lib.isTaskResourcesSatisfied(task.ID) : false;
  if (satisfied) {
    task.status = 'COMPLETE';
    console.log(`Task ${task.ID} complete`);
}
}


function setRenderTaskLocation(style) {  // Add style parameter
  let renderTask = {
    title: () => text("Task Objectives", style.textPos.x + (style.offsets.x * 0), style.textPos.y + (style.offsets.y * 0)),
    T1: () => text("Gather 10 sticks: " + "🍂", style.textPos.x + (style.offsets.x * 1), style.textPos.y + (style.offsets.y * 1)),
    T2: () => text("Gather 5 stones🍂 " + "🍂", style.textPos.x + (style.offsets.x * 1), style.textPos.y + (style.offsets.y * 2)),
    T3: () => text("Gather 20 maple leaves🐜: ", style.textPos.x + (style.offsets.x * 2), style.textPos.y + (style.offsets.y * 3)),
    T4: () => text("Gather 15 green leaves🐜: ", style.textPos.x + (style.offsets.x * 3), style.textPos.y + (style.offsets.y * 4))

  };  
  return renderTask;
}

function getTaskRenderList(style = getTaskRenderStyles().L_LEFT_DEF) {
  let renderTask = {}
  renderTask = setRenderTaskLocation(style); 
  return renderTask;
}

function renderTasks() {
  let style = getTaskRenderStyles().L_LEFT_DEF;
  let renderTask = getTaskRenderList(style);
  
  renderTaskList(renderTask.title, style);
  renderTaskList(renderTask.T1, style);
  renderTaskList(renderTask.T2, style);
  renderTaskList(renderTask.T3, style);
  renderTaskList(renderTask.T4, style);
  }

console.log("loading renderTasks.js");
function renderTaskList(drawFn, style) { 
  if (typeof drawFn === 'function') textNoStroke(drawFn,style);
}
