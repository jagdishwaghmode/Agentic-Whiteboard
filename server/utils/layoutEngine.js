const NODE_WIDTH = 180;
const NODE_HEIGHT = 80;
const HORIZONTAL_GAP = 120;
const VERTICAL_GAP = 100;
const START_X = 100;
const START_Y = 100;

/**
 * Simple layout engine — vertical stack or horizontal flow based on node count.
 * Designed so a graph layout library can replace this later.
 */
export const layoutDiagram = (diagram) => {
  const { nodes = [], connections = [] } = diagram;

  if (nodes.length === 0) {
    return { ...diagram, nodes: [], connections };
  }

  const useHorizontal = nodes.length <= 4 && connections.length >= nodes.length - 1;

  const laidOutNodes = nodes.map((node, index) => {
    let x, y;

    if (useHorizontal) {
      x = START_X + index * (NODE_WIDTH + HORIZONTAL_GAP);
      y = START_Y;
    } else {
      x = START_X;
      y = START_Y + index * (NODE_HEIGHT + VERTICAL_GAP);
    }

    return {
      ...node,
      x,
      y,
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
    };
  });

  return {
    ...diagram,
    nodes: laidOutNodes,
    connections,
  };
};

export const layoutConstants = {
  NODE_WIDTH,
  NODE_HEIGHT,
  HORIZONTAL_GAP,
  VERTICAL_GAP,
  START_X,
  START_Y,
};
