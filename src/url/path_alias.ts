import { assert } from "#src/assert/export.js";
import { readPackageJson } from "#src/nodejs/readPackageJson.js";

const aliases = Object.fromEntries(
	Object.entries((await readPackageJson()).imports).map(
		([prefix, location]) => [
			prefix.replace("/*", ""),
			location.replace(/^\./, process.cwd()),
		],
	),
);

export function path_alias(target: string) {
	const prefix = target.match(/^#[^/]+/)?.[0];
	if (!prefix) {
		return target;
	}
	const alias = aliases[prefix];
	assert(alias, `alias ${prefix} not found`);
	return alias.replace("*", target.replace(`${prefix}/`, ""));
}
