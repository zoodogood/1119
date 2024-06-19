import { ReadPackageJson } from "#lib/util.js";

const { version } = await ReadPackageJson();
export { version };
