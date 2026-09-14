// Automatic Seeder & Migrator for new Supabase project
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://lwcuxohrnrkjyfmszxab.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3Y3V4b2hybnJranlmbXN6eGFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0MTY3ODUsImV4cCI6MjEwNDk5Mjc4NX0.erJAwyIU6qmjyTUf_6cXhYRd2dd9P2IkAJsQWK_SrGo";

const client = createClient(SUPABASE_URL, SUPABASE_KEY);

const DEFAULT_CITY_ADDRESSES = [
  { key: 'bhopal', city: 'bhopal', address: 'MP Nagar Zone-II, Near City Center, Bhopal - 462011', phone: '+91 86024 20897' },
  { key: 'indore', city: 'indore', address: 'Vijay Nagar Square, Near C21 Mall, AB Road, Indore - 452010', phone: '+91 86024 20897' },
  { key: 'jabalpur', city: 'jabalpur', address: 'Civic Center, Near Samdariya Mall, Marhatal, Jabalpur - 482002', phone: '+91 86024 20897' },
  { key: 'gwalior', city: 'gwalior', address: 'City Centre, Near DB Mall, Gwalior - 474011', phone: '+91 86024 20897' }
];

const DEFAULT_SERVICES = [
  { id: 'srv-1', name: 'Social Media Post', price: 399, originalprice: 699, icon: 'Layout', description: 'High-converting Instagram, Facebook, LinkedIn post designs tailored to your brand.', features: ['Custom Graphic Design', 'Source File Included', 'Revisions Included', '1:1 / 4:5 / 9:16 Ratios'], tag: 'Popular' },
  { id: 'srv-2', name: 'Logo & Brand Identity', price: 999, originalprice: 1999, icon: 'Award', description: 'Memorable, modern logo design with full vector assets and typography guideline.', features: ['3 Logo Concepts', 'Vector SVG/EPS + PNG', 'Transparent Background', 'Font & Color Codes'], tag: 'Best Value' },
  { id: 'srv-3', name: 'Story & Reel Cover', price: 299, originalprice: 499, icon: 'Smartphone', description: 'Engaging vertical reel covers and story graphics for instant viewer attention.', features: ['9:16 Mobile Optimized', 'High Quality JPG/PNG', 'Quick Turnaround', '2 Revisions'], tag: '' },
  { id: 'srv-4', name: 'Banner & Poster Design', price: 599, originalprice: 1199, icon: 'Image', description: 'Print-ready and digital banners, outdoor hoardings, and promotional posters.', features: ['High Res Print CMYK', 'RGB Web Formats', 'Custom Dimensions', 'Typography Styling'], tag: '' },
  { id: 'srv-5', name: 'Packaging & Label', price: 1499, originalprice: 2999, icon: 'Package', description: 'Attractive product boxes, pouch mockups, bottle labels, and 3D mockups.', features: ['Die-line Alignment', '3D Realistic Mockup', 'Barcode / QR Prep', 'Commercial License'], tag: '' },
  { id: 'srv-6', name: 'Flyer & Brochure', price: 799, originalprice: 1499, icon: 'FileText', description: 'Corporate single/multi-page brochures, restaurant menus, and product catalogs.', features: ['Single or Bi-fold', 'Print Ready PDF', 'Editable Canva/PSD', 'Icons & Illustrations'], tag: '' },
  { id: 'srv-7', name: 'Custom Illustration', price: 1199, originalprice: 2499, icon: 'PenTool', description: 'Bespoke digital vector illustrations, characters, stickers, and custom artwork.', features: ['100% Unique Art', 'High Res Vector Export', 'Full Commercial Rights', 'Color Variants'], tag: '' }
];

async function runSeed() {
  console.log('Checking connection to new Supabase database...');
  try {
    const { error: cityErr } = await client.from('city_addresses').upsert(DEFAULT_CITY_ADDRESSES);
    if (cityErr) console.warn('city_addresses seed message:', cityErr.message);
    else console.log('✅ Seeded city_addresses successfully!');

    const { error: srvErr } = await client.from('services').upsert(DEFAULT_SERVICES);
    if (srvErr) console.warn('services seed message:', srvErr.message);
    else console.log('✅ Seeded services successfully!');
  } catch (err) {
    console.error('Seed exception:', err.message);
  }
}

runSeed();
