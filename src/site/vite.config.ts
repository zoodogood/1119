import { readPackageJson } from "#src/nodejs/readPackageJson.js";
import { path } from "#src/url/export.js";
import { svelte, vitePreprocess } from "@sveltejs/vite-plugin-svelte";
import { execSync } from "node:child_process";
import { defineConfig } from "vite";
const packageJSON = await readPackageJson();
execSync("pnpm run createPagesExports");

function resolve(specifier: string) {
	const { imports } = packageJSON;
	const [maybe, ...rest] = specifier.split("/");
	const replacment = Object.entries(imports).find(([key, value]) =>
		key.startsWith(maybe),
	)?.[1] as string | undefined;
	if (replacment) {
		specifier = replacment.replace("*", rest.join("/"));
	}
	const root = path.resolve(__dirname, "..", "..");
	return path.resolve(root, specifier);
}

export default defineConfig({
	plugins: [
		svelte({
			preprocess: vitePreprocess(),
		}),
	],
	cacheDir: "cache/.vite",
	// root: "../..",
	build: {
		lib: {
			entry: [resolve("#src/site/src/core/index.js")],
			name: "bundle",
			fileName: "bundle",
			formats: ["iife"],
		},
		rollupOptions: {
			plugins: [
				(await import("rollup-plugin-polyfill-node")).default(),
				(await import("@rollup/plugin-replace")).default({
					include: [resolve("#src/site/src/enviroment/mod.js")],
					preventAssignment: true,
					values: (await import(resolve("#site/enviroment/values.js"))).default,
				}),
			],
		},
		outDir: "./src/public/build/svelte-bundle",
		sourcemap: true,
	},
});
