// Test helpers for UI layout tests

function setupVerticalEnvironment(opts = {}) {
  // default canvas width
  global.g_canvasX = opts.g_canvasX || 800;

  // minimal createMenuButton factory used by VerticalButtonList
  global.createMenuButton = opts.createMenuButton || function(x,y,w,h,text,style,action,img) {
    return { x, y, w, h, text, style, action, img };
  };

  // image stubs
  const defaultImg = { width: opts.imgWidth || 400, height: opts.imgHeight || 200 };
  global.playButton = opts.playButton || defaultImg;
  global.optionButton = opts.optionButton || null;
  global.exitButton = opts.exitButton || null;
  global.infoButton = opts.infoButton || null;
  global.audioButton = opts.audioButton || null;
  global.videoButton = opts.videoButton || null;
  global.controlButton = opts.controlButton || null;
  global.backButton = opts.backButton || null;
  global.debugButton = opts.debugButton || null;

  return {
    teardown() {
      // clear globals we set
      try {
        delete global.g_canvasX;
        delete global.createMenuButton;
        delete global.playButton;
        delete global.optionButton;
        delete global.exitButton;
        delete global.infoButton;
        delete global.audioButton;
        delete global.videoButton;
        delete global.controlButton;
        delete global.backButton;
        delete global.debugButton;
      } catch (e) {}
    }
  };
}

module.exports = { setupVerticalEnvironment };
