import type { ReactNode } from "react";

export default function Root({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Since Waku rc.2 a custom root owns these; the framework no longer adds them. */}
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Effect Agent Harness</title>
      </head>
      <body>{children}</body>
    </html>
  );
}

export const getConfig = async () => ({ render: "static" }) as const;
