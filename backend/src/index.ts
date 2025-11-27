import app from './app';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load default `.env` first (safe for local development)
dotenv.config();
// If we are explicitly running in production, and a `.env.production` file exists,
// load it to override values. This prevents accidental production DB usage during dev.
try {
  if (process.env.NODE_ENV === 'production') {
    const prodPath = path.resolve(process.cwd(), '.env.production');
    if (fs.existsSync(prodPath)) {
      dotenv.config({ path: prodPath });
      // eslint-disable-next-line no-console
      console.log('[startup] Overrode env with .env.production');
    }
  } else {
    // eslint-disable-next-line no-console
    console.log('[startup] Loaded env from default .env');
  }
} catch (e) {
  // eslint-disable-next-line no-console
  console.warn('[startup] error while loading env files, proceeding with defaults');
}

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`NutriMap backend listening on http://localhost:${port}`);
  // Debug: show whether a DATABASE_URL is configured (helpful in dev when multiple DBs exist)
  try {
    const dbUrl = process.env.DATABASE_URL || '';
    if (dbUrl) {
      // try to print a short fingerprint instead of the full URL
      const match = dbUrl.match(/@([^/]+)\/(.+)$/);
      if (match) {
        // host and database
        console.log('[startup] DATABASE target:', match[1], '/', match[2]);
      } else {
        console.log('[startup] DATABASE_URL present');
      }
    } else {
      console.log('[startup] DATABASE_URL not set');
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('[startup] failed to parse DATABASE_URL');
  }
});
