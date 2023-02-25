import { BaseRoute } from "#server/router.js";
import { ImportDirectory } from '@zoodogood/import-directory';
import Path from 'path';

const PREFIX = "/site/articles";


class Route extends BaseRoute {
	prefix = PREFIX;

	constructor(express){
		super();
	}

	async get(request, response){
		const DIRECTORY = "static/articles";
		const filesPaths = await new ImportDirectory({regex: /\.md$/}).takeFilesPath({path: DIRECTORY});

		const articles = filesPaths
			.map(path => Path.relative(DIRECTORY, path));

		response.json(articles);
	}

}

export default Route;