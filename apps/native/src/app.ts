import { ManagedRuntime } from "effect";

import { DemoAgent } from "#demo-agent.ts";

const select = <ElementType extends Element>(
  root: ParentNode,
  selector: string,
): ElementType => {
  const element = root.querySelector<ElementType>(selector);
  if (element === null) {
    throw new Error(`Missing native shell element: ${selector}`);
  }
  return element;
};

export const mountApp = (root: HTMLElement): (() => void) => {
  const runtime = ManagedRuntime.make(DemoAgent.layerDemo);
  const form = select<HTMLFormElement>(root, "[data-prompt-form]");
  const goal = select<HTMLTextAreaElement>(form, "textarea[name='goal']");
  const button = select<HTMLButtonElement>(form, "button[type='submit']");
  const reply = select<HTMLElement>(root, "[data-reply]");
  const status = select<HTMLElement>(root, "[data-status]");
  const events = new AbortController();
  let disposed = false;

  form.addEventListener(
    "submit",
    (event) => {
      event.preventDefault();
      const prompt = goal.value.trim();
      if (prompt.length === 0) return;

      button.disabled = true;
      status.textContent = "running";

      void runtime
        .runPromise(DemoAgent.use((agent) => agent.respond(prompt)))
        .then((result) => {
          if (!disposed) reply.textContent = result.message;
        })
        .catch(() => {
          if (!disposed) {
            reply.textContent = "The demo runtime stopped unexpectedly.";
          }
        })
        .finally(() => {
          if (!disposed) {
            button.disabled = false;
            status.textContent = "ready";
          }
        });
    },
    { signal: events.signal },
  );

  return () => {
    if (disposed) return;
    disposed = true;
    events.abort();
    void runtime.dispose();
  };
};
