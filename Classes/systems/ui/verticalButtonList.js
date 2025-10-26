/**
 * VerticalButtonList
 * ------------------
 * Simple layout container that arranges button configs into a vertically-centered
 * column. Supports grouping multiple configs on the same `y` into a single
 * horizontal row (useful for paired buttons).
 *
 * Constructor options:
 *  - spacing: number (px) vertical spacing between groups and horizontal spacing between grouped items (default 16)
 *  - maxWidth: number (px) maximum button width (buttons wider than this will be scaled down)
 *  - headerImg: p5.Image (optional) header/logo image to reserve space above the buttons
 *  - headerScale: number (0..1) fraction of canvas width to occupy for header (default 0.35)
 *  - headerGap: number (px) reduction in vertical header reservation so buttons sit closer (default 8)
 *
 * Public API:
 *  - buildFromConfigs(configs) -> { buttons: Array, header: { img,w,h,y } | null }
 *    Expects `configs` to be an array of objects with { x, y, w, h, text, style, action }
 *    Returns an array of created button objects and an optional header object
 *    containing computed width/height and `y` position for rendering.
 *
 * Usage example:
 *  const container = new VerticalButtonList(centerX, centerY, { spacing: 12, maxWidth: 400, headerImg: menuImage });
 *  const layout = container.buildFromConfigs(MENU_CONFIGS.MENU);
 *  // layout.buttons -> array of buttons created by createMenuButton
 *  // layout.header  -> header object (img,w,h,y) or null
*/
class VerticalButtonList {
  constructor(centerX, centerY, opts = {}) {
    this.centerX = centerX;
    this.centerY = centerY;
    this.spacing = opts.spacing ?? 16;
    this.maxWidth = opts.maxWidth ?? null; // if set, will scale down buttons
    this.headerImg = opts.headerImg ?? null;
    this.headerScale = opts.headerScale ?? 0.35; // percent of canvas width to use for header by default
    this.headerGap = opts.headerGap ?? 8; // pixels to reduce gap between header bottom and first group
    this.headerMaxWidth = opts.headerMaxWidth ?? null; // explicit pixel cap for header width (preferred)
  }

  /**
   * buildFromConfigs
   * @param {Array<Object>} configs - array of button config objects ({ x,y,w,h,text,style,action })
   * @returns {{buttons: Array, header: Object|null, debugRects: Array, groupRects: Array, centers: Array, debugImgs: Array, headerTop: number|undefined}} layout result with created buttons, optional header, and debug metadata
   */
  buildFromConfigs(configs) {
    const sizes = this._computeSizes(configs);
    const { header, headerHeight } = this._computeHeader();
    const groups = this._groupConfigs(configs, sizes);
    const groupList = this._computeGroupList(groups, sizes);
    const layoutResult = this._layoutGroups(groupList, configs, sizes, headerHeight);
    const created = layoutResult.buttons;
    // attach computed header top (y) so drawMenu can render the header at the right spot
    if (header && Number.isFinite(layoutResult.headerTop)) {
      header.y = layoutResult.headerTop;
    }

    // Return debug metadata produced during layout so callers can render debug overlays
    return {
      buttons: created,
      header,
      debugRects: layoutResult.debugRects || [],
      groupRects: layoutResult.groupRects || [],
      centers: layoutResult.centers || [],
      debugImgs: layoutResult.debugImgs || [],
      headerTop: layoutResult.headerTop
    };
  }

  _computeSizes(configs) {
    return configs.map(cfg => {
      let w = cfg.w || 200;
      let h = cfg.h || 50;
      if (this.maxWidth && w > this.maxWidth) {
        const scale = this.maxWidth / w;
        w = Math.round(w * scale);
        h = Math.round(h * scale);
      }
      return { w, h };
    });
  }

  _computeHeader() {
    let header = null;
    let headerHeight = 0;
    const headerImg = this.headerImg ?? null;
    if (headerImg) {
      const maxHeaderW = this.headerMaxWidth ? this.headerMaxWidth : Math.floor(g_canvasX * (this.headerScale ?? 0.35));
      const headerW = Math.min(maxHeaderW, headerImg.width || maxHeaderW);
      const aspect = (headerImg.width && headerImg.height) ? (headerImg.height / headerImg.width) : 1;
      headerHeight = Math.round(headerW * aspect);
      header = { img: headerImg, w: headerW, h: headerHeight };
    }
    return { header, headerHeight };
  }

  _groupConfigs(configs, sizes) {
    const groups = new Map();
    configs.forEach((cfg, idx) => {
      const key = Number.isFinite(cfg.y) ? cfg.y : idx;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push({ cfg, idx, size: sizes[idx] });
    });
    return groups;
  }

  _computeGroupList(groups/*Map*/, sizes) {
    return Array.from(groups.entries()).sort((a,b)=>a[0]-b[0]).map(([y, items]) => {
      const heights = items.map(i => i.size.h);
      const maxH = Math.max(...heights);
      const totalW = items.reduce((acc, it) => acc + it.size.w, 0) + this.spacing * Math.max(0, items.length - 1);
      return { y: Number(y), items, height: maxH, width: totalW };
    });
  }

  _layoutGroups(groupList, configs, sizes, headerHeight) {
    const totalHeight = groupList.reduce((acc, g) => acc + g.height, 0) + this.spacing * Math.max(0, groupList.length - 1) + headerHeight;
    const topOfAll = Math.round(this.centerY - totalHeight / 2);
    let currentY = topOfAll + (headerHeight ? Math.max(0, headerHeight - this.headerGap) : 0);

    const created = [];
    const debugRects = [];
    const groupRects = [];
    const centers = [];
    const debugImgs = [];
    for (const group of groupList) {
      const groupTop = currentY;
      let startX = Math.round(this.centerX - group.width / 2);

      groupRects.push({ x: startX, y: groupTop, w: group.width, h: group.height });

      for (const it of group.items) {
        const w = it.size.w, h = it.size.h;
        const manualX = (group.items.length === 1 && Number.isFinite(it.cfg.x)) ? it.cfg.x : 0;
        const x = Math.round(startX + manualX);
        const y = groupTop;

        const img = this._pickImage(it.cfg.text);

        const btn = createMenuButton(x, y, w, h, it.cfg.text, it.cfg.style, it.cfg.action, img);
        created.push(btn);

        debugRects.push({ x, y, w, h, text: it.cfg.text });
        centers.push({ cx: x + Math.round(w/2), cy: y + Math.round(h/2), text: it.cfg.text });

        if (img && img.width && img.height) {
          debugImgs.push({ text: it.cfg.text, iw: img.width, ih: img.height, dw: w, dh: h });
        }

        startX += w + this.spacing;
      }

      currentY += group.height + this.spacing;
    }

    return { buttons: created, headerTop: headerHeight ? topOfAll : undefined, debugRects, groupRects, centers, debugImgs };
  }

  _pickImage(text) {
    switch (text) {
      case "Start Game": return playButton;
      case "Options": return optionButton;
      case "Exit Game": return exitButton;
      case "Credits": return infoButton;
      case "Audio Settings": return audioButton;
      case "Video Settings": return videoButton;
      case "Controls": return controlButton;
      case "Back to Menu": return backButton;
      case "Debug": return debugButton;
      default: return null;
    }
  }
}

// Export for Node.js tests
if (typeof module !== 'undefined' && module.exports) {
  module.exports = VerticalButtonList;
}
