# Leaky Bucket Frontend - Interface para Sistema de Rate Limiting PIX

Esta é a parte frontend do projeto Leaky Bucket, desenvolvida em Next.js para fornecer uma interface amigável para o sistema de rate limiting implementado no backend.

## 📋 Sobre o Projeto

Este frontend permite aos usuários visualizar em tempo real o status dos seus tokens de rate limiting, realizar operações de autenticação e simular transações PIX. A interface foi projetada para demonstrar de forma visual o funcionamento do algoritmo Leaky Bucket e seus efeitos nas requisições à API.

## 🏗️ Arquitetura do Frontend

### Tecnologias Principais

- **React**: Biblioteca JavaScript para construção de interfaces
- **Next.js**: Framework React para aplicações web
- **TypeScript**: Superset tipado do JavaScript
- **Tailwind CSS**: Framework CSS utilitário
- **Shadcn UI**: Componentes de UI reutilizáveis
- **React Hook Form**: Biblioteca para gerenciamento de formulários
- **Zod**: Biblioteca de validação de esquemas
- **Framer Motion**: Biblioteca de animações para React

### Estrutura do Diretório

```
frontend/
  ├── app/                      # Rotas do Next.js
  │   ├── globals.css
  │   ├── layout.tsx
  │   ├── page.tsx              # Página inicial (login)
  │   └── register/
  │       └── page.tsx          # Página de registro
  ├── components/               # Componentes React
  │   ├── login-form.tsx        # Formulário de login
  │   ├── pix-transaction-form.tsx  # Formulário de transação PIX
  │   ├── register-form.tsx     # Formulário de registro
  │   ├── token-display.tsx     # Exibe o status dos tokens
  │   ├── theme-provider.tsx
  │   └── ui/                   # Componentes de UI (Shadcn)
  ├── context/
  │   └── auth-context.tsx      # Contexto de autenticação
  ├── hooks/                    # Hooks personalizados
  │   ├── use-mobile.tsx
  │   └── use-toast.ts
  ├── lib/                      # Utilitários e serviços
  │   ├── api.ts                # Funções para chamadas à API GraphQL
  │   ├── axios.ts              # Configuração do Axios
  │   └── utils.ts              # Funções utilitárias
  └── public/                   # Arquivos estáticos
```

## 🚀 Principais Funcionalidades

### 1. Autenticação de Usuários

O sistema implementa um fluxo completo de autenticação:

- Registro de novos usuários
- Login de usuários existentes
- Armazenamento de tokens JWT em localStorage
- Contexto de autenticação para todo o aplicativo

#### Implementação do Auth Context

O contexto de autenticação (`auth-context.tsx`) fornece:

- Estado de autenticação para toda a aplicação
- Funções de login e logout
- Persistência de sessão com localStorage
- Validação de token

### 2. Visualização do Status de Rate Limiting

O componente `TokenDisplay` fornece uma interface visual e intuitiva para o status dos tokens:

- Exibe o número atual de tokens disponíveis
- Mostra uma barra de progresso colorida (verde/amarelo/vermelho)
- Atualiza automaticamente a cada 10 segundos
- Exibe animações suaves quando os valores de tokens mudam
- Feedback visual quando o limite é atingido

#### Como funciona o TokenDisplay

```tsx
// Recupera o status dos tokens da API
const response = await fetchTokenStatus();

// Exibe visualmente o status
<Progress
  value={progressPercentage}
  className={`h-2.5 ${
    availableTokens < 2
      ? "bg-red-200"
      : availableTokens < maxTokens / 2
      ? "bg-amber-200"
      : "bg-green-200"
  }`}
/>;
```

### 3. Simulação de Transações PIX

O formulário de transação PIX permite:

- Selecionar o tipo de chave PIX (CPF, CNPJ, Email, Telefone, Chave aleatória)
- Informar a chave PIX
- Definir o valor da transação
- Visualizar o resultado da transação (sucesso ou erro)
- Exibição do status de rate limiting após a transação

### 4. Tratamento de Erros com Toasts

Ao invés de lançar exceções, o sistema utiliza notificações toast para informar o usuário sobre erros:

- Feedback visual para erros de validação
- Mensagens de erro específicas para problemas de autenticação
- Tratamento especial para erros de rate limiting (429)
- Interface amigável para retry após limite atingido

#### Sistema de Notificações

```tsx
// Em vez de throw new Error:
if (!response.success) {
  toast({
    title: "Erro na transação",
    description: response.error || "Ocorreu um erro ao iniciar a transação",
    variant: "destructive",
  });
}
```

### 5. Comunicação com o Backend

O módulo `lib/api.ts` contém todas as funções para comunicação com o backend GraphQL:

- Funções para autenticação
- Funções para transações PIX
- Funções para verificar o status dos tokens
- Tratamento unificado de erros

## 🎨 Interface de Usuário

O projeto utiliza o Shadcn UI, uma biblioteca de componentes para React que:

- Oferece componentes acessíveis e personalizáveis
- É construída sobre Radix UI e Tailwind CSS
- Proporciona uma experiência moderna e responsiva

### Tema e Aparência

- Design responsivo para desktop e mobile
- Animações suaves com Framer Motion
- Consistência visual em toda a aplicação

## 🚀 Como Executar o Projeto

### Pré-requisitos

- Node.js (v16+)
- npm ou pnpm
- Backend em execução (ver README do backend)

### Instalação e execução

```bash
# Instalar dependências
npm install

# Executar em modo de desenvolvimento
npm run dev

# Compilar para produção
npm run build

# Iniciar versão compilada
npm start
```

O frontend estará disponível em `http://localhost:3000`.

### Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto com:

```
NEXT_PUBLIC_API_URL=http://localhost:4000/graphql
```

## 🧪 Como Testar o Rate Limiting

Para testar o sistema de rate limiting através da interface:

1. Faça login com credenciais inválidas múltiplas vezes

   - Cada tentativa falhada consumirá 1 token
   - O componente TokenDisplay mostrará a diminuição dos tokens

2. Continue até consumir todos os tokens

   - Você verá uma notificação de erro 429 (Too Many Requests)
   - O TokenDisplay mostrará um contador de tempo até o próximo token

3. Faça login com credenciais corretas

   - Se bem-sucedido, o token não será consumido
   - Observe que o número de tokens permanece o mesmo

4. Teste a transação PIX
   - Inicie transações PIX para ver como o sistema lida com essas requisições
   - Observe o comportamento do sistema quando todas as transações consomem tokens

## 🚧 Limitações e Próximos Passos

- Adicionar testes automatizados com React Testing Library e Jest
- Implementar um sistema mais robusto de refresh token
- Melhorar a responsividade para dispositivos mobile
- Adicionar mais animações e feedback visual
- Implementar um dashboard para administradores visualizarem o uso do sistema

---

## 🔄 Integração com o Backend

Este frontend está projetado para funcionar com o backend GraphQL disponível na pasta `/api` do projeto. Certifique-se de que o servidor backend está em execução antes de iniciar o frontend.

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
