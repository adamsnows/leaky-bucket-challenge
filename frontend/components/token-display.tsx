"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { Progress } from "@/components/ui/progress";
import { fetchTokenStatus } from "@/lib/api";

// Interface para status de tokens
interface TokenStatus {
  availableTokens: number;
  maxTokens: number;
}

export default function TokenDisplay() {
  // Estado com tipagem para tokens
  const [tokenStatus, setTokenStatus] = useState<TokenStatus | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated, token } = useAuth();

  useEffect(() => {
    const getTokenStatus = async (): Promise<void> => {
      if (!isAuthenticated) {
        setTokenStatus(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const status: TokenStatus = await fetchTokenStatus(token);
        setTokenStatus(status);
      } catch (err: unknown) {
        setError("Não foi possível carregar o status dos tokens");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    getTokenStatus();

    // Refresh token status every 30 seconds
    const intervalId = setInterval(getTokenStatus, 30000);

    return () => clearInterval(intervalId);
  }, [isAuthenticated, token]);

  if (!isAuthenticated) {
    return (
      <div className="text-center py-4 text-gray-500">
        Faça login para ver seu status de tokens
      </div>
    );
  }

  if (isLoading && tokenStatus === null) {
    return (
      <div className="text-center py-4">
        <div className="animate-pulse h-4 bg-gray-200 rounded w-3/4 mx-auto mb-2"></div>
        <div className="animate-pulse h-8 bg-gray-200 rounded w-full mx-auto"></div>
      </div>
    );
  }

  if (error) {
    return <div className="text-center py-4 text-red-500">{error}</div>;
  }

  // Valores seguros com fallback para zero
  const availableTokens = tokenStatus?.availableTokens ?? 0;
  const maxTokens = tokenStatus?.maxTokens ?? 10;
  const progressPercentage = (availableTokens / maxTokens) * 100;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium">Tokens disponíveis:</span>
        <span className="text-lg font-bold">
          {availableTokens} / {maxTokens}
        </span>
      </div>

      <Progress value={progressPercentage} className="h-2" />

      <div className="text-xs text-gray-500 mt-2">
        <p>
          Cada requisição consome 1 token. Tokens são recarregados à taxa de 1
          por hora.
        </p>
        <p>Máximo de {maxTokens} tokens por usuário.</p>
      </div>
    </div>
  );
}
