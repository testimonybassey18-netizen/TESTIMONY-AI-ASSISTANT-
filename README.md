# TESTIMONY AI ASSISTANT
*Your Intelligence. Your Creativity. Your Success.*

An advanced, human-like AI partner designed for live voice conversations, business radar lead scanning (broken websites & remote jobs in Nigeria and globally), academic assignments, CV building, multi-lingual translations, and data intelligence.

---

## 🚀 One-Click Deploy to Render (render.com)

This application includes a pre-configured `render.yaml` blueprint and is 100% ready for Render deployment.

### Method 1: Using Render Dashboard (Recommended)

1. **Push your code to GitHub**:
   ```bash
   git add .
   git commit -m "Deploy Testimony AI"
   git push origin main
   ```

2. **Open Render**:
   - Go to [dashboard.render.com](https://dashboard.render.com).
   - Click the **New +** button in the top right corner and choose **Web Service**.
   - Connect your GitHub account and select this repository.

3. **Configure the settings** (Render will auto-detect most of these):
   - **Name**: `testimony-ai`
   - **Language / Runtime**: `Node`
   - **Branch**: `main` (or `master`)
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `node server.ts`
   - **Instance Type**: `Free`

4. **Environment Variables**:
   Under **Environment Variables**, add:
   - `NODE_ENV` = `production`
   - `GEMINI_API_KEY` = *[Your Gemini API Key from Google AI Studio]*
   - `NODE_VERSION` = `22`

5. **Deploy**:
   - Click **Deploy Web Service** at the bottom.
   - Render will build the Vite frontend into `dist/`, start the full-stack Node server, and give you a live HTTPS link (e.g., `https://testimony-ai.onrender.com`).

---

### Method 2: Using Render Blueprints

1. Go to [dashboard.render.com/blueprints](https://dashboard.render.com/blueprints).
2. Click **New Blueprint Instance**.
3. Select this GitHub repository.
4. Render will read `render.yaml` automatically, set the build commands, and prompt you for `GEMINI_API_KEY`.
5. Click **Apply** to launch!

---

## 🛠️ Local Development

```bash
# 1. Install dependencies
npm install

# 2. Start dev server (with Vite HMR & Express API backend)
npm run dev

# 3. Build for production
npm run build

# 4. Run production server
npm start
```

---

## 🔒 Owner VIP Lifetime Pass
To access 100% unlimited free usage without subscription fees:
1. Tap the AI logo **"T"** in the top navigation bar.
2. Enter the secret master key: `ravenBLAKE@2008`.
3. Enjoy lifetime VIP access!
