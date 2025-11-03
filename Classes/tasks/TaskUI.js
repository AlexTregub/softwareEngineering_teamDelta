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
          y:g_canvasY - (g_canvasY * screenOffsetMutiplier) -40
        },
        offsets: {
          x: 0,
          y: 25
        }
    }
  };
  return Styles
}


function setRenderTaskLocation(style) {  // Add style parameter
  let renderTask = {
    title: () => text("Task Objectives", style.textPos.x + (style.offsets.x * 0), style.textPos.y + (style.offsets.y * 0)),
    t1: () => text("task: ", style.textPos.x + (style.offsets.x * 1), style.textPos.y + (style.offsets.y * 1)),
    t2: () => text("hi🍂 " , style.textPos.x + (style.offsets.x * 1), style.textPos.y + (style.offsets.y * 2)),
    t3: () => text("🐜: ", style.textPos.x + (style.offsets.x * 2), style.textPos.y + (style.offsets.y * 3))
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
  renderTaskList(renderTask.t1, style);
  renderTaskList(renderTask.t2, style);
  renderTaskList(renderTask.t3, style);
  
  pop(); // Restore drawing state
}

console.log("loading renderTasks.js");
function renderTaskList(drawFn, style) { 
  if (typeof drawFn === 'function') textNoStroke(drawFn,style);
}













