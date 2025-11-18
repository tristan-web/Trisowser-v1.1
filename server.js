import express from "express";
import { WebSocketServer } from "ws";
import path from "path";
import { fileURLToPath } from "url";
import * as chromeLauncher from "chrome-launcher";
import puppeteer from "puppeteer-core";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 10000;
const PANEL_PASSWORD = process.env.PANEL_PASSWORD || "TS2017";

// Track what users do
let visited = [];

// Launch Chrome
async function launchBrowser() {
  const chrome = await chromeLauncher.launch({
    chromeFlags: ["--no-sandbox", "--disable-gpu", "--disable-software-rasterizer"]
  });

  const browser = await puppeteer.connect({
    browserURL: `http://localhost:${chrome.port}`
  });

  const page = await browser.newPage();
  await page.goto("https://example.com");

  return { browser, page };
}

const browserPromise = launchBrowser();

// Serve public
app.use("/", express.static(path.join(__dirname, "public")));

// Protect /panel
app.use("/panel", (req, res, next) => {
  if (req.query.password === PANEL_PASSWORD) return next();
  res.status(401).send("Unauthorized");
});
app.use("/panel", express.static(path.join(__dirname, "panel")));

// Return visited data
app.get("/panel/api/visited", (req, res) => {
  res.json(visited);
});

// Troll endpoint
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

// Visit URLs
app.post("/panel/api/goto", async (req, res) => {
  const { url } = req.body;
  const { page } = await browserPromise;

  await page.goto(url);
  visited.push({ url, time: Date.now() });

  res.sendStatus(200);
});

// Start server
const server = app.listen(PORT, () =>
  console.log(`Trisowser running on port ${PORT}`)
);

// WebSockets (optional)
const wss = new WebSocketServer({ server });
