import config from "#config";

export async function fetchFromInnerApi(
	subpath,
	{ parseType = "json", ...fetchOptions } = {},
) {
	return (
		await fetch(config.server.origin.concat(`/${subpath}`), fetchOptions)
	)[parseType]();
}
