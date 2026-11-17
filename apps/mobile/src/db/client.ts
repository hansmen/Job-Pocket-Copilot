import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';
import * as schema from './schema';

const sqlite = openDatabaseSync('jobcopilot.db', { enableChangeListener: true });

export const db = drizzle(sqlite, { schema });
export type Db = typeof db;
