import { BaseRoute } from "#src/http_requests/api_router/BaseRoute.js";
import FileSystem from "node:fs/promises";
import path from "node:path";

const PREFIX = /\/public+?/;
const public_dir = path.resolve(process.cwd(), "src/public");

export default class Route extends BaseRoute {
	prefix = PREFIX;

	constructor() {
		super();
	}

	async get(request, response) {
		try {
			let current_path = request.path.replace(/^\/public\//, "./");
			const like_html = `${current_path}.html`;
			if (await fileExists(path.resolve(public_dir, like_html))) {
				current_path = like_html;
			}

			const has_index_html = `${current_path}/index.html`;
			if (await fileExists(path.resolve(public_dir, has_index_html))) {
				current_path = has_index_html;
			}
			const stat = await FileSystem.stat(
				path.resolve(public_dir, current_path),
			).catch(() => null);

			if (!stat) {
				return response
					.status(404)
					.redirect(
						`/public/special/i-love-404?from=${encodeURIComponent(request.path)}`,
					);
			}

			if (stat.isDirectory()) {
				return response.redirect(
					`/public/special/you-go-to-folder?from=${encodeURIComponent(request.url)}`,
				);
			}

			return response.sendFile(path.resolve(public_dir, current_path));
		} catch (error) {
			const queries = new URLSearchParams({
				from: request.url,
				error: error.message,
			}).toString();
			response.redirect(`/pages/display-error?${queries}`);
		}

		async function fileExists(filePath) {
			try {
				await FileSystem.access(filePath, FileSystem.constants.F_OK);
				return true;
			} catch (error) {
				if (!["ENOENT", "ENOTDIR"].includes(error.code)) {
					throw error;
				}
				return false;
			}
		}
	}
}
