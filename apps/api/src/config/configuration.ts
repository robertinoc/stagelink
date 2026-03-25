export default (): Record<string, unknown> => ({
  app: {
    nodeEnv: process.env.NODE_ENV ?? 'development',
    port: parseInt(process.env.PORT ?? '4001', 10),
    url: process.env.APP_URL ?? 'http://localhost:4001',
    frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:4000',
  },
  database: {
    url: process.env.DATABASE_URL,
  },
  workos: {
    clientId: process.env.WORKOS_CLIENT_ID,
    apiKey: process.env.WORKOS_API_KEY,
    redirectUri: process.env.WORKOS_REDIRECT_URI,
  },
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
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
  },
  shopify: {
    storefrontToken: process.env.SHOPIFY_STOREFRONT_TOKEN,
    storeDomain: process.env.SHOPIFY_STORE_DOMAIN,
  },
});
