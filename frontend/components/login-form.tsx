"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { loginUser } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import TokenDisplay from "./token-display";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Alert, AlertDescription } from "./ui/alert";
import Link from "next/link";

interface LoginFormProps {
  onSuccess: () => void;
}

const loginSchema = z.object({
  email: z.string().email("Email inválido").min(1, "Email é obrigatório"),
  password: z.string().min(1, "Senha é obrigatória"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginForm({ onSuccess }: LoginFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rateLimited, setRateLimited] = useState(false);
  const [retryAfter, setRetryAfter] = useState(0);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);
    setError(null);
    setRateLimited(false);
    setFormSubmitted(true);

    const response = await loginUser({
      email: data.email,
      password: data.password,
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
        setError(response.error || "Ocorreu um erro durante o login");

        toast({
          title: "Erro no login",
          description: response.error || "Ocorreu um erro durante o login",
          variant: "destructive",
        });
      }
    }

    if (response.data) {
      localStorage.setItem("authToken", response.data.token);
      localStorage.setItem("authUser", JSON.stringify(response.data.user));

      toast({
        title: "Login realizado com sucesso!",
        description: "Bem-vindo de volta.",
        variant: "default",
      });

      onSuccess();
    }

    setLoading(false);
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
          <CardTitle className="text-2xl font-bold">Entrar</CardTitle>
          <CardDescription>
            Acesse sua conta para usar a plataforma
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
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...register("email")}
                placeholder="seu.email@exemplo.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                {...register("password")}
                placeholder="Digite sua senha"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.password.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={loading || rateLimited}
              className="w-full"
            >
              {loading ? "Entrando..." : rateLimited ? "Aguarde..." : "Entrar"}
            </Button>
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
