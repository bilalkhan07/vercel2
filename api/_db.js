import pg from 'pg';

const { Pool } = pg;
let pool = null;

export function getPgPool() {
  if (!pool) {
    const config = process.env.DATABASE_URL
      ? { connectionString: process.env.DATABASE_URL }
      : process.env.SQL_HOST
      ? {
          host: process.env.SQL_HOST,
          user: process.env.SQL_USER,
          password: process.env.SQL_PASSWORD,
          database: process.env.SQL_DB_NAME,
        }
      : {
          connectionString: 'postgresql://postgres:postgres@localhost:5432/postgres'
        };
    pool = new Pool(config);
  }
  return pool;
}

export default getPgPool;
