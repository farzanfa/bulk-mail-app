export function getBaseUrl(reqUrl?: string): string {
  if (process.env.NEXTAUTH_URL) return process.env.NEXTAUTH_URL;
  try {
    if (reqUrl) return new URL(reqUrl).origin;
  } catch {}
  return 'http://localhost:3000';
}


