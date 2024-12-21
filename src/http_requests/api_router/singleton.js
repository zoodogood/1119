import RouterManager from "./RouterManager.js";

const api_router = new RouterManager();
await api_router.fetch();
export { api_router };
