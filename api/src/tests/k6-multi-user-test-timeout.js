import http from 'k6/http';
import { check, sleep } from 'k6';
import { uuidv4 } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';

export const options = {
  scenarios: {
    multi_user_test: {
      executor: 'per-vu-iterations',
      vus: 10,
      iterations: 5,
      maxDuration: '60s',
    }
  },
  thresholds: {
    http_req_failed: ['rate<0.5'], // Aumentando tolerância para até 50% de falhas
  },
  httpDebug: 'full',
  timeout: '120s',
};

const API_URL = 'http://localhost:4000/graphql';

const QUERY = `
  query {
    tokenStatus {
      availableTokens
      maxTokens
    }
  }
`;

export default function () {
  const userId = __VU;

  const randomIp = `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;

  const headers = {
    'Content-Type': 'application/json',
    'X-Forwarded-For': randomIp,
    'User-ID': `user-${userId}`,
    'Client-ID': uuidv4(),
  };

  const payload = JSON.stringify({
    query: QUERY
  });

  const res = http.post(API_URL, payload, {
    headers,
    timeout: '30s'
  });

  check(res, {
    'status é 200 ou 429': (r) => r.status === 200 || r.status === 429,
    'resposta recebida': (r) => r.status !== 0,
  });

  if (res.status === 200) {
    console.log(`Usuário ${userId} (IP: ${randomIp}) - Status: ${res.status} - Resposta OK`);
    try {
      const body = JSON.parse(res.body);
      if (body.data && body.data.tokenStatus) {
        console.log(`Tokens disponíveis: ${body.data.tokenStatus.availableTokens}`);
      }
    } catch (e) {
      console.log(`Erro ao analisar resposta: ${e.message}`);
    }
  } else {
    console.log(`Usuário ${userId} (IP: ${randomIp}) - Status: ${res.status}`);
  }

  sleep(Math.random() * 1 + 0.5);
}
