# Feature Requirement Document: Algorithm Improvements

## Feature Name

Cultural Distance & Grouping Algorithm Improvements

## Goal

Improve the mathematical accuracy of cultural distance calculations and achieve globally optimal group assignments with maximum diversity across all groups. This feature addresses two key limitations in the current implementation: improper scaling of combined framework distances and local optimization in group assignment.

## User Story

As a facilitator, I want more balanced and mathematically sound group assignments, so that workshops benefit from globally optimal cultural diversity rather than locally optimized groups that may leave some groups with poor diversity.

As a system, I need to compute combined framework distances with proper normalization, so that all frameworks contribute equally regardless of their dimension count.

## Functional Requirements

### Component 1: Normalized Combined Framework Distance

- Normalize distances from each framework (Lewis, Hall, Hofstede) to a [0,1] scale before averaging
- Normalization formula: Divide each framework distance by its theoretical maximum (√dimensions)
  - Lewis: divide by √3 ≈ 1.732
  - Hall: divide by √3 ≈ 1.732
  - Hofstede: divide by √6 ≈ 2.449
- Ensure equal weighting: Each framework contributes exactly 33.33% (or 100% if fewer available)
- Maintain backward compatibility: Individual framework distances (lewis, hall, hofstede) remain unchanged
- Only normalize when using "combined" framework option
- Handle partial framework availability (normalize only available frameworks)

### Component 2: Genetic Algorithm for Group Assignment

- Replace greedy algorithm with Genetic Algorithm (GA) optimization for global diversity maximization
- Optimize fitness function: Sum of average intra-group distances across all groups
- Support configurable GA parameters:
  - Population size: Default 50, configurable (20-100)
  - Generations: Default 100, configurable (50-200)
  - Mutation rate: Default 0.1 (10%), configurable (0.05-0.2)
  - Elitism: Keep top 20% of population each generation
- Maintain deterministic results through seeded random number generation
- Use workshop ID as seed for reproducibility
- Handle edge cases: Groups of 3-4, uneven participant counts, remainder participants
- Support flexible group sizes (3-4) and fixed sizes (3 or 4)
- Fallback to greedy algorithm if GA fails or times out

## Data Requirements

**No new database tables or fields required**

- All changes are algorithmic improvements in computation logic
- Existing data structures remain unchanged
- Distance matrix format remains the same (Map<string, Map<string, number>>)
- Group output format remains the same (Group[] with participant IDs)

**Configuration Options**

- GA parameters can be hardcoded initially (future enhancement: store in database)
- Framework normalization is automatic when "combined" is selected

## User Flow

### For Normalized Combined Framework

1. Facilitator configures workshop and selects "Combined" framework
2. System computes distances using individual frameworks (Lewis, Hall, Hofstede)
3. System normalizes each framework's distances by dividing by √dimensions
4. System averages the normalized distances
5. System uses normalized combined distance for grouping algorithm
6. (No change to facilitator experience - automatic improvement)

### For Genetic Algorithm Group Assignment

1. Facilitator clicks "Generate Groups" button
2. System validates workshop configuration and participant count (minimum 3)
3. System retrieves all participants and cultural scores
4. System computes distance matrix (with normalized combined distances if applicable)
5. System initializes GA with seed based on workshop ID
6. System runs GA optimization:
   - Generate initial population of random group assignments
   - Evaluate fitness (sum of intra-group average distances)
   - Evolve population through selection, crossover, mutation
   - Repeat for specified number of generations
7. System selects best solution from final population
8. System creates groups in database (transaction-wrapped)
9. System displays success confirmation with group assignment

## Acceptance Criteria

### Normalized Combined Framework

- Combined framework distances are normalized to [0,1] range before averaging
- Lewis framework contributes equally to Hall and Hofstede (after normalization)
- Individual framework distances (lewis, hall, hofstede) remain unchanged
- Normalization only applies when "combined" framework is selected
- Partial framework availability handled correctly (normalize available frameworks only)
- All existing tests pass with updated combined distance calculations

### Genetic Algorithm

- GA produces groups with ≥10% better average diversity than greedy algorithm (measured as sum of intra-group average distances)
- Performance: < 500ms for 50 participants, < 2s for 100 participants
- Deterministic results: Same workshop ID + participants + configuration = same groups
- All participants assigned to exactly one group
- Groups respect size constraints (3, 4, or flexible 3-4)
- Edge cases handled correctly (small groups, remainder participants)
- Fallback to greedy algorithm if GA fails or exceeds time limit
- All existing tests pass (with updated group assignments)

### Integration

- Both improvements work together seamlessly
- Normalized combined distances used as input to GA
- No breaking changes to API contracts or database schema
- Visualization components work correctly with new distance calculations
- Group assignment results are backwards compatible (same format)

## Edge Cases

### Normalized Combined Framework

- Only one framework available: Normalization still applies, single normalized distance used
- Two frameworks available: Normalize both, average the two normalized distances
- All three frameworks available: Normalize all, average the three normalized distances
- Missing cultural data for a country in one framework: Skip that framework for that country pair
- Identical countries: All normalized distances = 0, combined distance = 0

### Genetic Algorithm

- Very small participant count (< 6): GA may not provide benefit, fallback to greedy acceptable
- Uneven group sizes (e.g., 13 participants → 3 groups of 4 + 1 group of 1): GA handles remainder
- Identical cultural profiles (all distances = 0): GA terminates early, any grouping is equivalent
- Large participant count (> 100): Limit GA generations or population size to maintain performance
- GA fails to converge: Fallback to greedy algorithm with warning log
- Timeout exceeded: Fallback to greedy algorithm, log performance issue

## Non-Functional Requirements

### Performance

- Normalized combined distance calculation: No significant performance impact (< 5ms overhead)
- Genetic Algorithm: < 500ms for 50 participants, < 2s for 100 participants
- Memory usage: GA population stored efficiently, garbage collected after completion
- CPU usage: GA runs on server-side, no impact on client performance

### Reliability

- Deterministic: Same inputs always produce same outputs (seeded randomness)
- Fallback mechanism: Greedy algorithm available if GA fails
- Error handling: Graceful degradation, clear error messages
- Transaction safety: Group creation remains atomic

### Maintainability

- Code organization: GA implementation in separate functions within group-assignment.ts
- Documentation: Algorithm explained in code comments and ALGORITHMS.md
- Testing: Unit tests for normalization and GA components
- Configuration: GA parameters easily adjustable (constants or config object)

## Technical Implementation Details

### Key Files

- `src/lib/utils/cultural-distance.ts` - Add normalized distance calculation for combined framework
- `src/lib/utils/group-assignment.ts` - Implement Genetic Algorithm (replace or augment greedy algorithm)
- `docs/ALGORITHMS.md` - Updated with new algorithm documentation

### Dependencies

- Pure TypeScript for algorithm implementation (no new external dependencies)
- Seeded random number generator: Use `seedrandom` library or implement simple LCG (Linear Congruential Generator)
- Existing dependencies: Drizzle ORM, distance matrix utilities

### Normalized Combined Framework Implementation

```typescript
// src/lib/utils/cultural-distance.ts

/**
 * Maximum theoretical distances for each framework (√dimensions)
 */
const MAX_FRAMEWORK_DISTANCES = {
  lewis: Math.sqrt(3),   // ≈ 1.732
  hall: Math.sqrt(3),    // ≈ 1.732
  hofstede: Math.sqrt(6), // ≈ 2.449
} as const;

/**
 * Computes distance using combined framework with normalized distances
 */
function computeCombinedDistance(
  scores1: CulturalScores,
  scores2: CulturalScores
): number {
  const distances: number[] = [];
  const frameworks: Array<{ name: Framework; maxDist: number }> = [];

  if (scores1.lewis && scores2.lewis) {
    const distance = computeLewisDistance(scores1.lewis, scores2.lewis);
    distances.push(distance);
    frameworks.push({ name: "lewis", maxDist: MAX_FRAMEWORK_DISTANCES.lewis });
  }
  if (scores1.hall && scores2.hall) {
    const distance = computeHallDistance(scores1.hall, scores2.hall);
    distances.push(distance);
    frameworks.push({ name: "hall", maxDist: MAX_FRAMEWORK_DISTANCES.hall });
  }
  if (scores1.hofstede && scores2.hofstede) {
    const distance = computeHofstedeDistance(scores1.hofstede, scores2.hofstede);
    distances.push(distance);
    frameworks.push({ name: "hofstede", maxDist: MAX_FRAMEWORK_DISTANCES.hofstede });
  }

  if (distances.length === 0) {
    throw new Error("No cultural scores available for combined calculation");
  }

  // Normalize each distance to [0,1] range
  const normalizedDistances = distances.map((dist, idx) => 
    dist / frameworks[idx].maxDist
  );

  // Average the normalized distances
  return normalizedDistances.reduce((sum, d) => sum + d, 0) / normalizedDistances.length;
}
```

### Genetic Algorithm Implementation

```typescript
// src/lib/utils/group-assignment.ts

type GAConfig = {
  populationSize: number;
  generations: number;
  mutationRate: number;
  elitismRate: number;
  timeoutMs: number;
};

const DEFAULT_GA_CONFIG: GAConfig = {
  populationSize: 50,
  generations: 100,
  mutationRate: 0.1,
  elitismRate: 0.2,
  timeoutMs: 2000,
};

type Chromosome = {
  groups: Group[];
  fitness: number;
};

/**
 * Generates groups using Genetic Algorithm
 */
export function generateGroupsWithGA(
  participants: ParticipantWithScores[],
  framework: Framework,
  groupSize: number | null,
  seed: string, // Workshop ID for determinism
  config: GAConfig = DEFAULT_GA_CONFIG
): Group[] {
  if (participants.length < 3) {
    return [];
  }

  const distanceMatrix = generateDistanceMatrix(participants, framework);
  const rng = createSeededRNG(seed);
  const startTime = Date.now();

  // Initialize population
  let population = initializePopulation(
    participants,
    groupSize,
    config.populationSize,
    rng
  );

  // Evaluate initial fitness
  population = evaluatePopulation(population, distanceMatrix);

  // Evolve population
  for (let generation = 0; generation < config.generations; generation++) {
    // Check timeout
    if (Date.now() - startTime > config.timeoutMs) {
      console.warn("GA timeout, using best solution so far");
      break;
    }

    // Elitism: Keep top performers
    const eliteCount = Math.floor(config.populationSize * config.elitismRate);
    const elite = population.slice(0, eliteCount);

    // Create new population through selection, crossover, mutation
    const newPopulation = [...elite];
    while (newPopulation.length < config.populationSize) {
      const parent1 = tournamentSelection(population, rng);
      const parent2 = tournamentSelection(population, rng);
      const offspring = crossover(parent1, parent2, rng);
      const mutated = mutate(offspring, config.mutationRate, rng);
      newPopulation.push(mutated);
    }

    // Evaluate new population
    population = evaluatePopulation(newPopulation, distanceMatrix);
    
    // Sort by fitness (descending - higher is better)
    population.sort((a, b) => b.fitness - a.fitness);
  }

  // Return best solution
  return population[0].groups;
}

/**
 * Fitness function: Sum of average intra-group distances
 */
function calculateFitness(
  groups: Group[],
  distanceMatrix: Map<string, Map<string, number>>
): number {
  let totalFitness = 0;

  for (const group of groups) {
    const distances: number[] = [];
    const participantIds = group.participants;

    for (let i = 0; i < participantIds.length; i++) {
      for (let j = i + 1; j < participantIds.length; j++) {
        const dist = distanceMatrix.get(participantIds[i])?.get(participantIds[j]) ?? 0;
        distances.push(dist);
      }
    }

    const avgDistance = distances.length > 0
      ? distances.reduce((sum, d) => sum + d, 0) / distances.length
      : 0;

    totalFitness += avgDistance;
  }

  return totalFitness;
}

/**
 * Initialize population with random group assignments
 */
function initializePopulation(
  participants: ParticipantWithScores[],
  groupSize: number | null,
  populationSize: number,
  rng: () => number
): Chromosome[] {
  const population: Chromosome[] = [];

  for (let i = 0; i < populationSize; i++) {
    const groups = createRandomGroups(participants, groupSize, rng);
    population.push({
      groups,
      fitness: 0, // Evaluated later
    });
  }

  return population;
}

/**
 * Tournament selection
 */
function tournamentSelection(
  population: Chromosome[],
  rng: () => number,
  tournamentSize: number = 3
): Chromosome {
  const tournament: Chromosome[] = [];
  for (let i = 0; i < tournamentSize; i++) {
    const idx = Math.floor(rng() * population.length);
    tournament.push(population[idx]);
  }
  return tournament.reduce((best, candidate) => 
    candidate.fitness > best.fitness ? candidate : best
  );
}

/**
 * Crossover: Swap random participants between two parent solutions
 */
function crossover(
  parent1: Chromosome,
  parent2: Chromosome,
  rng: () => number
): Chromosome {
  // Simple crossover: Take groups from parent1, swap one random participant
  const childGroups = parent1.groups.map(g => ({ participants: [...g.participants] }));
  
  // Swap one random participant between random groups
  if (childGroups.length > 1 && parent2.groups.length > 1) {
    const group1Idx = Math.floor(rng() * childGroups.length);
    const group2Idx = Math.floor(rng() * parent2.groups.length);
    
    if (childGroups[group1Idx].participants.length > 0 && 
        parent2.groups[group2Idx].participants.length > 0) {
      const participant1Idx = Math.floor(rng() * childGroups[group1Idx].participants.length);
      const participant2Idx = Math.floor(rng() * parent2.groups[group2Idx].participants.length);
      
      const p1 = childGroups[group1Idx].participants[participant1Idx];
      const p2 = parent2.groups[group2Idx].participants[participant2Idx];
      
      // Swap
      childGroups[group1Idx].participants[participant1Idx] = p2;
      // Note: Would need to handle duplicates, constraints, etc.
    }
  }
  
  return { groups: childGroups, fitness: 0 };
}

/**
 * Mutation: Randomly reassign a participant to a different group
 */
function mutate(
  chromosome: Chromosome,
  mutationRate: number,
  rng: () => number
): Chromosome {
  if (rng() > mutationRate) {
    return chromosome;
  }

  const mutatedGroups = chromosome.groups.map(g => ({ participants: [...g.participants] }));
  
  // Find a random participant and move to random group
  const allParticipants = mutatedGroups.flatMap(g => g.participants);
  if (allParticipants.length === 0) return chromosome;
  
  const participant = allParticipants[Math.floor(rng() * allParticipants.length)];
  const sourceGroupIdx = mutatedGroups.findIndex(g => g.participants.includes(participant));
  const targetGroupIdx = Math.floor(rng() * mutatedGroups.length);
  
  if (sourceGroupIdx >= 0 && sourceGroupIdx !== targetGroupIdx) {
    mutatedGroups[sourceGroupIdx].participants = mutatedGroups[sourceGroupIdx].participants.filter(p => p !== participant);
    mutatedGroups[targetGroupIdx].participants.push(participant);
  }
  
  return { groups: mutatedGroups, fitness: 0 };
}

/**
 * Create seeded random number generator for determinism
 */
function createSeededRNG(seed: string): () => number {
  // Simple LCG (Linear Congruential Generator)
  let state = hashString(seed);
  return function() {
    state = (state * 1664525 + 1013904223) % Math.pow(2, 32);
    return state / Math.pow(2, 32);
  };
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}
```

### Integration with Existing Code

The existing `generateGroups` function will be updated to:

1. Check if GA should be used (always for now, with fallback)
2. Call `generateGroupsWithGA` with appropriate parameters
3. Fallback to existing greedy algorithm if GA fails or times out
4. Maintain same return type and interface

```typescript
export function generateGroups(
  participants: ParticipantWithScores[],
  framework: Framework,
  groupSize: number | null,
  workshopId?: string // Added for GA seed
): Group[] | undefined {
  // ... validation ...

  try {
    // Try GA first (if workshopId provided)
    if (workshopId) {
      return generateGroupsWithGA(participants, framework, groupSize, workshopId);
    }
  } catch (error) {
    console.warn("GA failed, falling back to greedy algorithm:", error);
  }

  // Fallback to existing greedy algorithm
  return generateGroupsGreedy(participants, framework, groupSize);
}
```

## Testing Considerations

### Unit Tests

- Test normalized combined distance calculation with all framework combinations
- Test GA initialization, crossover, mutation, selection operators
- Test fitness function calculation
- Test seeded RNG for determinism
- Test edge cases (small populations, single framework, etc.)

### Integration Tests

- Test GA group generation end-to-end
- Test normalized combined distances with actual cultural data
- Test fallback mechanism (GA failure → greedy)
- Test performance benchmarks (50, 100 participants)

### Comparison Tests

- Compare GA results vs greedy algorithm on same inputs
- Verify diversity improvement (≥10% average)
- Verify determinism (same seed = same results)

## Migration Strategy

### Phase 1: Implementation

1. Implement normalized combined framework distance calculation
2. Add unit tests for normalization
3. Update existing tests with new combined distance values
4. Deploy and verify no regressions

### Phase 2: GA Implementation

1. Implement GA algorithm with fallback to greedy
2. Add comprehensive unit tests
3. Performance testing and optimization
4. Integration testing with real workshop data

### Phase 3: Deployment

1. Deploy both improvements together
2. Monitor performance metrics
3. Collect feedback on group quality
4. Document in ALGORITHMS.md

### Rollback Plan

- Both improvements are backwards compatible
- Greedy algorithm remains available as fallback
- Normalization can be disabled via feature flag if needed
- No database migrations required

## Future Enhancements

- Make GA parameters configurable via UI (advanced settings)
- A/B testing framework to compare GA vs greedy results
- Adaptive GA parameters based on participant count
- Hybrid approach: GA for global optimization + greedy for refinement
- Parallel GA execution for very large participant counts
- Machine learning to optimize GA parameters over time

## References

- See `docs/ALGORITHMS.md` for detailed algorithm documentation
- See `docs/features/implemented/group-assignment.md` for current implementation
- See `docs/features/implemented/cultural-distance-computation.md` for distance calculation details
