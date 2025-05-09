import http from 'k6/http';
import { check, sleep } from 'k6';
import { uuidv4 } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';

export const options = {
  scenarios: {
    multi_user_test: {
      executor: 'per-vu-iterations',
      vus: 20,           // 20 usuários virtuais
      iterations: 10,    // Cada usuário faz 10 requisições
      maxDuration: '60s',
    }
  },
  thresholds: {
    http_req_failed: ['rate<0.1'], // Menos de 10% de falhas
  },
};

// URL da API
const API_URL = 'http://localhost:4000/graphql';

// Query GraphQL genérica
const QUERY = `
  query {
    hello
  }
`;

export default function () {
  // Cada usuário virtual terá seu próprio ID
  const userId = __VU;

  // Gere um IP aleatório para simular diferentes usuários
  // Isso é importante para testar como o leaky bucket gerencia diferentes identificadores
  const randomIp = `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;

  // Cabeçalhos para simular diferentes IPs
  const headers = {
    'Content-Type': 'application/json',
    'X-Forwarded-For': randomIp,
    'User-ID': `user-${userId}`,
    'Client-ID': uuidv4(), // Identificador único por usuário
  };

  // Payload da requisição
  const payload = JSON.stringify({
    query: QUERY
  });

  // Faça a requisição
  const res = http.post(API_URL, payload, { headers });

  // Verifique a resposta
  check(res, {
    'status é 200 ou 429': (r) => r.status === 200 || r.status === 429,
  });

  // Log de detalhes
  console.log(`Usuário ${userId} (IP: ${randomIp}) - Status: ${res.status}`);

  // Pequena variação no tempo de espera entre requisições
  // para simular comportamento mais realista
  sleep(Math.random() * 0.5 + 0.1); // Entre 0.1 e 0.6 segundos
}
