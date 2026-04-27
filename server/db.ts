import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";
import { mirrorQuery, recordMirrorFailure } from './mirror';

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const WRITE_RE = /^\s*(INSERT|UPDATE|DELETE)\b/i;

const originalQuery = pool.query.bind(pool) as any;
(pool as any).query = function patchedQuery(...args: any[]) {
  let sqlText: string | undefined;
  let params: unknown[] | undefined;
  const first = args[0];
  if (typeof first === 'string') {
    sqlText = first;
    params = args[1];
  } else if (first && typeof first === 'object' && typeof first.text === 'string') {
    sqlText = first.text;
    params = first.values;
  }

  const isWrite = sqlText ? WRITE_RE.test(sqlText) : false;
  const result = originalQuery(...args);

  if (isWrite && sqlText) {
    const sqlForMirror = sqlText;
    const paramsForMirror = params ?? [];
    Promise.resolve(result)
      .then(() => mirrorQuery(sqlForMirror, paramsForMirror))
      .catch((err) => recordMirrorFailure(sqlForMirror, paramsForMirror, err));
  }

  return result;
};

export const db = drizzle({ client: pool, schema });
