import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api/contact';

const contactApi = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

export const sendContactMessage = async ({ name, email, subject, message }) => {
  const { data } = await contactApi.post('/message', { name, email, subject, message });
  return data;
};

export const subscribeToMailingList = async ({ fullName, email }) => {
  const { data } = await contactApi.post('/subscribe', { fullName, email });
  return data;
};
