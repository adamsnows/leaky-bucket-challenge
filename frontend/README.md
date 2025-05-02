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
- **Apollo Client**: Conectar aplicação React com API GraphQL

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

   - Você verá uma notificação de erro.

3. Faça login com credenciais corretas

   - Se bem-sucedido, o token não será consumido
   - Observe que o número de tokens permanece o mesmo

4. Teste a transação PIX

   - Inicie transações PIX para ver como o sistema lida com essas requisições

5. O sistema travará e não deixará você fazer nenhuma requisição caso tenham acabado os tokens

## 🚧 Limitações e Próximos Passos

- Adicionar testes automatizados com React Testing Library e Jest
- Implementar um sistema mais robusto de refresh token
- Implementar um dashboard para administradores visualizarem o uso do sistema
- Implementar um contador de tempo para que o usuário saiba quando será liberado

---

## 🔄 Integração com o Backend

Este frontend está projetado para funcionar com o backend GraphQL disponível na pasta `/api` do projeto. Certifique-se de que o servidor backend está em execução antes de iniciar o frontend.

Para informações detalhadas sobre o backend e a implementação do algoritmo Leaky Bucket, consulte o README.md na pasta `/api`.
