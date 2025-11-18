import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import puppeteer from "puppeteer"; // Bundled Chromium

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 10000;
const PANEL_PASSWORD = process.env.PANEL_PASSWORD || "TS2017";

// Track visited URLs
let visited = [];

// Launch Puppeteer with bundled Chromium
const browserPromise = puppeteer.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-setuid-sandbox"]
}).then(async (browser) => {
  const page = await browser.newPage();
  await page.goto("https://example.com");
  return { browser, page };
});

// Serve homepage
app.use("/", express.static(path.join(__dirname, "public")));

// Panel route with password protection
app.get("/panel", (req, res) => {
  if (req.query.password !== PANEL_PASSWORD) {
    return res.status(401).send("Unauthorized");
  }
  res.sendFile(path.join(__dirname, "panel", "index.html"));
});

// Serve panel static files (CSS/JS)
app.use("/panel", express.static(path.join(__dirname, "panel")));

// API: Return visited URLs
app.get("/panel/api/visited", (req, res) => {
  res.json(visited);
});

// API: Send Cat Troll
app.post("/panel/api/troll", async (req, res) => {
  const { page } = await browserPromise;

  await page.evaluate(() => {
    const img = document.createElement("img");
    img.src = "https://cataas.com/cat";
    img.style.position = "fixed";
    img.style.left = "50%";
    img.style.top = "50%";
    img.style.transform = "translate(-50%, -50%)";
    img.style.zIndex = "99999";
    img.style.width = "250px";
    img.style.height = "250px";
    document.body.appendChild(img);
    setTimeout(() => img.remove(), 2000);
  });

  res.sendStatus(200);
});

// API: Navigate to URL
app.post("/panel/api/goto", async (req, res) => {
  const { url } = req.body;
  const { page } = await browserPromise;

  await page.goto(url);
  visited.push({ url, time: Date.now() });

  res.sendStatus(200);
});

// Start server
app.listen(PORT, () => console.log(`Trisowser running on port ${PORT}`));
