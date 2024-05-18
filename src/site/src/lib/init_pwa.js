import { createElement } from "#site/lib/dom_utils.js";

export async function init_pwa_worker() {
  const manifestNode = createElement("link", {
    rel: "manifest",
    href: "manifest.json",
  });
  document.head.appendChild(manifestNode);
  await navigator.serviceWorker.register("/pwa_worker_up");
}
