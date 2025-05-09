// @ts-nocheck
import { Context } from 'koa';
import errorMiddleware from '../middlewares/error';

describe('Error Middleware', () => {
  let ctx;
  let next;

  beforeEach(() => {
    ctx = {
      status: 200,
      app: {
        emit: jest.fn(),
      },
    };
    next = jest.fn();
  });

  test('deve continuar a execução se não houver erro', async () => {
    next.mockResolvedValue(undefined);

    await errorMiddleware(ctx, next);

    expect(next).toHaveBeenCalled();
    expect(ctx.status).toBe(200);
  });

  test('deve tratar erro com status personalizado', async () => {
    const error = new Error('Erro de teste');
    error.status = 400;
    error.code = 'BAD_REQUEST';
    next.mockRejectedValue(error);

    await errorMiddleware(ctx, next);

    expect(ctx.status).toBe(400);
    expect(ctx.body).toHaveProperty('success', false);
    expect(ctx.body).toHaveProperty('message', 'Erro de teste');
    expect(ctx.body).toHaveProperty('code', 'BAD_REQUEST');
    expect(ctx.app.emit).toHaveBeenCalledWith('error', error, ctx);
  });

  test('deve tratar erro sem status personalizado', async () => {
    const error = new Error('Erro interno');
    next.mockRejectedValue(error);

    await errorMiddleware(ctx, next);

    expect(ctx.status).toBe(500);
    expect(ctx.body).toHaveProperty('success', false);
    expect(ctx.body).toHaveProperty('message', 'Erro interno');
    expect(ctx.app.emit).toHaveBeenCalledWith('error', error, ctx);
  });

  test('deve incluir o stack no ambiente não-produção', async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    const error = new Error('Erro com stack');
    error.stack = 'Stack trace simulada';
    next.mockRejectedValue(error);

    await errorMiddleware(ctx, next);

    expect(ctx.body).toHaveProperty('stack', 'Stack trace simulada');

    process.env.NODE_ENV = originalEnv;
  });

  test('deve tratar erros com dados adicionais', async () => {
    const error = new Error('Erro com dados');
    error.data = { detalhe: 'Informação adicional' };
    next.mockRejectedValue(error);

    await errorMiddleware(ctx, next);

    expect(ctx.body).toHaveProperty('data');
    expect(ctx.body.data).toEqual({ detalhe: 'Informação adicional' });
  });

  test('deve tratar erros que não são instâncias de Error', async () => {
    next.mockRejectedValue('Esta é uma mensagem de string');

    await errorMiddleware(ctx, next);

    expect(ctx.status).toBe(500);
    expect(ctx.body).toHaveProperty('message', 'Esta é uma mensagem de string');
  });
});