/**
 * Input: none
 * Output behavior: build a working exports[builded].js file with list of pages
 */

import { cwd_path } from "#src/nodejs/path_relative_to_root.js";
import { glob } from "glob";
import FileSystem from "node:fs/promises";
import { default as Path } from "node:path";

export function pathToPageKey(path) {
	path = path.replace(/\.page\.svelte$/, "")
		.replaceAll(/[\/\\\.]/g, "_")
		.toLowerCase()
		.trim();
	if (path.endsWith("_index")) {
		path = path.slice(0, -6);
	}
	return path;
}

const targetFiles = (await glob("**/*.page.svelte", { absolute: true }))
	.map((filePath) => {
		const relative = Path.relative(`${process.cwd()}/src`, filePath);
		return {
			filePath,
			name: pathToPageKey(relative),
			source: relative.replaceAll(
				Path.win32.sep,
				Path.posix.sep,
			),
		};
	}
);
console.info(`Cound of files: ${targetFiles.length}`);
await FileSystem.mkdir("./src/public/build/svelte-pages", {
	recursive: true,
});
// MARK: First file
{
	const TARGET_PATH = "./src/public/build/svelte-pages/exports[builded].mjs"; // Svelte exports content
	await FileSystem.writeFile(
		cwd_path(".", TARGET_PATH),
		targetFiles
			.map(({ source, name }) => {
				const path = `#src/${source}`;
				return `export {default as ${name}} from '${path}';`;
			})
			.join("\n"),
	);
	console.info(cwd_path(".", TARGET_PATH));
}

// MARK: Second File
{
	const ENUM_TARGET_PATH = "./src/public/build/svelte-pages/enum[builded].mjs"; // ESJS content
	await FileSystem.writeFile(
		cwd_path(".", ENUM_TARGET_PATH),
		`export default ${JSON.stringify(
			targetFiles.map(({ name }) => name),
			null,
			2,
		)}`,
	);
	console.info(cwd_path(".", ENUM_TARGET_PATH));
}
