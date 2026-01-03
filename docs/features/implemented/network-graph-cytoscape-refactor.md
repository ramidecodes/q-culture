# Feature Requirement Document: Network Graph Cytoscape.js Refactor

## Feature Name

Network Graph Visualization Refactor to Cytoscape.js

## Goal

Replace the current `react-force-graph-2d` library with `cytoscape` and `react-cytoscapejs` to resolve fundamental interaction issues (hover and click detection) that stem from the Canvas-based color-picking hit detection mechanism in the current implementation.

## Problem Statement

### Current Issues

The existing network graph implementation using `react-force-graph-2d` has persistent interaction problems:

1. **Nodes are non-interactive**: Users cannot hover or click on nodes reliably
2. **Edge hover is inconsistent**: Some edges respond to hover, others do not
3. **Hit detection is unreliable**: The library uses a hidden Canvas with color-picking for hit detection, which is prone to coordinate mismatches

### Root Cause Analysis

`react-force-graph-2d` renders on HTML Canvas and uses a **color-picking mechanism** for interaction detection:
- Each element is painted on a hidden canvas with a unique color
- On mouse events, the library reads the pixel color to identify the element
- This technique requires perfect alignment between visible and hidden canvases
- Any mismatch in coordinates, scaling, or timing causes interaction failures

This architectural limitation cannot be easily fixed without modifying the library itself.

### Why Cytoscape.js

Based on research from [js.cytoscape.org](https://js.cytoscape.org/):

| Aspect | react-force-graph-2d | Cytoscape.js |
|--------|---------------------|--------------|
| Rendering | Canvas only | Canvas/SVG hybrid |
| Hit Detection | Color-picking (unreliable) | Native DOM events (reliable) |
| Event Handling | Custom implementation | Standard mouseover/tap/click |
| Styling | JavaScript functions | CSS-like stylesheets |
| Force Layout | D3-force | CoSE (Compound Spring Embedder) |
| Parallel Edges | Manual curves | Built-in curve-style support |
| React Integration | Direct | react-cytoscapejs wrapper |

## User Story

As a facilitator viewing the cultural distance visualization, I want to:
- **Hover** over nodes to see participant details highlighted
- **Hover** over edges to see the cultural distance/similarity information
- **Click** on nodes and edges to pin detailed tooltips
- See **edge thickness** represent cultural similarity (thicker = more similar)
- Switch between **aggregate** and **dimensional** edge modes

So that I can explore and demonstrate cultural connections between workshop participants.

## Functional Requirements

### FR-1: Node Interactions
- Hovering over a node must highlight it with a visual border
- Hovering must trigger the `onNodeHover` callback
- Clicking a node must display a detailed tooltip with cultural scores
- Clicking must trigger the `onNodeClick` callback

### FR-2: Edge Interactions
- Hovering over an edge must highlight it (thicker line)
- Clicking an edge must display a tooltip with distance/similarity info
- In dimensional mode, each dimension edge must be independently hoverable

### FR-3: Edge Styling Based on Similarity
- Edge width must be proportional to cultural similarity (inverse of distance)
- Closer cultures (lower distance) = thicker edges
- Edge color/opacity must also indicate similarity strength

### FR-4: Edge Modes
- **Aggregate Mode**: Single edge per node pair showing overall cultural distance
- **Dimensional Mode**: Multiple curved edges per node pair, one per cultural dimension
- Smooth transition when switching modes

### FR-5: Force-Directed Layout
- Nodes positioned using force-directed algorithm (CoSE)
- Edge lengths influenced by cultural distance (closer = shorter)
- Layout must stabilize and allow zoom-to-fit

### FR-6: Tooltips
- Node tooltips show: name, country, cultural dimension scores
- Edge tooltips show: distance value, similarity percentage, dimension breakdown
- Tooltips must be closeable and not block other interactions

### FR-7: Legend
- Country color legend
- Dimension color legend (in dimensional mode)
- Edge thickness explanation

## Data Requirements

### Input Data Structure (unchanged)

```typescript
// From src/lib/utils/visualization-data.ts
type GraphNode = {
  id: string;
  name: string;
  country: string;
  countryCode: string;
  groupId?: string;
  groupNumber?: number;
  culturalScores?: CulturalScores;
};

type GraphLink = {
  source: string;
  target: string;
  distance: number;
  dimensionalDistances?: DimensionalDistance[];
};

type GraphData = {
  nodes: GraphNode[];
  links: GraphLink[];
};
```

### Cytoscape Element Format

```typescript
// Cytoscape requires this format
type CytoscapeNode = {
  data: {
    id: string;
    label: string;
    country: string;
    countryCode: string;
    color: string;
    // ... other node data
  };
};

type CytoscapeEdge = {
  data: {
    id: string;
    source: string;
    target: string;
    distance: number;
    width: number;      // Pre-computed from similarity
    color: string;      // Pre-computed color
    curvature?: number; // For dimensional mode
    dimension?: string; // For dimensional mode
  };
};
```

## Technical Implementation

### Dependencies

**Add:**
- `cytoscape` - Core graph library
- `react-cytoscapejs` - React wrapper component
- `cytoscape-fcose` - Enhanced force-directed layout (optional, for better edge length control)

**Remove:**
- `react-force-graph-2d`

### File Structure

```
src/components/cultural-visualizations/
├── network-graph.tsx              # REWRITE - Main component using Cytoscape
├── utils/
│   ├── graph-colors.ts           # NEW - Color mapping utilities
│   ├── graph-tooltips.tsx        # NEW - Tooltip content components
│   └── graph-data-transform.ts   # NEW - Data transformation to Cytoscape format
├── graph-legend.tsx               # NEW - Extracted legend component
└── graph-tooltip.tsx              # NEW - Tooltip wrapper component
```

### Cytoscape Stylesheet

Based on [Cytoscape.js styling documentation](https://js.cytoscape.org/#style):

```typescript
const stylesheet: cytoscape.Stylesheet[] = [
  // Node base style
  {
    selector: "node",
    style: {
      "background-color": "data(color)",
      "label": "data(label)",
      "text-valign": "bottom",
      "text-halign": "center",
      "font-size": "10px",
      "color": "#e5e7eb",
      "text-margin-y": 4,
      "width": 16,
      "height": 16,
      "border-width": 2,
      "border-color": "#ffffff",
    },
  },
  // Node hover state
  {
    selector: "node:hover",
    style: {
      "border-width": 3,
      "border-color": "#10b981", // Green highlight
      "z-index": 10,
    },
  },
  // Node selected state
  {
    selector: "node:selected",
    style: {
      "border-width": 4,
      "border-color": "#3b82f6", // Blue for selected
      "z-index": 20,
    },
  },
  // Edge base style
  {
    selector: "edge",
    style: {
      "width": "data(width)",
      "line-color": "data(color)",
      "curve-style": "bezier",
      "opacity": "data(opacity)",
    },
  },
  // Edge hover state
  {
    selector: "edge:hover",
    style: {
      "width": "mapData(width, 0.5, 3, 2, 6)", // Double width on hover
      "opacity": 1,
      "z-index": 10,
    },
  },
  // Edge selected state
  {
    selector: "edge:selected",
    style: {
      "width": "mapData(width, 0.5, 3, 2, 6)",
      "opacity": 1,
      "z-index": 20,
    },
  },
];
```

### Layout Configuration

Based on [CoSE layout documentation](https://js.cytoscape.org/#layouts/cose):

```typescript
const layoutOptions: cytoscape.LayoutOptions = {
  name: "cose",
  animate: true,
  animationDuration: 500,
  fit: true,
  padding: 50,
  nodeRepulsion: 8000,
  idealEdgeLength: (edge) => {
    // Longer edges for more distant cultures
    const distance = edge.data("distance") ?? 0.5;
    return 50 + distance * 150;
  },
  edgeElasticity: 100,
  gravity: 0.25,
  numIter: 1000,
};
```

### Event Handling

Based on [Cytoscape.js events documentation](https://js.cytoscape.org/#events):

```typescript
// In the component
useEffect(() => {
  if (!cyRef.current) return;
  const cy = cyRef.current;

  // Node hover
  cy.on("mouseover", "node", (event) => {
    const node = event.target;
    setHoveredNode(node.data());
    onNodeHover?.(node.data());
  });

  cy.on("mouseout", "node", () => {
    setHoveredNode(null);
    onNodeHover?.(null);
  });

  // Node click/tap
  cy.on("tap", "node", (event) => {
    const node = event.target;
    const position = event.renderedPosition;
    setSelectedElement({
      type: "node",
      data: node.data(),
      position: { x: position.x, y: position.y },
    });
    onNodeClick?.(node.data());
  });

  // Edge hover
  cy.on("mouseover", "edge", (event) => {
    const edge = event.target;
    setHoveredEdge(edge.data());
  });

  cy.on("mouseout", "edge", () => {
    setHoveredEdge(null);
  });

  // Edge click/tap
  cy.on("tap", "edge", (event) => {
    const edge = event.target;
    const position = event.renderedPosition;
    setSelectedElement({
      type: "edge",
      data: edge.data(),
      position: { x: position.x, y: position.y },
    });
  });

  // Background click to deselect
  cy.on("tap", (event) => {
    if (event.target === cy) {
      setSelectedElement(null);
    }
  });

  return () => {
    cy.removeAllListeners();
  };
}, [cyRef.current, onNodeHover, onNodeClick]);
```

### Dimensional Mode: Multiple Edges

For dimensional mode with multiple edges between the same nodes, use `curve-style: bezier` with `control-point-step-size`:

```typescript
// In dimensional mode, create separate edges per dimension
const dimensionalEdges = links.flatMap((link) => {
  if (!link.dimensionalDistances?.length) return [];

  return link.dimensionalDistances.map((dim, index) => {
    const totalDims = link.dimensionalDistances!.length;
    // Spread curves from -40 to +40 pixels
    const controlPointStep = totalDims > 1 
      ? -40 + (index / (totalDims - 1)) * 80 
      : 0;

    return {
      data: {
        id: `${link.source}-${link.target}-${dim.dimension}`,
        source: link.source,
        target: link.target,
        distance: dim.distance,
        dimension: dim.dimension,
        dimensionLabel: dim.label,
        width: computeEdgeWidth(dim.distance, "dimensional"),
        color: getDimensionColor(dim.dimension, framework),
        opacity: computeEdgeOpacity(dim.distance),
        controlPointStep,
      },
    };
  });
});

// Stylesheet for dimensional edges
{
  selector: "edge[controlPointStep]",
  style: {
    "curve-style": "unbundled-bezier",
    "control-point-distances": "data(controlPointStep)",
    "control-point-weights": 0.5,
  },
}
```

## User Flow

1. Facilitator navigates to workshop visualization
2. System loads graph data and transforms to Cytoscape format
3. Cytoscape renders nodes and edges with CoSE layout
4. Layout stabilizes and zooms to fit
5. Facilitator can:
   - **Hover** over nodes/edges to see highlights and native tooltips
   - **Click** nodes/edges to pin detailed tooltips
   - **Toggle** between aggregate and dimensional edge modes
   - **Pan/zoom** to explore the graph
   - **Click background** to deselect

## Acceptance Criteria

### Interaction Criteria
- [ ] Hovering over any node highlights it with a green border
- [ ] Hovering over any edge makes it thicker and more opaque
- [ ] Clicking a node shows detailed tooltip with cultural scores
- [ ] Clicking an edge shows tooltip with distance and similarity
- [ ] Clicking background dismisses any open tooltip
- [ ] Interactions work at all zoom levels

### Styling Criteria
- [ ] Edge thickness correctly represents similarity (thicker = more similar)
- [ ] Edge color/opacity correctly represents similarity
- [ ] In dimensional mode, each dimension has distinct color
- [ ] Nodes are colored by country
- [ ] Selected nodes have blue border

### Layout Criteria
- [ ] Force-directed layout positions nodes sensibly
- [ ] Culturally closer nodes are positioned closer together
- [ ] Layout stabilizes within 2 seconds
- [ ] Zoom-to-fit shows all nodes

### Mode Switching Criteria
- [ ] Switching to dimensional mode shows multiple colored edges
- [ ] Switching to aggregate mode shows single gray edges
- [ ] Mode switch transitions smoothly

## Edge Cases

- Single node (no edges to display)
- Two nodes (single edge)
- All participants from same country (very short edges)
- Very different cultures (very long edges)
- Large number of participants (50+) - performance consideration
- Framework with missing data for some dimensions

## Non-Functional Requirements

### Performance
- Initial render: < 1 second for 20 participants
- Layout stabilization: < 2 seconds for 20 participants
- Mode switching: < 500ms
- Smooth interactions at 60fps

### Accessibility
- Keyboard navigation support (future enhancement)
- Screen reader compatibility for tooltips
- Sufficient color contrast

### Browser Support
- Chrome, Firefox, Safari, Edge (latest versions)
- Mobile browsers (touch events via tap)

## Migration Plan

### Phase 1: Extract Utilities
1. Create `utils/graph-colors.ts` with color mapping functions
2. Create `utils/graph-tooltips.tsx` with tooltip content components
3. Create `utils/graph-data-transform.ts` with Cytoscape format transformer
4. Create `graph-legend.tsx` as standalone component

### Phase 2: Implement New Component
1. Install `cytoscape` and `react-cytoscapejs`
2. Create new `network-graph.tsx` using Cytoscape
3. Implement stylesheet and layout configuration
4. Wire up event handlers

### Phase 3: Test and Cleanup
1. Test all interactions thoroughly
2. Verify visual parity with design requirements
3. Remove `react-force-graph-2d` dependency
4. Move old FRED to `implemented/` directory

## References

- [Cytoscape.js Documentation](https://js.cytoscape.org/)
- [Cytoscape.js Style Properties](https://js.cytoscape.org/#style)
- [Cytoscape.js Events](https://js.cytoscape.org/#events)
- [CoSE Layout](https://js.cytoscape.org/#layouts/cose)
- [react-cytoscapejs](https://github.com/plotly/react-cytoscapejs)
- [Edge Types Demo](https://js.cytoscape.org/demos/edge-types/)
