# Leaky Bucket API - Sistema de Rate Limiting para Transações PIX

Esta é a parte backend do projeto Leaky Bucket, que implementa uma solução de rate limiting para APIs seguindo as especificações do BACEN (Banco Central do Brasil).

## 📋 Sobre o Projeto

O Leaky Bucket (Balde Furado) é um algoritmo de controle de taxa usado para limitar a frequência de requisições a uma API. Este projeto implementa uma versão personalizada do algoritmo Leaky Bucket baseada nas diretrizes do BACEN para o sistema PIX.

### Regras de Negócio

- Cada usuário começa com 10 tokens de requisição (capacidade máxima)
- Cada requisição consome 1 token
- Se a requisição for bem-sucedida, o token é restaurado (não é consumido)
- Se a requisição falhar, o token permanece consumido
- A cada hora, 1 token é adicionado ao total de tokens disponíveis
- 10 é o limite máximo de tokens

## 🏗️ Arquitetura do Backend

### Tecnologias Principais

- **Node.js**: Ambiente de execução JavaScript
- **TypeScript**: Superset tipado do JavaScript
- **Koa.js**: Framework web minimalista para Node.js
- **Apollo Server**: Servidor GraphQL para Koa
- **GraphQL**: Linguagem de consulta para APIs

### Estrutura do Diretório

```
api/
  ├── package.json
  ├── tsconfig.json
  ├── src/
  │   ├── index.ts                # Ponto de entrada da aplicação
  │   ├── config/
  │   │   └── environment.ts      # Configurações do ambiente (variáveis de ambiente)
  │   ├── controllers/            # Controladores (não utilizados no contexto GraphQL)
  │   ├── graphql/
  │   │   ├── resolvers/
  │   │   │   └── index.ts        # Resolvers GraphQL
  │   │   └── typeDefs/
  │   │       └── index.ts        # Definições de tipos GraphQL
  │   ├── middlewares/
  │   │   ├── error.ts            # Middleware de tratamento de erros
  │   │   └── leakyBucket.ts      # Middleware de rate limiting (Leaky Bucket)
  │   ├── models/                 # Modelos (simulados em memória neste projeto)
  │   ├── services/               # Serviços de negócio
  │   └── utils/                  # Utilitários
```

## 🚀 Principais Funcionalidades

### 1. Middleware Leaky Bucket

O coração da aplicação é o middleware Leaky Bucket implementado em `src/middlewares/leakyBucket.ts`. Este middleware:

- Rastreia os tokens disponíveis para cada usuário
- Aplica a lógica de consumo e restauração de tokens
- Implementa o mecanismo de recarga de tokens (1 token por hora)
- Retorna códigos de erro HTTP 429 (Too Many Requests) quando o limite é atingido

#### Implementação do Leaky Bucket

O algoritmo foi cuidadosamente implementado para seguir as especificações do BACEN:

```typescript
// Pre-emptively reserve the token by decrementing
bucket.tokens -= 1;

try {
  // Execute the request
  await next();

  // Check response status - if success (2xx), restore the token
  if (ctx.status >= 200 && ctx.status < 300) {
    bucket.tokens += 1; // Restore the token on success
  }
} catch (error) {
  // Request encountered an error, token remains consumed
  throw error;
}
```

### 2. API GraphQL

A API GraphQL oferece as seguintes operações:

**Queries:**

- `tokenStatus`: Retorna o status atual dos tokens para o usuário
- `me`: Retorna informações do usuário autenticado
- `getRateLimit`: Retorna informações sobre os limites de taxa

**Mutations:**

- `register`: Registra um novo usuário
- `login`: Autentica um usuário
- `initiatePixTransaction`: Simula o início de uma transação PIX

### 3. Autenticação

O sistema implementa autenticação JWT para proteger as rotas e identificar usuários:

- Geração de tokens JWT no login/registro
- Validação de tokens nas requisições
- Associação do rate limiting com o usuário autenticado

## 💾 Armazenamento de Dados

Nesta versão de demonstração, os dados são armazenados em memória:

- Usuários são armazenados em um array `mockUsers`
- Transações PIX são armazenadas em `mockTransactions`
- O estado do Leaky Bucket é mantido em um Map em memória

Para uma implementação em produção, recomenda-se usar Redis ou um banco de dados similar para o estado do Leaky Bucket, e um banco de dados persistente (como MongoDB ou PostgreSQL) para os dados de usuários e transações.

## 🚀 Como Executar o Projeto

### Pré-requisitos

- Node.js (v16+)
- npm ou pnpm

### Instalação e execução

```bash
# Instalar dependências
npm install

# Executar em modo de desenvolvimento
npm run dev

# Compilar para produção
npm run build

# Executar versão compilada
npm start
```

O servidor GraphQL estará disponível em `http://localhost:4000/graphql`.

### Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```
PORT=4000
NODE_ENV=development
BUCKET_CAPACITY=10
LEAK_RATE=1
JWT_SECRET=leaky-bucket-secret-key
JWT_EXPIRES_IN=1d
```

## 🔍 Como Testar o Rate Limiting

1. Use o Apollo Sandbox ou Postman para enviar múltiplas consultas GraphQL
2. Envie requisições com dados inválidos (por exemplo, tentativas de login com credenciais erradas)
3. Observe os headers de resposta `X-RateLimit-*` para ver o consumo de tokens
4. Após consumir todos os tokens, você receberá um erro 429
5. Use a query `tokenStatus` para monitorar o estado dos seus tokens
6. Deixei alguns console.log no servidor para ajudar a visualizar o funcionamento dos tokens em tempo real.

## 📚 Documentação da API GraphQL

### Queries

#### tokenStatus

```graphql
query {
  tokenStatus {
    availableTokens
    maxTokens
  }
}
```

#### me

```graphql
query {
  me {
    id
    username
    email
    createdAt
    updatedAt
  }
}
```

### Mutations

#### register

```graphql
mutation {
  register(
    username: "newuser"
    email: "user@example.com"
    password: "password123"
  ) {
    token
    user {
      id
      username
      email
    }
  }
}
```

#### login

```graphql
mutation {
  login(email: "user@example.com", password: "password123") {
    token
    user {
      id
      username
      email
    }
  }
}
```

#### initiatePixTransaction

```graphql
mutation {
  initiatePixTransaction(
    input: { pixKeyType: "cpf", pixKey: "12345678900", amount: 100.50 }
  ) {
    success
    message
    transactionId
  }
}
```

## 🚧 Limitações e Próximos Passos

- Implementação atual usa armazenamento em memória (para produção, use Redis)
- Autenticação JWT simples (para produção, implemente refresh tokens)
- Adicionar testes automatizados com Jest
- Implementar logging estruturado
- Adicionar validação de dados mais robusta

---

## 📝 Especificações do BACEN (DICT)

Este projeto segue as diretrizes do BACEN para implementação de um sistema de rate limiting para o Diretório de Identificadores de Contas Transacionais (DICT), conforme documentado em:
https://www.bcb.gov.br/content/estabilidadefinanceira/pix/API-DICT.html#section/Seguranca/Limitacao-de-requisicoes
