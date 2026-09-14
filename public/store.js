/**
 * Design Quixo Shared State & Core Store
 * Manages Services, Pricing, Jobs, Portfolio, Tracking, and Designer/Admin Earnings
 */

// Immediate synchronous purge of previous project cache
(function() {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      if (localStorage.getItem('dq_icons_updated_v5') !== 'active') {
        localStorage.removeItem('dq_services');
        localStorage.removeItem('dq_portfolio_items');
        localStorage.setItem('dq_icons_updated_v5', 'active');
      }
    }
  } catch (e) {}
})();

const DEFAULT_SERVICES = [
  {
    id: 'social-media',
    title: 'Social Media Posts',
    price: 399,
    sla: '30-45 mins',
    category: 'social',
    description: 'Instagram feeds, reels covers, carousel slides & promotional social media creatives.',
    image: 'social_media.png',
    icon: 'share-2',
    ratio: 'Square (1:1)'
  },
  {
    id: 'youtube-thumbnail',
    title: 'YouTube Thumbnails',
    price: 359,
    sla: '30-45 mins',
    category: 'thumbnail',
    description: 'High-CTR clickable thumbnails with crisp cutouts, rim lighting & creator hooks.',
    image: 'youtube.png',
    icon: 'youtube',
    ratio: 'Landscape (16:9)'
  },
  {
    id: 'vector-art',
    title: 'Vector Art & Tracing',
    price: 599,
    sla: '45-60 mins',
    category: 'vector',
    description: 'Convert blurry JPEGs, logos or sketches into infinite-resolution SVG & EPS vectors.',
    image: 'vector.png',
    icon: 'pen-tool',
    ratio: 'Square (1:1)'
  },
  {
    id: 'visiting-card',
    title: 'Visiting Cards',
    price: 359,
    sla: '30-45 mins',
    category: 'print',
    description: 'Double-sided luxury business card layouts with bleed margins, CMYK print & QR codes.',
    image: 'visiting.png',
    icon: 'credit-card',
    ratio: 'Print / Custom'
  },
  {
    id: 'logo-design',
    title: 'Brand Logo Design',
    price: 499,
    sla: '1-2 hours',
    category: 'branding',
    description: 'Unique, memorable brand marks crafted manually from scratch with complete vector palettes.',
    image: 'logo.png',
    icon: 'award',
    ratio: 'Square (1:1)'
  },
  {
    id: 'packaging-design',
    title: 'Product Label & Pack',
    price: 699,
    sla: '1.5-2 hours',
    category: 'packaging',
    description: 'Die-cut accurate pouch designs, product labels, box wraps & compliant barcodes.',
    image: 'label.png',
    icon: 'package',
    ratio: 'Print / Custom'
  },
  {
    id: 'custom-design',
    title: 'Custom Graphic Design',
    price: 499,
    sla: '45-60 mins',
    category: 'custom',
    description: 'Bespoke posters, brochures, hoardings, standees, menus, merchandise, or any special design request.',
    image: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=700&auto=format&fit=crop&q=80',
    icon: 'palette',
    ratio: 'Custom / As Required'
  }
];

const DEFAULT_PORTFOLIO = [
  {
    id: 'port-1',
    title: 'Tech Review High-CTR Thumbnail',
    category: 'thumbnail',
    deliveryTime: '⚡ 32m Delivery',
    image: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=700&auto=format&fit=crop&q=80',
    description: 'Delivered layered PSD with custom cutout shadows and typography hook.',
    client: 'TechVibe Hindi',
    city: 'Indore, MP'
  },
  {
    id: 'port-2',
    title: 'Artisan Coffee Launch Carousel',
    category: 'social',
    deliveryTime: '⚡ 28m Delivery',
    image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=700&auto=format&fit=crop&q=80',
    description: 'Minimalist aesthetic color grading with custom vector icons.',
    client: 'Brew Artisan Cafe',
    city: 'Bengaluru'
  },
  {
    id: 'port-3',
    title: 'Nexus Pay Fintech Logo Mark',
    category: 'branding',
    deliveryTime: '⚡ 1h 15m Delivery',
    image: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=700&auto=format&fit=crop&q=80',
    description: 'Vector AI, EPS, SVG source files with dark & light theme variants.',
    client: 'NexusPay',
    city: 'Mumbai'
  },
  {
    id: 'port-4',
    title: 'Ayurvedic Skincare Serum Box Dieline',
    category: 'print',
    deliveryTime: '⚡ 1h 45m Delivery',
    image: 'https://images.unsplash.com/photo-1547949003-9792a18a2601?w=700&auto=format&fit=crop&q=80',
    description: 'CMYK 300 DPI print-ready dielines with foil stamping guidelines.',
    client: 'Veda Naturals',
    city: 'Jaipur'
  },
  {
    id: 'port-5',
    title: 'Sunfest Goa EDM Music Poster',
    category: 'print',
    deliveryTime: '⚡ 48m Delivery',
    image: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=700&auto=format&fit=crop&q=80',
    description: 'Vibrant typography with festival lineup layout and ticket QR.',
    client: 'Sunfest Live',
    city: 'Delhi NCR'
  },
  {
    id: 'port-6',
    title: 'Pro Esports Tournament Cover',
    category: 'thumbnail',
    deliveryTime: '⚡ 35m Delivery',
    image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=700&auto=format&fit=crop&q=80',
    description: 'Neon atmospheric glow and bold Hindi + English typography.',
    client: 'Clan Alpha Gaming',
    city: 'Pune'
  }
];

const INITIAL_SAMPLE_JOBS = [];

// Resilient Background Cloud Sync Helpers (Auto-retries if Supabase module is loading)
function getCloudDb() {
  if (typeof window === 'undefined') return null;
  return window.DQSupabase || window.DQFirebase || null;
}

function syncServiceCloud(service) {
  if (typeof window === 'undefined' || !service || !service.id) return;
  const db = getCloudDb();
  if (db && typeof db.saveService === 'function') {
    db.saveService(service).catch(e => console.warn('Service cloud sync error:', e));
  } else {
    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      const lateDb = getCloudDb();
      if (lateDb && typeof lateDb.saveService === 'function') {
        clearInterval(interval);
        lateDb.saveService(service).catch(e => console.warn('Delayed service cloud sync error:', e));
      } else if (attempts > 20) {
        clearInterval(interval);
      }
    }, 400);
  }
}

function deleteServiceCloud(serviceId) {
  if (typeof window === 'undefined' || !serviceId) return;
  const db = getCloudDb();
  if (db && typeof db.deleteService === 'function') {
    db.deleteService(serviceId).catch(e => console.warn('Service cloud delete error:', e));
  }
}

function syncPortfolioCloud(item) {
  if (typeof window === 'undefined' || !item || !item.id) return;
  const db = getCloudDb();
  if (db && typeof db.savePortfolioItem === 'function') {
    db.savePortfolioItem(item).catch(e => console.warn('Portfolio cloud sync error:', e));
  } else {
    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      const lateDb = getCloudDb();
      if (lateDb && typeof lateDb.savePortfolioItem === 'function') {
        clearInterval(interval);
        lateDb.savePortfolioItem(item).catch(e => console.warn('Delayed portfolio cloud sync error:', e));
      } else if (attempts > 20) {
        clearInterval(interval);
      }
    }, 400);
  }
}

function deletePortfolioCloud(itemId) {
  if (typeof window === 'undefined' || !itemId) return;
  const db = getCloudDb();
  if (db && typeof db.deletePortfolioItem === 'function') {
    db.deletePortfolioItem(itemId).catch(e => console.warn('Portfolio cloud delete error:', e));
  }
}

function syncCityCloud(cityKey, addressData) {
  if (typeof window === 'undefined' || !cityKey) return;
  // Direct Server API call
  try {
    fetch('/api/save-city-address', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        key: cityKey,
        city: cityKey,
        address: addressData.address || '',
        phone: addressData.phone || '+91 86024 20897',
        name: addressData.name || ''
      })
    }).catch(() => {});
  } catch(e) {}

  const db = getCloudDb();
  if (db && typeof db.saveCityAddress === 'function') {
    db.saveCityAddress(cityKey, addressData).catch(e => console.warn('City cloud sync error:', e));
  } else {
    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      const lateDb = getCloudDb();
      if (lateDb && typeof lateDb.saveCityAddress === 'function') {
        clearInterval(interval);
        lateDb.saveCityAddress(cityKey, addressData).catch(e => console.warn('Delayed city cloud sync error:', e));
      } else if (attempts > 20) {
        clearInterval(interval);
      }
    }, 400);
  }
}

window.DQStore = {
  // Services
  getServices() {
    try {
      const stored = localStorage.getItem('dq_services');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Check if custom-design exists in parsed, if not append it
          if (!parsed.some(s => s.id === 'custom-design')) {
            parsed.push({
              id: 'custom-design',
              title: 'Custom Graphic Design',
              price: 499,
              sla: '45-60 mins',
              category: 'custom',
              description: 'Bespoke posters, brochures, hoardings, standees, menus, merchandise, or any special design request.',
              image: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=700&auto=format&fit=crop&q=80',
              icon: 'sparkles',
              ratio: 'Custom / As Required'
            });
            localStorage.setItem('dq_services', JSON.stringify(parsed));
          }
          // Preserve custom/admin changed images; fallback to default if empty & enforce proper relative icons
          return parsed.map(s => {
            if (s.id === 'youtube-thumbnail') s.icon = 'youtube';
            else if (s.id === 'logo-design') s.icon = 'award';
            else if (s.id === 'social-media') s.icon = 'share-2';
            else if (s.id === 'vector-art') s.icon = 'pen-tool';
            else if (s.id === 'visiting-card') s.icon = 'credit-card';
            else if (s.id === 'packaging-design') s.icon = 'package';
            else if (s.id === 'custom-design' && (!s.icon || s.icon === 'sparkles')) s.icon = 'palette';

            if (!s.image) {
              if (s.id === 'social-media') s.image = 'social_media.png';
              else if (s.id === 'youtube-thumbnail') s.image = 'youtube.png';
              else if (s.id === 'vector-art') s.image = 'vector.png';
              else if (s.id === 'visiting-card') s.image = 'visiting.png';
              else if (s.id === 'logo-design') s.image = 'logo.png';
              else if (s.id === 'packaging-design') s.image = 'label.png';
              else if (s.id === 'custom-design') s.image = 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=700&auto=format&fit=crop&q=80';
              else s.image = 'social_media.png';
            }
            return s;
          });
        }
      }
    } catch (e) {}
    localStorage.setItem('dq_services', JSON.stringify(DEFAULT_SERVICES));
    return DEFAULT_SERVICES;
  },

  saveServices(services) {
    localStorage.setItem('dq_services', JSON.stringify(services));
    window.dispatchEvent(new CustomEvent('dq_services_updated', { detail: services }));
    if (Array.isArray(services)) {
      services.forEach(s => syncServiceCloud(s));
    }
  },

  updateService(serviceId, updatedFields) {
    const list = this.getServices();
    const idx = list.findIndex(s => s.id === serviceId);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...updatedFields };
      this.saveServices(list);
      syncServiceCloud(list[idx]);
      return list[idx];
    }
    return null;
  },

  getServiceById(id) {
    const list = this.getServices();
    return list.find(s => s.id === id || s.title.toLowerCase().includes(id.toLowerCase())) || list[0];
  },

  addService(service) {
    const list = this.getServices();
    const newService = {
      id: service.id || ('custom-' + Date.now()),
      title: service.title || 'Custom Design Service',
      price: Number(service.price) || 499,
      sla: service.sla || '45-60 mins',
      category: service.category || 'custom',
      description: service.description || service.desc || 'Custom graphic design project.',
      image: service.image || 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=700&auto=format&fit=crop&q=80',
      icon: service.icon || 'sparkles',
      ratio: service.ratio || 'Custom / As Required'
    };
    list.push(newService);
    this.saveServices(list);
    syncServiceCloud(newService);
    return newService;
  },

  deleteService(serviceId) {
    const list = this.getServices();
    const filtered = list.filter(s => s.id !== serviceId);
    this.saveServices(filtered);
    deleteServiceCloud(serviceId);
    return filtered;
  },

  getPortfolioItemById(portId) {
    if (!portId) return null;
    const list = this.getPortfolio();
    return list.find(p => p.id === portId) || null;
  },

  updatePortfolioItem(portId, updatedFields) {
    const list = this.getPortfolio();
    const idx = list.findIndex(p => p.id === portId);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...updatedFields };
      localStorage.setItem('dq_portfolio_items', JSON.stringify(list));
      window.dispatchEvent(new CustomEvent('dq_portfolio_updated', { detail: list }));
      syncPortfolioCloud(list[idx]);
      return list[idx];
    }
    return null;
  },

  addPortfolioItem(item) {
    const list = this.getPortfolio();
    const newItem = {
      id: 'port-' + Date.now(),
      title: item.title || 'Creative Project',
      category: item.category || 'social',
      deliveryTime: item.deliveryTime || '⚡ 30-45m Delivery',
      image: item.image || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=700&auto=format&fit=crop&q=80',
      description: item.description || 'Handcrafted vector design delivered with layered source files.',
      client: item.client || 'Verified Brand',
      city: item.city || 'India'
    };
    list.unshift(newItem);
    this.savePortfolio(list);
    syncPortfolioCloud(newItem);
    return newItem;
  },

  deletePortfolioItem(portId) {
    const list = this.getPortfolio();
    const filtered = list.filter(p => p.id !== portId);
    this.savePortfolio(filtered);
    deletePortfolioCloud(portId);
    return filtered;
  },

  resetServicesToDefault() {
    this.saveServices(DEFAULT_SERVICES);
    return DEFAULT_SERVICES;
  },

  resetPortfolioToDefault() {
    this.savePortfolio(DEFAULT_PORTFOLIO);
    return DEFAULT_PORTFOLIO;
  },

  savePortfolio(items) {
    localStorage.setItem('dq_portfolio_items', JSON.stringify(items));
    window.dispatchEvent(new CustomEvent('dq_portfolio_updated', { detail: items }));
    if (Array.isArray(items)) {
      items.forEach(p => syncPortfolioCloud(p));
    }
  },

  // City Hub Addresses (Configurable by Admin & Rendered on Landing Pages)
  getDefaultCityAddresses() {
    return {
      'indore': {
        name: 'Indore Central Creative Hub',
        address: 'Vijay Nagar Commercial Complex, Near Brilliant Convention Centre, A.B. Road, Indore, MP 452010',
        landmark: 'Vijay Nagar Square / Super Corridor',
        phone: '+91 86024 20897',
        whatsapp: '918602420897',
        hours: 'Open Daily 9:00 AM - 11:30 PM (30m Express Delivery)'
      },
      'bhopal': {
        name: 'Bhopal Creative Hub',
        address: 'Zone-1, M.P. Nagar, Near DB City Mall, Bhopal, MP 462011',
        landmark: 'MP Nagar Zone 1 / Arera Colony',
        phone: '+91 86024 20897',
        whatsapp: '918602420897',
        hours: 'Open Daily 9:00 AM - 11:30 PM'
      },
      'mumbai': {
        name: 'Mumbai Regional Operations',
        address: 'Platina Tower, G-Block, Bandra Kurla Complex (BKC), Bandra East, Mumbai, MH 400051',
        landmark: 'BKC Business District / Bandra West',
        phone: '+91 86024 20897',
        whatsapp: '918602420897',
        hours: 'Open 24/7 Priority Workstations'
      },
      'delhi': {
        name: 'Delhi NCR Creative Studio',
        address: 'Statesman House, Barakhamba Road, Connaught Place, New Delhi, DL 110001',
        landmark: 'Connaught Place / Cyber City Gurugram',
        phone: '+91 86024 20897',
        whatsapp: '918602420897',
        hours: 'Open Daily 9:00 AM - 11:30 PM'
      },
      'delhi-ncr': {
        name: 'Delhi NCR Regional Studio',
        address: 'Statesman House, Barakhamba Road, Connaught Place, New Delhi, DL 110001',
        landmark: 'Connaught Place / Cyber City Gurugram',
        phone: '+91 86024 20897',
        whatsapp: '918602420897',
        hours: 'Open Daily 9:00 AM - 11:30 PM'
      },
      'bangalore': {
        name: 'Bangalore Tech Creative Node',
        address: 'Prestige Meridian, 100 Feet Road, 4th Block, Koramangala, Bengaluru, KA 560034',
        landmark: 'Koramangala 4th Block / Indiranagar',
        phone: '+91 86024 20897',
        whatsapp: '918602420897',
        hours: 'Open Daily 9:00 AM - 11:30 PM'
      },
      'hyderabad': {
        name: 'Hyderabad Creator Hub',
        address: 'Cyber Towers, HITEC City Main Road, Madhapur, Hyderabad, TS 500081',
        landmark: 'HITEC City / Jubilee Hills',
        phone: '+91 86024 20897',
        whatsapp: '918602420897',
        hours: 'Open Daily 9:00 AM - 11:30 PM'
      },
      'pune': {
        name: 'Pune Design Workstation',
        address: 'Business Bay, North Main Road, Koregaon Park, Pune, MH 411001',
        landmark: 'Koregaon Park / Baner',
        phone: '+91 86024 20897',
        whatsapp: '918602420897',
        hours: 'Open Daily 9:00 AM - 11:30 PM'
      },
      'ahmedabad': {
        name: 'Ahmedabad Commercial Hub',
        address: 'Mondeal Heights, S.G. Highway, Prahlad Nagar, Ahmedabad, GJ 380015',
        landmark: 'S.G. Highway / Bodakdev',
        phone: '+91 86024 20897',
        whatsapp: '918602420897',
        hours: 'Open Daily 9:00 AM - 11:30 PM'
      },
      'jaipur': {
        name: 'Jaipur Creative Studio',
        address: 'Apex Tower, Tonk Road, C-Scheme, Jaipur, RJ 302001',
        landmark: 'C-Scheme / Malviya Nagar',
        phone: '+91 86024 20897',
        whatsapp: '918602420897',
        hours: 'Open Daily 9:00 AM - 11:30 PM'
      },
      'chennai': {
        name: 'Chennai Studio Node',
        address: 'Tidel Park, Rajiv Gandhi Salai, Taramani / OMR, Chennai, TN 600113',
        landmark: 'OMR IT Corridor / T. Nagar',
        phone: '+91 86024 20897',
        whatsapp: '918602420897',
        hours: 'Open Daily 9:00 AM - 11:30 PM'
      },
      'kolkata': {
        name: 'Kolkata Design Center',
        address: 'Millennium City IT Park, DN Block, Sector V, Salt Lake, Kolkata, WB 700091',
        landmark: 'Salt Lake Sector V / Park Street',
        phone: '+91 86024 20897',
        whatsapp: '918602420897',
        hours: 'Open Daily 9:00 AM - 11:30 PM'
      },
      'lucknow': {
        name: 'Lucknow Operations Hub',
        address: 'Rana Pratap Marg, Hazratganj & Gomti Nagar, Lucknow, UP 226001',
        landmark: 'Hazratganj / Gomti Nagar',
        phone: '+91 86024 20897',
        whatsapp: '918602420897',
        hours: 'Open Daily 9:00 AM - 11:30 PM'
      },
      'surat': {
        name: 'Surat Commercial Center',
        address: 'International Business Center, VIP Road, Vesu, Surat, GJ 395007',
        landmark: 'Vesu / Ring Road Textile Market',
        phone: '+91 86024 20897',
        whatsapp: '918602420897',
        hours: 'Open Daily 9:00 AM - 11:30 PM'
      },
      'chandigarh': {
        name: 'Chandigarh Studio Hub',
        address: 'City Centre, Sector 17-C, Near Parade Ground, Chandigarh, CH 160017',
        landmark: 'Sector 17 / Mohali Phase 7',
        phone: '+91 86024 20897',
        whatsapp: '918602420897',
        hours: 'Open Daily 9:00 AM - 11:30 PM'
      },
      'nagpur': {
        name: 'Nagpur Creative Hub',
        address: 'Empress City, Ramdaspeth, Wardha Road, Nagpur, MH 440010',
        landmark: 'Ramdaspeth / Sitabuldi',
        phone: '+91 86024 20897',
        whatsapp: '918602420897',
        hours: 'Open Daily 9:00 AM - 11:30 PM'
      },
      'patna': {
        name: 'Patna Regional Studio',
        address: 'Biscomaun Bhawan, Gandhi Maidan, Fraser Road, Patna, BR 800001',
        landmark: 'Gandhi Maidan / Boring Road',
        phone: '+91 86024 20897',
        whatsapp: '918602420897',
        hours: 'Open Daily 9:00 AM - 11:30 PM'
      },
      'kochi': {
        name: 'Kochi Creative Desk',
        address: 'Infopark Expressway, Kakkanad, Kochi, KL 682042',
        landmark: 'Kakkanad Infopark / MG Road',
        phone: '+91 86024 20897',
        whatsapp: '918602420897',
        hours: 'Open Daily 9:00 AM - 11:30 PM'
      }
    };
  },

  getCityAddresses() {
    try {
      const stored = localStorage.getItem('dq_city_addresses');
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...this.getDefaultCityAddresses(), ...parsed };
      }
    } catch(e) {}
    return this.getDefaultCityAddresses();
  },

  getCityAddress(cityKey) {
    const addresses = this.getCityAddresses();
    const cleanKey = (cityKey || '').toString().toLowerCase().trim().replace(/\s+/g, '-');
    return addresses[cleanKey] || addresses['indore'] || {
      name: `${(cityKey || 'City').toUpperCase()} Design Hub`,
      address: `Express Creative Dispatch Center, Commercial Area, ${cityKey || 'Local Hub'}`,
      landmark: 'Main Commercial Center',
      phone: '+91 86024 20897',
      whatsapp: '918602420897',
      hours: 'Open Daily 9:00 AM - 11:30 PM'
    };
  },

  saveCityAddress(cityKey, addressData) {
    const cleanKey = (cityKey || '').toString().toLowerCase().trim().replace(/\s+/g, '-');
    const all = this.getCityAddresses();
    all[cleanKey] = { ...all[cleanKey], ...addressData };
    localStorage.setItem('dq_city_addresses', JSON.stringify(all));
    window.dispatchEvent(new CustomEvent('dq_cities_updated', { detail: all }));
    syncCityCloud(cleanKey, all[cleanKey]);
    return all[cleanKey];
  },

  // Universal Job Price Resolver (Matches exact service price or category defaults)
  getJobPrice(job) {
    if (!job) return 399;
    if (job.price && Number(job.price) > 0) {
      return Number(job.price);
    }
    const rawSvc = (job.service || job.serviceId || job.category || '').toString().toLowerCase().trim();
    
    // Check registered services
    const services = this.getServices();
    const matched = services.find(s => 
      s.id.toLowerCase() === rawSvc || 
      s.title.toLowerCase() === rawSvc ||
      rawSvc.includes(s.id.toLowerCase()) ||
      s.title.toLowerCase().includes(rawSvc)
    );
    if (matched && matched.price) return Number(matched.price);

    // Fallback dictionary for all service types
    if (rawSvc.includes('youtube') || rawSvc.includes('thumbnail')) return 359;
    if (rawSvc.includes('visiting') || rawSvc.includes('card') || rawSvc.includes('business card')) return 359;
    if (rawSvc.includes('social') || rawSvc.includes('instagram') || rawSvc.includes('post') || rawSvc.includes('feed') || rawSvc.includes('reel')) return 399;
    if (rawSvc.includes('flyer') || rawSvc.includes('poster') || rawSvc.includes('banner')) return 449;
    if (rawSvc.includes('logo') || rawSvc.includes('branding') || rawSvc.includes('brand')) return 499;
    if (rawSvc.includes('vector') || rawSvc.includes('tracing') || rawSvc.includes('svg')) return 599;
    if (rawSvc.includes('brochure') || rawSvc.includes('catalog') || rawSvc.includes('menu')) return 599;
    if (rawSvc.includes('packaging') || rawSvc.includes('label') || rawSvc.includes('pouch') || rawSvc.includes('box')) return 699;
    
    return 399;
  },

  // Calculate designer payout (60%)
  getDesignerPayout(price) {
    const num = Number(price) || 0;
    return Math.round(num * 0.60);
  },

  // Calculate platform cut (40%)
  getPlatformCut(price) {
    const num = Number(price) || 0;
    return Math.round(num * 0.40);
  },

  // Icon Helper that reliably outputs relative inline SVG icons for every service
  renderIconHtml(serviceOrIcon, classes = 'w-4 h-4 sm:w-5 sm:h-5') {
    let iconName = '';
    let svcId = '';
    if (typeof serviceOrIcon === 'object' && serviceOrIcon !== null) {
      svcId = (serviceOrIcon.id || serviceOrIcon.serviceId || serviceOrIcon.category || '').toLowerCase();
      iconName = (serviceOrIcon.icon || '').toLowerCase();
    } else {
      iconName = (serviceOrIcon || '').toString().toLowerCase();
      svcId = iconName;
    }

    // 1. YouTube Thumbnails -> Authentic Red YouTube Badge with white play triangle
    if (svcId.includes('youtube') || svcId.includes('thumbnail') || iconName === 'youtube' || iconName === 'play-square' || iconName === 'video') {
      return `<svg class="${classes} shrink-0" viewBox="0 0 24 24"><path fill="#FF0000" d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z"/><path fill="#FFFFFF" d="M9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>`;
    }

    // 2. Brand Logo Design -> Golden Medal / Award Ribbon Badge
    if (svcId.includes('logo') || svcId.includes('branding') || iconName === 'award' || iconName === 'crown' || iconName === 'hexagon') {
      return `<svg class="${classes} shrink-0" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>`;
    }

    // 3. Visiting Cards / Business Cards -> Modern Credit / Visiting Card Badge
    if (svcId.includes('visiting') || svcId.includes('card') || iconName === 'credit-card') {
      return `<svg class="${classes} shrink-0" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/><circle cx="6" cy="15" r="1" fill="#059669"/></svg>`;
    }

    // 4. Product Label & Packaging -> 3D Package Box Badge
    if (svcId.includes('pack') || svcId.includes('label') || iconName === 'package' || iconName === 'box') {
      return `<svg class="${classes} shrink-0" viewBox="0 0 24 24" fill="none" stroke="#EA580C" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>`;
    }

    // 5. Social Media Posts -> Network Share / Connect Badge
    if (svcId.includes('social') || iconName === 'share-2' || iconName === 'share') {
      return `<svg class="${classes} shrink-0" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" x2="15.42" y1="13.51" y2="17.49"/><line x1="15.41" x2="8.59" y1="6.51" y2="10.49"/></svg>`;
    }

    // 6. Vector Art & Tracing -> Professional Pen Tool Badge
    if (svcId.includes('vector') || iconName === 'pen-tool' || iconName === 'pen') {
      return `<svg class="${classes} shrink-0" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 19 7-7 3 3-7 7-3-3z"/><path d="m18 13-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="m2 2 7.586 7.586"/><circle cx="11" cy="11" r="2"/></svg>`;
    }

    // 7. Custom Graphic Design -> Artist Palette Badge
    if (svcId.includes('custom') || iconName === 'palette' || iconName === 'brush') {
      return `<svg class="${classes} shrink-0" viewBox="0 0 24 24" fill="none" stroke="#9333EA" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="13.5" cy="6.5" r=".5" fill="#9333EA"/><circle cx="17.5" cy="10.5" r=".5" fill="#9333EA"/><circle cx="8.5" cy="7.5" r=".5" fill="#9333EA"/><circle cx="6.5" cy="12.5" r=".5" fill="#9333EA"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>`;
    }

    // 8. Flyers & Pamphlets -> Document / Flyer Badge
    if (svcId.includes('flyer') || svcId.includes('pamphlet') || iconName === 'file-text') {
      return `<svg class="${classes} shrink-0" viewBox="0 0 24 24" fill="none" stroke="#E11D48" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/></svg>`;
    }

    // 9. Restaurant Menu -> Open Book / Menu Badge
    if (svcId.includes('menu') || svcId.includes('restaurant') || iconName === 'book-open') {
      return `<svg class="${classes} shrink-0" viewBox="0 0 24 24" fill="none" stroke="#D97706" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>`;
    }

    // Default Fallback: Creative Sparkles Vector
    return `<svg class="${classes} shrink-0 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>`;
  },

  // Portfolio
  getPortfolio() {
    try {
      const stored = localStorage.getItem('dq_portfolio_items');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(p => ({
            client: 'Verified Brand',
            city: 'India',
            ...p
          }));
        }
      }
    } catch (e) {}
    localStorage.setItem('dq_portfolio_items', JSON.stringify(DEFAULT_PORTFOLIO));
    return DEFAULT_PORTFOLIO;
  },


  // Canonical Job ID Normalizer (Consistently produces DQ-XXXXXX, eliminating duplicates)
  normalizeJobId(id) {
    if (!id) return '';
    let str = id.toString().trim().toUpperCase();
    str = str.replace(/^(DQ[-_]?)+/i, '');
    return 'DQ-' + str;
  },

  // Deduplicate and filter blacklisted/deleted jobs
  deduplicateJobs(jobsList) {
    if (!Array.isArray(jobsList)) return [];
    let deletedJobs = [];
    try {
      deletedJobs = JSON.parse(localStorage.getItem('dq_deleted_jobs') || '[]');
    } catch(e) {}
    const deletedNormSet = new Set(deletedJobs.map(d => this.normalizeJobId(d)));

    const seen = new Set();
    const result = [];

    for (const j of jobsList) {
      if (!j) continue;
      const normId = this.normalizeJobId(j.id || j.jobId);
      if (!normId) continue;

      // Permanently filter out legacy dummy demo jobs
      const normIdStr = normId.toString();
      if (normIdStr === 'DQ-8492' || normIdStr === 'DQ-7319' || 
          normIdStr === 'DQ-3LZEFW' || normIdStr === 'DQ-PEHTGK' || normIdStr === 'DQ-NY8Q84') {
        continue;
      }

      if (deletedNormSet.has(normId)) continue; // Block deleted/blacklisted
      if (seen.has(normId)) continue; // Block duplicates!
      seen.add(normId);

      j.id = normId; // Ensure canonical ID on object
      result.push(j);
    }
    return result;
  },

  // Jobs
  getJobs() {
    try {
      const stored = localStorage.getItem('dq_live_jobs');
      if (stored !== null) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return this.deduplicateJobs(parsed);
        }
      }
    } catch (e) {}
    return [];
  },

  saveJobs(jobs) {
    const clean = this.deduplicateJobs(jobs);
    localStorage.setItem('dq_live_jobs', JSON.stringify(clean));
    return clean;
  },

  deleteJob(jobId) {
    if (!jobId) return false;
    const normId = this.normalizeJobId(jobId);
    const bareId = normId.replace(/^DQ-/, '');

    // 1. Add ALL variations to dq_deleted_jobs blacklist
    try {
      let deletedJobs = JSON.parse(localStorage.getItem('dq_deleted_jobs') || '[]');
      [normId, bareId, jobId.toString().trim().toUpperCase(), `DQ${bareId}`].forEach(v => {
        if (v && !deletedJobs.includes(v)) deletedJobs.push(v);
      });
      localStorage.setItem('dq_deleted_jobs', JSON.stringify(deletedJobs));
    } catch(e) {}

    // 2. Remove from local storage
    let jobs = [];
    try {
      jobs = JSON.parse(localStorage.getItem('dq_live_jobs') || '[]');
    } catch(e) {}
    const initialLen = jobs.length;
    jobs = jobs.filter(j => {
      const jNorm = this.normalizeJobId(j.id || j.jobId);
      return jNorm !== normId && (j.id || '').toUpperCase() !== normId && (j.id || '').toUpperCase() !== bareId;
    });
    localStorage.setItem('dq_live_jobs', JSON.stringify(jobs));

    // 3. Dispatch to Supabase / Cloud if present
    const cloudDb = getCloudDb();
    if (cloudDb && typeof cloudDb.deleteJob === 'function') {
      cloudDb.deleteJob(normId);
    }

    return jobs.length < initialLen;
  },

  getJobById(jobId) {
    if (!jobId) return null;
    const targetNorm = this.normalizeJobId(jobId);
    const jobs = this.getJobs();
    return jobs.find(j => this.normalizeJobId(j.id || j.jobId) === targetNorm) || null;
  },

  // Update Job Status
  updateJobStatus(jobId, newStatus, isCompleted = null) {
    const targetNorm = this.normalizeJobId(jobId);
    const jobs = this.getJobs();
    let updated = null;
    jobs.forEach(j => {
      if (this.normalizeJobId(j.id || j.jobId) === targetNorm) {
        j.status = newStatus;
        if (isCompleted !== null) {
          j.completed = isCompleted;
          if (isCompleted && !j.completedAt) {
            j.completedAt = new Date().toISOString();
          }
        } else if (newStatus.toLowerCase().includes('completed') || newStatus.toLowerCase().includes('delivered')) {
          j.completed = true;
          j.completedAt = j.completedAt || new Date().toISOString();
        }
        updated = j;
      }
    });
    if (updated) {
      this.saveJobs(jobs);
      const cloudDb = getCloudDb();
      if (cloudDb && typeof cloudDb.updateJobStatus === 'function') {
        cloudDb.updateJobStatus(targetNorm, newStatus, { completed: updated.completed });
      }
    }
    return updated;
  },

  // Earnings calculations
  getAdminEarnings() {
    const jobs = this.getJobs();
    return jobs
      .filter(j => j.completed === true)
      .reduce((sum, j) => sum + this.getJobPrice(j), 0);
  },

  // Universal Date Parser (Supports Indian DD/MM/YYYY, ISO, locale strings & relative times)
  parseDate(rawDate) {
    if (!rawDate) return new Date();
    if (rawDate instanceof Date) return rawDate;
    if (typeof rawDate === 'number') return new Date(rawDate);

    const str = rawDate.toString().trim();
    if (!str || str.toLowerCase().includes('ago') || str.toLowerCase().includes('now') || str.toLowerCase().includes('active') || str.toLowerCase().includes('recent')) {
      return new Date();
    }

    // Check Indian format DD/MM/YYYY or DD-MM-YYYY
    const dmyMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})(.*)$/);
    if (dmyMatch) {
      const day = parseInt(dmyMatch[1], 10);
      const month = parseInt(dmyMatch[2], 10) - 1;
      const year = parseInt(dmyMatch[3], 10);
      const rest = dmyMatch[4] || '';

      let hours = 0, minutes = 0, seconds = 0;
      const timeMatch = rest.match(/(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?\s*(am|pm)?/i);
      if (timeMatch) {
        hours = parseInt(timeMatch[1], 10);
        minutes = parseInt(timeMatch[2], 10);
        seconds = timeMatch[3] ? parseInt(timeMatch[3], 10) : 0;
        const ampm = (timeMatch[4] || '').toLowerCase();
        if (ampm === 'pm' && hours < 12) hours += 12;
        if (ampm === 'am' && hours === 12) hours = 0;
      }
      const d = new Date(year, month, day, hours, minutes, seconds);
      if (!isNaN(d.getTime())) return d;
    }

    const parsed = Date.parse(str);
    if (!isNaN(parsed)) return new Date(parsed);

    return new Date();
  },

  // Dynamic Time-Filtered Admin Financial Analytics (100% Original Value)
  getFilteredAdminStats(timeFilter = 'all') {
    const jobs = this.getJobs() || [];
    const now = new Date();

    const filteredJobs = jobs.filter(j => {
      if (!j) return false;
      if (timeFilter === 'all') return true;

      const date = this.parseDate(j.createdAt || j.completedAt || j.date || j.time);
      if (!date || isNaN(date.getTime())) return true;

      if (timeFilter === 'today') {
        return date.getFullYear() === now.getFullYear() &&
               date.getMonth() === now.getMonth() &&
               date.getDate() === now.getDate();
      } else if (timeFilter === '7days') {
        const diffMs = now.getTime() - date.getTime();
        return diffMs >= -86400000 && diffMs <= (7 * 24 * 60 * 60 * 1000);
      } else if (timeFilter === 'month') {
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      } else if (timeFilter === 'year') {
        return date.getFullYear() === now.getFullYear();
      }
      return true;
    });

    let completedRevenue = 0;
    let completedOrders = 0;
    let inProgressOrders = 0;
    let pipelinePendingRevenue = 0;

    filteredJobs.forEach(job => {
      const price = this.getJobPrice(job);

      const isCompleted = job.completed === true || 
                          (job.status && (job.status.toLowerCase().includes('completed') || job.status.toLowerCase().includes('delivered')));
      
      if (isCompleted) {
        completedRevenue += price;
        completedOrders++;
      } else {
        pipelinePendingRevenue += price;
        inProgressOrders++;
      }
    });

    const totalOrders = filteredJobs.length;
    // Real realized revenue strictly on properly completed jobs
    const grossRevenue = completedRevenue;
    // Designer cut (60% payout) & Platform cut (40% net share) strictly on realized completed earnings
    const designerPayouts = Math.round(completedRevenue * 0.60);
    const platformNetShare = completedRevenue - designerPayouts;

    return {
      timeFilter,
      totalOrders: totalOrders || 0,
      completedOrders: completedOrders || 0,
      completedCount: completedOrders || 0,
      inProgressOrders: inProgressOrders || 0,
      pendingCount: inProgressOrders || 0,
      grossRevenue: grossRevenue || 0,
      totalGrossRevenue: grossRevenue || 0,
      completedRevenue: completedRevenue || 0,
      pipelinePendingRevenue: pipelinePendingRevenue || 0,
      pipelineTotalValue: (completedRevenue + pipelinePendingRevenue) || 0,
      designerPayouts: designerPayouts || 0,
      platformNetShare: platformNetShare || 0,
      platformNetProfit: platformNetShare || 0,
      filteredJobs: filteredJobs || []
    };
  },

  getDesignerEarnings(designerIdentifier) {
    const jobs = this.getJobs();
    if (!designerIdentifier) return 0;
    const clean = designerIdentifier.toString().toLowerCase().replace(/[^0-9a-z]/g, '');
    
    // Also include any manual accumulated earnings if present
    let extraEarnings = 0;
    try {
      extraEarnings = Number(localStorage.getItem(`dq_extra_earnings_${clean}`)) || 0;
    } catch(e) {}

    const fromCompletedJobs = jobs
      .filter(j => {
        if (!j.completed) return false;
        if (!Array.isArray(j.acceptedBy)) return false;
        return j.acceptedBy.some(a => {
          const aClean = a.toString().toLowerCase().replace(/[^0-9a-z]/g, '');
          return aClean.includes(clean) || clean.includes(aClean);
        });
      })
      .reduce((sum, j) => sum + this.getDesignerPayout(this.getJobPrice(j)), 0);

    return fromCompletedJobs + extraEarnings;
  }
};

// Immediate self-cleanup of legacy demo jobs & deleted jobs sync
(function() {
  try {
    let deletedJobs = [];
    try { deletedJobs = JSON.parse(localStorage.getItem('dq_deleted_jobs') || '[]'); } catch(e) {}
    ['DQ-8492', '8492', 'DQ8492', 'DQ-7319', '7319', 'DQ7319'].forEach(v => {
      if (!deletedJobs.includes(v)) deletedJobs.push(v);
    });
    localStorage.setItem('dq_deleted_jobs', JSON.stringify(deletedJobs));

    let liveJobs = [];
    try { liveJobs = JSON.parse(localStorage.getItem('dq_live_jobs') || '[]'); } catch(e) {}
    if (Array.isArray(liveJobs) && liveJobs.length > 0) {
      const cleaned = liveJobs.filter(j => {
        if (!j) return false;
        const id = (j.id || j.jobId || '').toString().toUpperCase();
        const p = (j.project || j.projectName || '').toString();
        if (id.includes('8492') || id.includes('7319') || p.includes('Urban Spice') || p.includes('TechPulse')) {
          return false;
        }
        return true;
      });
      localStorage.setItem('dq_live_jobs', JSON.stringify(cleaned));
    }
  } catch(e) {}
})();
