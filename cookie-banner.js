/**
 * Design Quixo — Global Cookie Consent & Privacy Compliance
 * Compliant with DPDPA 2023 & IT Act 2000
 */
(function() {
  'use strict';

  function initCookieConsent() {
    try {
      const consent = localStorage.getItem('dq_cookie_consent');
      if (consent) return; // User already made a choice

      // Avoid displaying banner inside iframe previews or specialized workspace embeds if desired, but keep accessible
      if (document.getElementById('dq-cookie-consent-banner')) return;

      const banner = document.createElement('div');
      banner.id = 'dq-cookie-consent-banner';
      banner.className = 'fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-[99999] transition-all duration-300 transform translate-y-0';
      banner.innerHTML = `
        <div class="bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-2xl text-slate-800 font-['Plus_Jakarta_Sans',sans-serif] text-xs space-y-3">
          <div class="flex items-start gap-3">
            <div class="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-200/60 shadow-xs">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5"/>
                <path d="M8.5 8.5v.01"/>
                <path d="M16 15.5v.01"/>
                <path d="M12 12v.01"/>
                <path d="M11 17v.01"/>
                <path d="M7 13v.01"/>
              </svg>
            </div>
            <div class="space-y-1">
              <h4 class="font-extrabold text-slate-900 text-xs sm:text-sm">Cookie & Privacy Notice</h4>
              <p class="text-slate-500 leading-relaxed text-[11px] sm:text-xs">
                We use strictly essential cookies and browser storage to power design brief intake, real human creator routing, and official WhatsApp updates. No data is sold.
              </p>
            </div>
          </div>

          <div class="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 flex-wrap">
            <a href="privacy.html#cookies" class="text-slate-500 hover:text-blue-600 underline font-medium text-[11px] py-1">
              Read Cookie Policy
            </a>
            <div class="flex items-center gap-2">
              <button type="button" id="dq-cookie-essential-btn" class="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold text-[11px] transition-colors cursor-pointer">
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
        } catch(e) {}
        banner.classList.add('opacity-0', 'translate-y-4');
        setTimeout(() => {
          if (banner.parentNode) banner.parentNode.removeChild(banner);
        }, 300);
      };

      document.getElementById('dq-cookie-accept-btn')?.addEventListener('click', () => dismiss('accepted'));
      document.getElementById('dq-cookie-essential-btn')?.addEventListener('click', () => dismiss('essential'));

    } catch (e) {
      console.warn('Cookie consent notice error:', e);
    }
  }

  // Support manual reopen if desired
  window.reopenCookieNotice = function() {
    try {
      localStorage.removeItem('dq_cookie_consent');
    } catch(e) {}
    initCookieConsent();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCookieConsent);
  } else {
    initCookieConsent();
  }
})();
