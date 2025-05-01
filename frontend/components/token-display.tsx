"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useAuth } from "@/context/auth-context";
import { Progress } from "@/components/ui/progress";
import { fetchTokenStatus } from "@/lib/api";
import { Info, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface TokenStatus {
  availableTokens: number;
  maxTokens: number;
}

interface TokenDisplayProps {
  onRateLimited?: (retryAfter: number) => void;
  isRateLimited?: boolean;
  retryAfter?: number;
}

export default function TokenDisplay({
  onRateLimited,
  isRateLimited = false,
  retryAfter = 0,
}: TokenDisplayProps) {
  const [tokenStatus, setTokenStatus] = useState<TokenStatus | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const prevTokensRef = useRef<number | null>(null);
  const [isIncreasing, setIsIncreasing] = useState<boolean | null>(null);
  const updateTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastUpdateTimeRef = useRef<number>(0);

  const updateTokenStatus = useCallback(
    async (force = false): Promise<void> => {
      const now = Date.now();
      if (!force && now - lastUpdateTimeRef.current < 10000) {
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetchTokenStatus();

        if (!response.success || !response.data) {
          if (response.error?.includes("429")) {
            setError("Limite de requisições atingido");
            if (onRateLimited) {
              const retryMatch = response.error.match(/retry after (\d+)/i);
              const retryAfterTime = retryMatch
                ? parseInt(retryMatch[1], 10)
                : 30;
              onRateLimited(retryAfterTime);
            }
          } else {
            setError(
              response.error || "Não foi possível carregar o status dos tokens"
            );
          }
          return;
        }

        const status = response.data;

        if (
          prevTokensRef.current !== null &&
          prevTokensRef.current !== status.availableTokens
        ) {
          setIsIncreasing(status.availableTokens > prevTokensRef.current);
          prevTokensRef.current = status.availableTokens;
          lastUpdateTimeRef.current = now;
        } else if (prevTokensRef.current === null) {
          prevTokensRef.current = status.availableTokens;
          lastUpdateTimeRef.current = now;
        } else {
        }

        setTokenStatus(status);
      } catch (err) {
        setError("Erro inesperado ao carregar o status dos tokens");
      } finally {
        setIsLoading(false);
      }
    },
    [onRateLimited]
  );

  useEffect(() => {
    updateTokenStatus(true);

    const intervalId = setInterval(() => {
      updateTokenStatus();
    }, 10000);

    return () => {
      clearInterval(intervalId);
      if (updateTimerRef.current) {
        clearTimeout(updateTimerRef.current);
      }
    };
  }, [updateTokenStatus, isRateLimited]);

  useEffect(() => {
    if (isRateLimited) {
      if (updateTimerRef.current) {
        clearTimeout(updateTimerRef.current);
      }
      updateTimerRef.current = setTimeout(() => {
        updateTokenStatus(true);
      }, 2000);
    } else {
      updateTokenStatus(true);
    }
  }, [isRateLimited, updateTokenStatus]);

  const availableTokens = isRateLimited ? 0 : tokenStatus?.availableTokens ?? 0;
  const maxTokens = tokenStatus?.maxTokens ?? 10;
  const progressPercentage = (availableTokens / maxTokens) * 100;

  return (
    <div className="mt-2 p-6 border rounded-md bg-background shadow-sm max-w-xl mx-auto w-full">
      <div className="flex items-center gap-2 mb-2">
        {isRateLimited ? (
          <AlertTriangle className="h-5 w-5 text-destructive" />
        ) : (
          <Info className="h-5 w-5 text-primary" />
        )}
        <h3 className="font-medium">Status de limite de requisições</h3>
      </div>

      {isLoading && tokenStatus === null ? (
        <div className="space-y-2">
          <div className="animate-pulse h-4 bg-muted rounded w-3/4"></div>
          <div className="animate-pulse h-6 bg-muted rounded w-full"></div>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm">Tokens disponíveis:</span>
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={availableTokens}
                initial={{ opacity: 0, y: isIncreasing ? 20 : -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className={`text-xl font-bold ${
                  availableTokens < 2
                    ? "text-destructive"
                    : availableTokens < maxTokens / 2
                    ? "text-amber-500"
                    : "text-green-500"
                }`}
              >
                {availableTokens} / {maxTokens}
              </motion.span>
            </AnimatePresence>
          </div>

          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <Progress
              value={progressPercentage}
              className={`h-2.5 ${
                availableTokens < 2
                  ? "bg-red-200"
                  : availableTokens < maxTokens / 2
                  ? "bg-amber-200"
                  : "bg-green-200"
              }`}
            />
          </motion.div>

          {isRateLimited && retryAfter > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-2 p-2 bg-destructive/10 rounded text-sm text-destructive font-medium"
            >
              Limite atingido! Tokens serão recuperados em aproximadamente{" "}
              {retryAfter} segundos.
            </motion.div>
          )}

          <div className="text-xs text-muted-foreground mt-3 space-y-1">
            <p>• Cada requisição consome 1 token</p>
            <p>• Os tokens são recarregados gradualmente com o tempo</p>
            <p>
              • Se todos os tokens forem consumidos, você receberá um mensagem
              de erro.
            </p>
          </div>
        </>
      )}

      {error && !isRateLimited && (
        <div className="mt-2 p-2 bg-destructive/10 rounded text-sm text-destructive">
          {error}
        </div>
      )}
    </div>
  );
}
