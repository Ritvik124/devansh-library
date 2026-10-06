# DEVANSH LIBRARY — Your Space to Focus, Learn & Succeed
Student study-library seat booking system (MERN). All times use **Asia/Kolkata (IST, UTC+05:30)**. *Made by Ritvik Raj ❤️*

## 1. Features
Student register/login/forgot-password/profile · live seat map · **Find Earliest Available Seat** · booking with backend double-booking prevention · midnight-crossing bookings · My Bookings (Upcoming/Active/Completed/Cancelled) · Admin: stats, students (search/enable/disable/delete), seats (add/maintenance/remove), bookings (search/cancel).

## 2. Software to install (beginner)
1. **Node.js 20+ LTS** — https://nodejs.org (check: `node -v`, `npm -v`)
2. **Git** — https://git-scm.com (`git --version`)
3. **VS Code** — https://code.visualstudio.com
4. **GitHub account** — https://github.com
5. **MongoDB Atlas account** (free tier) — https://www.mongodb.com/atlas

## 3. MongoDB Atlas setup
1. Create account → **Build a Database** → free **M0** cluster.
2. *Database Access* → Add user (username + password, read/write).
3. *Network Access* → Add IP (`0.0.0.0/0` for testing/Render; restrict later).
4. *Connect → Drivers* → copy the connection string, append `/devansh_library`.
5. Paste into `server/.env` as `MONGODB_URI` (URL-encode special characters in the password).

## 4. Local setup
```bash
cd devansh-library
npm install                         # installs root + server + client
cp server/.env.example server/.env  # then edit values (Windows: copy)
cp client/.env.example client/.env
npm run seed                        # 100 seats (A01-D25) + admin from SEED_ADMIN_*
npm run dev                         # API :5000 + web :5173
```
Generate a JWT secret: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`
Open http://localhost:5173 · API health: http://localhost:5000/api/health
Admin login: the `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` you set (use a strong password).
Run separately: `cd server && npm run dev` / `cd client && npm run dev`.
Production: `npm run build` (client → `client/dist`), `npm start` (API).

## 5. Environment variables
`server/.env`: PORT, NODE_ENV, MONGODB_URI, JWT_SECRET, JWT_EXPIRES_IN, CLIENT_URL (comma-separate multiple origins), LIBRARY_TIMEZONE=Asia/Kolkata, SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD.
`client/.env`: VITE_API_URL. **Never commit `.env`.**

## 6. API
| Method | Path | Auth |
|---|---|---|
| GET | /api/health | – |
| POST | /api/auth/register, /login, /logout, /forgot-password, /reset-password | – |
| GET/PUT | /api/auth/me · PUT /api/auth/me/password | user |
| GET | /api/seats, /api/seats/available | – |
| POST | /api/bookings `{seatId,date,startTime,duration(min)}` | student |
| GET | /api/bookings/my, /api/bookings/first-available?date=&startTime=&duration=, /api/bookings/:id | user |
| DELETE | /api/bookings/:id | owner/admin |
| GET | /api/admin/stats, /students, /bookings, /seats | admin |
| PUT/DELETE | /api/admin/users/:id · POST/PUT/DELETE /api/admin/seats(/:id) · DELETE /api/admin/bookings/:id | admin |

## 7. Booking logic
- Booking stores absolute start/end instants (`Date`); display is always formatted in IST. 11 PM → 2 AM = 3 h automatically.
- Overlap rule (server-side): reject if an existing confirmed booking has `start < newEnd && end > newStart`.
- Earliest seat: for each active seat, start at requested time; move forward past conflicting bookings until a free window ≥ duration exists; sort seats by earliest start.
- Seat status is computed live: occupied (booking now), reserved (booking within 60 min), maintenance, else available.

## 8. Deployment
**Backend (Render):** New Web Service → repo → Root `server`, Build `npm install`, Start `npm start`. Set env: NODE_ENV=production, MONGODB_URI, JWT_SECRET, CLIENT_URL=https://your-frontend, LIBRARY_TIMEZONE=Asia/Kolkata. Run `npm run seed` once (Render shell or locally with the Atlas URI).
**Frontend (Vercel):** Import repo → Root `client`, framework Vite, Output `dist`, env `VITE_API_URL=https://your-backend.onrender.com/api`. `client/vercel.json` enables SPA refresh fallback.

## 9. GitHub
```bash
git init && git add . && git commit -m "Initial commit"
git branch -M main
git remote add origin YOUR_GITHUB_URL
git push -u origin main
```

## 10. Troubleshooting
- *MongoDB connection failed* → check password encoding, Atlas Network Access, db name.
- *CORS error* → `CLIENT_URL` must exactly match the frontend origin (no trailing slash).
- *401 after refresh* → token expired; login again.
- *Port in use* → change `PORT`.
- *Forgot password*: email sending is not wired; in development the token is shown on screen. Add an email provider (e.g. Nodemailer) in `routes/auth.js` before production.

## 11. Known limits / next steps
Analytics charts, profile photo upload (URL only), email/SMS OTP, admin manual-assign and settings page are not included yet. Contact details on the home page are placeholders. For heavy concurrency, add a Mongo transaction or unique slot locking around booking creation.

Author: **Ritvik Raj**
