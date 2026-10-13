/**
 * seed.ts — Seeds MongoDB with 20 real demo products, categories, and attributes.
 * Run with: npx tsx src/seed.ts
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import { Product } from './models/Product';
import { Category, AttributeDefinition } from './models/Category';
import { ActivityEvent } from './models/ActivityEvent';

const MONGODB_URI = process.env.MONGODB_URI!;

const CATEGORIES = [
  { name: 'Electronics', slug: 'electronics', description: 'Electronic devices and gadgets', color: '#3b82f6' },
  { name: 'Home & Living', slug: 'home-living', description: 'Home decor and furniture', color: '#10b981' },
  { name: 'Fashion', slug: 'fashion', description: 'Clothing and accessories', color: '#ec4899' },
  { name: 'Beauty', slug: 'beauty', description: 'Skincare and cosmetics', color: '#f59e0b' },
  { name: 'Sports', slug: 'sports', description: 'Sports and fitness equipment', color: '#ef4444' },
  { name: 'Toys', slug: 'toys', description: 'Toys and games for all ages', color: '#8b5cf6' },
  { name: 'Food & Grocery', slug: 'food-grocery', description: 'Food and grocery items', color: '#6366f1' },
];

const ATTRIBUTES = [
  { name: 'Material', type: 'text', required: false, description: 'Product material' },
  { name: 'Color', type: 'select', options: ['Black', 'White', 'Grey', 'Navy', 'Red', 'Blue', 'Green', 'Multi', 'Beige', 'Brown'], required: false, description: 'Product color' },
  { name: 'Size', type: 'select', options: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'One Size'], required: false, description: 'Product size' },
  { name: 'Weight', type: 'text', required: false, description: 'Product weight (e.g. 250g)' },
  { name: 'Battery Life', type: 'text', required: false, description: 'Battery duration in hours' },
  { name: 'Water Resistance', type: 'select', options: ['IPX4', 'IPX5', 'IPX7', 'IP67', 'IP68', 'None'], required: false, description: 'Water resistance rating' },
  { name: 'Warranty', type: 'select', options: ['1 Year', '2 Years', '3 Years', 'Lifetime', 'None'], required: false, description: 'Warranty period' },
  { name: 'Country of Origin', type: 'text', required: false, description: 'Manufacturing country' },
  { name: 'Skin Type', type: 'multiselect', options: ['Dry', 'Oily', 'Combination', 'Sensitive', 'All'], required: false, description: 'Suitable skin types' },
  { name: 'Age Range', type: 'select', options: ['0-2', '3-5', '6-12', '12+', 'Adult'], required: false, description: 'Target age range' },
];

const PRODUCTS = [
  // ── ELECTRONICS ──────────────────────────────────────────────────────────────
  {
    name: 'Sony WH-1000XM5 Wireless Headphones',
    sku: 'SONY-WH1000XM5-BLK',
    brand: 'Sony',
    category: 'Electronics',
    status: 'published',
    description: 'The Sony WH-1000XM5 redefines industry-leading noise cancellation with two processors and eight microphones. With 30-hour battery life, crystal-clear hands-free calling, and multipoint connection, these headphones adapt to your lifestyle. The lightweight 250g design with premium leather cushions delivers all-day comfort, while LDAC codec support ensures Hi-Res Audio streaming.',
    shortDescription: 'Industry-leading ANC headphones with 30-hour battery and Hi-Res Audio support.',
    bulletPoints: [
      'Industry-leading noise cancellation with Dual Chip Processor & 8 mics',
      '30-hour battery life with quick charge (3 min = 3 hours)',
      'Multipoint connection — switch between 2 devices seamlessly',
      'Speak-to-Chat auto-pauses music when you talk',
      'Ultra-lightweight 250g premium build with soft leather cushions',
    ],
    pricing: { price: 349.99, salePrice: 279.99, currency: 'USD', costPrice: 180.00 },
    images: [{ id: 'img-s1', url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600', alt: 'Sony WH-1000XM5 headphones in black', isPrimary: true }],
    attributes: [
      { name: 'Color', value: 'Black', required: false, isAI: false },
      { name: 'Battery Life', value: '30 hours', required: false, isAI: false },
      { name: 'Weight', value: '250g', required: false, isAI: false },
      { name: 'Warranty', value: '1 Year', required: false, isAI: false },
    ],
    seo: {
      title: 'Sony WH-1000XM5 Wireless ANC Headphones — 30H Battery | Best Price',
      description: 'Buy Sony WH-1000XM5 headphones with industry-leading noise cancellation, 30-hour battery and Hi-Res Audio. Free shipping available.',
      keywords: ['sony headphones', 'ANC headphones', 'WH-1000XM5', 'wireless headphones', 'noise cancelling'],
      slug: 'sony-wh1000xm5-wireless-headphones',
    },
    tags: ['headphones', 'wireless', 'ANC', 'sony', 'audio', 'hi-res'],
    completeness: 98,
  },
  {
    name: 'Apple MacBook Air 15" M3 Chip',
    sku: 'APPLE-MBA15-M3-256-MN',
    brand: 'Apple',
    category: 'Electronics',
    status: 'published',
    description: 'The MacBook Air 15-inch with M3 chip delivers blazing performance in an impossibly thin design. With up to 18 hours of battery life, a stunning 15.3-inch Liquid Retina display, and an advanced 8-core GPU, it handles everything from creative work to gaming with ease. Available in four beautiful finishes.',
    shortDescription: '15.3" Liquid Retina MacBook Air with M3 chip, 8GB RAM, 256GB SSD.',
    bulletPoints: [
      'Apple M3 chip with 8-core CPU and 8-core GPU',
      'Up to 18 hours battery life — all-day performance',
      '15.3-inch Liquid Retina display with 500 nits brightness',
      'MagSafe charging, 2× Thunderbolt ports, Wi-Fi 6E',
      'Fanless design — completely silent operation',
    ],
    pricing: { price: 1299.00, currency: 'USD', costPrice: 980.00 },
    images: [{ id: 'img-s2', url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600', alt: 'Apple MacBook Air M3 15 inch midnight', isPrimary: true }],
    attributes: [
      { name: 'Color', value: 'Midnight', required: false, isAI: false },
      { name: 'Weight', value: '1.51kg', required: false, isAI: false },
      { name: 'Warranty', value: '1 Year', required: false, isAI: false },
      { name: 'Country of Origin', value: 'China', required: false, isAI: false },
    ],
    seo: {
      title: 'Apple MacBook Air 15" M3 — 18H Battery, Liquid Retina Display',
      description: 'MacBook Air 15-inch with M3 chip, 8GB RAM, 256GB SSD. Fanless design, up to 18 hours battery. Free shipping.',
      keywords: ['macbook air', 'M3 chip', 'apple laptop', '15 inch macbook', 'macbook air 2024'],
      slug: 'apple-macbook-air-15-m3',
    },
    tags: ['laptop', 'apple', 'macbook', 'M3', 'computer'],
    completeness: 95,
  },
  {
    name: 'Samsung Galaxy Watch 6 Classic 47mm',
    sku: 'SAM-GW6C-47-BLK',
    brand: 'Samsung',
    category: 'Electronics',
    status: 'published',
    description: 'The Samsung Galaxy Watch 6 Classic brings back the beloved rotating bezel with a premium stainless steel case. Track your health with advanced sleep coaching, body composition analysis, and ECG monitoring. The 47mm AMOLED display is sharp and always-on, while the 40-hour battery life keeps you covered through the week.',
    shortDescription: '47mm smartwatch with rotating bezel, ECG, sleep coaching and 40-hour battery.',
    bulletPoints: [
      'Classic rotating bezel for intuitive navigation',
      'Advanced health tracking: ECG, blood oxygen, body composition',
      'AI-powered sleep coaching with personalized insights',
      '40-hour battery life (20-hour with Always-On Display)',
      'Water resistant to 5ATM + IP68',
    ],
    pricing: { price: 399.99, salePrice: 329.99, currency: 'USD', costPrice: 200.00 },
    images: [{ id: 'img-s3', url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600', alt: 'Samsung Galaxy Watch 6 Classic black', isPrimary: true }],
    attributes: [
      { name: 'Color', value: 'Black', required: false, isAI: false },
      { name: 'Battery Life', value: '40 hours', required: false, isAI: false },
      { name: 'Water Resistance', value: 'IP68', required: false, isAI: false },
      { name: 'Warranty', value: '1 Year', required: false, isAI: false },
    ],
    seo: {
      title: 'Samsung Galaxy Watch 6 Classic 47mm — ECG & Sleep Tracking',
      description: 'Samsung Galaxy Watch 6 Classic with rotating bezel, ECG monitoring, advanced sleep tracking and 40-hour battery life.',
      keywords: ['samsung watch', 'galaxy watch 6', 'smartwatch', 'ECG watch', 'android smartwatch'],
      slug: 'samsung-galaxy-watch-6-classic-47mm',
    },
    tags: ['smartwatch', 'samsung', 'wearable', 'fitness tracker'],
    completeness: 96,
  },
  {
    name: 'Anker PowerCore 26800 Portable Charger',
    sku: 'ANK-PC26800-BLK',
    brand: 'Anker',
    category: 'Electronics',
    status: 'ready',
    description: 'The Anker PowerCore 26800 is one of the highest-capacity portable chargers on the market. With 26,800mAh of power, it can charge an iPhone 15 over 6 times or a Samsung Galaxy S24 over 5 times. Dual USB-A ports and 1 USB-C port allow simultaneous charging of up to 3 devices.',
    shortDescription: '26,800mAh power bank — charges 3 devices simultaneously via USB-C and USB-A.',
    bulletPoints: [
      '26,800mAh — charges iPhone 15 6+ times',
      'Triple-port charging: 2× USB-A + 1× USB-C',
      'PowerIQ 3.0 fast charging technology',
      'Trickle-Charging mode for earbuds and wearables',
      'MultiProtect safety suite — surge protection, short circuit protection',
    ],
    pricing: { price: 65.99, salePrice: 49.99, currency: 'USD', costPrice: 28.00 },
    images: [{ id: 'img-s4', url: 'https://images.unsplash.com/photo-1609592424847-d44bfb58e7d5?w=600', alt: 'Anker portable power bank', isPrimary: true }],
    attributes: [
      { name: 'Color', value: 'Black', required: false, isAI: false },
      { name: 'Weight', value: '480g', required: false, isAI: false },
      { name: 'Warranty', value: '2 Years', required: false, isAI: false },
    ],
    seo: {
      title: 'Anker PowerCore 26800mAh Portable Charger — Triple Port Fast Charging',
      description: 'Anker PowerCore 26800 portable charger with 3 ports, fast charging and safety protection. Charge 3 devices simultaneously.',
      keywords: ['power bank', 'portable charger', 'anker', '26800mah', 'fast charging'],
      slug: 'anker-powercore-26800-portable-charger',
    },
    tags: ['power bank', 'charger', 'anker', 'portable'],
    completeness: 90,
  },

  // ── HOME & LIVING ─────────────────────────────────────────────────────────────
  {
    name: 'Dyson V15 Detect Cordless Vacuum',
    sku: 'DYS-V15DET-GOLD',
    brand: 'Dyson',
    category: 'Home & Living',
    status: 'published',
    description: 'The Dyson V15 Detect is Dyson\'s most powerful cordless vacuum, with a laser that illuminates hidden dust on hard floors. The piezo sensor counts and sizes dust particles, automatically increasing suction when more is detected. With up to 60 minutes of fade-free power and a fully-sealed HEPA filtration system, it captures 99.99% of particles.',
    shortDescription: 'Most powerful Dyson cordless vacuum with laser dust detection and HEPA filtration.',
    bulletPoints: [
      'Laser Slim Fluffy head reveals hidden dust on hard floors',
      'Piezo sensor auto-adjusts suction based on debris detected',
      'Up to 60 minutes of fade-free suction',
      'Fully-sealed HEPA filtration — captures 99.99% of particles',
      'LCD screen shows real-time performance data and battery life',
    ],
    pricing: { price: 749.99, salePrice: 599.99, currency: 'USD', costPrice: 420.00 },
    images: [{ id: 'img-h1', url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600', alt: 'Dyson V15 cordless vacuum', isPrimary: true }],
    attributes: [
      { name: 'Color', value: 'Gold', required: false, isAI: false },
      { name: 'Weight', value: '3.1kg', required: false, isAI: false },
      { name: 'Warranty', value: '2 Years', required: false, isAI: false },
    ],
    seo: {
      title: 'Dyson V15 Detect Cordless Vacuum — Laser Detection, 60-Min Battery',
      description: 'Dyson V15 Detect with laser dust illumination, auto-adjusting suction and HEPA filtration. Up to 60 minutes cordless runtime.',
      keywords: ['dyson vacuum', 'cordless vacuum', 'V15 detect', 'HEPA vacuum', 'laser vacuum'],
      slug: 'dyson-v15-detect-cordless-vacuum',
    },
    tags: ['vacuum', 'dyson', 'cordless', 'home', 'cleaning'],
    completeness: 97,
  },
  {
    name: 'Nespresso Vertuo Pop Coffee Machine',
    sku: 'NES-VPOP-BLK',
    brand: 'Nespresso',
    category: 'Home & Living',
    status: 'published',
    description: 'The Nespresso Vertuo Pop brews five cup sizes at the touch of a button using Centrifusion™ technology. From an espresso to a full mug of coffee, simply insert a Vertuo capsule and the machine reads the barcode to adjust brewing parameters automatically. Compact, colourful and fast — ready in just 30 seconds.',
    shortDescription: 'Compact Nespresso machine that brews 5 cup sizes in 30 seconds with Centrifusion™ tech.',
    bulletPoints: [
      'Centrifusion™ technology — spins capsule at 7,000 rotations/min for perfect extraction',
      'Brews 5 cup sizes: Espresso (40ml) to Alto (414ml)',
      'Ready in just 30 seconds from cold start',
      'Automatic capsule recognition via barcode',
      'Energy saving — auto off after 2 minutes of inactivity',
    ],
    pricing: { price: 99.99, salePrice: 79.99, currency: 'USD', costPrice: 45.00 },
    images: [{ id: 'img-h2', url: 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=600', alt: 'Nespresso coffee machine on kitchen counter', isPrimary: true }],
    attributes: [
      { name: 'Color', value: 'Black', required: false, isAI: false },
      { name: 'Weight', value: '2.4kg', required: false, isAI: false },
      { name: 'Warranty', value: '2 Years', required: false, isAI: false },
    ],
    seo: {
      title: 'Nespresso Vertuo Pop Coffee Machine — 5 Cup Sizes, 30-Second Heat-Up',
      description: 'Nespresso Vertuo Pop capsule coffee machine. Brews espresso to large mugs. Centrifusion tech, ready in 30 seconds.',
      keywords: ['nespresso', 'vertuo pop', 'coffee machine', 'capsule coffee', 'espresso machine'],
      slug: 'nespresso-vertuo-pop-coffee-machine',
    },
    tags: ['coffee', 'nespresso', 'kitchen', 'appliance', 'home'],
    completeness: 96,
  },
  {
    name: 'Himalayan Salt Lamp with Dimmer',
    sku: 'HOME-SALT-LMP-NAT',
    brand: 'AuraGlow',
    category: 'Home & Living',
    status: 'ready',
    description: 'Carved from authentic Himalayan pink salt crystals, this natural lamp emits a warm, amber glow that creates a calming ambience in any room. The included dimmer switch allows you to adjust brightness from a soft night-light to a warm reading glow. Each lamp is unique due to the natural variations in the salt crystal.',
    shortDescription: 'Authentic Himalayan pink salt lamp with adjustable dimmer, 2-3kg crystal.',
    bulletPoints: [
      '100% authentic Himalayan pink salt crystal',
      'Adjustable dimmer switch — from soft glow to bright amber',
      'Handcrafted — each lamp is naturally unique',
      'Includes 15W bulb and sturdy wooden base',
      'Creates warm, relaxing ambience ideal for bedrooms and offices',
    ],
    pricing: { price: 29.99, currency: 'USD', costPrice: 9.00 },
    images: [{ id: 'img-h3', url: 'https://images.unsplash.com/photo-1602524816149-2e3da2047451?w=600', alt: 'Himalayan salt lamp glowing amber', isPrimary: true }],
    attributes: [
      { name: 'Weight', value: '2-3kg', required: false, isAI: false },
      { name: 'Color', value: 'Pink/Amber', required: false, isAI: false },
      { name: 'Country of Origin', value: 'Pakistan', required: false, isAI: false },
    ],
    seo: {
      title: 'Himalayan Salt Lamp with Dimmer Switch — Natural Pink Crystal',
      description: 'Authentic Himalayan salt lamp with adjustable dimmer. Handcrafted natural pink crystal, wooden base, 15W bulb included.',
      keywords: ['himalayan salt lamp', 'pink salt lamp', 'ambient lighting', 'bedroom lamp', 'dimmer lamp'],
      slug: 'himalayan-salt-lamp-dimmer',
    },
    tags: ['lamp', 'himalayan', 'home decor', 'wellness', 'ambient'],
    completeness: 88,
  },

  // ── FASHION ───────────────────────────────────────────────────────────────────
  {
    name: 'Levi\'s 501 Original Fit Jeans — Men',
    sku: 'LEVIS-501-MEN-32W32L',
    brand: 'Levi\'s',
    category: 'Fashion',
    status: 'published',
    description: 'The original blue jean since 1873. The Levi\'s 501 Original Fit is the iconic straight-leg jean that started it all. Made with rigid denim that moulds to your body over time, the 501 features the classic button fly, five-pocket styling and the signature red tab. A timeless wardrobe staple built to last.',
    shortDescription: 'The original Levi\'s 501 straight-leg jeans with button fly — timeless since 1873.',
    bulletPoints: [
      'Iconic straight fit with button fly — original since 1873',
      '99% cotton rigid denim that softens and moulds with wear',
      'Classic 5-pocket styling with signature red Levi\'s tab',
      'Machine washable — gets better with every wash',
      'Versatile — dress up or down for any occasion',
    ],
    pricing: { price: 69.99, salePrice: 54.99, currency: 'USD', costPrice: 28.00 },
    images: [{ id: 'img-f1', url: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=600', alt: 'Levis 501 blue jeans men', isPrimary: true }],
    attributes: [
      { name: 'Material', value: '99% Cotton, 1% Elastane', required: false, isAI: false },
      { name: 'Color', value: 'Mid Blue', required: false, isAI: false },
      { name: 'Size', value: '32W × 32L', required: false, isAI: false },
      { name: 'Country of Origin', value: 'Bangladesh', required: false, isAI: false },
    ],
    seo: {
      title: 'Levi\'s 501 Original Fit Jeans Men — Classic Blue Denim Button Fly',
      description: 'The iconic Levi\'s 501 original fit jeans for men. Button fly, rigid denim, timeless straight cut since 1873. Multiple sizes available.',
      keywords: ['levis 501', 'mens jeans', 'straight fit jeans', 'button fly jeans', 'blue jeans'],
      slug: 'levis-501-original-fit-jeans-men',
    },
    tags: ['jeans', 'levis', 'denim', 'men', 'fashion'],
    completeness: 94,
  },
  {
    name: 'Nike Air Max 270 React — Women',
    sku: 'NIKE-AM270R-WMN-WHT-38',
    brand: 'Nike',
    category: 'Fashion',
    status: 'published',
    description: 'The Nike Air Max 270 React combines two of Nike\'s most innovative technologies. The React foam midsole provides incredibly soft, springy cushioning while the oversized Air Max unit in the heel adds a visual style statement. The breathable mesh upper keeps feet cool, making these perfect for all-day wear.',
    shortDescription: 'Women\'s Nike Air Max 270 React with React foam + Max Air heel unit for ultimate comfort.',
    bulletPoints: [
      'Nike React foam — ultra-soft, springy, durable cushioning',
      'Oversized 270° Air Max unit in heel for maximum comfort',
      'Breathable mesh upper for all-day wear',
      'Rubber outsole with waffle traction pattern',
      'Available in sizes UK 3-9 / EU 36-43',
    ],
    pricing: { price: 149.99, salePrice: 119.99, currency: 'USD', costPrice: 60.00 },
    images: [{ id: 'img-f2', url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600', alt: 'Nike Air Max 270 React white women', isPrimary: true }],
    attributes: [
      { name: 'Color', value: 'White/Black', required: false, isAI: false },
      { name: 'Size', value: 'UK 5 / EU 38', required: false, isAI: false },
      { name: 'Material', value: 'Mesh upper, React+Air foam', required: false, isAI: false },
    ],
    seo: {
      title: 'Nike Air Max 270 React Women\'s Trainers — React Foam + Air Max',
      description: 'Women\'s Nike Air Max 270 React trainers with React foam cushioning and 270° Air Max heel unit. Breathable mesh upper.',
      keywords: ['nike air max', 'air max 270 react', 'womens trainers', 'nike shoes', 'react foam'],
      slug: 'nike-air-max-270-react-women',
    },
    tags: ['nike', 'trainers', 'women', 'air max', 'shoes', 'fashion'],
    completeness: 93,
  },
  {
    name: 'North Face Thermoball Eco Jacket — Men',
    sku: 'TNF-THERMO-ECO-MEN-BLK-M',
    brand: 'The North Face',
    category: 'Fashion',
    status: 'in_review',
    description: 'The North Face Thermoball Eco Jacket uses PrimaLoft® ThermoBall™ insulation made from 100% recycled materials to trap warmth even when wet. Lightweight and packable into its own chest pocket, it\'s the perfect midlayer or standalone jacket for cold adventures. The DWR finish sheds light rain and snow.',
    shortDescription: 'Lightweight packable insulated jacket with recycled ThermoBall™ insulation — warm even when wet.',
    bulletPoints: [
      'PrimaLoft® ThermoBall™ insulation from 100% recycled materials',
      'Warm even when wet — outperforms down in damp conditions',
      'Packs into own chest pocket for easy storage',
      'DWR water-repellent finish sheds light rain and snow',
      'Standard fit — works as midlayer or standalone jacket',
    ],
    pricing: { price: 220.00, salePrice: 175.00, currency: 'USD', costPrice: 95.00 },
    images: [{ id: 'img-f3', url: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600', alt: 'North Face Thermoball jacket black', isPrimary: true }],
    attributes: [
      { name: 'Material', value: 'Recycled PrimaLoft® ThermoBall™', required: false, isAI: false },
      { name: 'Color', value: 'Black', required: false, isAI: false },
      { name: 'Size', value: 'M', required: false, isAI: false },
      { name: 'Warranty', value: 'Lifetime', required: false, isAI: false },
    ],
    seo: {
      title: 'The North Face Thermoball Eco Jacket Men — Recycled Insulation',
      description: 'North Face ThermoBall Eco jacket for men with recycled PrimaLoft insulation. Warm when wet, packable, DWR water-repellent finish.',
      keywords: ['north face jacket', 'thermoball jacket', 'insulated jacket', 'mens winter jacket', 'packable jacket'],
      slug: 'north-face-thermoball-eco-jacket-men',
    },
    tags: ['jacket', 'north face', 'men', 'insulated', 'outdoor', 'winter'],
    completeness: 92,
  },

  // ── BEAUTY ────────────────────────────────────────────────────────────────────
  {
    name: 'CeraVe Moisturising Cream 454g',
    sku: 'CERA-MOIST-CRM-454G',
    brand: 'CeraVe',
    category: 'Beauty',
    status: 'published',
    description: 'CeraVe Moisturising Cream is formulated with three essential ceramides (1, 3, 6-II) and hyaluronic acid to restore and maintain the skin\'s natural barrier. Developed with dermatologists, it provides 24-hour hydration for normal to dry skin. The non-greasy, fragrance-free formula is suitable for face and body, including sensitive skin.',
    shortDescription: 'Fragrance-free moisturising cream with 3 ceramides and hyaluronic acid for 24-hour hydration.',
    bulletPoints: [
      'Formulated with 3 essential ceramides to restore skin barrier',
      'Hyaluronic acid retains moisture for 24-hour hydration',
      'Fragrance-free, non-comedogenic, non-greasy formula',
      'Suitable for face and body — normal to very dry skin',
      'Developed with dermatologists — safe for sensitive skin',
    ],
    pricing: { price: 18.99, currency: 'USD', costPrice: 7.50 },
    images: [{ id: 'img-b1', url: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=600', alt: 'CeraVe moisturising cream white tub', isPrimary: true }],
    attributes: [
      { name: 'Skin Type', value: 'All', required: false, isAI: false },
      { name: 'Weight', value: '454g', required: false, isAI: false },
    ],
    seo: {
      title: 'CeraVe Moisturising Cream 454g — 3 Ceramides, 24H Hydration',
      description: 'CeraVe Moisturising Cream with ceramides and hyaluronic acid for 24-hour hydration. Fragrance-free, dermatologist-developed. 454g tub.',
      keywords: ['cerave', 'moisturising cream', 'ceramide cream', 'hyaluronic acid', 'dry skin cream'],
      slug: 'cerave-moisturising-cream-454g',
    },
    tags: ['skincare', 'cerave', 'moisturiser', 'ceramide', 'beauty'],
    completeness: 92,
  },
  {
    name: 'The Ordinary Niacinamide 10% + Zinc 1%',
    sku: 'ORDI-NIAC-30ML',
    brand: 'The Ordinary',
    category: 'Beauty',
    status: 'published',
    description: 'This high-strength vitamin and mineral blemish formula combines 10% niacinamide with 1% zinc to visibly reduce the appearance of blemishes and congestion. Niacinamide (Vitamin B3) balances visible sebum activity while the zinc formula helps reduce the look of pores and improves skin texture.',
    shortDescription: '10% Niacinamide + 1% Zinc serum — reduces blemishes, pores and sebum. 30ml.',
    bulletPoints: [
      '10% niacinamide reduces blemishes and skin congestion',
      '1% zinc balances sebum production visibly',
      'Minimises appearance of enlarged pores',
      'Lightweight water-based formula — suitable for all skin types',
      'Vegan and cruelty-free formula',
    ],
    pricing: { price: 8.90, currency: 'USD', costPrice: 2.80 },
    images: [{ id: 'img-b2', url: 'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=600', alt: 'The Ordinary Niacinamide serum bottle', isPrimary: true }],
    attributes: [
      { name: 'Skin Type', value: 'All', required: false, isAI: false },
      { name: 'Weight', value: '30ml', required: false, isAI: false },
    ],
    seo: {
      title: 'The Ordinary Niacinamide 10% + Zinc 1% Serum 30ml — Blemish Formula',
      description: 'The Ordinary 10% Niacinamide serum reduces blemishes, pores and excess oil. Vegan, lightweight, for all skin types. 30ml.',
      keywords: ['niacinamide serum', 'the ordinary', 'niacinamide zinc', 'blemish serum', 'pore minimiser'],
      slug: 'the-ordinary-niacinamide-10-zinc-1-30ml',
    },
    tags: ['serum', 'niacinamide', 'the ordinary', 'skincare', 'blemish'],
    completeness: 91,
  },
  {
    name: 'Fenty Beauty Pro Filt\'r Soft Matte Foundation',
    sku: 'FENTY-PFLT-120N-30ML',
    brand: 'Fenty Beauty',
    category: 'Beauty',
    status: 'in_review',
    description: 'Fenty Beauty\'s iconic Pro Filt\'r Soft Matte Longwear Foundation delivers a natural-looking matte finish that lasts up to 24 hours. The lightweight, buildable formula provides medium-to-full coverage while controlling shine. Available in 50 inclusive shades to match every skin tone, from the lightest to the deepest.',
    shortDescription: '24-hour longwear matte foundation — medium to full buildable coverage in 50 shades.',
    bulletPoints: [
      '24-hour longwear — stays fresh all day',
      'Medium-to-full buildable coverage',
      'Soft matte finish — controls shine without looking flat',
      'Available in 50 shades across all skin tones',
      'Oil-free and non-comedogenic formula',
    ],
    pricing: { price: 36.00, currency: 'USD', costPrice: 14.00 },
    images: [{ id: 'img-b3', url: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=600', alt: 'Fenty Beauty foundation bottles', isPrimary: true }],
    attributes: [
      { name: 'Skin Type', value: 'All', required: false, isAI: false },
      { name: 'Weight', value: '30ml', required: false, isAI: false },
    ],
    seo: {
      title: 'Fenty Beauty Pro Filt\'r Soft Matte Foundation — 50 Shades, 24H Wear',
      description: 'Fenty Beauty Pro Filt\'r matte foundation with 24-hour wear, buildable medium-to-full coverage across 50 inclusive shades.',
      keywords: ['fenty beauty', 'pro filtr foundation', 'matte foundation', 'longwear foundation', '24 hour foundation'],
      slug: 'fenty-beauty-pro-filtr-soft-matte-foundation',
    },
    tags: ['foundation', 'makeup', 'fenty beauty', 'matte', 'cosmetics'],
    completeness: 86,
  },

  // ── SPORTS ────────────────────────────────────────────────────────────────────
  {
    name: 'Bowflex SelectTech 552 Adjustable Dumbbells',
    sku: 'BOW-ST552-PAIR',
    brand: 'Bowflex',
    category: 'Sports',
    status: 'published',
    description: 'The Bowflex SelectTech 552 replaces 15 sets of weights. Each dumbbell adjusts from 2.5 to 52.5 lbs using a simple turn of the selector dial — ready in seconds. The molded shell protects the weight plates and reduces noise, while the compact design saves significant space compared to a full dumbbell rack.',
    shortDescription: 'Adjustable dumbbell set 2.5–52.5 lbs each — replaces 15 sets of weights with a single dial.',
    bulletPoints: [
      'Adjusts from 2.5 to 52.5 lbs per dumbbell in 2.5 lb increments',
      'Replaces 15 sets of weights — huge space saving',
      'Quick selector dial — change weight in seconds',
      'Molded outer shell reduces weight plate noise',
      'Includes 2-year warranty and stand sold separately',
    ],
    pricing: { price: 429.00, salePrice: 379.00, currency: 'USD', costPrice: 210.00 },
    images: [{ id: 'img-sp1', url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600', alt: 'Bowflex SelectTech adjustable dumbbells', isPrimary: true }],
    attributes: [
      { name: 'Weight', value: '2.5–52.5 lbs (1.1–23.8kg)', required: false, isAI: false },
      { name: 'Warranty', value: '2 Years', required: false, isAI: false },
    ],
    seo: {
      title: 'Bowflex SelectTech 552 Adjustable Dumbbells — 2.5-52.5lbs, 15 Weights in 1',
      description: 'Bowflex SelectTech 552 adjustable dumbbells — replaces 15 sets. Quick dial adjustment from 2.5 to 52.5 lbs. Pair included.',
      keywords: ['adjustable dumbbells', 'bowflex selecttech', 'home gym dumbbells', 'dumbbell set', 'weights'],
      slug: 'bowflex-selecttech-552-adjustable-dumbbells',
    },
    tags: ['dumbbells', 'home gym', 'weights', 'bowflex', 'fitness'],
    completeness: 94,
  },
  {
    name: 'Garmin Forerunner 265 GPS Running Watch',
    sku: 'GRMN-FR265-BLK-BLU',
    brand: 'Garmin',
    category: 'Sports',
    status: 'ready',
    description: 'The Garmin Forerunner 265 is a premium GPS running watch with a brilliant AMOLED display and advanced training metrics. Training Readiness score, Daily Suggested Workouts, and HRV Status guide your training intelligently. With 13-day battery life in smartwatch mode and built-in multi-band GPS, it\'s the perfect partner for serious runners.',
    shortDescription: 'GPS running watch with AMOLED display, Training Readiness, HRV Status — 13-day battery.',
    bulletPoints: [
      'Vivid 1.3" AMOLED always-on display — stunning in all conditions',
      'Training Readiness score using sleep, HRV and recovery data',
      'Multi-band GPS for high-accuracy positioning',
      '13-day battery life in smartwatch mode, 20 hours GPS',
      'Daily Suggested Workouts adapt to your fitness level',
    ],
    pricing: { price: 449.99, currency: 'USD', costPrice: 260.00 },
    images: [{ id: 'img-sp2', url: 'https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=600', alt: 'Garmin Forerunner GPS watch', isPrimary: true }],
    attributes: [
      { name: 'Color', value: 'Black/Blue', required: false, isAI: false },
      { name: 'Battery Life', value: '13 days (smartwatch) / 20h GPS', required: false, isAI: false },
      { name: 'Water Resistance', value: 'IP68', required: false, isAI: false },
      { name: 'Warranty', value: '1 Year', required: false, isAI: false },
    ],
    seo: {
      title: 'Garmin Forerunner 265 GPS Running Watch — AMOLED, 13-Day Battery',
      description: 'Garmin Forerunner 265 with AMOLED display, Training Readiness, HRV Status and 13-day battery. Multi-band GPS for runners.',
      keywords: ['garmin forerunner 265', 'GPS running watch', 'garmin watch', 'AMOLED watch', 'running watch'],
      slug: 'garmin-forerunner-265-gps-running-watch',
    },
    tags: ['running watch', 'garmin', 'GPS watch', 'fitness tracker', 'sports'],
    completeness: 93,
  },

  // ── TOYS ─────────────────────────────────────────────────────────────────────
  {
    name: 'LEGO Technic McLaren Formula 1 Race Car',
    sku: 'LEGO-42141-MCL-F1',
    brand: 'LEGO',
    category: 'Toys',
    status: 'published',
    description: 'Build the McLaren Formula 1 Race Car in stunning 1:8 scale with 1,432 pieces. This advanced LEGO Technic set features a V8 engine with moving pistons, working steering wheel, and 2022 McLaren F1 authentic livery. A challenging build for teens and adults that results in a spectacular display model.',
    shortDescription: '1,432-piece 1:8 scale McLaren F1 Technic set with V8 engine, moving pistons and authentic livery.',
    bulletPoints: [
      '1,432 pieces — 1:8 scale McLaren Formula 1 car',
      'V8 engine with moving pistons and sequential gearbox',
      'Authentic 2022 McLaren F1 livery — papaya orange and blue',
      'Recommended age 18+ — advanced building experience',
      'Includes exclusive McLaren driver minifigure',
    ],
    pricing: { price: 179.99, salePrice: 149.99, currency: 'USD', costPrice: 85.00 },
    images: [{ id: 'img-t1', url: 'https://images.unsplash.com/photo-1558346489-19413928158b?w=600', alt: 'LEGO Technic McLaren F1 Race Car', isPrimary: true }],
    attributes: [
      { name: 'Age Range', value: '18+', required: false, isAI: false },
      { name: 'Weight', value: '1.4kg', required: false, isAI: false },
    ],
    seo: {
      title: 'LEGO Technic McLaren F1 Race Car 42141 — 1432 Pieces, 1:8 Scale',
      description: 'Build the iconic McLaren F1 car with 1,432 LEGO Technic pieces. V8 engine, moving parts, authentic livery. Perfect for adults.',
      keywords: ['lego technic', 'McLaren F1 lego', 'lego formula 1', 'lego car set', 'adult lego'],
      slug: 'lego-technic-mclaren-f1-race-car-42141',
    },
    tags: ['lego', 'technic', 'formula 1', 'mclaren', 'toys', 'building'],
    completeness: 95,
  },

  // ── FOOD & GROCERY ────────────────────────────────────────────────────────────
  {
    name: 'Optimum Nutrition Gold Standard Whey Protein',
    sku: 'ON-GSWP-CHOC-2LB',
    brand: 'Optimum Nutrition',
    category: 'Food & Grocery',
    status: 'published',
    description: 'Optimum Nutrition Gold Standard 100% Whey is the world\'s best-selling whey protein supplement. Each serving delivers 24g of protein from whey isolate, concentrate and peptides, with 5.5g of naturally occurring BCAAs to support muscle recovery. Available in 20+ flavours including the best-selling Double Rich Chocolate.',
    shortDescription: '24g protein per serving — whey isolate, concentrate & peptides. 2lb tub, 29 servings.',
    bulletPoints: [
      '24g protein per serving — primarily whey protein isolate',
      '5.5g BCAAs + 4g glutamine & precursors per serving',
      'Only 1-2g fat, 3-4g carbs per serving',
      'Instantised for easy mixing — no blender required',
      'Available in 20+ flavours — Double Rich Chocolate bestseller',
    ],
    pricing: { price: 49.99, salePrice: 39.99, currency: 'USD', costPrice: 22.00 },
    images: [{ id: 'img-fg1', url: 'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=600', alt: 'Optimum Nutrition Gold Standard Whey tub', isPrimary: true }],
    attributes: [
      { name: 'Weight', value: '907g (2lb)', required: false, isAI: false },
      { name: 'Country of Origin', value: 'USA', required: false, isAI: false },
    ],
    seo: {
      title: 'Optimum Nutrition Gold Standard Whey Protein 2lb — 24g Protein/Serving',
      description: 'ON Gold Standard Whey — world\'s best-selling protein powder. 24g protein, 5.5g BCAAs per serving. 29 servings, 2lb tub.',
      keywords: ['whey protein', 'optimum nutrition', 'gold standard whey', 'protein powder', 'muscle recovery'],
      slug: 'optimum-nutrition-gold-standard-whey-2lb',
    },
    tags: ['protein', 'whey', 'supplements', 'fitness', 'nutrition'],
    completeness: 90,
  },
  // ── DRAFT / INCOMPLETE (for quality demo) ────────────────────────────────────
  {
    name: 'Retinol Night Repair Serum',
    sku: 'BEAU-RTN-SRM-30ML',
    brand: 'LuminaGlow',
    category: 'Beauty',
    status: 'draft',
    description: 'Advanced retinol serum for overnight skin repair.',
    shortDescription: '',
    bulletPoints: [],
    pricing: { price: 42.00, currency: 'USD' },
    images: [],
    attributes: [],
    seo: { title: '', description: '', keywords: [], slug: 'retinol-night-repair-serum' },
    tags: ['retinol', 'serum', 'skincare'],
    completeness: 22,
  },
  {
    name: 'Bamboo Yoga Mat — Eco-Friendly',
    sku: 'SPRT-YGA-BAM-6MM',
    brand: 'EcoFlow',
    category: 'Sports',
    status: 'in_review',
    description: 'Natural bamboo-fibre yoga mat with non-slip surface.',
    shortDescription: 'Eco-friendly 6mm bamboo yoga mat with natural rubber base and carry strap.',
    bulletPoints: ['Natural bamboo fibre top layer', '6mm thickness for joint cushioning', 'Non-slip natural rubber base'],
    pricing: { price: 55.00, currency: 'USD' },
    images: [],
    attributes: [{ name: 'Material', value: 'Bamboo fibre + Natural rubber', required: false, isAI: false }],
    seo: { title: 'Bamboo Yoga Mat | EcoFlow', description: 'Eco-friendly bamboo yoga mat with natural rubber base.', keywords: ['yoga mat', 'bamboo', 'eco'], slug: 'bamboo-yoga-mat-eco' },
    tags: ['yoga', 'mat', 'eco', 'sports'],
    completeness: 55,
  },
];

async function seed() {
  console.log('🌱 Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected');

  // Clear existing data
  await Promise.all([
    Product.deleteMany({}),
    Category.deleteMany({}),
    AttributeDefinition.deleteMany({}),
    ActivityEvent.deleteMany({}),
  ]);
  console.log('🗑  Cleared existing data');

  // Seed categories
  const createdCats = await Category.insertMany(CATEGORIES.map((c) => ({ ...c, createdBy: 'seed' })));
  console.log(`📁 Created ${createdCats.length} categories`);

  // Seed attributes
  const createdAttrs = await AttributeDefinition.insertMany(ATTRIBUTES.map((a) => ({ ...a, createdBy: 'seed' })));
  console.log(`🏷  Created ${createdAttrs.length} attribute definitions`);

  // Seed products
  const createdProds = await Product.insertMany(PRODUCTS.map((p) => ({
    ...p,
    syncStatus: 'not_synced',
    enrichmentStatus: 'not_started',
    validationErrors: [],
    version: 1,
    pimUpdatedAt: new Date(),
    pimUpdatedBy: 'seed',
  })));
  console.log(`📦 Created ${createdProds.length} products`);

  // Seed activity log
  await ActivityEvent.insertMany([
    { action: 'product.published', entityType: 'product', entityName: 'Sony WH-1000XM5 Wireless Headphones', actor: 'admin', description: 'Published to WooCommerce store' },
    { action: 'product.published', entityType: 'product', entityName: 'Apple MacBook Air 15" M3', actor: 'admin', description: 'Published to WooCommerce store' },
    { action: 'product.updated', entityType: 'product', entityName: 'Fenty Beauty Pro Filt\'r Foundation', actor: 'admin', description: 'Updated pricing and images' },
    { action: 'ai.approved', entityType: 'product', entityName: 'CeraVe Moisturising Cream', actor: 'admin', description: 'AI description improvement approved and applied' },
    { action: 'product.created', entityType: 'catalog', actor: 'seed-script', description: `Database seeded with ${PRODUCTS.length} real products across 7 categories` },
  ]);

  console.log('');
  console.log('✅ Seed complete!');
  console.log(`   Products  : ${createdProds.length}`);
  console.log(`   Categories: ${createdCats.length}`);
  console.log(`   Attributes: ${createdAttrs.length}`);

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
