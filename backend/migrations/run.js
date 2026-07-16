// One-off runner for migrations/*.sql — reuses the same DB connection config
// already in .env (config/db.js), so no separate DB credentials/CLI access
// needed. Safe to re-run: skips columns/indexes that already exist.
//
// Usage (from backend/):
//   node migrations/run.js 001_add_product_slug.sql

const fs = require("fs");
const path = require("path");
const sequelize = require("../config/db");

async function main() {
  const file = process.argv[2];
  if (!file) {
    console.error("Usage: node migrations/run.js <filename.sql>");
    process.exit(1);
  }

  const filePath = path.join(__dirname, file);
  const sql = fs.readFileSync(filePath, "utf8");

  // Strip comments, split into individual statements.
  const statements = sql
    .split("\n")
    .filter((line) => !line.trim().startsWith("--"))
    .join("\n")
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);

  await sequelize.authenticate();
  console.log(`Connected. Running ${statements.length} statement(s) from ${file}...`);

  for (const stmt of statements) {
    try {
      await sequelize.query(stmt);
      console.log("OK:", stmt.slice(0, 80));
    } catch (err) {
      if (/duplicate column|duplicate key name/i.test(err.message)) {
        console.log("SKIP (already applied):", stmt.slice(0, 80));
      } else {
        throw err;
      }
    }
  }

  console.log("Migration complete.");
  await sequelize.close();
}

main().catch((err) => {
  console.error("Migration failed:", err.message);
  process.exit(1);
});
