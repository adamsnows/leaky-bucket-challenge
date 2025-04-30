"use client";

import type React from "react";

import { useState } from "react";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { initiatePixTransaction } from "@/lib/api";

// Tipos de chaves PIX disponíveis
type PixKeyType = "cpf" | "cnpj" | "email" | "phone" | "random";

// Interface para dados do formulário
interface PixTransactionFormData {
  pixKeyType: PixKeyType;
  pixKey: string;
  amount: string;
}

// Interface para resultado da transação
interface TransactionResult {
  success: boolean;
  message: string;
  transactionId?: string;
}

export default function PixTransactionForm() {
  // Estado tipado para os dados do formulário
  const [formData, setFormData] = useState<PixTransactionFormData>({
    pixKeyType: "cpf",
    pixKey: "",
    amount: "",
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { isAuthenticated, token } = useAuth();
  const { toast } = useToast();

  // Handlers tipados para atualizar o estado do formulário
  const handlePixKeyTypeChange = (value: PixKeyType): void => {
    setFormData((prev) => ({ ...prev, pixKeyType: value }));
  };

  const handlePixKeyChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setFormData((prev) => ({ ...prev, pixKey: e.target.value }));
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setFormData((prev) => ({ ...prev, amount: e.target.value }));
  };

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    e.preventDefault();

    if (!isAuthenticated) {
      toast({
        title: "Não autenticado",
        description: "Você precisa fazer login para realizar uma transação",
        variant: "destructive",
      });
      return;
    }

    const { pixKeyType, pixKey, amount } = formData;

    if (!pixKey || !amount) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos",
        variant: "destructive",
      });
      return;
    }

    const amountValue = Number.parseFloat(amount);
    if (isNaN(amountValue) || amountValue <= 0) {
      toast({
        title: "Valor inválido",
        description: "Por favor, insira um valor válido maior que zero",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const result: TransactionResult = await initiatePixTransaction({
        pixKeyType,
        pixKey,
        amount: amountValue,
        token,
      });

      toast({
        title: "Transação iniciada com sucesso",
        description: `Transação Pix de R$ ${amountValue.toFixed(2)} iniciada`,
      });
    } catch (error: unknown) {
      let errorMessage = "Ocorreu um erro ao iniciar a transação";

      if (error instanceof Error) {
        if (error.message.includes("rate limit")) {
          errorMessage =
            "Limite de requisições atingido. Tente novamente mais tarde.";
        } else {
          errorMessage = error.message;
        }
      }

      toast({
        title: "Erro na transação",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="pixKeyType">Tipo de Chave Pix</Label>
        <Select
          value={formData.pixKeyType}
          onValueChange={handlePixKeyTypeChange}
          disabled={isLoading || !isAuthenticated}
        >
          <SelectTrigger id="pixKeyType">
            <SelectValue placeholder="Selecione o tipo de chave" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="cpf">CPF</SelectItem>
            <SelectItem value="cnpj">CNPJ</SelectItem>
            <SelectItem value="email">E-mail</SelectItem>
            <SelectItem value="phone">Telefone</SelectItem>
            <SelectItem value="random">Chave Aleatória</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="pixKey">Chave Pix</Label>
        <Input
          id="pixKey"
          type="text"
          value={formData.pixKey}
          onChange={handlePixKeyChange}
          placeholder="Digite a chave Pix"
          disabled={isLoading || !isAuthenticated}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="amount">Valor (R$)</Label>
        <Input
          id="amount"
          type="text"
          value={formData.amount}
          onChange={handleAmountChange}
          placeholder="0,00"
          disabled={isLoading || !isAuthenticated}
        />
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={isLoading || !isAuthenticated}
      >
        {isLoading ? "Processando..." : "Iniciar Transação Pix"}
      </Button>

      {!isAuthenticated && (
        <p className="text-sm text-red-500 text-center">
          Faça login para realizar uma transação
        </p>
      )}
    </form>
  );
}
