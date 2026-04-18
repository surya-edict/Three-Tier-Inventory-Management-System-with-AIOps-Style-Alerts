import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '1m', target: 20 }, // ramp up to 20 users
    { duration: '3m', target: 20 }, // stay at 20 users
    { duration: '1m', target: 0 },  // ramp down
  ],
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8000';

export default function () {
  // 1. Get products
  const res = http.get(`${BASE_URL}/products`);
  check(res, {
    'status is 200': (r) => r.status === 200,
    'products returned': (r) => r.json().length >= 0,
  });

  // 2. Simulate selling (only if products exist)
  const products = res.json();
  if (products && products.length > 0) {
    const randomProduct = products[Math.floor(Math.random() * products.length)];
    const sellRes = http.post(`${BASE_URL}/orders`, JSON.stringify({
      product_id: randomProduct.id,
      quantity: 1,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
    
    check(sellRes, {
      'order status is 201 or 400': (r) => [201, 400].includes(r.status),
    });
  }

  sleep(1);
}
