import "dotenv/config";

export const env = {
  PORT: Number(process.env.PORT) || 3000,
  DATABASE_HOST: process.env.DATABASE_HOST || "localhost",
  DATABASE_PORT: Number(process.env.DATABASE_PORT) || 3306,
  DATABASE_USER: process.env.DATABASE_USER || "root",
  DATABASE_PASSWORD: process.env.DATABASE_PASSWORD || "",
  DATABASE_NAME: process.env.DATABASE_NAME || "vibe_db",
};
