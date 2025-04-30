"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";

// Interface para representar um usuário autenticado
interface User {
  id: string;
  username: string;
  email: string;
}

// Interface para resposta da API de autenticação
interface AuthResponse {
  token: string;
  user: User;
}

// Interface para o contexto de autenticação
interface AuthContextType {
  isAuthenticated: boolean;
  token: string;
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

// Valor padrão para o contexto (usado apenas para tipagem)
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string>("");
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // Check for saved token on mount
  useEffect(() => {
    const savedToken = localStorage.getItem("authToken");
    const savedUser = localStorage.getItem("authUser");

    if (savedToken) {
      setToken(savedToken);
      setIsAuthenticated(true);

      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch (error) {
          console.error("Erro ao processar dados do usuário:", error);
        }
      }
    }
  }, []);

  const login = async (username: string, password: string): Promise<void> => {
    if (!username || !password) {
      throw new Error("Nome de usuário e senha são obrigatórios");
    }

    try {
      // In a real app, this would be an API call to your backend
      // For this example, we'll simulate a successful login
      const response = await simulateLoginApi(username, password);

      // Save token and user to localStorage and state
      localStorage.setItem("authToken", response.token);
      localStorage.setItem("authUser", JSON.stringify(response.user));

      setToken(response.token);
      setUser(response.user);
      setIsAuthenticated(true);
    } catch (error) {
      throw new Error("Falha na autenticação. Verifique suas credenciais.");
    }
  };

  const logout = (): void => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("authUser");

    setToken("");
    setUser(null);
    setIsAuthenticated(false);
  };

  // Simulate API call for login
  const simulateLoginApi = async (
    username: string,
    password: string
  ): Promise<AuthResponse> => {
    // This is just a simulation - in a real app, this would be a fetch to your backend
    return new Promise<AuthResponse>((resolve, reject) => {
      setTimeout(() => {
        // Simple validation
        if (username.length > 0 && password.length > 0) {
          resolve({
            token: `simulated-jwt-token-${Math.random()
              .toString(36)
              .substring(2)}`,
            user: {
              id: `user-${Math.random().toString(36).substring(2)}`,
              username,
              email: `${username}@example.com`,
            },
          });
        } else {
          reject(new Error("Invalid credentials"));
        }
      }, 500);
    });
  };

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, token, user, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
