import dotenv from 'dotenv';
import { randomBytes } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

export const backendDirectory = fileURLToPath(new URL('../../', import.meta.url));
export const runtimeDirectory = path.join(backendDirectory, '.runtime');
dotenv.config({ path: path.join(backendDirectory, '.env') });

export function privateFile(name, create) {
  mkdirSync(runtimeDirectory, { recursive: true, mode: 0o700 });
  const filename = path.join(runtimeDirectory, name);
  try { writeFileSync(filename, create(), { flag: 'wx', mode: 0o600 }); }
  catch (error) { if (error.code !== 'EEXIST') throw error; }
  return readFileSync(filename, 'utf8');
}

export function getConfig() {
  const mongodbUrl = process.env.MONGODB_URL?.trim();
  if (!mongodbUrl || !/^mongodb(\+srv)?:\/\//.test(mongodbUrl)) {
    throw new Error('Add your MongoDB connection URL to MONGODB_URL in Backend/.env.');
  }
  const production = process.env.NODE_ENV === 'production';
  // Render generates this secret through render.yaml; its filesystem is disposable.
  if (production && (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)) {
    throw new Error('Production requires the generated JWT_SECRET environment variable.');
  }
  const jwtSecret = production ? process.env.JWT_SECRET : privateFile('session-secret', () => randomBytes(48).toString('base64url'));
  const port = Number(process.env.PORT || 5000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid server port.');
  return { mongodbUrl, jwtSecret, port, production };
}
