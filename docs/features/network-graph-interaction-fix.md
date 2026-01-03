# Feature Requirement Document: Network Graph Interaction Fix

## 1. Introduction

### 1.1 Purpose
This document outlines the requirements and implementation plan for fixing interaction issues in the Network Graph visualization. The goal is to ensure accurate hover and click detection for both nodes and edges in all visualization modes ("Aggregate" and "Dimensional").

### 1.2 Scope
The changes will be limited to the `src/components/cultural-visualizations/network-graph.tsx` component and will address issues related to:
- Mismatch between visual edge rendering and interactive hit areas.
- Inability to select nodes due to incorrect hit area scaling.
- General hover precision and responsiveness.

## 2. Problem Description

### 2.1 Current State
- **Edge Interaction Mismatch**: In "Dimensional" mode, curved edges are visually rendered by the library's internal logic, while the hit detection areas are manually calculated using an approximate formula. This leads to a mismatch where hovering over a visual edge does not trigger the corresponding interaction, or triggers the wrong edge (inverse selection).
- **Node Selection Failure**: Users are unable to select nodes reliably. This is caused by an incorrect scaling factor in the `paintNodePointerArea` function, which makes hit areas shrink inappropriately when zooming in.
- **Aggregate Mode Non-Interactivity**: In "Aggregate" mode, interactions are often unresponsive due to thin hit areas and potential event bubbling issues.

### 2.2 Root Cause Analysis
1.  **Rendering Discrepancy**: The custom hit detection logic (`paintLinkPointerArea`) uses a different curvature formula than the library's default rendering engine, causing spatial misalignment.
2.  **Incorrect Scaling**: The hit area size calculations for both nodes and links incorrectly divide by `globalScale`. Since the pointer area canvas shares the same coordinate space as the graph, sizes should be constant in graph units, not screen pixels.
3.  **Missing Configuration**: Explicit pointer interaction properties (`enablePointerInteraction`, `linkHoverPrecision`) were missing or not optimized.

## 3. Proposed Solution

### 3.1 Core Strategy
The solution is to **unify the rendering logic**. Instead of trying to match the library's internal rendering "black box" with a separate hit area calculation, we will take full control of both visual rendering and hit area painting using a shared path generation function.

### 3.2 Technical Implementation

#### 3.2.1 Shared Path Generation
Create a reusable helper function `drawLinkPath` that calculates the Quadratic Bézier curve control points. This function will be used by both the visual renderer and the hit detector, guaranteeing 100% alignment.

```typescript
function drawLinkPath(
  ctx: CanvasRenderingContext2D,
  source: { x: number; y: number },
  target: { x: number; y: number },
  curvature: number
) {
  // Calculate control point
  // ... standardized formula ...
  // Draw path (moveTo -> quadraticCurveTo/lineTo)
}
```

#### 3.2.2 Custom Link Canvas Object
Implement a `renderLink` function to replace the default link rendering. This allows us to use our `drawLinkPath` for the visual layer.

- **Props**: `linkCanvasObject={renderLink}`, `linkCanvasObjectMode="replace"`
- **Visuals**: Use `getEdgeWidth` and `getEdgeColor` to maintain current styling.

#### 3.2.3 Consistent Hit Areas
Update `paintLinkPointerArea` to use the same `drawLinkPath`.

- **Width**: Use a constant width (e.g., 10 graph units) to ensure links are easily hoverable regardless of zoom level.
- **Line Caps**: Use `round` line caps to prevent hit areas from obscuring node centers.

#### 3.2.4 Corrected Node Hit Detection
Update `paintNodePointerArea` to remove `globalScale` division.

- **Radius**: Use a constant graph-unit radius (e.g., `nodeSize + 4`) to ensure the hit area scales naturally with the node visual.

#### 3.2.5 Configuration Updates
Add the following props to `ForceGraph2D`:
- `enablePointerInteraction={true}`
- `linkHoverPrecision={4}`

## 4. Requirements

### 4.1 Functional Requirements
- **FR-1**: Hovering over any part of a curved edge in "Dimensional" mode must correctly highlight that specific edge.
- **FR-2**: Hovering over a node must consistently trigger the hover state and tooltip.
- **FR-3**: Clicking a node must trigger the selection state.
- **FR-4**: Clicking an edge must trigger the edge selection state.
- **FR-5**: Interaction must remain accurate at different zoom levels.

### 4.2 Non-Functional Requirements
- **NFR-1**: Performance should not be noticeably degraded by custom rendering.
- **NFR-2**: The solution must be compatible with the existing `react-force-graph-2d` library version.
- **NFR-3**: Code must follow project TypeScript and linting standards.

## 5. Verification Plan

### 5.1 Manual Testing
1.  **Dimensional Mode Test**:
    - Zoom in on a pair of nodes with multiple curved connections.
    - Hover slowly over each curve from top to bottom.
    - Verify that the highlighted edge exactly matches the pointer position.
2.  **Aggregate Mode Test**:
    - Switch to "Aggregate" mode.
    - Hover over single straight links.
    - Verify interaction responsiveness.
3.  **Node Selection Test**:
    - Attempt to click various nodes at different zoom levels.
    - Verify selection ring appears and tooltip displays.

### 5.2 Code Verification
- Verify removal of `/ globalScale` in pointer paint functions.
- Confirm usage of `drawLinkPath` in both render and paint functions.
