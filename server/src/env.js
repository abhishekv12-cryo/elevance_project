// Loads server/.env if present, otherwise falls back to server/.env.example (demo defaults) -> zero setup.
import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const serverRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const custom = path.join(serverRoot, '.env');
dotenv.config({ path: fs.existsSync(custom) ? custom : path.join(serverRoot, '.env.example') });
