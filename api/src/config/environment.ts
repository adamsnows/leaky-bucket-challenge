import dotenv from "dotenv";
import { config as configDotenv } from "dotenv";

configDotenv();

interface EnvironmentConfig {
  port: number;
  nodeEnv: string;
  mongodbUri: string;
  jwtSecret: string;
  jwtExpiresIn: string;
  bucketCapacity: number;
  leakRate: number;
  refillRate: number;
}

// Função auxiliar para garantir que uma variável de ambiente exista
const requireEnv = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Environment variable ${name} is required`);
  }
  return value;
};

export const PORT = parseInt(requireEnv("PORT"), 10);
export const NODE_ENV = requireEnv("NODE_ENV");
export const MONGODB_URI = requireEnv("MONGODB_URI");
export const JWT_SECRET = requireEnv("JWT_SECRET");
export const JWT_EXPIRES_IN = requireEnv("JWT_EXPIRES_IN");
export const BUCKET_CAPACITY = parseInt(requireEnv("BUCKET_CAPACITY"), 10);
export const LEAK_RATE = parseFloat(requireEnv("LEAK_RATE"));
export const REFILL_RATE = parseFloat(requireEnv("REFILL_RATE"));

export const config: EnvironmentConfig = {
  port: PORT,
  nodeEnv: NODE_ENV,
  mongodbUri: MONGODB_URI,
  jwtSecret: JWT_SECRET,
  jwtExpiresIn: JWT_EXPIRES_IN,
  bucketCapacity: BUCKET_CAPACITY,
  leakRate: LEAK_RATE,
  refillRate: REFILL_RATE,
};
