# Reach Trader 🚀

> High-performance algorithmic and manual trading interface with real-time tick chart streaming, Deriv broker integration, risk management, and multi-currency cashier support.

---

## 🛠️ Prerequisites

Before building Reach Trader locally, ensure you have:
- **Node.js**: v18.0.0 or higher (v20+ recommended). Check with `node -v`
- **npm** (comes with Node.js) or **bun** / **yarn** / **pnpm**
- **Git**: Check with `git --version`

---

## 💻 Step-by-Step Build Procedures (Local Computer)

Follow these steps to build the application on your computer:

### Step 1: Clone the GitHub Repository
Open your terminal (macOS/Linux) or Command Prompt / PowerShell / Git Bash (Windows) and run:
```bash
git clone https://github.com/your-username/reach-trader.git
cd reach-trader
```

### Step 2: Install Project Dependencies
Install all required packages:
```bash
npm install
```
*(If you use Bun, you can alternatively run `bun install`)*

### Step 3: Run the Production Build
Compile and bundle the TypeScript & React application into static, minified production assets:
```bash
npm run build
```
When this command finishes:
- Vite generates an optimized production bundle inside the **`dist/`** directory.
- Assets are minified, tree-shaken, and ready for instant static delivery with zero server overhead.

### Step 4: Test & Preview the Built App Locally
To test the production build before putting it online:
```bash
npm run preview
```
Open `http://localhost:4173` in your browser to verify that the app runs smoothly.

---

## 🌐 1-Click Automated Deployments from GitHub

When your project is hosted on GitHub, you can set up continuous deployment so that every time you `git push`, the application builds automatically and goes live:

### Option A: Vercel (Recommended - Zero Configuration)
1. Go to [vercel.com](https://vercel.com) and log in with your GitHub account.
2. Click **Add New...** > **Project**.
3. Select your **reach-trader** repository from the GitHub list.
4. Vercel automatically detects the framework:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Click **Deploy**. Within 45 seconds, your bot is live with a free SSL/HTTPS domain (e.g. `reach-trader.vercel.app`).

### Option B: Netlify
1. Go to [netlify.com](https://netlify.com) and log in with GitHub.
2. Click **Add new site** > **Import an existing project**.
3. Choose **GitHub** and select your repository.
4. Settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
5. Click **Deploy Site**.

### Option C: GitHub Pages (Free via GitHub Actions)
To have GitHub automatically build and host your app for free directly on `https://<username>.github.io/reach-trader/`:
1. In your GitHub repository, go to **Settings** > **Pages**.
2. Under **Build and deployment** > **Source**, select **GitHub Actions**.
3. The included workflow `.github/workflows/deploy.yml` will automatically build the `dist/` directory and deploy it every time you push to the `main` branch.

### Option D: Ubuntu / Linux VPS Cloud Server (24/7 Run)
If running on a VPS (DigitalOcean, AWS, Linode, Hetzner):
```bash
# SSH into your VPS
ssh root@your-server-ip

# Clone & enter directory
git clone https://github.com/your-username/reach-trader.git
cd reach-trader

# Install dependencies & build
npm install
npm run build

# Install a light static web server or PM2
npm install -g serve pm2

# Run 24/7 in background
pm2 start "serve -s dist -l 3000" --name "reach-trader"
pm2 save
pm2 startup
```

---

## 🔑 Live Broker Connection (Deriv API)

1. Open your live app in any browser.
2. Click **Live Broker** in the top header.
3. Switch between **Demo Account (VRTC)** for risk-free strategy calibration, or paste your **Real Account API Token** (`read` + `trade` scopes) from [Deriv API Token Settings](https://app.deriv.com/account/api-token).
4. Real trade wins are credited directly to your Deriv Cashier balance in real-time.

---

## 📜 Available NPM Scripts

- `npm run dev`: Starts local Vite development server with HMR at `http://localhost:3000`.
- `npm run build`: Type-checks and compiles React + Tailwind bundle into `/dist`.
- `npm run preview`: Previews the `/dist` production build locally.
- `npm run lint`: Runs TypeScript validation (`tsc --noEmit`).
- `npm run clean`: Cleans previous build artifacts.
