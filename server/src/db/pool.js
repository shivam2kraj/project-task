import mysql from 'mysql2/promise';

const requiredEnvVars = ['DB_HOST', 'DB_USER', 'DB_NAME', 'JWT_SECRET'];

requiredEnvVars.forEach((key) => {
  if (!process.env[key]) {
    console.warn(`Environment variable ${key} is not set. Make sure to configure it before starting the server.`);
  }
});

const pool = mysql.createPool({
  host: process.env.DB_HOST ?? 'localhost',
  user: process.env.DB_USER ?? 'root',
  password: process.env.DB_PASS ?? '',
  database: process.env.DB_NAME ?? 'task_manager',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export default pool;

