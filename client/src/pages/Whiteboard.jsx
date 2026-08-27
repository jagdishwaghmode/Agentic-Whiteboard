import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { boardAPI } from '../services/api';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import WhiteboardCanvas from '../components/WhiteboardCanvas';
import Loading from '../components/Loading';

const Whiteboard = () => {
  const { boardId } = useParams();
  const navigate = useNavigate();
  const [board, setBoard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saveStatus, setSaveStatus] = useState('idle');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentDiagram, setCurrentDiagram] = useState(null);
  const [aiDiagram, setAiDiagram] = useState(null);

  useEffect(() => {
    const fetchBoard = async () => {
      try {
        setLoading(true);
        const response = await boardAPI.getById(boardId);
        setBoard(response.data.board);
      } catch (err) {
        setError(err.message);
        if (err.message.includes('Not authorized') || err.message.includes('not found')) {
          setTimeout(() => navigate('/dashboard'), 2000);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchBoard();
  }, [boardId, navigate]);

  const handleDiagramGenerated = (diagram) => {
    setAiDiagram({ ...diagram, _timestamp: Date.now() });
  };

  const handleDiagramChange = (diagram) => {
    // Avoid triggering state re-renders if diagram is unchanged
    setCurrentDiagram((prev) => {
      if (JSON.stringify(prev) === JSON.stringify(diagram)) return prev;
      return diagram;
    });
  };

  if (loading) {
    return (
      <div className="flex h-screen flex-col">
        <Navbar showBack />
        <Loading message="Loading whiteboard..." fullScreen />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen flex-col">
        <Navbar showBack />
        <div className="flex flex-1 flex-col items-center justify-center gap-4">
          <p className="text-red-600 dark:text-red-400">{error}</p>
          <button onClick={() => navigate('/dashboard')} className="btn-primary">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <Navbar title={board.title} saveStatus={saveStatus} showBack />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          onDiagramGenerated={handleDiagramGenerated}
          currentDiagram={currentDiagram}
        />

        <main className="relative flex-1 h-full w-full overflow-hidden bg-white dark:bg-gray-900">
          <WhiteboardCanvas
            boardId={boardId}
            initialData={{
              elements: board.elements,
              appState: board.appState,
              files: board.files,
            }}
            onSaveStatusChange={setSaveStatus}
            onDiagramChange={handleDiagramChange}
            aiDiagram={aiDiagram}
          />
        </main>
      </div>
    </div>
  );
};

export default Whiteboard;
