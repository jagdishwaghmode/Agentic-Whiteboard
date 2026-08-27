import { useState, useRef, useEffect } from 'react';
import { generateProfessionalDiagram } from '../services/professionalDiagramApi';
import Loading from './Loading';

const EXAMPLE_PROMPTS = [
  'Create a high-level architecture diagram for Netflix.',
  'Create a microservices architecture for an e-commerce application.',
  'Create a deployment architecture for a React and Node.js application using Docker and Kubernetes.',
  'Create a user authentication workflow with login, JWT validation, and database verification.',
  'Create a high-level architecture for an online food delivery platform.',
];

const AIChat = ({ onDiagramGenerated, currentDiagram }) => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content:
        'Hi! Ask me to design any system architecture (e.g. Netflix, E-Commerce, Food Delivery). My multi-agent AI pipeline will plan the architecture, review the structure, run automatic ELK layout, and generate 100% editable Excalidraw elements.',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('Understanding your diagram request...');
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (promptText) => {
    const prompt = promptText || input.trim();
    if (!prompt || loading) return;

    setInput('');
    setError('');
    setMessages((prev) => [...prev, { role: 'user', content: prompt }]);
    setLoading(true);

    try {
      setLoadingStep('Understanding your diagram request...');
      await new Promise((r) => setTimeout(r, 400));

      setLoadingStep('Planning the right diagram type and content...');
      const response = await generateProfessionalDiagram(prompt);

      setLoadingStep('Reviewing and optimizing diagram structure...');
      await new Promise((r) => setTimeout(r, 300));

      setLoadingStep('Creating professional editable layout...');
      
      onDiagramGenerated({ professionalDiagram: response.diagram, intent: response.intent });

      const title = response.diagram?.title || 'Diagram';
      const nodeCount = response.diagram?.nodes?.length || 0;
      const groupCount = response.diagram?.groups?.length || 0;

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Done! Created "${title}" with ${nodeCount} elements${groupCount ? ` across ${groupCount} groups` : ''}. Every shape, label, and arrow is editable on your canvas.`,
        },
      ]);
    } catch (err) {
      const errorMsg = err.message || 'Unable to generate diagram at this time.';
      setError(errorMsg);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `Sorry: ${errorMsg}`, isError: true },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`rounded-lg px-3 py-2 text-sm ${
              msg.role === 'user'
                ? 'ml-4 bg-brand-600 text-white'
                : msg.isError
                  ? 'mr-4 bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                  : 'mr-4 bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
            }`}
          >
            {msg.content}
          </div>
        ))}

        {loading && (
          <div className="mr-4">
            <Loading message={loadingStep} />
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-gray-200 p-3 dark:border-gray-700">
        <div className="mb-3 flex flex-wrap gap-1.5">
          {EXAMPLE_PROMPTS.slice(0, 3).map((prompt) => (
            <button
              key={prompt}
              onClick={() => handleSubmit(prompt)}
              disabled={loading}
              className="rounded-full border border-gray-200 px-2.5 py-1 text-xs text-gray-600 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 disabled:opacity-50 dark:border-gray-600 dark:text-gray-400 dark:hover:border-brand-600 dark:hover:bg-brand-900/30 dark:hover:text-brand-300"
            >
              {prompt.length > 45 ? prompt.slice(0, 45) + '...' : prompt}
            </button>
          ))}
        </div>

        {error && (
          <p className="mb-2 text-xs text-red-600 dark:text-red-400">{error}</p>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask AI to create or modify a diagram..."
            className="input-field flex-1"
            disabled={loading}
          />
          <button type="submit" disabled={loading || !input.trim()} className="btn-primary shrink-0">
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default AIChat;
