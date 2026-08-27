import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Excalidraw } from '@excalidraw/excalidraw';
import { boardAPI } from '../services/api';
import { useDebounce } from '../hooks/useDebounce';
import { diagramToExcalidraw, excalidrawToDiagram } from '../utils/diagramToExcalidraw';
import { layoutDiagram } from '../utils/diagramLayout';
import { addDiagramToCanvas } from '../utils/addDiagramToCanvas';
import { createDiagramElements } from '../utils/createDiagramElements';
import { layoutSemanticDiagram } from '../services/diagramLayoutService';
import { semanticDiagramToExcalidraw } from '../utils/semanticDiagramToExcalidraw';

const UI_OPTIONS = {
  canvasActions: {
    loadScene: false,
    export: { saveFileToDisk: true },
  },
};

const RENDER_TOP_RIGHT_UI = () => null;
const EMPTY_MAP = new Map();

const WhiteboardCanvas = ({
  boardId,
  initialData,
  onSaveStatusChange,
  onDiagramChange,
  aiDiagram,
}) => {
  const excalidrawRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const [savePayload, setSavePayload] = useState(null);
  const debouncedSave = useDebounce(savePayload, 1500);

  const onDiagramChangeRef = useRef(onDiagramChange);
  useEffect(() => {
    onDiagramChangeRef.current = onDiagramChange;
  }, [onDiagramChange]);

  // Compute initialData ONLY once per boardId
  const memoizedInitialData = useMemo(() => {
    return {
      elements: Array.isArray(initialData?.elements) ? initialData.elements : [],
      appState: {
        ...(initialData?.appState && typeof initialData.appState === 'object'
          ? initialData.appState
          : {}),
        collaborators: EMPTY_MAP,
      },
      files:
        initialData?.files && typeof initialData.files === 'object'
          ? initialData.files
          : {},
      scrollToContent: true,
    };
  }, [boardId]);

  // Handle AI diagram updates
  useEffect(() => {
    if (aiDiagram && excalidrawRef.current) {
      const api = excalidrawRef.current;

      if (aiDiagram.professionalDiagram) {
        layoutSemanticDiagram(aiDiagram.professionalDiagram)
          .then((positionedDiagram) => {
            const { elements: nativeElements } = semanticDiagramToExcalidraw(positionedDiagram);

            const currentElements = api.getSceneElements?.() || [];
            const updatedElements = [...currentElements, ...nativeElements];

            api.updateScene({ elements: updatedElements });

            if (typeof api.scrollToContent === 'function') {
              try {
                api.scrollToContent(nativeElements, {
                  fitToViewport: true,
                  viewportZoomCap: 1.0,
                  animate: true,
                });
              } catch (err) {
                console.warn('scrollToContent failed:', err);
              }
            }

            setSavePayload({
              elements: updatedElements,
              appState: {},
              files: api.getFiles?.() || {},
            });
          })
          .catch((err) => {
            console.error('Error running ELK layout:', err);
          });
      } else if (aiDiagram.editableDiagram) {
        const { elements: nativeElements } = createDiagramElements(
          aiDiagram.editableDiagram
        );

        const currentElements = api.getSceneElements?.() || [];
        const updatedElements = [...currentElements, ...nativeElements];

        api.updateScene({ elements: updatedElements });

        if (typeof api.scrollToContent === 'function') {
          try {
            api.scrollToContent(nativeElements, {
              fitToViewport: true,
              viewportZoomCap: 1.0,
              animate: true,
            });
          } catch (err) {
            console.warn('scrollToContent failed:', err);
          }
        }

        setSavePayload({
          elements: updatedElements,
          appState: {},
          files: api.getFiles?.() || {},
        });
      } else if (aiDiagram.svg) {
        addDiagramToCanvas(aiDiagram.svg, api)
          .then(() => {
            setSavePayload({
              elements: api.getSceneElements?.() || [],
              appState: {},
              files: api.getFiles?.() || {},
            });
          })
          .catch((err) => {
            console.error('Error inserting Kroki SVG onto canvas:', err);
          });
      } else {
        const laidOut = layoutDiagram(aiDiagram);
        const newElements = diagramToExcalidraw(laidOut);
        api.updateScene({ elements: newElements });
        onDiagramChangeRef.current?.(laidOut);
        setSavePayload({
          elements: newElements,
          appState: {},
          files: {},
        });
      }
    }
  }, [aiDiagram]);

  // Handle debounced board save to backend
  useEffect(() => {
    if (!debouncedSave || !boardId || !isReady) return;

    const save = async () => {
      onSaveStatusChange?.('saving');
      try {
        await boardAPI.update(boardId, debouncedSave);
        onSaveStatusChange?.('saved');
        setTimeout(() => onSaveStatusChange?.('idle'), 2000);
      } catch {
        onSaveStatusChange?.('error');
      }
    };

    save();
  }, [debouncedSave, boardId, isReady, onSaveStatusChange]);

  // Excalidraw onChange callback - defer parent state updates to avoid React max update depth
  const handleChange = useCallback((newElements, newAppState, newFiles) => {
    if (!Array.isArray(newElements)) return;

    Promise.resolve().then(() => {
      try {
        const diagram = excalidrawToDiagram(newElements);
        onDiagramChangeRef.current?.(diagram);
      } catch (err) {
        console.warn('Error converting excalidraw to diagram:', err);
      }
    });

    setSavePayload({
      elements: newElements,
      appState: {
        viewBackgroundColor: newAppState?.viewBackgroundColor,
        gridSize: newAppState?.gridSize,
      },
      files: newFiles || {},
    });
  }, []);

  const handleExcalidrawAPI = useCallback((api) => {
    excalidrawRef.current = api;
    setIsReady(true);
  }, []);

  return (
    <div className="excalidraw-wrapper relative h-full w-full min-h-full">
      <Excalidraw
        excalidrawAPI={handleExcalidrawAPI}
        initialData={memoizedInitialData}
        onChange={handleChange}
        UIOptions={UI_OPTIONS}
        renderTopRightUI={RENDER_TOP_RIGHT_UI}
      />
    </div>
  );
};

export default WhiteboardCanvas;
