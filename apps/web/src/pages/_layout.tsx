import "#styles.css";

import type { ReactNode } from "react";

export default function Layout({ children }: { children: ReactNode }) {
  return <main>{children}</main>;
}

export const getConfig = async () => ({ render: "static" }) as const;
