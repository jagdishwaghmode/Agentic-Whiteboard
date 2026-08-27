import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import paymentApi from '../services/paymentApi';

const CreditWallet = () => {
  const [credits, setCredits] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    paymentApi
      .getCredits()
      .then((balance) => setCredits(balance.credits))
      .catch((e) => setError(e.message));
  }, []);

  return (
    <section className="mb-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-900/40 dark:text-brand-300">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">AI Credits Balance</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              <strong className="text-brand-600 dark:text-brand-400">{credits !== null ? `${credits} Credits` : 'Loading...'}</strong> available · 50 credits per AI diagram
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/pricing" className="btn-primary flex items-center gap-2 text-sm font-semibold">
            <span>Upgrade & Buy Credits</span>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
        </div>
      </div>

      {error && <p className="mt-3 text-xs font-medium text-red-600 dark:text-red-400">{error}</p>}
    </section>
  );
};

export default CreditWallet;
