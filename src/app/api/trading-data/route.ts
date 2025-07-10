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

  // These selectors are derived from the HTML provided.
  const dataSelectors = {
    chatgpt: {
      summaryTable: '.p-datatable-tbody', // Selector for the summary table body
      tradesTable: '.p-datatable-scrollable-table .p-datatable-tbody', // Selector for the trades table body
    },
    gemini: {
       // Assuming Gemini selectors are the same. If not, they need to be updated.
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
    console.error('Missing SCRAPE_USERNAME or SCRAPE_PASSWORD in .env.local');
    return NextResponse.json(
      {error: 'Server configuration error: Missing credentials.'},
      {status: 500}
    );
  }

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    await page.setUserAgent(a);
    await page.setViewport({width: 1366, height: 768});

    // Login
    await page.goto(loginUrl, {waitUntil: 'networkidle2'});
    await page.type(usernameSelector, username);
    await page.type(passwordSelector, password);
    
    // Click the login button and wait for the dashboard to appear
    await page.click(loginButtonSelector);
    
    // This is a crucial step: wait for a specific element that appears only when data is loaded.
    // This confirms a successful login and that the page is ready.
    await page.waitForSelector('.p-datatable-tbody', { timeout: 15000 });


    // --- DATA EXTRACTION ---
    const modelSelectors = dataSelectors[model as 'chatgpt' | 'gemini'];
    
    // Extract from the summary table
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


        return { totalRevenue, pnl, trades: `${totalTrades}`, winRate, pnlPercentage: 'N/A' }; // pnlPercentage not available
    });

    // Extract from the recent trades table
    const recentTrades = await page.$$eval(
      `${modelSelectors.tradesTable} > tr`, // Select all rows in the trades table body
      (rows) =>
        rows.map((row) => {
          const cells = row.querySelectorAll('td');
          const profitEl = cells[7]?.querySelector('div.grow');
          const profitText = profitEl?.textContent?.trim() ?? 'Pending';
          const isProfit = profitEl?.classList.contains('profit-pill-profit');
          
          return {
            asset: cells[2]?.textContent?.trim() || 'N/A',
            type: (cells[1]?.textContent?.trim() || 'N/A').includes('Long') ? 'BUY' : 'SELL',
            status: 'Closed', // Status is not available in the trades table, assuming 'Closed'
            profit: profitText.includes('%') 
                ? `${isProfit ? '+' : '-'}${profitText}`
                : profitText,
          };
        }).slice(0, 5) // Limit to 5 trades for the display
    );
    // --- END DATA EXTRACTION ---

    return NextResponse.json({
      ...summaryData,
      recentTrades,
    });
  } catch (error) {
    console.error('Scraping failed:', error);
    // This part of the message is helpful for debugging in your server logs.
    // You can check your terminal for the full error message.
    if (error instanceof Error && error.name === 'TimeoutError') {
       console.error('TimeoutError: The page timed out after login. This could mean the login failed, or the dashboard page is slow to load.');
    }
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
