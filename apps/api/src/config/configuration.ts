export default (): Record<string, unknown> => ({
  app: {
    nodeEnv: process.env.NODE_ENV ?? 'development',
    port: parseInt(process.env.PORT ?? '4001', 10),
    url: process.env.APP_URL ?? 'http://localhost:4001',
    frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:4000',
    // Optional comma-separated extra CORS origins (e.g. app.stagelink.io,staging.stagelink.io)
    corsAllowedOrigins: process.env.CORS_ALLOWED_ORIGINS ?? '',
  },
  database: {
    url: process.env.DATABASE_URL,
  },
  workos: {
    clientId: process.env.WORKOS_CLIENT_ID,
    apiKey: process.env.WORKOS_API_KEY,
  },
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    proPriceId: process.env.STRIPE_PRICE_PRO_ID,
    proPlusPriceId: process.env.STRIPE_PRICE_PRO_PLUS_ID,
  },
  posthog: {
    key: process.env.POSTHOG_KEY,
    host: process.env.POSTHOG_HOST ?? 'https://app.posthog.com',
  },
  s3: {
    bucket: process.env.AWS_S3_BUCKET,
    region: process.env.AWS_S3_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    endpoint: process.env.AWS_S3_ENDPOINT,
    publicBaseUrl: process.env.AWS_S3_PUBLIC_BASE_URL,
  },
  secrets: {
    encryptionKey: process.env.SECRETS_ENCRYPTION_KEY,
  },
  shopify: {
    storefrontToken: process.env.SHOPIFY_STOREFRONT_TOKEN,
    storeDomain: process.env.SHOPIFY_STORE_DOMAIN,
  },
});
