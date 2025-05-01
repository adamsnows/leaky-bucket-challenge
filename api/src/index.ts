import Koa from "koa";
import { ApolloServer } from "apollo-server-koa";
import bodyParser from "koa-bodyparser";
import Router from "koa-router";
import mongoose from "mongoose";
import dotenv from "dotenv";

import { PORT, MONGODB_URI } from "./config/environment";

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

const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("MongoDB connected successfully");
  } catch (err) {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  }
};

connectDB();

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

const apolloServer = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({ ctx }): ApolloContext => ({ ctx }),
  formatError: (error): GraphQLFormattedError => {
    if (process.env.NODE_ENV === "production" && error.extensions?.exception) {
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

const startServer = async (): Promise<void> => {
  await apolloServer.start();
  apolloServer.applyMiddleware({ app });
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(
      `GraphQL endpoint: http://localhost:${PORT}${apolloServer.graphqlPath}`
    );
  });
};

startServer();

process.on("unhandledRejection", (err: unknown) => {
  console.error("Unhandled Rejection:", err);
  process.exit(1);
});
