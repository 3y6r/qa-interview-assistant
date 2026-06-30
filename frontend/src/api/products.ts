import client from './client';

export const productsApi = {
  list: () => client.get<{ id: number; name: string }[]>('/products').then((r) => r.data),

  create: (data: { name: string }) =>
    client.post<{ id: number; name: string }>('/products', data).then((r) => r.data),

  update: (id: number, data: { name: string }) =>
    client.put<{ id: number; name: string }>(`/products/${id}`, data).then((r) => r.data),

  delete: (id: number) =>
    client.delete(`/products/${id}`).then((r) => r.data),
};
