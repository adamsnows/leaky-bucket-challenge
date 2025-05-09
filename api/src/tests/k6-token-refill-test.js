import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  scenarios: {
    token_refill_test: {
      executor: 'shared-iterations',
      vus: 1, // Apenas um usuário para este teste
      iterations: 20,
      maxDuration: '5m',
    }
  },
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% das requisições abaixo de 500ms
  },
};

// URL da API
const API_URL = 'http://localhost:4000/graphql';

// Query para uma operação regular
const REGULAR_QUERY = JSON.stringify({
  query: `
    query {
      hello
    }
  `
});

// Query para verificar o status do token
const TOKEN_STATUS_QUERY = JSON.stringify({
  query: `
    query {
      tokenStatus {
        availableTokens
        maxTokens
      }
    }
  `
});

export default function () {
  // Primeiro, vamos verificar o status inicial do token
  let statusRes = http.post(API_URL, TOKEN_STATUS_QUERY, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  let initialTokens = 0;
  try {
    const body = JSON.parse(statusRes.body);
    initialTokens = body.data.tokenStatus.availableTokens;
    console.log(`Estado inicial - Tokens disponíveis: ${initialTokens}`);
  } catch (e) {
    console.log('Erro ao analisar a resposta inicial');
  }

  // Faça várias requisições para consumir tokens
  for (let i = 0; i < 5; i++) {
    let res = http.post(API_URL, REGULAR_QUERY, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    check(res, {
      'status ok': (r) => r.status === 200,
    });

    sleep(1);
  }

  // Verifique os tokens após consumo
  statusRes = http.post(API_URL, TOKEN_STATUS_QUERY, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  let afterConsumptionTokens = 0;
  try {
    const body = JSON.parse(statusRes.body);
    afterConsumptionTokens = body.data.tokenStatus.availableTokens;
    console.log(`Após consumo - Tokens disponíveis: ${afterConsumptionTokens}`);
  } catch (e) {
    console.log('Erro ao analisar a resposta após consumo');
  }

  // Espere tempo suficiente para alguns tokens serem restaurados
  // Ajuste conforme sua configuração de refill rate
  console.log('Esperando 60 segundos para refill de tokens...');
  sleep(60);

  // Verifique os tokens após tempo de espera
  statusRes = http.post(API_URL, TOKEN_STATUS_QUERY, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  let afterWaitTokens = 0;
  try {
    const body = JSON.parse(statusRes.body);
    afterWaitTokens = body.data.tokenStatus.availableTokens;
    console.log(`Após espera - Tokens disponíveis: ${afterWaitTokens}`);

    // Verifique se houve restauração de tokens
    if (afterWaitTokens > afterConsumptionTokens) {
      console.log(`Restauração detectada! +${afterWaitTokens - afterConsumptionTokens} tokens`);
    } else {
      console.log('Sem restauração detectada. Verifique a configuração do refill rate.');
    }
  } catch (e) {
    console.log('Erro ao analisar a resposta após espera');
  }
}
