import { z } from "zod";

/**
 * Closed lifecycle-stage vocabulary.
 *
 * Source: .harness/docs/superpowers/specs/2026-05-26-plugin-stage-matrix-design.md
 *
 * Stages are a set, not a sequence. The array order is display order only.
 */
export const STAGES = [
  "freestyle",
  "intent",
  "spec",
  "plan",
  "explore",
  "implement",
  "verify",
  "review",
  "deliver",
] as const;

export type Stage = (typeof STAGES)[number];

export const REQUIRED_STAGES = [
  "intent",
  "plan",
  "implement",
  "verify",
  "deliver",
] as const satisfies readonly Stage[];

export const DEFAULT_STAGE: Stage = "freestyle";

export const stageSchema = z.enum(STAGES);

export const stageListSchema = z
  .union([stageSchema, z.array(stageSchema).min(1)])
  .transform((value) => (Array.isArray(value) ? value : [value]));
