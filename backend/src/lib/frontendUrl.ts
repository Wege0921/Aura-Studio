const PROD_FRONTEND_URL = 'https://aurastudio.et';

// First value of FRONTEND_URL (it may be a comma-separated CORS list), trimmed.
// Falls back to the production site when running in production so emails and
// redirects never point at localhost on a deployed server.
export function getFrontendUrl(): string {
  const configured = process.env.FRONTEND_URL?.split(',')[0]?.trim()?.replace(/\/$/, '');
  if (configured) return configured;
  return process.env.NODE_ENV === 'production' ? PROD_FRONTEND_URL : 'http://localhost:3000';
}