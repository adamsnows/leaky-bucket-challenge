"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Alert, AlertDescription } from "./ui/alert";
import Link from "next/link";
import { registerUser } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import TokenDisplay from "./token-display";

interface RegisterFormProps {
  onSuccess?: () => void;
}

const registerSchema = z
  .object({
    name: z.string().min(1, "Nome é obrigatório"),
    email: z.string().email("Email inválido").min(1, "Email é obrigatório"),
    password: z
      .string()
      .min(6, "Senha deve ter pelo menos 6 caracteres")
      .min(1, "Senha é obrigatória"),
    confirmPassword: z.string().min(1, "Confirme sua senha"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterForm({ onSuccess }: RegisterFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rateLimited, setRateLimited] = useState(false);
  const [retryAfter, setRetryAfter] = useState(0);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setLoading(true);
    setError(null);
    setRateLimited(false);
    setFormSubmitted(true);

    const { confirmPassword, ...formData } = data;

    const response = await registerUser({
      username: formData.name,
      email: formData.email,
      password: formData.password,
    });

    if (!response.success) {
      if (response.errorCode === 429) {
        // Usa retryAfter se disponível, ou um valor padrão de 30 segundos
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
        setError(response.error || "Ocorreu um erro durante o cadastro");

        toast({
          title: "Erro no cadastro",
          description: response.error || "Ocorreu um erro durante o cadastro",
          variant: "destructive",
        });
      }
    }

    if (response.data) {
      localStorage.setItem("authToken", response.data.token);
      localStorage.setItem("authUser", JSON.stringify(response.data.user));

      toast({
        title: "Cadastro realizado com sucesso!",
        description: "Você já pode acessar a plataforma.",
        variant: "default",
      });

      reset();

      if (onSuccess) {
        onSuccess();
      }
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
    <div className="p-6">
      <Card className="w-full max-w-xl mx-auto ">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Cadastre-se</CardTitle>
          <CardDescription>
            Crie sua conta para acessar a plataforma
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
              <Label htmlFor="name">Nome completo</Label>
              <Input
                id="name"
                type="text"
                {...register("name")}
                placeholder="Digite seu nome completo"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.name.message}
                </p>
              )}
            </div>

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
                placeholder="Crie uma senha segura"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar senha</Label>
              <Input
                id="confirmPassword"
                type="password"
                {...register("confirmPassword")}
                placeholder="Digite novamente sua senha"
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={loading || rateLimited}
              className="w-full"
            >
              {loading
                ? "Cadastrando..."
                : rateLimited
                ? "Aguarde..."
                : "Cadastrar"}
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
    </div>
  );
}
