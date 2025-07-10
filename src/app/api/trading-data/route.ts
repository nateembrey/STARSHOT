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

  // --- CONFIGURATION ---
  const loginUrl = 'http://35.228.171.101:8071/'; // Login page
  
  // --- SELECTORS ---
  const usernameSelector = '#username-input';
  const passwordSelector = '#password-input';
  const loginButtonSelector = 'button[type="submit"]';

  const dataSelectors = {
    chatgpt: {
      summaryTable: '.p-datatable-tbody',
      tradesTable: '.p-datatable-scrollable-table .p-datatable-tbody',
    },
    gemini: {
      summaryTable: '.p-datatable-tbody',
      tradesTable: '.p-datatable-scrollable-table .p-datatable-tbody',
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
    console.error('SCRAPER_ERROR: Missing SCRAPE_USERNAME or SCRAPE_PASSWORD in .env.local');
    return NextResponse.json(
      {error: 'Server configuration error: Missing credentials.'},
      {status: 500}
    );
  }

  let browser;
  try {
    console.log('SCRAPER_LOG: STEP 1 - Launching browser...');
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    console.log('SCRAPER_LOG: STEP 2 - Browser launched successfully.');
    
    const page = await browser.newPage();
    console.log('SCRAPER_LOG: STEP 3 - New page created.');
    
    await page.setUserAgent(a);
    await page.setViewport({width: 1366, height: 768});
    console.log('SCRAPER_LOG: STEP 4 - Page configured.');

    // Login
    console.log(`SCRAPER_LOG: STEP 5 - Navigating to login page: ${loginUrl}`);
    await page.goto(loginUrl, {waitUntil: 'networkidle2'});
    
    console.log('SCRAPER_LOG: STEP 6 - Typing username and password...');
    await page.type(usernameSelector, username);
    await page.type(passwordSelector, password);
    
    console.log(`SCRAPER_LOG: STEP 7 - Clicking login button: ${loginButtonSelector}`);
    await page.click(loginButtonSelector);
    
    console.log('SCRAPER_LOG: STEP 8 - Waiting for dashboard to load...');
    // This is a crucial step: wait for a specific element that appears only when data is loaded.
    await page.waitForSelector('.p-datatable-tbody', { timeout: 20000 });
    console.log('SCRAPER_LOG: STEP 9 - Dashboard loaded successfully. Starting data extraction.');


    // --- DATA EXTRACTION ---
    const modelSelectors = dataSelectors[model as 'chatgpt' | 'gemini'];
    
    const summaryData = await page.$eval(modelSelectors.summaryTable, (tbody) => {
        const botRow = tbody.querySelector('tr:nth-child(1)');
        const summaryRow = tbody.querySelector('tr:nth-child(2)');

        const closedProfitEl = summaryRow?.querySelector('td:nth-child(4) > div > div.grow');
        const pnlText = closedProfitEl?.textContent?.trim().split(' ')[0] ?? 'N/A';
        const pnl = `+${pnlText}`;

        const balanceEl = botRow?.querySelector('td:nth-child(5) > div > span:first-child');
        const balanceValue = parseFloat(balanceEl?.textContent?.trim().replace(/,/g, '') ?? '0');
        const totalRevenue = `$${balanceValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

        const winLossEl = summaryRow?.querySelector('td:nth-child(6)');
        const wins = parseInt(winLossEl?.querySelector('.text-profit')?.textContent?.trim() ?? '0', 10);
        const losses = parseInt(winLossEl?.querySelector('.text-loss')?.textContent?.trim() ?? '0', 10);
        const totalTrades = wins + losses;
        const winRate = totalTrades > 0 ? `${((wins / totalTrades) * 100).toFixed(1)}%` : '0%';


        return { totalRevenue, pnl, trades: `${totalTrades}`, winRate, pnlPercentage: 'N/A' };
    });

    const recentTrades = await page.$$eval(
      `${modelSelectors.tradesTable} > tr`,
      (rows) =>
        rows.map((row) => {
          const cells = row.querySelectorAll('td');
          const profitEl = cells[7]?.querySelector('div.grow');
          const profitText = profitEl?.textContent?.trim() ?? 'Pending';
          const isProfit = profitEl?.classList.contains('profit-pill-profit');
          
          return {
            asset: cells[2]?.textContent?.trim() || 'N/A',
            type: (cells[1]?.textContent?.trim() || 'N/A').includes('Long') ? 'BUY' : 'SELL',
            status: 'Closed',
            profit: profitText.includes('%') 
                ? `${isProfit ? '+' : '-'}${profitText}`
                : profitText,
          };
        }).slice(0, 5)
    );
    console.log('SCRAPER_LOG: STEP 10 - Data extraction complete.');
    // --- END DATA EXTRACTION ---

    return NextResponse.json({
      ...summaryData,
      recentTrades,
    });
  } catch (error: any) {
    console.error('SCRAPER_ERROR: An error occurred during scraping.');
    // This part of the message is helpful for debugging in your server logs.
    if (error.name === 'TimeoutError') {
       console.error('SCRAPER_ERROR_DETAIL: TimeoutError - The page timed out waiting for the selector ".p-datatable-tbody". This could mean the login failed, the page is slow, or the selector is wrong.');
    } else {
       console.error('SCRAPER_ERROR_DETAIL:', error);
    }
    
    // Attempt to take screenshot for debugging, even on error
    if (browser) {
        try {
            const page = (await browser.pages())[0];
            if (page) {
                console.log('SCRAPER_LOG: Taking a debug screenshot to debug-screenshot.png');
                await page.screenshot({ path: 'debug-screenshot.png', fullPage: true });
                console.log('SCRAPER_LOG: Screenshot saved.');
            }
        } catch (screenshotError) {
            console.error('SCRAPER_ERROR: Could not take screenshot.', screenshotError);
        }
    }
    
    return NextResponse.json(
      {error: 'Failed to scrape data. Check server logs for details.'},
      {status: 500}
    );
  } finally {
    if (browser) {
      console.log('SCRAPER_LOG: Closing browser.');
      await browser.close();
    }
  }
}
