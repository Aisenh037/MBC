import dotenv from 'dotenv';
import Joi from 'joi';
import path from 'path';

const envFile = `.env.${process.env.NODE_ENV || 'development'}`;
dotenv.config({ path: path.resolve(process.cwd(), envFile) });

const envVarsSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(5000),
  
  MONGO_URI: Joi.string().required().description('MongoDB connection URI is required'),
  JWT_SECRET: Joi.string().required().description('JWT secret is required'),
  JWT_EXPIRE: Joi.string().default('1d'),
  JWT_COOKIE_EXPIRE: Joi.number().default(1),
  CORS_ORIGINS: Joi.string().default('http://localhost:5173'),
  
  // --- Email Service Configuration (Now Optional) ---
  EMAIL_HOST: Joi.string().description('SMTP host for sending emails'),
  EMAIL_PORT: Joi.number().description('SMTP port'),
  EMAIL_USER: Joi.string().description('SMTP username'),
  EMAIL_PASS: Joi.string().description('SMTP password'),
  FROM_EMAIL: Joi.string().email().description('The "from" email address'),
  FROM_NAME: Joi.string().description('The "from" name'),

  FRONTEND_URL: Joi.string().uri().required().description('Base URL of the frontend application'),

}).unknown();

const { value: envVars, error } = envVarsSchema.prefs({ errors: { label: 'key' } }).validate(process.env);

if (error) {
  throw new Error(`[CONFIG ERROR] Environment variable validation failed: ${error.message}`);
}

// Check if all required email variables are present to enable the email service
const isEmailServiceConfigured = 
    envVars.EMAIL_HOST && 
    envVars.EMAIL_PORT && 
    envVars.EMAIL_USER && 
    envVars.EMAIL_PASS &&
    envVars.FROM_EMAIL &&
    envVars.FROM_NAME;

// Export a clean, validated, and typed configuration object
export default {
  env: envVars.NODE_ENV,
  port: envVars.PORT,
  mongoose: {
    url: envVars.MONGO_URI,
  },
  jwt: {
    secret: envVars.JWT_SECRET,
    expiresIn: envVars.JWT_EXPIRE,
    cookieExpire: envVars.JWT_COOKIE_EXPIRE,
  },
  cors: {
    origins: envVars.CORS_ORIGINS.split(','),
  },
  // Only include the email config if it's fully set up
  email: isEmailServiceConfigured ? {
    host: envVars.EMAIL_HOST,
    port: envVars.EMAIL_PORT,
    auth: {
      user: envVars.EMAIL_USER,
      pass: envVars.EMAIL_PASS,
    },
    from: `"${envVars.FROM_NAME}" <${envVars.FROM_EMAIL}>`,
  } : null, // Set to null if not configured
  frontendUrl: envVars.FRONTEND_URL,
};