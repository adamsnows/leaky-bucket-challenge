// GraphQL client setup
import { GraphQLClient } from "graphql-request";
import { gql } from "graphql-request";

// This would be your actual API URL in production
const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/graphql";

// Create a GraphQL client
const createClient = (token?: string) => {
  return new GraphQLClient(API_URL, {
    headers: token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : {},
  });
};

// Interface for Pix transaction input
interface PixTransactionInput {
  pixKeyType: string;
  pixKey: string;
  amount: number;
  token: string;
}

// Interface for token status response
interface TokenStatusResponse {
  availableTokens: number;
  maxTokens: number;
}

// Interface for Pix transaction response
interface PixTransactionResponse {
  success: boolean;
  message: string;
  transactionId?: string;
}

// Interface para GraphQL responses
interface GraphQLPixTransactionResponse {
  initiatePixTransaction: PixTransactionResponse;
}

interface GraphQLTokenStatusResponse {
  tokenStatus: TokenStatusResponse;
}

// GraphQL mutation for initiating a Pix transaction
const INITIATE_PIX_TRANSACTION = gql`
  mutation InitiatePixTransaction($input: PixTransactionInput!) {
    initiatePixTransaction(input: $input) {
      success
      message
      transactionId
    }
  }
`;

// GraphQL query for fetching token status
const GET_TOKEN_STATUS = gql`
  query GetTokenStatus {
    tokenStatus {
      availableTokens
      maxTokens
    }
  }
`;

// Function to initiate a Pix transaction
export async function initiatePixTransaction(
  data: PixTransactionInput
): Promise<PixTransactionResponse> {
  try {
    const client = createClient(data.token);

    // Real API call
    const input = {
      pixKeyType: data.pixKeyType,
      pixKey: data.pixKey,
      amount: data.amount,
    };

    const response = await client.request<GraphQLPixTransactionResponse>(
      INITIATE_PIX_TRANSACTION,
      {
        input,
      }
    );

    return response.initiatePixTransaction;
  } catch (error: unknown) {
    console.error("Error initiating Pix transaction:", error);

    // Handle rate limiting errors specifically
    if (error instanceof Error && error.message.includes("rate limit")) {
      throw new Error(
        "Você atingiu o limite de requisições. Tente novamente mais tarde."
      );
    }

    throw new Error(
      "Falha ao iniciar a transação Pix. Tente novamente mais tarde."
    );
  }
}

// Function to fetch token status
export async function fetchTokenStatus(
  token: string
): Promise<TokenStatusResponse> {
  try {
    const client = createClient(token);

    // Real API call
    const response = await client.request<GraphQLTokenStatusResponse>(
      GET_TOKEN_STATUS
    );
    return response.tokenStatus;
  } catch (error: unknown) {
    console.error("Error fetching token status:", error);
    throw new Error("Falha ao buscar o status dos tokens.");
  }
}
