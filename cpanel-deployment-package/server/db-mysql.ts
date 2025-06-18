import mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
import * as schema from "@shared/schema-mysql";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Create MySQL connection
export const connection = mysql.createConnection(process.env.DATABASE_URL);
export const db = drizzle(connection, { schema, mode: 'default' });