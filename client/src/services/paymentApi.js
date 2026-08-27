import api from './api';

export const getCredits = async () => (await api.get('/payments/credits')).data;
export const getPlans = async () => (await api.get('/payments/plans')).data;
export const createOrder = async (planId) => (await api.post('/payments/create-order', { planId })).data;
export const verifyPayment = async (planId, payment) => (await api.post('/payments/verify', { planId, payment })).data;

export default { getCredits, getPlans, createOrder, verifyPayment };
