/**
 * Design Quixo — Global Cookie Consent & Privacy Compliance
 * Compliant with DPDPA 2023 & IT Act 2000
 * Strictly Cache-Free & Real-Time
 */
(function() {
  'use strict';

  // Suppress benign preview-only Vite websocket disconnect warning
  if (typeof window !== 'undefined' && window.console) {
    const origError = console.error;
    const origWarn = console.warn;
    console.error = function(...args) {
      if (args[0] && typeof args[0] === 'string' && args[0].includes('[vite] failed to connect to websocket')) {
        return;
      }
      return origError.apply(console, args);
    };
    console.warn = function(...args) {
      if (args[0] && typeof args[0] === 'string' && args[0].includes('[vite] failed to connect to websocket')) {
        return;
      }
      return origWarn.apply(console, args);
    };
  }

  function createFloatingCookieButton() {
    if (document.getElementById('dq-cookie-settings-btn')) return;
    const btn = document.createElement('button');
    btn.id = 'dq-cookie-settings-btn';
    btn.type = 'button';
    btn.title = 'Cookie Preferences';
    btn.className = 'fixed bottom-4 left-4 z-[99990] flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/95 hover:bg-slate-900 hover:text-white text-slate-700 text-[11px] font-bold border border-slate-200/90 shadow-md backdrop-blur-xs transition-all duration-200 cursor-pointer group';
    btn.innerHTML = `
      <span class="text-sm">🍪</span>
      <span class="hidden sm:inline-block font-semibold">Cookie Settings</span>
    `;
    btn.onclick = () => {
      openCookieBanner(true);
    };
    document.body.appendChild(btn);
  }

  function openCookieBanner(forceOpen) {
    let banner = document.getElementById('dq-cookie-consent-banner');
    if (banner) {
      banner.classList.remove('hidden', 'opacity-0', 'translate-y-4');
      return;
    }

    banner = document.createElement('div');
    banner.id = 'dq-cookie-consent-banner';
    banner.className = 'fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-[99999] transition-all duration-300 transform translate-y-0';
    banner.innerHTML = `
      <div class="bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-2xl text-slate-800 font-['Plus_Jakarta_Sans',sans-serif] text-xs space-y-3">
        <div class="flex items-start gap-3">
          <div class="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-200/60 shadow-xs text-base">
            🍪
          </div>
          <div class="space-y-1">
            <h4 class="font-extrabold text-slate-900 text-xs sm:text-sm flex items-center gap-2">
              Cookie & Privacy Preferences
              <span class="px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[9px] font-bold border border-emerald-200">DPDPA 2023</span>
            </h4>
            <p class="text-slate-500 leading-relaxed text-[11px] sm:text-xs">
              We use strictly necessary cookies & secure browser tokens for live designer job routing, WhatsApp delivery, and order intake. Zero ads, zero selling of personal data.
            </p>
          </div>
        </div>

        <div class="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 flex-wrap">
          <a href="privacy.html#cookies" class="text-slate-500 hover:text-blue-600 underline font-medium text-[11px] py-1">
            Read Cookie Policy
          </a>
          <div class="flex items-center gap-2">
            <button type="button" id="dq-cookie-essential-btn" class="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-[11px] transition-colors cursor-pointer">
              Essential Only
            </button>
            <button type="button" id="dq-cookie-accept-btn" class="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] shadow-xs transition-colors cursor-pointer">
              Accept All
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(banner);

    const dismiss = (choice) => {
      try {
        localStorage.setItem('dq_cookie_consent', choice);
        document.cookie = `dq_cookie_consent=${choice}; path=/; max-age=31536000; SameSite=Lax`;
      } catch(e) {}
      banner.classList.add('opacity-0', 'translate-y-4');
      setTimeout(() => {
        if (banner.parentNode) banner.parentNode.removeChild(banner);
      }, 300);
    };

    document.getElementById('dq-cookie-accept-btn')?.addEventListener('click', () => dismiss('accepted'));
    document.getElementById('dq-cookie-essential-btn')?.addEventListener('click', () => dismiss('essential'));
  }

  function initCookieConsent() {
    try {
      createFloatingCookieButton();
      const consent = localStorage.getItem('dq_cookie_consent');
      if (!consent) {
        openCookieBanner(false);
      }
    } catch (e) {
      console.warn('Cookie consent notice error:', e);
    }
  }

  window.reopenCookieNotice = function() {
    openCookieBanner(true);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCookieConsent);
  } else {
    initCookieConsent();
  }
})();
