import Koa from "koa";
import { ApolloServer } from "apollo-server-koa";
import bodyParser from "koa-bodyparser";
import Router from "koa-router";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "@koa/cors";

import { config } from "./config/environment";

import typeDefs from "./graphql/typeDefs";
import resolvers from "./graphql/resolvers";

import errorMiddleware from "./middlewares/error";
import leakyBucketMiddleware from "./middlewares/leakyBucket";
import { GraphQLFormattedError } from "graphql";

dotenv.config();

interface ApolloContext {
  ctx: Koa.Context;
}

interface ServerError extends Error {
  extensions?: {
    exception?: {
      stacktrace?: string[];
    };
  };
}

const app = new Koa();
const router = new Router();

app.use(
  cors({
    origin: "*",
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(bodyParser());
app.use(errorMiddleware);
app.use(leakyBucketMiddleware({}));

router.get("/", (ctx: Koa.Context): void => {
  ctx.body = {
    message: "Welcome to Leaky Bucket API",
    documentation: "/graphql",
  };
});

app.use(router.routes());
app.use(router.allowedMethods());

const createApolloServer = () => {
  return new ApolloServer({
    typeDefs,
    resolvers,
    context: ({ ctx }): ApolloContext => ({ ctx }),
    formatError: (error): GraphQLFormattedError => {
      if (config.nodeEnv === "production" && error.extensions?.exception) {
        const exception = error.extensions.exception as {
          stacktrace?: readonly string[];
        };
        if (exception.stacktrace) {
          error.extensions.exception = { ...exception, stacktrace: undefined };
        }
      }
      return error;
    },
  });
};

const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(config.mongodbUri);
    console.log("MongoDB connected successfully");
    return;
  } catch (err) {
    console.error("Failed with primary MongoDB URI, trying fallback connection...");

    try {
      if (config.mongodbUri.includes("localhost")) {
        await mongoose.connect(config.mongodbUri.replace("localhost", "mongodb"));
        console.log("MongoDB connected successfully via Docker network");
        return;
      } else if (config.mongodbUri.includes("mongodb:")) {
        await mongoose.connect(config.mongodbUri.replace("mongodb:", "localhost:"));
        console.log("MongoDB connected successfully via localhost");
        return;
      }

      console.error("MongoDB connection error:", err);
      process.exit(1);
    } catch (fallbackErr) {
      console.error("All MongoDB connection attempts failed:", fallbackErr);
      process.exit(1);
    }
  }
};

const startServer = async (): Promise<void> => {
  const apolloServer = createApolloServer();
  await apolloServer.start();
  apolloServer.applyMiddleware({ app });

  app.listen(config.port, () => {
    console.log(`Server running on http://localhost:${config.port}`);
    console.log(
      `GraphQL endpoint: http://localhost:${config.port}${apolloServer.graphqlPath}`
    );
  });
};

const initializeApp = async (): Promise<void> => {
  try {
    await connectDB();

    await startServer();
  } catch (error) {
    console.error("Failed to initialize application:", error);
    process.exit(1);
  }
};

initializeApp();

process.on("unhandledRejection", (err: unknown) => {
  console.error("Unhandled Rejection:", err);
  process.exit(1);
});
