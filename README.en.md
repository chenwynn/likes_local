# Likes Local

[中文](./README.md)

![Screenshot 1](./docs/en/Screenshot%202026-03-06%20at%2015.59.58.png)
![Screenshot 2](./docs/en/Screenshot%202026-03-06%20at%2016.00.02.png)
![Screenshot 3](./docs/en/Screenshot%202026-03-06%20at%2016.00.11.png)
![Screenshot 4](./docs/en/Screenshot%202026-03-06%20at%2016.00.17.png)

A pure frontend app to visualize your [Likes](https://my.likes.com.cn) fitness data via Open API.  
Run locally or deploy to Vercel in one click.

---

## ✨ Features

- 🏃 **Activities** — Filter by type/date range with pagination
- 📊 **Analytics** — Weekly/monthly trends and chart dashboards (ECharts)
- 🔍 **Activity Detail** — Pace, HR, power, ascent, zones, laps, and more
- ⚙️ **Settings** — API Key, app name, language, theme, dark mode, access password
- 🌍 **Bilingual** — Chinese / English
- 🔐 **Access Password** — Optional local access protection

---

## 🚀 Quick Start

### 1. Get API Key

Go to [Likes settings](https://my.likes.com.cn/settings) and apply for your API Key (`lt_...`).

### 2. One-command install and run

```bash
git clone https://github.com/chenwynn/likes_local.git && cd likes_local && npm install && npm run dev
```

Then open http://localhost:5173 and set your API Key in **Settings**.

### 3. Build for production

```bash
npm run build
npm run preview
```

---

## 🌐 Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/chenwynn/likes_local)

Set environment variables:

| Variable | Required | Description |
|---|---|---|
| `VITE_API_KEY` | ✅ | Your API Key (`lt_xxx...`) |
| `VITE_API_BASE_URL` | Optional | API base URL, default `https://my.likes.com.cn` |
| `VITE_APP_NAME` | Optional | App name, default `Likes Local` |
| `VITE_APP_PASSWORD` | Optional | Access password |
| `VITE_LOCALE` | Optional | `zh` or `en`, default `zh` |

---

## 🖥️ Desktop Packages (GitHub Actions + Releases)

- Electron packaging is configured:
  - macOS: `dmg`, `pkg`
  - Linux: `AppImage`, `deb`
- Workflow file: `.github/workflows/release-desktop.yml`
- Trigger by pushing a version tag:

```bash
git tag v1.0.0
git push origin v1.0.0
```

After workflow completes, download installers from GitHub Releases.

---

## ⚙️ .env

```env
VITE_API_KEY=lt_your_api_key_here
VITE_API_BASE_URL=https://my.likes.com.cn
VITE_APP_NAME=Likes Local
VITE_APP_PASSWORD=
VITE_LOCALE=zh
```

