const sql = require("mssql");

const config = {
  server: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 1433),
  user: process.env.DB_USER || "sa",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "CIPS_CertPortal",
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
};

let pool = null;

async function getPool() {
  if (pool) return pool;
  pool = await sql.connect(config);
  return pool;
}

module.exports = { sql, getPool };