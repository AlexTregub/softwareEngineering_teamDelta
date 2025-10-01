// Debug module for menu layout tuning
// Exposes initializeMenuDebug() and drawMenuDebug() to be called by the main menu.
// Uses shared window.menuLayoutDebug so the main menu and debug module agree on state.
let _menuDebugListenerAttached = false;
let _menuDebugPointerAttached = false;
let menuDebugControlRects = [];
let menuDebugDragging = false;
let menuDebugDragStartY = 0;
let menuDebugDragStartOffset = 0;

const menuYOffsetHistory = [];
let menuYOffsetHistoryIndex = -1;

function _pushMenuYOffsetHistory(val) {
  if (menuYOffsetHistoryIndex < menuYOffsetHistory.length - 1) {
    menuYOffsetHistory.splice(menuYOffsetHistoryIndex + 1);
  }
  menuYOffsetHistory.push(val);
  if (menuYOffsetHistory.length > 50) menuYOffsetHistory.shift();
  menuYOffsetHistoryIndex = menuYOffsetHistory.length - 1;
}

function _undoMenuYOffset() {
  if (menuYOffsetHistoryIndex > 0) {
    menuYOffsetHistoryIndex -= 1;
    menuYOffset = menuYOffsetHistory[menuYOffsetHistoryIndex];
    try { localStorage.setItem(MENU_YOFFSET_KEY, String(menuYOffset)); } catch (e) {}
    titleTargetY = g_canvasY / 2 - 150 + menuYOffset;
    loadButtons();
  }
}

function _redoMenuYOffset() {
  if (menuYOffsetHistoryIndex < menuYOffsetHistory.length - 1) {
    menuYOffsetHistoryIndex += 1;
    menuYOffset = menuYOffsetHistory[menuYOffsetHistoryIndex];
    try { localStorage.setItem(MENU_YOFFSET_KEY, String(menuYOffset)); } catch (e) {}
    titleTargetY = g_canvasY / 2 - 150 + menuYOffset;
    loadButtons();
  }
}

function initializeMenuDebug() {
  // ensure shared flag exists
  if (typeof window.menuLayoutDebug === 'undefined') window.menuLayoutDebug = false;
  // key listener for toggling and runtime controls
  if (!_menuDebugListenerAttached) {
    window.addEventListener('keydown', (e) => {
      if (e.key === '`' || e.key === '~') {
        window.menuLayoutDebug = !window.menuLayoutDebug;
        e.preventDefault();
        return;
      }
      if (!window.menuLayoutDebug) return;

  if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z')) { _undoMenuYOffset(); e.preventDefault(); return; }
  if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || e.key === 'Y')) { _redoMenuYOffset(); e.preventDefault(); return; }

      let handled = false;
      const shift = e.shiftKey;
      const ctrl = e.ctrlKey || e.metaKey;
      let smallStep = 5;
      let largeStep = 25;
      const mod = shift ? 0.2 : (ctrl ? 2 : 1);
      smallStep = Math.max(1, Math.round(smallStep * mod));
      largeStep = Math.max(1, Math.round(largeStep * mod));

      if (['ArrowUp','ArrowDown','PageUp','PageDown','+','=','-','_'].includes(e.key) || e.key === 'Home') {
        _pushMenuYOffsetHistory(menuYOffset);
      }
      if (e.key === 'ArrowUp') { menuYOffset -= smallStep; handled = true; }
      if (e.key === 'ArrowDown') { menuYOffset += smallStep; handled = true; }
      if (e.key === 'PageUp') { menuYOffset -= largeStep; handled = true; }
      if (e.key === 'PageDown') { menuYOffset += largeStep; handled = true; }
      if (e.key === 'Home') { menuYOffset = initialMenuYOffset; handled = true; }
      if (e.key === '+' || e.key === '=' ) { menuYOffset -= smallStep; handled = true; }
      if (e.key === '-' || e.key === '_' ) { menuYOffset += smallStep; handled = true; }

      if (handled) {
        try { localStorage.setItem(MENU_YOFFSET_KEY, String(menuYOffset)); } catch (err) {}
        titleTargetY = g_canvasY / 2 - 150 + menuYOffset;
        loadButtons();
        e.preventDefault();
      }
    });
    _menuDebugListenerAttached = true;
  }

  // pointer listeners for buttons + drag
  if (!_menuDebugPointerAttached) {
    window.addEventListener('pointerdown', (ev) => {
      if (!window.menuLayoutDebug) return;
      try {
        const canvasEl = document.querySelector('canvas');
        if (!canvasEl) return;
        const rect = canvasEl.getBoundingClientRect();
        const cx = ev.clientX - rect.left;
        const cy = ev.clientY - rect.top;

        for (const r of menuDebugControlRects) {
          if (cx >= r.x && cy >= r.y && cx <= r.x + r.w && cy <= r.y + r.h) {
            if (r.action !== 'undo' && r.action !== 'redo') _pushMenuYOffsetHistory(menuYOffset);
            if (r.action === 'inc') menuYOffset += r.amount;
            if (r.action === 'dec') menuYOffset -= r.amount;
            if (r.action === 'reset') menuYOffset = initialMenuYOffset;
            if (r.action === 'save') { try { localStorage.setItem(MENU_YOFFSET_KEY, String(menuYOffset)); } catch (err) {} }
            if (r.action === 'undo') { _undoMenuYOffset(); }
            if (r.action === 'redo') { _redoMenuYOffset(); }
            try { localStorage.setItem(MENU_YOFFSET_KEY, String(menuYOffset)); } catch (err) {}
            titleTargetY = g_canvasY / 2 - 150 + menuYOffset;
            loadButtons();
            ev.preventDefault();
            return;
          }
        }

        const panelX = 8;
        const panelY = (g_canvasY - 108);
        const panelW = 380;
        const panelH = 100;
        if (cx >= panelX && cy >= panelY && cx <= panelX + panelW && cy <= panelY + panelH) {
          menuDebugDragging = true;
          menuDebugDragStartY = cy;
          menuDebugDragStartOffset = menuYOffset;
          _pushMenuYOffsetHistory(menuYOffset);
          ev.preventDefault();
          return;
        }
      } catch (err) {}
    });

    window.addEventListener('pointermove', (ev) => {
      if (!window.menuLayoutDebug) return;
      if (!menuDebugDragging) return;
      try {
        const canvasEl = document.querySelector('canvas');
        if (!canvasEl) return;
        const rect = canvasEl.getBoundingClientRect();
        const cy = ev.clientY - rect.top;
        const dy = cy - menuDebugDragStartY;
        menuYOffset = menuDebugDragStartOffset + Math.round(dy);
        titleTargetY = g_canvasY / 2 - 150 + menuYOffset;
        loadButtons();
        ev.preventDefault();
      } catch (err) {}
    });

    window.addEventListener('pointerup', (ev) => {
      if (!window.menuLayoutDebug) return;
      if (!menuDebugDragging) return;
      menuDebugDragging = false;
      try { localStorage.setItem(MENU_YOFFSET_KEY, String(menuYOffset)); } catch (err) {}
      titleTargetY = g_canvasY / 2 - 150 + menuYOffset;
      loadButtons();
    });

    _menuDebugPointerAttached = true;
  }

  if (menuYOffsetHistoryIndex === -1) _pushMenuYOffsetHistory(menuYOffset);
}

function drawMenuDebug() {
  if (!window.menuLayoutDebug) return;
  try {
    push();
    noFill();
    stroke(255,0,0);
    strokeWeight(2);
  const layout = (window.menuLayoutData || {});
  const menuDebugRects = layout.debugRects || [];
  const menuDebugGroups = layout.groupRects || [];
  const menuDebugCenters = layout.centers || [];
  const menuDebugImgs = layout.debugImgs || [];

  if (menuHeader && menuHeader.img) {
      const hx = g_canvasX / 2 - menuHeader.w / 2;
      const hy = menuHeader.y;
      rect(hx, hy, menuHeader.w, menuHeader.h);
      noStroke();
      fill(255,0,0);
      textSize(12);
      textAlign(LEFT, TOP);
      text(`header: ${menuHeader.w}x${menuHeader.h}`, hx + 4, hy + 4);
    }

    menuDebugRects.forEach(r => {
      stroke(0,255,255);
      noFill();
      strokeWeight(1.5);
      rect(r.x, r.y, r.w, r.h);
      noStroke();
      fill(0,255,255);
      textSize(12);
      textAlign(LEFT, TOP);
      const label = `${r.text} ${r.w}x${r.h}`;
      text(label, r.x + 4, r.y + 4);
    });

    if (menuDebugRects.length > 0) {
      const tol = 8;
      const rects = menuDebugRects.slice().sort((a,b) => a.y - b.y);
      const clusters = [];
      rects.forEach(r => {
        let placed = false;
        for (const c of clusters) {
          const meanY = c.reduce((s,i) => s + i.y, 0) / c.length;
          if (Math.abs(meanY - r.y) <= tol) { c.push(r); placed = true; break; }
        }
        if (!placed) clusters.push([r]);
      });
      const pad = 20;
      clusters.forEach(groupItems => {
        let minX = Math.min(...groupItems.map(i => i.x));
        let minY = Math.min(...groupItems.map(i => i.y));
        let maxX = Math.max(...groupItems.map(i => i.x + i.w));
        let maxY = Math.max(...groupItems.map(i => i.y + i.h));
        minX -= pad; minY -= pad; maxX += pad; maxY += pad;
        const gw = maxX - minX, gh = maxY - minY;
        stroke(0,200,0); strokeWeight(3); noFill(); rect(minX,minY,gw,gh);
        noStroke(); fill(0,150); rect(minX + 4, minY + 4, 100, 20);
        fill(200,255,200); textSize(12); textAlign(LEFT, TOP); text(`group ${gw}x${gh}`, minX + 8, minY + 6);
      });
    }

    menuDebugCenters.forEach(c => {
      noStroke(); fill(255,255,0); ellipse(c.cx, c.cy, 6, 6);
      fill(255,255,0); textSize(10); textAlign(LEFT, TOP); text(`${c.text}`, c.cx + 6, c.cy - 6);
    });

    if (menuDebugImgs.length > 0) {
      noStroke(); fill(255); textSize(11); textAlign(LEFT, TOP);
      menuDebugImgs.forEach((d,i) => text(`img ${d.text} intrinsic ${d.iw}x${d.ih} drawn ${d.dw}x${d.dh}`, 8, 8 + 14 * i));
    }

    // panel + buttons
    noStroke(); fill(0,180);
    const panelX = 8, panelY = g_canvasY - 108, panelW = 380, panelH = 100;
    rect(panelX, panelY, panelW, panelH);
    fill(255); textSize(12); textAlign(LEFT, TOP);
    const hints = [
      "Keyboard: ArrowUp/Down = ±5px | PageUp/Down = ±25px | Home = reset",
      "Modifiers: Shift = finer (0.2x), Ctrl/Cmd = coarser (2x)",
      `Current menuYOffset: ${menuYOffset}`
    ];
    hints.forEach((t,i) => text(t, panelX + 8, panelY + 8 + 16 * i));

    menuDebugControlRects.length = 0;
    const btnY = panelY + 56; const btnH = 28;
    const btns = [
      { label: '-25', action: 'dec', amount: 25 },
      { label: '-5', action: 'dec', amount: 5 },
      { label: 'Undo', action: 'undo', amount: 0 },
      { label: 'Reset', action: 'reset', amount: 0 },
      { label: 'Redo', action: 'redo', amount: 0 },
      { label: '+5', action: 'inc', amount: 5 },
      { label: '+25', action: 'inc', amount: 25 },
      { label: 'Save', action: 'save', amount: 0 }
    ];
    let bx = panelX + 8;
    for (const b of btns) {
      const bw = 56;
      stroke(200); strokeWeight(1); fill(60); rect(bx, btnY, bw, btnH, 4);
      noStroke(); fill(255); textSize(12); textAlign(CENTER, CENTER); text(b.label, bx + bw/2, btnY + btnH/2);
      menuDebugControlRects.push({ x: bx, y: btnY, w: bw, h: btnH, action: b.action, amount: b.amount });
      bx += bw + 8;
    }

    pop();
  } catch (err) {
    // tolerate debug rendering errors
  }
}

// expose
window.initializeMenuDebug = initializeMenuDebug;
window.drawMenuDebug = drawMenuDebug;
