import * as Joi from 'joi';

// Shorthand: optional string that also accepts empty string ('' in .env files)
const optionalString = Joi.string().optional().allow('');

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(4001),
  APP_URL: Joi.string().default('http://localhost:4001'),
  FRONTEND_URL: Joi.string().default('http://localhost:4000'),
  // Optional extra origins for CORS (comma-separated)
  CORS_ALLOWED_ORIGINS: optionalString,

  // Required in production, optional in development
  DATABASE_URL: Joi.when('NODE_ENV', {
    is: 'production',
    then: Joi.string().required(),
    otherwise: optionalString,
  }),
  // Prisma directUrl — required for migrations when DATABASE_URL routes through
  // a connection pooler (e.g. Supabase PgBouncer). Without this, prisma migrate
  // deploy fails silently at startup in production.
  DIRECT_URL: Joi.when('NODE_ENV', {
    is: 'production',
    then: Joi.string().required(),
    otherwise: optionalString,
  }),

  // Auth — required in production, optional in development
  WORKOS_CLIENT_ID: Joi.when('NODE_ENV', {
    is: 'production',
    then: Joi.string().required(),
    otherwise: optionalString,
  }),
  WORKOS_API_KEY: Joi.when('NODE_ENV', {
    is: 'production',
    then: Joi.string().required(),
    otherwise: optionalString,
  }),

  // Payments — required in production (Stripe integration is live)
  STRIPE_SECRET_KEY: Joi.when('NODE_ENV', {
    is: 'production',
    then: Joi.string().required(),
    otherwise: optionalString,
  }),
  STRIPE_WEBHOOK_SECRET: Joi.when('NODE_ENV', {
    is: 'production',
    then: Joi.string().required(),
    otherwise: optionalString,
  }),
  STRIPE_PRICE_PRO_ID: Joi.when('NODE_ENV', {
    is: 'production',
    then: Joi.string().required(),
    otherwise: optionalString,
  }),
  STRIPE_PRICE_PRO_PLUS_ID: Joi.when('NODE_ENV', {
    is: 'production',
    then: Joi.string().required(),
    otherwise: optionalString,
  }),

  // Analytics — optional in all envs
  POSTHOG_KEY: optionalString,
  POSTHOG_HOST: Joi.string().default('https://app.posthog.com'),

  // Storage — required in production
  AWS_S3_BUCKET: Joi.when('NODE_ENV', {
    is: 'production',
    then: Joi.string().required(),
    otherwise: optionalString,
  }),
  AWS_S3_REGION: Joi.when('NODE_ENV', {
    is: 'production',
    then: Joi.string().required(),
    otherwise: optionalString,
  }),
  AWS_ACCESS_KEY_ID: Joi.when('NODE_ENV', {
    is: 'production',
    then: Joi.string().required(),
    otherwise: optionalString,
  }),
  AWS_SECRET_ACCESS_KEY: Joi.when('NODE_ENV', {
    is: 'production',
    then: Joi.string().required(),
    otherwise: optionalString,
  }),
  // Optional: MinIO endpoint for local dev / non-AWS S3-compatible providers
  AWS_S3_ENDPOINT: optionalString,
  // Public base URL for delivery (e.g. https://assets.stagelink.io or https://<bucket>.s3.<region>.amazonaws.com)
  AWS_S3_PUBLIC_BASE_URL: Joi.when('NODE_ENV', {
    is: 'production',
    then: Joi.string().uri().required(),
    otherwise: optionalString,
  }),

  // Secrets encryption — required in production for provider/store tokens
  SECRETS_ENCRYPTION_KEY: Joi.when('NODE_ENV', {
    is: 'production',
    then: Joi.string().min(32).required(),
    otherwise: optionalString,
  }),

  // E-commerce — Plan Pro only (T6)
  SHOPIFY_STOREFRONT_TOKEN: optionalString,
  SHOPIFY_STORE_DOMAIN: optionalString,

  // StageLink Insights — optional, each key enables a specific platform provider
  SPOTIFY_CLIENT_ID: optionalString,
  SPOTIFY_CLIENT_SECRET: optionalString,
  SPOTIFY_TOP_TRACKS_MARKET: Joi.string().default('US'),
  YOUTUBE_DATA_API_KEY: optionalString,
  SOUNDCLOUD_CLIENT_ID: optionalString,
});
