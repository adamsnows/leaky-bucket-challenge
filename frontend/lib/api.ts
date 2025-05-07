import api from "./axios";

interface PixTransactionInput {
  pixKeyType: string;
  pixKey: string;
  amount: number;
  token?: string;
}

interface TokenStatusResponse {
  availableTokens: number;
  maxTokens: number;
}

interface PixTransactionResponse {
  success: boolean;
  message: string;
  transactionId?: string;
}

interface RegisterInput {
  username: string;
  email: string;
  password: string;
}

interface RegisterResponse {
  token: string;
  user: {
    id: string;
    username: string;
    email: string;
  };
}

interface LoginInput {
  email: string;
  password: string;
}

interface LoginResponse {
  token: string;
  user: {
    id: string;
    username: string;
    email: string;
  };
}

async function executeGraphQL<T>(
  query: string,
  variables: Record<string, any> = {}
): Promise<{
  data: T | null;
  error: string | null;
  errorCode?: number;
  retryAfter?: number;
}> {
  try {
    const { data } = await api.post("", {
      query,
      variables,
    });

    if (data.errors) {
      const errorMessage =
        data.errors[0]?.message || "Erro na requisição GraphQL";

      if (
        errorMessage.toLowerCase().includes("rate limit") ||
        errorMessage.toLowerCase().includes("too many requests") ||
        errorMessage.toLowerCase().includes("retry after")
      ) {
        const retryMatch = errorMessage.match(/retry after (\d+)/i);
        const retrySeconds = retryMatch ? retryMatch[1] : null;

        return {
          data: null,
          error: errorMessage,
          errorCode: 429,
          retryAfter: retrySeconds ? parseInt(retrySeconds, 10) : undefined,
        };
      }

      return { data: null, error: errorMessage };
    }

    return { data: data.data, error: null };
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Erro desconhecido na requisição";

    const isRateLimited =
      errorMessage.toLowerCase().includes("limite de requisições") ||
      errorMessage.toLowerCase().includes("rate limit");

    if (isRateLimited) {
      return { data: null, error: errorMessage, errorCode: 429 };
    }

    return { data: null, error: errorMessage };
  }
}

const QUERIES = {
  GET_TOKEN_STATUS: `
    query GetTokenStatus {
      tokenStatus {
        availableTokens
        maxTokens
      }
    }
  `,
};

const MUTATIONS = {
  REGISTER_USER: `
    mutation RegisterUser($username: String!, $email: String!, $password: String!) {
      register(username: $username, email: $email, password: $password) {
        token
        user {
          id
          username
          email
        }
      }
    }
  `,

  LOGIN_USER: `
    mutation LoginUser($email: String!, $password: String!) {
      login(email: $email, password: $password) {
        token
        user {
          id
          username
          email
        }
      }
    }
  `,

  INITIATE_PIX_TRANSACTION: `
    mutation InitiatePixTransaction($input: PixTransactionInput!) {
      initiatePixTransaction(input: $input) {
        success
        message
        transactionId
      }
    }
  `,
};

export async function registerUser(data: RegisterInput): Promise<{
  success: boolean;
  data?: RegisterResponse;
  error?: string;
  errorCode?: number;
  retryAfter?: number;
}> {
  const response = await executeGraphQL<{ register: RegisterResponse }>(
    MUTATIONS.REGISTER_USER,
    {
      username: data.username,
      email: data.email,
      password: data.password,
    }
  );

  if (response.error) {
    return {
      success: false,
      error: response.error,
      errorCode: response.errorCode,
      retryAfter: response.retryAfter,
    };
  }

  return { success: true, data: response.data!.register };
}

export async function loginUser(data: LoginInput): Promise<{
  success: boolean;
  data?: LoginResponse;
  error?: string;
  errorCode?: number;
  retryAfter?: number;
}> {
  const response = await executeGraphQL<{ login: LoginResponse }>(
    MUTATIONS.LOGIN_USER,
    {
      email: data.email,
      password: data.password,
    }
  );

  if (response.error) {
    return {
      success: false,
      error: response.error,
      errorCode: response.errorCode,
      retryAfter: response.retryAfter,
    };
  }

  return { success: true, data: response.data!.login };
}

export async function initiatePixTransaction(
  data: PixTransactionInput
): Promise<{
  success: boolean;
  data?: PixTransactionResponse;
  error?: string;
  errorCode?: number;
  retryAfter?: number;
}> {
  const input = {
    pixKeyType: data.pixKeyType,
    pixKey: data.pixKey,
    amount: data.amount,
  };

  const response = await executeGraphQL<{
    initiatePixTransaction: PixTransactionResponse;
  }>(MUTATIONS.INITIATE_PIX_TRANSACTION, { input });

  if (response.error) {
    return {
      success: false,
      error: response.error,
      errorCode: response.errorCode,
      retryAfter: response.retryAfter,
    };
  }

  return { success: true, data: response.data!.initiatePixTransaction };
}

export async function fetchTokenStatus(): Promise<{
  success: boolean;
  data?: TokenStatusResponse;
  error?: string;
  errorCode?: number;
  retryAfter?: number;
}> {
  const response = await executeGraphQL<{ tokenStatus: TokenStatusResponse }>(
    QUERIES.GET_TOKEN_STATUS
  );

  if (response.error) {
    return {
      success: false,
      error: response.error,
      errorCode: response.errorCode,
      retryAfter: response.retryAfter,
    };
  }

  return { success: true, data: response.data!.tokenStatus };
}
