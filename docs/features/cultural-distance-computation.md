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

## Future Enhancements

- Custom framework weighting (not just equal)
- Alternative distance metrics (Manhattan, Cosine similarity)
- Caching of distance calculations
- Visualization of distance matrix
- Distance threshold validation
