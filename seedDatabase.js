const sqlite3 = require('sqlite3').verbose();
const axios = require('axios');

// URL of the JSON data
const url = 'https://s3.amazonaws.com/roxiler.com/product_transaction.json';

// Fetch JSON data from the URL
axios.get(url)
  .then(response => {
    const jsonData = response.data;

    // Connect to the SQLite database
    const db = new sqlite3.Database('database.db', (err) => {
      if (err) {
        console.error('Error opening database:', err.message);
        return;
      }
      console.log('Connected to the SQLite database.');
    });

    // Create the products table if it doesn't exist
    db.serialize(() => {
      db.run(`
        CREATE TABLE IF NOT EXISTS products (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT,
          price REAL,
          description TEXT,
          category TEXT,
          image TEXT,
          sold INTEGER,
          dateOfSale TEXT
        )
      `, (err) => {
        if (err) {
          console.error('Error creating table:', err.message);
          return;
        }

        // Insert the data into the SQLite database
        const insertStatement = db.prepare(
          'INSERT INTO products (title, price, description, category, image, sold, dateOfSale) VALUES (?, ?, ?, ?, ?, ?, ?)'
        );

        jsonData.forEach((product) => {
          insertStatement.run(
            product.title,
            product.price,
            product.description,
            product.category,
            product.image,
            product.sold,
            product.dateOfSale,
            (err) => {
              if (err) {
                console.error('Error inserting data:', err.message);
              }
            }
          );
        });

        // Finalize the statement to close it
        insertStatement.finalize((err) => {
          if (err) {
            console.error('Error finalizing statement:', err.message);
          } else {
            console.log('Database initialized with seed data.');
          }

          // Close the database connection
          db.close((err) => {
            if (err) {
              console.error('Error closing database:', err.message);
            } else {
              console.log('Database connection closed.');
            }
          });
        });
      });
    });
  })
  .catch(error => {
    console.error('Error fetching data from the URL:', error.message);
    // Handle the error as needed
  });
