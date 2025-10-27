// Minimal UI panel to create tasks and show progress based on global resource totals.
// Usage: window.taskUI = new TaskUI(window.taskManager, window.taskLibrary);
logNormal("loading TaskUI.js");
class TaskUI {
  constructor(taskManager, taskLibrary, opts = {}) {
    this.tm = taskManager;
    this.lib = taskLibrary;
    this.x = opts.x || 8; this.y = opts.y || 8; this.w = opts.w || 260; this.h = opts.h || 200;
    this.rowH = 20;
    this.buttons = [];
  }

  render() {
    push();
    noStroke();
    fill(20,20,20,220);
    rect(this.x, this.y, this.w, this.h, 6);
    fill(230);
    textSize(14);
    textAlign(LEFT, TOP);
    text("Tasks", this.x + 8, this.y + 6);

    const totals = (this.tm && typeof this.tm._getGlobalResourceTotals === "function") ? this.tm._getGlobalResourceTotals() : {};
    let yy = this.y + 30;
    // show pending tasks with progress bars
    const pending = this.tm ? this.tm.getAll() : [];
    this.buttons = [];
    for (let i = 0; i < pending.length && yy < this.y + this.h - 60; i++) {
      const t = pending[i];
      fill(200);
      text(`${t.label} [${t.id}]`, this.x + 8, yy);
      // small progress bar based on requiredResources
      const barX = this.x + 8, barW = this.w - 96, barY = yy + 14, barH = 8;
      // compute overall progress as min over resource ratios
      let progress = 1;
      const req = t.requiredResources;
      if (Object.keys(req).length === 0) progress = 1;
      else {
        progress = 1;
        for (const k of Object.keys(req)) {
          const need = req[k] || 0;
          const have = totals[k] || 0;
          const ratio = need === 0 ? 1 : Math.min(1, have / need);
          progress = Math.min(progress, ratio);
        }
      }
      // bar background
      fill(60); rect(barX, barY, barW, barH, 4);
      fill(80,180,80); rect(barX, barY, barW * progress, barH, 4);
      // create button to optionally consume/claim (if implemented)
      const bx = this.x + this.w - 76, by = yy + 8, bw = 68, bh = 20;
      fill(70,120,200);
      rect(bx, by, bw, bh, 4);
      fill(255); textAlign(CENTER, CENTER); text("Claim", bx + bw/2, by + bh/2);
      this.buttons.push({ id: `claim_${t.id}`, task: t, x: bx, y: by, w: bw, h: bh });
      yy += 36;
    }

    // Library create buttons
    fill(200);
    textAlign(LEFT, TOP);
    text("Create:", this.x + 8, this.y + this.h - 56);
    const lib = this.lib ? this.lib.getAll() : [];
    let cx = this.x + 70;
    for (let i = 0; i < lib.length && cx < this.x + this.w - 8; i++) {
      const it = lib[i];
      const bx = cx, by = this.y + this.h - 60, bw = 60, bh = 20;
      fill(80,160,80); rect(bx, by, bw, bh, 4);
      fill(255); textAlign(CENTER, CENTER); text(it.label || it.type, bx + bw/2, by + bh/2);
      this.buttons.push({ id: `create_${i}`, item: it, x: bx, y: by, w: bw, h: bh });
      cx += bw + 6;
    }

    // show global totals
    fill(220);
    textAlign(LEFT, TOP);
    let ry = this.y + this.h - 24;
    text("Globals:", this.x + 8, ry);
    ry += 14;
    const keys = Object.keys(totals);
    for (let i = 0; i < keys.length && i < 4; i++) {
      const k = keys[i]; text(`${k}: ${totals[k]}`, this.x + 8 + i*80, ry);
    }

    pop();
    logNormal("shown task UI");
  }

  handleClick(mx, my) {
    for (const b of this.buttons) {
      if (mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h) {
        if (b.id && b.id.startsWith("create_")) {
          const it = b.item;
          // create a task using library template (deep copy requiredResources)
          const newTaskOpts = {
            type: it.type,
            label: it.label,
            requiredResources: Object.assign({}, it.requiredResources || {}),
            reward: it.reward || 0,
            priority: it.priority || 0
          };
          this.tm.createTask(newTaskOpts);
          return true;
        }
        if (b.id && b.id.startsWith("claim_")) {
          const t = b.task;
          // Claim click: if task is actually fulfilled, complete it and optionally consume resources.
          const totals = (this.tm && typeof this.tm._getGlobalResourceTotals === "function") ? this.tm._getGlobalResourceTotals() : {};
          if (t.isFulfilledBy(totals)) {
            // optionally call tm._consumeResourcesForTask(t) if you implement consuming
            t.complete({ claimedByUI: true, totalsSnapshot: totals });
            this.tm.onTaskCompleted(t, { claimedByUI: true });
            this.tm.removeTask(t);
          }
          return true;
        }
      }
    }
    return false;
  }
}

// Expose
if (typeof window !== "undefined") window.TaskUI = TaskUI;
if (typeof module !== "undefined" && module.exports) module.exports = TaskUI;