/**
* Input: none
* Output behavior: build a working exports[builded].js file with list of commands
*/

const FOLDER_NAME = "./src/site/src/pages"; // Folder with commands list relative process cwd()

const TARGET_PATH = "./static/build/svelte-pages/exports[builded].mjs"; // Svelte exports content

const ENUM_TARGET_PATH = "./static/build/svelte-pages/enum[builded].mjs"; // ESJS content




/** Get's path */
import Path from 'path';

const root = process.cwd();
const takePath = (...relativePath) => Path.resolve(root, ...relativePath);



/** Get's file names list */
import { ImportDirectory } from '@zoodogood/import-directory';

const importDirectory = new ImportDirectory({regex: /^\+(?:.+?)\.svelte$/});
const filesPath = (await importDirectory
	.takeFilesPath({path: takePath(FOLDER_NAME), subfolders: true}))
	.filter((path) => importDirectory.regex.test(Path.basename( path )));

console.info( `Count: ${ filesPath.length } of files` );


/** Parse files */
const resolveName = (filePath) => {
	const directory = takePath(FOLDER_NAME);

	const file = Path
		.relative(directory, filePath)
		.replaceAll(/\\|\//g, "_")
		.replaceAll("+", "")
		.replaceAll(/\..+$/g, "")
		.trim();

	return file;
};
const resolveModule = (filePath) => {
	const path = Path.relative(".", filePath);
	const normalizePath = (path) => path.replaceAll(Path.win32.sep, Path.posix.sep);
	const name = resolveName(filePath);
	return {filePath, name, normalizedPath: normalizePath(path)};
};
const modules = filesPath
	.map(resolveModule);





/** First file */
import FileSystem from 'fs/promises';
(async () => {
	/** Generate content */
	const getStringByPattern = ({normalizedPath, name}) => {
		const path = `#${ normalizedPath }`;
		return `export {default as ${ name }} from '${ path }';`;
	}
	
	const content = modules
		.map(getStringByPattern)
		.join("\n");
	
	/** Generate file */
	const buffer = content;
	await FileSystem.writeFile(takePath(".", TARGET_PATH), buffer);
})();




/** Second File */
(async () => {
	/** Generate content */

	const entries = modules
		.map(({normalizedPath, name}) => [name, normalizedPath]);

	const json = JSON.stringify(
		Object.fromEntries(entries), null, 2
	);
	
	const content = `export default ${ json }`;
		
	
	
	
	/** Generate file */
	const buffer = content;
	await FileSystem.writeFile(takePath(".", ENUM_TARGET_PATH), buffer);
})();