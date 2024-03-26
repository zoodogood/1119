/**
 * Input: none
 * Output behavior: build a working exports[builded].js file with list of commands
 */

const FOLDER_NAME = "./src/site/src/pages"; // Folder with commands list relative process cwd()

const TARGET_PATH = "./static/build/svelte-pages/exports[builded].mjs"; // Svelte exports content

const ENUM_TARGET_PATH = "./static/build/svelte-pages/enum[builded].mjs"; // ESJS content

/** Get's path */
import Path from "path";

import { takePath } from "#src/app/utils.js";

/** Get's file names list */
import { ImportDirectory } from "@zoodogood/import-directory";

const importDirectory = new ImportDirectory({ regex: /^\+(?:.+?)\.svelte$/ });
const filesPath = (
  await importDirectory.takeFilesPath({
    path: takePath(FOLDER_NAME),
    subfolders: true,
  })
).filter((path) => importDirectory.regex.test(Path.basename(path)));

console.info(`Count: ${filesPath.length} of files`);

const resolveModule = (filePath) => {
  const normalizePath = (path) =>
    path.replaceAll(Path.win32.sep, Path.posix.sep);
  const source = normalizePath(Path.relative(".", filePath));

  const name = PagesRouter.resolvePageName(filePath).replaceAll("/", "_");
  return { filePath, name, source };
};
const modules = filesPath.map(resolveModule);

/** First file */
import FileSystem from "fs/promises";
import PagesRouter from "#site/lib/Router.js";
(async () => {
  /** Generate content */
  const getStringByPattern = ({ source, name }) => {
    const path = `#${source}`;
    return `export {default as ${name}} from '${path}';`;
  };

  const content = modules.map(getStringByPattern).join("\n");

  /** Generate file */
  const buffer = content;
  await FileSystem.writeFile(takePath(".", TARGET_PATH), buffer);
})();

/** Second File */
(async () => {
  /** Generate content */

  const array = modules.map(({ source }) => source);

  const json = JSON.stringify(array, null, 2);

  const content = `export default ${json}`;

  /** Generate file */
  const buffer = content;
  await FileSystem.writeFile(takePath(".", ENUM_TARGET_PATH), buffer);
})();
