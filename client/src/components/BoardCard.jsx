import { Link } from 'react-router-dom';

const BoardCard = ({ board, onDelete, deleting }) => {
  const formattedDate = new Date(board.updatedAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="card group flex flex-col p-5 transition hover:shadow-md">
      <div className="mb-3 flex h-24 items-center justify-center rounded-lg bg-gradient-to-br from-brand-50 to-brand-100 dark:from-brand-900/30 dark:to-brand-800/20">
        <svg
          className="h-10 w-10 text-brand-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>

      <h3 className="mb-1 truncate font-semibold text-gray-900 dark:text-white">
        {board.title}
      </h3>
      <p className="mb-4 text-xs text-gray-500 dark:text-gray-400">Updated {formattedDate}</p>

      <div className="mt-auto flex gap-2">
        <Link to={`/board/${board._id}`} className="btn-primary flex-1 text-center text-xs">
          Open
        </Link>
        <button
          onClick={() => onDelete(board._id)}
          disabled={deleting}
          className="btn-secondary text-xs text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
        >
          {deleting ? '...' : 'Delete'}
        </button>
      </div>
    </div>
  );
};

export default BoardCard;
