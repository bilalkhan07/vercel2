// Design Quixo Ultimate Security & Anti-Inspection Shield
(function () {
  'use strict';

  // 1. Instant Lockout & Code Eraser
  let isLockedOut = false;
  function triggerLockout() {
    if (isLockedOut) return;
    isLockedOut = true;
    try {
      if (window.stop) window.stop();
    } catch (e) {}
    try {
      if (document.documentElement) {
        document.documentElement.innerHTML = '<head><title>Access Denied</title><style>html,body{margin:0;padding:0;background:#0f172a;color:#ffffff;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;height:100vh;display:flex;align-items:center;justify-content:center;text-align:center;overflow:hidden;}</style></head><body><div style="padding:20px;max-width:500px;"><h1 style="font-size:24px;font-weight:800;margin-bottom:12px;color:#f8fafc;">Security Shield Active</h1><p style="color:#94a3b8;font-size:14px;line-height:1.6;margin-bottom:20px;">Developer inspection tools, element inspection, and source code viewing are strictly disabled for copyright protection.</p><a href="index.html" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#ffffff;border-radius:10px;text-decoration:none;font-weight:700;font-size:13px;box-shadow:0 4px 12px rgba(37,99,235,0.3);">Return to Home</a></div></body>';
      }
    } catch (e) {}
  }

  // 2. Completely Suppress Console Output & Clear Periodically
  if (typeof console !== 'undefined') {
    const emptyFn = function () { triggerLockout(); };
    console.log = emptyFn;
    console.debug = emptyFn;
    console.info = emptyFn;
    console.warn = emptyFn;
    console.error = emptyFn;
    console.dir = emptyFn;
    console.table = emptyFn;
    console.trace = emptyFn;
    setInterval(function () {
      try { console.clear(); } catch(e) {}
    }, 50);
  }

  // 3. Prevent Context Menu (Right Click) completely & trigger lockout
  const preventDefault = function (e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    triggerLockout();
    return false;
  };

  window.addEventListener('contextmenu', function(e) {
    preventDefault(e);
    return false;
  }, true);
  document.addEventListener('contextmenu', function(e) {
    preventDefault(e);
    return false;
  }, true);

  // 4. Block Keyboard Shortcuts (F12, Inspect, View Source, Save, Print)
  const blockKeys = function (e) {
    if (!e) return;
    if (e.key === 'F12' || e.keyCode === 123) {
      triggerLockout();
      return preventDefault(e);
    }
    const ctrl = e.ctrlKey || e.metaKey;
    const shift = e.shiftKey;
    const alt = e.altKey;
    const key = (e.key || '').toUpperCase();
    const code = e.keyCode;

    if ((ctrl && shift) || (ctrl && alt) || (alt && shift)) {
      if (['I', 'J', 'C', 'K', 'E', 'S', 'U', 'P', 'D'].includes(key) || [73, 74, 67, 75, 69, 83, 85, 80, 68].includes(code)) {
        triggerLockout();
        return preventDefault(e);
      }
    }
    if (ctrl) {
      if (['U', 'S', 'P', 'I', 'J', 'C'].includes(key) || [85, 83, 80, 73, 74, 67].includes(code)) {
        triggerLockout();
        return preventDefault(e);
      }
    }
  };

  window.addEventListener('keydown', blockKeys, true);
  document.addEventListener('keydown', blockKeys, true);
  window.addEventListener('keyup', blockKeys, true);
  document.addEventListener('keyup', blockKeys, true);

  // 5. Disable Text Selection & Copying & Dragging
  document.addEventListener('selectstart', function (e) {
    triggerLockout();
    return preventDefault(e);
  }, true);

  document.addEventListener('copy', function (e) {
    triggerLockout();
    return preventDefault(e);
  }, true);

  document.addEventListener('dragstart', function (e) {
    triggerLockout();
    return preventDefault(e);
  }, true);

  // 6. Anti-Debugger Loop
  setInterval(function () {
    const startTime = performance.now();
    (function () {
      return false;
    })
    ['constructor']('debugger')();
    const endTime = performance.now();
    if (endTime - startTime > 40) {
      triggerLockout();
    }
  }, 100);

  // 7. Window Outer/Inner Dimension DevTools Detection
  setInterval(function () {
    const widthDiff = window.outerWidth - window.innerWidth;
    const heightDiff = window.outerHeight - window.innerHeight;
    if (widthDiff > 100 || heightDiff > 100) {
      triggerLockout();
    }
  }, 200);

  window.DQSecurity = {
    initialized: true,
    hardened: true,
    lockout: triggerLockout
  };
})();
