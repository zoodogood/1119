export async function readPackageJson() {
	const { default: FileSystem } = await import("node:fs/promises");
	const value = await FileSystem.readFile(`${process.cwd()}/package.json`);

	return JSON.parse(value);
}
