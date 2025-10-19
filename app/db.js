import mysql from "mysql2";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve("app/.env") });

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  connectionLimit: 10,        // how many active connections to keep
  waitForConnections: true,   // wait instead of throwing an error
  queueLimit: 0,              // unlimited queue (requests will wait)
});

// ✅ Optional test (checks if DB is reachable)
db.getConnection((err, connection) => {
  if (err) {
    console.error("❌ Database connection failed:", err.message);
  } else {
    console.log("✅ Connection pool established.");
    connection.release(); // release connection back to pool
  }
});

export default db;
