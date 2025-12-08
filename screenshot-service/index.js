const express = require("express");
const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");
const os = require("os");

const app = express();
app.use(express.json());

// CORS middleware
app.use((req, res, next) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).send("");
  next();
});

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// In-memory token cache
let cachedToken = null;
let tokenExpiry = null;

/**
 * Get credentials from environment variables
 */
function getCredentialsFromEnv() {
  const clientId = process.env.IAP_CLIENT_ID;
  const clientSecret = process.env.IAP_CLIENT_SECRET;
  const refreshToken = process.env.IAP_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    console.log("IAP credentials not configured in environment");
    return null;
  }

  return { clientId, clientSecret, refreshToken };
}

/**
 * Refresh the ID token using the refresh token
 */
async function refreshIdToken(credentials) {
  try {
    console.log("Refreshing IAP ID token...");

    const params = new URLSearchParams({
      client_id: credentials.clientId,
      client_secret: credentials.clientSecret,
      refresh_token: credentials.refreshToken,
      grant_type: "refresh_token",
    });

    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Token refresh failed: ${response.status} - ${errorText}`
      );
    }

    const data = await response.json();

    // Cache the token
    cachedToken = data.id_token;
    tokenExpiry = Date.now() + (data.expires_in - 300) * 1000; // 5 min buffer

    console.log("IAP ID token refreshed successfully");
    return data.id_token;
  } catch (error) {
    console.error("Failed to refresh ID token:", error.message);
    return null;
  }
}

/**
 * Get a valid IAP ID token (refresh if needed)
 */
async function getIAPToken() {
  // Check cache first
  if (cachedToken && tokenExpiry && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  const credentials = getCredentialsFromEnv();
  if (!credentials) return null;

  return await refreshIdToken(credentials);
}

// Screenshot endpoint
app.get("/", async (req, res) => {
  const url = req.query.url;
  const width = parseInt(req.query.width) || 1280;
  const height = parseInt(req.query.height) || 800;
  const useAuth = req.query.auth !== "false";

  if (!url) {
    return res.status(400).json({ error: "Missing url parameter" });
  }

  let browser;
  try {
    console.log(
      `Taking screenshot of: ${url} (${width}x${height}), auth: ${useAuth}`
    );

    // Get IAP token for Shopify domains
    let iapToken = null;
    if (
      useAuth &&
      (url.includes(".shopify.io") || url.includes(".shopify.com"))
    ) {
      console.log("Getting IAP token for Shopify domain...");
      iapToken = await getIAPToken();
      if (iapToken) {
        console.log("Got IAP token");
      } else {
        console.log("No IAP token available - screenshot may show auth page");
      }
    }

    browser = await puppeteer.launch({
      headless: "new",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--single-process",
      ],
    });

    const page = await browser.newPage();
    await page.setViewport({ width, height });

    // If we have an IAP token, intercept requests and add the auth header
    if (iapToken) {
      console.log("Setting up request interception with IAP token...");
      await page.setRequestInterception(true);
      page.on("request", (request) => {
        const requestUrl = request.url();
        // Only add auth to Shopify domains
        if (
          requestUrl.includes(".shopify.io") ||
          requestUrl.includes(".shopify.com")
        ) {
          const headers = {
            ...request.headers(),
            Authorization: `Bearer ${iapToken}`,
          };
          request.continue({ headers });
        } else {
          request.continue();
        }
      });
    }

    // Use 'domcontentloaded' instead of 'networkidle2' because sites with
    // Socket.IO/WebSockets (like Quick sites) never go network-idle
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15000 });
    // Give the page a moment to render after DOM is ready
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Check if we landed on a Google auth page
    const currentUrl = page.url();
    const onAuthPage =
      currentUrl.includes("accounts.google.com") ||
      currentUrl.includes("signin");
    if (onAuthPage) {
      console.log("Warning: Landed on Google auth page");
    }

    const screenshot = await page.screenshot({
      type: "jpeg",
      quality: 85,
    });

    await browser.close();

    console.log(
      `Screenshot completed for: ${url} (${screenshot.length} bytes), auth page: ${onAuthPage}`
    );

    res.writeHead(200, {
      "Content-Type": "image/jpeg",
      "Content-Length": screenshot.length,
      "X-Auth-Used": iapToken ? "true" : "false",
      "X-Landed-On-Auth": onAuthPage ? "true" : "false",
    });
    res.end(screenshot);
  } catch (error) {
    if (browser) await browser.close();
    console.error("Screenshot error:", error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Screenshot service running on port ${PORT}`);
  console.log(`IAP auth configured: ${!!getCredentialsFromEnv()}`);
});
