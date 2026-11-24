// Manual database setup: npm run db:setup
// Creates the table if needed and inserts the starting records only when the table is empty.
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const pool = require("../db");

(async () => {
  try {
    await pool.query(fs.readFileSync(path.join(__dirname, "..", "schema.sql"), "utf8"));
    const { rows } = await pool.query("SELECT COUNT(*)::int AS n FROM records");
    if (rows[0].n === 0) {
      await pool.query(fs.readFileSync(path.join(__dirname, "..", "seed.sql"), "utf8"));
      console.log("Table ready. Inserted starting records.");
    } else {
      console.log(`Table ready. It already holds ${rows[0].n} records, so nothing was inserted.`);
    }
  } catch (error) {
    console.error("Database setup failed:", error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
})();
