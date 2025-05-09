import http from 'k6/http';
import { check, sleep } from 'k6';

// Diferentes tipos de testes de carga que você pode usar
export const options = {
  scenarios: {
    // Teste de pico (spike test): simula um aumento repentino de tráfego
    spike_test: {
      executor: 'ramping-arrival-rate',
      startRate: 5,
      timeUnit: '1s',
      preAllocatedVUs: 50,
      maxVUs: 100,
      stages: [
        { target: 50, duration: '10s' }, // Aumento rápido para 50 req/s em 10s
        { target: 50, duration: '20s' }, // Manter 50 req/s por 20s
        { target: 0, duration: '10s' },  // Volta ao normal em 10s
      ],
    },

    // Teste de carga constante (load test): simula carga constante
    load_test: {
      executor: 'constant-arrival-rate',
      rate: 20,                // 20 requisições por segundo
      timeUnit: '1s',
      duration: '30s',
      preAllocatedVUs: 20,
      maxVUs: 50,
    },

    // Teste de stress: aumenta gradualmente a carga até o sistema falhar
    stress_test: {
      executor: 'ramping-arrival-rate',
      startRate: 1,
      timeUnit: '1s',
      stages: [
        { target: 5, duration: '10s' },   // Normal
        { target: 10, duration: '10s' },  // Aumento médio
        { target: 20, duration: '10s' },  // Alto
        { target: 30, duration: '10s' },  // Muito alto
        { target: 40, duration: '10s' },  // Extremo
      ],
      preAllocatedVUs: 50,
      maxVUs: 100,
    },

    // Teste de resistência (soak test): verifica performance ao longo do tempo
    soak_test: {
      executor: 'constant-arrival-rate',
      rate: 5,
      timeUnit: '1s',
      duration: '2m',
      preAllocatedVUs: 10,
      maxVUs: 20,
    }
  },

  thresholds: {
    http_req_failed: ['rate<0.1'], // Menos de 10% de falhas
    http_req_duration: ['p(95)<500'], // 95% das requisições abaixo de 500ms
  },

  // Desabilite todos os cenários exceto o que você quer testar
  // Remova os comentários do cenário que deseja usar
  scenarios: {
    spike_test: {
      executor: 'ramping-arrival-rate',
      startRate: 5,
      timeUnit: '1s',
      preAllocatedVUs: 50,
      maxVUs: 100,
      stages: [
        { target: 50, duration: '10s' },
        { target: 50, duration: '20s' },
        { target: 0, duration: '10s' },
      ],
    },
    // Descomente o cenário que você quer testar
    // load_test: { ... },
    // stress_test: { ... },
    // soak_test: { ... },
  },
};

// URL da sua API - atualize para a porta e endpoint corretos
const API_URL = 'http://localhost:4000/graphql';

// Corpo da requisição GraphQL para testar o limite de taxa
const QUERY_PAYLOAD = JSON.stringify({
  query: `
    query {
      hello
    }
  `
});

export default function () {
  // Teste de API GraphQL
  const res = http.post(API_URL, QUERY_PAYLOAD, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Verifica se a resposta está ok ou foi limitada pelo rate limit (429)
  check(res, {
    'status é 200 ou 429': (r) => r.status === 200 || r.status === 429,
  });

  // Registre detalhes quando atingir o limite de taxa
  if (res.status === 429) {
    console.log(`Rate limit atingido: ${res.body}`);

    // Analisa o corpo da resposta para obter informações sobre o rate limit
    try {
      const body = JSON.parse(res.body);
      console.log(`Tokens disponíveis: ${body.tokenStatus?.available || 0}`);
      console.log(`Máximo de tokens: ${body.tokenStatus?.maximum || 0}`);
      console.log(`Tentar novamente em: ${body.tokenStatus?.retryAfterFormatted || 'desconhecido'}`);
    } catch (e) {
      // Se não for JSON ou não tiver a estrutura esperada
      console.log('Não foi possível analisar a resposta');
    }
  }

  // Pequena pausa entre requisições
  sleep(0.1);
}
