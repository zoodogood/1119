import packageJson from "#root/package.json" with { type: "json" };
export async function readPackageJson() {
	return packageJson;
}
