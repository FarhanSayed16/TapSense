const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');
const http = require('http');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUTPUT_DIR = path.resolve(__dirname, '../../docs/assets/screenshots');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function postLogin() {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      email: 'admin@tapsense.app',
      password: 'TapSenseAdmin123!'
    });
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: 8000,
        path: '/api/v1/auth/login',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data)
        }
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            reject(e);
          }
        });
      }
    );
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function run() {
  console.log('Fetching JWT token from backend...');
  const authResp = await postLogin();
  const token = authResp.access_token;
  const user = {
    email: 'admin@tapsense.app',
    name: 'TapSense Admin',
    role: 'org_admin',
    org_id: 'org_pilot'
  };
  console.log('Got auth token:', token.slice(0, 20) + '...');

  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    defaultViewport: { width: 1440, height: 900, deviceScaleFactor: 2 },
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  // 1. Capture Login Page (without setting auth)
  const loginPage = await browser.newPage();
  console.log('Capturing Login screen...');
  await loginPage.goto('http://localhost:3000/login', { waitUntil: 'domcontentloaded' });
  await new Promise((r) => setTimeout(r, 2500));
  await loginPage.screenshot({ path: path.join(OUTPUT_DIR, '01_login_portal.png') });
  await loginPage.close();
  console.log('Saved 01_login_portal.png');

  // Authenticated context
  const page = await browser.newPage();
  await page.evaluateOnNewDocument((tok, usr) => {
    localStorage.setItem('tapsense_token', tok);
    localStorage.setItem('tapsense_user', JSON.stringify(usr));
  }, token, user);

  const views = [
    { name: '02_operations_dashboard.png', url: 'http://localhost:3000/' },
    { name: '03_tap_nodes_monitor.png', url: 'http://localhost:3000/taps' },
    { name: '04_flow_sessions_telemetry.png', url: 'http://localhost:3000/sessions' },
    { name: '05_edge_devices_hardware.png', url: 'http://localhost:3000/devices' },
    { name: '06_campus_leaderboard.png', url: 'http://localhost:3000/leaderboard' },
    { name: '07_public_kiosk_display.png', url: 'http://localhost:3000/visibility' },
    { name: '08_behavior_interventions.png', url: 'http://localhost:3000/social' },
    { name: '09_pilot_phases_science.png', url: 'http://localhost:3000/phases' },
    { name: '10_facility_thresholds.png', url: 'http://localhost:3000/thresholds' },
    { name: '11_realtime_alerts.png', url: 'http://localhost:3000/alerts' }
  ];

  for (const item of views) {
    console.log(`Navigating to ${item.url}...`);
    try {
      await page.goto(item.url, { waitUntil: 'domcontentloaded', timeout: 10000 });
      await new Promise((r) => setTimeout(r, 2000));
      await page.screenshot({ path: path.join(OUTPUT_DIR, item.name) });
      console.log(`Saved ${item.name}`);
    } catch (err) {
      console.error(`Failed ${item.name}:`, err.message);
    }
  }

  await browser.close();
  console.log('ALL SCREENSHOTS CAPTURED SUCCESSFUL!');
}

run().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
