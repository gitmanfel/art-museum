import axios from 'axios';
import { getToken } from '../utils/secureStorage';

const BASE_URL = 'http://localhost:5000/api/admin';

const getAdminApi = async () => {
  const token = await getToken();
  return axios.create({
    baseURL: BASE_URL,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });
};

export const getAdminOverview = async () => {
  const api = await getAdminApi();
  const { data } = await api.get('/overview');
  return data;
};

export const getAdminOrders = async (limit = 50) => {
  const api = await getAdminApi();
  const { data } = await api.get('/orders', { params: { limit } });
  return data.orders;
};

export const getAdminUsers = async (limit = 50) => {
  const api = await getAdminApi();
  const { data } = await api.get('/users', { params: { limit } });
  return data.users;
};

export const createAdminCollection = async (payload) => {
  const api = await getAdminApi();
  const { data } = await api.post('/collections', payload);
  return data.collection;
};

export const updateAdminCollection = async (id, payload) => {
  const api = await getAdminApi();
  const { data } = await api.patch(`/collections/${id}`, payload);
  return data.collection;
};

export const deleteAdminCollection = async (id) => {
  const api = await getAdminApi();
  const { data } = await api.delete(`/collections/${id}`);
  return data;
};

export const createAdminExhibition = async (payload) => {
  const api = await getAdminApi();
  const { data } = await api.post('/exhibitions', payload);
  return data.exhibition;
};

export const updateAdminExhibition = async (id, payload) => {
  const api = await getAdminApi();
  const { data } = await api.patch(`/exhibitions/${id}`, payload);
  return data.exhibition;
};

export const deleteAdminExhibition = async (id) => {
  const api = await getAdminApi();
  const { data } = await api.delete(`/exhibitions/${id}`);
  return data;
};
