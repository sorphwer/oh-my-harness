export type StepId =
  | "brief"
  | "product-sense"
  | "agents"
  | "architecture"
  | "design"
  | "frontend"
  | "operations"
  | "plans"
  | "quality-score"
  | "reliability"
  | "security"
  | "uat-checklist"
  | "plugin-selection";

export type StepStatus = "locked" | "ready" | "active" | "done";

export type StepNode = {
  id: StepId;
  title: string;
  layer: number;
  dependsOn: StepId[];
  specPath: string;
  outputRelPath?: string;
  mvpEnabled: boolean;
};

export const STEP_GRAPH: ReadonlyArray<StepNode> = [
  {
    id: "brief",
    title: "Project brief",
    layer: 0,
    dependsOn: [],
    specPath: "specs/00-project-brief.md",
    mvpEnabled: true,
  },
  {
    id: "product-sense",
    title: "Product Sense",
    layer: 1,
    dependsOn: ["brief"],
    specPath: "specs/01-product-sense.md",
    outputRelPath: "docs/PRODUCT_SENSE.md",
    mvpEnabled: true,
  },
  {
    id: "agents",
    title: "Agents Guide",
    layer: 1,
    dependsOn: ["brief"],
    specPath: "specs/02-agents.md",
    outputRelPath: "AGENTS.md",
    mvpEnabled: true,
  },
  {
    id: "architecture",
    title: "Architecture",
    layer: 2,
    dependsOn: ["product-sense"],
    specPath: "specs/03-architecture.md",
    outputRelPath: "ARCHITECTURE.md",
    mvpEnabled: true,
  },
  {
    id: "design",
    title: "Design",
    layer: 3,
    dependsOn: ["architecture"],
    specPath: "specs/04-design.md",
    outputRelPath: "docs/DESIGN.md",
    mvpEnabled: true,
  },
  {
    id: "frontend",
    title: "Frontend",
    layer: 3,
    dependsOn: ["architecture"],
    specPath: "specs/05-frontend.md",
    outputRelPath: "docs/FRONTEND.md",
    mvpEnabled: true,
  },
  {
    id: "reliability",
    title: "Reliability",
    layer: 3,
    dependsOn: ["architecture"],
    specPath: "specs/06-reliability.md",
    outputRelPath: "docs/RELIABILITY.md",
    mvpEnabled: true,
  },
  {
    id: "security",
    title: "Security",
    layer: 3,
    dependsOn: ["architecture"],
    specPath: "specs/07-security.md",
    outputRelPath: "docs/SECURITY.md",
    mvpEnabled: true,
  },
  {
    id: "operations",
    title: "Operations",
    layer: 4,
    dependsOn: ["architecture", "reliability"],
    specPath: "specs/08-operations.md",
    outputRelPath: "docs/OPERATIONS.md",
    mvpEnabled: true,
  },
  {
    id: "quality-score",
    title: "Quality Score",
    layer: 4,
    dependsOn: ["design", "reliability"],
    specPath: "specs/09-quality-score.md",
    outputRelPath: "docs/QUALITY_SCORE.md",
    mvpEnabled: true,
  },
  {
    id: "plans",
    title: "Plans",
    layer: 5,
    dependsOn: ["product-sense", "architecture", "design", "quality-score"],
    specPath: "specs/10-plans.md",
    outputRelPath: "docs/PLANS.md",
    mvpEnabled: true,
  },
  {
    id: "uat-checklist",
    title: "UAT Checklist",
    layer: 5,
    dependsOn: ["quality-score", "security", "operations"],
    specPath: "specs/11-uat-checklist.md",
    outputRelPath: "docs/UAT_CHECKLIST.md",
    mvpEnabled: true,
  },
  {
    id: "plugin-selection",
    title: "Plugin selection",
    layer: 6,
    dependsOn: ["plans", "uat-checklist"],
    specPath: "specs/12-plugin-selection.md",
    mvpEnabled: true,
  },
];

const STEP_BY_ID: ReadonlyMap<StepId, StepNode> = new Map(
  STEP_GRAPH.map((node) => [node.id, node]),
);

export function getStep(id: StepId): StepNode {
  const step = STEP_BY_ID.get(id);
  if (!step) throw new Error(`Unknown step id: ${id}`);
  return step;
}

export function getTransitiveDeps(id: StepId): StepId[] {
  const visited = new Set<StepId>();
  const out: StepId[] = [];
  const stack: StepId[] = [...getStep(id).dependsOn];
  while (stack.length) {
    const cur = stack.pop()!;
    if (visited.has(cur)) continue;
    visited.add(cur);
    out.push(cur);
    stack.push(...getStep(cur).dependsOn);
  }
  return out;
}

export function computeStatuses(
  doneIds: ReadonlySet<StepId>,
  activeIds: ReadonlySet<StepId> = new Set(),
): Map<StepId, StepStatus> {
  const result = new Map<StepId, StepStatus>();
  for (const node of STEP_GRAPH) {
    if (doneIds.has(node.id)) {
      result.set(node.id, "done");
      continue;
    }
    if (activeIds.has(node.id)) {
      result.set(node.id, "active");
      continue;
    }
    const allDepsDone = node.dependsOn.every((dep) => doneIds.has(dep));
    result.set(node.id, allDepsDone ? "ready" : "locked");
  }
  return result;
}
