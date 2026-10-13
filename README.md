# ProductShelf 🛒

> **AI-First Product Information Management (PIM) system for modern e-commerce.**

ProductShelf helps store owners manage, enrich, and publish product data with the help of AI — all from a clean, fast dashboard. Built with React, Node.js, MongoDB, and Gemini AI.

---

## 🖥️ Screenshots

| Dashboard | Products |
|-----------|----------|
| Dark/light mode, live stats, charts | Table + grid view, filters, bulk actions |

---

## ✨ Features

### 🗂️ Product Management
- Create, edit, and delete products with rich fields — name, SKU, brand, category, descriptions, bullet points, pricing, attributes, images, SEO
- **Completeness score** — live indicator showing how complete each product is (0–100%)
- **Bulk actions** — select multiple products and delete in one click
- **Search & filter** — search by name or SKU, filter by category and status
- **Sort** — by name, price, completeness, or last updated
- **Table view + Grid view** — switch between layouts

### 🤖 AI Assistant (Gemini AI)
- Ask the AI to write product descriptions, bullet points, SEO titles
- AI enriches products and suggests improvements
- Human approval required before AI changes are saved
- Full audit trail of every AI action

### 📊 Dashboard
- Total products, published count, products needing attention
- Average catalog completeness score
- Quality distribution bar chart (0–20%, 21–40% … 81–100%)
- Category breakdown pie chart
- Recent products list
- Activity feed

### 🌍 Multi-Language Support
- Switch between **English**, **हिन्दी (Hindi)**, and **मराठी (Marathi)**
- Language persists across sessions via localStorage
- All UI labels, nav items, and buttons translate instantly

### 🌙 Dark / Light Mode
- Pure black dark theme (not navy — proper black)
- Automatic detection of system preference on first visit
- Persists across sessions via localStorage
- Toggle button in top navigation bar

### 📤 Export (WooCommerce Alternative)
- **CSV Export** — WooCommerce-compatible format, importable into any platform
- **JSON Export** — Full product data in JSON format
- No API keys required — just download and import

### 🔐 Authentication
- JWT-based authentication with HTTP-only cookies
- Secure login with bcrypt password hashing
- Rate limiting in production (bypassed in dev)
- Admin account auto-bootstrapped on first start

### 📋 Data Quality
- Quality score breakdown per product
- Identifies products with missing fields
- Completeness bar visible across all views

### 🏷️ Categories
- Create and manage product categories
- Assign colors to categories
- Category stats shown in dashboard pie chart

### 📡 Publishing
- Manage sync status of products
- WooCommerce-compatible CSV export for manual import
- Activity log of all publish actions

### 🔔 Activity Log
- Full audit trail of all changes
- Human and AI actions both logged
- Before/after snapshots for updates

### ⚙️ Settings
- WooCommerce connection settings (URL, key, secret)
- Test WooCommerce connection
- Platform configuration

---

## 🏗️ Tech Stack

### Frontend
| Tech | Version | Why |
|------|---------|-----|
| React | 19 | UI framework |
| Vite | 6 | Build tool |
| TypeScript | 5 | Type safety |
| Tailwind CSS | v4 | Styling |
| React Router | v7 | Routing |
| Recharts | 2 | Dashboard charts |
| Lucide React | latest | Icons |

### Backend
| Tech | Version | Why |
|------|---------|-----|
| Node.js | 20+ | Runtime |
| Express | 4 | HTTP server |
| TypeScript | 5 | Type safety |
| MongoDB | 7+ | Database |
| Mongoose | 8 | ODM |
| Zod | 3 | Input validation |
| JWT | - | Auth tokens |
| tsx watch | - | Dev server with hot reload |

### AI
| Tech | Why |
|------|-----|
| Google Gemini | Product enrichment, descriptions, AI assistant |
| OpenAI-compatible API | Configurable base URL — works with any LLM |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- MongoDB 7+ (local or [MongoDB Atlas](https://cloud.mongodb.com) — free tier works)
- Gemini API key (free at [Google AI Studio](https://aistudio.google.com))

### 1. Clone the repo

```bash
git clone https://github.com/your-username/productshelf.git
cd productshelf
```

### 2. Install dependencies

```bash
# Backend
cd backend && npm install

# Frontend (new terminal)
cd frontend && npm install
```

### 3. Set up environment variables

```bash
# Copy the example file
cp backend/.env.example backend/.env
```

Edit `backend/.env`:

```env
NODE_ENV=development
PORT=4000
MONGODB_URI=mongodb://localhost:27017/productshelf
JWT_SECRET=your-random-256-bit-secret-here
ADMIN_EMAIL=admin@yourstore.com
ADMIN_PASSWORD=YourStrongPassword123
ENCRYPTION_KEY=your-32-byte-hex-key-here
AI_API_KEY=your-gemini-api-key
AI_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai
AI_MODEL=gemini-2.0-flash
FRONTEND_URL=http://localhost:5173
```

> ⚠️ **Never commit `.env`** — it is gitignored.

### 4. Seed the database (optional but recommended)

```bash
cd backend
npx tsx src/seed.ts
```

This adds **19 real products** across 7 categories (Sony, Apple, Samsung, Nike, Dyson, LEGO, etc.) with real images, descriptions and pricing.

### 5. Start development servers

```bash
# Terminal 1 — Backend
cd backend && npm run dev

# Terminal 2 — Frontend
cd frontend && npm run dev
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:4000 |
| Health check | http://localhost:4000/health |

### 6. Log in

Default admin credentials (set in your `.env`):
- **Email:** whatever you set as `ADMIN_EMAIL`
- **Password:** whatever you set as `ADMIN_PASSWORD`

---

## 📁 Project Structure

```
productshelf/
├── frontend/                    # React + Vite frontend
│   ├── src/
│   │   ├── pages/               # Route pages (Dashboard, Products, etc.)
│   │   ├── components/
│   │   │   ├── layout/          # AppShell, Sidebar
│   │   │   └── ui/              # Badge, CompletenessBar, Toast, etc.
│   │   ├── contexts/
│   │   │   ├── AuthContext.tsx  # Login state + JWT management
│   │   │   ├── ThemeContext.tsx # Dark/light mode
│   │   │   └── LanguageContext.tsx # i18n (EN/HI/MR)
│   │   ├── services/
│   │   │   └── api.ts           # All API calls + response normalization
│   │   ├── lib/
│   │   │   └── utils.ts         # Formatting helpers
│   │   └── types/               # Shared TypeScript types
│   └── index.html
│
├── backend/                     # Express + MongoDB backend
│   ├── src/
│   │   ├── config/
│   │   │   ├── env.ts           # Zod-validated env variables
│   │   │   └── db.ts            # MongoDB connection
│   │   ├── models/
│   │   │   ├── Product.ts       # Product schema
│   │   │   ├── User.ts          # User + auth
│   │   │   ├── Category.ts      # Categories + attribute definitions
│   │   │   ├── ActivityEvent.ts # Audit log
│   │   │   └── AgentTask.ts     # AI agent task log
│   │   ├── routes/
│   │   │   ├── auth.ts          # POST /auth/login, /logout, /me
│   │   │   ├── products.ts      # CRUD + stats + export
│   │   │   ├── categories.ts    # Category management
│   │   │   ├── activity.ts      # Activity log
│   │   │   ├── ai.ts            # AI enrichment endpoints
│   │   │   └── settings.ts      # WooCommerce settings
│   │   ├── services/
│   │   │   ├── productService.ts   # Product CRUD + stats
│   │   │   ├── aiService.ts        # Gemini AI integration
│   │   │   └── auditService.ts     # Change logging
│   │   ├── middleware/
│   │   │   ├── auth.ts          # JWT verification
│   │   │   ├── rateLimiter.ts   # Express rate limit
│   │   │   └── errorHandler.ts  # Centralized error handling
│   │   ├── validators/
│   │   │   └── productSchema.ts # Zod schemas
│   │   ├── utils/
│   │   │   ├── bootstrap.ts     # Auto-create admin account
│   │   │   └── logger.ts        # Pino logger
│   │   ├── seed.ts              # Database seeder (19 real products)
│   │   ├── app.ts               # Express app factory
│   │   └── server.ts            # Entry point
│   └── .env.example
│
├── .gitignore
└── README.md
```

---

## 🔑 Environment Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `NODE_ENV` | ✅ | Environment | `development` |
| `PORT` | ✅ | Backend port | `4000` |
| `MONGODB_URI` | ✅ | MongoDB connection string | `mongodb://localhost:27017/productshelf` |
| `JWT_SECRET` | ✅ | Secret for JWT signing (min 32 chars) | *(random string)* |
| `ADMIN_EMAIL` | ✅ | Admin account email | `admin@store.com` |
| `ADMIN_PASSWORD` | ✅ | Admin account password | *(strong password)* |
| `ENCRYPTION_KEY` | ✅ | 32-byte key for WooCommerce credential encryption | *(random hex)* |
| `AI_API_KEY` | ✅ | Gemini or OpenAI API key | `AIza...` |
| `AI_BASE_URL` | ✅ | LLM API base URL | `https://generativelanguage.googleapis.com/v1beta/openai` |
| `AI_MODEL` | ✅ | Model name | `gemini-2.0-flash` |
| `FRONTEND_URL` | ✅ | CORS origin | `http://localhost:5173` |
| `RATE_LIMIT_WINDOW_MS` | ❌ | Rate limit window | `900000` (15 min) |
| `RATE_LIMIT_MAX_REQUESTS` | ❌ | Max requests per window | `100` |

---

## 📡 API Reference

Base URL: `http://localhost:4000`

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/login` | Login with email + password |
| `POST` | `/api/auth/logout` | Clear auth cookie |
| `GET` | `/api/auth/me` | Get current user |

### Products
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/products` | List products (paginated, filterable) |
| `POST` | `/api/products` | Create a product |
| `GET` | `/api/products/stats` | Dashboard stats |
| `GET` | `/api/products/export/csv` | WooCommerce-compatible CSV export |
| `GET` | `/api/products/export/json` | Full JSON export |
| `GET` | `/api/products/:id` | Get single product |
| `PATCH` | `/api/products/:id` | Update product |
| `DELETE` | `/api/products/:id` | Delete (soft) product |

### Query Params for `GET /api/products`
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | number | `1` | Page number |
| `limit` | number | `20` | Items per page (max 100) |
| `search` | string | - | Search name or SKU |
| `status` | string | - | Filter by status |
| `category` | string | - | Filter by category |
| `sort` | string | `updatedAt` | Sort field |
| `order` | `asc\|desc` | `desc` | Sort direction |

### Categories
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/categories` | List all categories |
| `POST` | `/api/categories` | Create category |
| `PATCH` | `/api/categories/:id` | Update category |
| `DELETE` | `/api/categories/:id` | Delete category |

### Activity
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/activity` | List activity events |

### AI
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/ai/enrich/:id` | Enrich a product with AI |
| `POST` | `/api/ai/chat` | AI assistant chat |

---

## 🌐 Language Support

The app supports 3 languages, switchable from the top nav:

| Language | Code | Script |
|----------|------|--------|
| English | `en` | Latin |
| हिन्दी | `hi` | Devanagari |
| मराठी | `mr` | Devanagari |

All navigation labels, page titles, buttons and form labels are translated. Language is saved to `localStorage`.

---

## 🌙 Theming

- **Light mode** — clean white with violet accents
- **Dark mode** — pure black (#0a0a0a) background, not navy blue
- Toggle via the ☀️/🌙 button in the top navigation bar
- Theme saved to `localStorage`
- CSS uses `html.dark` class toggling (works with Tailwind v4)

---

## 🌱 Database Seeding

The seed script adds 19 real products:

```bash
cd backend && npx tsx src/seed.ts
```

**Products included:**
- 🎧 Sony WH-1000XM5 Headphones
- 💻 Apple MacBook Air 15" M3
- ⌚ Samsung Galaxy Watch 6 Classic
- 🔋 Anker PowerCore 26800
- 🧹 Dyson V15 Detect Cordless Vacuum
- ☕ Nespresso Vertuo Pop
- 🛋️ Himalayan Salt Lamp
- 👖 Levi's 501 Original Jeans
- 👟 Nike Air Max 270 React (Women)
- 🧥 North Face Thermoball Eco Jacket
- 🧴 CeraVe Moisturising Cream
- 💆 The Ordinary Niacinamide 10% + Zinc
- 💄 Fenty Beauty Pro Filt'r Foundation
- 🏋️ Bowflex SelectTech 552 Dumbbells
- ⌚ Garmin Forerunner 265
- 🏎️ LEGO Technic McLaren F1 Car
- 🥤 Optimum Nutrition Whey Protein
- + 2 incomplete draft products (for quality demo)

---

## 🛡️ Security

- JWT tokens stored in **HTTP-only cookies** (XSS protection)
- All secrets live **backend-only** — frontend never sees API keys
- WooCommerce credentials encrypted at rest with **AES-256-GCM**
- Input validation via **Zod** on every API request
- Rate limiting: strict in production, bypassed in development
- CORS configured to only allow the frontend origin

---

## 🐛 Known Issues / Limitations

- WooCommerce live sync requires a real WooCommerce store with REST API v3 enabled — use CSV export as alternative
- AI enrichment requires a valid Gemini/OpenAI API key — without it, the AI Assistant tab will show errors
- Images are Unsplash URLs (seeded data) — real products need actual image upload support

---

## 🗺️ Roadmap

- [ ] Image upload (local file → cloud storage)
- [ ] Real-time product sync with WooCommerce webhooks
- [ ] Bulk AI enrichment (enrich all draft products at once)
- [ ] CSV/Excel import for bulk product creation
- [ ] Role-based access control (admin vs editor)
- [ ] PWA support for mobile

---

## 📄 License

MIT — free to use, modify and distribute.

---

*Built for the Kilowott hackathon. Made with ❤️ by Amey Kapdi.*
