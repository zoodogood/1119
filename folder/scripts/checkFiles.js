import { execSync } from "child_process";
import FileSystem from "fs/promises";
import Path from "path";

const root = process.cwd();
const resolve = (path) => Path.resolve(root, path);
const isWindowsBased = process.platform === "win32";

const FileExists = async (path) =>
  !!(await FileSystem.stat(resolve(path)).catch(() => null));

const Paths = {
  env: ".env",
  envExample: "folder/development/.env.example",
  config: "src/config.json.js",
  configExample: "folder/development/config.json.js.example",

  firstBuildDocs: "static/special/first-build.html",
};

!(await FileExists(Paths.env)) &&
  (await (async () => {
    const command = isWindowsBased ? `start ""` : "open";

    execSync(`${command} "file://${resolve(Paths.firstBuildDocs)}"`);
    const source = resolve(Paths.envExample);
    const target = resolve(Paths.env);
    await FileSystem.copyFile(source, target);
    console.info(`CREATED: ${Paths.env}`);
  })());

!(await FileExists(Paths.config)) &&
  (await (async () => {
    const source = resolve(Paths.configExample);
    const target = resolve(Paths.config);
    await FileSystem.copyFile(source, target);
    console.info(`CREATED: ${Paths.config}`);
  })());

console.info("Next.\n");
