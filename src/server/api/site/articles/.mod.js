import { MarkdownMetadata } from '#lib/util.js';
import { ImportDirectory } from '@zoodogood/import-directory';
import FileSystem from 'fs/promises';
import Path from 'path';


const DIRECTORY = "static/articles";
		

class ArticlesManager {
	static directory = DIRECTORY;

	static async fetchArticles(){
		const filesPaths = await new ImportDirectory({regex: /\.md$/}).takeFilesPath({path: DIRECTORY, subfolders: true});

		const articles = filesPaths
			.map(path => Path.relative(DIRECTORY, path).replaceAll("\\", "/"));

		return articles;
	}

	static async getArticleContent(id){
		const path = id.replace(/\.md$/, "");
		const full = Path.resolve(this.directory, `${ path }.md`);
		try {
			const content = String(await FileSystem.readFile(full));
			return content;
		}
		catch (error){
			if (error.code !== "ENOENT"){
				throw error;
			}

			return null;
		}
	}

	static async createArticle({id, author, content}){
		const path = id.replace(/\.md$/, "");
		const full = Path.resolve(this.directory, `${ path }.md`);

		
		await FileSystem.mkdir(Path.resolve(full, "../"), { recursive: true });
		const metadata = MarkdownMetadata.parse(content) ?? {};
		Object.assign(metadata, {author, timestamp: Date.now()});

		content = MarkdownMetadata.replace(content, metadata);

		await FileSystem.mkdir(Path.resolve(full, "../"), { recursive: true });
		await FileSystem.writeFile(full, content);
		return metadata;
	}
}


export { ArticlesManager };