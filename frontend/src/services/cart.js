import axios from 'axios';
import { getToken } from '../utils/secureStorage';

const BASE_URL = 'http://localhost:5000/api/cart';

const cartApi = async () => {
  const token = await getToken();
  return axios.create({
    baseURL: BASE_URL,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
};

export const fetchCart = async () => {
  const api = await cartApi();
  const { data } = await api.get('/');
  return data;
};

export const addToCart = async ({ itemType, itemId, quantity = 1 }) => {
  const api = await cartApi();
  const { data } = await api.post('/', { itemType, itemId, quantity });
  return data;
};

export const removeFromCart = async (cartItemId) => {
  const api = await cartApi();
  const { data } = await api.delete(`/${cartItemId}`);
  return data;
};

export const clearCartApi = async () => {
  const api = await cartApi();
  const { data } = await api.delete('/');
  return data;
};
