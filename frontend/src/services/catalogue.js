import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';

export const getCatalogueApi = () =>
  axios.create({ baseURL: `${BASE_URL}/catalogue`, headers: { 'Content-Type': 'application/json' } });

export const getTicketTypes = async () => {
  const { data } = await getCatalogueApi().get('/tickets');
  return data.ticketTypes;
};

export const getMembershipTiers = async () => {
  const { data } = await getCatalogueApi().get('/memberships');
  return data.membershipTiers;
};

export const getProducts = async () => {
  const { data } = await getCatalogueApi().get('/products');
  return data.products;
};

export const getProduct = async (id) => {
  const { data } = await getCatalogueApi().get(`/products/${id}`);
  return data.product;
};
