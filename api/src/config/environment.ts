import dotenvSafe from "dotenv-safe";
import path from "path";

dotenvSafe.config({
  allowEmptyValues: true,
  path: path.resolve(process.cwd(), ".env"),
  example: path.resolve(process.cwd(), ".env.example"),
});

export const config = {
  port: parseInt(process.env.PORT || "4000", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  mongodbUri: process.env.MONGODB_URI || "mongodb://localhost:27017/leaky-bucket",
  jwtSecret: process.env.JWT_SECRET || "leaky-bucket-secret-key",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  bucketCapacity: parseInt(process.env.BUCKET_CAPACITY || "10", 10),
  leakRate: parseFloat(process.env.LEAK_RATE || "1"),
  refillRate: parseFloat(process.env.REFILL_RATE || "1"),
};
