import axios from 'axios';
import { getToken } from '../utils/secureStorage';

const BASE_URL = 'http://localhost:5000/api/checkout';

const checkoutApi = async () => {
  const token = await getToken();
  return axios.create({
    baseURL: BASE_URL,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
};

const createIdempotencyKey = () =>
  `checkout-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

export const createCheckoutIntent = async () => {
  const api = await checkoutApi();
  const { data } = await api.post(
    '/intent',
    {},
    { headers: { 'Idempotency-Key': createIdempotencyKey() } }
  );
  return data;
};
