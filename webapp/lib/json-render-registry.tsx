"use client";

import * as React from "react";
import { z } from "zod";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { createCatalog } from "@json-render/core";
import type {
  Action,
  ComponentDefinition,
  ActionDefinition,
} from "@json-render/core";
import type {
  ComponentRegistry,
  ComponentRenderer,
} from "@json-render/react";
import { cn } from "@/lib/utils";

const optionSchema = z.object({ value: z.string(), label: z.string() });

const components = {
  Stack: {
    props: z.object({ gap: z.enum(["sm", "md", "lg"]).optional() }),
    hasChildren: true,
    description: "Vertical flex container.",
  },
  Card: {
    props: z.object({ title: z.string().optional() }),
    hasChildren: true,
    description: "Bordered card container.",
  },
  Accordion: {
    props: z.object({
      items: z.array(
        z.object({ id: z.string(), title: z.string(), body: z.string() }),
      ),
    }),
    description: "Collapsible sections.",
  },
  Markdown: {
    props: z.object({ body: z.string() }),
    description: "Plain text body (markdown rendered as preformatted text in MVP).",
  },
  Text: {
    props: z.object({ value: z.string() }),
    description: "Plain text span.",
  },
  TextInput: {
    props: z.object({
      name: z.string(),
      label: z.string(),
      placeholder: z.string().optional(),
      value: z.string().optional(),
    }),
    description: "Single-line text input. Emits action 'answer' with {name, value} on blur.",
  },
  TextArea: {
    props: z.object({
      name: z.string(),
      label: z.string(),
      rows: z.number().optional(),
      value: z.string().optional(),
    }),
    description: "Multi-line text input. Emits 'answer' {name, value} on blur.",
  },
  SingleSelect: {
    props: z.object({
      name: z.string(),
      label: z.string(),
      options: z.array(optionSchema),
      value: z.string().optional(),
    }),
    description: "Single-choice select. Emits 'answer' {name, value} on click.",
  },
  MultiSelect: {
    props: z.object({
      name: z.string(),
      label: z.string(),
      options: z.array(optionSchema),
      value: z.array(z.string()).optional(),
    }),
    description: "Multi-choice select. Emits 'answer' {name, value: string[]} on click.",
  },
  Checklist: {
    props: z.object({
      name: z.string(),
      items: z.array(
        z.object({
          key: z.string(),
          label: z.string(),
          done: z.boolean().optional(),
        }),
      ),
    }),
    description: "Toggleable item list. Emits 'answer' {name, value: {key, done}} on toggle.",
  },
  Submit: {
    props: z.object({
      label: z.string(),
      kind: z.enum(["continue", "final", "plugins"]),
      markdown: z.string().optional(),
      plugins: z.array(z.string()).optional(),
    }),
    description:
      "Primary button. kind='continue' dispatches the accumulated answers to the next agent turn. kind='final' submits a filled markdown as the step output. kind='plugins' submits a plugin list.",
  },
} satisfies Record<string, ComponentDefinition>;

const actions = {
  answer: {
    params: z.object({ name: z.string(), value: z.unknown() }),
    description: "Record a single answer value for the conversation buffer.",
  },
  submit: {
    params: z.object({
      kind: z.enum(["continue", "final", "plugins"]),
      markdown: z.string().optional(),
      plugins: z.array(z.string()).optional(),
    }),
    description:
      "Submit this turn. kind='continue' sends buffered answers back to the agent; kind='final' saves a filled markdown; kind='plugins' saves a plugin list.",
  },
} satisfies Record<string, ActionDefinition>;

export const catalog = createCatalog({
  name: "harness-kit-webapp",
  components,
  actions,
});

const gapClass = {
  sm: "gap-2",
  md: "gap-4",
  lg: "gap-6",
} as const;

function dispatch(
  onAction: ((action: Action) => void) | undefined,
  name: string,
  params: Record<string, unknown>,
): void {
  onAction?.({ name, params: params as Action["params"] });
}

const Stack: ComponentRenderer<{ gap?: "sm" | "md" | "lg" }> = ({
  element,
  children,
}) => (
  <div
    className={cn("flex flex-col", gapClass[element.props.gap ?? "md"])}
  >
    {children}
  </div>
);

const Card: ComponentRenderer<{ title?: string }> = ({ element, children }) => (
  <div className="rounded-lg border border-border bg-background p-4 shadow-sm">
    {element.props.title ? (
      <h3 className="mb-3 text-sm font-medium text-foreground">
        {element.props.title}
      </h3>
    ) : null}
    <div className="flex flex-col gap-3">{children}</div>
  </div>
);

type AccordionItem = { id: string; title: string; body: string };
const Accordion: ComponentRenderer<{ items: AccordionItem[] }> = ({
  element,
}) => (
  <div className="divide-y divide-border rounded-lg border border-border">
    {element.props.items.map((it) => (
      <details key={it.id} className="p-3">
        <summary className="cursor-pointer text-sm font-medium">
          {it.title}
        </summary>
        <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
          {it.body}
        </p>
      </details>
    ))}
  </div>
);

const Markdown: ComponentRenderer<{ body: string }> = ({ element }) => (
  <div className="markdown-body text-sm text-foreground">
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ children }) => (
          <h1 className="mb-3 mt-4 text-xl font-semibold">{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="mb-2 mt-4 text-lg font-semibold">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="mb-2 mt-3 text-base font-semibold">{children}</h3>
        ),
        h4: ({ children }) => (
          <h4 className="mb-1 mt-3 text-sm font-semibold">{children}</h4>
        ),
        p: ({ children }) => <p className="mb-2 leading-relaxed">{children}</p>,
        ul: ({ children }) => (
          <ul className="mb-2 list-disc pl-5 leading-relaxed">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="mb-2 list-decimal pl-5 leading-relaxed">{children}</ol>
        ),
        li: ({ children }) => <li className="mb-1">{children}</li>,
        strong: ({ children }) => (
          <strong className="font-semibold">{children}</strong>
        ),
        em: ({ children }) => <em className="italic">{children}</em>,
        code: ({ children }) => (
          <code className="rounded bg-muted px-1 py-0.5 text-xs">
            {children}
          </code>
        ),
        pre: ({ children }) => (
          <pre className="mb-2 overflow-x-auto rounded-md bg-muted p-3 text-xs">
            {children}
          </pre>
        ),
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noreferrer noopener"
            className="text-node-ready underline underline-offset-2 hover:opacity-80"
          >
            {children}
          </a>
        ),
        blockquote: ({ children }) => (
          <blockquote className="mb-2 border-l-2 border-border pl-3 text-muted-foreground">
            {children}
          </blockquote>
        ),
        hr: () => <hr className="my-3 border-border" />,
      }}
    >
      {element.props.body}
    </ReactMarkdown>
  </div>
);

const Text: ComponentRenderer<{ value: string }> = ({ element }) => (
  <span className="text-sm">{element.props.value}</span>
);

const TextInput: ComponentRenderer<{
  name: string;
  label: string;
  placeholder?: string;
  value?: string;
}> = ({ element, onAction }) => (
  <label className="flex flex-col gap-1 text-sm">
    <span className="font-medium">{element.props.label}</span>
    <input
      type="text"
      name={element.props.name}
      defaultValue={element.props.value}
      placeholder={element.props.placeholder}
      className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-node-ready"
      onBlur={(e) =>
        dispatch(onAction, "answer", {
          name: element.props.name,
          value: e.currentTarget.value,
        })
      }
    />
  </label>
);

const TextArea: ComponentRenderer<{
  name: string;
  label: string;
  rows?: number;
  value?: string;
}> = ({ element, onAction }) => (
  <label className="flex flex-col gap-1 text-sm">
    <span className="font-medium">{element.props.label}</span>
    <textarea
      name={element.props.name}
      rows={element.props.rows ?? 4}
      defaultValue={element.props.value}
      className="resize-y rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-node-ready"
      onBlur={(e) =>
        dispatch(onAction, "answer", {
          name: element.props.name,
          value: e.currentTarget.value,
        })
      }
    />
  </label>
);

type Option = { value: string; label: string };

const SingleSelect: ComponentRenderer<{
  name: string;
  label: string;
  options: Option[];
  value?: string;
}> = ({ element, onAction }) => {
  const [selected, setSelected] = React.useState<string | undefined>(
    element.props.value,
  );
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-sm font-medium">{element.props.label}</legend>
      <div className="flex flex-wrap gap-2">
        {element.props.options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => {
              setSelected(opt.value);
              dispatch(onAction, "answer", {
                name: element.props.name,
                value: opt.value,
              });
            }}
            className={cn(
              "rounded-full border px-3 py-1 text-xs transition",
              selected === opt.value
                ? "border-node-ready bg-node-ready/10 text-node-ready"
                : "border-border hover:bg-accent",
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
};

const MultiSelect: ComponentRenderer<{
  name: string;
  label: string;
  options: Option[];
  value?: string[];
}> = ({ element, onAction }) => {
  const [selected, setSelected] = React.useState<Set<string>>(
    () => new Set(element.props.value ?? []),
  );
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-sm font-medium">{element.props.label}</legend>
      <div className="flex flex-wrap gap-2">
        {element.props.options.map((opt) => {
          const on = selected.has(opt.value);
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                const next = new Set(selected);
                if (on) next.delete(opt.value);
                else next.add(opt.value);
                setSelected(next);
                dispatch(onAction, "answer", {
                  name: element.props.name,
                  value: Array.from(next),
                });
              }}
              className={cn(
                "rounded-full border px-3 py-1 text-xs transition",
                on
                  ? "border-node-ready bg-node-ready/10 text-node-ready"
                  : "border-border hover:bg-accent",
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
};

type ChecklistItem = { key: string; label: string; done?: boolean };

const Checklist: ComponentRenderer<{
  name: string;
  items: ChecklistItem[];
}> = ({ element, onAction }) => (
  <ul className="flex flex-col gap-1">
    {element.props.items.map((it) => (
      <li key={it.key} className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          defaultChecked={it.done}
          onChange={(e) =>
            dispatch(onAction, "answer", {
              name: element.props.name,
              value: { key: it.key, done: e.currentTarget.checked },
            })
          }
        />
        <span>{it.label}</span>
      </li>
    ))}
  </ul>
);

const Submit: ComponentRenderer<{
  label: string;
  kind: "continue" | "final" | "plugins";
  markdown?: string;
  plugins?: string[];
}> = ({ element, onAction }) => (
  <button
    type="button"
    onClick={() =>
      dispatch(onAction, "submit", {
        kind: element.props.kind,
        markdown: element.props.markdown,
        plugins: element.props.plugins,
      })
    }
    className="mt-2 rounded-md bg-node-ready px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-node-ready/90"
  >
    {element.props.label}
  </button>
);

export const registry: ComponentRegistry = {
  Stack: Stack as ComponentRenderer,
  Card: Card as ComponentRenderer,
  Accordion: Accordion as ComponentRenderer,
  Markdown: Markdown as ComponentRenderer,
  Text: Text as ComponentRenderer,
  TextInput: TextInput as ComponentRenderer,
  TextArea: TextArea as ComponentRenderer,
  SingleSelect: SingleSelect as ComponentRenderer,
  MultiSelect: MultiSelect as ComponentRenderer,
  Checklist: Checklist as ComponentRenderer,
  Submit: Submit as ComponentRenderer,
};
