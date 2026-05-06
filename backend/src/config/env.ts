import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('4000'),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  WAQI_TOKEN: z.string(),
  OWM_API_KEY: z.string(),
  ORS_API_KEY: z.string(),
  SUPABASE_SERVICE_KEY: z.string().optional().default(''),
  JWT_SECRET: z.string().min(32),
  // ML service URL — defaults to localhost for local dev, docker service name in containers
  ML_SERVICE_URL: z.string().url().optional().default('http://localhost:8000'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', JSON.stringify(parsed.error.format(), null, 2));
  process.exit(1);
}

export const env = parsed.data;
