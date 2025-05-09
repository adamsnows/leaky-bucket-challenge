import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  scenarios: {
    token_status_test: {
      executor: 'constant-arrival-rate',
      rate: 10,
      timeUnit: '1s',
      duration: '30s',
      preAllocatedVUs: 10,
      maxVUs: 20,
    }
  },
  thresholds: {
    http_req_failed: ['rate<0.01'], // Menos de 1% de falhas
    http_req_duration: ['p(95)<200'], // 95% das requisições abaixo de 200ms para endpoint de status
  },
};

// URL da API
const API_URL = 'http://localhost:4000/graphql';

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
  // Verifica o status do token
  const res = http.post(API_URL, TOKEN_STATUS_QUERY, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Verifica se a resposta está ok
  check(res, {
    'status é 200': (r) => r.status === 200,
    'contém dados de tokenStatus': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.data && body.data.tokenStatus;
      } catch (e) {
        return false;
      }
    },
  });

  // Se a resposta for bem-sucedida, registre os detalhes
  if (res.status === 200) {
    try {
      const body = JSON.parse(res.body);
      if (body.data && body.data.tokenStatus) {
        console.log(`Tokens disponíveis: ${body.data.tokenStatus.availableTokens}`);
        console.log(`Máximo de tokens: ${body.data.tokenStatus.maxTokens}`);
      }
    } catch (e) {
      console.log('Não foi possível analisar a resposta');
    }
  }

  sleep(0.5);
}
