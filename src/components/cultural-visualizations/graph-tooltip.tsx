/**
 * Tooltip wrapper component for network graph visualization
 */

import { X } from "lucide-react";
import type { GraphNode, GraphLink } from "@/lib/utils/visualization-data";
import { NodeTooltipContent, EdgeTooltipContent } from "./utils/graph-tooltips";

type GraphTooltipProps = {
  type: "node" | "edge";
  position: { x: number; y: number };
  node?: GraphNode;
  link?: GraphLink;
  sourceNode?: GraphNode;
  targetNode?: GraphNode;
  edgeMode: "aggregate" | "dimensional";
  framework?: "lewis" | "hall" | "hofstede" | "combined";
  dimensionLabel?: string;
  sourceValue?: number;
  targetValue?: number;
  onClose: () => void;
};

export function GraphTooltip({
  type,
  position,
  node,
  link,
  sourceNode,
  targetNode,
  edgeMode,
  framework,
  dimensionLabel,
  sourceValue,
  targetValue,
  onClose,
}: GraphTooltipProps) {
  return (
    <div
      className="pointer-events-none absolute z-50"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform:
          type === "node"
            ? "translate(-50%, calc(-100% - 16px))"
            : "translate(12px, -50%)",
      }}
    >
      <div className="pointer-events-auto bg-popover border border-border rounded-lg shadow-xl p-3 text-sm max-w-xs min-w-[220px] animate-in fade-in-0 zoom-in-95 duration-150">
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-muted border border-border flex items-center justify-center hover:bg-accent transition-colors z-10"
          aria-label="Close tooltip"
        >
          <X className="h-3 w-3" />
        </button>

        {type === "node" && node ? (
          <NodeTooltipContent node={node} framework={framework} />
        ) : link ? (
          <EdgeTooltipContent
            link={link}
            sourceNode={sourceNode}
            targetNode={targetNode}
            edgeMode={edgeMode}
            dimensionLabel={dimensionLabel}
            sourceValue={sourceValue}
            targetValue={targetValue}
          />
        ) : null}
      </div>
      {/* Tooltip arrow */}
      <div
        className="absolute w-2 h-2 bg-popover border-r border-b border-border"
        style={{
          left: type === "node" ? "50%" : "0px",
          top: type === "node" ? "100%" : "50%",
          transform: "translate(-50%, -50%) rotate(45deg)",
        }}
      />
    </div>
  );
}
