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

1. Push this project to a **GitHub** repository
2. Sign up at [render.com](https://render.com) (free)
3. **New → Blueprint** → connect your repo (Render reads `render.yaml`)
4. Wait for the deploy to finish (~3–5 min first time)
5. Share your URL: `https://discont-xxxx.onrender.com`

Friends join via invite links like: `https://your-app.onrender.com/join/ABCD1234`

**Free tier behavior:**

| What | How it works |
|------|----------------|
| **Cold start** | Yes — if nobody has visited in ~15 min, the app sleeps. When a friend opens the URL, Render boots it automatically. Expect **30–60 seconds** before the page loads. |
| **Data & photos** | Stored on the server’s local disk. This is **not permanent** on the free plan — accounts, messages, and uploads may be **lost when Render redeploys** or recycles the instance. Fine for hanging out with friends; not for long-term archiving. |
| **Cost** | $0 — no credit card needed for the free web service. |

If the Blueprint fails, create the service manually: **New → Web Service** → connect repo → Build: `npm install && npm run build` → Start: `npm start`.

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
| `DATA_DIR` | `server/` (default)  | SQLite DB + uploaded images path     |
