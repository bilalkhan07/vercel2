import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema.js';

const { Pool } = pg;

let dbClient: ReturnType<typeof drizzle> | null = null;

export function getDb() {
  if (!dbClient) {
    const poolConfig = process.env.DATABASE_URL
      ? { connectionString: process.env.DATABASE_URL }
      : process.env.SQL_HOST
      ? {
          host: process.env.SQL_HOST,
          user: process.env.SQL_USER,
          password: process.env.SQL_PASSWORD,
          database: process.env.SQL_DB_NAME,
        }
      : {
          connectionString: 'postgresql://postgres:postgres@localhost:5432/postgres',
        };
    const pool = new Pool(poolConfig);
    dbClient = drizzle(pool, { schema });
  }
  return dbClient;
}

export const db = getDb();
export { schema };
