import api from './axios';

export const listProducts = (params) =>
    api.get('/products/', { params }).then((r) => r.data);

export const getProduct = (slug) =>
    api.get(`/products/${slug}/`).then((r) => r.data);

export const createProduct = (payload) =>
    api.post('/products/', payload).then((r) => r.data);

export const updateProduct = (slug, payload) =>
    api.patch(`/products/${slug}/`, payload).then((r) => r.data);

export const deleteProduct = (slug) =>
    api.delete(`/products/${slug}/`).then((r) => r.data);