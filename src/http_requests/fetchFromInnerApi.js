import config from "#config";
import { path } from "#src/url/export.js";

export async function fetchFromInnerApi(
	subpath,
	{ parseType = "json", ...fetchOptions } = {},
) {
	const location = config.server.origin.concat(`/${path.normalize(subpath)}`);

	const response = await fetch(location, fetchOptions);
	return response[parseType]();
}
