const Loading = ({ message = 'Loading...', fullScreen = false }) => {
  const containerClass = fullScreen
    ? 'flex min-h-screen items-center justify-center'
    : 'flex items-center justify-center py-12';

  return (
    <div className={containerClass}>
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600 dark:border-brand-800 dark:border-t-brand-400" />
        <p className="text-sm text-gray-500 dark:text-gray-400">{message}</p>
      </div>
    </div>
  );
};

export default Loading;
