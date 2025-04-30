"use client";

import type React from "react";

import { useState } from "react";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

// Interface para os dados do formulário de login
interface LoginFormData {
  username: string;
  password: string;
}

export default function LoginForm() {
  // Estado com tipagem para os dados do formulário
  const [formData, setFormData] = useState<LoginFormData>({
    username: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { login, isAuthenticated } = useAuth();
  const { toast } = useToast();

  // Handlers tipados para atualização dos campos
  const handleUsernameChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ): void => {
    setFormData((prev) => ({ ...prev, username: e.target.value }));
  };

  const handlePasswordChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ): void => {
    setFormData((prev) => ({ ...prev, password: e.target.value }));
  };

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    e.preventDefault();

    const { username, password } = formData;

    if (!username || !password) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      await login(username, password);
      toast({
        title: "Login realizado com sucesso",
        description: "Você está autenticado e pode realizar transações Pix",
      });
    } catch (error: unknown) {
      toast({
        title: "Erro ao fazer login",
        description:
          error instanceof Error
            ? error.message
            : "Ocorreu um erro ao tentar fazer login",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = (): void => {
    login("", "");
    toast({
      title: "Logout realizado",
      description: "Você foi desconectado do sistema",
    });
  };

  if (isAuthenticated) {
    return (
      <div className="bg-green-50 p-4 rounded-md text-green-800">
        <p className="font-medium">Você está autenticado</p>
        <Button variant="outline" className="mt-2" onClick={handleLogout}>
          Logout
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="username">Usuário</Label>
        <Input
          id="username"
          type="text"
          value={formData.username}
          onChange={handleUsernameChange}
          placeholder="Digite seu usuário"
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Senha</Label>
        <Input
          id="password"
          type="password"
          value={formData.password}
          onChange={handlePasswordChange}
          placeholder="Digite sua senha"
          disabled={isLoading}
        />
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Entrando..." : "Entrar"}
      </Button>
    </form>
  );
}
