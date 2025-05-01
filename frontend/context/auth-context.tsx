"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: string;
  username: string;
  email: string;
}

interface AuthResponse {
  token: string;
  user: User;
}

interface AuthContextType {
  isAuthenticated: boolean;
  token: string;
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string>("");
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const { toast } = useToast();

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
      toast({
        title: "Erro de validação",
        description: "Nome de usuário e senha são obrigatórios",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await simulateLoginApi(username, password);

      localStorage.setItem("authToken", response.token);
      localStorage.setItem("authUser", JSON.stringify(response.user));

      setToken(response.token);
      setUser(response.user);
      setIsAuthenticated(true);
    } catch (error) {
      toast({
        title: "Falha na autenticação",
        description: "Verifique suas credenciais e tente novamente.",
        variant: "destructive",
      });
    }
  };

  const logout = (): void => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("authUser");

    setToken("");
    setUser(null);
    setIsAuthenticated(false);
  };

  const simulateLoginApi = async (
    username: string,
    password: string
  ): Promise<AuthResponse> => {
    return new Promise<AuthResponse>((resolve, reject) => {
      setTimeout(() => {
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
