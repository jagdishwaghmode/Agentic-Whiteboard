import 'dotenv/config';

export const PLANS = Object.freeze({
  starter: { id: 'starter', name: 'Starter Plan', amount: 49900, rupees: 499, credits: 500, badge: 'Basic' },
  pro: { id: 'pro', name: 'Pro Architecture', amount: 79900, rupees: 799, credits: 1500, badge: 'Most Popular', popular: true },
  enterprise: { id: 'enterprise', name: 'Enterprise Ultimate', amount: 199900, rupees: 1999, credits: 5000, badge: 'Best Value' },
});

export function getRazorpayConfig() {
  const keyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_mock_key_id';
  const keySecret = process.env.RAZORPAY_KEY_SECRET || 'mock_key_secret';
  const isMock = !process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID.includes('your-');
  return { keyId, keySecret, isMock };
}
