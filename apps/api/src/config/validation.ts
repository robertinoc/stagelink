import * as Joi from 'joi';

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(4001),
  APP_URL: Joi.string().default('http://localhost:4001'),
  FRONTEND_URL: Joi.string().default('http://localhost:4000'),

  // Required in production, optional in development
  DATABASE_URL: Joi.when('NODE_ENV', {
    is: 'production',
    then: Joi.string().required(),
    otherwise: Joi.string().optional(),
  }),

  // Auth — required when auth is implemented
  WORKOS_CLIENT_ID: Joi.string().optional(),
  WORKOS_API_KEY: Joi.string().optional(),
  WORKOS_REDIRECT_URI: Joi.string().optional(),

  // Payments — required when billing is implemented
  STRIPE_SECRET_KEY: Joi.string().optional(),
  STRIPE_WEBHOOK_SECRET: Joi.string().optional(),

  // Analytics
  POSTHOG_KEY: Joi.string().optional(),
  POSTHOG_HOST: Joi.string().default('https://app.posthog.com'),

  // Storage
  AWS_S3_BUCKET: Joi.string().optional(),
  AWS_S3_REGION: Joi.string().optional(),
  AWS_ACCESS_KEY_ID: Joi.string().optional(),
  AWS_SECRET_ACCESS_KEY: Joi.string().optional(),

  // E-commerce (Plan Pro)
  SHOPIFY_STOREFRONT_TOKEN: Joi.string().optional(),
  SHOPIFY_STORE_DOMAIN: Joi.string().optional(),
});
