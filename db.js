const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

const url = process.env.DATABASE_URL || "";
const isLocal = /localhost|127\.0\.0\.1/.test(url);

const pool = new Pool({
  connectionString: url,
  ssl: isLocal ? false : { rejectUnauthorized: false }
});

// Creates the table on first start and inserts the starting records once.
async function initDb() {
  const check = await pool.query("SELECT to_regclass('public.records') AS t");
  const existed = check.rows[0].t !== null;
  await pool.query(fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8"));
  if (!existed) {
    await pool.query(fs.readFileSync(path.join(__dirname, "seed.sql"), "utf8"));
    console.log("Created records table and inserted starting records.");
  }
}

module.exports = pool;
module.exports.initDb = initDb;
