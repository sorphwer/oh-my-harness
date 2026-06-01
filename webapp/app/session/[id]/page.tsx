import { notFound } from "next/navigation";
import { loadBrief, loadMeta } from "@/lib/session-store";
import SessionWorkbench from "./workbench";

export default async function SessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let brief;
  let meta;
  try {
    brief = loadBrief(id);
    meta = loadMeta(id);
  } catch {
    notFound();
  }

  return (
    <SessionWorkbench
      sessionId={id}
      brief={brief!}
      initialDoneSteps={meta!.doneSteps}
    />
  );
}
