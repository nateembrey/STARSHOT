'use server';

import {NextResponse} from 'next/server';
import puppeteer from 'puppeteer';

// IMPORTANT: Create a .env.local file in the root of your project and add your credentials like this:
// SCRAPE_USERNAME=your_username
// SCRAPE_PASSWORD=your_password
// Do not commit this file to git.

const a =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36';

export async function GET(request: Request) {
  const {searchParams} = new URL(request.url);
  const model = searchParams.get('model'); // 'chatgpt' or 'gemini'

  // --- CONFIGURATION: You need to update these values ---
  const loginUrl = 'https://your-website.com/login'; // TODO: Replace with the actual login URL
  const dataUrl = 'https://your-website.com/dashboard'; // TODO: Replace with the URL of the page containing the data after login

  // --- SELECTORS: You need to update these with the actual selectors from the website's HTML ---
  const usernameSelector = '#username'; // TODO: Replace with the selector for the username input
  const passwordSelector = '#password'; // TODO: Replace with the selector for the password input
  const loginButtonSelector = '#login-button'; // TODO: Replace with the selector for the login button

  // This is a placeholder for where you would define selectors to find your data.
  // You will need to inspect the target website's HTML to find the correct selectors.
  // For example: const totalRevenueSelector = '#total-revenue-widget .value';
  const dataSelectors = {
    chatgpt: {
      totalRevenue: '#chatgpt-total-revenue',
      pnl: '#chatgpt-pnl',
      // ... add other selectors for ChatGPT data
      recentTrades: '#chatgpt-trades-table > tbody > tr', // Example selector for a table
    },
    gemini: {
      totalRevenue: '#gemini-total-revenue',
      pnl: '#gemini-pnl',
      // ... add other selectors for Gemini data
      recentTrades: '#gemini-trades-table > tbody > tr', // Example selector for a table
    },
  };
  // --- END CONFIGURATION ---

  if (!model || (model !== 'chatgpt' && model !== 'gemini')) {
    return NextResponse.json(
      {error: 'Invalid model specified'},
      {status: 400}
    );
  }

  const username = process.env.SCRAPE_USERNAME;
  const password = process.env.SCRAPE_PASSWORD;

  if (!username || !password) {
    console.error('Missing SCRAPE_USERNAME or SCRAPE_PASSWORD in .env.local');
    return NextResponse.json(
      {error: 'Server configuration error: Missing credentials.'},
      {status: 500}
    );
  }

  let browser;
  try {
    // Launch Puppeteer
    browser = await puppeteer.launch({
      headless: true, // Use `false` for debugging to see the browser UI
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    await page.setUserAgent(a);
    await page.setViewport({width: 1366, height: 768});

    // Login
    await page.goto(loginUrl, {waitUntil: 'networkidle2'});
    await page.type(usernameSelector, username);
    await page.type(passwordSelector, password);
    await page.click(loginButtonSelector);

    // Wait for navigation after login and go to the data page
    await page.waitForNavigation({waitUntil: 'networkidle2'});
    await page.goto(dataUrl, {waitUntil: 'networkidle2'});

    // --- DATA EXTRACTION ---
    // This is a placeholder. You'll need to implement the actual data extraction
    // logic based on the website's structure and the selectors you defined above.
    const modelSelectors = dataSelectors[model];

    // Example of extracting a single text value:
    const totalRevenue = await page.$eval(modelSelectors.totalRevenue, (el) =>
      el.textContent?.trim()
    );
    const pnl = await page.$eval(modelSelectors.pnl, (el) =>
      el.textContent?.trim()
    );

    // Example of extracting data from a table:
    const recentTrades = await page.$$eval(
      modelSelectors.recentTrades,
      (rows) =>
        rows.map((row) => {
          const cells = row.querySelectorAll('td');
          return {
            asset: cells[0]?.textContent?.trim(),
            type: cells[1]?.textContent?.trim(),
            status: cells[2]?.textContent?.trim(),
            profit: cells[3]?.textContent?.trim(),
          };
        })
    );
    // --- END DATA EXTRACTION ---

    // Return the scraped data
    return NextResponse.json({
      totalRevenue,
      pnl,
      recentTrades,
      // Add other scraped data here
      pnlPercentage: 'N/A', // Placeholder
      trades: 'N/A', // Placeholder
      winRate: 'N/A', // Placeholder
    });
  } catch (error) {
    console.error('Scraping failed:', error);
    return NextResponse.json(
      {error: 'Failed to scrape data.'},
      {status: 500}
    );
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
