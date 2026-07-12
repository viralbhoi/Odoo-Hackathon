import dotenv from "dotenv";

dotenv.config();

export const env = {
  PORT: Number(process.env.PORT) || 5000,

  DATABASE_URL: process.env.DATABASE_URL!,

  JWT_SECRET: process.env.JWT_SECRET!,

  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET!,

  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID!,

  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET!,

  GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL!,

  REDIS_URL: process.env.REDIS_URL!,

  SENTRY_DSN: process.env.SENTRY_DSN!,
};