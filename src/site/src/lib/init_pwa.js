import { createElement } from "#site/lib/dom_utils.js";

export async function init_pwa_worker() {
  const unique = "init_pwa_worker__active_pwa_manifest";
  if (document.getElementById(unique)) {
    return;
  }
  const manifestNode = createElement("link", {
    rel: "manifest",
    href: "manifest.json",
    id: unique,
  });
  document.head.appendChild(manifestNode);
}
