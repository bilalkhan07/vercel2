import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema.js';

const { Pool } = pg;

let dbClient: ReturnType<typeof drizzle> | null = null;

export function getDb() {
  if (!dbClient) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      console.warn('[Cloud SQL] DATABASE_URL missing');
    }
    const pool = new Pool({
      connectionString: connectionString || 'postgresql://postgres:postgres@localhost:5432/postgres',
    });
    dbClient = drizzle(pool, { schema });
  }
  return dbClient;
}

export const db = getDb();
export { schema };
