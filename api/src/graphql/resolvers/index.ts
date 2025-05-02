import { Context } from "koa";
import { AuthenticationError, UserInputError } from "apollo-server-koa";
import { config } from "../../config/environment";
import { getTokenStatus } from "../../middlewares/leakyBucket";

interface User {
  id: string;
  username: string;
  email: string;
  password: string;
  createdAt: string;
  updatedAt: string;
}

interface AuthResponse {
  token: string;
  user: Omit<User, "password">;
}

interface RateLimitInfo {
  remaining: number;
  limit: number;
  resetAt: string;
}

interface TokenStatus {
  availableTokens: number;
  maxTokens: number;
}

interface PixTransaction {
  transactionId: string;
  pixKeyType: string;
  pixKey: string;
  amount: number;
  status: string;
  createdAt: string;
}

interface PixTransactionResponse {
  success: boolean;
  message: string;
  transactionId?: string;
}

interface PixTransactionInput {
  pixKeyType: string;
  pixKey: string;
  amount: number;
}

interface ResolverContext {
  ctx: Context;
}

interface RegisterArgs {
  username: string;
  email: string;
  password: string;
}

interface LoginArgs {
  email: string;
  password: string;
}

interface PixTransactionArgs {
  input: PixTransactionInput;
}

const mockUsers: User[] = [
  {
    id: "1",
    username: "testuser",
    email: "test@example.com",
    password: "hashed_password",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const mockTransactions: PixTransaction[] = [];

const resolvers = {
  Query: {
    me: (
      _: any,
      __: any,
      { ctx }: ResolverContext
    ): Omit<User, "password"> | null => {
      const user = mockUsers[0];
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    },

    getRateLimit: (
      _: any,
      __: any,
      { ctx }: ResolverContext
    ): RateLimitInfo => {
      const remaining = parseInt(
        ctx.response.get("X-RateLimit-Remaining") || "0",
        10
      );
      const limit = config.bucketCapacity;

      return {
        remaining,
        limit,
        resetAt: new Date(Date.now() + 1000).toISOString(),
      };
    },

    tokenStatus: (_: any, __: any, { ctx }: ResolverContext): TokenStatus => {
      const identifier = ctx.state.rateLimit?.identifier || ctx.ip;
      const capacity = config.bucketCapacity;
      const status = getTokenStatus(identifier, capacity);

      return status;
    },
  },

  Mutation: {
    register: (
      _parent: any,
      { username, email, password }: RegisterArgs
    ): AuthResponse => {
      if (mockUsers.some((user) => user.email === email)) {
        throw new UserInputError("Usuário com esse e-mail já existe!");
      }

      const newUser: User = {
        id: (mockUsers.length + 1).toString(),
        username,
        email,
        password,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockUsers.push(newUser);

      const { password: _, ...userWithoutPassword } = newUser;
      return {
        token: "mock_token_for_" + newUser.id,
        user: userWithoutPassword,
      };
    },

    login: (
      _parent: any,
      { email, password }: LoginArgs,
      { ctx }: ResolverContext
    ): AuthResponse => {
      const user = mockUsers.find((user) => user.email === email);

      if (!user) {
        throw new UserInputError("Credenciais inválidas");
      }

      if (user.password !== password) {
        throw new AuthenticationError("Credenciais inválidas");
      }

      const { password: _, ...userWithoutPassword } = user;
      return {
        token: "mock_token_for_" + user.id,
        user: userWithoutPassword,
      };
    },

    initiatePixTransaction: (
      _parent: any,
      { input }: PixTransactionArgs,
      { ctx }: ResolverContext
    ): PixTransactionResponse => {
      const { pixKeyType, pixKey, amount } = input;

      if (!pixKeyType || !pixKey || !amount) {
        throw new UserInputError("Todos os campos são obrigatórios");
      }

      if (amount <= 0) {
        throw new UserInputError("O valor deve ser maior que zero");
      }

      const transactionId = `pix-${Date.now()}-${Math.random()
        .toString(36)
        .substring(2)}`;

      const newTransaction: PixTransaction = {
        transactionId,
        pixKeyType,
        pixKey,
        amount,
        status: "pending",
        createdAt: new Date().toISOString(),
      };

      mockTransactions.push(newTransaction);

      return {
        success: true,
        message: `Transação PIX de R$ ${amount.toFixed(
          2
        )} para ${pixKey} (${pixKeyType}) iniciada com sucesso.`,
        transactionId,
      };
    },
  },
};

export default resolvers;
