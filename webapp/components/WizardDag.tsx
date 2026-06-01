"use client";

import { useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  type Edge,
  type Node,
} from "@xyflow/react";
import dagre from "@dagrejs/dagre";
import "@xyflow/react/dist/style.css";
import { STEP_GRAPH, type StepId, type StepStatus } from "@/lib/steps";
import { DagNode, type DagNodeData } from "./DagNode";

const NODE_WIDTH = 180;
const NODE_HEIGHT = 64;

const nodeTypes = { dag: DagNode };

function layout(
  nodes: Node[],
  edges: Edge[],
): { nodes: Node[]; edges: Edge[] } {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: "LR", nodesep: 40, ranksep: 80 });

  for (const node of nodes) {
    g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  }
  for (const edge of edges) {
    g.setEdge(edge.source, edge.target);
  }
  dagre.layout(g);

  return {
    edges,
    nodes: nodes.map((node) => {
      const pos = g.node(node.id);
      return {
        ...node,
        position: { x: pos.x - NODE_WIDTH / 2, y: pos.y - NODE_HEIGHT / 2 },
      };
    }),
  };
}

export function WizardDag(props: {
  statuses: ReadonlyMap<StepId, StepStatus>;
  selectedId: StepId | null;
  onSelect: (id: StepId) => void;
}) {
  const { nodes, edges } = useMemo(() => {
    const raw: Node[] = STEP_GRAPH.map((node) => {
      const status = props.statuses.get(node.id) ?? "locked";
      const data: DagNodeData = {
        title: node.title,
        status,
        mvpEnabled: node.mvpEnabled,
      };
      return {
        id: node.id,
        type: "dag",
        position: { x: 0, y: 0 },
        data: data as unknown as Record<string, unknown>,
        selected: props.selectedId === node.id,
      };
    });
    const rawEdges: Edge[] = STEP_GRAPH.flatMap((node) =>
      node.dependsOn.map((dep) => ({
        id: `${dep}->${node.id}`,
        source: dep,
        target: node.id,
        animated: props.statuses.get(node.id) === "ready",
      })),
    );
    return layout(raw, rawEdges);
  }, [props.statuses, props.selectedId]);

  return (
    <div className="h-72 w-full border-b border-border bg-muted/30">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable
        onNodeClick={(_, n) => {
          const status = props.statuses.get(n.id as StepId);
          if (status === "locked") return;
          props.onSelect(n.id as StepId);
        }}
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={16} />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}
