/**
 * Utility to convert an SVG string from Kroki into a Data URL Blob,
 * register it in Excalidraw's binary files store, and insert an image element
 * centered on the active viewport.
 */

const parseSvgDimensions = (svgString) => {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgString, 'image/svg+xml');
    const svgEl = doc.querySelector('svg');

    if (!svgEl) return { width: 700, height: 450 };

    let width = parseFloat(svgEl.getAttribute('width'));
    let height = parseFloat(svgEl.getAttribute('height'));

    if ((!width || isNaN(width)) || (!height || isNaN(height))) {
      const viewBox = svgEl.getAttribute('viewBox');
      if (viewBox) {
        const parts = viewBox.split(/[\s,]+/).map(parseFloat);
        if (parts.length >= 4 && !isNaN(parts[2]) && !isNaN(parts[3])) {
          width = parts[2];
          height = parts[3];
        }
      }
    }

    width = width && !isNaN(width) ? Math.min(Math.max(width, 300), 1000) : 700;
    height = height && !isNaN(height) ? Math.min(Math.max(height, 200), 800) : 450;

    return { width, height };
  } catch {
    return { width: 700, height: 450 };
  }
};

export const addDiagramToCanvas = async (svgString, excalidrawAPI) => {
  if (!svgString || !excalidrawAPI) {
    throw new Error('SVG string and Excalidraw API reference are required');
  }

  const { width, height } = parseSvgDimensions(svgString);

  // Convert SVG string to Blob & Data URL
  const blob = new Blob([svgString], { type: 'image/svg+xml' });
  const dataURL = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

  const fileId = `file_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  // Register image file in Excalidraw file store
  excalidrawAPI.addFiles([
    {
      id: fileId,
      dataURL,
      mimeType: 'image/svg+xml',
      created: Date.now(),
    },
  ]);

  // Center image element on visible canvas viewport
  const appState = excalidrawAPI.getAppState() || {};
  const scrollX = appState.scrollX || 0;
  const scrollY = appState.scrollY || 0;
  const zoom = appState.zoom?.value || 1;

  const viewportWidth = window.innerWidth || 1200;
  const viewportHeight = window.innerHeight || 800;

  const centerX = -scrollX + (viewportWidth / 2 / zoom) - (width / 2);
  const centerY = -scrollY + (viewportHeight / 2 / zoom) - (height / 2);

  const imageElement = {
    id: `img_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    type: 'image',
    fileId,
    status: 'saved',
    x: centerX,
    y: centerY,
    width,
    height,
    angle: 0,
    strokeColor: 'transparent',
    backgroundColor: 'transparent',
    fillStyle: 'hachure',
    strokeWidth: 1,
    strokeStyle: 'solid',
    roughness: 1,
    opacity: 100,
    groupIds: [],
    frameId: null,
    roundness: null,
    seed: Math.floor(Math.random() * 100000),
    version: 1,
    versionNonce: Math.floor(Math.random() * 100000),
    isDeleted: false,
    boundElements: null,
    updated: Date.now(),
    link: null,
    locked: false,
    scale: [1, 1],
  };

  const currentElements = excalidrawAPI.getSceneElements() || [];
  excalidrawAPI.updateScene({
    elements: [...currentElements, imageElement],
  });

  return imageElement;
};

export default addDiagramToCanvas;
