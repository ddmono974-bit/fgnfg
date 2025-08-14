const puppeteer = require('puppeteer');

async function getInstaTrackData(username) {
  const browser = await puppeteer.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", // مسیر کروم
    headless: false,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled'
    ]
  });

  const page = await browser.newPage();

  // شبیه‌سازی مرورگر واقعی
  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36'
  );

  await page.goto(`https://instrack.app/instagram/${username}`, {
    waitUntil: 'networkidle2'
  });

  // صبر برای رد شدن Cloudflare
  await page.waitForTimeout(3000);

  // گرفتن تمام کوکی‌ها
  const cookies = await page.cookies();
  const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join('; ');
  const xsrfToken = cookies.filter(c => c.name === 'XSRF-TOKEN')
                           .map(c => c.value)[0] || '';

  // درخواست API با کوکی و هدرهای واقعی
  const apiResponse = await page.evaluate(
    async (url, headers) => {
      const res = await fetch(url, {
        method: 'GET',
        headers: headers,
        credentials: 'include'
      });
      return await res.json();
    },
    `https://instrack.app/api/account/${username}`,
    {
      'authority': 'instrack.app',
      'accept': 'application/json, text/plain, */*',
      'accept-language': 'en-US,en;q=0.9',
      'referer': `https://instrack.app/instagram/${username}`,
      'sec-ch-ua': '"Chromium";v="87", "Google Chrome";v="87"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"',
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'same-origin',
      'user-agent':
        'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36',
      'x-requested-with': 'XMLHttpRequest',
      'x-xsrf-token': xsrfToken,
      'cookie': cookieHeader
    }
  );

  await browser.close();
  return apiResponse;
}

// اجرای تابع
getInstaTrackData('sasy')
  .then(data => console.log(JSON.stringify(data, null, 2)))
  .catch(err => console.error(err));
