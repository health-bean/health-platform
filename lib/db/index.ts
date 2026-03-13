import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL!;

const client = postgres(connectionString, {
  max: 10,
  // Supabase connection pooler (port 6543) requires this
  prepare: false,
});

export const db = drizzle(client, { schema });
