/**
 * Color mapping utilities for network graph visualization
 */

import type { Framework } from "@/types/cultural";

/**
 * Distinct color palette for countries
 */
export const COUNTRY_COLOR_PALETTE = [
  "#e6194b", // Red
  "#3cb44b", // Green
  "#ffe119", // Yellow
  "#4363d8", // Blue
  "#f58231", // Orange
  "#911eb4", // Purple
  "#46f0f0", // Cyan
  "#f032e6", // Magenta
  "#bcf60c", // Lime
  "#fabebe", // Pink
  "#008080", // Teal
  "#e6beff", // Lavender
  "#9a6324", // Brown
  "#fffac8", // Beige
  "#800000", // Maroon
  "#aaffc3", // Mint
  "#808000", // Olive
  "#ffd8b1", // Peach
  "#000075", // Navy
  "#808080", // Gray
];

/**
 * Creates a country-to-color mapping from a list of country codes
 */
export function createCountryColorMap(
  countryCodes: string[]
): Map<string, string> {
  const map = new Map<string, string>();
  const uniqueCountries = Array.from(new Set(countryCodes)).sort();

  uniqueCountries.forEach((countryCode, index) => {
    map.set(
      countryCode,
      COUNTRY_COLOR_PALETTE[index % COUNTRY_COLOR_PALETTE.length]
    );
  });

  return map;
}

/**
 * Gets the color for a specific cultural dimension based on framework
 */
export function getDimensionColor(
  dimension: string,
  framework?: Framework
): string {
  // Hofstede dimensions
  if (framework === "hofstede") {
    const hofstedeColors: Record<string, string> = {
      powerDistance: "#e6194b", // Red
      individualism: "#3cb44b", // Green
      masculinity: "#ffe119", // Yellow
      uncertaintyAvoidance: "#4363d8", // Blue
      longTermOrientation: "#f58231", // Orange
      indulgence: "#911eb4", // Purple
    };
    return hofstedeColors[dimension] ?? "#808080";
  }

  // Lewis dimensions
  if (framework === "lewis") {
    const lewisColors: Record<string, string> = {
      linearActive: "#3cb44b", // Green
      multiActive: "#f58231", // Orange
      reactive: "#4363d8", // Blue
    };
    return lewisColors[dimension] ?? "#808080";
  }

  // Hall dimensions
  if (framework === "hall") {
    const hallColors: Record<string, string> = {
      contextHigh: "#e6194b", // Red
      timePolychronic: "#3cb44b", // Green
      spacePrivate: "#4363d8", // Blue
    };
    return hallColors[dimension] ?? "#808080";
  }

  // Combined framework - use a cycling palette
  if (framework === "combined") {
    const combinedPalette = [
      "#e6194b", // Red
      "#3cb44b", // Green
      "#ffe119", // Yellow
      "#4363d8", // Blue
      "#f58231", // Orange
      "#911eb4", // Purple
      "#46f0f0", // Cyan
      "#f032e6", // Magenta
    ];
    // Use a hash-like approach to assign consistent colors
    let hash = 0;
    for (let i = 0; i < dimension.length; i++) {
      hash = dimension.charCodeAt(i) + ((hash << 5) - hash);
    }
    return combinedPalette[Math.abs(hash) % combinedPalette.length];
  }

  return "#808080"; // Gray fallback
}

/**
 * Computes edge width based on distance (inverse relationship)
 * Thicker edges = more similar (lower distance)
 * Uses a wider range and exponential curve to make similarity differences highly visible
 */
export function computeEdgeWidth(
  distance: number,
  maxDistance: number,
  mode: "aggregate" | "dimensional"
): number {
  const normalized = distance / maxDistance;
  const inverseNormalized = 1 - normalized;

  // Use exponential curve (cubic) to make similarity differences highly pronounced
  // This makes highly similar connections stand out dramatically
  const similarityFactor = inverseNormalized * inverseNormalized * inverseNormalized;

  if (mode === "dimensional") {
    // Wider range: 0.5 to 2.5 pixels for dimensional mode
    return 0.5 + similarityFactor * 2.0;
  } else {
    // Wider range: 0.8 to 3.5 pixels for aggregate mode
    return 0.8 + similarityFactor * 2.7;
  }
}

/**
 * Computes edge opacity based on distance (inverse relationship)
 * More opaque = more similar (lower distance)
 * Improved range for better visual hierarchy with thinner edges
 */
export function computeEdgeOpacity(
  distance: number,
  maxDistance: number
): number {
  const normalized = distance / maxDistance;
  const inverseNormalized = 1 - normalized;
  // Use a quadratic curve for more pronounced differences
  const similarityFactor = inverseNormalized * inverseNormalized;
  // Wider range: 0.25 to 0.85 for better contrast
  return Math.max(0.25, Math.min(0.85, 0.25 + similarityFactor * 0.6));
}

/**
 * Gets edge color for aggregate mode (grayscale based on similarity)
 * Optimized for dark backgrounds with better contrast
 */
export function getAggregateEdgeColor(
  distance: number,
  maxDistance: number,
  opacity: number
): string {
  const normalized = distance / maxDistance;
  const inverseNormalized = 1 - normalized;
  // Use a quadratic curve for more pronounced differences
  const similarityFactor = inverseNormalized * inverseNormalized;
  // Lighter colors for more similar connections (better visibility on dark bg)
  const lightness = Math.max(40, 75 - similarityFactor * 35);
  return `hsla(0, 0%, ${lightness}%, ${opacity})`;
}

/**
 * Gets edge color for dimensional mode (dimension color with opacity)
 */
export function getDimensionalEdgeColor(
  dimension: string,
  framework: Framework,
  _distance: number,
  opacity: number
): string {
  const dimensionColor = getDimensionColor(dimension, framework);
  const r = parseInt(dimensionColor.slice(1, 3), 16);
  const g = parseInt(dimensionColor.slice(3, 5), 16);
  const b = parseInt(dimensionColor.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

/**
 * Color scale for groups
 */
export function getGroupColor(groupNumber: number): string {
  const colors = [
    "#3b82f6", // Blue
    "#10b981", // Green
    "#f59e0b", // Amber
    "#ef4444", // Red
    "#8b5cf6", // Purple
    "#ec4899", // Pink
    "#06b6d4", // Cyan
    "#84cc16", // Lime
  ];
  return colors[(groupNumber - 1) % colors.length];
}
