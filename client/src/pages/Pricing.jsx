import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import paymentApi from '../services/paymentApi';

const FAQ_ITEMS = [
  {
    q: 'How do AI credits work?',
    a: 'Each AI diagram generation consumes 50 credits. Your credits never expire and are automatically refreshed monthly upon subscription renewal.',
  },
  {
    q: 'Are the generated diagrams fully editable?',
    a: 'Yes! Every diagram is generated as 100% native Excalidraw elements (rectangles, ellipses, diamonds, text, arrows). You can select, move, scale, and re-label any element.',
  },
  {
    q: 'How secure is the payment process?',
    a: 'All payments are processed securely through Razorpay using 256-bit SSL encryption. We never store your card details on our servers.',
  },
  {
    q: 'Can I upgrade or cancel my plan anytime?',
    a: 'Absolutely! You can upgrade your plan or add top-up credit packs whenever you need extra capacity.',
  },
];

const Pricing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [billingCycle, setBillingCycle] = useState('monthly');
  const [credits, setCredits] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [purchasingPlan, setPurchasingPlan] = useState(null);
  const [notification, setNotification] = useState(null);
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [creditsRes, plansRes] = await Promise.all([
        paymentApi.getCredits(),
        paymentApi.getPlans(),
      ]);
      setCredits(creditsRes.credits);
      setPlans(plansRes.plans || []);
    } catch (err) {
      console.warn('Failed to load credit data:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve, reject) => {
      if (window.Razorpay) return resolve(true);
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => reject(new Error('Failed to load Razorpay SDK'));
      document.body.appendChild(script);
    });
  };

  const handleSubscribe = async (planId) => {
    setPurchasingPlan(planId);
    setNotification(null);

    try {
      const { order } = await paymentApi.createOrder(planId);

      if (order.isMock) {
        const mockPayment = {
          razorpay_order_id: order.id,
          razorpay_payment_id: `pay_mock_${Date.now()}`,
          razorpay_signature: 'mock_signature_dev',
        };

        const result = await paymentApi.verifyPayment(planId, mockPayment);
        setCredits(result.credits);
        setNotification({
          type: 'success',
          message: `Payment Successful! Added ${result.added || order.plan.credits} credits to your balance.`,
        });
        setPurchasingPlan(null);
        return;
      }

      await loadRazorpayScript();

      const options = {
        key: order.keyId,
        amount: order.amount,
        currency: order.currency || 'INR',
        name: 'AI Agentic Whiteboard',
        description: `${order.plan?.name || 'Pro Subscription'} (${order.plan?.credits} AI Credits)`,
        order_id: order.id,
        prefill: {
          name: user?.displayName || '',
          email: user?.email || '',
        },
        theme: {
          color: '#4f46e5',
        },
        handler: async (response) => {
          try {
            const result = await paymentApi.verifyPayment(planId, response);
            setCredits(result.credits);
            setNotification({
              type: 'success',
              message: `Payment Successful! ${result.added || order.plan.credits} AI credits added to your account.`,
            });
          } catch (verifyErr) {
            setNotification({
              type: 'error',
              message: verifyErr.message || 'Payment verification failed.',
            });
          } finally {
            setPurchasingPlan(null);
          }
        },
        modal: {
          ondismiss: () => {
            setPurchasingPlan(null);
          },
        },
      };

      const razorpayInstance = new window.Razorpay(options);
      razorpayInstance.open();
    } catch (err) {
      setNotification({
        type: 'error',
        message: err.message || 'Unable to initiate Razorpay checkout.',
      });
      setPurchasingPlan(null);
    }
  };

  const getPriceDisplay = (basePrice) => {
    if (billingCycle === 'yearly') {
      const discounted = Math.round(basePrice * 0.8);
      return { price: discounted, period: '/mo billed annually' };
    }
    return { price: basePrice, period: '/month' };
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar showBack={true} />

      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Notification Banner */}
        {notification && (
          <div
            className={`mb-8 flex items-center justify-between rounded-xl p-4 text-sm font-medium shadow-sm transition-all ${
              notification.type === 'success'
                ? 'border border-green-200 bg-green-50 text-green-800 dark:border-green-900/50 dark:bg-green-900/20 dark:text-green-300'
                : 'border border-red-200 bg-red-50 text-red-800 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-300'
            }`}
          >
            <span>{notification.message}</span>
            <button
              onClick={() => setNotification(null)}
              className="ml-4 font-bold opacity-60 hover:opacity-100"
            >
              ✕
            </button>
          </div>
        )}

        {/* Hero Header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3.5 py-1 text-xs font-semibold text-brand-700 dark:border-brand-900/50 dark:bg-brand-900/30 dark:text-brand-300">
            <span>Power Your Architectural Workflow</span>
          </div>

          <h1 className="mt-4 text-3xl font-extrabold text-gray-900 dark:text-white sm:text-5xl">
            Flexible Plans for Creative Engineers
          </h1>

          <p className="mx-auto mt-3 max-w-2xl text-base text-gray-500 dark:text-gray-400 sm:text-lg">
            Generate high-level architecture diagrams, flowcharts, microservices schemas, and sequence flows with Google Gemini AI.
          </p>

          {/* Credits Balance Banner */}
          <div className="mt-6 inline-flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-5 py-2.5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <span className="flex h-3 w-3 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Current Balance: <strong className="text-brand-600 dark:text-brand-400">{credits !== null ? `${credits} Credits` : 'Loading...'}</strong>
            </span>
            <span className="text-xs text-gray-400 dark:text-gray-500">
              (50 credits = 1 AI Diagram)
            </span>
          </div>

          {/* Billing Switch */}
          <div className="mt-8 flex items-center justify-center gap-3">
            <span className={`text-sm font-medium ${billingCycle === 'monthly' ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>
              Monthly Billing
            </span>
            <button
              onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
              className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-brand-600 transition-colors duration-200 ease-in-out focus:outline-none"
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  billingCycle === 'yearly' ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
            <span className={`flex items-center gap-1.5 text-sm font-medium ${billingCycle === 'yearly' ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>
              Yearly Billing
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-bold text-green-700 dark:bg-green-900/40 dark:text-green-400">
                Save 20%
              </span>
            </span>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="mt-12 grid gap-8 lg:grid-cols-3 lg:items-stretch">
          {/* Starter Plan */}
          <div className="flex flex-col justify-between rounded-3xl border border-gray-200 bg-white p-8 shadow-sm transition hover:shadow-md dark:border-gray-800 dark:bg-gray-900">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Starter</h3>
                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                  Basic
                </span>
              </div>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Essential credits for casual diagramming and quick concept sketches.
              </p>

              <div className="mt-6 flex items-baseline">
                <span className="text-4xl font-extrabold text-gray-900 dark:text-white">
                  ₹{getPriceDisplay(499).price}
                </span>
                <span className="ml-1 text-sm text-gray-500 dark:text-gray-400">
                  {getPriceDisplay(499).period}
                </span>
              </div>

              <div className="mt-2 text-xs font-semibold text-brand-600 dark:text-brand-400">
                500 AI Diagram Credits included
              </div>

              <ul className="mt-8 space-y-4 text-sm text-gray-600 dark:text-gray-300">
                <li className="flex items-center gap-3">
                  <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>500 AI Credits (~10 Diagrams)</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Google Gemini AI Architecture</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>ELK.js Automatic Graph Layout</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Native 100% Editable Excalidraw Elements</span>
                </li>
                <li className="flex items-center gap-3 text-gray-400 dark:text-gray-600">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span>Multi-Agent Reviewer Optimization</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => handleSubscribe('starter')}
              disabled={purchasingPlan === 'starter'}
              className="mt-8 w-full rounded-xl border border-gray-300 bg-white py-3 text-sm font-semibold text-gray-800 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
            >
              {purchasingPlan === 'starter' ? 'Processing...' : 'Get Starter Plan'}
            </button>
          </div>

          {/* Pro Plan - Featured */}
          <div className="relative flex flex-col justify-between rounded-3xl border-2 border-brand-500 bg-white p-8 shadow-xl dark:bg-gray-900">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-brand-600 px-4 py-1 text-xs font-bold text-white shadow-md">
              MOST POPULAR
            </div>

            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Pro Architecture</h3>
                <span className="rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
                  Popular
                </span>
              </div>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Ideal for developers and architects creating complex cloud & microservices systems.
              </p>

              <div className="mt-6 flex items-baseline">
                <span className="text-5xl font-extrabold text-gray-900 dark:text-white">
                  ₹{getPriceDisplay(799).price}
                </span>
                <span className="ml-1 text-sm text-gray-500 dark:text-gray-400">
                  {getPriceDisplay(799).period}
                </span>
              </div>

              <div className="mt-2 text-xs font-semibold text-brand-600 dark:text-brand-400">
                1,500 AI Diagram Credits included
              </div>

              <ul className="mt-8 space-y-4 text-sm text-gray-600 dark:text-gray-300">
                <li className="flex items-center gap-3">
                  <svg className="h-5 w-5 text-brand-600 dark:text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span><strong className="text-gray-900 dark:text-white">1,500 AI Credits</strong> (~30 Diagrams)</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="h-5 w-5 text-brand-600 dark:text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Multi-Agent Pipeline (Intent, Planner, & Reviewer)</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="h-5 w-5 text-brand-600 dark:text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Advanced Layer Grouping & Container Boxes</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="h-5 w-5 text-brand-600 dark:text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>High-Res PNG, SVG, & Excalidraw Exports</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="h-5 w-5 text-brand-600 dark:text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Priority Generation & 24/7 Support</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => handleSubscribe('pro')}
              disabled={purchasingPlan === 'pro'}
              className="btn-primary mt-8 w-full py-3.5 text-base font-semibold shadow-lg shadow-brand-500/25"
            >
              {purchasingPlan === 'pro' ? 'Processing Order...' : 'Upgrade to Pro with Razorpay'}
            </button>
          </div>

          {/* Enterprise Plan */}
          <div className="flex flex-col justify-between rounded-3xl border border-gray-200 bg-white p-8 shadow-sm transition hover:shadow-md dark:border-gray-800 dark:bg-gray-900">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Enterprise</h3>
                <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                  Best Value
                </span>
              </div>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                High-capacity power for engineering teams and organization-wide diagrams.
              </p>

              <div className="mt-6 flex items-baseline">
                <span className="text-4xl font-extrabold text-gray-900 dark:text-white">
                  ₹{getPriceDisplay(1999).price}
                </span>
                <span className="ml-1 text-sm text-gray-500 dark:text-gray-400">
                  {getPriceDisplay(1999).period}
                </span>
              </div>

              <div className="mt-2 text-xs font-semibold text-purple-600 dark:text-purple-400">
                5,000 AI Diagram Credits included
              </div>

              <ul className="mt-8 space-y-4 text-sm text-gray-600 dark:text-gray-300">
                <li className="flex items-center gap-3">
                  <svg className="h-5 w-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span><strong className="text-gray-900 dark:text-white">5,000 AI Credits</strong> (~100 Diagrams)</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="h-5 w-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Dedicated Gemini AI Context Throughput</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="h-5 w-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Custom Enterprise Component Libraries</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="h-5 w-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Team Collaboration & Multi-User Support</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="h-5 w-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Dedicated Account Manager & Custom SLA</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => handleSubscribe('enterprise')}
              disabled={purchasingPlan === 'enterprise'}
              className="mt-8 w-full rounded-xl border border-gray-300 bg-white py-3 text-sm font-semibold text-gray-800 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
            >
              {purchasingPlan === 'enterprise' ? 'Processing...' : 'Get Enterprise Plan'}
            </button>
          </div>
        </div>

        {/* Feature Comparison Matrix */}
        <div className="mt-20">
          <h2 className="text-center text-2xl font-bold text-gray-900 dark:text-white">
            Plan Feature Comparison
          </h2>
          <div className="mt-8 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900/50">
                <tr>
                  <th className="p-4 font-semibold text-gray-900 dark:text-white">Features</th>
                  <th className="p-4 font-semibold text-gray-900 dark:text-white">Starter</th>
                  <th className="p-4 font-semibold text-brand-600 dark:text-brand-400">Pro</th>
                  <th className="p-4 font-semibold text-purple-600 dark:text-purple-400">Enterprise</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                <tr>
                  <td className="p-4 font-medium text-gray-900 dark:text-white">Monthly AI Credits</td>
                  <td className="p-4 text-gray-600 dark:text-gray-400">500</td>
                  <td className="p-4 font-bold text-gray-900 dark:text-white">1,500</td>
                  <td className="p-4 font-bold text-purple-600 dark:text-purple-400">5,000</td>
                </tr>
                <tr>
                  <td className="p-4 font-medium text-gray-900 dark:text-white">Diagram Model Engine</td>
                  <td className="p-4 text-gray-600 dark:text-gray-400">Gemini Flash</td>
                  <td className="p-4 font-bold text-gray-900 dark:text-white">Gemini Multi-Agent</td>
                  <td className="p-4 font-bold text-purple-600 dark:text-purple-400">Dedicated Gemini Pro</td>
                </tr>
                <tr>
                  <td className="p-4 font-medium text-gray-900 dark:text-white">Automatic ELK.js Layout</td>
                  <td className="p-4 text-green-600">✓</td>
                  <td className="p-4 text-green-600">✓</td>
                  <td className="p-4 text-green-600">✓</td>
                </tr>
                <tr>
                  <td className="p-4 font-medium text-gray-900 dark:text-white">Layer Grouping Containers</td>
                  <td className="p-4 text-gray-400">Basic</td>
                  <td className="p-4 text-green-600 font-bold">✓ Advanced</td>
                  <td className="p-4 text-green-600 font-bold">✓ Custom</td>
                </tr>
                <tr>
                  <td className="p-4 font-medium text-gray-900 dark:text-white">Support SLA</td>
                  <td className="p-4 text-gray-600 dark:text-gray-400">Community</td>
                  <td className="p-4 text-gray-900 dark:text-white font-medium">24/7 Priority</td>
                  <td className="p-4 text-purple-600 dark:text-purple-400 font-bold">Dedicated Manager</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ Accordion */}
        <div className="mt-20">
          <h2 className="text-center text-2xl font-bold text-gray-900 dark:text-white">
            Frequently Asked Questions
          </h2>
          <div className="mx-auto mt-8 max-w-3xl space-y-4">
            {FAQ_ITEMS.map((item, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="flex w-full items-center justify-between text-left font-semibold text-gray-900 dark:text-white"
                >
                  <span>{item.q}</span>
                  <span className="ml-4 text-lg font-bold text-gray-400">
                    {openFaq === idx ? '−' : '+'}
                  </span>
                </button>
                {openFaq === idx && (
                  <p className="mt-3 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    {item.a}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Pricing;
