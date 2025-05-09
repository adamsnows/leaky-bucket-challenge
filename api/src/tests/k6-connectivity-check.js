import http from 'k6/http';
import { check } from 'k6';

export const options = {
  vus: 1,
  iterations: 1,
  thresholds: {
    http_req_failed: ['rate<0.1'],
  },
};

const API_URL = 'http://localhost:4000/graphql';

const QUERY_PAYLOAD = JSON.stringify({
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
  console.log('Verificando conectividade com o servidor GraphQL...');

  const res = http.post(API_URL, QUERY_PAYLOAD, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const success = check(res, {
    'servidor está respondendo (status 200)': (r) => r.status === 200,
    'resposta contém dados válidos': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body && body.data && body.data.tokenStatus;
      } catch (e) {
        return false;
      }
    },
  });

  if (success) {
    console.log('✅ Conectividade com o servidor verificada com sucesso!');
    console.log(`📊 Tokens disponíveis: ${JSON.parse(res.body).data.tokenStatus.availableTokens}`);
    console.log(`📊 Capacidade máxima: ${JSON.parse(res.body).data.tokenStatus.maxTokens}`);
  } else {
    console.log('❌ Falha na verificação de conectividade');
    console.log(`Status: ${res.status}`);
    console.log(`Resposta: ${res.body}`);
  }
}
