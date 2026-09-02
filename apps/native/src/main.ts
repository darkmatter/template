import "./styles.css";

import { mountApp } from "#app.ts";

const root = document.querySelector<HTMLElement>("#app");
if (root === null) throw new Error("Native shell root was not found");

const disposeApp = mountApp(root);
const dispose = () => {
  window.removeEventListener("pagehide", dispose);
  disposeApp();
};

window.addEventListener("pagehide", dispose, { once: true });
import.meta.hot?.dispose(dispose);
