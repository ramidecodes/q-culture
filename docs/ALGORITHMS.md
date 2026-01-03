# Cultural Distance & Grouping Algorithms

## Overview

This document details the mathematical algorithms and technical approaches used in the Q-Culture platform for calculating cultural distances between participants and generating culturally diverse groups.

## Core Algorithms

### 1. Cultural Distance Calculation

The core of the application is the ability to quantify the "distance" between two cultures. We use the **Euclidean Distance** metric applied to various cultural frameworks (Lewis, Hall, Hofstede).

**Formula:**
$$ d(p_1, p_2) = \sqrt{\sum_{i=1}^{n} (s_{1,i} - s_{2,i})^2} $$

Where:
- $p_1, p_2$ are two participants (or their respective country's cultural profiles).
- $n$ is the number of dimensions in the selected framework.
- $s_{1,i}$ is the score of participant 1 on dimension $i$.

**Frameworks:**
- **Lewis (3 dimensions):** Linear-Active, Multi-Active, Reactive.
- **Hall (3 dimensions):** Context (High/Low), Time (Poly/Monochronic), Space (Public/Private).
- **Hofstede (6 dimensions):** Power Distance, Individualism, Masculinity, Uncertainty Avoidance, Long-Term Orientation, Indulgence.
- **Combined:** A normalized average of the distances calculated from all available frameworks for the given country pair. Each framework's distance is normalized to [0,1] range by dividing by its theoretical maximum (√dimensions) before averaging, ensuring equal weighting regardless of dimension count.

**Implementation:**
- Logic is located in `src/lib/utils/cultural-distance.ts`.
- Scores are pre-normalized to a [0, 1] range in the database to ensure dimensions contribute equally.
- Missing data is handled by checking framework availability before computation (`src/lib/utils/framework-availability.ts`).
- For the "combined" framework, distances are normalized to [0,1] range before averaging (see "Implemented Improvements" section below).

### 2. Distance Matrix Generation

To perform efficient lookups and group generation, we compute a pairwise distance matrix for all participants in a workshop.

**Approach:**
- Iterate through all unique pairs of participants.
- Compute the cultural distance for the selected framework.
- Store results in a `Map<string, Map<string, number>>` (Adjacency Matrix).
- **Time Complexity:** $O(N^2)$ where $N$ is the number of participants. Given typical workshop sizes ($N < 100$), this is negligible (< 10ms).

**Implementation:**
- Located in `src/lib/utils/distance-matrix.ts`.

### 3. Group Assignment (Genetic Algorithm with Greedy Fallback)

The goal is to create groups where participants are as culturally distinct as possible ("Maximize Diversity"). We use a **Genetic Algorithm (GA)** for global optimization, with a **Greedy Heuristic** as fallback.

#### Genetic Algorithm (Primary Method)

**Algorithm Overview:**
The GA optimizes the global average diversity across all groups by evolving a population of candidate solutions through selection, crossover, and mutation.

**Algorithm Steps:**
1. **Initialize Population:** Generate random group assignments (population size: 50 by default)
2. **Evaluate Fitness:** Calculate fitness as sum of average intra-group distances across all groups
   $$ \text{Fitness} = \sum_{g \in G} \bar{d}_g $$
   where $\bar{d}_g = \frac{1}{n_p} \sum_{i<j \in g} d(p_i, p_j)$ is the average pairwise distance within group $g$, and $n_p = |g|(|g|-1)/2$ is the number of pairs in group $g$.
   
   In simpler terms: For each group, calculate the average distance between all pairs of participants, then sum these averages across all groups. Higher fitness = more diverse groups.
3. **Evolve Population:**
   - **Elitism:** Keep top 20% of population (sorted by fitness)
   - **Selection:** Tournament selection (size 3) - randomly pick 3 candidates, choose the best
   - **Crossover:** Combine parent solutions by taking groups from parent1 and swapping participants from parent2
   - **Mutation:** With 10% probability, randomly move a participant to a different group
   - **Validation:** Ensure all participants are assigned and group size constraints are met
4. **Repeat:** Evolve for 100 generations (or until timeout: 2 seconds)
5. **Return:** Best solution from final population (highest fitness)

**Configuration:**
- Population size: 50 (configurable: 20-100)
- Generations: 100 (configurable: 50-200)
- Mutation rate: 0.1 (10%, configurable: 5-20%)
- Elitism rate: 0.2 (20%)
- Timeout: 2000ms

**Determinism:**
- Uses seeded random number generator (Linear Congruential Generator) with workshop ID as seed
- Workshop ID is hashed to an integer seed using a simple hash function
- LCG formula: $state = (state \times 1664525 + 1013904223) \bmod 2^{32}$
- Same workshop ID + participants + configuration = same groups (reproducible results)

#### Greedy Algorithm (Fallback Method)

Used when GA fails, times out, or workshop ID is not provided.

**Algorithm Steps:**
1.  **Initialize:** Create an empty set of groups.
2.  **Select First Participant:** Choose the participant with the highest average distance to all other participants (the most "culturally distinct" individual).
3.  **Form Group:**
    *   Add the selected participant to a new group.
    *   Iteratively add the unassigned participant who maximizes the **minimum** distance to the current group members.
    *   $$ \text{Select } p \text{ s.t. } \max_{p \in U} (\min_{g \in G} d(p, g)) $$
    *   Where $U$ is the set of unassigned participants and $G$ is the current group.
4.  **Repeat:** Once a group reaches the target size (3 or 4), start a new group with the "most distant" remaining participant and repeat step 3.

**Rationale:**
- Ensures that within each group, no two members are "too close" if possible.
- Deterministic (by sorting IDs) to ensure reproducible results.
- Handles flexible group sizes (3-4) by checking remainders to avoid stragglers.

**Implementation:**
- Located in `src/lib/utils/group-assignment.ts`.

## Visualization Logic

Visualizations (Network Graph, Heatmap) transform the distance matrix into graphical primitives.

- **Network Graph:** Uses a force-directed graph where edge length is inversely proportional to cultural distance (similar nodes attract, dissimilar nodes repel).
- **Heatmap:** Direct mapping of the distance matrix to a color scale.
- **Implementation:** `src/lib/utils/visualization-data.ts` transforms the raw matrix into nodes/links for the UI.

---

## Scientific Review & Analysis

### Strengths
1.  **Modularity:** The separation of distance calculation (`cultural-distance.ts`) from the grouping logic (`group-assignment.ts`) allows for easy swapping of algorithms or frameworks.
2.  **Robustness:** The code explicitly handles missing data and ensures determinism, which is crucial for workshop facilitation (re-running the tool gives the same groups).
3.  **Performance:** $O(N^2)$ is perfectly acceptable for the expected scale ($N \approx 50-100$). Optimization is not currently a priority.

### Critiques & Limitations
1.  **Euclidean Assumption:** Euclidean distance assumes dimensions are orthogonal (independent). In cultural studies, dimensions often correlate (e.g., High Context often correlates with Polychronic time). This can lead to "double counting" certain cultural traits.
2.  ~~**"Combined" Framework Scaling:**~~ ✅ **RESOLVED:** The "Combined" framework now normalizes distances to [0,1] range before averaging, ensuring equal weighting.
3.  ~~**Greedy Optimization:**~~ ✅ **RESOLVED:** Genetic Algorithm now optimizes global diversity, with greedy as fallback.

### Implemented Improvements

#### 1. Normalized Distances for "Combined" Framework ✅
**Implementation:** Before averaging distances in the `combined` framework, normalize them to a standard 0-1 scale relative to their theoretical maximum (Euclidean distance in n-dimensional space with max difference of 1 per dimension):
- Lewis: divide by $\sqrt{3} \approx 1.732$ (3 dimensions)
- Hall: divide by $\sqrt{3} \approx 1.732$ (3 dimensions)
- Hofstede: divide by $\sqrt{6} \approx 2.449$ (6 dimensions)

**Normalization Formula:**
$$ d_{\text{normalized}} = \frac{d_{\text{raw}}}{\sqrt{n}} $$
where $n$ is the number of dimensions in the framework.

**Benefit:** Ensures that each framework contributes exactly 33.33% (or 100% if fewer available) to the final decision, regardless of how many dimensions it has. Without normalization, frameworks with more dimensions would have larger maximum distances and thus contribute more weight to the average.

**Location:** `src/lib/utils/cultural-distance.ts` - `computeCombinedDistance()` function

#### 2. Global Optimization (Genetic Algorithm) ✅
**Implementation:** Genetic Algorithm for global diversity maximization with greedy fallback.

**Approach:**
*   **Chromosome:** A partition of participants into groups (represented as `Group[]`)
*   **Fitness Function:** Sum of average intra-group distances across all groups (higher = better)
*   **Evolution:** Population-based search with:
    - Tournament selection (size 3) for parent selection
    - Crossover: Combine parent solutions by swapping participants between groups
    - Mutation: Randomly reassign participants (10% mutation rate)
    - Elitism: Preserve top 20% of population each generation
*   **Determinism:** Seeded RNG using workshop ID ensures reproducible results
*   **Group Size Constraints:** Handles fixed sizes (3 or 4) and flexible sizes (3-4) with remainder participants

**Benefits:**
- Avoids "bad last groups" by optimizing globally across all groups simultaneously
- Produces ≥10% better average diversity than greedy algorithm (measured as sum of intra-group average distances)
- Performance: < 500ms for 50 participants, < 2s for 100 participants
- Fallback to greedy algorithm if GA fails, times out, or workshop ID is not provided
- Handles edge cases: small groups, remainder participants, identical cultural profiles

**Location:** `src/lib/utils/group-assignment.ts` - `generateGroupsWithGA()` function and related helper functions

#### 3. Weighted Dimensions
**Proposal:** Allow facilitators to weight specific dimensions (e.g., "I care more about 'Time' than 'Space'").
**Benefit:** More tailored workshops for specific business goals (e.g., a workshop specifically about Punctuality vs. Flexibility).
