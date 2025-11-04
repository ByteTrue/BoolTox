// Load environment variables from .env before validating
import 'dotenv/config';
import { z } from 'zod';

/**
 * Environment variables schema
 */
const envSchema = z.object({
  // Node environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Server configuration
  PORT: z.string().default('3000').transform(Number),
  HOST: z.string().default('0.0.0.0'),

  // Database
  DATABASE_URL: z.string().url(),

  // GitHub configuration
  GITHUB_TOKEN: z.string().optional(),
  GITHUB_OWNER: z.string().default('ByteTrue'),
  GITHUB_REPO: z.string().default('booltox-client'),

  // Security
  CLIENT_API_TOKEN: z.string().min(32),
  INGEST_SHARED_SECRET: z.string().min(32),
  JWT_SECRET: z.string().min(32).optional(),

  // CORS
  CORS_ORIGIN: z.string().default('*'),

  // Rate limiting
  RATE_LIMIT_MAX: z.string().default('100').transform(Number),
  RATE_LIMIT_WINDOW: z.string().default('60000').transform(Number), // 1 minute in ms

  // Logging
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  LOG_PRETTY: z.string().default('true').transform((val) => val === 'true'),
});

/**
 * Validate and parse environment variables
 */
function validateEnv() {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues.map((issue) => {
        return `${issue.path.join('.')}: ${issue.message}`;
      });
      throw new Error(`Environment validation failed:\n${issues.join('\n')}`);
    }
    throw error;
  }
}

/**
 * Validated environment variables
 */
export const env = validateEnv();

/**
 * Type of validated environment
 */
export type Env = z.infer<typeof envSchema>;