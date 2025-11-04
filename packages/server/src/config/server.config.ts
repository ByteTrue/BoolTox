import { env } from './env.config';

/**
 * Server configuration
 */
export const serverConfig = {
  // Server host and port
  host: env.HOST,
  port: env.PORT,
  
  // Environment
  isDevelopment: env.NODE_ENV === 'development',
  isProduction: env.NODE_ENV === 'production',
  isTest: env.NODE_ENV === 'test',
  
  // CORS configuration
  cors: {
    origin: env.CORS_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'] as string[],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-client-token', 'x-ingest-secret'] as string[],
  },
  
  // Rate limiting
  rateLimit: {
    max: env.RATE_LIMIT_MAX,
    timeWindow: env.RATE_LIMIT_WINDOW,
  },
  
  // Request body limits
  bodyLimit: {
    json: 10 * 1024 * 1024, // 10MB
    text: 5 * 1024 * 1024,  // 5MB
  },
  
  // Timeout configuration
  timeout: {
    server: 60000, // 60 seconds
    idle: 300000,  // 5 minutes
  },
} as const;

/**
 * Security configuration
 */
export const securityConfig = {
  clientApiToken: env.CLIENT_API_TOKEN,
  ingestSharedSecret: env.INGEST_SHARED_SECRET,
  jwtSecret: env.JWT_SECRET,
} as const;

/**
 * GitHub configuration
 */
export const githubConfig = {
  token: env.GITHUB_TOKEN,
  owner: env.GITHUB_OWNER,
  repo: env.GITHUB_REPO,
  // Sync interval in milliseconds (1 hour)
  syncInterval: 60 * 60 * 1000,
} as const;