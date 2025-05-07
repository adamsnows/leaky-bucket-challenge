import Koa from "koa";
import { ApolloServer } from "apollo-server-koa";
import bodyParser from "koa-bodyparser";
import Router from "koa-router";
import mongoose from "mongoose";
import dotenv from "dotenv";

import { PORT, MONGODB_URI, config } from "./config/environment";

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

// Configurando o middleware antes de iniciar
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

// Configuração do Apollo Server
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

// Função para conectar ao MongoDB
const connectDB = async (): Promise<void> => {
  try {
    // Tente primeiro com a URI do MongoDB configurada
    await mongoose.connect(MONGODB_URI);
    console.log("MongoDB connected successfully");
    return;
  } catch (err) {
    console.error("Failed with primary MongoDB URI, trying fallback connection...");

    // Se falhar, tente uma conexão alternativa
    try {
      // Se estiver rodando localmente, tente se conectar ao Docker
      if (MONGODB_URI.includes('localhost')) {
        await mongoose.connect(MONGODB_URI.replace('localhost', 'mongodb'));
        console.log("MongoDB connected successfully via Docker network");
        return;
      }
      // Se estiver no Docker, tente se conectar ao localhost
      else if (MONGODB_URI.includes('mongodb:')) {
        await mongoose.connect(MONGODB_URI.replace('mongodb:', 'localhost:'));
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

// Função para iniciar o servidor
const startServer = async (): Promise<void> => {
  const apolloServer = createApolloServer();
  await apolloServer.start();
  apolloServer.applyMiddleware({ app });

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(
      `GraphQL endpoint: http://localhost:${PORT}${apolloServer.graphqlPath}`
    );
  });
};

// Função principal que orquestra a inicialização da aplicação
const initializeApp = async (): Promise<void> => {
  try {
    // Primeiro conecta ao MongoDB
    await connectDB();

    // Depois inicia o servidor somente se a conexão foi bem-sucedida
    await startServer();
  } catch (error) {
    console.error("Failed to initialize application:", error);
    process.exit(1);
  }
};

// Executa a função de inicialização
initializeApp();

process.on("unhandledRejection", (err: unknown) => {
  console.error("Unhandled Rejection:", err);
  process.exit(1);
});
