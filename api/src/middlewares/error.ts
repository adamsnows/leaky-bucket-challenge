import { Context, Next } from "koa";
import { config } from "../config/environment";

interface AppError extends Error {
  status?: number;
  code?: string;
  data?: unknown;
}

const errorMiddleware = async (ctx: Context, next: Next): Promise<void> => {
  try {
    await next();
  } catch (error: unknown) {
    const err: AppError =
      error instanceof Error ? error : new Error(String(error));

    ctx.status = err.status || 500;

    const responseBody: {
      success: false;
      message: string;
      code?: string;
      data?: unknown;
      stack?: string;
    } = {
      success: false,
      message: err.message || "Internal Server Error",
      ...(err.code && { code: err.code }),
      ...(typeof err.data === "object" && err.data !== null
        ? { data: err.data }
        : {}),
    };

    if (config.nodeEnv !== "production") {
      responseBody.stack = err.stack;
    }

    ctx.body = responseBody;
    ctx.app.emit("error", err, ctx);
  }
};

export default errorMiddleware;
