# D Finance: Family Financial Management System

A full-stack MERN app for tracking family income and expenses, prioritising essential spending, setting budgets, getting savings recommendations, and reaching savings goals.

**Stack:** React 18 + Vite, Recharts, Express, MongoDB + Mongoose, JWT + bcrypt, PDFKit.

## Features
- Family admin registration, login, family member accounts, role-based access (Admin / Member)
- Dashboard with live cards and charts (income vs expenses, savings progress, category and priority breakdown, recent transactions)
- Income and expense CRUD with search, category and date filters
- Automatic expense priority: High (red), Medium (orange), Low (green)
- Monthly budget with category limits, utilisation and over-budget warnings
- Smart analysis: top category, month-on-month change, unnecessary spending, overspending, average monthly expenses, trends
- Savings recommendations calculated from real records
- Savings goals with contributions and progress
- Monthly and yearly reports with CSV and PDF export

## Project structure
```
d-finance/
  backend/    config/ controllers/ middleware/ models/ routes/ services/ utils/ server.js
  frontend/   src/{components,pages,layouts,services,hooks,context,assets} App.jsx main.jsx
  .env.example
```

## Local setup
Requirements: Node.js 18+, and MongoDB (local or Atlas).

```bash
# 1. Install dependencies
npm run install:all

# 2. Configure the backend
cp .env.example backend/.env      # then edit MONGO_URI and JWT_SECRET

# 3. Start both servers (two terminals)
npm run dev:backend               # http://localhost:5000
npm run dev:frontend              # http://localhost:5173
```
Open http://localhost:5173, click **Create an account**, and start adding records. The Vite dev server proxies `/api` to port 5000, so no frontend env file is needed locally.

## MongoDB connection
- **Local:** install MongoDB Community, start it, and use `MONGO_URI=mongodb://127.0.0.1:27017/d-finance`.
- **Atlas (free):** create a cluster, add a database user, allow your IP under Network Access, then copy the connection string into `MONGO_URI`. Collections (`users`, `families`, `incomes`, `expenses`, `budgets`, `savingsgoals`, `savingscontributions`) are created automatically on first write.

## How the algorithms work
**Expense priority** (`backend/utils/priority.js`): each category maps to High, Medium or Low. The Expense model sets `priority` from the category on every save, so it cannot be wrong or skipped.

**Savings recommendation** (`backend/services/analytics.js`):
1. Income and expenses for the month come from MongoDB aggregations.
2. Remaining balance = income − expenses.
3. For each low-priority category (Dining Out, Shopping, Entertainment, Subscriptions, Other), suggest a cut of 20–30% of what was actually spent, rounded down to ₹50. If a category limit is set and exceeded, the cut is at least enough to return to the limit.
4. Potential savings = sum of the cuts.
5. Suggested monthly savings = max(remaining balance, 0) + potential savings, compared with a 20%-of-income target.

## API overview
All routes except `/api/auth/register`, `/api/auth/login`, `/api/meta` and `/api/health` need `Authorization: Bearer <token>`.

| Area | Endpoints |
|---|---|
| Auth | `POST /auth/register`, `POST /auth/login`, `GET /auth/me`, `PUT /auth/profile`, `PUT /auth/password` |
| Family | `GET /family`, `PUT /family`*, `POST /family/members`*, `DELETE /family/members/:id`* |
| Income | `GET/POST /income`, `PUT/DELETE /income/:id` |
| Expenses | `GET/POST /expenses`, `PUT/DELETE /expenses/:id`, `GET /expenses/priority` |
| Budgets | `GET /budgets`, `GET /budgets/current`, `PUT /budgets`*, `DELETE /budgets/:id`* |
| Goals | `GET/POST /goals`, `PUT/DELETE /goals/:id`, `GET/POST /goals/:id/contributions`, `DELETE /goals/contributions/:cid` |
| Insights | `GET /dashboard`, `GET /analysis`, `GET /recommendations`, `GET /meta` |
| Reports | `GET /reports`, `GET /reports/csv`, `GET /reports/pdf` (query: `year`, `month`; month `0` = whole year) |

\* Admin only. Members can edit and delete only their own income, expense and contribution records.

## Deployment
See `DEPLOYMENT.md`.
