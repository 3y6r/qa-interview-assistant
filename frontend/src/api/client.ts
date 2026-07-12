import axios from 'axios';
import { API_BASE_URL } from '../utils/constants';
import { toSnakeCase, toCamelCase } from '../utils/case-convert';

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

client.interceptors.request.use((config) => {
  if (config.data) config.data = toSnakeCase(config.data);
  if (config.params) config.params = toSnakeCase(config.params);
  return config;
});

client.interceptors.response.use((response) => {
  if (response.data) response.data = toCamelCase(response.data);
  return response;
});

export default client;
