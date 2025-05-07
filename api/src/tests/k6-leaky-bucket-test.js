import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {

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
  },
  thresholds: {
    http_req_failed: ['rate<1'],
  },
};

const API_URL = 'http://localhost:3000/api/test-endpoint';

export default function () {
  const res = http.get(API_URL, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  check(res, {
    'status is 200 or 429': (r) => r.status === 200 || r.status === 429,
  });

  if (res.status === 429) {
    console.log(`Rate limit hit: ${res.body}`);
  }

  sleep(0.1);
}