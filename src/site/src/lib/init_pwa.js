export async function init_pwa_worker() {
  await navigator.serviceWorker.register("/pwa_worker_up");
}
