# Feature Requirement Document: Cultural Distance Computation

## Feature Name

Cultural Distance Computation Engine

## Goal

Compute normalized cultural distances between participants based on their countries' cultural dimension scores, enabling the grouping algorithm to maximize diversity within groups.

## User Story

As a system, I need to compute cultural distances between participants objectively, so that the grouping algorithm can create maximally diverse groups based on cultural differences.

## Functional Requirements

- Normalize all cultural dimension scores to [0,1] range
- Compute pairwise distances between all participants
- Support distance calculation for selected framework:
  - Lewis Framework (3 dimensions)
  - Hall Framework (3 dimensions)
  - Hofstede Framework (6 dimensions)
  - Combined Framework (all dimensions weighted equally)
- Distance calculation must be deterministic (same inputs = same outputs)
- Use Euclidean distance for multi-dimensional comparison
- Handle missing data gracefully (skip participants or use defaults)
- Results stored temporarily (not persisted) during grouping process

## Data Requirements

**Input Data**

- Participant country codes
- Cultural dimension scores from reference data (already normalized)
- Selected framework configuration

**Computation Structure**

- Pairwise distance matrix (participant × participant)
- Distance values range: [0, √d] where d = number of dimensions
- Normalized distances for comparison across frameworks

**Output**

- Distance matrix for all participant pairs
- Used as input for grouping algorithm

## User Flow

- System-only process, triggered during group generation

1. System retrieves all participants for workshop
2. System retrieves cultural scores for each participant's country
3. System selects framework from workshop configuration
4. System computes pairwise distances for all participant pairs
5. System normalizes distances if needed
6. System passes distance matrix to grouping algorithm

## Acceptance Criteria

- All cultural scores are properly normalized to [0,1]
- Distance calculations are mathematically correct
- Same inputs always produce same distances (deterministic)
- Missing data handled gracefully (error or default)
- Distance matrix contains all participant pairs
- Computation completes efficiently (< 1 second for 50 participants)
- Framework-specific calculations work correctly

## Edge Cases

- Identical countries (distance = 0)
- All participants from same culture (all distances near 0)
- Missing cultural data for a country (skip or use defaults)
- Single participant (no distances to compute)
- Two participants (single distance value)
- Invalid framework selection (error handling)
- Invalid cultural score values (validation)

## Non-Functional Requirements

- Distance computation completes in < 1 second for typical workshops (< 50 participants)
- Algorithm is deterministic (same inputs = same outputs)
- Memory efficient (avoid storing unnecessary intermediate values)
- Type-safe implementation (TypeScript)

## Technical Implementation Details

### Key Files

- `lib/utils/cultural-distance.ts` - Main distance computation functions
- `lib/utils/normalization.ts` - Score normalization utilities
- `lib/utils/distance-matrix.ts` - Distance matrix generation

### Dependencies

- Pure TypeScript (no external libraries for computation)
- Drizzle ORM for data retrieval

### Distance Calculation Function

```typescript
// lib/utils/cultural-distance.ts
type CulturalScores = {
  lewis?: { linearActive: number; multiActive: number; reactive: number };
  hall?: { contextHigh: number; timePolychronic: number; spacePrivate: number };
  hofstede?: {
    powerDistance: number;
    individualism: number;
    masculinity: number;
    uncertaintyAvoidance: number;
    longTermOrientation: number;
    indulgence: number;
  };
};

type Framework = "lewis" | "hall" | "hofstede" | "combined";

export function computeCulturalDistance(
  scores1: CulturalScores,
  scores2: CulturalScores,
  framework: Framework
): number {
  switch (framework) {
    case "lewis":
      return computeLewisDistance(scores1.lewis, scores2.lewis);
    case "hall":
      return computeHallDistance(scores1.hall, scores2.hall);
    case "hofstede":
      return computeHofstedeDistance(scores1.hofstede, scores2.hofstede);
    case "combined":
      return computeCombinedDistance(scores1, scores2);
    default:
      throw new Error(`Unknown framework: ${framework}`);
  }
}

function computeLewisDistance(
  scores1?: CulturalScores["lewis"],
  scores2?: CulturalScores["lewis"]
): number {
  if (!scores1 || !scores2) {
    throw new Error("Missing Lewis scores");
  }

  const dimensions = [
    scores1.linearActive - scores2.linearActive,
    scores1.multiActive - scores2.multiActive,
    scores1.reactive - scores2.reactive,
  ];

  return euclideanDistance(dimensions);
}

function computeHallDistance(
  scores1?: CulturalScores["hall"],
  scores2?: CulturalScores["hall"]
): number {
  if (!scores1 || !scores2) {
    throw new Error("Missing Hall scores");
  }

  const dimensions = [
    scores1.contextHigh - scores2.contextHigh,
    scores1.timePolychronic - scores2.timePolychronic,
    scores1.spacePrivate - scores2.spacePrivate,
  ];

  return euclideanDistance(dimensions);
}

function computeHofstedeDistance(
  scores1?: CulturalScores["hofstede"],
  scores2?: CulturalScores["hofstede"]
): number {
  if (!scores1 || !scores2) {
    throw new Error("Missing Hofstede scores");
  }

  const dimensions = [
    scores1.powerDistance - scores2.powerDistance,
    scores1.individualism - scores2.individualism,
    scores1.masculinity - scores2.masculinity,
    scores1.uncertaintyAvoidance - scores2.uncertaintyAvoidance,
    scores1.longTermOrientation - scores2.longTermOrientation,
    scores1.indulgence - scores2.indulgence,
  ];

  return euclideanDistance(dimensions);
}

function computeCombinedDistance(
  scores1: CulturalScores,
  scores2: CulturalScores
): number {
  const distances: number[] = [];

  if (scores1.lewis && scores2.lewis) {
    distances.push(computeLewisDistance(scores1.lewis, scores2.lewis));
  }
  if (scores1.hall && scores2.hall) {
    distances.push(computeHallDistance(scores1.hall, scores2.hall));
  }
  if (scores1.hofstede && scores2.hofstede) {
    distances.push(computeHofstedeDistance(scores1.hofstede, scores2.hofstede));
  }

  if (distances.length === 0) {
    throw new Error("No cultural scores available for combined calculation");
  }

  // Average of all framework distances (equal weighting)
  return distances.reduce((sum, d) => sum + d, 0) / distances.length;
}

function euclideanDistance(dimensions: number[]): number {
  const sumSquaredDiffs = dimensions.reduce(
    (sum, diff) => sum + diff * diff,
    0
  );
  return Math.sqrt(sumSquaredDiffs);
}
```

### Distance Matrix Generation

```typescript
// lib/utils/distance-matrix.ts
import { computeCulturalDistance } from "./cultural-distance";
import type { Framework } from "./cultural-distance";

type Participant = {
  id: string;
  culturalScores: CulturalScores;
};

export function generateDistanceMatrix(
  participants: Participant[],
  framework: Framework
): Map<string, Map<string, number>> {
  const matrix = new Map<string, Map<string, number>>();

  for (let i = 0; i < participants.length; i++) {
    const row = new Map<string, number>();

    for (let j = 0; j < participants.length; j++) {
      if (i === j) {
        row.set(participants[j].id, 0); // Distance to self is 0
      } else {
        const distance = computeCulturalDistance(
          participants[i].culturalScores,
          participants[j].culturalScores,
          framework
        );
        row.set(participants[j].id, distance);
      }
    }

    matrix.set(participants[i].id, row);
  }

  return matrix;
}
```

## Mathematical Details

### Euclidean Distance

For two points in n-dimensional space:

```
distance = √(Σ(diff_i)²)
```

Where `diff_i` is the difference in dimension i between the two points.

### Normalization

All cultural scores are already normalized to [0,1] range in the database, so no additional normalization needed.

### Distance Range

- **Lewis/Hall**: [0, √3] ≈ [0, 1.732]
- **Hofstede**: [0, √6] ≈ [0, 2.449]
- **Combined**: [0, max of component frameworks]

### Determinism

- Same participant IDs
- Same cultural scores
- Same framework
- → Same distance matrix (guaranteed)

## Testing Considerations

- Unit tests for each framework calculation
- Unit tests for edge cases (identical countries, missing data)
- Integration tests with sample data
- Performance tests with large participant counts
- Determinism verification (same inputs, multiple runs)

## Error Handling

- Missing cultural data: throw error or skip participant
- Invalid framework: throw error with clear message
- Invalid scores: validate before calculation
- Empty participant list: return empty matrix

## Visualization Requirements

The cultural distance computation feature must provide interactive visualizations that allow facilitators to explore and demonstrate cultural connections between participants. Visualizations are accessed from the workshop detail page after participants have joined.

### Visualization Types

#### 1. Network/Force-Directed Graph

**Purpose**: Show participants as nodes connected by edges representing cultural distance

**Components**:

- Nodes represent participants (labeled with name and country)
- Edges represent cultural distances between participants
- Edge thickness and color intensity indicate distance magnitude (thicker/darker = greater distance)
- Node size can optionally represent average distance to all other participants
- Interactive features: hover for details, click to highlight connections, drag nodes

**Framework Switching**:

- Visualization updates when framework is changed (Lewis, Hall, Hofstede, Combined)
- Edge distances recalculate based on selected framework
- Visual legend shows current framework and distance scale

**Layout Options**:

- Force-directed layout (default): Nodes repel each other, edges attract connected nodes
- Circular layout: Participants arranged in a circle
- Hierarchical layout: Grouped by country or distance clusters
- Grouped layout: If groups are generated, nodes are clustered by group assignment

**Interactive Features**:

- Hover over node: Show participant name, country, and average distance
- Hover over edge: Show exact distance value and contributing dimensions
- Click node: Highlight all connections to that participant
- Zoom and pan: Navigate large graphs
- Toggle edge visibility: Show/hide edges below threshold distance
- Filter by country: Highlight participants from selected countries

**Use Cases**:

- Facilitator demonstrates cultural proximity/distance relationships
- Visualize how grouping algorithm maximizes diversity
- Show group assignments with intra-group connections highlighted
- Compare distance patterns across different frameworks

#### 2. Distance Matrix Heatmap

**Purpose**: Show pairwise cultural distances in a matrix format for detailed analysis

**Components**:

- 2D matrix grid with participants on both axes (rows and columns)
- Each cell represents distance between two participants
- Color intensity represents distance magnitude (color scale from low to high)
- Diagonal cells (self-distance) are always 0 (darkest color)

**Features**:

- Hover tooltip: Shows exact distance value, framework dimensions, and participant pair
- Color scale legend: Maps colors to distance ranges
- Sorting options:
  - Sort by participant name (alphabetical)
  - Sort by country (group countries together)
  - Sort by average distance (most/least distant participants first)
  - Sort by group assignment (if groups generated)

**Framework Filtering**:

- Switch between frameworks (Lewis, Hall, Hofstede, Combined)
- Matrix updates to show distances for selected framework
- Side-by-side comparison mode (optional enhancement)

**Export Capabilities**:

- Download as PNG/JPEG image
- Export as CSV data
- Print-friendly version

**Use Cases**:

- Identify participants with highest/lowest cultural distances
- Understand distance distribution across the workshop
- Validate grouping algorithm results
- Find outliers (participants very different or very similar to others)

### User Flow

1. Facilitator navigates to workshop detail page
2. Facilitator views participant list
3. Facilitator clicks "View Cultural Distances" button/tab
4. System computes distance matrix for configured framework (or default to Combined)
5. System displays network graph visualization (default view)
6. Facilitator can:
   - Switch to distance matrix heatmap view
   - Change framework (updates visualization)
   - Interact with nodes/edges (hover, click, zoom)
   - Apply filters (country, distance threshold)
   - Export visualization
7. If groups are generated:
   - Visualization updates to show group assignments
   - Groups are color-coded or clustered
   - Intra-group distances can be highlighted

### Data Requirements

**Query Requirements**:

- Fetch all participants for workshop
- Fetch cultural scores for each participant's country
- Compute distance matrix for selected framework
- If groups exist, fetch group assignments

**Real-time Updates**:

- Visualization updates when new participants join (if workshop is in collecting phase)
- Framework changes trigger immediate recalculation
- Group generation updates visualization with group assignments

**Caching Considerations**:

- Distance matrix can be cached per framework (computed once, reused)
- Visualization data transforms can be memoized
- Large participant sets (>50) may need progressive loading

### Technical Implementation Details

#### Key Files

- `components/cultural-visualizations/network-graph.tsx` - Force-directed graph component
- `components/cultural-visualizations/distance-matrix.tsx` - Heatmap component
- `components/cultural-visualizations/visualization-container.tsx` - Main container with controls
- `lib/utils/visualization-data.ts` - Transform distance matrix to graph data
- `lib/hooks/use-cultural-visualization.ts` - React hook for visualization state management

#### Dependencies

- `react-force-graph-2d`: Network graph rendering
- `recharts`: For supporting charts and legends
- `d3-scale-chromatic`: Color schemes for heatmaps
- `d3-scale`: Color scaling utilities

#### Data Transformation

```typescript
// lib/utils/visualization-data.ts
export function transformDistanceMatrixToGraph(
  participants: Participant[],
  distanceMatrix: Map<string, Map<string, number>>,
  groups?: Group[]
): GraphData {
  const nodes = participants.map((p) => ({
    id: p.id,
    name: p.name,
    country: p.countryName,
    group: groups?.find((g) => g.participants.includes(p.id))?.id,
  }));

  const links: Array<{ source: string; target: string; distance: number }> = [];

  for (const [sourceId, distances] of distanceMatrix.entries()) {
    for (const [targetId, distance] of distances.entries()) {
      if (sourceId < targetId) {
        // Avoid duplicate edges
        links.push({
          source: sourceId,
          target: targetId,
          distance,
        });
      }
    }
  }

  return { nodes, links };
}

export function transformDistanceMatrixToHeatmap(
  participants: Participant[],
  distanceMatrix: Map<string, Map<string, number>>
): HeatmapData {
  const data: Array<{ x: string; y: string; value: number }> = [];

  for (let i = 0; i < participants.length; i++) {
    for (let j = 0; j < participants.length; j++) {
      const sourceId = participants[i].id;
      const targetId = participants[j].id;
      const distance = distanceMatrix.get(sourceId)?.get(targetId) ?? 0;

      data.push({
        x: participants[i].name,
        y: participants[j].name,
        value: distance,
      });
    }
  }

  return data;
}
```

### Performance Considerations

- Lazy load visualization components (code splitting)
- Virtualize large distance matrices (>50 participants)
- Debounce framework switching (wait for selection to settle)
- Cache transformed visualization data per framework
- Use Web Workers for large calculations if needed
- Progressive rendering for large graphs (render visible nodes first)

### Accessibility

- Keyboard navigation: Tab through nodes, arrow keys to move focus
- Screen reader support: ARIA labels for nodes and edges
- High contrast color schemes available
- Alternative text representations: Distance values available as text
- Tooltip information also available in sidebar or info panel

### Visualization Acceptance Criteria

- Network graph renders correctly for all participant counts (3-100+)
- Distance matrix heatmap displays accurately for all frameworks
- Framework switching updates visualization immediately
- Interactive features (hover, click, zoom) work smoothly
- Performance acceptable: renders in <2 seconds for 50 participants
- Export functionality works (PNG, CSV)
- Visualization remains responsive during interactions
- Groups are clearly distinguished when displayed
- Color scales are intuitive and accessible
- Mobile-responsive design (simplified view on small screens)

## Future Enhancements

- Custom framework weighting (not just equal)
- Alternative distance metrics (Manhattan, Cosine similarity)
- Caching of distance calculations
- 3D network visualization option
- Animation of group formation process
- Comparison mode (side-by-side frameworks)
- Historical view (how distances changed over time)
- Interactive tutorials for facilitators
