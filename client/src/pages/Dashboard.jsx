import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { boardAPI } from '../services/api';
import Navbar from '../components/Navbar';
import BoardCard from '../components/BoardCard';
import Loading from '../components/Loading';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Create Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [projectTitle, setProjectTitle] = useState('Untitled Whiteboard');
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    fetchBoards();
  }, []);

  const fetchBoards = async () => {
    try {
      setLoading(true);
      const response = await boardAPI.getAll();
      setBoards(response.data.boards || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setProjectTitle('Untitled Whiteboard');
    setShowCreateModal(true);
  };

  const handleCreateBoard = async (e) => {
    if (e) e.preventDefault();
    const finalTitle = projectTitle.trim() || 'Untitled Whiteboard';

    setCreating(true);
    setError('');

    try {
      const response = await boardAPI.create(finalTitle);
      setShowCreateModal(false);
      navigate(`/board/${response.data.board._id}`);
    } catch (err) {
      setError(err.message);
      setCreating(false);
    }
  };

  const handleRenameBoard = async (boardId, newTitle) => {
    if (!newTitle || !newTitle.trim()) return;

    try {
      await boardAPI.update(boardId, { title: newTitle.trim() });
      setBoards((prev) =>
        prev.map((b) => (b._id === boardId ? { ...b, title: newTitle.trim() } : b))
      );
    } catch (err) {
      setError(err.message);
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
          <button onClick={handleOpenCreateModal} className="btn-primary">
            + Create New Whiteboard
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
            {error}
          </div>
        )}

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
            <button onClick={handleOpenCreateModal} className="btn-primary mt-6">
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
                  onRename={handleRenameBoard}
                  onDelete={handleDeleteBoard}
                  deleting={deletingId === board._id}
                />
              ))}
            </div>
          </>
        )}
      </main>

      {/* Create Whiteboard Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="card w-full max-w-md p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Create New Project Whiteboard
            </h3>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Enter a name for your project whiteboard below.
            </p>

            <form onSubmit={handleCreateBoard} className="mt-5 space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Project Name
                </label>
                <input
                  type="text"
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                  onFocus={(e) => e.target.select()}
                  placeholder="e.g. E-Commerce Microservices Architecture"
                  autoFocus
                  required
                  className="input-field"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  disabled={creating}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !projectTitle.trim()}
                  className="btn-primary text-xs"
                >
                  {creating ? 'Creating...' : 'Create Whiteboard'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
