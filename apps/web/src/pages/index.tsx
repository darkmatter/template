import { recordStatus } from "#runtime.ts";

const flow = [
  { step: "01", name: "Model", detail: "typed decision" },
  { step: "02", name: "Harness", detail: "Effect loop" },
  { step: "03", name: "Tool", detail: "schema boundary" },
  { step: "04", name: "Journal", detail: "event stream" },
] as const;

export default async function HomePage() {
  const status = await recordStatus();

  return (
    <>
      <p className="eyebrow">Runnable architecture reference</p>
      <h1>Effect-native agent harness</h1>
      <p className="lede">
        A compact monorepo showing schemas, services, layers, typed errors,
        deterministic tests, CLI and HTTP entrypoints, a Tauri boundary, and a
        bounded Rust supervisor.
      </p>

      <ol className="flow" aria-label="Agent run flow">
        {flow.map(({ step, name, detail }) => (
          <li key={step}>
            <span>{step}</span>
            <strong>{name}</strong>
            <small>{detail}</small>
          </li>
        ))}
      </ol>

      <section aria-labelledby="status-title">
        <div>
          <p className="eyebrow">Waku / Effect shell</p>
          <h2 id="status-title">Live status</h2>
        </div>
        <dl>
          {Object.entries(status).map(([key, value]) => (
            <div key={key}>
              <dt>{key}</dt>
              <dd>{String(value)}</dd>
            </div>
          ))}
        </dl>
      </section>
      <p className="hint">
        The demo favors inspectable composition over a preconfigured model.
      </p>
    </>
  );
}

// Rendered per request so the status reflects the running server.
export const getConfig = async () => ({ render: "dynamic" }) as const;
