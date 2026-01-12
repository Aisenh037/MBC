import dotenv from 'dotenv';
import Joi from 'joi';
import path from 'path';

const envFile = `.env.${process.env.NODE_ENV || 'development'}`;
// Look for .env file in the backend directory (from dist/config/ we need to go up two levels to mbc-backend/)
const envPath = path.resolve(__dirname, '..', '..', envFile);
dotenv.config({ path: envPath });

interface EnvVars {
  NODE_ENV: 'development' | 'production' | 'test';
  PORT: number;
  MONGO_URI: string;
  JWT_SECRET: string;
  JWT_EXPIRE: string;
  JWT_REFRESH_SECRET: string;
  JWT_REFRESH_EXPIRE: string;
  JWT_COOKIE_EXPIRE: number;
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_KEY: string;
  DATABASE_URL: string;
  DIRECT_URL?: string;
  CORS_ORIGINS?: string;
  CORS_ORIGIN?: string;
  EMAIL_HOST?: string;
  EMAIL_PORT?: number;
  EMAIL_USER?: string;
  EMAIL_PASS?: string;
  FROM_EMAIL?: string;
  FROM_NAME?: string;
  FRONTEND_URL: string;
  CLOUDINARY_CLOUD_NAME?: string;
  CLOUDINARY_API_KEY?: string;
  CLOUDINARY_API_SECRET?: string;
  REDIS_HOST?: string;
  REDIS_PORT?: number;
  REDIS_PASSWORD?: string;
  REDIS_DB?: number;
  // Notification Services
  RESEND_API_KEY?: string;
  RESEND_FROM_EMAIL?: string;
  TWILIO_ACCOUNT_SID?: string;
  TWILIO_AUTH_TOKEN?: string;
  TWILIO_PHONE_NUMBER?: string;
  TWILIO_WHATSAPP_NUMBER?: string;
}

const envVarsSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(5000),
  
  MONGO_URI: Joi.string().required().description('MongoDB connection URI is required'),
  JWT_SECRET: Joi.string().required().description('JWT secret is required'),
  JWT_EXPIRE: Joi.string().default('1d'),
  JWT_REFRESH_SECRET: Joi.string().default('default-refresh-secret-change-in-production').description('JWT refresh secret'),
  JWT_REFRESH_EXPIRE: Joi.string().default('7d'),
  JWT_COOKIE_EXPIRE: Joi.number().default(1),
  
  // Supabase Configuration
  SUPABASE_URL: Joi.string().uri().default('https://placeholder.supabase.co').description('Supabase project URL'),
  SUPABASE_ANON_KEY: Joi.string().default('placeholder-anon-key').description('Supabase anonymous key'),
  SUPABASE_SERVICE_KEY: Joi.string().default('placeholder-service-key').description('Supabase service role key'),
  DATABASE_URL: Joi.string().default('postgresql://localhost:5432/mbc_dev').description('PostgreSQL database URL'),
  DIRECT_URL: Joi.string().optional().description('Direct PostgreSQL database URL for migrations'),
  
  CORS_ORIGINS: Joi.string().default('http://localhost:5173'),
  CORS_ORIGIN: Joi.string(), // For backward compatibility
  
  // --- Email Service Configuration (Now Optional) ---
  EMAIL_HOST: Joi.string().allow('').optional().description('SMTP host for sending emails'),
  EMAIL_PORT: Joi.number().allow('').optional().description('SMTP port'),
  EMAIL_USER: Joi.string().allow('').optional().description('SMTP username'),
  EMAIL_PASS: Joi.string().allow('').optional().description('SMTP password'),
  FROM_EMAIL: Joi.string().email().allow('').optional().description('The "from" email address'),
  FROM_NAME: Joi.string().allow('').optional().description('The "from" name'),

  FRONTEND_URL: Joi.string().uri().required().description('Base URL of the frontend application'),
  
  // --- Cloudinary Configuration (Optional) ---
  CLOUDINARY_CLOUD_NAME: Joi.string().allow('').optional().description('Cloudinary cloud name'),
  CLOUDINARY_API_KEY: Joi.string().allow('').optional().description('Cloudinary API key'),
  CLOUDINARY_API_SECRET: Joi.string().allow('').optional().description('Cloudinary API secret'),
  
  // --- Redis Configuration (Optional) ---
  REDIS_HOST: Joi.string().allow('').optional().description('Redis host'),
  REDIS_PORT: Joi.number().allow('').optional().description('Redis port'),
  REDIS_PASSWORD: Joi.string().allow('').optional().description('Redis password'),
  REDIS_DB: Joi.number().allow('').optional().description('Redis database number'),
  
  // --- Notification Services Configuration (Optional) ---
  RESEND_API_KEY: Joi.string().allow('').optional().description('Resend API key for email notifications'),
  RESEND_FROM_EMAIL: Joi.string().email().allow('').optional().description('Resend from email address'),
  TWILIO_ACCOUNT_SID: Joi.string().allow('').optional().description('Twilio Account SID'),
  TWILIO_AUTH_TOKEN: Joi.string().allow('').optional().description('Twilio Auth Token'),
  TWILIO_PHONE_NUMBER: Joi.string().allow('').optional().description('Twilio phone number for SMS'),
  TWILIO_WHATSAPP_NUMBER: Joi.string().allow('').optional().description('Twilio WhatsApp number'),
}).unknown();

const { value: envVars, error } = envVarsSchema.prefs({ errors: { label: 'key' } }).validate(process.env);

if (error) {
  throw new Error(`[CONFIG ERROR] Environment variable validation failed: ${error.message}`);
}

const validatedEnvVars = envVars as EnvVars;

// Check if all required email variables are present to enable the email service
const isEmailServiceConfigured = Boolean(
  validatedEnvVars.EMAIL_HOST && 
  validatedEnvVars.EMAIL_PORT && 
  validatedEnvVars.EMAIL_USER && 
  validatedEnvVars.EMAIL_PASS &&
  validatedEnvVars.FROM_EMAIL &&
  validatedEnvVars.FROM_NAME
);

// Check if all required Cloudinary variables are present to enable the file storage service
const isCloudinaryConfigured = Boolean(
  validatedEnvVars.CLOUDINARY_CLOUD_NAME && 
  validatedEnvVars.CLOUDINARY_API_KEY && 
  validatedEnvVars.CLOUDINARY_API_SECRET
);

// Check if all required Redis variables are present to enable the caching service
const isRedisConfigured = Boolean(
  validatedEnvVars.REDIS_HOST && 
  validatedEnvVars.REDIS_PORT
);

// Check if Resend is configured for email notifications
const isResendConfigured = Boolean(
  validatedEnvVars.RESEND_API_KEY && 
  validatedEnvVars.RESEND_FROM_EMAIL
);

// Check if Twilio is configured for SMS/WhatsApp notifications
const isTwilioConfigured = Boolean(
  validatedEnvVars.TWILIO_ACCOUNT_SID && 
  validatedEnvVars.TWILIO_AUTH_TOKEN && 
  validatedEnvVars.TWILIO_PHONE_NUMBER
);

interface EmailConfig {
  host: string;
  port: number;
  auth: {
    user: string;
    pass: string;
  };
  from: string;
}

interface SupabaseConfig {
  url: string;
  anonKey: string;
  serviceKey: string;
}

interface CloudinaryConfig {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
}

interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
}

interface ResendConfig {
  apiKey: string;
  fromEmail: string;
}

interface TwilioConfig {
  accountSid: string;
  authToken: string;
  phoneNumber: string;
  whatsappNumber?: string;
}

interface Config {
  env: 'development' | 'production' | 'test';
  port: number;
  mongoose: {
    url: string;
  };
  database: {
    url: string;
  };
  jwt: {
    secret: string;
    expiresIn: string;
    refreshSecret: string;
    refreshExpiresIn: string;
    cookieExpire: number;
  };
  supabase: SupabaseConfig;
  cors: {
    origins: string[];
  };
  email: EmailConfig | null;
  cloudinary: CloudinaryConfig | null;
  redis: RedisConfig | null;
  resend: ResendConfig | null;
  twilio: TwilioConfig | null;
  frontend: {
    url: string;
  };
}

// Export a clean, validated, and typed configuration object
const config: Config = {
  env: validatedEnvVars.NODE_ENV,
  port: validatedEnvVars.PORT,
  mongoose: {
    url: validatedEnvVars.MONGO_URI,
  },
  database: {
    url: validatedEnvVars.DATABASE_URL,
  },
  jwt: {
    secret: validatedEnvVars.JWT_SECRET,
    expiresIn: validatedEnvVars.JWT_EXPIRE,
    refreshSecret: validatedEnvVars.JWT_REFRESH_SECRET,
    refreshExpiresIn: validatedEnvVars.JWT_REFRESH_EXPIRE,
    cookieExpire: validatedEnvVars.JWT_COOKIE_EXPIRE,
  },
  supabase: {
    url: validatedEnvVars.SUPABASE_URL,
    anonKey: validatedEnvVars.SUPABASE_ANON_KEY,
    serviceKey: validatedEnvVars.SUPABASE_SERVICE_KEY,
  },
  cors: {
    origins: (validatedEnvVars.CORS_ORIGINS || validatedEnvVars.CORS_ORIGIN || 'http://localhost:5173').split(','),
  },
  // Only include the email config if it's fully set up
  email: isEmailServiceConfigured ? {
    host: validatedEnvVars.EMAIL_HOST!,
    port: validatedEnvVars.EMAIL_PORT!,
    auth: {
      user: validatedEnvVars.EMAIL_USER!,
      pass: validatedEnvVars.EMAIL_PASS!,
    },
    from: `"${validatedEnvVars.FROM_NAME}" <${validatedEnvVars.FROM_EMAIL}>`,
  } : null, // Set to null if not configured
  // Only include the Cloudinary config if it's fully set up
  cloudinary: isCloudinaryConfigured ? {
    cloudName: validatedEnvVars.CLOUDINARY_CLOUD_NAME!,
    apiKey: validatedEnvVars.CLOUDINARY_API_KEY!,
    apiSecret: validatedEnvVars.CLOUDINARY_API_SECRET!,
  } : null, // Set to null if not configured
  // Only include the Redis config if it's fully set up
  redis: isRedisConfigured ? {
    host: validatedEnvVars.REDIS_HOST!,
    port: validatedEnvVars.REDIS_PORT!,
    ...(validatedEnvVars.REDIS_PASSWORD && { password: validatedEnvVars.REDIS_PASSWORD }),
    db: validatedEnvVars.REDIS_DB || 0,
  } : null, // Set to null if not configured
  // Only include the Resend config if it's fully set up
  resend: isResendConfigured ? {
    apiKey: validatedEnvVars.RESEND_API_KEY!,
    fromEmail: validatedEnvVars.RESEND_FROM_EMAIL!,
  } : null,
  // Only include the Twilio config if it's fully set up
  twilio: isTwilioConfigured ? {
    accountSid: validatedEnvVars.TWILIO_ACCOUNT_SID!,
    authToken: validatedEnvVars.TWILIO_AUTH_TOKEN!,
    phoneNumber: validatedEnvVars.TWILIO_PHONE_NUMBER!,
    ...(validatedEnvVars.TWILIO_WHATSAPP_NUMBER && { whatsappNumber: validatedEnvVars.TWILIO_WHATSAPP_NUMBER }),
  } : null,
  frontend: {
    url: validatedEnvVars.FRONTEND_URL,
  },
};

export default config;
export { config };