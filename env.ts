import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production"]),
  BASE_URL: z.string().default("http://localhost:8000"),
  BASE_URL_OTHER_PORT: z.string().optional(),
  ADMIN_PASSWORD: z.string(),
  JWT_SECRET: z.string(),
  // Resend email service configuration
  RESEND_API_KEY: z.string().min(1, "RESEND_API_KEY is required for email functionality"),
  EMAIL_FROM: z.string().min(1, "EMAIL_FROM is required for email functionality"),
  ADMIN_EMAIL: z.string().email().default("gensweaty@gmail.com"),
  // AI provider API key - required for AI functionality
  OPENROUTER_API_KEY: z.string().min(1, "OPENROUTER_API_KEY is required for AI functionality"),
  
  // Database safety - NEVER set to true in production
  // When false (default): Setup script only creates missing data, never deletes existing data
  // When true: Allows database reset if database is completely empty (all tables have 0 rows)
  ALLOW_DATABASE_RESET: z.string().optional().default("false"),
  
  // Legacy optional keys (kept for backwards compatibility)
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  // Legacy SMTP configuration (deprecated - use RESEND_API_KEY instead)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional(),
});

export const env = envSchema.parse(process.env);
