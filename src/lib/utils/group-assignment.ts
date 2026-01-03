/**
 * Group assignment algorithm
 * Generates maximally diverse groups based on cultural distances
 */

import { generateDistanceMatrix } from "./distance-matrix";
import type { Framework, CulturalScores } from "./cultural-distance";

export type Group = {
  participants: string[];
};

type ParticipantWithScores = {
  id: string;
  culturalScores: CulturalScores;
};

/**
 * Genetic Algorithm configuration
 */
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

/**
 * Chromosome representation: a group assignment solution
 */
type Chromosome = {
  groups: Group[];
  fitness: number;
};

/**
 * Seeded random number generator for deterministic results
 */
type SeededRNG = () => number;

/**
 * Generates maximally diverse groups of participants.
 * Uses Genetic Algorithm for global optimization, with fallback to greedy algorithm.
 *
 * @param participants - Array of participants with cultural scores
 * @param framework - Framework to use for distance calculation
 * @param groupSize - Target group size (3, 4, or null for flexible 3-4)
 * @param workshopId - Optional workshop ID for deterministic GA seeding
 * @returns Array of groups with participant IDs
 */
export function generateGroups(
  participants: ParticipantWithScores[],
  framework: Framework,
  groupSize: number | null, // 3, 4, or null for flexible
  workshopId?: string
): Group[] | undefined {
  if (participants.length === 0 || participants.length < 3) {
    return undefined;
  }

  // Try Genetic Algorithm first if workshopId is provided
  if (workshopId) {
    try {
      const gaResult = generateGroupsWithGA(
        participants,
        framework,
        groupSize,
        workshopId
      );
      if (gaResult) {
        return gaResult;
      }
    } catch (error) {
      console.warn("GA failed, falling back to greedy algorithm:", error);
    }
  }

  // Fallback to greedy algorithm
  return generateGroupsGreedy(participants, framework, groupSize);
}

/**
 * Forms a maximally diverse group from candidate participants.
 */
function formMaxDiverseGroup(
  candidates: string[],
  distanceMatrix: Map<string, Map<string, number>>,
  targetSize: number,
  flexible: boolean,
  assignedCount: number,
  totalCount: number
): string[] {
  const group: string[] = [];

  // First participant: pick participant with highest average distance to others
  const first = selectInitialParticipant(candidates, distanceMatrix);
  group.push(first);

  // Add participants that maximize diversity
  const remaining = candidates.filter((id) => id !== first);

  while (group.length < targetSize && remaining.length > 0) {
    // For flexible groups, check if we should stop at 3
    if (flexible && group.length === 3) {
      const remainingAfterThis = totalCount - assignedCount - group.length - 1;
      // If remainder would create groups that are too unbalanced, prefer 4
      // Otherwise, 3 is acceptable
      if (remainingAfterThis >= 3) {
        // Can afford another participant
      } else {
        // Better to stop at 3
        break;
      }
    }

    // Find participant that maximizes minimum distance to current group
    const next = findMostDistantParticipant(group, remaining, distanceMatrix);
    group.push(next);
    remaining.splice(remaining.indexOf(next), 1);
  }

  return group;
}

/**
 * Selects the initial participant for a group.
 * Chooses the participant with the highest average distance to all other candidates.
 */
function selectInitialParticipant(
  candidates: string[],
  distanceMatrix: Map<string, Map<string, number>>
): string {
  if (candidates.length === 1) return candidates[0];

  let maxAvgDistance = -1;
  let bestCandidate = candidates[0];

  for (const candidate of candidates) {
    const distances = distanceMatrix.get(candidate);
    if (!distances) continue;

    let sum = 0;
    let count = 0;

    for (const other of candidates) {
      if (other === candidate) continue;
      const dist = distances.get(other) ?? 0;
      sum += dist;
      count++;
    }

    const avgDistance = count > 0 ? sum / count : 0;

    if (avgDistance > maxAvgDistance) {
      maxAvgDistance = avgDistance;
      bestCandidate = candidate;
    }
  }

  return bestCandidate;
}

/**
 * Finds the participant that maximizes the minimum distance to the current group.
 */
function findMostDistantParticipant(
  group: string[],
  candidates: string[],
  distanceMatrix: Map<string, Map<string, number>>
): string {
  let maxMinDistance = -1;
  let bestCandidate = candidates[0];

  for (const candidate of candidates) {
    const distances = distanceMatrix.get(candidate);
    if (!distances) continue;

    // Find minimum distance to any participant in current group
    let minDistance = Infinity;

    for (const groupMember of group) {
      const dist = distances.get(groupMember) ?? 0;
      minDistance = Math.min(minDistance, dist);
    }

    // Maximize the minimum distance (most diverse)
    if (minDistance > maxMinDistance) {
      maxMinDistance = minDistance;
      bestCandidate = candidate;
    }
  }

  return bestCandidate;
}

/**
 * Greedy algorithm implementation (fallback method)
 */
function generateGroupsGreedy(
  participants: ParticipantWithScores[],
  framework: Framework,
  groupSize: number | null
): Group[] | undefined {
  // Generate distance matrix
  const distanceMatrix = generateDistanceMatrix(participants, framework);

  // Determine target group size
  const targetSize = groupSize ?? 4; // Default to 4 for flexible
  const flexible = groupSize === null;

  // Sort participants by ID for determinism
  const sortedParticipants = [...participants].sort((a, b) =>
    a.id.localeCompare(b.id)
  );

  // Greedy algorithm: iteratively form groups
  const groups: Group[] = [];
  const assigned = new Set<string>();
  const participantIds = sortedParticipants.map((p) => p.id);

  while (assigned.size < participantIds.length) {
    const remaining = participantIds.filter((id) => !assigned.has(id));

    if (remaining.length === 0) break;

    // Start new group with most distant unassigned participants
    const group = formMaxDiverseGroup(
      remaining,
      distanceMatrix,
      targetSize,
      flexible,
      assigned.size,
      participantIds.length
    );

    groups.push({ participants: group });
    group.forEach((id) => {
      assigned.add(id);
    });
  }

  return groups;
}

/**
 * Generates groups using Genetic Algorithm for global diversity maximization
 */
function generateGroupsWithGA(
  participants: ParticipantWithScores[],
  framework: Framework,
  groupSize: number | null,
  seed: string,
  config: GAConfig = DEFAULT_GA_CONFIG
): Group[] | undefined {
  if (participants.length < 3) {
    return undefined;
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

    // Sort by fitness (descending - higher is better)
    population.sort((a, b) => b.fitness - a.fitness);

    // Elitism: Keep top performers
    const eliteCount = Math.floor(config.populationSize * config.elitismRate);
    const elite = population.slice(0, eliteCount);

    // Create new population through selection, crossover, mutation
    const newPopulation: Chromosome[] = [...elite];
    while (newPopulation.length < config.populationSize) {
      const parent1 = tournamentSelection(population, rng);
      const parent2 = tournamentSelection(population, rng);
      const offspring = crossover(parent1, parent2, participants, groupSize, rng);
      const mutated = mutate(offspring, config.mutationRate, groupSize, rng);
      newPopulation.push(mutated);
    }

    // Evaluate new population
    population = evaluatePopulation(newPopulation, distanceMatrix);
  }

  // Sort final population and return best solution
  population.sort((a, b) => b.fitness - a.fitness);
  return population[0]?.groups;
}

/**
 * Fitness function: Sum of average intra-group distances
 * Higher fitness = more diverse groups
 */
function calculateFitness(
  groups: Group[],
  distanceMatrix: Map<string, Map<string, number>>
): number {
  let totalFitness = 0;

  for (const group of groups) {
    const distances: number[] = [];
    const participantIds = group.participants;

    // Calculate all pairwise distances within the group
    for (let i = 0; i < participantIds.length; i++) {
      for (let j = i + 1; j < participantIds.length; j++) {
        const dist =
          distanceMatrix.get(participantIds[i])?.get(participantIds[j]) ?? 0;
        distances.push(dist);
      }
    }

    // Average distance within this group
    const avgDistance =
      distances.length > 0
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
  rng: SeededRNG
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
 * Create random group assignment
 */
function createRandomGroups(
  participants: ParticipantWithScores[],
  groupSize: number | null,
  rng: SeededRNG
): Group[] {
  const participantIds = [...participants].map((p) => p.id);
  const shuffled = [...participantIds].sort(() => rng() - 0.5);

  const groups: Group[] = [];
  const targetSize = groupSize ?? 4;
  const flexible = groupSize === null;

  let currentIndex = 0;

  while (currentIndex < shuffled.length) {
    const remaining = shuffled.length - currentIndex;
    let size = targetSize;

    // For flexible groups, decide size based on remainder
    if (flexible) {
      if (remaining <= 3) {
        size = remaining; // Use all remaining
      } else if (remaining === 4 || remaining === 5) {
        size = 3; // Prefer 3 to avoid very small groups
      } else {
        size = rng() < 0.5 ? 3 : 4; // Random 3 or 4
      }
    } else {
      // Fixed size, but handle remainder
      if (remaining < targetSize) {
        size = remaining;
      }
    }

    const group: Group = {
      participants: shuffled.slice(currentIndex, currentIndex + size),
    };
    groups.push(group);
    currentIndex += size;
  }

  return groups;
}

/**
 * Evaluate fitness for all chromosomes in population
 */
function evaluatePopulation(
  population: Chromosome[],
  distanceMatrix: Map<string, Map<string, number>>
): Chromosome[] {
  return population.map((chromosome) => ({
    ...chromosome,
    fitness: calculateFitness(chromosome.groups, distanceMatrix),
  }));
}

/**
 * Tournament selection: randomly select k candidates and return the best
 */
function tournamentSelection(
  population: Chromosome[],
  rng: SeededRNG,
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
 * Crossover: Create offspring by combining parent solutions
 */
function crossover(
  parent1: Chromosome,
  parent2: Chromosome,
  participants: ParticipantWithScores[],
  groupSize: number | null,
  rng: SeededRNG
): Chromosome {
  // Use parent1 as base, then swap some participants from parent2
  const allParticipants = new Set(
    participants.map((p) => p.id)
  );
  const childGroups: Group[] = parent1.groups.map((g) => ({
    participants: [...g.participants],
  }));

  // Collect all participants from child groups
  const assignedInChild = new Set<string>();
  for (const g of childGroups) {
    for (const id of g.participants) {
      assignedInChild.add(id);
    }
  }

  // Find participants that are in different groups between parents
  const participantToGroup1 = new Map<string, number>();
  const participantToGroup2 = new Map<string, number>();

  for (let idx = 0; idx < parent1.groups.length; idx++) {
    const g = parent1.groups[idx];
    for (const id of g.participants) {
      participantToGroup1.set(id, idx);
    }
  }

  for (let idx = 0; idx < parent2.groups.length; idx++) {
    const g = parent2.groups[idx];
    for (const id of g.participants) {
      participantToGroup2.set(id, idx);
    }
  }

  // Swap a few participants between groups
  const swapCount = Math.max(1, Math.floor(participants.length * 0.1));
  for (let i = 0; i < swapCount; i++) {
    if (rng() < 0.5) {
      // Try to swap a participant
      const unassigned = Array.from(allParticipants).filter(
        (id) => !assignedInChild.has(id)
      );
      if (unassigned.length > 0 && childGroups.length > 0) {
        const participant = unassigned[Math.floor(rng() * unassigned.length)];
        const targetGroupIdx = Math.floor(rng() * childGroups.length);
        childGroups[targetGroupIdx].participants.push(participant);
        assignedInChild.add(participant);
      }
    }
  }

  // Ensure all participants are assigned
  const unassigned = Array.from(allParticipants).filter(
    (id) => !assignedInChild.has(id)
  );
  for (const participant of unassigned) {
    if (childGroups.length === 0) {
      childGroups.push({ participants: [] });
    }
    const targetGroupIdx = Math.floor(rng() * childGroups.length);
    childGroups[targetGroupIdx].participants.push(participant);
  }

  // Validate and fix group sizes
  return validateAndFixGroups(childGroups, participants, groupSize, rng);
}

/**
 * Mutation: Randomly reassign participants to different groups
 */
function mutate(
  chromosome: Chromosome,
  mutationRate: number,
  groupSize: number | null,
  rng: SeededRNG
): Chromosome {
  if (rng() > mutationRate) {
    return chromosome;
  }

  const mutatedGroups = chromosome.groups.map((g) => ({
    participants: [...g.participants],
  }));

  // Collect all participants
  const allParticipants: string[] = [];
  mutatedGroups.forEach((g) => {
    allParticipants.push(...g.participants);
  });

  if (allParticipants.length === 0) {
    return chromosome;
  }

  // Perform mutation: move a random participant to a different group
  const participant =
    allParticipants[Math.floor(rng() * allParticipants.length)];
  const sourceGroupIdx = mutatedGroups.findIndex((g) =>
    g.participants.includes(participant)
  );

  if (sourceGroupIdx >= 0 && mutatedGroups.length > 1) {
    // Remove from source group
    mutatedGroups[sourceGroupIdx].participants = mutatedGroups[
      sourceGroupIdx
    ].participants.filter((p) => p !== participant);

    // Add to random target group (different from source)
    let targetGroupIdx = Math.floor(rng() * mutatedGroups.length);
    if (targetGroupIdx === sourceGroupIdx) {
      targetGroupIdx = (targetGroupIdx + 1) % mutatedGroups.length;
    }
    mutatedGroups[targetGroupIdx].participants.push(participant);
  }

  // Validate and fix group sizes
  return {
    groups: validateAndFixGroups(
      mutatedGroups,
      allParticipants.map((id) => ({ id, culturalScores: {} })),
      groupSize,
      rng
    ).groups,
    fitness: 0, // Will be recalculated
  };
}

/**
 * Validate and fix group sizes to meet constraints
 */
function validateAndFixGroups(
  groups: Group[],
  participants: ParticipantWithScores[],
  groupSize: number | null,
  rng: SeededRNG
): Chromosome {
  const allParticipantIds = new Set(participants.map((p) => p.id));
  const targetSize = groupSize ?? 4;
  const flexible = groupSize === null;

  // Collect all participants from groups
  const assigned = new Set<string>();
  groups.forEach((g) => {
    g.participants.forEach((id) => {
      if (allParticipantIds.has(id)) {
        assigned.add(id);
      }
    });
  });

  // Remove invalid participants and add missing ones
  const validGroups: Group[] = groups.map((g) => ({
    participants: g.participants.filter((id) => allParticipantIds.has(id)),
  }));

  // Add missing participants
  const missing = Array.from(allParticipantIds).filter((id) => !assigned.has(id));
  for (const participant of missing) {
    if (validGroups.length === 0) {
      validGroups.push({ participants: [] });
    }
    const targetGroupIdx = Math.floor(rng() * validGroups.length);
    validGroups[targetGroupIdx].participants.push(participant);
  }

  // Redistribute to meet size constraints
  const allParticipants: string[] = [];
  validGroups.forEach((g) => {
    allParticipants.push(...g.participants);
  });

  const redistributed: Group[] = [];
  let currentIndex = 0;

  while (currentIndex < allParticipants.length) {
    const remaining = allParticipants.length - currentIndex;
    let size = targetSize;

    if (flexible) {
      if (remaining <= 3) {
        size = remaining;
      } else if (remaining === 4 || remaining === 5) {
        size = 3;
      } else {
        size = rng() < 0.5 ? 3 : 4;
      }
    } else {
      if (remaining < targetSize) {
        size = remaining;
      }
    }

    redistributed.push({
      participants: allParticipants.slice(currentIndex, currentIndex + size),
    });
    currentIndex += size;
  }

  return {
    groups: redistributed,
    fitness: 0, // Will be recalculated
  };
}

/**
 * Create seeded random number generator for deterministic results
 */
function createSeededRNG(seed: string): SeededRNG {
  // Simple LCG (Linear Congruential Generator)
  let state = hashString(seed);
  return () => {
    state = (state * 1664525 + 1013904223) % Math.pow(2, 32);
    return state / Math.pow(2, 32);
  };
}

/**
 * Hash string to integer for RNG seed
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}
