const express = require('express');
const cors = require('cors');
const sqlite = require('sqlite');
const sqlite3 = require('sqlite3');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

let db = null;
const dbPath = path.join(__dirname, 'database.db');

const initializeDBAndServer = async () => {
  try {
    db = await sqlite.open({ filename: dbPath, driver: sqlite3.Database });
    app.listen(3000, () => {
      console.log('Server started at http://localhost:3000/');
    });
  } catch (error) {
    console.error(`Error initializing database: ${error.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

// API to list all transactions with search and pagination
app.get('/transactions', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const perPage = parseInt(req.query.perPage) || 10;
    const search = req.query.search ? req.query.search.toLowerCase() : '';
    const selectedMonth = req.query.month ? req.query.month.toLowerCase() : 'march';

    const monthMap = {
      'january': '01',
      'february': '02',
      'march': '03',
      'april': '04',
      'may': '05',
      'june': '06',
      'july': '07',
      'august': '08',
      'september': '09',
      'october': '10',
      'november': '11',
      'december': '12',
    };

    const numericMonth = monthMap[selectedMonth];

    const sqlQuery = `
      SELECT *
      FROM products
      WHERE
        strftime('%m', dateOfSale) = ?
        AND (
          lower(title) LIKE '%${search}%'
          OR lower(description) LIKE '%${search}%'
          OR CAST(price AS TEXT) LIKE '%${search}%'
        )
      LIMIT ${perPage} OFFSET ${(page - 1) * perPage};
    `;

    const rows = await db.all(sqlQuery, [numericMonth]);

    res.json({ page, perPage, transactions: rows });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// API for statistics
app.get('/statistics', async (req, res) => {
  try {
    const selectedMonth = req.query.month ? req.query.month.toLowerCase() : 'march';

    const monthMap = {
      'january': '01',
      'february': '02',
      'march': '03',
      'april': '04',
      'may': '05',
      'june': '06',
      'july': '07',
      'august': '08',
      'september': '09',
      'october': '10',
      'november': '11',
      'december': '12',
    };

    const numericMonth = monthMap[selectedMonth];

    const sqlQuery = `
      SELECT
        SUM(CASE WHEN sold = 1 THEN price ELSE 0 END) AS totalSaleAmount,
        COUNT(CASE WHEN sold = 1 THEN 1 END) AS totalSoldItems,
        COUNT(CASE WHEN sold = 0 THEN 1 END) AS totalNotSoldItems
      FROM products
      WHERE strftime('%m', dateOfSale) = ?;
    `;

    const statistics = await db.get(sqlQuery, [numericMonth]);

    res.json({
      selectedMonth,
      totalSaleAmount: Math.floor(statistics.totalSaleAmount) || 0,
      totalSoldItems: statistics.totalSoldItems || 0,
      totalNotSoldItems: statistics.totalNotSoldItems || 0,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// API for bar chart
app.get('/bar-chart', async (req, res) => {
  try {
    const selectedMonth = req.query.month ? req.query.month.toLowerCase() : 'march';

    const monthMap = {
      'january': '01',
      'february': '02',
      'march': '03',
      'april': '04',
      'may': '05',
      'june': '06',
      'july': '07',
      'august': '08',
      'september': '09',
      'october': '10',
      'november': '11',
      'december': '12',
    };

    const numericMonth = monthMap[selectedMonth];

    const sqlQuery = `
      SELECT
        CASE
          WHEN price BETWEEN 0 AND 100 THEN '0 - 100'
          WHEN price BETWEEN 101 AND 200 THEN '101 - 200'
          WHEN price BETWEEN 201 AND 300 THEN '201 - 300'
          WHEN price BETWEEN 301 AND 400 THEN '301 - 400'
          WHEN price BETWEEN 401 AND 500 THEN '401 - 500'
          WHEN price BETWEEN 501 AND 600 THEN '501 - 600'
          WHEN price BETWEEN 601 AND 700 THEN '601 - 700'
          WHEN price BETWEEN 701 AND 800 THEN '701 - 800'
          WHEN price BETWEEN 801 AND 900 THEN '801 - 900'
          WHEN price >= 901 THEN '901-above'
        END AS priceRange,
        COUNT(*) AS itemCount
      FROM products
      WHERE strftime('%m', dateOfSale) = ?
      GROUP BY priceRange
      ORDER BY itemCount DESC;
    `;

    const rows = await db.all(sqlQuery, [numericMonth]);

    res.json({ selectedMonth, barChartData: rows });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// API for pie chart
app.get('/pie-chart', async (req, res) => {
  try {
    const selectedMonth = req.query.month ? req.query.month.toLowerCase() : 'march';

    const monthMap = {
      'january': '01',
      'february': '02',
      'march': '03',
      'april': '04',
      'may': '05',
      'june': '06',
      'july': '07',
      'august': '08',
      'september': '09',
      'october': '10',
      'november': '11',
      'december': '12',
    };

    const numericMonth = monthMap[selectedMonth];

    const sqlQuery = `
      SELECT
        category,
        COUNT(*) AS itemCount
      FROM products
      WHERE strftime('%m', dateOfSale) = ?
      GROUP BY category
      ORDER BY itemCount DESC;
    `;

    const rows = await db.all(sqlQuery, [numericMonth]);

    res.json({ selectedMonth, pieChartData: rows });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = app;
