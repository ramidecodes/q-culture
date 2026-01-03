/**
 * Tooltip content components for network graph visualization
 */

import type { GraphNode, GraphLink } from "@/lib/utils/visualization-data";
import type { Framework } from "@/types/cultural";

type NodeTooltipProps = {
  node: GraphNode;
  framework?: Framework;
};

export function NodeTooltipContent({ node, framework }: NodeTooltipProps) {
  const name = node.name ?? "";
  const country = node.country ?? "";
  const scores = node.culturalScores;

  if (!scores || !framework) {
    return (
      <div className="space-y-1">
        <div className="font-semibold text-foreground">{name}</div>
        <div className="text-xs text-muted-foreground">{country}</div>
      </div>
    );
  }

  const scoreItems: React.ReactNode[] = [];

  // Format scores based on framework
  if (framework === "hofstede" && scores.hofstede) {
    scoreItems.push(
      <div key="powerDistance" className="flex justify-between text-xs">
        <span className="text-muted-foreground">Power Distance</span>
        <span className="font-mono font-medium text-foreground">
          {scores.hofstede.powerDistance}
        </span>
      </div>
    );
    scoreItems.push(
      <div key="individualism" className="flex justify-between text-xs">
        <span className="text-muted-foreground">Individualism</span>
        <span className="font-mono font-medium text-foreground">
          {scores.hofstede.individualism}
        </span>
      </div>
    );
    scoreItems.push(
      <div key="masculinity" className="flex justify-between text-xs">
        <span className="text-muted-foreground">Masculinity</span>
        <span className="font-mono font-medium text-foreground">
          {scores.hofstede.masculinity}
        </span>
      </div>
    );
    scoreItems.push(
      <div key="uncertaintyAvoidance" className="flex justify-between text-xs">
        <span className="text-muted-foreground">Uncertainty Avoidance</span>
        <span className="font-mono font-medium text-foreground">
          {scores.hofstede.uncertaintyAvoidance}
        </span>
      </div>
    );
    scoreItems.push(
      <div key="longTermOrientation" className="flex justify-between text-xs">
        <span className="text-muted-foreground">Long-term Orientation</span>
        <span className="font-mono font-medium text-foreground">
          {scores.hofstede.longTermOrientation}
        </span>
      </div>
    );
    scoreItems.push(
      <div key="indulgence" className="flex justify-between text-xs">
        <span className="text-muted-foreground">Indulgence</span>
        <span className="font-mono font-medium text-foreground">
          {scores.hofstede.indulgence}
        </span>
      </div>
    );
  } else if (framework === "lewis" && scores.lewis) {
    scoreItems.push(
      <div key="linearActive" className="flex justify-between text-xs">
        <span className="text-muted-foreground">Linear Active</span>
        <span className="font-mono font-medium text-foreground">
          {scores.lewis.linearActive}
        </span>
      </div>
    );
    scoreItems.push(
      <div key="multiActive" className="flex justify-between text-xs">
        <span className="text-muted-foreground">Multi Active</span>
        <span className="font-mono font-medium text-foreground">
          {scores.lewis.multiActive}
        </span>
      </div>
    );
    scoreItems.push(
      <div key="reactive" className="flex justify-between text-xs">
        <span className="text-muted-foreground">Reactive</span>
        <span className="font-mono font-medium text-foreground">
          {scores.lewis.reactive}
        </span>
      </div>
    );
  } else if (framework === "hall" && scores.hall) {
    scoreItems.push(
      <div key="contextHigh" className="flex justify-between text-xs">
        <span className="text-muted-foreground">Context (High)</span>
        <span className="font-mono font-medium text-foreground">
          {scores.hall.contextHigh}
        </span>
      </div>
    );
    scoreItems.push(
      <div key="timePolychronic" className="flex justify-between text-xs">
        <span className="text-muted-foreground">Time (Polychronic)</span>
        <span className="font-mono font-medium text-foreground">
          {scores.hall.timePolychronic}
        </span>
      </div>
    );
    scoreItems.push(
      <div key="spacePrivate" className="flex justify-between text-xs">
        <span className="text-muted-foreground">Space (Private)</span>
        <span className="font-mono font-medium text-foreground">
          {scores.hall.spacePrivate}
        </span>
      </div>
    );
  } else if (framework === "combined") {
    // Show all available frameworks
    if (scores.hofstede) {
      scoreItems.push(
        <div
          key="hofstede-header"
          className="text-xs font-medium text-muted-foreground mt-2 first:mt-0"
        >
          Hofstede
        </div>
      );
      scoreItems.push(
        <div key="powerDistance" className="flex justify-between text-xs">
          <span className="text-muted-foreground">Power Distance</span>
          <span className="font-mono font-medium text-foreground">
            {scores.hofstede.powerDistance}
          </span>
        </div>
      );
      scoreItems.push(
        <div key="individualism" className="flex justify-between text-xs">
          <span className="text-muted-foreground">Individualism</span>
          <span className="font-mono font-medium text-foreground">
            {scores.hofstede.individualism}
          </span>
        </div>
      );
      scoreItems.push(
        <div key="masculinity" className="flex justify-between text-xs">
          <span className="text-muted-foreground">Masculinity</span>
          <span className="font-mono font-medium text-foreground">
            {scores.hofstede.masculinity}
          </span>
        </div>
      );
      scoreItems.push(
        <div
          key="uncertaintyAvoidance"
          className="flex justify-between text-xs"
        >
          <span className="text-muted-foreground">Uncertainty Avoidance</span>
          <span className="font-mono font-medium text-foreground">
            {scores.hofstede.uncertaintyAvoidance}
          </span>
        </div>
      );
      scoreItems.push(
        <div key="longTermOrientation" className="flex justify-between text-xs">
          <span className="text-muted-foreground">Long-term Orientation</span>
          <span className="font-mono font-medium text-foreground">
            {scores.hofstede.longTermOrientation}
          </span>
        </div>
      );
      scoreItems.push(
        <div key="indulgence" className="flex justify-between text-xs">
          <span className="text-muted-foreground">Indulgence</span>
          <span className="font-mono font-medium text-foreground">
            {scores.hofstede.indulgence}
          </span>
        </div>
      );
    }
    if (scores.lewis) {
      scoreItems.push(
        <div
          key="lewis-header"
          className="text-xs font-medium text-muted-foreground mt-2 first:mt-0"
        >
          Lewis
        </div>
      );
      scoreItems.push(
        <div key="linearActive" className="flex justify-between text-xs">
          <span className="text-muted-foreground">Linear Active</span>
          <span className="font-mono font-medium text-foreground">
            {scores.lewis.linearActive}
          </span>
        </div>
      );
      scoreItems.push(
        <div key="multiActive" className="flex justify-between text-xs">
          <span className="text-muted-foreground">Multi Active</span>
          <span className="font-mono font-medium text-foreground">
            {scores.lewis.multiActive}
          </span>
        </div>
      );
      scoreItems.push(
        <div key="reactive" className="flex justify-between text-xs">
          <span className="text-muted-foreground">Reactive</span>
          <span className="font-mono font-medium text-foreground">
            {scores.lewis.reactive}
          </span>
        </div>
      );
    }
    if (scores.hall) {
      scoreItems.push(
        <div
          key="hall-header"
          className="text-xs font-medium text-muted-foreground mt-2 first:mt-0"
        >
          Hall
        </div>
      );
      scoreItems.push(
        <div key="contextHigh" className="flex justify-between text-xs">
          <span className="text-muted-foreground">Context (High)</span>
          <span className="font-mono font-medium text-foreground">
            {scores.hall.contextHigh}
          </span>
        </div>
      );
      scoreItems.push(
        <div key="timePolychronic" className="flex justify-between text-xs">
          <span className="text-muted-foreground">Time (Polychronic)</span>
          <span className="font-mono font-medium text-foreground">
            {scores.hall.timePolychronic}
          </span>
        </div>
      );
      scoreItems.push(
        <div key="spacePrivate" className="flex justify-between text-xs">
          <span className="text-muted-foreground">Space (Private)</span>
          <span className="font-mono font-medium text-foreground">
            {scores.hall.spacePrivate}
          </span>
        </div>
      );
    }
  }

  return (
    <div className="space-y-2">
      <div>
        <div className="font-semibold text-foreground">{name}</div>
        <div className="text-xs text-muted-foreground">{country}</div>
      </div>
      {scoreItems.length > 0 && (
        <div className="border-t border-border pt-2 mt-2 space-y-1">
          <div className="text-xs font-medium text-muted-foreground mb-1">
            Cultural Dimensions
          </div>
          {scoreItems}
        </div>
      )}
    </div>
  );
}

type EdgeTooltipProps = {
  link: GraphLink;
  sourceNode?: GraphNode;
  targetNode?: GraphNode;
  edgeMode: "aggregate" | "dimensional";
  dimensionLabel?: string;
  sourceValue?: number;
  targetValue?: number;
};

export function EdgeTooltipContent({
  link,
  sourceNode,
  targetNode,
  edgeMode,
  dimensionLabel,
  sourceValue,
  targetValue,
}: EdgeTooltipProps) {
  const linkDistance = link.distance ?? 0;

  if (edgeMode === "dimensional" && dimensionLabel) {
    const sourceName = sourceNode
      ? `${sourceNode.name} (${sourceNode.country})`
      : link.source;
    const targetName = targetNode
      ? `${targetNode.name} (${targetNode.country})`
      : link.target;

    // Calculate similarity percentage (inverse of distance)
    const similarity = (1 - linkDistance) * 100;

    return (
      <div className="space-y-2">
        <div className="font-semibold text-foreground">{dimensionLabel}</div>
        {sourceValue !== undefined && targetValue !== undefined && (
          <div className="border-t border-border pt-2 space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground truncate pr-2">
                {sourceName}
              </span>
              <span className="font-mono font-medium text-foreground flex-shrink-0">
                {sourceValue}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground truncate pr-2">
                {targetName}
              </span>
              <span className="font-mono font-medium text-foreground flex-shrink-0">
                {targetValue}
              </span>
            </div>
          </div>
        )}
        <div className="border-t border-border pt-2">
          <div className="text-xs">
            <span className="text-muted-foreground">Similarity: </span>
            <span className="text-foreground font-medium">
              {similarity.toFixed(1)}%
            </span>
            <span className="text-muted-foreground text-[10px] ml-1">
              (distance: {linkDistance.toFixed(3)})
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Aggregate mode
  return (
    <div className="space-y-1">
      <div className="font-semibold text-foreground">Cultural Distance</div>
      <div className="text-xs">
        <span className="font-mono font-medium text-foreground">
          {linkDistance.toFixed(3)}
        </span>
      </div>
      <div className="text-xs text-muted-foreground pt-1 border-t border-border">
        (thicker = more similar)
      </div>
    </div>
  );
}
