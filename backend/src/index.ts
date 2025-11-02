import app from './app';
import dotenv from 'dotenv';
dotenv.config();

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
