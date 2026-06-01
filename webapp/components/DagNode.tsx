"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Check, Lock, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StepStatus } from "@/lib/steps";

export type DagNodeData = {
  title: string;
  status: StepStatus;
  mvpEnabled: boolean;
};

const STATUS_STYLES: Record<StepStatus, string> = {
  locked:
    "border-node-locked bg-node-locked/40 text-muted-foreground cursor-not-allowed opacity-70",
  ready:
    "border-node-ready bg-background text-foreground hover:bg-node-ready/5 cursor-pointer",
  active:
    "border-node-active bg-node-active/10 text-foreground animate-pulse cursor-pointer",
  done: "border-node-done bg-node-done/10 text-foreground cursor-pointer",
};

function DagNodeImpl({ data, selected }: NodeProps) {
  const d = data as unknown as DagNodeData;
  return (
    <div
      className={cn(
        "flex h-16 w-44 items-center gap-2 rounded-md border-2 px-3 transition",
        STATUS_STYLES[d.status],
        selected ? "ring-2 ring-offset-2 ring-foreground/40" : "",
      )}
    >
      <Handle type="target" position={Position.Left} className="!bg-border" />
      <div className="flex h-6 w-6 shrink-0 items-center justify-center">
        {d.status === "done" ? (
          <Check className="h-4 w-4 text-node-done" />
        ) : d.status === "active" ? (
          <Loader2 className="h-4 w-4 animate-spin text-node-active" />
        ) : d.status === "locked" ? (
          <Lock className="h-3 w-3" />
        ) : (
          <span className="h-2 w-2 rounded-full bg-node-ready" />
        )}
      </div>
      <div className="flex min-w-0 flex-col">
        <span className="truncate text-xs font-medium">{d.title}</span>
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
          {d.mvpEnabled || d.status === "done" ? d.status : `${d.status} · stub`}
        </span>
      </div>
      <Handle type="source" position={Position.Right} className="!bg-border" />
    </div>
  );
}

export const DagNode = memo(DagNodeImpl);
