import { gql } from 'apollo-server-koa';

const typeDefs = gql`
  type User {
    id: ID!
    username: String!
    email: String!
    createdAt: String!
    updatedAt: String!
  }

  type AuthResponse {
    token: String!
    user: User!
  }

  type RateLimitInfo {
    remaining: Int!
    limit: Int!
    resetAt: String
  }

  type TokenStatus {
    availableTokens: Int!
    maxTokens: Int!
  }

  type PixTransaction {
    transactionId: String!
    pixKeyType: String!
    pixKey: String!
    amount: Float!
    status: String!
    createdAt: String!
  }

  type PixTransactionResponse {
    success: Boolean!
    message: String!
    transactionId: String
  }

  input PixTransactionInput {
    pixKeyType: String!
    pixKey: String!
    amount: Float!
  }

  type Query {
    me: User
    getRateLimit: RateLimitInfo!
    tokenStatus: TokenStatus!
  }

  type Mutation {
    register(username: String!, email: String!, password: String!): AuthResponse!
    login(email: String!, password: String!): AuthResponse!
    initiatePixTransaction(input: PixTransactionInput!): PixTransactionResponse!
  }
`;

export default typeDefs;