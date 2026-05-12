import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL ||
    `postgresql://${process.env.DB_USER || "postgres"}:${process.env.DB_PASSWORD || "postgres"}@${process.env.DB_HOST || "localhost"}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME || "interview"}`,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

// Run migrations on first connection
pool.on("connect", () => {
  import("./migrate").then(({ runMigrations }) => runMigrations()).catch(console.error);
});

export default pool;
