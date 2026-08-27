import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import paymentApi from '../services/paymentApi';

const Navbar = ({ title, saveStatus, showBack = false }) => {
  const { user, logout } = useAuth();
  const [credits, setCredits] = useState(null);

  useEffect(() => {
    if (user) {
      paymentApi
        .getCredits()
        .then((res) => setCredits(res.credits))
        .catch(() => setCredits(null));
    }
  }, [user]);

  const statusColors = {
    saving: 'text-yellow-600 dark:text-yellow-400',
    saved: 'text-green-600 dark:text-green-400',
    error: 'text-red-600 dark:text-red-400',
    idle: 'text-gray-400',
  };

  const statusText = {
    saving: 'Saving...',
    saved: 'Saved',
    error: 'Save failed',
    idle: '',
  };

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 dark:border-gray-700 dark:bg-gray-900">
      <div className="flex items-center gap-4">
        {showBack && (
          <Link
            to="/dashboard"
            className="text-sm font-medium text-gray-500 transition hover:text-brand-600 dark:text-gray-400 dark:hover:text-brand-400"
          >
            ← Dashboard
          </Link>
        )}
        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
            AI
          </div>
          <span className="hidden font-semibold text-gray-900 dark:text-white sm:inline">
            Agentic Whiteboard
          </span>
        </Link>
        {title && (
          <span className="hidden truncate text-sm text-gray-500 dark:text-gray-400 md:inline">
            / {title}
          </span>
        )}
      </div>

      <div className="flex items-center gap-4">
        {saveStatus && saveStatus !== 'idle' && (
          <span className={`text-sm font-medium ${statusColors[saveStatus]}`}>
            {statusText[saveStatus]}
          </span>
        )}

        {user && (
          <div className="flex items-center gap-3">
            {/* User Info */}
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {user.displayName || user.email?.split('@')[0]}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
            </div>

            {/* Profile Avatar */}
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt="Profile"
                className="h-8 w-8 rounded-full border border-gray-200 dark:border-gray-700"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-sm font-medium text-brand-700 dark:bg-brand-900 dark:text-brand-300">
                {(user.displayName || user.email || 'U')[0].toUpperCase()}
              </div>
            )}

            {/* Available Credits Badge next to profile avatar */}
            <Link
              to="/pricing"
              className="inline-flex items-center rounded-lg border border-brand-200 bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700 transition hover:bg-brand-100 dark:border-brand-900/50 dark:bg-brand-900/30 dark:text-brand-300 dark:hover:bg-brand-900/50"
              title="Click to view pricing and purchase credits"
            >
              {credits !== null ? `${credits} Credits` : 'Credits'}
            </Link>

            <button onClick={logout} className="btn-secondary text-xs">
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
