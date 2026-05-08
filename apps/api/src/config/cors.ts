/**
 * Determine whether an incoming origin is allowed.
 *
 * Rules (in order):
 * 1. Exact match against FRONTEND_URL (production domain)
 * 2. Any extra origins listed in CORS_ALLOWED_ORIGINS (comma-separated)
 * 3. Vercel preview deployments for the StageLink project
 * 4. localhost / 127.0.0.1 in development only
 */
export function buildCorsOriginHandler(
  frontendUrl: string,
  extraOrigins: string[],
  nodeEnv: string,
): (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => void {
  const vercelPreviewPattern = /^https:\/\/stagelink[a-z0-9-]*\.vercel\.app$/;

  return (origin, callback) => {
    // Allow requests with no origin (server-to-server, curl, health checks)
    if (!origin) return callback(null, true);

    // Exact match: production frontend URL
    if (origin === frontendUrl) return callback(null, true);

    // Extra allowed origins (e.g. app.stagelink.io, staging.stagelink.io)
    if (extraOrigins.includes(origin)) return callback(null, true);

    // Vercel preview deployments (e.g. stagelink-git-feat-xyz.vercel.app)
    if (vercelPreviewPattern.test(origin)) return callback(null, true);

    // localhost in development
    if (nodeEnv === 'development') {
      if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
        return callback(null, true);
      }
    }

    callback(new Error(`CORS: origin '${origin}' not allowed`));
  };
}

export const CORS_ALLOWED_HEADERS = [
  'Content-Type',
  'Authorization',
  'Accept',
  'X-Request-ID',
  'X-SL-AC',
  'X-SL-QA',
] as const;
