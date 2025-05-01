import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Interface para configurações do ambiente
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

// Server configuration
export const PORT = parseInt(process.env.PORT || "4000", 10);
export const NODE_ENV = process.env.NODE_ENV || "development";

// Database configuration
export const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/leaky-bucket";

// JWT configuration
export const JWT_SECRET = process.env.JWT_SECRET || "leaky-bucket-secret-key";
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1d";

// Rate limiting configuration (for Leaky Bucket implementation)
export const BUCKET_CAPACITY = parseInt(
  process.env.BUCKET_CAPACITY || "10",
  10
);
export const LEAK_RATE = parseFloat(process.env.LEAK_RATE || "1"); // tokens per second
export const REFILL_RATE = parseFloat(process.env.REFILL_RATE || "1"); // tokens per second

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
