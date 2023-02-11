/**
* Input: none
* Output behavior: build a working exports[builded].js file with list of commands
*/

const FOLDER_NAME = "./src/pages"; // Folder with commands list relative process cwd()

const TARGET_PATH = "./exports[builded].mjs"; // Generate file with this name




/** Get's path */
import Path from 'path';
import { fileURLToPath } from 'url';

const root = Path.resolve(
	Path.dirname(fileURLToPath( import.meta.url )),
	"../"
);
const takePath = (...relativePath) => Path.resolve(root, ...relativePath);



/** Get's file names list */
import { ImportDirectory } from '@zoodogood/import-directory';

const importDirectory = new ImportDirectory({regex: /^\+(?:.+?)\.svelte$/});
const filesPath = (await importDirectory
	.takeFilesPath({path: takePath(FOLDER_NAME), subfolders: true}))
	.filter((path) => importDirectory.regex.test(Path.basename( path )));

console.info( `Count: ${ filesPath.length } of files` );



/** Generate content */

const getImportName = (filePath) => {
	const directory = takePath(FOLDER_NAME);

	const file = Path
		.relative(directory, filePath)
		.replaceAll(/\\|\//g, "_")
		.replaceAll("+", "")
		.replaceAll(/\..+$/g, "")
		.trim();

	return file;
};

const getStringByPattern = (filePath) => {
	const path = Path.relative(takePath(FOLDER_NAME), filePath);
	const normalizePath = (path) => `./${ path.replaceAll(Path.win32.sep, Path.posix.sep) }`;
	const name = getImportName(filePath);
	return `export {default as ${ name }} from '${ normalizePath(path) }';`;
}

const content = filesPath
	.map(getStringByPattern)
	.join("\n");



/** Generate file */
const buffer = content;
import FileSystem from 'fs/promises';

await FileSystem.writeFile(takePath(FOLDER_NAME, TARGET_PATH), buffer);


