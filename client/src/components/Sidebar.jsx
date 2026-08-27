import AIChat from './AIChat';

const Sidebar = ({ onDiagramGenerated, currentDiagram, collapsed, onToggle }) => {
  return (
    <>
      <aside
        className={`flex shrink-0 flex-col border-r border-gray-200 bg-white transition-all duration-300 dark:border-gray-700 dark:bg-gray-900 ${
          collapsed ? 'w-12' : 'w-80 lg:w-96'
        }`}
      >
        <div className="flex h-12 items-center justify-between border-b border-gray-200 px-3 dark:border-gray-700">
          {!collapsed && (
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">AI Assistant</h2>
          )}
          <button
            onClick={onToggle}
            className="rounded-lg p-1.5 text-gray-500 transition hover:bg-gray-100 dark:hover:bg-gray-800"
            title={collapsed ? 'Expand panel' : 'Collapse panel'}
          >
            {collapsed ? '→' : '←'}
          </button>
        </div>

        {!collapsed && (
          <AIChat onDiagramGenerated={onDiagramGenerated} currentDiagram={currentDiagram} />
        )}
      </aside>
    </>
  );
};

export default Sidebar;
