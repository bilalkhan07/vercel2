const fs = require('fs');
let code = fs.readFileSync('scripts/update-city-pages.cjs', 'utf8');

const newRenderFn = `
      function renderCityDynamicContent() {
        try {
          let services = [];
          if (window.DQStore && typeof window.DQStore.getServices === 'function') {
            services = window.DQStore.getServices();
          } else {
            try { services = JSON.parse(localStorage.getItem('dq_services') || '[]'); } catch(e) {}
          }

          const srvContainer = document.getElementById('city-services-grid');
          if (srvContainer && Array.isArray(services) && services.length > 0) {
            const slugMap = {
              'social-media': 'social-media-designer',
              'youtube-thumbnail': 'youtube-thumbnail-designer',
              'vector-art': 'vector-art-specialist',
              'visiting-card': 'visiting-card-designer',
              'logo-design': 'logo-designer',
              'packaging-design': 'packaging-label-designer',
              'flyer-design': 'flyer-poster-designer',
              'brochure-design': 'brochure-catalog-designer',
              'graphic-design': 'graphic-designer',
              'custom-design': 'graphic-designer'
            };
            
            srvContainer.innerHTML = services.map(s => {
              const price = s.price || 359;
              const sla = s.sla || '30-45 mins';
              const img = (s.image && s.image.trim() !== '') ? s.image : 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=700&auto=format&fit=crop&q=80';
              const targetSlug = s.slug || slugMap[s.id] || slugMap[s.category];
              const linkUrl = targetSlug ? (targetSlug + '-in-' + currentCityKey + '.html') : ('request.html?city=' + encodeURIComponent(currentCityName) + '&service=' + encodeURIComponent(s.id || s.title));
              const iconSvg = getCityClientBadgeIcon(s);

              return \`
                <div class="group rounded-2xl sm:rounded-3xl bg-white border border-slate-200 overflow-hidden hover:border-blue-300 hover:shadow-md transition-all flex flex-col justify-between shadow-xs">
                  <div>
                    <div class="relative h-28 sm:h-48 bg-slate-100 overflow-hidden">
                      <img src="\${img}" alt="\${s.title || 'Graphic Design'} in \${currentCityName}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=700&auto=format&fit=crop&q=80';" />
                      <div class="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
                      <div class="absolute top-2 left-2 sm:top-3 sm:left-3 w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white/95 backdrop-blur-xs border border-white/60 flex items-center justify-center shadow-sm">
                        \${iconSvg}
                      </div>
                      <span class="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 text-[9px] sm:text-xs uppercase font-extrabold text-emerald-800 bg-white/95 backdrop-blur-xs px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full shadow-xs tracking-wider">
                        ⚡ \${sla}
                      </span>
                    </div>
                    <div class="p-3.5 sm:p-6 space-y-1.5 sm:space-y-2">
                      <h3 class="text-sm sm:text-xl font-extrabold text-slate-950 font-['Space_Grotesk'] leading-snug tracking-tight">\${s.title || 'Custom Design'}</h3>
                      <p class="text-xs sm:text-sm font-semibold text-slate-700 leading-snug line-clamp-2">\${s.description || ''}</p>
                    </div>
                  </div>
                  <div class="p-3.5 sm:p-6 pt-0">
                    <a href="\${linkUrl}" class="w-full text-center py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-800 font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 sm:gap-2">
                      <span>Get in ₹\${price} &rarr;</span>
                    </a>
                  </div>
                </div>\`;
            }).join('');
          }
        } catch(e) { console.error('City services render error:', e); }
      }
`;

code = code.replace(/function renderCityDynamicContent\(\) \{[\s\S]*?\}\s*function populateCityOfficeInfo/, newRenderFn + '\n\n      function populateCityOfficeInfo');

fs.writeFileSync('scripts/update-city-pages.cjs', code);
