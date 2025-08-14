const express = require('express');
const puppeteer = require('puppeteer-core');

const app = express();
const PORT = process.env.PORT || 3000;

// Singleton browser برای کاهش overhead
let browser;

async function initBrowser() {
  if (!browser) {
    browser = await puppeteer.launch({
      executablePath: '/usr/bin/chromium-browser',
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
        '--disable-dev-shm-usage', // کاهش مصرف حافظه
        '--disable-gpu',
        '--single-process',
        '--disable-extensions'
      ]
    });
  }
}

async function getInstaTrackData(username) {
  await initBrowser();
  const page = await browser.newPage();

  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
  );

  await page.goto(`https://instrack.app/instagram/${username}`, { waitUntil: 'networkidle2' });
  await page.waitForTimeout(2000); // کاهش زمان wait

  const cookies = await page.cookies();
  const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join('; ');
  const xsrfToken = cookies.find(c => c.name === 'XSRF-TOKEN')?.value || '';

  const apiResponse = await page.evaluate(
    async (url, headers) => {
      const res = await fetch(url, { method: 'GET', headers, credentials: 'include' });
      return await res.json();
    },
    `https://instrack.app/api/account/${username}`,
    {
      'authority': 'instrack.app',
      'accept': 'application/json, text/plain, */*',
      'accept-language': 'en-US,en;q=0.9',
      'referer': `https://instrack.app/instagram/${username}`,
      'sec-ch-ua': '"Chromium";v="115", "Google Chrome";v="115"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"',
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'same-origin',
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
      'x-requested-with': 'XMLHttpRequest',
      'x-xsrf-token': xsrfToken,
      'cookie': cookieHeader
    }
  );

  await page.close(); // فقط صفحه بسته می‌شود، نه browser
  return apiResponse;
}

app.get('/api/:username', async (req, res) => {
  const username = req.params.username;
  try {
    const data = await getInstaTrackData(username);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Cleanup هنگام خاموش شدن سرویس
process.on('exit', async () => { if(browser) await browser.close(); });

app.listen(PORT, () => console.log(`Optimized server running on port ${PORT}`));
