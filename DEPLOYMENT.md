# Deploying D Finance

Free-tier path: **MongoDB Atlas** (database) → **Render** (API) → **Vercel** (frontend). Deploy in this order, because each step needs a URL from the previous one.

## 0. Push to GitHub
```bash
cd d-finance
git init && git add . && git commit -m "D Finance"
git branch -M main
git remote add origin https://github.com/<you>/d-finance.git
git push -u origin main
```
`.gitignore` already excludes `node_modules`, `dist` and `.env`. Never commit real secrets.

## 1. Database: MongoDB Atlas
1. Create a free account at mongodb.com/atlas and create an **M0 (free)** cluster.
2. **Database Access** → add a database user with a strong password.
3. **Network Access** → add `0.0.0.0/0` (Render's IPs change on the free plan). Tighten this later if you upgrade.
4. **Connect → Drivers** → copy the connection string and add the database name:
   `mongodb+srv://<user>:<password>@<cluster>.mongodb.net/d-finance?retryWrites=true&w=majority`
   URL-encode special characters in the password (e.g. `@` becomes `%40`).

## 2. Backend: Render
1. Render dashboard → **New → Web Service** → connect your GitHub repo.
2. Settings:
   - Root Directory: `backend`
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Health Check Path: `/api/health`
3. Environment variables:
   | Key | Value |
   |---|---|
   | `NODE_ENV` | `production` |
   | `MONGO_URI` | your Atlas string from step 1 |
   | `JWT_SECRET` | a long random string (`node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`) |
   | `JWT_EXPIRES_IN` | `7d` |
   | `CLIENT_URL` | leave a placeholder for now; set it in step 4 |
4. Deploy. Open `https://<your-service>.onrender.com/api/health`. You should see `{"status":"ok",...}`.

(`render.yaml` in the repo root is an optional Blueprint that pre-fills these settings.)

Free Render services sleep after inactivity, so the first request can take about 30 seconds.

## 3. Frontend: Vercel
1. Vercel → **Add New → Project** → import the same repo.
2. Settings:
   - Root Directory: `frontend`
   - Framework Preset: Vite (build `npm run build`, output `dist`)
3. Environment variable:
   - `VITE_API_URL` = `https://<your-service>.onrender.com/api`
4. Deploy. `vercel.json` rewrites all routes to `index.html`, so refreshing on `/income` works.

(Netlify also works: base directory `frontend`, build `npm run build`, publish `dist`. `public/_redirects` handles routing.)

## 4. Connect them (CORS)
Back on Render, set `CLIENT_URL` to your Vercel URL (no trailing slash), for example `https://d-finance.vercel.app`. For several origins (e.g. a custom domain too), separate them with commas. Render redeploys automatically.

## 5. Verify
1. Open the Vercel URL → **Create an account**.
2. Add an income and an expense; check the dashboard updates.
3. In Atlas → **Browse Collections** you should see `users`, `families`, `incomes`, `expenses`.
4. Export a PDF from **Financial Reports**.

## Alternative: one server (VPS or single Node host)
Build the frontend (`npm run build --prefix frontend`) and serve `frontend/dist` with Nginx, pointing `/api` to `localhost:5000`. Run the API with `pm2 start backend/server.js --name d-finance`. Use Certbot for HTTPS.

## Troubleshooting
| Symptom | Fix |
|---|---|
| Login shows "Network Error" | `VITE_API_URL` wrong or missing; rebuild the frontend after changing it |
| Browser console CORS error | `CLIENT_URL` on Render must exactly match the frontend origin |
| API crashes with `MONGO_URI is not set` / auth failed | Re-check the Atlas string, user password encoding and Network Access |
| 404 on page refresh | Confirm `vercel.json` / `_redirects` is deployed |
| Slow first request | Free Render instance waking up |

## Production checklist
- Strong, unique `JWT_SECRET`; rotate if leaked
- Restrict Atlas Network Access once you have static IPs
- Enable Atlas backups
- Add rate limiting (e.g. `express-rate-limit`) on `/api/auth` before going public
