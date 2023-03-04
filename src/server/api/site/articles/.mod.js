import { ImportDirectory } from '@zoodogood/import-directory';
import Path from 'path';


const DIRECTORY = "static/articles";
		

class ArticlesManager {
	static async fetchArticles(){
		const filesPaths = await new ImportDirectory({regex: /\.md$/}).takeFilesPath({path: DIRECTORY});

		const articles = filesPaths
			.map(path => Path.relative(DIRECTORY, path));

		return articles;
	}

	static async getArticleContent(id){
		const path = id.replace(/\.md$/, "");
		const full = Path.resolve(this.directory, `${ path }.md`);
		try {
			const content = String(await FileSystem.readFile(full));
			response.json( content );
		}
		catch (error){
			if (error.code !== "ENOENT"){
				throw error;
			}

			return null;
		}
	}
}


export { ArticlesManager };