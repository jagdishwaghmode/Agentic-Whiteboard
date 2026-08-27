import crypto from 'crypto';
import { getRazorpayConfig, PLANS } from '../config/razorpay.js';
import { addPurchasedCredits } from './creditService.js';
import CreditTransaction from '../models/CreditTransaction.js';

export async function createRazorpayOrder(uid, planId) {
  const plan = PLANS[planId];
  if (!plan) {
    const e = new Error('Invalid pricing plan.');
    e.statusCode = 400;
    throw e;
  }

  const { keyId, keySecret, isMock } = getRazorpayConfig();

  if (isMock) {
    const mockOrder = {
      id: `order_mock_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      entity: 'order',
      amount: plan.amount,
      currency: 'INR',
      receipt: `receipt_${uid}_${Date.now()}`,
      status: 'created',
      keyId,
      isMock: true,
      plan: { id: plan.id, name: plan.name, rupees: plan.rupees, credits: plan.credits },
    };
    return mockOrder;
  }

  const response = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`,
    },
    body: JSON.stringify({
      amount: plan.amount,
      currency: 'INR',
      receipt: `credits_${uid}_${Date.now()}`,
      notes: { uid, planId },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Razorpay order creation failed (${response.status}): ${errText}`);
  }

  const order = await response.json();
  return {
    ...order,
    keyId,
    plan: { id: plan.id, name: plan.name, rupees: plan.rupees, credits: plan.credits },
  };
}

export async function verifyPayment(uid, planId, payment) {
  const plan = PLANS[planId];
  if (!plan || !payment?.razorpay_order_id || !payment?.razorpay_payment_id) {
    const e = new Error('Invalid payment verification payload.');
    e.statusCode = 400;
    throw e;
  }

  const { keySecret, isMock } = getRazorpayConfig();

  if (isMock || payment.razorpay_signature === 'mock_signature_dev') {
    const reference = payment.razorpay_payment_id;
    const existing = await CreditTransaction.findOne({ uid, reference, type: 'purchase' });
    if (existing) return { credits: plan.credits, alreadyProcessed: true };

    const account = await addPurchasedCredits(uid, plan.credits, reference, {
      planId,
      orderId: payment.razorpay_order_id,
    });
    return { credits: account.credits, added: plan.credits };
  }

  if (!payment.razorpay_signature) {
    const e = new Error('Payment signature is missing.');
    e.statusCode = 400;
    throw e;
  }

  const expected = crypto
    .createHmac('sha256', keySecret)
    .update(`${payment.razorpay_order_id}|${payment.razorpay_payment_id}`)
    .digest('hex');

  if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(payment.razorpay_signature))) {
    const e = new Error('Payment signature verification failed.');
    e.statusCode = 400;
    throw e;
  }

  const reference = payment.razorpay_payment_id;
  const existing = await CreditTransaction.findOne({ uid, reference, type: 'purchase' });
  if (existing) return { credits: plan.credits, alreadyProcessed: true };

  const account = await addPurchasedCredits(uid, plan.credits, reference, {
    planId,
    orderId: payment.razorpay_order_id,
  });

  return { credits: account.credits, added: plan.credits };
}

export default { createRazorpayOrder, verifyPayment };
