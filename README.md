# TableOS — Intelligent Restaurant Management System
### VibeAthon 6.0 | Vibe Coding Hackathon 2K26

> **"The Operating System for Modern Restaurants"**

🌐 **Live App:** https://your-tableos.vercel.app  
📂 **GitHub:** https://github.com/YOUR_USERNAME/tableos

---

## 🏆 User Stories Completed

| Level | Story | Status |
|-------|-------|--------|
| 🥉 Bronze | Modern, intuitive UI for customers and management | ✅ Complete |
| 🥈 Silver | Secure Auth (Email/OTP + Google OAuth) + role-based access | ✅ Complete |
| 🥈 Silver | Digitized workflows (Menu, Queue, Orders, Billing, Notifications) | ✅ Complete |
| 🥇 Gold | Management Dashboard (Orders, Tables, Inventory, Sales, Analytics) | ✅ Complete |
| 🏅 Platinum | AI-powered recommendations, demand forecasting, operational insights | ✅ Complete |
| ⭐ Bonus | Erlang-C queue math, dynamic pricing engine, KDS with urgency alerts | ✅ Complete |

---

## ⚙️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router) + TypeScript |
| Styling | Tailwind CSS + Shadcn UI |
| Backend | Next.js API Routes (Serverless) |
| Database | Supabase (PostgreSQL) |
| Real-time | Supabase Realtime (WebSockets) |
| Auth | Supabase Auth (Email + Google OAuth) |
| AI | OpenRouter API (mistral-7b-instruct) |
| Charts | Recharts |
| Deployment | Vercel |
| Version Control | GitHub |

---

## 🤖 AI Usage

- **OpenRouter API** (free tier) with `mistralai/mistral-7b-instruct:free`
- Personalized dish recommendations based on order history and inventory
- Operational insights for management (what to restock, what to promote)
- Demand forecasting based on weekly sales data

---

## 🧮 Innovative Features (Bonus)

1. **Erlang-C Queue Mathematics** — Production-grade wait time prediction
2. **Dynamic Pricing Engine** — Algorithmic price adjustment based on demand, time, and stock
3. **Kitchen Display System (KDS)** — Real-time order board with urgency alerts
4. **Auto-Inventory Deduction** — PostgreSQL triggers auto-deduct stock on order confirmation
5. **Auto Menu Availability** — Items go "unavailable" automatically when ingredients run low
6. **Role-Based Access** — 4 distinct roles: Customer, Waiter, Kitchen, Admin

---

## 🔑 Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@tableos.demo | Demo@1234 |
| Waiter | waiter@tableos.demo | Demo@1234 |
| Kitchen | kitchen@tableos.demo | Demo@1234 |
| Customer | customer@tableos.demo | Demo@1234 |

---

## 🏃 Run Locally

```bash
git clone https://github.com/YOUR_USERNAME/tableos.git
cd tableos
npm install
cp .env.example .env.local
# Fill in your Supabase and OpenRouter keys
npm run dev
```