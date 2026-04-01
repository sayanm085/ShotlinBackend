# ShotlinBackend

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-18%2B-green?logo=node.js" alt="Node.js" />
  <img src="https://img.shields.io/badge/Express.js-4.x-lightgrey?logo=express" alt="Express" />
  <img src="https://img.shields.io/badge/MongoDB-8.x-green?logo=mongodb" alt="MongoDB" />
  <img src="https://img.shields.io/badge/License-Apache%202.0-blue" alt="License" />
</p>

> **Shotlin** is an open-source backend API powering the [Shotlin](https://shotlin.com) platform — a modern service marketplace that connects clients with photographers, videographers, and creative professionals.

---

## Table of Contents

1. [About the Project](#about-the-project)
2. [Related Repositories](#related-repositories)
3. [Tech Stack](#tech-stack)
4. [Features](#features)
5. [API Overview](#api-overview)
6. [Prerequisites](#prerequisites)
7. [Local Development Setup](#local-development-setup)
8. [Environment Variables](#environment-variables)
9. [Deployment Guide](#deployment-guide)
   - [Deploy on a VPS / Linux Server (PM2)](#deploy-on-a-vps--linux-server-pm2)
   - [Deploy with Docker](#deploy-with-docker)
   - [Deploy on Railway / Render / Fly.io](#deploy-on-railway--render--flyio)
10. [Contributing](#contributing)
11. [License](#license)
12. [Contact](#contact)

---

## About the Project

ShotlinBackend is the **RESTful API server** for the Shotlin platform. It handles user authentication, product/service listings, booking & scheduling, invoicing, discount management, and admin operations. The project is open-source under the **Apache 2.0** license, so you are free to fork, self-host, and adapt it for your own use.

---

## Related Repositories

The Shotlin platform is composed of three separate repositories that work together:

| Repository | Description |
|---|---|
| **[ShotlinBackend](https://github.com/sayanm085/ShotlinBackend)** *(this repo)* | RESTful API server — handles auth, bookings, invoicing, payments, and all business logic |
| **[ShotlinAdmin](https://github.com/sayanm085/ShotlinAdmin)** | Admin dashboard — a web interface for administrators to manage services, bookings, users, discounts, and content |
| **[shotlin-web](https://github.com/sayanm085/shotlin-web)** | User-facing frontend — the client-side web application where users browse services, make bookings, and manage their accounts |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 18 + |
| Framework | Express.js 4 |
| Database | MongoDB (via Mongoose 8) |
| Caching | Redis 7 |
| Auth | JWT (jsonwebtoken) + bcrypt |
| File Storage | Cloudinary |
| Email | Zoho ZeptoMail |
| Payments | Razorpay |
| Meetings | Zoom Server-to-Server OAuth |
| Push Notifications | Firebase Admin SDK |
| PDF Generation | PDFKit |
| Search | Fuse.js (fuzzy search) |

---

## Features

- 🔐 **User authentication** — register, login, refresh-token, logout with secure HttpOnly cookies
- 📦 **Product / Service management** — CRUD, image uploads via Cloudinary, fuzzy search
- 📅 **Booking & Scheduling** — daily schedule management, Zoom meeting creation & email dispatch
- 🧾 **Invoice generation** — PDF invoices with QR codes sent via email
- 💸 **Discount & Coupon management** — create, validate, and apply discount codes
- 📬 **Contact form** — store and manage enquiries
- 🌐 **Web content management** — manage dynamic content for the front-end
- 🛡️ **Admin panel routes** — protected admin operations

---

## API Overview

All routes are prefixed with `/api/v1`.

| Prefix | Description |
|---|---|
| `/api/v1/users` | Registration, login, profile, refresh-token |
| `/api/v1/products` | Product/service listings |
| `/api/v1/content` | Web content management |
| `/api/v1/contact` | Contact / enquiry form |
| `/api/v1/invoice` | Invoice creation & delivery |
| `/api/v1/discount` | Discount code management |
| `/api/v1/admin` | Admin-only operations |
| `/schedule-call` | Zoom meeting scheduling |

---

## Prerequisites

Make sure you have the following installed before running the project locally:

- **Node.js** v18 or higher — https://nodejs.org
- **npm** v9 or higher (comes with Node.js)
- **MongoDB** v6+ (local install or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) free tier)
- **Redis** v7+ (local install or [Redis Cloud](https://redis.io/cloud/) free tier)
- **Git** — https://git-scm.com

Optional (needed to enable the respective features):

- [Cloudinary](https://cloudinary.com/) account (file / image uploads)
- [Razorpay](https://razorpay.com/) account (payments)
- [Zoho ZeptoMail](https://www.zoho.com/zeptomail/) account (transactional email)
- [Zoom Marketplace](https://marketplace.zoom.us/) Server-to-Server OAuth app (meeting scheduling)
- [Firebase](https://console.firebase.google.com/) project with a service-account JSON (push notifications)

---

## Local Development Setup

```bash
# 1. Clone the repository
git clone https://github.com/sayanm085/ShotlinBackend.git
cd ShotlinBackend

# 2. Install dependencies
npm install

# 3. Copy the demo environment file and fill in your values
cp .env.demo .env
# Open .env in your editor and replace every placeholder with real credentials.

# 4. (Optional) Place your Firebase service-account file in the project root
#    and make sure FIREBASE_SERVICE_ACCOUNT_PATH in .env points to it.
#    Example: FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccountKey.json

# 5. Start the development server (auto-restarts on file changes)
npm run dev

# The API will be available at http://localhost:3000 (or the PORT you set in .env)
```

To start the server in production mode locally:

```bash
npm start
```

---

## Environment Variables

Copy `.env.demo` to `.env` and populate each variable. Below is a full reference:

| Variable | Description |
|---|---|
| `PORT` | Port the server listens on (default `3000`) |
| `HOST` | Host binding (default `0.0.0.0`) |
| `NODE_ENV` | `development` or `production` |
| `DATABASE_URL` | MongoDB connection string |
| `DB_NAME` | MongoDB database name |
| `REDIS_HOST` | Redis host |
| `REDIS_PORT` | Redis port |
| `REDIS_USERNAME` | Redis username (leave empty if none) |
| `REDIS_PASSWORD` | Redis password (leave empty if none) |
| `ACCESS_TOKEN_SECRET` | Secret key for access JWT |
| `ACCESS_TOKEN_EXPIRY` | Access token expiry (e.g. `1d`) |
| `REFRESH_TOKEN_SECRET` | Secret key for refresh JWT |
| `REFRESH_TOKEN_EXPIRY` | Refresh token expiry (e.g. `7d`) |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `RAZORPAY_KEY_ID` | Razorpay key ID |
| `RAZORPAY_KEY_SECRET` | Razorpay key secret |
| `ZEPTOMAIL_URL` | ZeptoMail API base URL |
| `ZEPTOMAIL_TOKEN` | ZeptoMail authentication token |
| `EMAIL_FROM` | Sender email address |
| `EMAIL_FROM_NAME` | Sender display name |
| `ZOOM_ACCOUNT_ID` | Zoom Server-to-Server OAuth account ID |
| `ZOOM_CLIENT_ID` | Zoom OAuth client ID |
| `ZOOM_CLIENT_SECRET` | Zoom OAuth client secret |
| `FIREBASE_SERVICE_ACCOUNT_PATH` | Path to Firebase service-account JSON file |

> ⚠️ **Never commit your real `.env` file or `serviceAccountKey.json` to version control.** Both are listed in `.gitignore`.

---

## Deployment Guide

### Deploy on a VPS / Linux Server (PM2)

This is the recommended approach for production.

```bash
# --- On your local machine ---
# Push your code to GitHub (or another Git remote).

# --- On the VPS (Ubuntu / Debian) ---

# 1. Install Node.js (using NodeSource)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 2. Install PM2 globally
sudo npm install -g pm2

# 3. Install MongoDB (skip if using Atlas)
# Follow: https://www.mongodb.com/docs/manual/tutorial/install-mongodb-on-ubuntu/

# 4. Install Redis (skip if using Redis Cloud)
sudo apt-get install -y redis-server
sudo systemctl enable redis-server

# 5. Clone the repository on the server
git clone https://github.com/sayanm085/ShotlinBackend.git
cd ShotlinBackend

# 6. Install dependencies
npm install --omit=dev

# 7. Create and populate the .env file
cp .env.demo .env
nano .env   # fill in all real values

# 8. Start the application with PM2
pm2 start src/index.js --name shotlin-backend

# 9. Save PM2 process list so it restarts on reboot
pm2 save
pm2 startup   # follow the printed command to enable startup on boot

# 10. (Optional) Set up Nginx as a reverse proxy
#     Point your domain to the VPS IP and proxy requests to localhost:PORT
```

**Nginx reverse proxy example** (`/etc/nginx/sites-available/shotlin`):

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable it and reload Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/shotlin /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

Add HTTPS with Let's Encrypt:

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d api.yourdomain.com
```

---

### Deploy with Docker

```dockerfile
# Dockerfile (create in project root)
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY . .
EXPOSE 3000
CMD ["node", "src/index.js"]
```

```bash
# Build and run
docker build -t shotlin-backend .
docker run -d \
  --name shotlin-backend \
  --env-file .env \
  -p 3000:3000 \
  shotlin-backend
```

Or use **Docker Compose** to spin up the app together with MongoDB and Redis:

```yaml
# docker-compose.yml
version: "3.9"
services:
  api:
    build: .
    ports:
      - "3000:3000"
    env_file: .env
    depends_on:
      - mongo
      - redis

  mongo:
    image: mongo:6
    volumes:
      - mongo_data:/data/db

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

volumes:
  mongo_data:
  redis_data:
```

```bash
docker compose up -d
```

---

### Deploy on Railway / Render / Fly.io

These platforms support one-click Node.js deployments from a GitHub repository.

**Railway**

1. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**.
2. Select `sayanm085/ShotlinBackend`.
3. Add a **MongoDB** plugin and a **Redis** plugin from the Railway dashboard.
4. Set all required environment variables in the **Variables** tab.
5. Railway will detect Node.js automatically and run `npm start`.

**Render**

1. Go to [render.com](https://render.com) → **New** → **Web Service** → connect your repo.
2. Set **Build Command**: `npm install`
3. Set **Start Command**: `node src/index.js`
4. Add environment variables under the **Environment** tab.
5. Provision a MongoDB Atlas cluster and Redis Cloud instance, then paste their connection strings.

**Fly.io**

```bash
# Install flyctl: https://fly.io/docs/hands-on/install-flyctl/
fly auth login
fly launch          # follow prompts; choose Node.js runtime
fly secrets set PORT=3000 DATABASE_URL=... ACCESS_TOKEN_SECRET=...   # etc.
fly deploy
```

---

## Contributing

Contributions are welcome! Here's how to get started:

1. Fork the repository
2. Create a new branch: `git checkout -b feature/your-feature-name`
3. Make your changes and commit: `git commit -m "feat: describe your change"`
4. Push to your fork: `git push origin feature/your-feature-name`
5. Open a Pull Request against the `main` branch

Please make sure your code follows the existing style and that the server starts without errors before submitting a PR.

---

## License

Distributed under the **Apache License 2.0**. See [`LICENSE`](./LICENSE) for full details.

---

## Contact

| | |
|---|---|
| **Author** | Sayan Mondal |
| **Website** | [https://shotlin.com](https://shotlin.com) |
| **GitHub** | [@sayanm085](https://github.com/sayanm085) |
| **Email** | Use the contact form at [shotlin.com](https://shotlin.com) or open a [GitHub Issue](https://github.com/sayanm085/ShotlinBackend/issues) |

> Found a bug or have a feature request? Please [open an issue](https://github.com/sayanm085/ShotlinBackend/issues/new) — we'd love to hear from you!