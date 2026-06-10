# Discont

A lightweight, customizable, free messenger — like Discord, without the bloat.

## Features

- **Real-time chat** — instant messaging in text channels via WebSockets
- **Servers & channels** — create communities, organize conversations
- **Easy sharing** — one-click invite links and codes to bring friends in
- **Photo uploads** — custom avatars, banners, and server icons
- **Channel categories** — group text and voice channels
- **Voice channels** — real-time voice chat (WebRTC)
- **Profile & client customization** — themes, fonts, colors, and more
- **100% free** — no ads, no premium tiers, no paywalls

## Quick start (local)

```bash
npm install
npm run dev
```

Open **http://localhost:5173** — Vite proxies API, uploads, and WebSockets to the backend on port 3001.

### Production (local)

```bash
npm install
npm run build
npm start
```

Open **http://localhost:3001** — single server serves everything.

## Share with friends online (free)

### Option A: Deploy to Render (recommended)

Render's free tier hosts Discont with a persistent disk so your data and photos survive restarts.

1. Push this project to a **GitHub** repository
2. Sign up at [render.com](https://render.com) (free)
3. **New → Blueprint** → connect your repo (Render reads `render.yaml`)
4. Wait for the deploy to finish (~5 min first time)
5. Share your URL: `https://discont-xxxx.onrender.com`

Friends join via invite links like: `https://your-app.onrender.com/join/ABCD1234`

> **Note:** Free Render apps sleep after 15 min of inactivity. The first visit after sleep takes ~30 seconds to wake up.

### Option B: Quick tunnel (no deploy)

For a temporary link while developing:

```bash
npm run build
npm start
```

In another terminal, use [ngrok](https://ngrok.com) or [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/):

```bash
ngrok http 3001
```

Share the `https://xxxx.ngrok.io` URL. Free ngrok URLs change each time you restart.

### Option C: Same Wi‑Fi / LAN

Run `npm run dev` and share your computer's local IP:

```
http://192.168.x.x:5173
```

Friends must be on the same network.

## Invite friends

1. Open a server → click the clipboard icon in the sidebar
2. Copy the invite link or code
3. Friends open the link or enter the code to join

## Tech stack

- **Frontend:** React + Vite
- **Backend:** Node.js, Express, Socket.io
- **Database:** SQLite (file-based, persisted on `/data` when deployed)
- **Voice:** WebRTC peer-to-peer with Socket.io signaling

## Environment variables

| Variable   | Default              | Description                          |
|------------|----------------------|--------------------------------------|
| `PORT`     | `3001`               | Server port                          |
| `HOST`     | `0.0.0.0`            | Bind address                         |
| `DATA_DIR` | `server/` (local)    | SQLite DB + uploaded images path     |
