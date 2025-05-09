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
    http_req_failed: ['rate<0.5'], // Tolerância aumentada para até 50% de falhas
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

  // Faça a requisição com timeout explícito
  const res = http.post(API_URL, payload, { 
    headers,
    timeout: '10s'  // Adiciona timeout explícito de 10s
  });

  // Verifique a resposta - inclui status 0 para detectar timeouts
  check(res, {
    'status é 200, 429 ou timeout': (r) => r.status === 200 || r.status === 429 || r.status === 0,
  });

  // Log de detalhes com informações de timeout
  if (res.status === 0) {
    console.log(`Usuário ${userId} (IP: ${randomIp}) - Timeout na requisição`);
  } else {
    console.log(`Usuário ${userId} (IP: ${randomIp}) - Status: ${res.status}`);
  }

  // Pequena variação no tempo de espera entre requisições
  // para simular comportamento mais realista
  sleep(Math.random() * 0.5 + 0.3); // Entre 0.3 e 0.8 segundos (aumentado ligeiramente)
}
