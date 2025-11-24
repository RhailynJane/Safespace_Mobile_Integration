import http from 'k6/http';
import { sleep, check } from 'k6';

export const options = {
  vus: 5,
  duration: '30s'
};

const BASE_URL = __ENV.BASE_URL || 'http://host.docker.internal:3000';

export default function () {
  // Adjust endpoint path to match backend API route
  const res = http.get(`${BASE_URL}/api/announcements?orgId=sait&limit=10`);
  check(res, {
    'status is 200': r => r.status === 200,
    'body present': r => r.body && r.body.length > 0
  });
  sleep(1);
}
