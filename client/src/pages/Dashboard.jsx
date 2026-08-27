import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { boardAPI } from '../services/api';
import Navbar from '../components/Navbar';
import BoardCard from '../components/BoardCard';
import Loading from '../components/Loading';
import CreditWallet from '../components/CreditWallet';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    fetchBoards();
  }, []);

  const fetchBoards = async () => {
    try {
      setLoading(true);
      const response = await boardAPI.getAll();
      setBoards(response.data.boards);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBoard = async () => {
    setCreating(true);
    setError('');

    try {
      const response = await boardAPI.create('Untitled Whiteboard');
      navigate(`/board/${response.data.board._id}`);
    } catch (err) {
      setError(err.message);
      setCreating(false);
    }
  };

  const handleDeleteBoard = async (boardId) => {
    if (!window.confirm('Are you sure you want to delete this whiteboard?')) return;

    setDeletingId(boardId);
    try {
      await boardAPI.delete(boardId);
      setBoards((prev) => prev.filter((b) => b._id !== boardId));
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Welcome, {user?.displayName || user?.email?.split('@')[0] || 'User'}
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Manage your whiteboards and create new diagrams with AI
            </p>
          </div>
          <button onClick={handleCreateBoard} disabled={creating} className="btn-primary">
            {creating ? 'Creating...' : '+ Create New Whiteboard'}
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
            {error}
          </div>
        )}

        <CreditWallet />

        {loading ? (
          <Loading message="Loading your whiteboards..." />
        ) : boards.length === 0 ? (
          <div className="card flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-900/30">
              <svg
                className="h-8 w-8 text-brand-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">No whiteboards yet</h3>
            <p className="mt-2 max-w-sm text-sm text-gray-500 dark:text-gray-400">
              Create your first whiteboard to start drawing diagrams and collaborating with AI.
            </p>
            <button onClick={handleCreateBoard} disabled={creating} className="btn-primary mt-6">
              Create Your First Whiteboard
            </button>
          </div>
        ) : (
          <>
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Your Whiteboards ({boards.length})
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {boards.map((board) => (
                <BoardCard
                  key={board._id}
                  board={board}
                  onDelete={handleDeleteBoard}
                  deleting={deletingId === board._id}
                />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
