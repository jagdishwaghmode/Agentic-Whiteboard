import { PLANS } from '../config/razorpay.js';
import { getOrCreateAccount } from '../services/creditService.js';
import { createRazorpayOrder, verifyPayment } from '../services/razorpayService.js';

export const listPlans = (req, res) => res.json({ success: true, plans: Object.values(PLANS).map(({ id, rupees, credits }) => ({ id, rupees, credits })) });
export const getCredits = async (req, res, next) => { try { const account = await getOrCreateAccount(req.user); res.json({ success: true, credits: account.credits }); } catch (e) { next(e); } };
export const createOrder = async (req, res, next) => { try { res.json({ success: true, order: await createRazorpayOrder(req.user.uid, req.body.planId) }); } catch (e) { next(e); } };
export const verifyOrder = async (req, res, next) => { try { res.json({ success: true, ...(await verifyPayment(req.user.uid, req.body.planId, req.body.payment)) }); } catch (e) { next(e); } };
