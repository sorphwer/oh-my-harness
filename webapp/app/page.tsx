"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const submit = async () => {
    setError(null);
    try {
      const res = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, displayName, description }),
      });
      if (!res.ok) {
        setError(await res.text());
        return;
      }
      const { id } = (await res.json()) as { id: string };
      startTransition(() => router.push(`/session/${id}`));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <main className="mx-auto flex max-w-xl flex-col gap-6 p-12">
      <header>
        <h1 className="text-2xl font-bold">harness-kit</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Author your project&apos;s <code>.harness/</code> through a
          DAG of agent interviews.
        </p>
      </header>

      <section className="flex flex-col gap-4 rounded-lg border border-border p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide">
          Project brief
        </h2>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Slug (kebab-case)</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="my-project"
            className="rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Display name</span>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="My Project"
            className="rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">What is this project?</span>
          <textarea
            rows={5}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="A short collaboration tool for small teams to publish changelog entries…"
            className="resize-y rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
        </label>

        {error ? (
          <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-900">
            {error}
          </div>
        ) : null}

        <button
          type="button"
          onClick={submit}
          disabled={
            isPending ||
            name.trim() === "" ||
            displayName.trim() === "" ||
            description.trim() === ""
          }
          className="self-start rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-50"
        >
          {isPending ? "Starting…" : "Start interview"}
        </button>
      </section>
    </main>
  );
}
