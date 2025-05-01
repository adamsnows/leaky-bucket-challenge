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
): Promise<T> {
  try {
    const { data } = await api.post("", {
      query,
      variables,
    });

    if (data.errors) {
      throw new Error(data.errors[0].message || "Erro na requisição GraphQL");
    }

    return data.data;
  } catch (error) {
    console.error("GraphQL request error:", error);
    throw error;
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

export async function registerUser(
  data: RegisterInput
): Promise<RegisterResponse> {
  try {
    const response = await executeGraphQL<{ register: RegisterResponse }>(
      MUTATIONS.REGISTER_USER,
      {
        username: data.username,
        email: data.email,
        password: data.password,
      }
    );

    return response.register;
  } catch (error) {
    console.error("Error registering user:", error);
    throw error;
  }
}

export async function loginUser(data: LoginInput): Promise<LoginResponse> {
  try {
    const response = await executeGraphQL<{ login: LoginResponse }>(
      MUTATIONS.LOGIN_USER,
      {
        email: data.email,
        password: data.password,
      }
    );

    return response.login;
  } catch (error) {
    console.error("Error logging in:", error);
    throw error;
  }
}

export async function initiatePixTransaction(
  data: PixTransactionInput
): Promise<PixTransactionResponse> {
  try {
    const input = {
      pixKeyType: data.pixKeyType,
      pixKey: data.pixKey,
      amount: data.amount,
    };

    const response = await executeGraphQL<{
      initiatePixTransaction: PixTransactionResponse;
    }>(MUTATIONS.INITIATE_PIX_TRANSACTION, { input });

    return response.initiatePixTransaction;
  } catch (error) {
    console.error("Error initiating Pix transaction:", error);
    throw error;
  }
}

export async function fetchTokenStatus(): Promise<TokenStatusResponse> {
  try {
    const response = await executeGraphQL<{ tokenStatus: TokenStatusResponse }>(
      QUERIES.GET_TOKEN_STATUS
    );

    return response.tokenStatus;
  } catch (error) {
    console.error("Error fetching token status:", error);
    throw error;
  }
}
