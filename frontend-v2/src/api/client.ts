import axios from 'axios';
import { API_BASE_URL } from '../utils/constants';

const MOCK_TOKEN = 'mock-dev-token';

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${MOCK_TOKEN}` },
});

export default client;
