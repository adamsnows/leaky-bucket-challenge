"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { initiatePixTransaction } from "@/lib/api";
import TokenDisplay from "./token-display";

type PixKeyType = "cpf" | "cnpj" | "email" | "phone" | "random";

interface TransactionResult {
  success: boolean;
  message: string;
  transactionId?: string;
}

interface PixTransactionFormProps {
  onComplete: () => void;
}

const pixTransactionSchema = z.object({
  pixKeyType: z.enum(["cpf", "cnpj", "email", "phone", "random"], {
    required_error: "Selecione um tipo de chave",
  }),
  pixKey: z.string().min(1, "Chave Pix é obrigatória"),
  amount: z.string().refine(
    (value) => {
      const amount = Number.parseFloat(value.replace(",", "."));
      return !isNaN(amount) && amount > 0;
    },
    { message: "Insira um valor válido maior que zero" }
  ),
});

type PixFormData = z.infer<typeof pixTransactionSchema>;

export default function PixTransactionForm({
  onComplete,
}: PixTransactionFormProps) {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [rateLimited, setRateLimited] = useState(false);
  const [retryAfter, setRetryAfter] = useState(0);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<PixFormData>({
    resolver: zodResolver(pixTransactionSchema),
    defaultValues: {
      pixKeyType: "cpf",
      pixKey: "",
      amount: "",
    },
  });

  const onSubmit = async (data: PixFormData): Promise<void> => {
    if (!isAuthenticated) {
      toast({
        title: "Não autenticado",
        description: "Você precisa fazer login para realizar uma transação",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setError(null);
    setRateLimited(false);
    setFormSubmitted(true);

    await new Promise((resolve) => setTimeout(resolve, 500));

    const amountValue = Number.parseFloat(data.amount.replace(",", "."));

    const response = await initiatePixTransaction({
      pixKeyType: data.pixKeyType,
      pixKey: data.pixKey,
      amount: amountValue,
    });

    if (!response.success) {
      if (response.errorCode === 429) {
        const retry = response.retryAfter || 30;

        setRateLimited(true);
        setRetryAfter(retry);
        setError(
          `Limite de tentativas excedido. Tente novamente em ${retry} segundos.`
        );

        toast({
          title: "Limite de tentativas excedido",
          description: "Aguarde um momento antes de tentar novamente.",
          variant: "destructive",
        });
      } else {
        setError(response.error || "Ocorreu um erro ao iniciar a transação");

        toast({
          title: "Erro na transação",
          description:
            response.error || "Ocorreu um erro ao iniciar a transação",
          variant: "destructive",
        });
      }
    }

    if (response.data) {
      toast({
        title: "Transação iniciada com sucesso",
        description: `Transação Pix de R$ ${amountValue.toFixed(2)} iniciada`,
      });

      onComplete();
    }

    setIsLoading(false);
    setTimeout(() => {
      setFormSubmitted(false);
    }, 2000);
  };

  const handleRateLimited = (seconds: number) => {
    setRateLimited(true);
    setRetryAfter(seconds);
  };

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    if (rateLimited && retryAfter > 0) {
      timeoutId = setTimeout(() => {
        setRateLimited(false);
        setRetryAfter(0);
      }, retryAfter * 1000);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [rateLimited, retryAfter]);

  return (
    <>
      <Card className="w-full max-w-xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Transação Pix</CardTitle>
          <CardDescription>
            Envie um pagamento Pix para qualquer chave
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="pixKeyType">Tipo de Chave Pix</Label>
              <Controller
                name="pixKeyType"
                control={control}
                render={({ field }) => (
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isLoading || !isAuthenticated || rateLimited}
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
                )}
              />
              {errors.pixKeyType && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.pixKeyType.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="pixKey">Chave Pix</Label>
              <Input
                id="pixKey"
                type="text"
                {...register("pixKey")}
                placeholder="Digite a chave Pix"
                disabled={isLoading || !isAuthenticated || rateLimited}
              />
              {errors.pixKey && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.pixKey.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Valor (R$)</Label>
              <Input
                id="amount"
                type="text"
                {...register("amount")}
                placeholder="0,00"
                disabled={isLoading || !isAuthenticated || rateLimited}
              />
              {errors.amount && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.amount.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || !isAuthenticated || rateLimited}
            >
              {isLoading
                ? "Processando..."
                : rateLimited
                ? "Aguarde..."
                : "Iniciar Transação Pix"}
            </Button>

            {!isAuthenticated && (
              <p className="text-sm text-red-500 text-center">
                Faça login para realizar uma transação
              </p>
            )}
          </form>
        </CardContent>
      </Card>

      <TokenDisplay
        isRateLimited={rateLimited}
        retryAfter={retryAfter}
        onRateLimited={handleRateLimited}
        key={formSubmitted ? "submitted" : "idle"}
      />
    </>
  );
}
